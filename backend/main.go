package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"backend/controllers"
	"backend/models"
	"backend/services"

	"github.com/joho/godotenv"
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
	// Load Environment variables from .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize Database Service (OOP Singleton Model)
	dbService := models.GetDatabaseInstance()
	defer dbService.Disconnect()

	// Seed database with mock data if empty
	dbService.Seed(context.Background())

	// Initialize Auth Service
	authService := services.NewAuthService()

	// Instantiate Controllers (OOP & MVC Controllers)
	healthCtrl := controllers.NewHealthController()
	authCtrl := controllers.NewAuthController(dbService, authService)
	graphqlCtrl := controllers.NewGraphQLController(dbService, authService)

	mux := http.NewServeMux()

	// Register Routes
	mux.Handle("/api/health", healthCtrl)
	mux.HandleFunc("/api/v1/auth/login", authCtrl.Login)
	mux.Handle("/api/v1/graphql", graphqlCtrl)

	// Register Swagger Documentation Routes
	mux.HandleFunc("/swagger/openapi.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		data, err := os.ReadFile("openapi.json")
		if err != nil {
			data, err = os.ReadFile("backend/openapi.json")
		}
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"error": "openapi.json not found"}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write(data)
	})

	mux.HandleFunc("/swagger/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		swaggerUIHTML := `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HolidayHQ API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; overflow: -y-scroll; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin: 0; background: #fafafa; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/swagger/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis
          ],
          layout: "BaseLayout"
        });
      };
    </script>
  </body>
</html>`
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(swaggerUIHTML))
	})

	// Wrap routing in CORS middleware
	handler := enableCors(mux)

	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("HolidayHQ Backend Server started on http://localhost:%s\n", port)
	fmt.Printf("API Endpoints:\n")
	fmt.Printf("- Health Check: http://localhost:%s/api/health\n", port)
	fmt.Printf("- Login Check:  http://localhost:%s/api/v1/auth/login\n", port)
	fmt.Printf("- GraphQL API:  http://localhost:%s/api/v1/graphql\n", port)
	fmt.Printf("- Swagger Docs: http://localhost:%s/swagger\n", port)

	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
