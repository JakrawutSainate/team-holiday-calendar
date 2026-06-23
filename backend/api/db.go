package handler

import (
	"database/sql"
	"os"
	"sync"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var (
	_db   *sql.DB
	_once sync.Once
)

func getDB() *sql.DB {
	_once.Do(func() {
		var err error
		_db, err = sql.Open("pgx", os.Getenv("DATABASE_URL"))
		if err != nil {
			panic("failed to open database: " + err.Error())
		}
		_db.SetMaxOpenConns(5)
		_db.SetMaxIdleConns(2)
	})
	return _db
}
