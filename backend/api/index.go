package handler

import (
	"net/http"
	"strings"

	"backend/lib"
)

// Handler is the Vercel serverless function entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := r.URL.Path

	switch {
	case path == "/" || path == "/health":
		lib.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "team-holiday-calendar-api"})
	case strings.HasSuffix(path, "/auth/login"):
		lib.HandleLogin(w, r)
	case strings.HasSuffix(path, "/graphql"):
		lib.HandleGraphQL(w, r)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}
