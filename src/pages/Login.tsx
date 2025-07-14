import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/Auth/LoginForm";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (role: string, email: string) => {
    // Store user session (in real app, use proper auth)
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    
    // Redirect to appropriate dashboard
    switch (role) {
      case 'manufacturer':
        navigate('/manufacturer');
        break;
      case 'pharmacist':
        navigate('/pharmacist');
        break;
      case 'consumer':
        navigate('/consumer');
        break;
      case 'regulatory':
        navigate('/regulatory');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  return <LoginForm onLogin={handleLogin} />;
}