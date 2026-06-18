package models

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"sync"
	"backend/db" // Generated Prisma client package
)

// HashPassword hashes a plain text password using SHA256 (OOP helper method)
func HashPassword(password string) string {
	h := sha256.New()
	h.Write([]byte(password))
	return hex.EncodeToString(h.Sum(nil))
}

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

// Seed populates the database with initial mock data if the database is empty (OOP MVC pattern)
func (s *DatabaseService) Seed(ctx context.Context) {
	log.Println("Cleaning existing records for fresh seed...")
	_, _ = s.Client.CalendarEvent.FindMany().Delete().Exec(ctx)
	_, _ = s.Client.TeamMember.FindMany().Delete().Exec(ctx)
	_, _ = s.Client.CapacitySetting.FindMany().Delete().Exec(ctx)

	log.Println("Seeding database with default team members...")

	// Default Mock Team Members
	members := []struct {
		ID         string
		Name       string
		Email      string
		Role       string
		AvatarURL  string
		Dept       string
		Title      string
		Tokens     float64
	}{
		{
			ID:        "admin",
			Name:      "Admin",
			Email:     "admin",
			Role:      "ADMIN",
			AvatarURL: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAxqpaUNIleLAD9XYhKsX2Qooc6XptE2clDD2Vk35OtdDPrAbhVDtIBD5grW9dmuu0t_0_76tdEww6kzLNxGg1CNiS2NgIYQTICX6W93GldTrIWnWxYJ-qQvE36Q_1xzfyaK-_ioen7Mbpeau6fhmNuVY4v-QQMP6x6YaT12g4TZGfVVmBrEBT_BEadMETd7nN13afYPgbqP4_Zn0c3eLBOGRF__MXE_indHaUYg9RGaFX72v1Cso3YvGiw-J8tEsIVKjxT2ORvKb_",
			Dept:      "Management",
			Title:     "Administrator",
			Tokens:    99.0,
		},
		{
			ID:        "usr_big",
			Name:      "Big",
			Email:     "usr_big",
			Role:      "MEMBER",
			AvatarURL: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO",
			Dept:      "Engineering",
			Title:     "Senior Developer",
			Tokens:    10.0,
		},
		{
			ID:        "usr_v",
			Name:      "V",
			Email:     "usr_v",
			Role:      "MEMBER",
			AvatarURL: "https://lh3.googleusercontent.com/aida-public/AB6AXuAS8TddYcJaksvd4bKJzD93hLliZg1S3S2batx0lDbsHqsr1xiFg8FlcuwW6bzJBQ_geod2SW29hTdCFbfVfn0dSG7txCHGHQZCbpCkJHvJenGGch0eWnMZoBKdzzCnamJWTRBHSABWzzZQ5b9-l8XiNx4YXPRDc4En7lhFDAE4uDbQZWZTK7yPKTjIJSeKEU7YK09kBdwXfGYvxs7aHwkOmVySxZyKkkdm5jvLC1ZMWAypdXXdydZc5ak7H-qJTOTztDEY9Sp5DkjO",
			Dept:      "Design",
			Title:     "UI/UX Designer",
			Tokens:    10.0,
		},
		{
			ID:        "usr_earth",
			Name:      "earth",
			Email:     "usr_earth",
			Role:      "MEMBER",
			AvatarURL: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO",
			Dept:      "Engineering",
			Title:     "Frontend Engineer",
			Tokens:    10.0,
		},
	}

	for _, m := range members {
		// Use 123456789aB as the default password for the new seeded users
		pwHash := HashPassword("123456789aB")
		_, err := s.Client.TeamMember.CreateOne(
			db.TeamMember.Name.Set(m.Name),
			db.TeamMember.Email.Set(m.Email),
			db.TeamMember.Role.Set(m.Role),
			db.TeamMember.Department.Set(m.Dept),
			db.TeamMember.Title.Set(m.Title),
			db.TeamMember.ID.Set(m.ID),
			db.TeamMember.AvatarURL.Set(m.AvatarURL),
			db.TeamMember.TokensBalance.Set(m.Tokens),
			db.TeamMember.PasswordHash.Set(pwHash),
		).Exec(ctx)
		if err != nil {
			log.Printf("Error seeding team member %s: %v", m.Name, err)
		}
	}

	// Default capacity limit settings
	_, _ = s.Client.CapacitySetting.CreateOne(
		db.CapacitySetting.MaxOffAllowed.Set(2),
		db.CapacitySetting.ID.Set("global-default"),
		db.CapacitySetting.Description.Set("Global default limit"),
	).Exec(ctx)

	log.Println("Seeding completed successfully.")
}
