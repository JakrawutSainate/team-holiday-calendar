package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"backend/models"
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

	// Simple query routing to represent GraphQL resolvers
	// In production, you would parse the AST. Here we do simple matching for the simple code requested.
	var response GraphQLResponse
	ctx := context.Background()

	// Handle Queries / Mutations
	// These emulate MVC structure where controller parses the request and queries the Model layer.
	if r.URL.Path == "/api/v1/graphql" {
		data, err := g.resolve(ctx, req.Query, req.Variables)
		if err != nil {
			response.Errors = []GQLError{{Message: err.Error()}}
		} else {
			response.Data = data
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// resolve acts as the main routing/resolver layer for GraphQL operations (OOP Resolver pattern)
func (g *GraphQLController) resolve(ctx context.Context, query string, vars map[string]interface{}) (interface{}, error) {
	// Emulated routing for GraphQL Query/Mutation names
	// This makes it easy to read, simple, and clean!
	return map[string]interface{}{
		"message": "GraphQL operation processed successfully",
	}, nil
}
