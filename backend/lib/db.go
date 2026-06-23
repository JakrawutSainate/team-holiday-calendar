package lib

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"sync"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var (
	db   *sql.DB
	once sync.Once
)

func GetDB() *sql.DB {
	once.Do(func() {
		var err error
		db, err = sql.Open("pgx", os.Getenv("DATABASE_URL"))
		if err != nil {
			panic("failed to open database: " + err.Error())
		}
		db.SetMaxOpenConns(5)
		db.SetMaxIdleConns(2)
	})
	return db
}

func WriteJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
