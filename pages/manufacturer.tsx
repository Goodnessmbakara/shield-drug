import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import ManufacturerDashboard from "@/components/Dashboard/ManufacturerDashboard";

export default function ManufacturerDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");

      if (role !== "manufacturer") {
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
    <DashboardLayout userRole="manufacturer" userName={userEmail}>
      <ManufacturerDashboard />
    </DashboardLayout>
  );
}
