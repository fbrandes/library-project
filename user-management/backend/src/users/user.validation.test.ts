import { describe, expect, it } from 'vitest';
import { UserValidationError } from './user.errors.js';
import {
  assertValidUserId,
  isUserRole,
  isUserStatus,
  normalizeUserInput,
  parseUserInput,
  validateUserId,
  validateUserInput,
} from './user.validation.js';
import { userInput } from './test-fixtures.js';

describe('user validation', () => {
  it('recognizes valid roles and statuses', () => {
    expect(isUserRole('ADMIN')).toBe(true);
    expect(isUserRole('OWNER')).toBe(false);
    expect(isUserStatus('ACTIVE')).toBe(true);
    expect(isUserStatus('LOCKED')).toBe(false);
  });

  it('normalizes string fields', () => {
    expect(
      normalizeUserInput(
        userInput({
          email: ' ADA@Example.COM ',
          firstName: ' Ada ',
          lastName: ' Lovelace ',
        }),
      ),
    ).toMatchObject({
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('validates ids', () => {
    expect(validateUserId('')).toEqual(['id is required']);
    expect(assertValidUserId(' user-1 ')).toBe('user-1');
  });

  it('reports missing payload', () => {
    expect(validateUserInput(null)).toEqual(['payload is required']);
  });

  it('reports invalid payload fields', () => {
    expect(
      validateUserInput({
        email: 'bad',
        firstName: ' ',
        lastName: '',
        role: 'OWNER' as never,
        status: 'LOCKED' as never,
      }),
    ).toEqual([
      'email must be valid',
      'firstName is required',
      'lastName is required',
      'role is invalid',
      'status is invalid',
    ]);
  });

  it('parses valid input and throws validation errors for invalid input', () => {
    expect(parseUserInput(userInput({ email: 'ADA@Example.COM' })).email).toBe('ada@example.com');

    expect(() => parseUserInput({ ...userInput(), email: '' })).toThrow(UserValidationError);
    expect(() => assertValidUserId('')).toThrow(UserValidationError);
  });
});
