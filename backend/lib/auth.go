package lib

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Claims holds the JWT payload.
type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthHandler handles authentication HTTP endpoints.
type AuthHandler struct {
	db *Database
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(db *Database) *AuthHandler {
	return &AuthHandler{db: db}
}

// jwtSecret reads JWT_SECRET from env (falls back to a default for local dev).
func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "super-secret-holiday-calendar-key-change-in-production"
	}
	return []byte(s)
}

// HashPassword returns the bcrypt hash of the password.
func HashPassword(password string) string {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		// Fallback if bcrypt fails
		h := sha256.New()
		h.Write([]byte(password))
		return fmt.Sprintf("%x", h.Sum(nil))
	}
	return string(bytes)
}

// VerifyPassword checks bcrypt or legacy SHA-256 password hash.
func VerifyPassword(password, hash string) bool {
	if strings.HasPrefix(hash, "$2a$") || strings.HasPrefix(hash, "$2b$") {
		return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
	}
	h := sha256.New()
	h.Write([]byte(password))
	return fmt.Sprintf("%x", h.Sum(nil)) == hash
}

// CreateToken signs a new JWT for the given user.
func CreateToken(userID, email, role string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(jwtSecret())
}

// ValidateToken parses and validates a JWT string.
func ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}

// HandleLogin is the HTTP handler for POST /api/v1/auth/login.
func (h *AuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	var (
		id            string
		name          string
		email         string
		role          string
		avatarURL     *string
		department    string
		title         string
		tokensBalance float64
		passwordHash  string
	)

	err := h.db.DB.QueryRow(
		`SELECT id, name, email, role, "avatarUrl", department, title, "tokensBalance", "passwordHash"
		 FROM "TeamMember" WHERE LOWER(email) = LOWER($1)`,
		body.Email,
	).Scan(&id, &name, &email, &role, &avatarURL, &department, &title, &tokensBalance, &passwordHash)

	if err != nil || !VerifyPassword(body.Password, passwordHash) {
		WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid email or password"})
		return
	}

	// Auto-migrate legacy SHA-256 hash to bcrypt on successful login
	if !strings.HasPrefix(passwordHash, "$2a$") && !strings.HasPrefix(passwordHash, "$2b$") {
		newHash := HashPassword(body.Password)
		go func() {
			_, _ = h.db.DB.Exec(`UPDATE "TeamMember" SET "passwordHash" = $1 WHERE id = $2`, newHash, id)
		}()
	}

	token, err := CreateToken(id, email, role)
	if err != nil {
		WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create token"})
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":            id,
			"name":          name,
			"email":         email,
			"role":          role,
			"avatarUrl":     avatarURL,
			"department":    department,
			"title":         title,
			"tokensBalance": tokensBalance,
		},
	})
}

// HandleLogin is the package-level alias used by api/index.go.
func HandleLogin(w http.ResponseWriter, r *http.Request) {
	NewAuthHandler(GetDatabase()).HandleLogin(w, r)
}
