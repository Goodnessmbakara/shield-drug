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
  FileText,
  Search,
  Info,
  QrCode,
  Package,
} from "lucide-react";

export default function ConsumerDrugsPage() {
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
      if (role !== "consumer") {
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
      name: "Paracetamol",
      status: "authentic",
      lastVerified: "2024-06-01 14:30",
      location: "Zuma Pharmacy",
      batch: "PCM202406A",
      manufacturer: "Emzor",
      expiry: "2025-12-31",
      method: "QR Code",
    },
    {
      id: 2,
      name: "Vitamin C",
      status: "authentic",
      lastVerified: "2024-05-28 18:15",
      location: "City Pharmacy",
      batch: "VTC202405B",
      manufacturer: "Swiss Pharma",
      expiry: "2026-03-15",
      method: "Photo",
    },
    {
      id: 3,
      name: "Cough Syrup",
      status: "verified",
      lastVerified: "2024-05-25 10:00",
      location: "Health Plus",
      batch: "CSY202405C",
      manufacturer: "GSK",
      expiry: "2025-09-30",
      method: "QR Code",
    },
    {
      id: 4,
      name: "Antibiotic X",
      status: "suspicious",
      lastVerified: "2024-05-20 16:45",
      location: "MedPlus",
      batch: "ABX202405D",
      manufacturer: "Pfizer",
      expiry: "2025-11-30",
      method: "Photo",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "authentic":
      case "verified":
        return (
          <Badge className="bg-success text-success-foreground">Verified</Badge>
        );
      case "suspicious":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Suspicious
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "authentic":
      case "verified":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || drug.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (id: number) => {
    // In a real app, navigate to a drug details page
    alert(`View details for drug ID: ${id}`);
  };

  if (!isClient) return null;

  return (
    <DashboardLayout userRole="consumer" userName={userEmail}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Drugs</h1>
            <p className="text-muted-foreground">
              All drugs you have verified or interacted with
            </p>
          </div>
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
                    <SelectItem value="authentic">Authentic</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
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
                      {getStatusIcon(drug.status)}
                      <div>
                        <p className="font-medium">{drug.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {drug.manufacturer} &bull; Batch: {drug.batch}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(drug.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {drug.lastVerified}
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
