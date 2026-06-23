package handler

import (
	"encoding/json"
	"net/http"
	"strings"
)

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

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
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "team-holiday-calendar-api"})
	case strings.HasSuffix(path, "/auth/login"):
		handleLogin(w, r)
	case strings.HasSuffix(path, "/graphql"):
		handleGraphQL(w, r)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}
