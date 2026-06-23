package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"backend/models"
	"backend/db"
	"backend/services"
)

// getLeaveTokenCost returns 1.0 tokens for all days.
func getLeaveTokenCost(dateStr string) float64 {
	return 1.0
}

type contextKey string
const userContextKey contextKey = "user"

// GraphQLRequest represents the standard body structure of a GraphQL post request
type GraphQLRequest struct {
	Query         string                 `json:"query"`
	Variables     map[string]interface{} `json:"variables"`
	OperationName string                 `json:"operationName"`
}

// GraphQLResponse represents the response structure
type GraphQLResponse struct {
	Data   interface{} `json:"data,omitempty"`
	Errors []GQLError  `json:"errors,omitempty"`
}

type GQLError struct {
	Message string `json:"message"`
}

type GraphQLController struct {
	dbService   *models.DatabaseService
	authService services.IAuthService
}

func NewGraphQLController(dbService *models.DatabaseService, authService services.IAuthService) *GraphQLController {
	return &GraphQLController{
		dbService:   dbService,
		authService: authService,
	}
}

// getAuthenticatedUser extracts and parses the Authorization token from headers (Clean Architecture pattern)
func (g *GraphQLController) getAuthenticatedUser(r *http.Request) (*db.TeamMemberModel, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, errors.New("unauthorized: missing token")
	}
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, errors.New("unauthorized: invalid token format")
	}
	tokenStr := parts[1]

	// Validate JWT token using AuthService
	claims, err := g.authService.ValidateToken(tokenStr)
	if err != nil {
		return nil, fmt.Errorf("unauthorized: invalid token: %w", err)
	}

	// Fetch user from DB using the parsed claims.UserID
	user, err := g.dbService.Client.TeamMember.FindUnique(
		db.TeamMember.ID.Equals(claims.UserID),
	).Exec(r.Context())
	if err != nil {
		return nil, fmt.Errorf("unauthorized: user not found: %w", err)
	}
	return user, nil
}

