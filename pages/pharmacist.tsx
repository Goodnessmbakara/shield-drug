import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import PharmacistDashboard from "@/components/Dashboard/PharmacistDashboard";

export default function PharmacistDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");

      if (role !== "pharmacist") {
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
    <DashboardLayout userRole="pharmacist" userName={userEmail}>
      <PharmacistDashboard />
    </DashboardLayout>
  );
}
