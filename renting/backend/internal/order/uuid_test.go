package order

import "testing"

func TestNewUUIDProducesValidUUID(t *testing.T) {
	id, err := NewUUID()
	if err != nil {
		t.Fatalf("expected uuid: %v", err)
	}

	if err := ValidateID(id); err != nil {
		t.Fatalf("expected valid uuid, got %q: %v", id, err)
	}

	if id[14] != '4' {
		t.Fatalf("expected v4 uuid, got %q", id)
	}
}

func TestValidateIDRejectsMalformedIDs(t *testing.T) {
	tests := []string{
		"",
		"550e8400-e29b-41d4-a716-44665544000",
		"550e8400xe29b-41d4-a716-446655440000",
		"550e8400-e29b-41d4-a716-44665544000z",
	}

	for _, test := range tests {
		t.Run(test, func(t *testing.T) {
			if err := ValidateID(test); err == nil {
				t.Fatalf("expected %q to be invalid", test)
			}
		})
	}
}

func TestIsHex(t *testing.T) {
	for _, char := range []rune{'0', '9', 'a', 'f', 'A', 'F'} {
		if !isHex(char) {
			t.Fatalf("expected %q to be hex", char)
		}
	}

	if isHex('g') {
		t.Fatalf("expected g not to be hex")
	}
}
