import { useState } from "react";
import AuthContainer from "../components/auth/AuthContainer";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

export default function AuthPage() {
  const [mode, setMode] = useState("login");

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-primary bg-gradient">
      <AuthContainer mode={mode} setMode={setMode}>
        <div className="alert alert-info py-2 small mb-3">Authly is a portfolio demo. Live login/register requires the backend service to be enabled by the admin.</div>
        {mode === "login" ? <LoginForm /> : <RegisterForm />}
      </AuthContainer>
    </div>
  );
}


