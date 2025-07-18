import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  Package,
  QrCode,
  ScanLine,
  Users,
  AlertTriangle,
  Database,
  Settings,
  FileText,
  Shield,
  Activity,
  Upload,
  BarChart3,
  UserCheck,
  Building,
} from "lucide-react";

interface SidebarProps {
  userRole: "manufacturer" | "pharmacist" | "consumer" | "regulatory" | "admin";
}

export default function AppSidebar({ userRole }: SidebarProps) {
  const router = useRouter();

  const getMenuItems = () => {
    switch (userRole) {
      case "manufacturer":
        return [
          { title: "Dashboard", url: "/manufacturer", icon: Home },
          {
            title: "Batch Management",
            url: "/manufacturer/batches",
            icon: Package,
          },
          {
            title: "QR Generation",
            url: "/manufacturer/qr-codes",
            icon: QrCode,
          },
          { title: "Upload Data", url: "/manufacturer/upload", icon: Upload },
          {
            title: "Analytics",
            url: "/manufacturer/analytics",
            icon: BarChart3,
          },
        ];

      case "pharmacist":
        return [
          { title: "Dashboard", url: "/pharmacist", icon: Home },
          { title: "Inventory", url: "/pharmacist/inventory", icon: Package },
          { title: "Scan Drugs", url: "/pharmacist/scan", icon: ScanLine },
          {
            title: "Report Issues",
            url: "/pharmacist/reports",
            icon: AlertTriangle,
          },
          {
            title: "Verification History",
            url: "/pharmacist/history",
            icon: FileText,
          },
        ];

      case "consumer":
        return [
          { title: "Scan Drug", url: "/consumer", icon: ScanLine },
          { title: "My Scans", url: "/consumer/history", icon: FileText },
          { title: "Drug Information", url: "/consumer/drugs", icon: Package },
          {
            title: "Report Issue",
            url: "/consumer/report",
            icon: AlertTriangle,
          },
        ];

      case "regulatory":
        return [
          { title: "Dashboard", url: "/regulatory", icon: Home },
          {
            title: "Counterfeit Reports",
            url: "/regulatory/reports",
            icon: AlertTriangle,
          },
          {
            title: "Blockchain Query",
            url: "/regulatory/blockchain",
            icon: Database,
          },
          {
            title: "NAFDAC Integration",
            url: "/regulatory/nafdac",
            icon: Shield,
          },
          { title: "Analytics", url: "/regulatory/analytics", icon: BarChart3 },
          {
            title: "Manufacturers",
            url: "/regulatory/manufacturers",
            icon: Building,
          },
        ];

      case "admin":
        return [
          { title: "Dashboard", url: "/admin", icon: Home },
          { title: "User Management", url: "/admin/users", icon: Users },
          { title: "System Health", url: "/admin/health", icon: Activity },
          { title: "Settings", url: "/admin/settings", icon: Settings },
          { title: "Audit Logs", url: "/admin/logs", icon: FileText },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const isActive = (path: string) => router.pathname === path;

  return (
    <Sidebar className="w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                        isActive(item.url)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
