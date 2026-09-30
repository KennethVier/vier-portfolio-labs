import authApiService from "../api/AuthApiService";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const isDemoSession = localStorage.getItem("token") === "portfolio-demo-session";

  const handleLogout = () => {
    authApiService.logout();
    window.location.href = "/auth";
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">Authly</span>

        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-white small">
            {user?.email}
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container py-5">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4">
            <h3 className="fw-bold mb-2">
              Welcome, {user?.username || "User"}
            </h3>
            <p className="text-muted">
              This dashboard demonstrates the protected-route experience after authentication.
            </p>

            {isDemoSession ? (
              <div className="alert alert-info mt-4 mb-0">
                <strong>Portfolio demo session</strong>
                <br />
                The protected-route UI is active, but this session does not represent a live JWT issued by the backend.
              </div>
            ) : (
              <div className="alert alert-success mt-4 mb-0">
                JWT authentication successful
                <br />
                Protected route working
                <br />
                Authenticated user session loaded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
