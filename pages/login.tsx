import { useState } from "react";
import { useRouter } from "next/router";
import LoginForm from "@/components/Auth/LoginForm";

export default function Login() {
  const router = useRouter();

  const handleLogin = (role: string, email: string) => {
    // Store user session (in real app, use proper auth)
    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", role);
      localStorage.setItem("userEmail", email);
    }

    // Redirect to appropriate dashboard
    switch (role) {
      case "manufacturer":
        router.push("/manufacturer");
        break;
      case "pharmacist":
        router.push("/pharmacist");
        break;
      case "consumer":
        router.push("/consumer");
        break;
      case "regulatory":
        router.push("/regulatory");
        break;
      case "admin":
        router.push("/admin");
        break;
      default:
        router.push("/");
    }
  };

  return <LoginForm onLogin={handleLogin} />;
}
