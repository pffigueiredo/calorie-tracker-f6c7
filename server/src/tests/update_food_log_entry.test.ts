
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foodItemsTable, foodLogEntriesTable } from '../db/schema';
import { type UpdateFoodLogEntryInput } from '../schema';
import { updateFoodLogEntry } from '../handlers/update_food_log_entry';
import { eq } from 'drizzle-orm';

describe('updateFoodLogEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update food log entry quantity and recalculate calories', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Test Food',
        calories_per_100g: '200.00'
      })
      .returning()
      .execute();
    const foodItemId = foodItems[0].id;

    // Create food log entry
    const logEntries = await db.insert(foodLogEntriesTable)
      .values({
        user_id: userId,
        food_item_id: foodItemId,
        quantity_grams: '100.00',
        total_calories: '200.00',
        logged_date: '2024-01-01'
      })
      .returning()
      .execute();
    const logEntryId = logEntries[0].id;

    // Update the log entry
    const input: UpdateFoodLogEntryInput = {
      id: logEntryId,
      user_id: userId,
      quantity_grams: 150
    };

    const result = await updateFoodLogEntry(input);

    // Verify updated values
    expect(result.id).toEqual(logEntryId);
    expect(result.user_id).toEqual(userId);
    expect(result.food_item_id).toEqual(foodItemId);
    expect(result.quantity_grams).toEqual(150);
    expect(result.total_calories).toEqual(300); // 200 * 150 / 100
    expect(result.logged_date).toEqual(new Date('2024-01-01'));
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update food item and recalculate calories', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create two food items
    const foodItem1 = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Food 1',
        calories_per_100g: '200.00'
      })
      .returning()
      .execute();

    const foodItem2 = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Food 2',
        calories_per_100g: '300.00'
      })
      .returning()
      .execute();

    // Create food log entry with first food item
    const logEntries = await db.insert(foodLogEntriesTable)
      .values({
        user_id: userId,
        food_item_id: foodItem1[0].id,
        quantity_grams: '100.00',
        total_calories: '200.00',
        logged_date: '2024-01-01'
      })
      .returning()
      .execute();
    const logEntryId = logEntries[0].id;

    // Update to use second food item
    const input: UpdateFoodLogEntryInput = {
      id: logEntryId,
      user_id: userId,
      food_item_id: foodItem2[0].id
    };

    const result = await updateFoodLogEntry(input);

    // Verify updated values
    expect(result.food_item_id).toEqual(foodItem2[0].id);
    expect(result.total_calories).toEqual(300); // 300 * 100 / 100
    expect(result.quantity_grams).toEqual(100); // Should remain unchanged
  });

  it('should update logged date without affecting calories', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Test Food',
        calories_per_100g: '200.00'
      })
      .returning()
      .execute();
    const foodItemId = foodItems[0].id;

    // Create food log entry
    const logEntries = await db.insert(foodLogEntriesTable)
      .values({
        user_id: userId,
        food_item_id: foodItemId,
        quantity_grams: '100.00',
        total_calories: '200.00',
        logged_date: '2024-01-01'
      })
      .returning()
      .execute();
    const logEntryId = logEntries[0].id;

    // Update only the logged date
    const input: UpdateFoodLogEntryInput = {
      id: logEntryId,
      user_id: userId,
      logged_date: '2024-01-02'
    };

    const result = await updateFoodLogEntry(input);

    // Verify updated date, unchanged calories
    expect(result.logged_date).toEqual(new Date('2024-01-02'));
    expect(result.total_calories).toEqual(200); // Should remain unchanged
    expect(result.quantity_grams).toEqual(100); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Test Food',
        calories_per_100g: '200.00'
      })
      .returning()
      .execute();
    const foodItemId = foodItems[0].id;

    // Create food log entry
    const logEntries = await db.insert(foodLogEntriesTable)
      .values({
        user_id: userId,
        food_item_id: foodItemId,
        quantity_grams: '100.00',
        total_calories: '200.00',
        logged_date: '2024-01-01'
      })
      .returning()
      .execute();
    const logEntryId = logEntries[0].id;

    // Update the log entry
    const input: UpdateFoodLogEntryInput = {
      id: logEntryId,
      user_id: userId,
      quantity_grams: 150,
      logged_date: '2024-01-02'
    };

    await updateFoodLogEntry(input);

    // Verify changes persisted in database
    const updatedEntries = await db.select()
      .from(foodLogEntriesTable)
      .where(eq(foodLogEntriesTable.id, logEntryId))
      .execute();

    expect(updatedEntries).toHaveLength(1);
    const dbEntry = updatedEntries[0];
    expect(parseFloat(dbEntry.quantity_grams)).toEqual(150);
    expect(parseFloat(dbEntry.total_calories)).toEqual(300);
    expect(dbEntry.logged_date).toEqual('2024-01-02');
  });

  it('should throw error when log entry not found', async () => {
    const input: UpdateFoodLogEntryInput = {
      id: 999,
      user_id: 1,
      quantity_grams: 150
    };

    expect(updateFoodLogEntry(input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when user does not own log entry', async () => {
    // Create user 1
    const user1 = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hash123',
        name: 'User 1'
      })
      .returning()
      .execute();

    // Create user 2
    const user2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hash123',
        name: 'User 2'
      })
      .returning()
      .execute();

    // Create food item for user 1
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: user1[0].id,
        name: 'Test Food',
        calories_per_100g: '200.00'
      })
      .returning()
      .execute();

    // Create log entry for user 1
    const logEntries = await db.insert(foodLogEntriesTable)
      .values({
        user_id: user1[0].id,
        food_item_id: foodItems[0].id,
        quantity_grams: '100.00',
        total_calories: '200.00',
        logged_date: '2024-01-01'
      })
      .returning()
      .execute();

    // Try to update as user 2
    const input: UpdateFoodLogEntryInput = {
      id: logEntries[0].id,
      user_id: user2[0].id,
      quantity_grams: 150
    };

    expect(updateFoodLogEntry(input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when new food item does not belong to user', async () => {
    // Create user 1
    const user1 = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hash123',
        name: 'User 1'
      })
      .returning()
      .execute();

    // Create user 2
    const user2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hash123',
        name: 'User 2'
      })
      .returning()
      .execute();

    // Create food item for user 1
    const foodItem1 = await db.insert(foodItemsTable)
      .values({
        user_id: user1[0].id,
        name: 'User 1 Food',
        calories_per_100g: '200.00'
      })
      .returning()
      .execute();

    // Create food item for user 2
    const foodItem2 = await db.insert(foodItemsTable)
      .values({
        user_id: user2[0].id,
        name: 'User 2 Food',
        calories_per_100g: '300.00'
      })
      .returning()
      .execute();

    // Create log entry for user 1
    const logEntries = await db.insert(foodLogEntriesTable)
      .values({
        user_id: user1[0].id,
        food_item_id: foodItem1[0].id,
        quantity_grams: '100.00',
        total_calories: '200.00',
        logged_date: '2024-01-01'
      })
      .returning()
      .execute();

    // Try to update user 1's log entry to use user 2's food item
    const input: UpdateFoodLogEntryInput = {
      id: logEntries[0].id,
      user_id: user1[0].id,
      food_item_id: foodItem2[0].id
    };

    expect(updateFoodLogEntry(input)).rejects.toThrow(/Food item not found or access denied/i);
  });
});
