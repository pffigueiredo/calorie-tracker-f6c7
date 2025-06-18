
import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const foodItemsTable = pgTable('food_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  name: text('name').notNull(),
  calories_per_100g: numeric('calories_per_100g', { precision: 8, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const foodLogEntriesTable = pgTable('food_log_entries', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  food_item_id: integer('food_item_id').references(() => foodItemsTable.id).notNull(),
  quantity_grams: numeric('quantity_grams', { precision: 8, scale: 2 }).notNull(),
  total_calories: numeric('total_calories', { precision: 8, scale: 2 }).notNull(),
  logged_date: date('logged_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  foodItems: many(foodItemsTable),
  foodLogEntries: many(foodLogEntriesTable),
}));

export const foodItemsRelations = relations(foodItemsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [foodItemsTable.user_id],
    references: [usersTable.id],
  }),
  logEntries: many(foodLogEntriesTable),
}));

export const foodLogEntriesRelations = relations(foodLogEntriesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [foodLogEntriesTable.user_id],
    references: [usersTable.id],
  }),
  foodItem: one(foodItemsTable, {
    fields: [foodLogEntriesTable.food_item_id],
    references: [foodItemsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type FoodItem = typeof foodItemsTable.$inferSelect;
export type NewFoodItem = typeof foodItemsTable.$inferInsert;
export type FoodLogEntry = typeof foodLogEntriesTable.$inferSelect;
export type NewFoodLogEntry = typeof foodLogEntriesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  foodItems: foodItemsTable, 
  foodLogEntries: foodLogEntriesTable 
};

export const tableRelations = {
  users: usersRelations,
  foodItems: foodItemsRelations,
  foodLogEntries: foodLogEntriesRelations,
};
