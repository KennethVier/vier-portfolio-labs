import { Navigate } from 'react-router-dom';
import { isAdminUnlocked } from '../../features/admin/adminAuth.js';

const AdminRoute = ({ children }) => {
  if (!isAdminUnlocked()) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default AdminRoute;