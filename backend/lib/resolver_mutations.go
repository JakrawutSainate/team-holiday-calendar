package lib

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// MutationResolver contains all write GraphQL resolvers.
type MutationResolver struct {
	db *Database
}

// NewMutationResolver creates a MutationResolver backed by the given Database.
func NewMutationResolver(db *Database) *MutationResolver {
	return &MutationResolver{db: db}
}

// ClaimShift records a weekend/holiday shift and awards 1 token.
func (r *MutationResolver) ClaimShift(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	if err := ctx.RequireAuth(); err != nil {
		return nil, err
	}
	date, _ := vars["date"].(string)
	status, _ := vars["status"].(string)
	details, _ := vars["details"].(string)
	if date == "" || status == "" {
		return nil, errors.New("missing variables: date or status")
	}
	if status != "WEEKEND_WORK" && status != "HOLIDAY_WORK" {
		return nil, errors.New("claimShift only supports WEEKEND_WORK or HOLIDAY_WORK")
	}

	tx, err := r.db.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var userName string
	if err := tx.QueryRow(`SELECT name FROM "TeamMember" WHERE id = $1`, ctx.UserID).Scan(&userName); err != nil {
		return nil, errors.New("user not found")
	}

	eventID := uuid.New().String()
	if _, err = tx.Exec(
		`INSERT INTO "CalendarEvent" (id, "userId", "userName", date, status, details) VALUES ($1,$2,$3,$4,$5,$6)`,
		eventID, ctx.UserID, userName, date, status, details,
	); err != nil {
		return nil, err
	}

	if _, err = tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" + 1.0 WHERE id = $1`, ctx.UserID); err != nil {
		return nil, err
	}

	label := "Weekend Coverage"
	if status == "HOLIDAY_WORK" {
		label = "Holiday Coverage"
	}
	if _, err = tx.Exec(
		`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "relatedDate") VALUES ($1,$2,'EARN',1.0,$3,$4)`,
		uuid.New().String(), ctx.UserID, label, date,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return map[string]interface{}{"claimShift": map[string]interface{}{
		"id": eventID, "userId": ctx.UserID, "userName": userName,
		"date": date, "status": status, "details": &details,
	}}, nil
}

// RequestLeave creates a COMPENSATORY_OFF event and deducts 1 token.
func (r *MutationResolver) RequestLeave(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	if err := ctx.RequireAuth(); err != nil {
		return nil, err
	}
	date, _ := vars["date"].(string)
	if date == "" {
		return nil, errors.New("missing variables: date")
	}

	tx, err := r.db.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var userName string
	var tokensBalance float64
	if err := tx.QueryRow(
		`SELECT name, "tokensBalance" FROM "TeamMember" WHERE id = $1`, ctx.UserID,
	).Scan(&userName, &tokensBalance); err != nil {
		return nil, errors.New("user not found")
	}
	if tokensBalance < 1.0 {
		return nil, errors.New("insufficient tokens: you need at least 1.0 tokens to request leave on this day")
	}

	eventID := uuid.New().String()
	if _, err = tx.Exec(
		`INSERT INTO "CalendarEvent" (id, "userId", "userName", date, status) VALUES ($1,$2,$3,$4,'COMPENSATORY_OFF')`,
		eventID, ctx.UserID, userName, date,
	); err != nil {
		return nil, err
	}
	if _, err = tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" - 1.0 WHERE id = $1`, ctx.UserID); err != nil {
		return nil, err
	}
	if _, err = tx.Exec(
		`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "relatedDate") VALUES ($1,$2,'SPEND',1.0,'Compensatory Leave Request',$3)`,
		uuid.New().String(), ctx.UserID, date,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return map[string]interface{}{"requestLeave": map[string]interface{}{
		"id": eventID, "userId": ctx.UserID, "userName": userName,
		"date": date, "status": "COMPENSATORY_OFF",
	}}, nil
}

