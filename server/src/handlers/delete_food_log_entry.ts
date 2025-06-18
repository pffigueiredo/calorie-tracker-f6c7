
import { db } from '../db';
import { foodLogEntriesTable } from '../db/schema';
import { type DeleteFoodLogEntryInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteFoodLogEntry = async (input: DeleteFoodLogEntryInput): Promise<{ success: boolean }> => {
  try {
    // Delete the food log entry, ensuring it belongs to the user
    const result = await db.delete(foodLogEntriesTable)
      .where(and(
        eq(foodLogEntriesTable.id, input.id),
        eq(foodLogEntriesTable.user_id, input.user_id)
      ))
      .returning()
      .execute();

    // Check if any record was deleted
    if (result.length === 0) {
      throw new Error('Food log entry not found or access denied');
    }

    return { success: true };
  } catch (error) {
    console.error('Delete food log entry failed:', error);
    throw error;
  }
};
