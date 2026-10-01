import { API_ROOT, GOOGLE_OAUTH_ENABLED } from "../../config";

export default function GoogleButton() {
    const handleGoogleLogin = () => {
        if (!GOOGLE_OAUTH_ENABLED) return;
        window.location.href = `${API_ROOT}/oauth2/authorization/google`;
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!GOOGLE_OAUTH_ENABLED}
            title={GOOGLE_OAUTH_ENABLED ? "Continue with Google" : "Google OAuth requires live backend configuration"}
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
        >
            <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                width="18"
                alt="Google"
            />
            {GOOGLE_OAUTH_ENABLED ? "Continue with Google" : "Google OAuth · configuration required"}
        </button>
    );
}
