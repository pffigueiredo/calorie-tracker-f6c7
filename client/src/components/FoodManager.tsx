
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useAuth } from './AuthContext';
import type { FoodItem, CreateFoodItemInput, UpdateFoodItemInput } from '../../../server/src/schema';

export function FoodManager() {
  const { user } = useAuth();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  
  const [formData, setFormData] = useState<CreateFoodItemInput>({
    user_id: user?.id || 0,
    name: '',
    calories_per_100g: 0
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

  useEffect(() => {
    loadFoodItems();
  }, [loadFoodItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (editingItem) {
        // Update existing item
        const updateData: UpdateFoodItemInput = {
          id: editingItem.id,
          user_id: user.id,
          name: formData.name,
          calories_per_100g: formData.calories_per_100g
        };
        await trpc.updateFoodItem.mutate(updateData);
        setEditingItem(null);
      } else {
        // Create new item
        await trpc.createFoodItem.mutate(formData);
      }
      
      // Reload food items
      await loadFoodItems();
      
      // Reset form
      setFormData({
        user_id: user.id,
        name: '',
        calories_per_100g: 0
      });
    } catch (error) {
      console.error('Failed to save food item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormData({
      user_id: user?.id || 0,
      name: item.name,
      calories_per_100g: item.calories_per_100g
    });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setFormData({
      user_id: user?.id || 0,
      name: '',
      calories_per_100g: 0
    });
  };

  const handleDelete = async (item: FoodItem) => {
    if (!user) return;
    
    try {
      await trpc.deleteFoodItem.mutate({ id: item.id, user_id: user.id });
      await loadFoodItems();
    } catch (error) {
      console.error('Failed to delete food item:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Food name (e.g., Banana, Chicken Breast)"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFoodItemInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <Input
                type="number"
                placeholder="Calories per 100g"
                value={formData.calories_per_100g}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFoodItemInput) => ({ ...prev, calories_per_100g: parseFloat(e.target.value) || 0 }))
                }
                min="0"
                step="0.1"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingItem ? 'Update Food Item' : 'Add Food Item'}
              </Button>
              {editingItem && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Food Items ({foodItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {foodItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No food items yet. Add your first food item above! 🍎</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {foodItems.map((item: FoodItem) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        {item.calories_per_100g} cal/100g
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Added {item.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
