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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Info,
  Shield,
} from "lucide-react";

export default function RegulatoryReportsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");
      if (role !== "regulatory") {
        router.push("/login");
        return;
      }
      if (email) {
        setUserEmail(email);
      }
    }
  }, [router]);

  const reports = [
    {
      id: 1,
      type: "counterfeit",
      title: "Counterfeit Alert - Antibiotic X",
      status: "open",
      submitted: "2024-06-01 15:00",
      location: "Lagos",
      reporter: "MedPlus Pharmacy",
      description:
        "Suspected counterfeit batch ABX202405D reported by pharmacist.",
    },
    {
      id: 2,
      type: "compliance",
      title: "Compliance Violation - Cough Syrup",
      status: "resolved",
      submitted: "2024-05-25 10:10",
      location: "Abuja",
      reporter: "City Pharmacy",
      description:
        "Batch CSY202405C found non-compliant with NAFDAC standards.",
    },
    {
      id: 3,
      type: "counterfeit",
      title: "Counterfeit Alert - Vitamin C",
      status: "investigating",
      submitted: "2024-05-20 12:30",
      location: "Port Harcourt",
      reporter: "Health Plus",
      description: "Unusual packaging and failed QR scan for batch VTC202405B.",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Open
          </Badge>
        );
      case "investigating":
        return (
          <Badge className="bg-secondary text-secondary-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Investigating
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "counterfeit":
        return (
          <Badge className="bg-danger text-danger-foreground">
            Counterfeit
          </Badge>
        );
      case "compliance":
        return (
          <Badge className="bg-primary text-primary-foreground">
            Compliance
          </Badge>
        );
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || report.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (id: number) => {
    // In a real app, navigate to a report details page
    alert(`View details for report ID: ${id}`);
  };

  const handleExport = () => {
    // Export reports as CSV
    const csvData = reports.map((report) => ({
      id: report.id,
      type: report.type,
      title: report.title,
      status: report.status,
      submitted: report.submitted,
      location: report.location,
      reporter: report.reporter,
      description: report.description,
    }));
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `regulatory-reports-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isClient) return null;

  return (
    <DashboardLayout userRole="regulatory" userName={userEmail}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">
              Counterfeit and compliance reports submitted by pharmacies
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reports List</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-56"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Click on a report to view more details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReports.length > 0 ? (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(report.id)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.reporter} &bull; {report.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(report.type)}
                      {getStatusBadge(report.status)}
                      <p className="text-xs text-muted-foreground ml-2">
                        {report.submitted}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="mx-auto mb-2 h-8 w-8" />
                No reports found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
