import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  Bell,
  HelpCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userRole?: 'manufacturer' | 'pharmacist' | 'consumer' | 'regulatory' | 'admin';
  userName?: string;
  onMenuClick?: () => void;
}

export default function Header({ userRole, userName, onMenuClick }: HeaderProps) {
  const [notifications] = useState(3); // Mock notifications

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'manufacturer': return 'default';
      case 'pharmacist': return 'secondary';
      case 'consumer': return 'outline';
      case 'regulatory': return 'destructive';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'manufacturer': return 'Manufacturer';
      case 'pharmacist': return 'Pharmacist';
      case 'consumer': return 'Consumer';
      case 'regulatory': return 'NAFDAC Officer';
      case 'admin': return 'Administrator';
      default: return 'Guest';
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DrugShield</h1>
              <p className="text-xs text-muted-foreground">Pharmaceutical Authentication</p>
            </div>
          </div>
        </div>

        {/* Center - Status Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">System Operational</span>
        </div>

        {/* Right - User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{userName || 'Guest User'}</p>
                  <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
                    {getRoleDisplayName(userRole)}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}