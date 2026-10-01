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

    async getMe() {
        const response = await api.get("/me");
        return response.data;
    },

    saveAuth(authResponse) {
        localStorage.setItem("token", authResponse.token);
        this.saveUser(authResponse);
    },

    saveToken(token) {
        localStorage.setItem("token", token);
    },

    saveUser(user) {
        localStorage.setItem(
        "user",
        JSON.stringify({
            email: user.email,
            username: user.username,
            role: user.role
        })
        );
    },

    saveDemoSession() {
        this.saveAuth({
            token: "portfolio-demo-session",
            email: "demo@authly.local",
            username: "Portfolio Demo",
            role: "DEMO"
        });
    },

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },

    isAuthenticated() {
        return !!localStorage.getItem("token");
    },

    isDemoSession() {
        return localStorage.getItem("token") === "portfolio-demo-session";
    }
};

export default authApiService;
