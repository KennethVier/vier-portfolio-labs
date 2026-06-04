import authApiService from "../api/AuthApiService";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    authApiService.logout();
    window.location.href = "/auth";
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">AuthApp</span>

        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-white small">
            {user?.email}
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="container py-5">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4">
            <h3 className="fw-bold mb-2">
              Welcome, {user?.username || "User"} ðŸ‘‹
            </h3>
            <p className="text-muted">
              This is a mock dashboard. Your authentication flow is working.
            </p>

            <div className="alert alert-success mt-4">
              âœ… JWT authentication successful  
              <br />
              âœ… Protected route working  
              <br />
              âœ… Google OAuth ready  
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}