import api from "../config"

const authApiService = {
    async register(data) {
        const response = await api.post("/register", data);
        return response.data;
    },

    async login(data) {
        const response = await api.post("/login", data);
        return response.data;
    },

    saveAuth(authResponse) {
        localStorage.setItem("token", authResponse.token);
        localStorage.setItem(
        "user",
        JSON.stringify({
            email: authResponse.email,
            username: authResponse.username
        })
        );
    },

    saveAuthFromGoogle(token, email, username) {
        localStorage.setItem("token",token);
        localStorage.setItem(
            "user",
            JSON.stringify({
                email: email,
                username: username
            })
        );
    },

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },

    isAuthenticated() {
        return !!localStorage.getItem("token");
    }
};

export default authApiService;
