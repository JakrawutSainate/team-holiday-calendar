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
func getLeaveTokenCost(_ string) float64 {
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
		events, err := g.dbService.Client.CalendarEvent.FindMany().With(
			db.CalendarEvent.LeaveRequest.Fetch(),
		).Exec(ctx)
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

	if strings.Contains(queryClean, "getAuditLogs") {
		_, err := getAuthUser()
		if err != nil {
			return nil, err
		}
		logs, err := g.dbService.Client.AuditLog.FindMany().OrderBy(
			db.AuditLog.CreatedAt.Order(db.DESC),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{"getAuditLogs": logs}, nil
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

		reason, _ := vars["reason"].(string)
		signatureType, _ := vars["signatureType"].(string)
		signatureText, _ := vars["signatureText"].(string)
		signatureImage, _ := vars["signatureImage"].(string)
		attachmentImage, _ := vars["attachmentImage"].(string)

		if signatureType == "" {
			signatureType = "TEXT"
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

		// Create LeaveRequest details
		_, err = g.dbService.Client.LeaveRequest.CreateOne(
			db.LeaveRequest.SignatureType.Set(signatureType),
			db.LeaveRequest.Event.Link(
				db.CalendarEvent.ID.Equals(event.ID),
			),
			db.LeaveRequest.Reason.Set(reason),
			db.LeaveRequest.SignatureText.Set(signatureText),
			db.LeaveRequest.SignatureImage.Set(signatureImage),
			db.LeaveRequest.AttachmentImage.Set(attachmentImage),
		).Exec(ctx)
		if err != nil {
			// Rollback event if request creation fails
			_, _ = g.dbService.Client.CalendarEvent.FindUnique(db.CalendarEvent.ID.Equals(event.ID)).Delete().Exec(ctx)
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

		// Fetch event again to return with LeaveRequest relation
		eventWithRelation, err := g.dbService.Client.CalendarEvent.FindUnique(
			db.CalendarEvent.ID.Equals(event.ID),
		).With(
			db.CalendarEvent.LeaveRequest.Fetch(),
		).Exec(ctx)
		if err == nil {
			return map[string]interface{}{"requestLeave": eventWithRelation}, nil
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

	if strings.Contains(queryClean, "adminAddTokens") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}
		if authUser.Role != "ADMIN" {
			return nil, errors.New("forbidden: only administrators can add tokens to users")
		}

		targetUserID, ok1 := vars["userId"].(string)
		amount, ok2 := vars["amount"].(float64)
		description, _ := vars["description"].(string)

		if !ok1 || !ok2 {
			return nil, errors.New("missing variables: userId or amount")
		}
		if description == "" {
			description = "Admin manual token credit"
		}

		// Award tokens to target user
		targetUser, err := g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(targetUserID),
		).Update(
			db.TeamMember.TokensBalance.Increment(amount),
		).Exec(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to update user tokens: %w", err)
		}

		// Record token transaction
		_, _ = g.dbService.Client.TokenTransaction.CreateOne(
			db.TokenTransaction.UserID.Set(targetUserID),
			db.TokenTransaction.Type.Set("EARN"),
			db.TokenTransaction.Amount.Set(amount),
			db.TokenTransaction.Description.Set(description),
		).Exec(ctx)

		return map[string]interface{}{"adminAddTokens": targetUser}, nil
	}

	if strings.Contains(queryClean, "adminBulkClaimTokens") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}
		if authUser.Role != "ADMIN" {
			return nil, errors.New("forbidden: only administrators can bulk-claim tokens")
		}

		targetUserID, ok := vars["userId"].(string)
		if !ok || targetUserID == "" {
			return nil, errors.New("missing variable: userId")
		}

		// Fetch target user name
		targetUser, err := g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(targetUserID),
		).Exec(ctx)
		if err != nil {
			return nil, fmt.Errorf("user not found: %w", err)
		}

		entriesRaw, ok := vars["entries"].([]interface{})
		if !ok {
			return nil, errors.New("missing variable: entries")
		}

		// Fetch existing events for this user to detect duplicates
		existing, _ := g.dbService.Client.CalendarEvent.FindMany(
			db.CalendarEvent.UserID.Equals(targetUserID),
		).Exec(ctx)
		existingDates := map[string]bool{}
		for _, ev := range existing {
			if ev.Status == "WEEKEND_WORK" || ev.Status == "HOLIDAY_WORK" {
				existingDates[ev.Date] = true
			}
		}

		claimed := 0
		skipped := 0
		for _, raw := range entriesRaw {
			entry, ok := raw.(map[string]interface{})
			if !ok {
				continue
			}
			date, _ := entry["date"].(string)
			status, _ := entry["status"].(string)
			details, _ := entry["details"].(string)

			if date == "" || (status != "WEEKEND_WORK" && status != "HOLIDAY_WORK") {
				continue
			}
			// Skip duplicate
			if existingDates[date] {
				skipped++
				continue
			}

			// Create calendar event
			_, err := g.dbService.Client.CalendarEvent.CreateOne(
				db.CalendarEvent.UserID.Set(targetUserID),
				db.CalendarEvent.UserName.Set(targetUser.Name),
				db.CalendarEvent.Date.Set(date),
				db.CalendarEvent.Status.Set(status),
				db.CalendarEvent.Details.Set(details),
			).Exec(ctx)
			if err != nil {
				continue
			}

			// Award 1 token
			_, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(targetUserID),
			).Update(
				db.TeamMember.TokensBalance.Increment(1.0),
			).Exec(ctx)
			if err != nil {
				continue
			}

			label := "Weekend Coverage (Bulk)"
			if status == "HOLIDAY_WORK" {
				label = "Holiday Coverage (Bulk)"
			}
			_, _ = g.dbService.Client.TokenTransaction.CreateOne(
				db.TokenTransaction.UserID.Set(targetUserID),
				db.TokenTransaction.Type.Set("EARN"),
				db.TokenTransaction.Amount.Set(1.0),
				db.TokenTransaction.Description.Set(label),
				db.TokenTransaction.RelatedDate.Set(date),
			).Exec(ctx)

			existingDates[date] = true
			claimed++
		}

		return map[string]interface{}{"adminBulkClaimTokens": map[string]interface{}{
			"claimed": claimed,
			"skipped": skipped,
		}}, nil
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

	if strings.Contains(queryClean, "updateTeamMemberProfile") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		targetUserID, ok1 := vars["id"].(string)
		name, ok2 := vars["name"].(string)
		department, ok3 := vars["department"].(string)
		title, ok4 := vars["title"].(string)

		if !ok1 || !ok2 || !ok3 || !ok4 {
			return nil, errors.New("missing variables: id, name, department, or title")
		}

		if authUser.Role != "ADMIN" && authUser.ID != targetUserID {
			return nil, errors.New("unauthorized: you can only update your own profile")
		}

		updatedUser, err := g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals(targetUserID),
		).Update(
			db.TeamMember.Name.Set(name),
			db.TeamMember.Department.Set(department),
			db.TeamMember.Title.Set(title),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		_, _ = g.dbService.Client.AuditLog.CreateOne(
			db.AuditLog.UserID.Set(authUser.ID),
			db.AuditLog.UserName.Set(authUser.Name),
			db.AuditLog.Action.Set("UPDATE_PROFILE"),
			db.AuditLog.Details.Set(fmt.Sprintf("Updated profile info for user ID %s. New details - Name: %s, Dept: %s, Title: %s", targetUserID, name, department, title)),
		).Exec(ctx)

		return map[string]interface{}{"updateTeamMemberProfile": updatedUser}, nil
	}

	if strings.Contains(queryClean, "updateProfileSignature") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		var signature *string
		if sigVal, exists := vars["signature"]; exists && sigVal != nil {
			if sigStr, ok := sigVal.(string); ok {
				signature = &sigStr
			}
		}

		var user *db.TeamMemberModel
		if signature == nil {
			user, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(authUser.ID),
			).Update(
				db.TeamMember.SavedSignature.SetOptional(nil),
			).Exec(ctx)
		} else {
			user, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(authUser.ID),
			).Update(
				db.TeamMember.SavedSignature.Set(*signature),
			).Exec(ctx)
		}
		if err != nil {
			return nil, err
		}

		return map[string]interface{}{"updateProfileSignature": user}, nil
	}

	// ─── LEAVE DOCUMENT CRUD RESOLVERS ──────────────────────────────────────────

	if strings.Contains(queryClean, "getLeaveDocuments") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		var docs []db.LeaveDocumentModel
		if authUser.Role == "ADMIN" {
			docs, err = g.dbService.Client.LeaveDocument.FindMany().OrderBy(
				db.LeaveDocument.CreatedAt.Order(db.DESC),
			).Exec(ctx)
		} else {
			docs, err = g.dbService.Client.LeaveDocument.FindMany(
				db.LeaveDocument.Or(
					db.LeaveDocument.UserID.Equals(authUser.ID),
					db.LeaveDocument.Status.Equals("APPROVED"),
				),
			).OrderBy(
				db.LeaveDocument.CreatedAt.Order(db.DESC),
			).Exec(ctx)
		}
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{"getLeaveDocuments": docs}, nil
	}

	if strings.Contains(queryClean, "createLeaveDocument") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		leaveDate, ok1 := vars["leaveDate"].(string)
		leaveType, ok2 := vars["leaveType"].(string)
		reason, ok3 := vars["reason"].(string)
		signature, ok4 := vars["signature"].(string)
		attachment, _ := vars["attachment"].(string)

		if !ok1 || !ok2 || !ok3 || !ok4 {
			return nil, errors.New("missing variables: leaveDate, leaveType, reason, or signature")
		}

		var attachmentOpt *string
		if attachment != "" {
			attachmentOpt = &attachment
		}

		var doc *db.LeaveDocumentModel
		if attachmentOpt == nil {
			doc, err = g.dbService.Client.LeaveDocument.CreateOne(
				db.LeaveDocument.UserID.Set(authUser.ID),
				db.LeaveDocument.UserName.Set(authUser.Name),
				db.LeaveDocument.Department.Set(authUser.Department),
				db.LeaveDocument.Title.Set(authUser.Title),
				db.LeaveDocument.LeaveDate.Set(leaveDate),
				db.LeaveDocument.LeaveType.Set(leaveType),
				db.LeaveDocument.Reason.Set(reason),
				db.LeaveDocument.Signature.Set(signature),
				db.LeaveDocument.Status.Set("PENDING"),
			).Exec(ctx)
		} else {
			doc, err = g.dbService.Client.LeaveDocument.CreateOne(
				db.LeaveDocument.UserID.Set(authUser.ID),
				db.LeaveDocument.UserName.Set(authUser.Name),
				db.LeaveDocument.Department.Set(authUser.Department),
				db.LeaveDocument.Title.Set(authUser.Title),
				db.LeaveDocument.LeaveDate.Set(leaveDate),
				db.LeaveDocument.LeaveType.Set(leaveType),
				db.LeaveDocument.Reason.Set(reason),
				db.LeaveDocument.Signature.Set(signature),
				db.LeaveDocument.Status.Set("PENDING"),
				db.LeaveDocument.Attachment.Set(*attachmentOpt),
			).Exec(ctx)
		}
		if err != nil {
			return nil, err
		}

		return map[string]interface{}{"createLeaveDocument": doc}, nil
	}

	if strings.Contains(queryClean, "approveLeaveDocument") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}
		if authUser.Role != "ADMIN" {
			return nil, errors.New("forbidden: only administrators can approve leave documents")
		}

		id, ok := vars["id"].(string)
		if !ok {
			return nil, errors.New("missing variables: id")
		}

		doc, err := g.dbService.Client.LeaveDocument.FindUnique(
			db.LeaveDocument.ID.Equals(id),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}
		if doc.Status != "PENDING" {
			return nil, errors.New("leave document is already processed")
		}

		// 1. Quota check & deduction
		switch doc.LeaveType {
		case "COMPENSATORY":
			applicant, err := g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(doc.UserID),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}
			if applicant.TokensBalance < 1.0 {
				return nil, errors.New("insufficient tokens: the applicant does not have enough tokens")
			}

			_, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(doc.UserID),
			).Update(
				db.TeamMember.TokensBalance.Decrement(1.0),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}

			_, _ = g.dbService.Client.TokenTransaction.CreateOne(
				db.TokenTransaction.UserID.Set(doc.UserID),
				db.TokenTransaction.Type.Set("SPEND"),
				db.TokenTransaction.Amount.Set(1.0),
				db.TokenTransaction.Description.Set(fmt.Sprintf("Compensatory Leave (Approved: %s)", doc.ID)),
				db.TokenTransaction.RelatedDate.Set(doc.LeaveDate),
			).Exec(ctx)
		case "SICK":
			applicant, err := g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(doc.UserID),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}
			if applicant.SickLeaveBalance < 1 {
				return nil, errors.New("insufficient sick leave quota: the applicant does not have enough sick leave balance")
			}

			_, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(doc.UserID),
			).Update(
				db.TeamMember.SickLeaveBalance.Decrement(1),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}
		case "ANNUAL":
			applicant, err := g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(doc.UserID),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}
			if applicant.AnnualLeaveBalance < 1 {
				return nil, errors.New("insufficient annual leave quota: the applicant does not have enough annual leave balance")
			}

			_, err = g.dbService.Client.TeamMember.FindUnique(
				db.TeamMember.ID.Equals(doc.UserID),
			).Update(
				db.TeamMember.AnnualLeaveBalance.Decrement(1),
			).Exec(ctx)
			if err != nil {
				return nil, err
			}
		}

		// 2. Create calendar event
		eventStatus := "NORMAL"
		if doc.LeaveType == "COMPENSATORY" {
			eventStatus = "COMPENSATORY_OFF"
		}
		typeLabel := "Compensatory Off"
		switch doc.LeaveType {
		case "SICK":
			typeLabel = "Sick Leave"
		case "CASUAL":
			typeLabel = "Casual Leave"
		case "ANNUAL":
			typeLabel = "Annual Leave"
		}

		_, err = g.dbService.Client.CalendarEvent.CreateOne(
			db.CalendarEvent.UserID.Set(doc.UserID),
			db.CalendarEvent.UserName.Set(doc.UserName),
			db.CalendarEvent.Date.Set(doc.LeaveDate),
			db.CalendarEvent.Status.Set(eventStatus),
			db.CalendarEvent.Details.Set(fmt.Sprintf("%s: %s", typeLabel, doc.Reason)),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// 3. Update document status
		updatedDoc, err := g.dbService.Client.LeaveDocument.FindUnique(
			db.LeaveDocument.ID.Equals(id),
		).Update(
			db.LeaveDocument.Status.Set("APPROVED"),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		return map[string]interface{}{"approveLeaveDocument": updatedDoc}, nil
	}

	if strings.Contains(queryClean, "rejectLeaveDocument") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}
		if authUser.Role != "ADMIN" {
			return nil, errors.New("forbidden: only administrators can reject leave documents")
		}

		id, ok := vars["id"].(string)
		rejectReason, _ := vars["rejectReason"].(string)
		if !ok {
			return nil, errors.New("missing variables: id")
		}

		doc, err := g.dbService.Client.LeaveDocument.FindUnique(
			db.LeaveDocument.ID.Equals(id),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}
		if doc.Status != "PENDING" {
			return nil, errors.New("leave document is already processed")
		}

		var rejectReasonOpt *string
		if rejectReason != "" {
			rejectReasonOpt = &rejectReason
		}

		var updatedDoc *db.LeaveDocumentModel
		if rejectReasonOpt == nil {
			updatedDoc, err = g.dbService.Client.LeaveDocument.FindUnique(
				db.LeaveDocument.ID.Equals(id),
			).Update(
				db.LeaveDocument.Status.Set("REJECTED"),
				db.LeaveDocument.RejectReason.SetOptional(nil),
			).Exec(ctx)
		} else {
			updatedDoc, err = g.dbService.Client.LeaveDocument.FindUnique(
				db.LeaveDocument.ID.Equals(id),
			).Update(
				db.LeaveDocument.Status.Set("REJECTED"),
				db.LeaveDocument.RejectReason.Set(*rejectReasonOpt),
			).Exec(ctx)
		}
		if err != nil {
			return nil, err
		}

		return map[string]interface{}{"rejectLeaveDocument": updatedDoc}, nil
	}

	if strings.Contains(queryClean, "deleteLeaveDocument") {
		authUser, err := getAuthUser()
		if err != nil {
			return nil, err
		}

		id, ok := vars["id"].(string)
		if !ok {
			return nil, errors.New("missing variables: id")
		}

		doc, err := g.dbService.Client.LeaveDocument.FindUnique(
			db.LeaveDocument.ID.Equals(id),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		if authUser.Role != "ADMIN" && doc.UserID != authUser.ID {
			return nil, errors.New("forbidden: you cannot delete this leave document")
		}
		if authUser.Role != "ADMIN" && doc.Status != "PENDING" {
			return nil, errors.New("forbidden: you can only delete pending leave documents")
		}

		// Refund and remove events if approved
		if doc.Status == "APPROVED" {
			eventStatus := "NORMAL"
			if doc.LeaveType == "COMPENSATORY" {
				eventStatus = "COMPENSATORY_OFF"
			}

			// Find and delete calendar event
			events, err := g.dbService.Client.CalendarEvent.FindMany(
				db.CalendarEvent.UserID.Equals(doc.UserID),
				db.CalendarEvent.Date.Equals(doc.LeaveDate),
				db.CalendarEvent.Status.Equals(eventStatus),
			).Take(1).Exec(ctx)
			if err == nil && len(events) > 0 {
				_, _ = g.dbService.Client.CalendarEvent.FindUnique(
					db.CalendarEvent.ID.Equals(events[0].ID),
				).Delete().Exec(ctx)
			}

			switch doc.LeaveType {
			case "COMPENSATORY":
				_, _ = g.dbService.Client.TeamMember.FindUnique(
					db.TeamMember.ID.Equals(doc.UserID),
				).Update(
					db.TeamMember.TokensBalance.Increment(1.0),
				).Exec(ctx)

				_, _ = g.dbService.Client.TokenTransaction.CreateOne(
					db.TokenTransaction.UserID.Set(doc.UserID),
					db.TokenTransaction.Type.Set("EARN"),
					db.TokenTransaction.Amount.Set(1.0),
					db.TokenTransaction.Description.Set("Leave Document Deletion Refund"),
					db.TokenTransaction.RelatedDate.Set(doc.LeaveDate),
				).Exec(ctx)
			case "SICK":
				_, _ = g.dbService.Client.TeamMember.FindUnique(
					db.TeamMember.ID.Equals(doc.UserID),
				).Update(
					db.TeamMember.SickLeaveBalance.Increment(1),
				).Exec(ctx)
			case "ANNUAL":
				_, _ = g.dbService.Client.TeamMember.FindUnique(
					db.TeamMember.ID.Equals(doc.UserID),
				).Update(
					db.TeamMember.AnnualLeaveBalance.Increment(1),
				).Exec(ctx)
			}
		}

		_, err = g.dbService.Client.LeaveDocument.FindUnique(
			db.LeaveDocument.ID.Equals(id),
		).Delete().Exec(ctx)
		if err != nil {
			return nil, err
		}

		return map[string]interface{}{"deleteLeaveDocument": true}, nil
	}

	return nil, fmt.Errorf("unsupported GraphQL operation")
}

