package config

import (
	"os"
	"strconv"
)

type Config struct {
	Addr           string
	DatabaseURL    string
	DatabaseDriver string
	AutoMigrate    bool
}

func Load() Config {
	return Config{
		Addr:           getenv("RENTING_ADDR", ":8080"),
		DatabaseURL:    os.Getenv("RENTING_DATABASE_URL"),
		DatabaseDriver: getenv("RENTING_DATABASE_DRIVER", "pgx"),
		AutoMigrate:    getenvBool("RENTING_AUTO_MIGRATE", true),
	}
}

func getenv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getenvBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}

	return parsed
}
