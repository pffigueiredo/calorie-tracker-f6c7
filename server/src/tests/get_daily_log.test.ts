
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foodItemsTable, foodLogEntriesTable } from '../db/schema';
import { type GetDailyLogInput } from '../schema';
import { getDailyLog } from '../handlers/get_daily_log';

describe('getDailyLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testFoodItemId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test food item
    const foodResult = await db.insert(foodItemsTable)
      .values({
        user_id: testUserId,
        name: 'Test Food',
        calories_per_100g: '250.00'
      })
      .returning()
      .execute();
    testFoodItemId = foodResult[0].id;
  });

  it('should return empty summary for date with no entries', async () => {
    const input: GetDailyLogInput = {
      user_id: testUserId,
      date: '2024-01-15'
    };

    const result = await getDailyLog(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(0);
    expect(result.entries).toHaveLength(0);
  });

  it('should return daily summary with single entry', async () => {
    // Create food log entry
    await db.insert(foodLogEntriesTable)
      .values({
        user_id: testUserId,
        food_item_id: testFoodItemId,
        quantity_grams: '200.00',
        total_calories: '500.00',
        logged_date: '2024-01-15'
      })
      .execute();

    const input: GetDailyLogInput = {
      user_id: testUserId,
      date: '2024-01-15'
    };

    const result = await getDailyLog(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(500);
    expect(result.entries).toHaveLength(1);

    const entry = result.entries[0];
    expect(entry.user_id).toEqual(testUserId);
    expect(entry.food_item_id).toEqual(testFoodItemId);
    expect(entry.quantity_grams).toEqual(200);
    expect(entry.total_calories).toEqual(500);
    expect(entry.logged_date).toBeInstanceOf(Date);
    expect(entry.created_at).toBeInstanceOf(Date);

    // Verify food item details are included
    expect(entry.food_item.id).toEqual(testFoodItemId);
    expect(entry.food_item.name).toEqual('Test Food');
    expect(entry.food_item.calories_per_100g).toEqual(250);
    expect(typeof entry.food_item.calories_per_100g).toEqual('number');
  });

  it('should return daily summary with multiple entries and correct total', async () => {
    // Create multiple food log entries
    await db.insert(foodLogEntriesTable)
      .values([
        {
          user_id: testUserId,
          food_item_id: testFoodItemId,
          quantity_grams: '100.00',
          total_calories: '250.00',
          logged_date: '2024-01-15'
        },
        {
          user_id: testUserId,
          food_item_id: testFoodItemId,
          quantity_grams: '150.00',
          total_calories: '375.00',
          logged_date: '2024-01-15'
        }
      ])
      .execute();

    const input: GetDailyLogInput = {
      user_id: testUserId,
      date: '2024-01-15'
    };

    const result = await getDailyLog(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(625); // 250 + 375
    expect(result.entries).toHaveLength(2);

    // Verify numeric conversions are correct
    result.entries.forEach(entry => {
      expect(typeof entry.quantity_grams).toEqual('number');
      expect(typeof entry.total_calories).toEqual('number');
      expect(typeof entry.food_item.calories_per_100g).toEqual('number');
    });
  });

  it('should not return entries from different dates', async () => {
    // Create entries for different dates
    await db.insert(foodLogEntriesTable)
      .values([
        {
          user_id: testUserId,
          food_item_id: testFoodItemId,
          quantity_grams: '100.00',
          total_calories: '250.00',
          logged_date: '2024-01-15'
        },
        {
          user_id: testUserId,
          food_item_id: testFoodItemId,
          quantity_grams: '200.00',
          total_calories: '500.00',
          logged_date: '2024-01-16'
        }
      ])
      .execute();

    const input: GetDailyLogInput = {
      user_id: testUserId,
      date: '2024-01-15'
    };

    const result = await getDailyLog(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(250);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].total_calories).toEqual(250);
  });

  it('should throw error for non-existent user', async () => {
    const input: GetDailyLogInput = {
      user_id: 99999,
      date: '2024-01-15'
    };

    await expect(getDailyLog(input)).rejects.toThrow(/user not found/i);
  });
});
