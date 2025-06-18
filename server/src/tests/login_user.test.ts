
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { eq } from 'drizzle-orm';

const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

const testLoginInput: LoginUserInput = {
  email: testUser.email,
  password: testUser.password
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create a test user with hashed password using Bun's built-in password utilities
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash,
        name: testUser.name
      })
      .execute();
  });

  it('should login user with valid credentials', async () => {
    const result = await loginUser(testLoginInput);

    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.name).toEqual(testUser.name);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.password_hash).toBeDefined(); // Present for schema compliance
    expect(result.token).toBeUndefined(); // No token implementation yet
  });

  it('should throw error for invalid email', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: testUser.password
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for invalid password', async () => {
    const invalidInput: LoginUserInput = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for empty password', async () => {
    const invalidInput: LoginUserInput = {
      email: testUser.email,
      password: ''
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should return correct user data structure', async () => {
    const result = await loginUser(testLoginInput);

    // Verify all required fields are present
    expect(typeof result.user.id).toBe('number');
    expect(typeof result.user.email).toBe('string');
    expect(typeof result.user.password_hash).toBe('string');
    expect(typeof result.user.name).toBe('string');
    expect(result.user.created_at).toBeInstanceOf(Date);

    // Verify user data matches what was inserted
    const dbUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, testUser.email))
      .execute();

    expect(result.user.id).toEqual(dbUser[0].id);
    expect(result.user.email).toEqual(dbUser[0].email);
    expect(result.user.name).toEqual(dbUser[0].name);
    expect(result.user.created_at).toEqual(dbUser[0].created_at);
  });
});