// CancelLeave deletes a calendar event and refunds tokens if applicable.
func (r *MutationResolver) CancelLeave(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	if err := ctx.RequireAuth(); err != nil {
		return nil, err
	}
	id, _ := vars["id"].(string)
	if id == "" {
		return nil, errors.New("missing variables: id")
	}

	tx, err := r.db.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var eventUserID, eventDate, eventStatus string
	if err := tx.QueryRow(
		`SELECT "userId", date, status FROM "CalendarEvent" WHERE id = $1`, id,
	).Scan(&eventUserID, &eventDate, &eventStatus); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("event not found")
		}
		return nil, err
	}

	if ctx.UserRole != "ADMIN" && eventUserID != ctx.UserID {
		return nil, errors.New("forbidden: you cannot cancel another member's leave")
	}

	if _, err = tx.Exec(`DELETE FROM "CalendarEvent" WHERE id = $1`, id); err != nil {
		return nil, err
	}

	if eventStatus == "COMPENSATORY_OFF" || eventStatus == "NORMAL" {
		if _, err = tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" + 1.0 WHERE id = $1`, eventUserID); err != nil {
			return nil, err
		}
		if _, err = tx.Exec(
			`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "relatedDate") VALUES ($1,$2,'EARN',1.0,'Leave Cancellation Refund',$3)`,
			uuid.New().String(), eventUserID, eventDate,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return map[string]interface{}{"cancelLeave": true}, nil
}

// RedeemTokens deducts tokens and records a SPEND transaction.
func (r *MutationResolver) RedeemTokens(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	if err := ctx.RequireAuth(); err != nil {
		return nil, err
	}
	amount, _ := vars["amount"].(float64)
	description, _ := vars["description"].(string)
	if amount <= 0 {
		return nil, errors.New("missing variables: amount")
	}
	if description == "" {
		description = "Token Rollover/Payout Request"
	}

	tx, err := r.db.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var tokensBalance float64
	if err := tx.QueryRow(`SELECT "tokensBalance" FROM "TeamMember" WHERE id = $1`, ctx.UserID).Scan(&tokensBalance); err != nil {
		return nil, errors.New("user not found")
	}
	if tokensBalance < amount {
		return nil, fmt.Errorf("insufficient tokens: you need at least %.1f tokens to redeem", amount)
	}

	if _, err = tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" - $1 WHERE id = $2`, amount, ctx.UserID); err != nil {
		return nil, err
	}

	txnID := uuid.New().String()
	now := time.Now().UTC()
	if _, err = tx.Exec(
		`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "createdAt") VALUES ($1,$2,'SPEND',$3,$4,$5)`,
		txnID, ctx.UserID, amount, description, now,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return map[string]interface{}{"redeemTokens": map[string]interface{}{
		"id": txnID, "userId": ctx.UserID, "type": "SPEND", "amount": amount,
		"description": description, "createdAt": now.Format(time.RFC3339),
	}}, nil
}

// UpdateMaxOffAllowed upserts the global capacity limit (admin only).
func (r *MutationResolver) UpdateMaxOffAllowed(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	if err := ctx.RequireAdmin(); err != nil {
		return nil, err
	}
	maxOff, _ := vars["maxOffAllowed"].(float64)
	if maxOff <= 0 {
		return nil, errors.New("missing variables: maxOffAllowed")
	}
	maxOffInt := int(maxOff)

	if _, err := r.db.DB.Exec(`
		INSERT INTO "CapacitySetting" (id, "maxOffAllowed", description)
		VALUES ('global-default', $1, 'Global default limit')
		ON CONFLICT (id) DO UPDATE SET "maxOffAllowed" = EXCLUDED."maxOffAllowed"`,
		maxOffInt,
	); err != nil {
		return nil, err
	}
	return map[string]interface{}{"updateMaxOffAllowed": map[string]interface{}{
		"id": "global-default", "maxOffAllowed": maxOffInt, "description": "Global default limit",
	}}, nil
}

// UpdateProfileSignature saves or clears the calling user's saved signature.
func (r *MutationResolver) UpdateProfileSignature(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	// Bypass: default to first user when unauthenticated (testing mode).
	userID := ctx.UserID
	if userID == "" {
		if err := r.db.DB.QueryRow(`SELECT id FROM "TeamMember" ORDER BY name LIMIT 1`).Scan(&userID); err != nil {
			return nil, errors.New("unauthorized: no user found")
		}
	}

	var sigPtr *string
	if sigVal, exists := vars["signature"]; exists && sigVal != nil {
		if sigStr, ok := sigVal.(string); ok {
			sigPtr = &sigStr
		}
	}

	var id, name, email, role, department, title string
	var avatarURL, savedSig *string
	var tokensBalance float64

	var scanErr error
	if sigPtr == nil {
		scanErr = r.db.DB.QueryRow(`
			UPDATE "TeamMember" SET "savedSignature" = NULL WHERE id = $1
			RETURNING id, name, email, role, "avatarUrl", department, title, "tokensBalance", "savedSignature"`,
			userID,
		).Scan(&id, &name, &email, &role, &avatarURL, &department, &title, &tokensBalance, &savedSig)
	} else {
		scanErr = r.db.DB.QueryRow(`
			UPDATE "TeamMember" SET "savedSignature" = $1 WHERE id = $2
			RETURNING id, name, email, role, "avatarUrl", department, title, "tokensBalance", "savedSignature"`,
			*sigPtr, userID,
		).Scan(&id, &name, &email, &role, &avatarURL, &department, &title, &tokensBalance, &savedSig)
	}
	if scanErr != nil {
		return nil, scanErr
	}

	return map[string]interface{}{"updateProfileSignature": map[string]interface{}{
		"id": id, "name": name, "email": email, "role": role,
		"avatarUrl": avatarURL, "department": department, "title": title,
		"tokensBalance": tokensBalance, "savedSignature": savedSig,
	}}, nil
}

