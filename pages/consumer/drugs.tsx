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
  Loader2,
} from "lucide-react";

interface DrugVerification {
  _id: string;
  userEmail: string;
  drugName: string;
  method: string;
  status: string;
  pharmacy?: string;
  createdAt: string;
}

export default function ConsumerDrugsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [drugs, setDrugs] = useState<DrugVerification[]>([]);
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
        fetchDrugVerifications(email);
      }
    }
  }, [router]);

  const fetchDrugVerifications = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/consumer/verifications?userEmail=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch drug verifications');
      }
      
      const data = await response.json();
      setDrugs(data);
    } catch (err) {
      console.error('Error fetching drug verifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drug verifications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "authentic":
      case "verified":
      case "valid":
        return (
          <Badge className="bg-success text-success-foreground">Verified</Badge>
        );
      case "suspicious":
      case "counterfeit":
      case "invalid":
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
    switch (status.toLowerCase()) {
      case "authentic":
      case "verified":
      case "valid":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "suspicious":
      case "counterfeit":
      case "invalid":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      drug.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drug.pharmacy && drug.pharmacy.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === "all" || drug.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (id: string) => {
    // In a real app, navigate to a drug details page
    alert(`View details for drug ID: ${id}`);
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Drugs</h1>
            <p className="text-muted-foreground">
              All drugs you have verified or interacted with
            </p>
          </div>
          <Button 
            onClick={() => fetchDrugVerifications(userEmail)}
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
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Loading drug verifications...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-warning" />
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  onClick={() => fetchDrugVerifications(userEmail)}
                  className="mt-2"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredDrugs.length > 0 ? (
              <div className="space-y-4">
                {filteredDrugs.map((drug) => (
                  <div
                    key={drug._id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(drug._id)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(drug.status)}
                      <div>
                        <p className="font-medium">{drug.drugName}</p>
                        <p className="text-xs text-muted-foreground">
                          {drug.pharmacy && `${drug.pharmacy} • `}Method: {drug.method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(drug.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(drug.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="mx-auto mb-2 h-8 w-8" />
                {drugs.length === 0 ? (
                  <div>
                    <p>No drug verifications found.</p>
                    <p className="text-sm mt-1">Start by scanning a QR code or taking a photo of a drug.</p>
                  </div>
                ) : (
                  <p>No drugs match your search criteria.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
