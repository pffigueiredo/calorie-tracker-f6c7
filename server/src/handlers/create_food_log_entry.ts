
import { db } from '../db';
import { usersTable, foodItemsTable, foodLogEntriesTable } from '../db/schema';
import { type CreateFoodLogEntryInput, type FoodLogEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createFoodLogEntry = async (input: CreateFoodLogEntryInput): Promise<FoodLogEntry> => {
  try {
    // Validate that the user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Validate that the food item exists and belongs to the user
    const foodItems = await db.select()
      .from(foodItemsTable)
      .where(and(
        eq(foodItemsTable.id, input.food_item_id),
        eq(foodItemsTable.user_id, input.user_id)
      ))
      .execute();

    if (foodItems.length === 0) {
      throw new Error('Food item not found or does not belong to user');
    }

    const foodItem = foodItems[0];
    
    // Calculate total calories: (calories_per_100g / 100) * quantity_grams
    const caloriesPer100g = parseFloat(foodItem.calories_per_100g);
    const totalCalories = (caloriesPer100g / 100) * input.quantity_grams;

    // Create the food log entry
    const result = await db.insert(foodLogEntriesTable)
      .values({
        user_id: input.user_id,
        food_item_id: input.food_item_id,
        quantity_grams: input.quantity_grams.toString(),
        total_calories: totalCalories.toString(),
        logged_date: input.logged_date
      })
      .returning()
      .execute();

    const logEntry = result[0];
    
    // Convert numeric fields and date field back to proper types before returning
    return {
      ...logEntry,
      quantity_grams: parseFloat(logEntry.quantity_grams),
      total_calories: parseFloat(logEntry.total_calories),
      logged_date: new Date(logEntry.logged_date)
    };
  } catch (error) {
    console.error('Food log entry creation failed:', error);
    throw error;
  }
};
