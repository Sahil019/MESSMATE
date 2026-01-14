import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

// Views
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { MealAttendance } from '@/components/student/MealAttendance';
import { LeaveRequests } from '@/components/student/LeaveRequests';
import { StudentBilling } from '@/components/student/StudentBilling';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { DailyReports } from '@/components/admin/DailyReports';
import { LeaveManagement } from '@/components/admin/LeaveManagement';
import { BillingManagement } from '@/components/admin/BillingManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';

export const MainLayout = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { userRole } = useAuth();

  const isAdmin = userRole === 'mess_admin' || userRole === 'super_admin';

  const renderView = () => {
    if (isAdmin) {
      switch (currentView) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'reports':
          return <DailyReports />;
        case 'leave':
          return <LeaveManagement />;
        case 'billing':
          return <BillingManagement />;
        case 'users':
          return <UserManagement />;
        case 'settings':
          return <SystemSettings />;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (currentView) {
        case 'dashboard':
          return <StudentDashboard />;
        case 'attendance':
          return <MealAttendance />;
        case 'leave':
          return <LeaveRequests />;
        case 'billing':
          return <StudentBilling />;
        default:
          return <StudentDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="p-6 lg:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};