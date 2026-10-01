import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authApiService from "../api/AuthApiService";

export default function OAuthSuccess() {
    const handledRef = useRef(false);
    const navigate = useNavigate();
    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const params = new URLSearchParams(window.location.hash.slice(1));
        const token = params.get("token");
        window.history.replaceState(null, "", window.location.pathname);

        if (token) {
            authApiService.saveToken(token);
            authApiService.getMe()
                .then((user) => {
                    authApiService.saveUser(user);
                    navigate("/dashboard", { replace: true });
                })
                .catch(() => {
                    authApiService.logout();
                    navigate("/auth", { replace: true });
                });
        } else {
            navigate("/auth", { replace: true });
        }
    }, [navigate]);

    return null;
}
