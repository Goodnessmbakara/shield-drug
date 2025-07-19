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
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  Search,
  Download,
} from "lucide-react";

export default function RegulatoryManufacturersPage() {
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

  const manufacturers = [
    {
      id: 1,
      name: "Pfizer",
      status: "compliant",
      registeredDrugs: 45,
      lastAudit: "2024-05-15",
      location: "Lagos",
      contact: "info@pfizer.ng",
      phone: "+234-1-234-5678",
    },
    {
      id: 2,
      name: "GSK",
      status: "violation",
      registeredDrugs: 32,
      lastAudit: "2024-04-20",
      location: "Abuja",
      contact: "info@gsk.ng",
      phone: "+234-9-876-5432",
    },
    {
      id: 3,
      name: "Swiss Pharma",
      status: "pending",
      registeredDrugs: 18,
      lastAudit: "2024-03-10",
      location: "Port Harcourt",
      contact: "info@swisspharma.ng",
      phone: "+234-84-123-4567",
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

  const filteredManufacturers = manufacturers.filter((manufacturer) => {
    const matchesSearch =
      manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || manufacturer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (id: number) => {
    // In a real app, navigate to a manufacturer details page
    alert(`View details for manufacturer ID: ${id}`);
  };

  const handleExport = () => {
    // Export manufacturers as CSV
    const csvData = manufacturers.map((manufacturer) => ({
      id: manufacturer.id,
      name: manufacturer.name,
      status: manufacturer.status,
      registeredDrugs: manufacturer.registeredDrugs,
      lastAudit: manufacturer.lastAudit,
      location: manufacturer.location,
      contact: manufacturer.contact,
      phone: manufacturer.phone,
    }));
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manufacturers-${new Date().toISOString().split("T")[0]}.csv`;
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
              Manufacturers
            </h1>
            <p className="text-muted-foreground">
              View and manage registered pharmaceutical manufacturers
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
              <CardTitle>Manufacturers List</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search manufacturers..."
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
              Click on a manufacturer to view more details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredManufacturers.length > 0 ? (
              <div className="space-y-4">
                {filteredManufacturers.map((manufacturer) => (
                  <div
                    key={manufacturer.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(manufacturer.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{manufacturer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {manufacturer.location} &bull;{" "}
                          {manufacturer.registeredDrugs} drugs
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {manufacturer.contact} &bull; {manufacturer.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(manufacturer.status)}
                      <p className="text-xs text-muted-foreground ml-2">
                        Last audit: {manufacturer.lastAudit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="mx-auto mb-2 h-8 w-8" />
                No manufacturers found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
