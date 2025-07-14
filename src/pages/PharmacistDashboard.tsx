import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import PharmacistDashboard from "@/components/Dashboard/PharmacistDashboard";

export default function PharmacistDashboardPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    
    if (role !== 'pharmacist') {
      navigate('/login');
      return;
    }
    
    if (email) {
      setUserEmail(email);
    }
  }, [navigate]);

  return (
    <DashboardLayout userRole="pharmacist" userName={userEmail}>
      <PharmacistDashboard />
    </DashboardLayout>
  );
}