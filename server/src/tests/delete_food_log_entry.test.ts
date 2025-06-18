
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foodItemsTable, foodLogEntriesTable } from '../db/schema';
import { type DeleteFoodLogEntryInput } from '../schema';
import { deleteFoodLogEntry } from '../handlers/delete_food_log_entry';
import { eq } from 'drizzle-orm';

describe('deleteFoodLogEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a food log entry', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test food item
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: user.id,
        name: 'Test Food',
        calories_per_100g: '100'
      })
      .returning()
      .execute();
    const foodItem = foodItemResult[0];

    // Create test food log entry
    const logEntryResult = await db.insert(foodLogEntriesTable)
      .values({
        user_id: user.id,
        food_item_id: foodItem.id,
        quantity_grams: '150',
        total_calories: '150',
        logged_date: '2024-01-15'
      })
      .returning()
      .execute();
    const logEntry = logEntryResult[0];

    const input: DeleteFoodLogEntryInput = {
      id: logEntry.id,
      user_id: user.id
    };

    const result = await deleteFoodLogEntry(input);

    expect(result.success).toBe(true);

    // Verify the entry was actually deleted
    const deletedEntries = await db.select()
      .from(foodLogEntriesTable)
      .where(eq(foodLogEntriesTable.id, logEntry.id))
      .execute();

    expect(deletedEntries).toHaveLength(0);
  });

  it('should throw error when log entry not found', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const input: DeleteFoodLogEntryInput = {
      id: 999999, // Non-existent ID
      user_id: user.id
    };

    await expect(deleteFoodLogEntry(input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when user tries to delete another users log entry', async () => {
    // Create first test user
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'User 1'
      })
      .returning()
      .execute();
    const user1 = user1Result[0];

    // Create second test user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'User 2'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    // Create food item for user1
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: user1.id,
        name: 'User 1 Food',
        calories_per_100g: '100'
      })
      .returning()
      .execute();
    const foodItem = foodItemResult[0];

    // Create log entry for user1
    const logEntryResult = await db.insert(foodLogEntriesTable)
      .values({
        user_id: user1.id,
        food_item_id: foodItem.id,
        quantity_grams: '200',
        total_calories: '200',
        logged_date: '2024-01-15'
      })
      .returning()
      .execute();
    const logEntry = logEntryResult[0];

    // Try to delete user1's log entry as user2
    const input: DeleteFoodLogEntryInput = {
      id: logEntry.id,
      user_id: user2.id // Different user ID
    };

    await expect(deleteFoodLogEntry(input)).rejects.toThrow(/not found or access denied/i);

    // Verify the entry was NOT deleted
    const existingEntries = await db.select()
      .from(foodLogEntriesTable)
      .where(eq(foodLogEntriesTable.id, logEntry.id))
      .execute();

    expect(existingEntries).toHaveLength(1);
  });

  it('should only delete the specified entry when user has multiple entries', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test food item
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: user.id,
        name: 'Test Food',
        calories_per_100g: '100'
      })
      .returning()
      .execute();
    const foodItem = foodItemResult[0];

    // Create multiple log entries
    const logEntry1Result = await db.insert(foodLogEntriesTable)
      .values({
        user_id: user.id,
        food_item_id: foodItem.id,
        quantity_grams: '100',
        total_calories: '100',
        logged_date: '2024-01-15'
      })
      .returning()
      .execute();
    const logEntry1 = logEntry1Result[0];

    const logEntry2Result = await db.insert(foodLogEntriesTable)
      .values({
        user_id: user.id,
        food_item_id: foodItem.id,
        quantity_grams: '200',
        total_calories: '200',
        logged_date: '2024-01-15'
      })
      .returning()
      .execute();
    const logEntry2 = logEntry2Result[0];

    // Delete only the first entry
    const input: DeleteFoodLogEntryInput = {
      id: logEntry1.id,
      user_id: user.id
    };

    const result = await deleteFoodLogEntry(input);

    expect(result.success).toBe(true);

    // Verify only the first entry was deleted
    const remainingEntries = await db.select()
      .from(foodLogEntriesTable)
      .where(eq(foodLogEntriesTable.user_id, user.id))
      .execute();

    expect(remainingEntries).toHaveLength(1);
    expect(remainingEntries[0].id).toBe(logEntry2.id);
  });
});
