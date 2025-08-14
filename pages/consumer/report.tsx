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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, Info, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  _id: string;
  userEmail: string;
  drugName: string;
  batchNumber: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export default function ConsumerReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [drugName, setDrugName] = useState("");
  const [batch, setBatch] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");
      if (role !== "consumer") {
        router.push("/login");
        return;
      }
      if (email) {
        setUserEmail(email);
        fetchReports(email);
      }
    }
  }, [router]);

  const fetchReports = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/consumer/reports?userEmail=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!drugName.trim() || !batch.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch('/api/consumer/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          drugName: drugName.trim(),
          batchNumber: batch.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Report Submitted",
          description: "Your report has been submitted successfully.",
        });
        
        // Clear form
        setDrugName("");
        setBatch("");
        setDescription("");
        
        // Refresh reports list
        await fetchReports(userEmail);
      } else {
        throw new Error(result.error || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      toast({
        title: "Submission Failed",
        description: err instanceof Error ? err.message : "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isClient) return null;

  return (
    <DashboardLayout userRole="consumer" userName={userEmail}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Report Suspicious Drug
          </h1>
          <p className="text-muted-foreground">
            Help protect the community by reporting suspicious or counterfeit
            drugs.
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Submit a Report</CardTitle>
            <CardDescription>
              Fill in the details below to report a suspicious drug.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  required
                  placeholder="Drug Name"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  disabled={submitting}
                />
                <Input
                  required
                  placeholder="Batch Number"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <Textarea
                required
                placeholder="Describe the issue (e.g., packaging, seal, QR code, etc.)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
                disabled={submitting}
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Reports</CardTitle>
              <Button 
                onClick={() => fetchReports(userEmail)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Refresh
              </Button>
            </div>
            <CardDescription>
              Track the status of your submitted reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-warning" />
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  onClick={() => fetchReports(userEmail)}
                  className="mt-2"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {report.drugName}{" "}
                        <span className="text-xs text-muted-foreground">
                          Batch: {report.batchNumber}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(report.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="mx-auto mb-2 h-8 w-8" />
                No reports submitted yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
