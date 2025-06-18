
import { db } from '../db';
import { usersTable, foodLogEntriesTable, foodItemsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type GetDailyLogInput, type DailySummary } from '../schema';

export async function getDailyLog(input: GetDailyLogInput): Promise<DailySummary> {
  try {
    // First verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Get all food log entries for the user and date with food item details
    const results = await db.select()
      .from(foodLogEntriesTable)
      .innerJoin(foodItemsTable, eq(foodLogEntriesTable.food_item_id, foodItemsTable.id))
      .where(and(
        eq(foodLogEntriesTable.user_id, input.user_id),
        eq(foodLogEntriesTable.logged_date, input.date)
      ))
      .execute();

    // Calculate total calories and format entries
    let totalCalories = 0;
    const entries = results.map(result => {
      const entryCalories = parseFloat(result.food_log_entries.total_calories);
      totalCalories += entryCalories;

      return {
        id: result.food_log_entries.id,
        user_id: result.food_log_entries.user_id,
        food_item_id: result.food_log_entries.food_item_id,
        quantity_grams: parseFloat(result.food_log_entries.quantity_grams),
        total_calories: entryCalories,
        logged_date: new Date(result.food_log_entries.logged_date),
        created_at: result.food_log_entries.created_at,
        food_item: {
          id: result.food_items.id,
          user_id: result.food_items.user_id,
          name: result.food_items.name,
          calories_per_100g: parseFloat(result.food_items.calories_per_100g),
          created_at: result.food_items.created_at,
          updated_at: result.food_items.updated_at
        }
      };
    });

    return {
      date: input.date,
      total_calories: totalCalories,
      entries
    };
  } catch (error) {
    console.error('Failed to get daily log:', error);
    throw error;
  }
}
