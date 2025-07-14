import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "./Header";
import AppSidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'manufacturer' | 'pharmacist' | 'consumer' | 'regulatory' | 'admin';
  userName?: string;
}

export default function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar userRole={userRole} />
        
        <div className="flex-1 flex flex-col">
          <Header 
            userRole={userRole} 
            userName={userName}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <main className="flex-1 p-6">
            <div className="container mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}