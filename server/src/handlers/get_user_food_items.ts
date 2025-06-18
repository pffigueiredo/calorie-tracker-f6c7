
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type GetUserFoodItemsInput, type FoodItem } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getUserFoodItems = async (input: GetUserFoodItemsInput): Promise<FoodItem[]> => {
  try {
    // Fetch all food items for the user, ordered by name
    const results = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.user_id, input.user_id))
      .orderBy(asc(foodItemsTable.name))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(item => ({
      ...item,
      calories_per_100g: parseFloat(item.calories_per_100g)
    }));
  } catch (error) {
    console.error('Failed to get user food items:', error);
    throw error;
  }
};
