export class UserValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid user: ${problems.join('; ')}`);
    this.name = 'UserValidationError';
  }
}

export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User ${id} was not found`);
    this.name = 'UserNotFoundError';
  }
}
