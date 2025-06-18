
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foodItemsTable, foodLogEntriesTable } from '../db/schema';
import { type DeleteFoodItemInput } from '../schema';
import { deleteFoodItem } from '../handlers/delete_food_item';
import { eq, and } from 'drizzle-orm';

describe('deleteFoodItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a food item successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
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
        calories_per_100g: '150.00'
      })
      .returning()
      .execute();

    const foodItemId = foodItemResult[0].id;

    // Delete the food item
    const input: DeleteFoodItemInput = {
      id: foodItemId,
      user_id: userId
    };

    const result = await deleteFoodItem(input);

    expect(result.success).toBe(true);

    // Verify food item was deleted
    const deletedFoodItem = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.id, foodItemId))
      .execute();

    expect(deletedFoodItem).toHaveLength(0);
  });

  it('should throw error when food item does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const input: DeleteFoodItemInput = {
      id: 999, // Non-existent ID
      user_id: userId
    };

    await expect(deleteFoodItem(input)).rejects.toThrow(/food item not found or access denied/i);
  });

  it('should throw error when user tries to delete another user\'s food item', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        name: 'User 1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        name: 'User 2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create food item for user 1
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: user1Id,
        name: 'User 1 Food',
        calories_per_100g: '200.00'
      })
      .returning()
      .execute();

    const foodItemId = foodItemResult[0].id;

    // Try to delete user 1's food item as user 2
    const input: DeleteFoodItemInput = {
      id: foodItemId,
      user_id: user2Id
    };

    await expect(deleteFoodItem(input)).rejects.toThrow(/food item not found or access denied/i);
  });

  it('should throw error when food item has logged entries', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test food item
    const foodItemResult = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Test Food with Logs',
        calories_per_100g: '180.50'
      })
      .returning()
      .execute();

    const foodItemId = foodItemResult[0].id;

    // Create a food log entry referencing this food item
    await db.insert(foodLogEntriesTable)
      .values({
        user_id: userId,
        food_item_id: foodItemId,
        quantity_grams: '100.00',
        total_calories: '180.50',
        logged_date: '2024-01-15'
      })
      .execute();

    // Try to delete the food item
    const input: DeleteFoodItemInput = {
      id: foodItemId,
      user_id: userId
    };

    await expect(deleteFoodItem(input)).rejects.toThrow(/cannot delete food item that has logged entries/i);

    // Verify food item still exists
    const remainingFoodItem = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.id, foodItemId))
      .execute();

    expect(remainingFoodItem).toHaveLength(1);
  });

  it('should allow deletion when food item has no logged entries', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create two test food items
    const foodItem1Result = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Food with Logs',
        calories_per_100g: '120.00'
      })
      .returning()
      .execute();

    const foodItem2Result = await db.insert(foodItemsTable)
      .values({
        user_id: userId,
        name: 'Food without Logs',
        calories_per_100g: '250.00'
      })
      .returning()
      .execute();

    const foodItem1Id = foodItem1Result[0].id;
    const foodItem2Id = foodItem2Result[0].id;

    // Create log entry only for first food item
    await db.insert(foodLogEntriesTable)
      .values({
        user_id: userId,
        food_item_id: foodItem1Id,
        quantity_grams: '150.00',
        total_calories: '180.00',
        logged_date: '2024-01-15'
      })
      .execute();

    // Delete the food item without logs (should succeed)
    const input: DeleteFoodItemInput = {
      id: foodItem2Id,
      user_id: userId
    };

    const result = await deleteFoodItem(input);

    expect(result.success).toBe(true);

    // Verify only the correct food item was deleted
    const remainingFoodItems = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.user_id, userId))
      .execute();

    expect(remainingFoodItems).toHaveLength(1);
    expect(remainingFoodItems[0].id).toBe(foodItem1Id);
    expect(remainingFoodItems[0].name).toBe('Food with Logs');
  });
});
