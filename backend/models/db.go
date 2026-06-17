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

// Seed populates the database with initial mock data if the database is empty (OOP MVC pattern)
func (s *DatabaseService) Seed(ctx context.Context) {
	// Check if we have members already
	count, err := s.Client.TeamMember.FindMany().Count().Exec(ctx)
	if err != nil {
		log.Printf("Failed to count database records (it might be because migrations/db push haven't run yet): %v", err)
		return
	}

	if count > 0 {
		log.Println("Database already seeded. Skipping...")
		return
	}

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
			ID:        "takahashi",
			Name:      "Takahashi S.",
			Email:     "takahashi.s@holidayhq.com",
			Role:      "LEAD",
			AvatarURL: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO",
			Dept:      "Management",
			Title:     "Team Lead",
			Tokens:    3.0,
		},
		{
			ID:        "alex",
			Name:      "Alex Rivera",
			Email:     "alex.rivera@holidayhq.com",
			Role:      "ADMIN",
			AvatarURL: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAxqpaUNIleLAD9XYhKsX2Qooc6XptE2clDD2Vk35OtdDPrAbhVDtIBD5grW9dmuu0t_0_76tdEww6kzLNxGg1CNiS2NgIYQTICX6W93GldTrIWnWxYJ-qQvE36Q_1xzfyaK-_ioen7Mbpeau6fhmNuVY4v-QQMP6x6YaT12g4TZGfVVmBrEBT_BEadMETd7nN13afYPgbqP4_Zn0c3eLBOGRF__MXE_indHaUYg9RGaFX72v1Cso3YvGiw-J8tEsIVKjxT2ORvKb_",
			Dept:      "Engineering",
			Title:     "Lead Architect",
			Tokens:    24.0,
		},
		{
			ID:        "sarah",
			Name:      "Sarah Chen",
			Email:     "sarah.chen@holidayhq.com",
			Role:      "MEMBER",
			AvatarURL: "https://lh3.googleusercontent.com/aida-public/AB6AXuAS8TddYcJaksvd4bKJzD93hLliZg1S3S2batx0lDbsHqsr1xiFg8FlcuwW6bzJBQ_geod2SW29hTdCFbfVfn0dSG7txCHGHQZCbpCkJHvJenGGch0eWnMZoBKdzzCnamJWTRBHSABWzzZQ5b9-l8XiNx4YXPRDc4En7lhFDAE4uDbQZWZTK7yPKTjIJSeKEU7YK09kBdwXfGYvxs7aHwkOmVySxZyKkkdm5jvLC1ZMWAypdXXdydZc5ak7H-qJTOTztDEY9Sp5DkjO",
			Dept:      "Engineering",
			Title:     "Backend Engineer",
			Tokens:    5.0,
		},
	}

	for _, m := range members {
		_, err := s.Client.TeamMember.CreateOne(
			db.TeamMember.Name.Set(m.Name),
			db.TeamMember.Email.Set(m.Email),
			db.TeamMember.Role.Set(m.Role),
			db.TeamMember.Department.Set(m.Dept),
			db.TeamMember.Title.Set(m.Title),
			db.TeamMember.ID.Set(m.ID),
			db.TeamMember.AvatarUrl.Set(m.AvatarURL),
			db.TeamMember.TokensBalance.Set(m.Tokens),
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
