
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CalendarIcon, Plus, Trash2, Target } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import { useAuth } from './AuthContext';
import type { FoodItem, CreateFoodLogEntryInput, DailySummary } from '../../../server/src/schema';

export function CalorieTracker() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateFoodLogEntryInput>({
    user_id: user?.id || 0,
    food_item_id: 0,
    quantity_grams: 100,
    logged_date: format(new Date(), 'yyyy-MM-dd')
  });

  const loadFoodItems = useCallback(async () => {
    if (!user) return;
    
    try {
      const items = await trpc.getUserFoodItems.query({ user_id: user.id });
      setFoodItems(items);
    } catch (error) {
      console.error('Failed to load food items:', error);
    }
  }, [user]);

  const loadDailyLog = useCallback(async () => {
    if (!user) return;
    
    try {
      const summary = await trpc.getDailyLog.query({
        user_id: user.id,
        date: format(selectedDate, 'yyyy-MM-dd')
      });
      setDailySummary(summary);
    } catch (error) {
      console.error('Failed to load daily log:', error);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadFoodItems();
  }, [loadFoodItems]);

  useEffect(() => {
    loadDailyLog();
  }, [loadDailyLog]);

  useEffect(() => {
    setFormData((prev: CreateFoodLogEntryInput) => ({
      ...prev,
      logged_date: format(selectedDate, 'yyyy-MM-dd')
    }));
  }, [selectedDate]);

  const selectedFoodItem = foodItems.find((item: FoodItem) => item.id === formData.food_item_id);
  const calculatedCalories = selectedFoodItem 
    ? Math.round((selectedFoodItem.calories_per_100g * formData.quantity_grams) / 100)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || formData.food_item_id === 0) return;
    
    setIsLoading(true);
    try {
      await trpc.createFoodLogEntry.mutate(formData);
      
      // Reload daily log
      await loadDailyLog();
      
      // Reset form
      setFormData({
        user_id: user.id,
        food_item_id: 0,
        quantity_grams: 100,
        logged_date: format(selectedDate, 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Failed to log food entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!user) return;
    
    try {
      await trpc.deleteFoodLogEntry.mutate({ id: entryId, user_id: user.id });
      await loadDailyLog();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Daily Calorie Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Selected Date:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date: Date | undefined) => {
                    if (date) setSelectedDate(date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Add Food Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Log Food Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Food Item</label>
                <Select
                  value={formData.food_item_id.toString()}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateFoodLogEntryInput) => ({ ...prev, food_item_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a food item" />
                  </SelectTrigger>
                  <SelectContent>
                    {foodItems.map((item: FoodItem) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.calories_per_100g} cal/100g)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity (grams)</label>
                <Input
                  type="number"
                  value={formData.quantity_grams}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFoodLogEntryInput) => ({ ...prev, quantity_grams: parseInt(e.target.value) || 0 }))
                  }
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Calculated Calories</label>
                <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-gray-50">
                  <span className="font-semibold text-green-600">{calculatedCalories} cal</span>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isLoading || formData.food_item_id === 0}>
              {isLoading ? 'Logging...' : 'Log Food Entry'}
            </Button>
          </form>
          {foodItems.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No food items found. Add some food items first in the Food Management tab.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary - {format(selectedDate, 'PPP')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-lg font-semibold">Total Calories:</span>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {dailySummary?.total_calories || 0} cal
              </Badge>
            </div>
            
            {dailySummary?.entries && dailySummary.entries.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Food Entries:</h3>
                {dailySummary.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{entry.food_item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {entry.quantity_grams}g • {entry.total_calories} calories
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Food Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this food entry? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No food entries for this day yet. Start logging your meals! 🍽️</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
