package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

type gqlRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

type gqlResponse struct {
	Data   interface{} `json:"data,omitempty"`
	Errors []gqlError  `json:"errors,omitempty"`
}

type gqlError struct {
	Message string `json:"message"`
}

func handleGraphQL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req gqlRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusOK, gqlResponse{Errors: []gqlError{{Message: "invalid request body"}}})
		return
	}

	// Extract user from Authorization header
	var userID, userRole string
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		if claims, err := validateToken(strings.TrimPrefix(authHeader, "Bearer ")); err == nil {
			userID = claims.UserID
			userRole = claims.Role
		}
	}

	data, err := resolveGraphQL(req.Query, req.Variables, userID, userRole)
	if err != nil {
		writeJSON(w, http.StatusOK, gqlResponse{Errors: []gqlError{{Message: err.Error()}}})
		return
	}
	writeJSON(w, http.StatusOK, gqlResponse{Data: data})
}

func resolveGraphQL(query string, vars map[string]interface{}, userID, userRole string) (interface{}, error) {
	q := strings.TrimSpace(query)
	db := getDB()

	requireAuth := func() error {
		if userID == "" {
			return errors.New("unauthorized: you must be logged in to perform this action")
		}
		return nil
	}

	// ─── PUBLIC QUERIES ───────────────────────────────────────────────────────

	if strings.Contains(q, "getTeamMembers") {
		rows, err := db.Query(`SELECT id, name, email, role, "avatarUrl", department, title, "tokensBalance" FROM "TeamMember" ORDER BY name`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		var members []map[string]interface{}
		for rows.Next() {
			var id, name, email, role, department, title string
			var avatarURL *string
			var tokensBalance float64
			if err := rows.Scan(&id, &name, &email, &role, &avatarURL, &department, &title, &tokensBalance); err != nil {
				return nil, err
			}
			members = append(members, map[string]interface{}{
				"id": id, "name": name, "email": email, "role": role,
				"avatarUrl": avatarURL, "department": department, "title": title,
				"tokensBalance": tokensBalance,
			})
		}
		if members == nil {
			members = []map[string]interface{}{}
		}
		return map[string]interface{}{"getTeamMembers": members}, nil
	}

	if strings.Contains(q, "getEvents") {
		rows, err := db.Query(`SELECT id, "userId", "userName", date, status, details FROM "CalendarEvent"`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		var events []map[string]interface{}
		for rows.Next() {
			var id, userID, userName, date, status string
			var details *string
			if err := rows.Scan(&id, &userID, &userName, &date, &status, &details); err != nil {
				return nil, err
			}
			events = append(events, map[string]interface{}{
				"id": id, "userId": userID, "userName": userName,
				"date": date, "status": status, "details": details,
			})
		}
		if events == nil {
			events = []map[string]interface{}{}
		}
		return map[string]interface{}{"getEvents": events}, nil
	}

	if strings.Contains(q, "getCapacitySettings") {
		rows, err := db.Query(`SELECT id, date, "dayOfWeek", "maxOffAllowed", description FROM "CapacitySetting"`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		var settings []map[string]interface{}
		for rows.Next() {
			var id string
			var date, description *string
			var dayOfWeek *int
			var maxOffAllowed int
			if err := rows.Scan(&id, &date, &dayOfWeek, &maxOffAllowed, &description); err != nil {
				return nil, err
			}
			settings = append(settings, map[string]interface{}{
				"id": id, "date": date, "dayOfWeek": dayOfWeek,
				"maxOffAllowed": maxOffAllowed, "description": description,
			})
		}
		if settings == nil {
			settings = []map[string]interface{}{}
		}
		return map[string]interface{}{"getCapacitySettings": settings}, nil
	}

	// ─── AUTHENTICATED QUERIES ────────────────────────────────────────────────

	if strings.Contains(q, "getTokenTransactions") {
		if err := requireAuth(); err != nil {
			return nil, err
		}
		rows, err := db.Query(
			`SELECT id, "userId", type, amount, description, "relatedDate", "createdAt"
			 FROM "TokenTransaction" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
			userID,
		)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		var txns []map[string]interface{}
		for rows.Next() {
			var id, uid, txType, description string
			var amount float64
			var relatedDate *string
			var createdAt time.Time
			if err := rows.Scan(&id, &uid, &txType, &amount, &description, &relatedDate, &createdAt); err != nil {
				return nil, err
			}
			txns = append(txns, map[string]interface{}{
				"id": id, "userId": uid, "type": txType, "amount": amount,
				"description": description, "relatedDate": relatedDate,
				"createdAt": createdAt.UTC().Format(time.RFC3339),
			})
		}
		if txns == nil {
			txns = []map[string]interface{}{}
		}
		return map[string]interface{}{"getTokenTransactions": txns}, nil
	}

	// ─── MUTATIONS ────────────────────────────────────────────────────────────

	if strings.Contains(q, "claimShift") {
		if err := requireAuth(); err != nil {
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

		tx, err := db.Begin()
		if err != nil {
			return nil, err
		}
		defer tx.Rollback()

		var userName string
		if err := tx.QueryRow(`SELECT name FROM "TeamMember" WHERE id = $1`, userID).Scan(&userName); err != nil {
			return nil, errors.New("user not found")
		}

		eventID := uuid.New().String()
		_, err = tx.Exec(
			`INSERT INTO "CalendarEvent" (id, "userId", "userName", date, status, details) VALUES ($1,$2,$3,$4,$5,$6)`,
			eventID, userID, userName, date, status, details,
		)
		if err != nil {
			return nil, err
		}

		_, err = tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" + 1.0 WHERE id = $1`, userID)
		if err != nil {
			return nil, err
		}

		label := "Weekend Coverage"
		if status == "HOLIDAY_WORK" {
			label = "Holiday Coverage"
		}
		_, err = tx.Exec(
			`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "relatedDate") VALUES ($1,$2,'EARN',1.0,$3,$4)`,
			uuid.New().String(), userID, label, date,
		)
		if err != nil {
			return nil, err
		}

		if err := tx.Commit(); err != nil {
			return nil, err
		}
		return map[string]interface{}{"claimShift": map[string]interface{}{
			"id": eventID, "userId": userID, "userName": userName,
			"date": date, "status": status, "details": &details,
		}}, nil
	}

	if strings.Contains(q, "requestLeave") {
		if err := requireAuth(); err != nil {
			return nil, err
		}
		date, _ := vars["date"].(string)
		if date == "" {
			return nil, errors.New("missing variables: date")
		}

		tx, err := db.Begin()
		if err != nil {
			return nil, err
		}
		defer tx.Rollback()

		var userName string
		var tokensBalance float64
		if err := tx.QueryRow(`SELECT name, "tokensBalance" FROM "TeamMember" WHERE id = $1`, userID).Scan(&userName, &tokensBalance); err != nil {
			return nil, errors.New("user not found")
		}
		if tokensBalance < 1.0 {
			return nil, errors.New("insufficient tokens: you need at least 1.0 tokens to request leave on this day")
		}

		eventID := uuid.New().String()
		_, err = tx.Exec(
			`INSERT INTO "CalendarEvent" (id, "userId", "userName", date, status) VALUES ($1,$2,$3,$4,'COMPENSATORY_OFF')`,
			eventID, userID, userName, date,
		)
		if err != nil {
			return nil, err
		}

		_, err = tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" - 1.0 WHERE id = $1`, userID)
		if err != nil {
			return nil, err
		}

		_, err = tx.Exec(
			`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "relatedDate") VALUES ($1,$2,'SPEND',1.0,'Compensatory Leave Request',$3)`,
			uuid.New().String(), userID, date,
		)
		if err != nil {
			return nil, err
		}

		if err := tx.Commit(); err != nil {
			return nil, err
		}
		return map[string]interface{}{"requestLeave": map[string]interface{}{
			"id": eventID, "userId": userID, "userName": userName,
			"date": date, "status": "COMPENSATORY_OFF",
		}}, nil
	}

	if strings.Contains(q, "cancelLeave") {
		if err := requireAuth(); err != nil {
			return nil, err
		}
		id, _ := vars["id"].(string)
		if id == "" {
			return nil, errors.New("missing variables: id")
		}

		tx, err := db.Begin()
		if err != nil {
			return nil, err
		}
		defer tx.Rollback()

		var eventUserID, eventDate, eventStatus string
		if err := tx.QueryRow(`SELECT "userId", date, status FROM "CalendarEvent" WHERE id = $1`, id).Scan(&eventUserID, &eventDate, &eventStatus); err != nil {
			if err == sql.ErrNoRows {
				return nil, errors.New("event not found")
			}
			return nil, err
		}

		if userRole != "ADMIN" && eventUserID != userID {
			return nil, errors.New("forbidden: you cannot cancel another member's leave")
		}

		_, err = tx.Exec(`DELETE FROM "CalendarEvent" WHERE id = $1`, id)
		if err != nil {
			return nil, err
		}

		if eventStatus == "COMPENSATORY_OFF" || eventStatus == "NORMAL" {
			_, err = tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" + 1.0 WHERE id = $1`, eventUserID)
			if err != nil {
				return nil, err
			}
			_, err = tx.Exec(
				`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "relatedDate") VALUES ($1,$2,'EARN',1.0,'Leave Cancellation Refund',$3)`,
				uuid.New().String(), eventUserID, eventDate,
			)
			if err != nil {
				return nil, err
			}
		}

		if err := tx.Commit(); err != nil {
			return nil, err
		}
		return map[string]interface{}{"cancelLeave": true}, nil
	}

	if strings.Contains(q, "redeemTokens") {
		if err := requireAuth(); err != nil {
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

		tx, err := db.Begin()
		if err != nil {
			return nil, err
		}
		defer tx.Rollback()

		var tokensBalance float64
		if err := tx.QueryRow(`SELECT "tokensBalance" FROM "TeamMember" WHERE id = $1`, userID).Scan(&tokensBalance); err != nil {
			return nil, errors.New("user not found")
		}
		if tokensBalance < amount {
			return nil, fmt.Errorf("insufficient tokens: you need at least %.1f tokens to redeem", amount)
		}

		_, err = tx.Exec(`UPDATE "TeamMember" SET "tokensBalance" = "tokensBalance" - $1 WHERE id = $2`, amount, userID)
		if err != nil {
			return nil, err
		}

		txnID := uuid.New().String()
		now := time.Now().UTC()
		_, err = tx.Exec(
			`INSERT INTO "TokenTransaction" (id, "userId", type, amount, description, "createdAt") VALUES ($1,$2,'SPEND',$3,$4,$5)`,
			txnID, userID, amount, description, now,
		)
		if err != nil {
			return nil, err
		}

		if err := tx.Commit(); err != nil {
			return nil, err
		}
		return map[string]interface{}{"redeemTokens": map[string]interface{}{
			"id": txnID, "userId": userID, "type": "SPEND", "amount": amount,
			"description": description, "createdAt": now.Format(time.RFC3339),
		}}, nil
	}

	if strings.Contains(q, "updateMaxOffAllowed") {
		if err := requireAuth(); err != nil {
			return nil, err
		}
		if userRole != "ADMIN" {
			return nil, errors.New("forbidden: only administrators can modify capacity settings")
		}
		maxOff, _ := vars["maxOffAllowed"].(float64)
		if maxOff <= 0 {
			return nil, errors.New("missing variables: maxOffAllowed")
		}
		maxOffInt := int(maxOff)

		_, err := db.Exec(
			`INSERT INTO "CapacitySetting" (id, "maxOffAllowed", description)
			 VALUES ('global-default', $1, 'Global default limit')
			 ON CONFLICT (id) DO UPDATE SET "maxOffAllowed" = EXCLUDED."maxOffAllowed"`,
			maxOffInt,
		)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{"updateMaxOffAllowed": map[string]interface{}{
			"id": "global-default", "maxOffAllowed": maxOffInt, "description": "Global default limit",
		}}, nil
	}

	return nil, errors.New("unsupported GraphQL operation")
}
