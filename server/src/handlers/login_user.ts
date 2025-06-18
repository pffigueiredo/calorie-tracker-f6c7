
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginUserInput): Promise<AuthResponse> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Compare provided password with stored hash using Bun's built-in password utilities
    const isValidPassword = await Bun.password.verify(input.password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Return user data without password hash
    return {
      user: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash, // Keep for schema compliance but shouldn't be used by client
        name: user.name,
        created_at: user.created_at
      }
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
}
