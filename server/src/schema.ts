
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// User input schemas
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Food item schema
export const foodItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  calories_per_100g: z.number().positive(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FoodItem = z.infer<typeof foodItemSchema>;

// Food item input schemas
export const createFoodItemInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1),
  calories_per_100g: z.number().positive()
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemInputSchema>;

export const updateFoodItemInputSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string().min(1).optional(),
  calories_per_100g: z.number().positive().optional()
});

export type UpdateFoodItemInput = z.infer<typeof updateFoodItemInputSchema>;

export const deleteFoodItemInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type DeleteFoodItemInput = z.infer<typeof deleteFoodItemInputSchema>;

export const getUserFoodItemsInputSchema = z.object({
  user_id: z.number()
});

export type GetUserFoodItemsInput = z.infer<typeof getUserFoodItemsInputSchema>;

// Food log entry schema
export const foodLogEntrySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  food_item_id: z.number(),
  quantity_grams: z.number().positive(),
  total_calories: z.number().positive(),
  logged_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type FoodLogEntry = z.infer<typeof foodLogEntrySchema>;

// Food log entry with food item details
export const foodLogEntryWithFoodSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  food_item_id: z.number(),
  quantity_grams: z.number().positive(),
  total_calories: z.number().positive(),
  logged_date: z.coerce.date(),
  created_at: z.coerce.date(),
  food_item: foodItemSchema
});

export type FoodLogEntryWithFood = z.infer<typeof foodLogEntryWithFoodSchema>;

// Food log entry input schemas
export const createFoodLogEntryInputSchema = z.object({
  user_id: z.number(),
  food_item_id: z.number(),
  quantity_grams: z.number().positive(),
  logged_date: z.string() // Date string in YYYY-MM-DD format
});

export type CreateFoodLogEntryInput = z.infer<typeof createFoodLogEntryInputSchema>;

export const updateFoodLogEntryInputSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  food_item_id: z.number().optional(),
  quantity_grams: z.number().positive().optional(),
  logged_date: z.string().optional() // Date string in YYYY-MM-DD format
});

export type UpdateFoodLogEntryInput = z.infer<typeof updateFoodLogEntryInputSchema>;

export const deleteFoodLogEntryInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type DeleteFoodLogEntryInput = z.infer<typeof deleteFoodLogEntryInputSchema>;

export const getDailyLogInputSchema = z.object({
  user_id: z.number(),
  date: z.string() // Date string in YYYY-MM-DD format
});

export type GetDailyLogInput = z.infer<typeof getDailyLogInputSchema>;

// Daily summary schema
export const dailySummarySchema = z.object({
  date: z.string(),
  total_calories: z.number(),
  entries: z.array(foodLogEntryWithFoodSchema)
});

export type DailySummary = z.infer<typeof dailySummarySchema>;

// Authentication response schema
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string().optional() // JWT token for future implementation
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
