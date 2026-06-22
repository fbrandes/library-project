package order

import (
	"crypto/rand"
	"fmt"
)

func NewUUID() (string, error) {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "", fmt.Errorf("generate uuid: %w", err)
	}

	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80

	return fmt.Sprintf("%x-%x-%x-%x-%x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:16]), nil
}

func ValidateID(id string) error {
	if len(id) != 36 {
		return ErrInvalidID
	}

	for index, char := range id {
		switch index {
		case 8, 13, 18, 23:
			if char != '-' {
				return ErrInvalidID
			}
		default:
			if !isHex(char) {
				return ErrInvalidID
			}
		}
	}

	return nil
}

func isHex(char rune) bool {
	return char >= '0' && char <= '9' ||
		char >= 'a' && char <= 'f' ||
		char >= 'A' && char <= 'F'
}
