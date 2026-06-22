package config

import "testing"

func TestLoadUsesDefaults(t *testing.T) {
	t.Setenv("RENTING_ADDR", "")
	t.Setenv("RENTING_DATABASE_URL", "")
	t.Setenv("RENTING_DATABASE_DRIVER", "")
	t.Setenv("RENTING_AUTO_MIGRATE", "")

	cfg := Load()
	if cfg.Addr != ":8090" {
		t.Fatalf("expected default addr, got %q", cfg.Addr)
	}
	if cfg.DatabaseDriver != "pgx" {
		t.Fatalf("expected default driver, got %q", cfg.DatabaseDriver)
	}
	if !cfg.AutoMigrate {
		t.Fatalf("expected auto migrate default")
	}
}

func TestLoadReadsEnvironment(t *testing.T) {
	t.Setenv("RENTING_ADDR", ":9999")
	t.Setenv("RENTING_DATABASE_URL", "postgres://example")
	t.Setenv("RENTING_DATABASE_DRIVER", "postgres")
	t.Setenv("RENTING_AUTO_MIGRATE", "false")

	cfg := Load()
	if cfg.Addr != ":9999" || cfg.DatabaseURL != "postgres://example" || cfg.DatabaseDriver != "postgres" || cfg.AutoMigrate {
		t.Fatalf("unexpected config: %+v", cfg)
	}
}

func TestGetenvBoolFallsBackForInvalidValue(t *testing.T) {
	t.Setenv("RENTING_AUTO_MIGRATE", "nope")

	if !getenvBool("RENTING_AUTO_MIGRATE", true) {
		t.Fatalf("expected fallback for invalid bool")
	}
}
