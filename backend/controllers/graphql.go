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
)

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
	dbService *models.DatabaseService
}

func NewGraphQLController(dbService *models.DatabaseService) *GraphQLController {
	return &GraphQLController{dbService: dbService}
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
	token := parts[1]
	if !strings.HasPrefix(token, "session-") {
		return nil, errors.New("unauthorized: invalid token")
	}
	tokenParts := strings.Split(token, "-")
	if len(tokenParts) < 3 {
		return nil, errors.New("unauthorized: invalid token structure")
	}
	userId := tokenParts[1]
	
	// Fetch user from DB using the parsed userId
	user, err := g.dbService.Client.TeamMember.FindUnique(
		db.TeamMember.ID.Equals(userId),
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

	// 1. MUTATION: Login (Public Endpoint)
	if strings.Contains(queryClean, "login") {
		email, ok1 := vars["email"].(string)
		password, ok2 := vars["password"].(string)
		if !ok1 || !ok2 {
			return nil, errors.New("missing variables: email or password")
		}

		user, err := g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.Email.Equals(email),
		).Exec(ctx)
		if err != nil {
			return nil, errors.New("invalid email or password")
		}

		if user.PasswordHash != models.HashPassword(password) {
			return nil, errors.New("invalid email or password")
		}

		// Generate mock session token: session-<userId>-<dummy>
		token := fmt.Sprintf("session-%s-123456789", user.ID)

		return map[string]interface{}{
			"login": map[string]interface{}{
				"token": token,
				"user":  user,
			},
		}, nil
	}

	// QUERIES (Public Access)
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

	// MUTATIONS (Protected Access)
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

		// Create a claim event under the authenticated user
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

		// Award tokens for claim
		multiplier := 1.0
		if status == "WEEKEND_WORK" || status == "HOLIDAY_WORK" {
			_, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(authUser.ID),
			).Update(
				db.TeamMember.TokensBalance.Increment(multiplier),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}
		}

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

		// Check token balance
		if authUser.TokensBalance < 1.0 {
			return nil, errors.New("insufficient tokens")
		}

		// Create a leave request under the authenticated user
		event, err := g.dbService.Client.CalendarEvent.CreateOne(
			db.CalendarEvent.UserID.Set(authUser.ID),
			db.CalendarEvent.UserName.Set(authUser.Name),
			db.CalendarEvent.Date.Set(date),
			db.CalendarEvent.Status.Set("COMPENSATORY_OFF"),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Deduct token from authenticated user
		_, err = g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(authUser.ID),
		).Update(
			db.TeamMember.TokensBalance.Decrement(1.0),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

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

		// Fetch the event to check authorization
		event, err := g.dbService.Client.CalendarEvent.FindUnique(
			db.CalendarEvent.ID.Equals(id),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Authorization Check: Admin can cancel any leave, Member can only cancel their own leaves
		if authUser.Role != "ADMIN" && event.UserID != authUser.ID {
			return nil, errors.New("forbidden: you cannot cancel another member's leaves")
		}

		// Delete the event
		_, err = g.dbService.Client.CalendarEvent.FindUnique(
			db.CalendarEvent.ID.Equals(id),
		).Delete().Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Refund token if it was a leave
		if event.Status == "COMPENSATORY_OFF" || event.Status == "NORMAL" {
			_, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(event.UserID),
			).Update(
				db.TeamMember.TokensBalance.Increment(1.0),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}
		}

		return map[string]interface{}{"cancelLeave": true}, nil
	}

	if strings.Contains(queryClean, "updateMaxOffAllowed") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		// Role Check: Only Admin can update global capacity settings
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
			// If not exists, create it
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

	return nil, fmt.Errorf("unsupported GraphQL query: %s", queryClean)
}
