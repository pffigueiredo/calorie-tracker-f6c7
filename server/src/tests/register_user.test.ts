
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user', async () => {
    const result = await registerUser(testInput);

    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.name).toEqual('Test User');
    expect(result.user.password_hash).toEqual('hashed_password123');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await registerUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].password_hash).toEqual('hashed_password123');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for duplicate email', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register same email again
    await expect(registerUser(testInput)).rejects.toThrow(/email already registered/i);
  });

  it('should prevent duplicate email registration in database', async () => {
    // Register first user
    await registerUser(testInput);

    // Verify only one user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, testInput.email))
      .execute();

    expect(users).toHaveLength(1);

    // Attempt second registration should fail
    try {
      await registerUser(testInput);
    } catch (error) {
      // Expected to throw
    }

    // Verify still only one user exists
    const usersAfter = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, testInput.email))
      .execute();

    expect(usersAfter).toHaveLength(1);
  });
});
