
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foodItemsTable } from '../db/schema';
import { type UpdateFoodItemInput } from '../schema';
import { updateFoodItem } from '../handlers/update_food_item';
import { eq } from 'drizzle-orm';

describe('updateFoodItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update food item name only', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = users[0];

    // Create test food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: testUser.id,
        name: 'Original Food',
        calories_per_100g: '200.50'
      })
      .returning()
      .execute();

    const testFoodItem = foodItems[0];

    const input: UpdateFoodItemInput = {
      id: testFoodItem.id,
      user_id: testUser.id,
      name: 'Updated Food Name'
    };

    const result = await updateFoodItem(input);

    expect(result.id).toEqual(testFoodItem.id);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.name).toEqual('Updated Food Name');
    expect(result.calories_per_100g).toEqual(200.5);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testFoodItem.updated_at).toBe(true);
  });

  it('should update calories only', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = users[0];

    // Create test food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: testUser.id,
        name: 'Original Food',
        calories_per_100g: '200.50'
      })
      .returning()
      .execute();

    const testFoodItem = foodItems[0];

    const input: UpdateFoodItemInput = {
      id: testFoodItem.id,
      user_id: testUser.id,
      calories_per_100g: 350.75
    };

    const result = await updateFoodItem(input);

    expect(result.id).toEqual(testFoodItem.id);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.name).toEqual('Original Food');
    expect(result.calories_per_100g).toEqual(350.75);
    expect(typeof result.calories_per_100g).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both name and calories', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = users[0];

    // Create test food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: testUser.id,
        name: 'Original Food',
        calories_per_100g: '200.50'
      })
      .returning()
      .execute();

    const testFoodItem = foodItems[0];

    const input: UpdateFoodItemInput = {
      id: testFoodItem.id,
      user_id: testUser.id,
      name: 'Complete Update',
      calories_per_100g: 125.25
    };

    const result = await updateFoodItem(input);

    expect(result.name).toEqual('Complete Update');
    expect(result.calories_per_100g).toEqual(125.25);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = users[0];

    // Create test food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: testUser.id,
        name: 'Original Food',
        calories_per_100g: '200.50'
      })
      .returning()
      .execute();

    const testFoodItem = foodItems[0];

    const input: UpdateFoodItemInput = {
      id: testFoodItem.id,
      user_id: testUser.id,
      name: 'Database Test',
      calories_per_100g: 275.5
    };

    await updateFoodItem(input);

    const savedItem = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.id, testFoodItem.id))
      .execute();

    expect(savedItem).toHaveLength(1);
    expect(savedItem[0].name).toEqual('Database Test');
    expect(parseFloat(savedItem[0].calories_per_100g)).toEqual(275.5);
    expect(savedItem[0].updated_at).toBeInstanceOf(Date);
    expect(savedItem[0].updated_at > testFoodItem.updated_at).toBe(true);
  });

  it('should reject update for non-existent food item', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = users[0];

    const input: UpdateFoodItemInput = {
      id: 99999,
      user_id: testUser.id,
      name: 'Should Fail'
    };

    await expect(updateFoodItem(input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should reject update from wrong user', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user@test.com',
          password_hash: 'hashedpassword',
          name: 'Test User'
        },
        {
          email: 'other@test.com',
          password_hash: 'hashedpassword',
          name: 'Other User'
        }
      ])
      .returning()
      .execute();

    const testUser = users[0];
    const otherUser = users[1];

    // Create test food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: testUser.id,
        name: 'Original Food',
        calories_per_100g: '200.50'
      })
      .returning()
      .execute();

    const testFoodItem = foodItems[0];

    const input: UpdateFoodItemInput = {
      id: testFoodItem.id,
      user_id: otherUser.id,
      name: 'Unauthorized Update'
    };

    await expect(updateFoodItem(input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should handle decimal precision correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const testUser = users[0];

    // Create test food item
    const foodItems = await db.insert(foodItemsTable)
      .values({
        user_id: testUser.id,
        name: 'Original Food',
        calories_per_100g: '200.50'
      })
      .returning()
      .execute();

    const testFoodItem = foodItems[0];

    const input: UpdateFoodItemInput = {
      id: testFoodItem.id,
      user_id: testUser.id,
      calories_per_100g: 123.46  // Use 2 decimal places to match DB precision
    };

    const result = await updateFoodItem(input);

    expect(result.calories_per_100g).toEqual(123.46);
    expect(typeof result.calories_per_100g).toBe('number');
  });
});
