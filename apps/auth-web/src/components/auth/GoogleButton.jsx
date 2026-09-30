const API_ROOT = import.meta.env.VITE_API_BASE_URL;

export default function GoogleButton() {
    const backendEnabled = Boolean(API_ROOT);

    const handleGoogleLogin = () => {
        if (!backendEnabled) return;
        window.location.href = `${API_ROOT}/auth/oauth2/authorization/google`;
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!backendEnabled}
            title={backendEnabled ? "Continue with Google" : "Google OAuth requires the live backend deployment"}
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
        >
            <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                width="18"
                alt="Google"
            />
            {backendEnabled ? "Continue with Google" : "Google OAuth · backend required"}
        </button>
    );
}
