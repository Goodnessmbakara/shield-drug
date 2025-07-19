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
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Save,
  Shield,
  Database,
  Bell,
  Globe,
  Key,
} from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [saving, setSaving] = useState(false);

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    siteName: "DrugShield",
    siteDescription: "Pharmaceutical Authentication Platform",
    maintenanceMode: false,
    debugMode: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordPolicy: "strong",
    ipWhitelist: "",
    sslEnforcement: true,
    rateLimiting: true,
    auditLogging: true,
  });

  // Blockchain Settings
  const [blockchainSettings, setBlockchainSettings] = useState({
    network: "ethereum",
    contractAddress: "0x1234567890abcdef",
    gasLimit: 300000,
    confirmations: 12,
    autoSync: true,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    securityAlerts: true,
    systemAlerts: true,
    reportAlerts: true,
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

  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 1500);
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      // Reset to default values
      setSystemSettings({
        siteName: "DrugShield",
        siteDescription: "Pharmaceutical Authentication Platform",
        maintenanceMode: false,
        debugMode: false,
        maxLoginAttempts: 5,
        sessionTimeout: 30,
      });
      setSecuritySettings({
        twoFactorAuth: true,
        passwordPolicy: "strong",
        ipWhitelist: "",
        sslEnforcement: true,
        rateLimiting: true,
        auditLogging: true,
      });
      setBlockchainSettings({
        network: "ethereum",
        contractAddress: "0x1234567890abcdef",
        gasLimit: 300000,
        confirmations: 12,
        autoSync: true,
      });
      setNotificationSettings({
        emailNotifications: true,
        smsNotifications: false,
        securityAlerts: true,
        systemAlerts: true,
        reportAlerts: true,
      });
    }
  };

  if (!isClient) return null;

  return (
    <DashboardLayout userRole="admin" userName={userEmail}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              System Settings
            </h1>
            <p className="text-muted-foreground">
              Configure system preferences and security settings
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={systemSettings.siteName}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      siteName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Input
                  id="siteDescription"
                  value={systemSettings.siteDescription}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      siteDescription: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={systemSettings.maxLoginAttempts}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      maxLoginAttempts: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="sessionTimeout">
                  Session Timeout (minutes)
                </Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                />
              </div>
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
                checked={systemSettings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSystemSettings({
                    ...systemSettings,
                    maintenanceMode: checked,
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
                checked={systemSettings.debugMode}
                onCheckedChange={(checked) =>
                  setSystemSettings({ ...systemSettings, debugMode: checked })
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
              Configure security and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all users
                </p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) =>
                  setSecuritySettings({
                    ...securitySettings,
                    twoFactorAuth: checked,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="passwordPolicy">Password Policy</Label>
              <Select
                value={securitySettings.passwordPolicy}
                onValueChange={(value) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordPolicy: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weak">Weak (6+ characters)</SelectItem>
                  <SelectItem value="medium">
                    Medium (8+ characters, mixed case)
                  </SelectItem>
                  <SelectItem value="strong">
                    Strong (10+ characters, symbols, numbers)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ipWhitelist">IP Whitelist</Label>
              <Textarea
                id="ipWhitelist"
                placeholder="Enter IP addresses (one per line)"
                value={securitySettings.ipWhitelist}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    ipWhitelist: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sslEnforcement">SSL Enforcement</Label>
                <p className="text-sm text-muted-foreground">
                  Force HTTPS connections
                </p>
              </div>
              <Switch
                id="sslEnforcement"
                checked={securitySettings.sslEnforcement}
                onCheckedChange={(checked) =>
                  setSecuritySettings({
                    ...securitySettings,
                    sslEnforcement: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rateLimiting">Rate Limiting</Label>
                <p className="text-sm text-muted-foreground">
                  Limit API requests per user
                </p>
              </div>
              <Switch
                id="rateLimiting"
                checked={securitySettings.rateLimiting}
                onCheckedChange={(checked) =>
                  setSecuritySettings({
                    ...securitySettings,
                    rateLimiting: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auditLogging">Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log all user actions
                </p>
              </div>
              <Switch
                id="auditLogging"
                checked={securitySettings.auditLogging}
                onCheckedChange={(checked) =>
                  setSecuritySettings({
                    ...securitySettings,
                    auditLogging: checked,
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
              Configure blockchain network and contract settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="network">Network</Label>
              <Select
                value={blockchainSettings.network}
                onValueChange={(value) =>
                  setBlockchainSettings({
                    ...blockchainSettings,
                    network: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum Mainnet</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                  <SelectItem value="testnet">Testnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input
                id="contractAddress"
                value={blockchainSettings.contractAddress}
                onChange={(e) =>
                  setBlockchainSettings({
                    ...blockchainSettings,
                    contractAddress: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gasLimit">Gas Limit</Label>
                <Input
                  id="gasLimit"
                  type="number"
                  value={blockchainSettings.gasLimit}
                  onChange={(e) =>
                    setBlockchainSettings({
                      ...blockchainSettings,
                      gasLimit: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="confirmations">Confirmations</Label>
                <Input
                  id="confirmations"
                  type="number"
                  value={blockchainSettings.confirmations}
                  onChange={(e) =>
                    setBlockchainSettings({
                      ...blockchainSettings,
                      confirmations: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoSync">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync blockchain data
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={blockchainSettings.autoSync}
                onCheckedChange={(checked) =>
                  setBlockchainSettings({
                    ...blockchainSettings,
                    autoSync: checked,
                  })
                }
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
              Configure system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via email
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailNotifications: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via SMS
                </p>
              </div>
              <Switch
                id="smsNotifications"
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    smsNotifications: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="securityAlerts">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about security events
                </p>
              </div>
              <Switch
                id="securityAlerts"
                checked={notificationSettings.securityAlerts}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    securityAlerts: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemAlerts">System Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about system issues
                </p>
              </div>
              <Switch
                id="systemAlerts"
                checked={notificationSettings.systemAlerts}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    systemAlerts: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reportAlerts">Report Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about new reports
                </p>
              </div>
              <Switch
                id="reportAlerts"
                checked={notificationSettings.reportAlerts}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    reportAlerts: checked,
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
