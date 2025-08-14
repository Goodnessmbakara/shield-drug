import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, ArrowLeft, Home, AlertCircle } from "lucide-react";
import Logo from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

interface LoginFormProps {
  onLogin: (role: string, email: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Login Successful",
          description: `Welcome to DrugShield, ${role}!`,
        });
        
        // Store user session
        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", data.user.role);
          localStorage.setItem("userEmail", data.user.email);
          localStorage.setItem("userCompany", data.user.companyName || "");
          localStorage.setItem("userLicense", data.user.nafdacLicenseNumber || "");
        }
        
        onLogin(data.user.role, data.user.email);
      } else {
        // Handle specific error cases
        if (data.error === 'INVALID_PASSWORD') {
          toast({
            title: "Invalid Password",
            description: "Wrong password. Use 'forgot password' to reset.",
            variant: "destructive",
          });
          setShowForgotPassword(true);
        } else if (data.error === 'ROLE_MISMATCH') {
          toast({
            title: "Role Mismatch",
            description: `Please select the correct role: ${data.correctRole}`,
            variant: "destructive",
          });
          setRole(data.correctRole);
        } else if (data.error === 'ACCOUNT_DISABLED') {
          toast({
            title: "Account Disabled",
            description: data.message,
            variant: "destructive",
          });
        } else if (data.error === 'USER_NOT_FOUND') {
          // Create new user automatically
          toast({
            title: "New User Created",
            description: `Welcome! Your account has been created with role: ${role}`,
          });
          
          // Store user session for new user
          if (typeof window !== "undefined") {
            localStorage.setItem("userRole", role);
            localStorage.setItem("userEmail", email);
          }
          
          onLogin(role, email);
        } else {
          toast({
            title: "Login Failed",
            description: data.message || "An error occurred during login.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. Please login with your new password.",
        });
        setShowForgotPassword(false);
        setNewPassword("");
        setConfirmPassword("");
        setPassword("");
      } else {
        toast({
          title: "Password Reset Failed",
          description: data.message || "Failed to reset password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Password Reset Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4 relative">
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        <Home className="h-4 w-4" />
        Back to Home
      </Button>

      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl text-center">
            {showForgotPassword ? "Reset Password" : "DrugShield Login"}
          </CardTitle>
          <CardDescription className="text-center">
            {showForgotPassword 
              ? "Enter your new password to reset your account"
              : "Secure access to pharmaceutical authentication system"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!showForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="consumer">Consumer</SelectItem>
                    <SelectItem value="regulatory">NAFDAC Officer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="hero"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>Secure authentication powered by blockchain technology</p>
                <p className="text-xs mt-1">
                  NAFDAC MAS Compliant • EU FMD Compatible
                </p>
              </div>

              <div className="text-center pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => router.push("/")}
                >
                  <Home className="h-3 w-3 mr-1" />
                  Back to Home
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Password Reset</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Enter a new password for your account. You cannot change your role during this process.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBackToLogin}
                  disabled={isResettingPassword}
                >
                  Back to Login
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  variant="hero"
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
