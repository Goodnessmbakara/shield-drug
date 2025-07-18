import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import RegulatoryDashboard from "@/components/Dashboard/RegulatoryDashboard";

export default function RegulatoryDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

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

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  return (
    <DashboardLayout userRole="regulatory" userName={userEmail}>
      <RegulatoryDashboard />
    </DashboardLayout>
  );
}
