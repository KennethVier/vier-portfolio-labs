export default function AuthHeader({ mode }) {
  return (
    <div className="text-center mb-4">
      <h2 className="fw-bold text-primary">
        {mode === "login" ? "Welcome Back" : "Create Account"}
      </h2>
      <p className="text-muted mb-0">
        {mode === "login"
          ? "Sign in to your account"
          : "Register to get started"}
      </p>
    </div>
  );
}