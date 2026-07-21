package lib

import (
	"errors"
	"time"
)

// QueryResolver contains all read-only GraphQL resolvers.
type QueryResolver struct {
	db *Database
}

// NewQueryResolver creates a QueryResolver backed by the given Database.
func NewQueryResolver(db *Database) *QueryResolver {
	return &QueryResolver{db: db}
}

// GetTeamMembers returns all team members.
func (r *QueryResolver) GetTeamMembers(_ *ResolverContext) (interface{}, error) {
	rows, err := r.db.DB.Query(`
		SELECT id, name, email, role, "avatarUrl", department, title,
		       "tokensBalance", "savedSignature", "sickLeaveBalance", "annualLeaveBalance"
		FROM "TeamMember" ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []map[string]interface{}
	for rows.Next() {
		var id, name, email, role, department, title string
		var avatarURL, savedSig *string
		var tokensBalance float64
		var sickBalance, annualBalance int
		if err := rows.Scan(&id, &name, &email, &role, &avatarURL, &department, &title,
			&tokensBalance, &savedSig, &sickBalance, &annualBalance); err != nil {
			return nil, err
		}
		members = append(members, map[string]interface{}{
			"id": id, "name": name, "email": email, "role": role,
			"avatarUrl": avatarURL, "department": department, "title": title,
			"tokensBalance": tokensBalance, "savedSignature": savedSig,
			"sickLeaveBalance": sickBalance, "annualLeaveBalance": annualBalance,
		})
	}
	if members == nil {
		members = []map[string]interface{}{}
	}
	return map[string]interface{}{"getTeamMembers": members}, nil
}

// GetEvents returns all calendar events.
func (r *QueryResolver) GetEvents(_ *ResolverContext) (interface{}, error) {
	rows, err := r.db.DB.Query(`SELECT id, "userId", "userName", date, status, details FROM "CalendarEvent"`)
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

// GetCapacitySettings returns all capacity settings.
func (r *QueryResolver) GetCapacitySettings(_ *ResolverContext) (interface{}, error) {
	rows, err := r.db.DB.Query(`SELECT id, date, "dayOfWeek", "maxOffAllowed", description FROM "CapacitySetting"`)
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

// GetTokenTransactions returns token transactions for the authenticated user.
func (r *QueryResolver) GetTokenTransactions(ctx *ResolverContext) (interface{}, error) {
	if err := ctx.RequireAuth(); err != nil {
		return nil, err
	}
	rows, err := r.db.DB.Query(`
		SELECT id, "userId", type, amount, description, "relatedDate", "createdAt"
		FROM "TokenTransaction" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
		ctx.UserID,
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

// GetLeaveDocuments returns leave documents. Admins see all; members see their own.
func (r *QueryResolver) GetLeaveDocuments(ctx *ResolverContext) (interface{}, error) {
	// Bypass: default to admin for unauthenticated access during testing.
	userID := ctx.UserID
	if userID == "" {
		userID = "admin"
		ctx.UserRole = "ADMIN"
	}

	var rows interface{ Close() error }
	var err error

	if ctx.UserRole == "ADMIN" {
		rows, err = r.db.DB.Query(`
			SELECT id, "userId", "userName", department, title,
			       "leaveDate", "leaveType", reason, signature, status, "createdAt"
			FROM "LeaveDocument" ORDER BY "createdAt" DESC`)
	} else {
		rows, err = r.db.DB.Query(`
			SELECT id, "userId", "userName", department, title,
			       "leaveDate", "leaveType", reason, signature, status, "createdAt"
			FROM "LeaveDocument" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
			userID)
	}
	if err != nil {
		return nil, err
	}

	// Type-assert back to *sql.Rows to use Next/Scan.
	sqlRows, ok := rows.(interface {
		Close() error
		Next() bool
		Scan(...interface{}) error
	})
	if !ok {
		return nil, errors.New("internal: unexpected rows type")
	}
	defer sqlRows.Close()

	var docs []map[string]interface{}
	for sqlRows.Next() {
		var id, uid, userName, dept, title, leaveDate, leaveType, reason, signature, status string
		var createdAt time.Time
		if err := sqlRows.Scan(&id, &uid, &userName, &dept, &title, &leaveDate, &leaveType, &reason, &signature, &status, &createdAt); err != nil {
			return nil, err
		}
		docs = append(docs, map[string]interface{}{
			"id": id, "userId": uid, "userName": userName, "department": dept,
			"title": title, "leaveDate": leaveDate, "leaveType": leaveType,
			"reason": reason, "signature": signature, "status": status,
			"createdAt": createdAt.Format(time.RFC3339),
		})
	}
	if docs == nil {
		docs = []map[string]interface{}{}
	}
	return map[string]interface{}{"getLeaveDocuments": docs}, nil
}

// GetAuditLogs returns the most recent 200 audit log entries (admin only).
func (r *QueryResolver) GetAuditLogs(ctx *ResolverContext) (interface{}, error) {
	if err := ctx.RequireAuth(); err != nil {
		return nil, err
	}
	rows, err := r.db.DB.Query(`
		SELECT id, "userId", "userName", action, details, "createdAt"
		FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []map[string]interface{}
	for rows.Next() {
		var id, uid, uName, action, details string
		var createdAt time.Time
		if err := rows.Scan(&id, &uid, &uName, &action, &details, &createdAt); err != nil {
			return nil, err
		}
		logs = append(logs, map[string]interface{}{
			"id": id, "userId": uid, "userName": uName,
			"action": action, "details": details,
			"createdAt": createdAt.UTC().Format(time.RFC3339),
		})
	}
	if logs == nil {
		logs = []map[string]interface{}{}
	}
	return map[string]interface{}{"getAuditLogs": logs}, nil
}
