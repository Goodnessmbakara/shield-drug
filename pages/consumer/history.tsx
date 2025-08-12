import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { FileText, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Verification {
  status: string;
  drugName: string;
  method: string;
  createdAt: string;
}

export default function ConsumerHistoryPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Get user info from localStorage or context (for navbar)
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserEmail(localStorage.getItem("userEmail") || "Consumer");
      setUserName(localStorage.getItem("userName") || "");
    }
    async function fetchVerifications() {
      try {
        const res = await fetch("/api/consumer/verifications");
        if (!res.ok) throw new Error("Failed to fetch verification history");
        const data = await res.json();
        setVerifications(data);
      } catch (error) {
        toast.toast({
          title: "Error",
          description: "Unable to load verification history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchVerifications();
  }, [toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-700">Verified</Badge>;
      case "suspicious":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">Suspicious</Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <DashboardLayout userRole="consumer" userName={userEmail}>
      <div className="max-w-3xl mx-auto py-8">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Verification History
            </CardTitle>
            <CardDescription>
              Your medication verification history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : verifications.length === 0 ? (
              <div className="text-gray-500">
                No verification history found.
              </div>
            ) : (
              <div className="space-y-4">
                {verifications.map((verification, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors touch-hover"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(verification.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {verification.drugName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {verification.method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      {getStatusBadge(verification.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(verification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
