import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Utensils,
  Star,
  CheckCircle,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';

const Menu = () => {
  const { user, getAuthToken, refreshUser } = useAuth();
  const { toast } = useToast();

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch selected package on component load
  useEffect(() => {
    const fetchSelectedPackage = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch('http://localhost:3000/api/menu/selected-package', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedPackage(data.selectedPackage);
        }
      } catch (error) {
        console.error('Error fetching selected package:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchSelectedPackage();
  }, [getAuthToken]);

  // Mock menu data - in production, this would come from API
  const menuPackages = [
    {
      id: 'basic',
      name: 'Basic Package',
      price: 2500,
      description: 'Essential vegetarian meals for daily needs',
      meals: {
        breakfast: [
          { name: 'Idli with Sambar', rating: 4.2 },
          { name: 'Poha', rating: 4.0 },
          { name: 'Upma', rating: 3.8 }
        ],
        lunch: [
          { name: 'Dal Rice', rating: 4.5 },
          { name: 'Rajma Chawal', rating: 4.3 },
          { name: 'Chole Bhature', rating: 4.1 }
        ],
        dinner: [
          { name: 'Aloo Gobi with Roti', rating: 4.0 },
          { name: 'Paneer Tikka Masala', rating: 4.4 },
          { name: 'Mixed Vegetable Curry', rating: 3.9 }
        ]
      }
    },
    {
      id: 'premium',
      name: 'Premium Package',
      price: 3500,
      description: 'Enhanced vegetarian meals with special dishes',
      meals: {
        breakfast: [
          { name: 'Masala Dosa', rating: 4.6 },
          { name: 'Cheese Sandwich', rating: 4.1 },
          { name: 'Pav Bhaji', rating: 4.3 }
        ],
        lunch: [
          { name: 'Biryani (Veg)', rating: 4.7 },
          { name: 'Butter Panner  with Naan', rating: 4.5 },
          { name: 'Palak Paneer', rating: 4.2 }
        ],
        dinner: [
          { name: 'Shahi Paneer', rating: 4.8 },
          { name: 'Malai Kofta', rating: 4.4 },
          { name: 'Kadai Vegetable', rating: 4.1 }
        ]
      }
    },
    {
      id: 'deluxe',
      name: 'Deluxe Package',
      price: 4500,
      description: 'Premium vegetarian cuisine with gourmet options',
      meals: {
        breakfast: [
          { name: 'Cheese Sandwich', rating: 4.3 },
          { name: 'Pav Bhaji', rating: 4.4 },
          { name: 'Vada Pav', rating: 4.2 }
        ],
        lunch: [
          { name: 'Paneer Butter Masala', rating: 4.6 },
          { name: 'Veg Biryani', rating: 4.5 },
          { name: 'Dal Makhani', rating: 4.3 }
        ],
        dinner: [
          { name: 'Shahi Paneer', rating: 4.7 },
          { name: 'Malai Kofta', rating: 4.5 },
          { name: 'Kadai Paneer', rating: 4.4 }
        ]
      }
    }
  ];

  const handlePackageSelect = async (packageId) => {
    setIsLoading(true);

    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:3000/api/menu/select-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPackage(packageId);

        toast({
          title: 'Package Selected',
          description: `You have selected the ${menuPackages.find(p => p.id === packageId)?.name}. Your monthly bill has been updated to ₹${data.monthlyBill}.`,
        });

        // Refresh user data after successful package selection
        await refreshUser();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to select package',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error selecting package:', error);
      toast({
        title: 'Error',
        description: 'Failed to select package. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMealSection = (mealType, meals, icon) => {
    const IconComponent = icon;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5 text-primary" />
          <h4 className="font-bold capitalize">{mealType}</h4>
        </div>

        <div className="space-y-2">
          {meals.map((meal, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">{meal.name}</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{meal.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Utensils className="w-6 h-6" />
          Indian Vegetarian Menu
        </h1>
        <p className="page-description">
          Choose your preferred mess package and explore our delicious vegetarian meals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative transition-all duration-200 hover:shadow-lg ${
              selectedPackage === pkg.id
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            {selectedPackage === pkg.id && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <CardDescription className="mt-1">{pkg.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  ₹{pkg.price}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {renderMealSection('breakfast', pkg.meals.breakfast, Coffee)}
              {renderMealSection('lunch', pkg.meals.lunch, Sun)}
              {renderMealSection('dinner', pkg.meals.dinner, Moon)}

              <Button
                onClick={() => handlePackageSelect(pkg.id)}
                disabled={isLoading}
                className="w-full mt-4"
                variant={selectedPackage === pkg.id ? "default" : "outline"}
              >
                {isLoading ? 'Selecting...' : selectedPackage === pkg.id ? 'Selected' : 'Select Package'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPackage && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {menuPackages.find(p => p.id === selectedPackage)?.name} Selected!
              </h3>
              <p className="text-muted-foreground">
                Your meal preferences have been saved. You can change your package anytime.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Menu;
