
import { db } from '../db';
import { foodLogEntriesTable, foodItemsTable } from '../db/schema';
import { type UpdateFoodLogEntryInput, type FoodLogEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateFoodLogEntry = async (input: UpdateFoodLogEntryInput): Promise<FoodLogEntry> => {
  try {
    // First, verify the log entry exists and belongs to the user
    const existingEntries = await db.select()
      .from(foodLogEntriesTable)
      .where(and(
        eq(foodLogEntriesTable.id, input.id),
        eq(foodLogEntriesTable.user_id, input.user_id)
      ))
      .execute();

    if (existingEntries.length === 0) {
      throw new Error('Food log entry not found or access denied');
    }

    const existingEntry = existingEntries[0];

    // Prepare update values
    const updateValues: any = {};
    let needsCalorieRecalculation = false;

    // Handle food_item_id change
    if (input.food_item_id !== undefined) {
      // Verify the new food item exists and belongs to the user
      const foodItems = await db.select()
        .from(foodItemsTable)
        .where(and(
          eq(foodItemsTable.id, input.food_item_id),
          eq(foodItemsTable.user_id, input.user_id)
        ))
        .execute();

      if (foodItems.length === 0) {
        throw new Error('Food item not found or access denied');
      }

      updateValues.food_item_id = input.food_item_id;
      needsCalorieRecalculation = true;
    }

    // Handle quantity_grams change
    if (input.quantity_grams !== undefined) {
      updateValues.quantity_grams = input.quantity_grams.toString();
      needsCalorieRecalculation = true;
    }

    // Handle logged_date change
    if (input.logged_date !== undefined) {
      updateValues.logged_date = input.logged_date;
    }

    // Recalculate total calories if needed
    if (needsCalorieRecalculation) {
      const finalFoodItemId = input.food_item_id || existingEntry.food_item_id;
      const finalQuantityGrams = input.quantity_grams || parseFloat(existingEntry.quantity_grams);

      // Get the food item for calorie calculation
      const foodItems = await db.select()
        .from(foodItemsTable)
        .where(eq(foodItemsTable.id, finalFoodItemId))
        .execute();

      const foodItem = foodItems[0];
      const caloriesPer100g = parseFloat(foodItem.calories_per_100g);
      const totalCalories = (caloriesPer100g * finalQuantityGrams) / 100;
      
      updateValues.total_calories = totalCalories.toString();
    }

    // Perform the update
    const result = await db.update(foodLogEntriesTable)
      .set(updateValues)
      .where(eq(foodLogEntriesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      quantity_grams: parseFloat(updatedEntry.quantity_grams),
      total_calories: parseFloat(updatedEntry.total_calories),
      logged_date: new Date(updatedEntry.logged_date)
    };
  } catch (error) {
    console.error('Food log entry update failed:', error);
    throw error;
  }
};
