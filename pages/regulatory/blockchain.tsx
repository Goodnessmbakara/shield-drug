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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, CheckCircle, AlertTriangle, Clock, Info, Search, Download } from "lucide-react";

export default function RegulatoryBlockchainPage() {
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

  const transactions = [
    {
      id: 1,
      hash: "0x1234abcd...5678",
      status: "confirmed",
      timestamp: "2024-06-01 15:00",
      drug: "Antibiotic X",
      batch: "ABX202405D",
      pharmacy: "MedPlus Pharmacy",
      action: "Verification",
      block: 18472947,
      gasUsed: 45000,
      network: "Ethereum Mainnet",
    },
    {
      id: 2,
      hash: "0x9876efgh...4321",
      status: "pending",
      timestamp: "2024-05-25 10:10",
      drug: "Cough Syrup",
      batch: "CSY202405C",
      pharmacy: "City Pharmacy",
      action: "Verification",
      block: 18472948,
      gasUsed: 42000,
      network: "Ethereum Mainnet",
    },
    {
      id: 3,
      hash: "0xabcd5678...efgh",
      status: "failed",
      timestamp: "2024-05-20 12:30",
      drug: "Vitamin C",
      batch: "VTC202405B",
      pharmacy: "Health Plus",
      action: "Verification",
      block: 18472949,
      gasUsed: 0,
      network: "Ethereum Mainnet",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge className="bg-danger text-danger-foreground"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.drug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.pharmacy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (id: number) => {
    // In a real app, navigate to a transaction details page
    alert(`View details for transaction ID: ${id}`);
  };

  const handleExport = () => {
    // Export transactions as CSV
    const csvData = transactions.map((tx) => ({
      id: tx.id,
      hash: tx.hash,
      status: tx.status,
      timestamp: tx.timestamp,
      drug: tx.drug,
      batch: tx.batch,
      pharmacy: tx.pharmacy,
      action: tx.action,
      block: tx.block,
      gasUsed: tx.gasUsed,
      network: tx.network,
    }));
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blockchain-txs-${new Date().toISOString().split("T")[0]}.csv`;
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
            <h1 className="text-3xl font-bold text-foreground">Blockchain Transactions</h1>
            <p className="text-muted-foreground">View and search blockchain transactions related to drug verification</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transactions List</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search transactions..."
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
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>Click on a transaction to view more details</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTxs.length > 0 ? (
              <div className="space-y-4">
                {filteredTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(tx.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{tx.hash}</p>
                        <p className="text-xs text-muted-foreground">{tx.drug} &bull; {tx.batch} &bull; {tx.pharmacy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(tx.status)}
                      <p className="text-xs text-muted-foreground ml-2">{tx.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="mx-auto mb-2 h-8 w-8" />
                No transactions found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 