
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function registerUser(input: RegisterUserInput): Promise<AuthResponse> {
  try {
    // Check if email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUsers.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password (simplified for demo - in production use bcrypt)
    const password_hash = `hashed_${input.password}`;

    // Create new user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash,
        name: input.name
      })
      .returning()
      .execute();

    const user = result[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        name: user.name,
        created_at: user.created_at
      }
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
}
