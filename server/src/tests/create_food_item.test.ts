
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodItemsTable, usersTable } from '../db/schema';
import { type CreateFoodItemInput } from '../schema';
import { createFoodItem } from '../handlers/create_food_item';
import { eq } from 'drizzle-orm';

describe('createFoodItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a food item', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput: CreateFoodItemInput = {
      user_id: testUser.id,
      name: 'Apple',
      calories_per_100g: 52.5
    };

    const result = await createFoodItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Apple');
    expect(result.calories_per_100g).toEqual(52.5);
    expect(typeof result.calories_per_100g).toBe('number');
    expect(result.user_id).toEqual(testUser.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save food item to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput: CreateFoodItemInput = {
      user_id: testUser.id,
      name: 'Banana',
      calories_per_100g: 89.2
    };

    const result = await createFoodItem(testInput);

    // Query using proper drizzle syntax
    const foodItems = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.id, result.id))
      .execute();

    expect(foodItems).toHaveLength(1);
    expect(foodItems[0].name).toEqual('Banana');
    expect(parseFloat(foodItems[0].calories_per_100g)).toEqual(89.2);
    expect(foodItems[0].user_id).toEqual(testUser.id);
    expect(foodItems[0].created_at).toBeInstanceOf(Date);
    expect(foodItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateFoodItemInput = {
      user_id: 999, // Non-existent user ID
      name: 'Orange',
      calories_per_100g: 47.0
    };

    await expect(createFoodItem(testInput)).rejects.toThrow(/user not found/i);
  });

  it('should handle decimal calories correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput: CreateFoodItemInput = {
      user_id: testUser.id,
      name: 'Broccoli',
      calories_per_100g: 34.67
    };

    const result = await createFoodItem(testInput);

    expect(result.calories_per_100g).toEqual(34.67);
    expect(typeof result.calories_per_100g).toBe('number');

    // Verify precision is maintained in database
    const savedItem = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.id, result.id))
      .execute();

    expect(parseFloat(savedItem[0].calories_per_100g)).toEqual(34.67);
  });
});
