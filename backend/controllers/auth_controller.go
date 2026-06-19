package controllers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"backend/models"
	"backend/services"
	"backend/db"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string              `json:"token"`
	User  *db.TeamMemberModel `json:"user"`
}

type AuthController struct {
	dbService   *models.DatabaseService
	authService services.IAuthService
}

func NewAuthController(dbService *models.DatabaseService, authService services.IAuthService) *AuthController {
	return &AuthController{
		dbService:   dbService,
		authService: authService,
	}
}

func (c *AuthController) Login(w http.ResponseWriter, r *http.Request) {
	// Performance Audit: Measure time for critical security actions
	startTime := time.Now()

	// Content-Type Check
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "method not allowed"})
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Security: Prevent detailed error leakage
		log.Printf("[SECURITY WARN] Failed parsing login request payload: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid payload"})
		return
	}

	// Input Validation / Sanitization
	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" || req.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "email and password are required"})
		return
	}

	// DB queries (Prisma Client Go handles parameter binding securely)
	user, err := c.dbService.Client.TeamMember.FindUnique(
		db.TeamMember.Email.Equals(email),
	).Exec(r.Context())

	if err != nil {
		// Security: Avoid disclosing whether email exists or password is wrong (OWASP Top 10)
		log.Printf("[SECURITY] Login failed: user not found %s", email)
		// Introduce artificial constant time to prevent timing attacks
		time.Sleep(time.Until(startTime.Add(100 * time.Millisecond)))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid email or password"})
		return
	}

	// Password validation
	if user.PasswordHash != models.HashPassword(req.Password) {
		log.Printf("[SECURITY] Login failed: incorrect password for %s", email)
		time.Sleep(time.Until(startTime.Add(100 * time.Millisecond)))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid email or password"})
		return
	}

	// Generate JWT via AuthService (OOP delegation)
	token, err := c.authService.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		log.Printf("[ERROR] Failed generating JWT: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	log.Printf("[SECURITY INFO] User successfully logged in: ID=%s, Email=%s, Duration=%v", user.ID, user.Email, time.Since(startTime))

	// Success response
	resp := LoginResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
