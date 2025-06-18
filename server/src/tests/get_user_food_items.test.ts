
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foodItemsTable } from '../db/schema';
import { type GetUserFoodItemsInput } from '../schema';
import { getUserFoodItems } from '../handlers/get_user_food_items';

describe('getUserFoodItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no food items', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input: GetUserFoodItemsInput = { user_id: userId };

    const result = await getUserFoodItems(input);

    expect(result).toEqual([]);
  });

  it('should return user food items ordered by name', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create food items for the user (inserted in non-alphabetical order)
    await db.insert(foodItemsTable)
      .values([
        {
          user_id: userId,
          name: 'Zucchini',
          calories_per_100g: '20.50'
        },
        {
          user_id: userId,
          name: 'Apple',
          calories_per_100g: '52.00'
        },
        {
          user_id: userId,
          name: 'Banana',
          calories_per_100g: '89.75'
        }
      ])
      .execute();

    const input: GetUserFoodItemsInput = { user_id: userId };
    const result = await getUserFoodItems(input);

    expect(result).toHaveLength(3);
    
    // Check that items are ordered by name alphabetically
    expect(result[0].name).toEqual('Apple');
    expect(result[1].name).toEqual('Banana');
    expect(result[2].name).toEqual('Zucchini');

    // Verify numeric conversion
    expect(typeof result[0].calories_per_100g).toBe('number');
    expect(result[0].calories_per_100g).toEqual(52.00);
    expect(result[1].calories_per_100g).toEqual(89.75);
    expect(result[2].calories_per_100g).toEqual(20.50);

    // Verify all required fields are present
    result.forEach(item => {
      expect(item.id).toBeDefined();
      expect(item.user_id).toEqual(userId);
      expect(item.name).toBeDefined();
      expect(item.calories_per_100g).toBeDefined();
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should only return food items for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        name: 'User One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        name: 'User Two'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create food items for both users
    await db.insert(foodItemsTable)
      .values([
        {
          user_id: user1Id,
          name: 'User1 Apple',
          calories_per_100g: '52.00'
        },
        {
          user_id: user1Id,
          name: 'User1 Banana',
          calories_per_100g: '89.00'
        },
        {
          user_id: user2Id,
          name: 'User2 Orange',
          calories_per_100g: '47.00'
        }
      ])
      .execute();

    // Get food items for user1
    const input: GetUserFoodItemsInput = { user_id: user1Id };
    const result = await getUserFoodItems(input);

    expect(result).toHaveLength(2);
    
    // Verify only user1's items are returned
    result.forEach(item => {
      expect(item.user_id).toEqual(user1Id);
      expect(item.name.startsWith('User1')).toBe(true);
    });

    // Verify ordering
    expect(result[0].name).toEqual('User1 Apple');
    expect(result[1].name).toEqual('User1 Banana');
  });
});
