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

	// QUERIES
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

	// MUTATIONS
	if strings.Contains(queryClean, "claimShift") {
		date, ok1 := vars["date"].(string)
		status, ok2 := vars["status"].(string)
		details, _ := vars["details"].(string)
		if !ok1 || !ok2 {
			return nil, errors.New("missing variables: date or status")
		}

		// Takahashi is the current active user for claims
		event, err := g.dbService.Client.CalendarEvent.CreateOne(
			db.CalendarEvent.UserID.Set("takahashi"),
			db.CalendarEvent.UserName.Set("Takahashi S."),
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
				db.TeamMember.ID.Equals("takahashi"),
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
		date, ok := vars["date"].(string)
		if !ok {
			return nil, errors.New("missing variables: date")
		}

		// Create a leave request
		event, err := g.dbService.Client.CalendarEvent.CreateOne(
			db.CalendarEvent.UserID.Set("takahashi"),
			db.CalendarEvent.UserName.Set("Takahashi S."),
			db.CalendarEvent.Date.Set(date),
			db.CalendarEvent.Status.Set("COMPENSATORY_OFF"),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		// Deduct token
		_, err = g.dbService.Client.TeamMember.FindUnique(
			db.TeamMember.ID.Equals("takahashi"),
		).Update(
			db.TeamMember.TokensBalance.Decrement(1.0),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}

		return map[string]interface{}{"requestLeave": event}, nil
	}

	if strings.Contains(queryClean, "cancelLeave") {
		id, ok := vars["id"].(string)
		if !ok {
			return nil, errors.New("missing variables: id")
		}

		// Fetch the event to know details (e.g. userId, status)
		event, err := g.dbService.Client.CalendarEvent.FindUnique(
			db.CalendarEvent.ID.Equals(id),
		).Exec(ctx)
		if err != nil {
			return nil, err
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
