
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Apple, BarChart3 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { FoodManager } from './FoodManager';
import { CalorieTracker } from './CalorieTracker';

export function DashboardTabs() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-700 flex items-center gap-2">
              🥗 CalorieTracker
            </h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tracker" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tracker" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Calorie Tracker
            </TabsTrigger>
            <TabsTrigger value="foods" className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              Food Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracker">
            <CalorieTracker />
          </TabsContent>
          
          <TabsContent value="foods">
            <FoodManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
