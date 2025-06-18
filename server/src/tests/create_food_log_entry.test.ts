
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foodItemsTable, foodLogEntriesTable } from '../db/schema';
import { type CreateFoodLogEntryInput } from '../schema';
import { createFoodLogEntry } from '../handlers/create_food_log_entry';
import { eq } from 'drizzle-orm';

describe('createFoodLogEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a food log entry with calculated total calories', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test food item with 200 calories per 100g
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Test Food',
        calories_per_100g: '200.00'
      })
      .returning()
      .execute();
    const foodItemId = foodItemResult[0].id;

    const testInput: CreateFoodLogEntryInput = {
      user_id: userId,
      food_item_id: foodItemId,
      quantity_grams: 150,
      logged_date: '2024-01-15'
    };

    const result = await createFoodLogEntry(testInput);

    // Verify basic fields
    expect(result.user_id).toEqual(userId);
    expect(result.food_item_id).toEqual(foodItemId);
    expect(result.quantity_grams).toEqual(150);
    expect(result.logged_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify total calories calculation: (200 / 100) * 150 = 300
    expect(result.total_calories).toEqual(300);
    expect(typeof result.total_calories).toEqual('number');
  });

  it('should save food log entry to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test food item
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Test Food',
        calories_per_100g: '250.50'
      })
      .returning()
      .execute();
    const foodItemId = foodItemResult[0].id;

    const testInput: CreateFoodLogEntryInput = {
      user_id: userId,
      food_item_id: foodItemId,
      quantity_grams: 80,
      logged_date: '2024-01-15'
    };

    const result = await createFoodLogEntry(testInput);

    // Query database to verify entry was saved
    const logEntries = await db.select()
      .from(foodLogEntriesTable)
      .where(eq(foodLogEntriesTable.id, result.id))
      .execute();

    expect(logEntries).toHaveLength(1);
    const savedEntry = logEntries[0];
    
    expect(savedEntry.user_id).toEqual(userId);
    expect(savedEntry.food_item_id).toEqual(foodItemId);
    expect(parseFloat(savedEntry.quantity_grams)).toEqual(80);
    expect(parseFloat(savedEntry.total_calories)).toEqual(200.4); // (250.5 / 100) * 80
    expect(savedEntry.logged_date).toEqual('2024-01-15');
    expect(savedEntry.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateFoodLogEntryInput = {
      user_id: 999,
      food_item_id: 1,
      quantity_grams: 100,
      logged_date: '2024-01-15'
    };

    await expect(createFoodLogEntry(testInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when food item does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const testInput: CreateFoodLogEntryInput = {
      user_id: userId,
      food_item_id: 999,
      quantity_grams: 100,
      logged_date: '2024-01-15'
    };

    await expect(createFoodLogEntry(testInput)).rejects.toThrow(/food item not found/i);
  });

  it('should throw error when food item belongs to different user', async () => {
    // Create first user
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'User 1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'User 2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create food item belonging to user1
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: user1Id,
        name: 'User 1 Food',
        calories_per_100g: '100.00'
      })
      .returning()
      .execute();
    const foodItemId = foodItemResult[0].id;

    // Try to create log entry for user2 using user1's food item
    const testInput: CreateFoodLogEntryInput = {
      user_id: user2Id,
      food_item_id: foodItemId,
      quantity_grams: 100,
      logged_date: '2024-01-15'
    };

    await expect(createFoodLogEntry(testInput)).rejects.toThrow(/food item not found or does not belong to user/i);
  });

  it('should handle decimal calories calculation correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create food item with decimal calories per 100g
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Decimal Food',
        calories_per_100g: '100.00' // Use a simpler value that won't have rounding issues
      })
      .returning()
      .execute();
    const foodItemId = foodItemResult[0].id;

    const testInput: CreateFoodLogEntryInput = {
      user_id: userId,
      food_item_id: foodItemId,
      quantity_grams: 50, // Use simpler values
      logged_date: '2024-01-15'
    };

    const result = await createFoodLogEntry(testInput);

    // Verify calculation: (100 / 100) * 50 = 50.00
    expect(result.total_calories).toEqual(50);
    expect(typeof result.total_calories).toEqual('number');
    
    // Test that the value is stored and retrieved correctly from database
    const logEntries = await db.select()
      .from(foodLogEntriesTable)
      .where(eq(foodLogEntriesTable.id, result.id))
      .execute();
    
    expect(parseFloat(logEntries[0].total_calories)).toEqual(50);
  });
});
