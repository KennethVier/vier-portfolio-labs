const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export default function GoogleButton() {
    return (
        <button onClick={() => window.location.href = `${API_ROOT}/auth/oauth2/authorization/google`}
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2">
            <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                width="18"
                alt="Google"
            />
            Continue with Google
        </button>
    );
}
