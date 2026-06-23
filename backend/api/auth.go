package handler

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "super-secret-holiday-calendar-key-change-in-production"
	}
	return []byte(s)
}

func hashPassword(password string) string {
	h := sha256.New()
	h.Write([]byte(password))
	return fmt.Sprintf("%x", h.Sum(nil))
}

func createToken(userID, email, role string) (string, error) {
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

func validateToken(tokenStr string) (*Claims, error) {
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

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	db := getDB()
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

	err := db.QueryRow(
		`SELECT id, name, email, role, "avatarUrl", department, title, "tokensBalance", "passwordHash"
		 FROM "TeamMember" WHERE LOWER(email) = LOWER($1)`,
		body.Email,
	).Scan(&id, &name, &email, &role, &avatarURL, &department, &title, &tokensBalance, &passwordHash)

	if err != nil || hashPassword(body.Password) != passwordHash {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid email or password"})
		return
	}

	token, err := createToken(id, email, role)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create token"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
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
