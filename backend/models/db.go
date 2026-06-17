package models

import (
	"context"
	"log"
	"sync"
	"backend/db" // Generated Prisma client package
)

type DatabaseService struct {
	Client *db.PrismaClient
}

var (
	instance *DatabaseService
	once     sync.Once
)

// GetDatabaseInstance returns the singleton instance of the database service (OOP design pattern)
func GetDatabaseInstance() *DatabaseService {
	once.Do(func() {
		client := db.NewClient()
		if err := client.Connect(); err != nil {
			log.Fatalf("Failed to connect to Database: %v", err)
		}
		instance = &DatabaseService{Client: client}
	})
	return instance
}

// Disconnect disconnects the database client safely
func (s *DatabaseService) Disconnect() {
	if s.Client != nil {
		if err := s.Client.Disconnect(); err != nil {
			log.Printf("Error disconnecting database: %v", err)
		}
	}
}