// UpdateTeamMemberProfile updates name, department, and title for a member.
func (r *MutationResolver) UpdateTeamMemberProfile(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	if err := ctx.RequireAuth(); err != nil {
		return nil, err
	}
	id, _ := vars["id"].(string)
	name, _ := vars["name"].(string)
	department, _ := vars["department"].(string)
	title, _ := vars["title"].(string)
	if id == "" {
		return nil, errors.New("missing variable: id")
	}

	var retID, retName, retDept, retTitle string
	err := r.db.DB.QueryRow(`
		UPDATE "TeamMember" SET name=$1, department=$2, title=$3 WHERE id=$4
		RETURNING id, name, department, title`,
		name, department, title, id,
	).Scan(&retID, &retName, &retDept, &retTitle)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{"updateTeamMemberProfile": map[string]interface{}{
		"id": retID, "name": retName, "department": retDept, "title": retTitle,
	}}, nil
}

// AdminBulkClaimTokens allows an admin to claim tokens for a user for multiple dates at once.
func (r *MutationResolver) AdminBulkClaimTokens(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	targetUserID, _ := vars["userId"].(string)
	entriesRaw, ok := vars["entries"].([]interface{})
	if !ok || targetUserID == "" || len(entriesRaw) == 0 {
		return nil, errors.New("missing variables: userId or entries")
	}

	var targetUserName string
	if err := r.db.DB.QueryRow(`SELECT name FROM "TeamMember" WHERE id = $1`, targetUserID).Scan(&targetUserName); err != nil {
		return nil, errors.New("user not found")
	}

	rows, err := r.db.DB.Query(`SELECT date FROM "CalendarEvent" WHERE "userId" = $1 AND status IN ('WEEKEND_WORK', 'HOLIDAY_WORK')`, targetUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	existingDates := make(map[string]bool)
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err == nil {
			existingDates[d] = true
		}
	}

	claimed := 0
	skipped := 0

	tx, err := r.db.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	for _, entryRaw := range entriesRaw {
		entryMap, ok := entryRaw.(map[string]interface{})
		if !ok {
			continue
		}
		date, _ := entryMap["date"].(string)
		status, _ := entryMap["status"].(string)
		details, _ := entryMap["details"].(string)

		if date == "" || (status != "WEEKEND_WORK" && status != "HOLIDAY_WORK") {
			continue
		}

		if existingDates[date] {
			skipped++
			continue
		}

		eventID := uuid.New().String()
		if _, err := tx.Exec(
			`INSERT INTO "CalendarEvent" (id, "userId", "userName", date, status, details) VALUES ($1,$2,$3,$4,$5,$6)`,
			eventID, targetUserID, targetUserName, date, status, details,
		); err != nil {
			return nil, err
		}

		if _, err := tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" + 1.0 WHERE id = $1`, targetUserID); err != nil {
			return nil, err
		}

		label := details
		if label == "" {
			label = "Weekend Coverage"
			if status == "HOLIDAY_WORK" {
				label = "Holiday Coverage"
			}
		}

		txnID := uuid.New().String()
		if _, err := tx.Exec(
			`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "relatedDate") VALUES ($1,$2,'EARN',1.0,$3,$4)`,
			txnID, targetUserID, label, date,
		); err != nil {
			return nil, err
		}

		existingDates[date] = true
		claimed++
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return map[string]interface{}{"adminBulkClaimTokens": map[string]interface{}{
		"claimed": claimed,
		"skipped": skipped,
	}}, nil
}

// ResetAndSeedTokens clears weekend/holiday events, token transactions, and resets tokensBalance to 0.
func (r *MutationResolver) ResetAndSeedTokens(ctx *ResolverContext, vars map[string]interface{}) (interface{}, error) {
	tx, err := r.db.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM "CalendarEvent" WHERE status IN ('WEEKEND_WORK', 'HOLIDAY_WORK')`); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(`DELETE FROM "TokenTransaction"`); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = 0.0`); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return true, nil
}
