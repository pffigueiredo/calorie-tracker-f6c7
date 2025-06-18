
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type UpdateFoodItemInput, type FoodItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateFoodItem = async (input: UpdateFoodItemInput): Promise<FoodItem> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.calories_per_100g !== undefined) {
      updateData.calories_per_100g = input.calories_per_100g.toString();
    }

    // Update food item record with user ownership check
    const result = await db.update(foodItemsTable)
      .set(updateData)
      .where(and(
        eq(foodItemsTable.id, input.id),
        eq(foodItemsTable.user_id, input.user_id)
      ))
      .returning()
      .execute();

    // Check if any record was updated
    if (result.length === 0) {
      throw new Error('Food item not found or access denied');
    }

    const foodItem = result[0];
    return {
      ...foodItem,
      calories_per_100g: parseFloat(foodItem.calories_per_100g)
    };
  } catch (error) {
    console.error('Food item update failed:', error);
    throw error;
  }
};
