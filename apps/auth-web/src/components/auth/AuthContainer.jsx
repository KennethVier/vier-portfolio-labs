import AuthHeader from "./AuthHeader";
import GoogleButton from "./GoogleButton";
import Divider from "../ui/Divider";

export default function AuthContainer({ mode, setMode, children }) {
  return (
    <div className="card shadow-lg border-0 rounded-4" style={{ width: 420 }}>
      <div className="card-body p-4 p-md-5">
        <AuthHeader mode={mode} />

        {children}

        <Divider />

        <GoogleButton />

        <div className="text-center mt-4">
          <span className="text-muted small">
            {mode === "login"
              ? "Donâ€™t have an account?"
              : "Already have an account?"}
          </span>
          <button
            className="btn btn-link btn-sm fw-semibold"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
