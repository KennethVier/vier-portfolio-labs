import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import authApiService from "../api/AuthApiService";

export default function PrivateRoute({ children }) {
  const [status, setStatus] = useState(
    authApiService.isDemoSession() ? "authenticated" : "checking"
  );

  useEffect(() => {
    if (authApiService.isDemoSession()) return;

    if (!authApiService.isAuthenticated()) {
      setStatus("unauthenticated");
      return;
    }

    let active = true;
    authApiService.getMe()
      .then((user) => {
        if (!active) return;
        authApiService.saveUser(user);
        setStatus("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401) {
          authApiService.logout();
        }
        setStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") return null;

  if (status === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
