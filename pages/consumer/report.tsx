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
import { AlertTriangle, CheckCircle, Clock, Info, Shield } from "lucide-react";

export default function ConsumerReportPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [drugName, setDrugName] = useState("");
  const [batch, setBatch] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState([
    {
      id: 1,
      drugName: "Antibiotic X",
      batch: "ABX202405D",
      status: "pending",
      submitted: "2024-06-01 15:00",
      description: "Packaging looked suspicious and QR code did not scan.",
    },
    {
      id: 2,
      drugName: "Cough Syrup",
      batch: "CSY202405C",
      status: "resolved",
      submitted: "2024-05-25 10:10",
      description: "Seal was broken on purchase.",
    },
  ]);

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
      }
    }
  }, [router]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setReports([
        {
          id: reports.length + 1,
          drugName,
          batch,
          status: "pending",
          submitted: new Date().toISOString().slice(0, 16).replace("T", " "),
          description,
        },
        ...reports,
      ]);
      setDrugName("");
      setBatch("");
      setDescription("");
      setSubmitting(false);
    }, 1200);
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
                />
                <Input
                  required
                  placeholder="Batch Number"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                />
              </div>
              <Textarea
                required
                placeholder="Describe the issue (e.g., packaging, seal, QR code, etc.)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>My Reports</CardTitle>
            <CardDescription>
              Track the status of your submitted reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {report.drugName}{" "}
                        <span className="text-xs text-muted-foreground">
                          Batch: {report.batch}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(report.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.submitted}
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
