package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"backend/controllers"
	"backend/models"
)

// enableCors is a basic middleware to allow frontend connection
func enableCors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Initialize Database Service (OOP Singleton Model)
	dbService := models.GetDatabaseInstance()
	defer dbService.Disconnect()

	// Seed database with mock data if empty
	dbService.Seed(context.Background())

	// Instantiate Controllers (OOP & MVC Controllers)
	healthCtrl := controllers.NewHealthController()
	graphqlCtrl := controllers.NewGraphQLController(dbService)

	mux := http.NewServeMux()

	// Register Routes
	mux.Handle("/api/health", healthCtrl)
	mux.Handle("/api/v1/graphql", graphqlCtrl)

	// Wrap routing in CORS middleware
	handler := enableCors(mux)

	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("HolidayHQ Backend Server started on http://localhost:%s\n", port)
	fmt.Printf("API Endpoints:\n")
	fmt.Printf("- Health Check: http://localhost:%s/api/health\n", port)
	fmt.Printf("- GraphQL API:  http://localhost:%s/api/v1/graphql\n", port)

	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
