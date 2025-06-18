
import { db } from '../db';
import { foodItemsTable, foodLogEntriesTable } from '../db/schema';
import { type DeleteFoodItemInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteFoodItem(input: DeleteFoodItemInput): Promise<{ success: boolean }> {
  try {
    // First, verify that the food item exists and belongs to the user
    const existingFoodItem = await db.select()
      .from(foodItemsTable)
      .where(and(
        eq(foodItemsTable.id, input.id),
        eq(foodItemsTable.user_id, input.user_id)
      ))
      .execute();

    if (existingFoodItem.length === 0) {
      throw new Error('Food item not found or access denied');
    }

    // Check if there are any food log entries referencing this food item
    const logEntries = await db.select()
      .from(foodLogEntriesTable)
      .where(eq(foodLogEntriesTable.food_item_id, input.id))
      .execute();

    // If there are log entries, prevent deletion to maintain data integrity
    if (logEntries.length > 0) {
      throw new Error('Cannot delete food item that has logged entries');
    }

    // Delete the food item
    const result = await db.delete(foodItemsTable)
      .where(and(
        eq(foodItemsTable.id, input.id),
        eq(foodItemsTable.user_id, input.user_id)
      ))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Food item deletion failed:', error);
    throw error;
  }
}
