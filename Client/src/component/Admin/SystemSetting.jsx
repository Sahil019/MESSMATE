import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, RotateCcw } from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    breakfastTime: '08:00',
    lunchTime: '12:00',
    dinnerTime: '18:00',
    breakfastRate: '50',
    lunchRate: '70',
    dinnerRate: '80',
    cutoffTime: '22:00',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality (e.g., API call)
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    setSettings({
      breakfastTime: '08:00',
      lunchTime: '12:00',
      dinnerTime: '18:00',
      breakfastRate: '50',
      lunchRate: '70',
      dinnerRate: '80',
      cutoffTime: '22:00',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">System Settings</h1>
        <p className="page-description">
          Configure meal times, rates, and cut-off settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Meal Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Meal Times</h3>
              <div className="space-y-2">
                <Label htmlFor="breakfastTime">Breakfast Time</Label>
                <Input
                  id="breakfastTime"
                  name="breakfastTime"
                  type="time"
                  value={settings.breakfastTime}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchTime">Lunch Time</Label>
                <Input
                  id="lunchTime"
                  name="lunchTime"
                  type="time"
                  value={settings.lunchTime}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dinnerTime">Dinner Time</Label>
                <Input
                  id="dinnerTime"
                  name="dinnerTime"
                  type="time"
                  value={settings.dinnerTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Meal Rates (₹)</h3>
              <div className="space-y-2">
                <Label htmlFor="breakfastRate">Breakfast Rate</Label>
                <Input
                  id="breakfastRate"
                  name="breakfastRate"
                  type="number"
                  value={settings.breakfastRate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchRate">Lunch Rate</Label>
                <Input
                  id="lunchRate"
                  name="lunchRate"
                  type="number"
                  value={settings.lunchRate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dinnerRate">Dinner Rate</Label>
                <Input
                  id="dinnerRate"
                  name="dinnerRate"
                  type="number"
                  value={settings.dinnerRate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cut-off Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="cutoffTime">Daily Cut-off Time</Label>
              <Input
                id="cutoffTime"
                name="cutoffTime"
                type="time"
                value={settings.cutoffTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
