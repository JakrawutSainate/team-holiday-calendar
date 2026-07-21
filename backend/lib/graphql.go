package lib

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

// ─── GraphQL wire types ───────────────────────────────────────────────────────

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

// ─── GraphQLHandler ───────────────────────────────────────────────────────────

// GraphQLHandler handles all GraphQL requests.
// It delegates query resolution to QueryResolver and MutationResolver.
type GraphQLHandler struct {
	db       *Database
	queries  *QueryResolver
	mutations *MutationResolver
}

// NewGraphQLHandler creates a new GraphQLHandler wired to the given Database.
func NewGraphQLHandler(db *Database) *GraphQLHandler {
	return &GraphQLHandler{
		db:        db,
		queries:   NewQueryResolver(db),
		mutations: NewMutationResolver(db),
	}
}

// ServeHTTP is the HTTP handler for POST /api/v1/graphql.
func (h *GraphQLHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req gqlRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteJSON(w, http.StatusOK, gqlResponse{Errors: []gqlError{{Message: "invalid request body"}}})
		return
	}

	// Extract caller identity from the JWT (optional — mutations require it).
	var userID, userRole string
	if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
		if claims, err := ValidateToken(strings.TrimPrefix(auth, "Bearer ")); err == nil {
			userID = claims.UserID
			userRole = claims.Role
		}
	}

	data, err := h.resolve(req.Query, req.Variables, userID, userRole)
	if err != nil {
		WriteJSON(w, http.StatusOK, gqlResponse{Errors: []gqlError{{Message: err.Error()}}})
		return
	}
	WriteJSON(w, http.StatusOK, gqlResponse{Data: data})
}

// resolve dispatches the query to the correct resolver.
func (h *GraphQLHandler) resolve(
	query string,
	vars map[string]interface{},
	userID, userRole string,
) (interface{}, error) {
	ctx := &ResolverContext{
		UserID:   userID,
		UserRole: userRole,
	}

	q := strings.TrimSpace(query)

	switch {
	// ── Queries ──────────────────────────────────────────────────────────────
	case strings.Contains(q, "getTeamMembers"):
		return h.queries.GetTeamMembers(ctx)
	case strings.Contains(q, "getEvents"):
		return h.queries.GetEvents(ctx)
	case strings.Contains(q, "getCapacitySettings"):
		return h.queries.GetCapacitySettings(ctx)
	case strings.Contains(q, "getTokenTransactions"):
		return h.queries.GetTokenTransactions(ctx)
	case strings.Contains(q, "getLeaveDocuments"):
		return h.queries.GetLeaveDocuments(ctx)
	case strings.Contains(q, "getAuditLogs"):
		return h.queries.GetAuditLogs(ctx)

	// ── Mutations ─────────────────────────────────────────────────────────────
	case strings.Contains(q, "claimShift"):
		return h.mutations.ClaimShift(ctx, vars)
	case strings.Contains(q, "requestLeave"):
		return h.mutations.RequestLeave(ctx, vars)
	case strings.Contains(q, "cancelLeave"):
		return h.mutations.CancelLeave(ctx, vars)
	case strings.Contains(q, "redeemTokens"):
		return h.mutations.RedeemTokens(ctx, vars)
	case strings.Contains(q, "updateMaxOffAllowed"):
		return h.mutations.UpdateMaxOffAllowed(ctx, vars)
	case strings.Contains(q, "updateProfileSignature"):
		return h.mutations.UpdateProfileSignature(ctx, vars)
	case strings.Contains(q, "updateTeamMemberProfile"):
		return h.mutations.UpdateTeamMemberProfile(ctx, vars)
	case strings.Contains(q, "adminBulkClaimTokens"):
		return h.mutations.AdminBulkClaimTokens(ctx, vars)
	case strings.Contains(q, "resetAndSeedTokens"):
		return h.mutations.ResetAndSeedTokens(ctx, vars)

	default:
		return nil, errors.New("unsupported GraphQL operation")
	}
}

// ─── Package-level alias kept for api/index.go ───────────────────────────────

// HandleGraphQL is the package-level function used by api/index.go.
func HandleGraphQL(w http.ResponseWriter, r *http.Request) {
	NewGraphQLHandler(GetDatabase()).ServeHTTP(w, r)
}

// ─── ResolverContext ──────────────────────────────────────────────────────────

// ResolverContext carries per-request auth data into every resolver method.
type ResolverContext struct {
	UserID   string
	UserRole string
}

// RequireAuth returns an error when the caller is not authenticated.
func (c *ResolverContext) RequireAuth() error {
	if c.UserID == "" {
		return errors.New("unauthorized: you must be logged in to perform this action")
	}
	return nil
}

// RequireAdmin returns an error unless the caller holds the ADMIN role.
func (c *ResolverContext) RequireAdmin() error {
	if err := c.RequireAuth(); err != nil {
		return err
	}
	if c.UserRole != "ADMIN" {
		return errors.New("forbidden: only administrators can perform this action")
	}
	return nil
}
