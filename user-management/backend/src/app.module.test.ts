import { describe, expect, it } from 'vitest';
import { AppModule } from './app.module.js';
import { UsersModule } from './users/users.module.js';

describe('application modules', () => {
  it('exports Nest modules', () => {
    expect(AppModule).toBeDefined();
    expect(UsersModule).toBeDefined();
  });
});
