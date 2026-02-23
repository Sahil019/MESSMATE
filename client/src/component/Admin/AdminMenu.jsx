import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Utensils,
  Star,
  Edit,
  Plus,
  Trash2,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';

const AdminMenu = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const descriptionColor = 'oklch(0.21 0.01 0)';

  const [menuPackages, setMenuPackages] = useState([
    {
      id: 'basic',
      name: 'Basic Package',
      price: 2500,
      description: 'Enhanced vegetarian meals with special dishes',
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
          { name: 'Butter Chicken with Naan', rating: 4.5 },
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
      description: 'Enhanced vegetarian meals with special dishes',
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
  ]);

  const [editingPackage, setEditingPackage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newPackage, setNewPackage] = useState({
    name: '',
    price: '',
    description: '',
    breakfast: [''],
    lunch: [''],
    dinner: ['']
  });

  const handleSavePackage = async () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (editingPackage) {
        const updatedPkg = {
          ...editingPackage,
          name: newPackage.name,
          price: Number(newPackage.price),
          description: newPackage.description,
          meals: {
            breakfast: newPackage.breakfast.filter(m => m.trim()).map(name => ({ name, rating: 4.0 })),
            lunch: newPackage.lunch.filter(m => m.trim()).map(name => ({ name, rating: 4.0 })),
            dinner: newPackage.dinner.filter(m => m.trim()).map(name => ({ name, rating: 4.0 }))
          }
        };
        setMenuPackages(prev => prev.map(pkg =>
          pkg.id === editingPackage.id ? updatedPkg : pkg
        ));
        setEditingPackage(null);
        toast({
          title: 'Package Updated',
          description: 'Menu package has been updated successfully',
        });
      } else {
        const packageId = `package_${Date.now()}`;
        const newPkg = {
          ...newPackage,
          id: packageId,
          price: Number(newPackage.price),
          meals: {
            breakfast: newPackage.breakfast.filter(m => m.trim()).map(name => ({ name, rating: 4.0 })),
            lunch: newPackage.lunch.filter(m => m.trim()).map(name => ({ name, rating: 4.0 })),
            dinner: newPackage.dinner.filter(m => m.trim()).map(name => ({ name, rating: 4.0 }))
          }
        };
        setMenuPackages(prev => [...prev, newPkg]);
        toast({
          title: 'Package Added',
          description: 'New menu package has been added successfully',
        });
      }
      setNewPackage({
        name: '',
        price: '',
        description: '',
        breakfast: [''],
        lunch: [''],
        dinner: ['']
      });
      setShowAddForm(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleDeletePackage = async (packageId) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setMenuPackages(prev => prev.filter(pkg => pkg.id !== packageId));
      setIsLoading(false);
      toast({
        title: 'Package Deleted',
        description: 'Menu package has been removed successfully',
      });
    }, 500);
  };

  const addMealItem = (mealType) => {
    setNewPackage(prev => ({
      ...prev,
      [mealType]: [...prev[mealType], '']
    }));
  };

  const updateMealItem = (mealType, index, value) => {
    setNewPackage(prev => ({
      ...prev,
      [mealType]: prev[mealType].map((item, i) => i === index ? value : item)
    }));
  };

  const removeMealItem = (mealType, index) => {
    setNewPackage(prev => ({
      ...prev,
      [mealType]: prev[mealType].filter((_, i) => i !== index)
    }));
  };

  const renderMealSection = (mealType, meals, icon, editable = false, packageId = null) => {
    const IconComponent = icon;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5 text-primary" />
          <h4 className="font-semibold capitalize">{mealType}</h4>
        </div>

        <div className="space-y-2">
          {meals.map((meal, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">{meal.name || meal}</span>
              <div className="flex items-center gap-2">
                {meal.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{meal.rating}</span>
                  </div>
                )}
                {editable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMealItem(mealType, index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {editable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addMealItem(mealType)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {mealType} item
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Utensils className="w-6 h-6" />
            Menu Management
          </h1>
          <p className="page-description">
            Manage mess packages and meal options for students
          </p>
        </div>

        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Package
        </Button>
      </div>

      {showAddForm && (
        <Card className="animate-slide-up border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Add New Package</CardTitle>
            <CardDescription>
              Create a new mess package with meal options
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name</Label>
                <Input
                  id="packageName"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Package"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="packagePrice">Price (₹)</Label>
                <Input
                  id="packagePrice"
                  type="number"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g., 3500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="packageDescription">Description</Label>
              <Textarea
                id="packageDescription"
                value={newPackage.description}
                onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the package"
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label>Breakfast Items</Label>
                {newPackage.breakfast.map((item, index) => (
                  <Input
                    key={index}
                    value={item}
                    onChange={(e) => updateMealItem('breakfast', index, e.target.value)}
                    placeholder="e.g., Masala Dosa"
                    className="mt-2"
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMealItem('breakfast')}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Breakfast Item
                </Button>
              </div>

              <div>
                <Label>Lunch Items</Label>
                {newPackage.lunch.map((item, index) => (
                  <Input
                    key={index}
                    value={item}
                    onChange={(e) => updateMealItem('lunch', index, e.target.value)}
                    placeholder="e.g., Veg Biryani"
                    className="mt-2"
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMealItem('lunch')}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lunch Item
                </Button>
              </div>

              <div>
                <Label>Dinner Items</Label>
                {newPackage.dinner.map((item, index) => (
                  <Input
                    key={index}
                    value={item}
                    onChange={(e) => updateMealItem('dinner', index, e.target.value)}
                    placeholder="e.g., Shahi Paneer"
                    className="mt-2"
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMealItem('dinner')}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Dinner Item
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSavePackage} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Package'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className="relative transition-all duration-200 hover:shadow-lg"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <CardDescription
                    className="mt-1"
                    style={{ color: descriptionColor }}
                  >
                    {pkg.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg font-bold">
                    ₹{pkg.price}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setNewPackage({
                          name: pkg.name,
                          price: pkg.price.toString(),
                          description: pkg.description,
                          breakfast: pkg.meals.breakfast.map(m => m.name),
                          lunch: pkg.meals.lunch.map(m => m.name),
                          dinner: pkg.meals.dinner.map(m => m.name)
                        });
                        setShowAddForm(true);
                      }}
                      className="h-10 w-10 p-0"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePackage(pkg.id)}
                      disabled={isLoading}
                      className="h-10 w-10 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {renderMealSection('breakfast', pkg.meals.breakfast, Coffee)}
              {renderMealSection('lunch', pkg.meals.lunch, Sun)}
              {renderMealSection('dinner', pkg.meals.dinner, Moon)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminMenu;
