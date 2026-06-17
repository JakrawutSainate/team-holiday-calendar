package controllers

import (
	"encoding/json"
	"net/http"
)

type HealthController struct{}

type HealthResponse struct {
	Status      string `json:"status"`
	Database    string `json:"database"`
	Environment string `json:"environment"`
}

func NewHealthController() *HealthController {
	return &HealthController{}
}

func (h *HealthController) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	response := HealthResponse{
		Status:      "OK",
		Database:    "Connected",
		Environment: "Production",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
