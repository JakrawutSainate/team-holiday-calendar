package handler

import (
	"net/http"
	"strings"

	"backend/lib"
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
		lib.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "team-holiday-calendar-api"})
	case strings.HasSuffix(path, "/auth/login"):
		lib.HandleLogin(w, r)
	case strings.HasSuffix(path, "/graphql"):
		lib.HandleGraphQL(w, r)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}
