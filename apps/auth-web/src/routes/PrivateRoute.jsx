import { Navigate } from "react-router-dom";
import authApiService from "../api/AuthApiService";

export default function PrivateRoute({ children }) {
  const isAuth = authApiService.isAuthenticated();

  if (isAuth === null) return null;

  if (!isAuth) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
