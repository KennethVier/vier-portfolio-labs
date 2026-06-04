import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authApiService from "../api/AuthApiService";

export default function OAuthSuccess() {
    const handledRef = useRef(false);
    const navigate = useNavigate();
    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const email = params.get("email");
        const username = params.get("username");

        if (token) {
            authApiService.saveAuthFromGoogle(token, email, username);
            navigate("/dashboard", { replace: true });
        } else {
            navigate("/auth");
        }
    }, []);
}
