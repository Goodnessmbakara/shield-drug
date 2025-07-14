import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import ConsumerDashboard from "@/components/Dashboard/ConsumerDashboard";

export default function ConsumerDashboardPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    
    if (role !== 'consumer') {
      navigate('/login');
      return;
    }
    
    if (email) {
      setUserEmail(email);
    }
  }, [navigate]);

  return (
    <DashboardLayout userRole="consumer" userName={userEmail}>
      <ConsumerDashboard />
    </DashboardLayout>
  );
}