func (g *GraphQLController) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req GraphQLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var response GraphQLResponse
	ctx := context.Background()

	// Parse authentication context
	authUser, err := g.getAuthenticatedUser(r)
	if err == nil {
		ctx = context.WithValue(ctx, userContextKey, authUser)
	}

	data, err := g.resolve(ctx, req.Query, req.Variables)
	if err != nil {
		response.Errors = []GQLError{{Message: err.Error()}}
	} else {
		response.Data = data
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// resolve acts as the main routing/resolver layer for GraphQL operations (OOP Resolver pattern)
func (g *GraphQLController) resolve(ctx context.Context, query string, vars map[string]interface{}) (interface{}, error) {
	queryClean := strings.TrimSpace(query)

	// HELPER: Require Authentication Context
	getAuthUser := func() (*db.TeamMemberModel, error) {
		val := ctx.Value(userContextKey)
		if val == nil {
			return nil, errors.New("unauthorized: you must be logged in to perform this action")
		}
		user, ok := val.(*db.TeamMemberModel)
		if !ok {
			return nil, errors.New("unauthorized: invalid user context")
		}
		return user, nil
	}

	// ─── PUBLIC QUERIES ────────────────────────────────────────────────────────

	if strings.Contains(queryClean, "getTeamMembers") {
		members, err := g.dbService.Client.TeamMember.FindMany().Exec(ctx)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{"getTeamMembers": members}, nil
	}

	if strings.Contains(queryClean, "getEvents") {
		events, err := g.dbService.Client.CalendarEvent.FindMany().Exec(ctx)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{"getEvents": events}, nil
	}

	if strings.Contains(queryClean, "getCapacitySettings") {
		settings, err := g.dbService.Client.CapacitySetting.FindMany().Exec(ctx)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{"getCapacitySettings": settings}, nil
	}

	// ─── AUTHENTICATED QUERIES ─────────────────────────────────────────────────

	if strings.Contains(queryClean, "getTokenTransactions") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}
		txns, err := g.dbService.Client.TokenTransaction.FindMany(
			db.TokenTransaction.UserID.Equals(authUser.ID),
		).OrderBy(
			db.TokenTransaction.CreatedAt.Order(db.DESC),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{"getTokenTransactions": txns}, nil
	}

	// ─── MUTATIONS (Protected) ─────────────────────────────────────────────────

	if strings.Contains(queryClean, "claimShift") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		date, ok1 := vars["date"].(string)
		status, ok2 := vars["status"].(string)
		details, _ := vars["details"].(string)
		if !ok1 || !ok2 {
			return nil, errors.New("missing variables: date or status")
		}

		// Only WEEKEND_WORK and HOLIDAY_WORK earn tokens
		if status != "WEEKEND_WORK" && status != "HOLIDAY_WORK" {
			return nil, errors.New("claimShift only supports WEEKEND_WORK or HOLIDAY_WORK")
		}

		// Create calendar event
		event, err := g.dbService.Client.CalendarEvent.CreateOne(
			db.CalendarEvent.UserID.Set(authUser.ID),
			db.CalendarEvent.UserName.Set(authUser.Name),
			db.CalendarEvent.Date.Set(date),
			db.CalendarEvent.Status.Set(status),
			db.CalendarEvent.Details.Set(details),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Award 1 token
		_, err = g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(authUser.ID),
		).Update(
			db.TeamMember.TokensBalance.Increment(1.0),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Record token transaction
		label := "Weekend Coverage"
		if status == "HOLIDAY_WORK" {
			label = "Holiday Coverage"
		}
		_, _ = g.dbService.Client.TokenTransaction.CreateOne(
			db.TokenTransaction.UserID.Set(authUser.ID),
			db.TokenTransaction.Type.Set("EARN"),
			db.TokenTransaction.Amount.Set(1.0),
			db.TokenTransaction.Description.Set(label),
			db.TokenTransaction.RelatedDate.Set(date),
		).Exec(ctx)

		return map[string]interface{}{"claimShift": event}, nil
	}

	if strings.Contains(queryClean, "requestLeave") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		date, ok := vars["date"].(string)
		if !ok {
			return nil, errors.New("missing variables: date")
		}

		// Re-fetch user for latest balance
		freshUser, err := g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(authUser.ID),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		tokensNeeded := getLeaveTokenCost(date)
		if freshUser.TokensBalance < tokensNeeded {
			return nil, fmt.Errorf("insufficient tokens: you need at least %.1f tokens to request leave on this day", tokensNeeded)
		}

		// Create leave event
		event, err := g.dbService.Client.CalendarEvent.CreateOne(
			db.CalendarEvent.UserID.Set(authUser.ID),
			db.CalendarEvent.UserName.Set(authUser.Name),
			db.CalendarEvent.Date.Set(date),
			db.CalendarEvent.Status.Set("COMPENSATORY_OFF"),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Deduct tokens
		_, err = g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(authUser.ID),
		).Update(
			db.TeamMember.TokensBalance.Decrement(tokensNeeded),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Record token transaction
		_, _ = g.dbService.Client.TokenTransaction.CreateOne(
			db.TokenTransaction.UserID.Set(authUser.ID),
			db.TokenTransaction.Type.Set("SPEND"),
			db.TokenTransaction.Amount.Set(tokensNeeded),
			db.TokenTransaction.Description.Set("Compensatory Leave Request"),
			db.TokenTransaction.RelatedDate.Set(date),
		).Exec(ctx)

		return map[string]interface{}{"requestLeave": event}, nil
	}

	if strings.Contains(queryClean, "cancelLeave") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		id, ok := vars["id"].(string)
		if !ok {
			return nil, errors.New("missing variables: id")
		}

		// Fetch event to verify ownership
		event, err := g.dbService.Client.CalendarEvent.FindUnique(
			db.CalendarEvent.ID.Equals(id),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Authorization: Admin can cancel any leave, Member only their own
		if authUser.Role != "ADMIN" && event.UserID != authUser.ID {
			return nil, errors.New("forbidden: you cannot cancel another member's leave")
		}

		// Delete the event
		_, err = g.dbService.Client.CalendarEvent.FindUnique(
			db.CalendarEvent.ID.Equals(id),
		).Delete().Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Refund tokens if it was a leave (COMPENSATORY_OFF or NORMAL)
		isLeave := event.Status == "COMPENSATORY_OFF" || event.Status == "NORMAL"
		if isLeave {
			tokensRefunded := getLeaveTokenCost(event.Date)
			_, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(event.UserID),
			).Update(
				db.TeamMember.TokensBalance.Increment(tokensRefunded),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}

			// Record refund transaction
			_, _ = g.dbService.Client.TokenTransaction.CreateOne(
				db.TokenTransaction.UserID.Set(event.UserID),
				db.TokenTransaction.Type.Set("EARN"),
				db.TokenTransaction.Amount.Set(tokensRefunded),
				db.TokenTransaction.Description.Set("Leave Cancellation Refund"),
				db.TokenTransaction.RelatedDate.Set(event.Date),
			).Exec(ctx)
		}

		return map[string]interface{}{"cancelLeave": true}, nil
	}

	if strings.Contains(queryClean, "redeemTokens") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		amount, ok := vars["amount"].(float64)
		description, _ := vars["description"].(string)
		if !ok {
			return nil, errors.New("missing variables: amount")
		}
		if description == "" {
			description = "Token Rollover/Payout Request"
		}

		// Re-fetch user for latest balance
		freshUser, err := g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(authUser.ID),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}
		if freshUser.TokensBalance < amount {
			return nil, fmt.Errorf("insufficient tokens: you need at least %.1f tokens to redeem", amount)
		}

		// Deduct tokens
		_, err = g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(authUser.ID),
		).Update(
			db.TeamMember.TokensBalance.Decrement(amount),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Record token transaction
		txn, err := g.dbService.Client.TokenTransaction.CreateOne(
			db.TokenTransaction.UserID.Set(authUser.ID),
			db.TokenTransaction.Type.Set("SPEND"),
			db.TokenTransaction.Amount.Set(amount),
			db.TokenTransaction.Description.Set(description),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		return map[string]interface{}{"redeemTokens": txn}, nil
	}

	if strings.Contains(queryClean, "updateMaxOffAllowed") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		if authUser.Role != "ADMIN" {
			return nil, errors.New("forbidden: only administrators can modify capacity settings")
		}

		maxOff, ok := vars["maxOffAllowed"].(float64)
		if !ok {
			return nil, errors.New("missing variables: maxOffAllowed")
		}

		setting, err := g.dbService.Client.CapacitySetting.FindUnique(
			db.CapacitySetting.ID.Equals("global-default"),
		).Update(
			db.CapacitySetting.MaxOffAllowed.Set(int(maxOff)),
		).Exec(ctx)
		if err != nil {
			// Create if not exists
			setting, err = g.dbService.Client.CapacitySetting.CreateOne(
				db.CapacitySetting.MaxOffAllowed.Set(int(maxOff)),
				db.CapacitySetting.ID.Set("global-default"),
				db.CapacitySetting.Description.Set("Global default limit"),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}
		}

		return map[string]interface{}{"updateMaxOffAllowed": setting}, nil
	}

	return nil, fmt.Errorf("unsupported GraphQL operation")
}
