package lib

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"sync"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// Database wraps *sql.DB and is the single shared DB connection.
type Database struct {
	DB *sql.DB
}

var (
	dbInstance *Database
	dbOnce     sync.Once
)

// GetDatabase returns the singleton Database instance.
func GetDatabase() *Database {
	dbOnce.Do(func() {
		sqlDB, err := sql.Open("pgx", os.Getenv("DATABASE_URL"))
		if err != nil {
			panic("failed to open database: " + err.Error())
		}
		sqlDB.SetMaxOpenConns(5)
		sqlDB.SetMaxIdleConns(2)
		dbInstance = &Database{DB: sqlDB}
	})
	return dbInstance
}

// GetDB is a convenience alias kept for compatibility.
func GetDB() *sql.DB {
	return GetDatabase().DB
}

// WriteJSON writes v as JSON with the given HTTP status code.
func WriteJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
