
import { db } from '../db';
import { foodItemsTable, usersTable } from '../db/schema';
import { type CreateFoodItemInput, type FoodItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createFoodItem = async (input: CreateFoodItemInput): Promise<FoodItem> => {
  try {
    // Validate that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Insert food item record
    const result = await db.insert(foodItemsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        calories_per_100g: input.calories_per_100g.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const foodItem = result[0];
    return {
      ...foodItem,
      calories_per_100g: parseFloat(foodItem.calories_per_100g)
    };
  } catch (error) {
    console.error('Food item creation failed:', error);
    throw error;
  }
};
