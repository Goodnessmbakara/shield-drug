import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import ManufacturerDashboard from "@/components/Dashboard/ManufacturerDashboard";

export default function ManufacturerDashboardPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    
    if (role !== 'manufacturer') {
      navigate('/login');
      return;
    }
    
    if (email) {
      setUserEmail(email);
    }
  }, [navigate]);

  return (
    <DashboardLayout userRole="manufacturer" userName={userEmail}>
      <ManufacturerDashboard />
    </DashboardLayout>
  );
}