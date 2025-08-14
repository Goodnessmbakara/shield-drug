import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Save,
  Shield,
  Database,
  Bell,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Relevant Settings for DrugShield
  const [settings, setSettings] = useState({
    system: {
      siteName: "DrugShield",
      maintenanceMode: false,
      debugMode: false,
    },
    security: {
      auditLogging: true,
      rateLimiting: true,
    },
    blockchain: {
      blockchainNetwork: "ethereum",
      contractAddress: "0x1234567890abcdef",
    },
    notifications: {
      emailNotifications: true,
      reportAlerts: true,
    }
  });

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");
      if (role !== "admin") {
        router.push("/login");
        return;
      }
      if (email) {
        setUserEmail(email);
      }
    }
  }, [router]);

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      if (!userEmail) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/admin/settings', {
          headers: {
            'x-user-role': 'admin',
            'x-user-email': userEmail
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Merge with defaults
          setSettings(prev => ({
            system: { ...prev.system, ...data.system },
            security: { ...prev.security, ...data.security },
            blockchain: { ...prev.blockchain, ...data.blockchain },
            notifications: { ...prev.notifications, ...data.notifications }
          }));
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch settings (${response.status})`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
        setError(errorMessage);
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [userEmail]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-user-email': userEmail
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      setSettings({
        system: {
          siteName: "DrugShield",
          maintenanceMode: false,
          debugMode: false,
        },
        security: {
          auditLogging: true,
          rateLimiting: true,
        },
        blockchain: {
          blockchainNetwork: "ethereum",
          contractAddress: "0x1234567890abcdef",
        },
        notifications: {
          emailNotifications: true,
          reportAlerts: true,
        }
      });
    }
  };

  if (!isClient) return null;

  if (isLoading) {
    return (
      <DashboardLayout userRole="admin" userName={userEmail}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="admin" userName={userEmail}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin" userName={userEmail}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              System Settings
            </h1>
            <p className="text-muted-foreground">
              Configure DrugShield platform settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetSettings}>
              Reset to Default
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {/* System Settings */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.system.siteName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    system: { ...settings.system, siteName: e.target.value }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable the system for maintenance
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.system.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    system: { ...settings.system, maintenanceMode: checked }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="debugMode">Debug Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable detailed error logging
                </p>
              </div>
              <Switch
                id="debugMode"
                checked={settings.system.debugMode}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    system: { ...settings.system, debugMode: checked }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure security and monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auditLogging">Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log all user actions and API calls
                </p>
              </div>
              <Switch
                id="auditLogging"
                checked={settings.security.auditLogging}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    security: { ...settings.security, auditLogging: checked }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rateLimiting">Rate Limiting</Label>
                <p className="text-sm text-muted-foreground">
                  Limit API requests per user to prevent abuse
                </p>
              </div>
              <Switch
                id="rateLimiting"
                checked={settings.security.rateLimiting}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    security: { ...settings.security, rateLimiting: checked }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Settings */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Settings
            </CardTitle>
            <CardDescription>
              Configure blockchain network for drug verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="blockchainNetwork">Network</Label>
              <Select
                value={settings.blockchain.blockchainNetwork}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    blockchain: { ...settings.blockchain, blockchainNetwork: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum Mainnet</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                  <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                  <SelectItem value="testnet">Testnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input
                id="contractAddress"
                value={settings.blockchain.contractAddress}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    blockchain: { ...settings.blockchain, contractAddress: e.target.value }
                  })
                }
                placeholder="0x..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure system notifications for drug safety
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via email for reports and alerts
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailNotifications: checked }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reportAlerts">Report Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about new drug reports and safety issues
                </p>
              </div>
              <Switch
                id="reportAlerts"
                checked={settings.notifications.reportAlerts}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, reportAlerts: checked }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
