
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  registerUserInputSchema,
  loginUserInputSchema,
  createFoodItemInputSchema,
  updateFoodItemInputSchema,
  deleteFoodItemInputSchema,
  getUserFoodItemsInputSchema,
  createFoodLogEntryInputSchema,
  updateFoodLogEntryInputSchema,
  deleteFoodLogEntryInputSchema,
  getDailyLogInputSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createFoodItem } from './handlers/create_food_item';
import { getUserFoodItems } from './handlers/get_user_food_items';
import { updateFoodItem } from './handlers/update_food_item';
import { deleteFoodItem } from './handlers/delete_food_item';
import { createFoodLogEntry } from './handlers/create_food_log_entry';
import { updateFoodLogEntry } from './handlers/update_food_log_entry';
import { deleteFoodLogEntry } from './handlers/delete_food_log_entry';
import { getDailyLog } from './handlers/get_daily_log';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User authentication routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),
    
  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),
  
  // Food item management routes
  createFoodItem: publicProcedure
    .input(createFoodItemInputSchema)
    .mutation(({ input }) => createFoodItem(input)),
    
  getUserFoodItems: publicProcedure
    .input(getUserFoodItemsInputSchema)
    .query(({ input }) => getUserFoodItems(input)),
    
  updateFoodItem: publicProcedure
    .input(updateFoodItemInputSchema)
    .mutation(({ input }) => updateFoodItem(input)),
    
  deleteFoodItem: publicProcedure
    .input(deleteFoodItemInputSchema)
    .mutation(({ input }) => deleteFoodItem(input)),
  
  // Food log entry management routes
  createFoodLogEntry: publicProcedure
    .input(createFoodLogEntryInputSchema)
    .mutation(({ input }) => createFoodLogEntry(input)),
    
  updateFoodLogEntry: publicProcedure
    .input(updateFoodLogEntryInputSchema)
    .mutation(({ input }) => updateFoodLogEntry(input)),
    
  deleteFoodLogEntry: publicProcedure
    .input(deleteFoodLogEntryInputSchema)
    .mutation(({ input }) => deleteFoodLogEntry(input)),
    
  getDailyLog: publicProcedure
    .input(getDailyLogInputSchema)
    .query(({ input }) => getDailyLog(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
