package handler

import (
	"context"
	"net/http"
	"strings"

	"backend/lib"
	"backend/models"
)

// Handler is the Vercel serverless function entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin != "" {
		if origin == "https://team-holiday-calendar.vercel.app" ||
			origin == "http://localhost:3000" ||
			strings.HasPrefix(origin, "http://localhost:") {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}
	} else {
		w.Header().Set("Access-Control-Allow-Origin", "*")
	}
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := r.URL.Path

	switch {
	case path == "/" || path == "/health":
		dbStatus := "connected"
		dbService := models.GetDatabaseInstance()
		_, err := dbService.Client.TeamMember.FindMany().Take(1).Exec(context.Background())
		if err != nil {
			dbStatus = "disconnected"
		}
		lib.WriteJSON(w, http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "team-holiday-calendar-api",
			"db":      dbStatus,
		})
	case strings.HasSuffix(path, "/auth/login"):
		lib.HandleLogin(w, r)
	case strings.HasSuffix(path, "/graphql"):
		lib.HandleGraphQL(w, r)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}
