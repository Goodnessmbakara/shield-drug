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
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  Search,
  Download,
} from "lucide-react";

export default function RegulatoryNAFDACPage() {
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

  const drugs = [
    {
      id: 1,
      name: "Antibiotic X",
      batch: "ABX202405D",
      manufacturer: "Pfizer",
      nafdacReg: "NAFDAC/REG/2024/001",
      status: "compliant",
      expiry: "2025-12-31",
      lastChecked: "2024-06-01 15:00",
    },
    {
      id: 2,
      name: "Cough Syrup",
      batch: "CSY202405C",
      manufacturer: "GSK",
      nafdacReg: "NAFDAC/REG/2024/002",
      status: "violation",
      expiry: "2025-09-30",
      lastChecked: "2024-05-25 10:10",
    },
    {
      id: 3,
      name: "Vitamin C",
      batch: "VTC202405B",
      manufacturer: "Swiss Pharma",
      nafdacReg: "NAFDAC/REG/2024/003",
      status: "pending",
      expiry: "2026-03-15",
      lastChecked: "2024-05-20 12:30",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Compliant
          </Badge>
        );
      case "violation":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Violation
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.nafdacReg.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || drug.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (id: number) => {
    // In a real app, navigate to a drug details page
    alert(`View details for drug ID: ${id}`);
  };

  const handleExport = () => {
    // Export drugs as CSV
    const csvData = drugs.map((drug) => ({
      id: drug.id,
      name: drug.name,
      batch: drug.batch,
      manufacturer: drug.manufacturer,
      nafdacReg: drug.nafdacReg,
      status: drug.status,
      expiry: drug.expiry,
      lastChecked: drug.lastChecked,
    }));
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nafdac-drugs-${new Date().toISOString().split("T")[0]}.csv`;
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
            <h1 className="text-3xl font-bold text-foreground">
              NAFDAC Integration
            </h1>
            <p className="text-muted-foreground">
              View and search NAFDAC-registered drugs and compliance status
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
              <CardTitle>Drugs List</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search drugs..."
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
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="violation">Violation</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Click on a drug to view more details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDrugs.length > 0 ? (
              <div className="space-y-4">
                {filteredDrugs.map((drug) => (
                  <div
                    key={drug.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(drug.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{drug.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {drug.manufacturer} &bull; Batch: {drug.batch}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reg: {drug.nafdacReg}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(drug.status)}
                      <p className="text-xs text-muted-foreground ml-2">
                        {drug.lastChecked}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="mx-auto mb-2 h-8 w-8" />
                No drugs found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
