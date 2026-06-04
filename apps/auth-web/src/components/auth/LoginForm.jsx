import { useState } from "react";
import authApiService from "../../api/AuthApiService";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
    const {register, handleSubmit, formState: { errors }} = useForm();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");

    const onSubmit = async (data) => {
        console.log("Login data submitted:", data);
        try{
            const response = await authApiService.login(data);
            authApiService.saveAuth(response);
            console.log("Login response:", response);
            navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            setMessage(error.response?.data?.message || "Live backend is currently disabled for this portfolio demo. Contact the admin to enable this workflow.");
        }
    };

    return(
        <form onSubmit={handleSubmit(onSubmit)}>
            {message && <div className="alert alert-warning py-2 small">{message}</div>}
            <div className="form-floating mb-3">
                <input type="email" className={`form-control ${errors.email ? "is-invalid" : ""}`} 
                    id="email" placeholder="Email" name="email"
                    {...register("email", { 
                        required: "Email is required", 
                        pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Invalid email address"
                        } 
                    })}
                />
                {errors.email && <span className="text-danger small">{errors.email.message}</span>}
                <label htmlFor="email">Email</label>
            </div>

            <div className="form-floating mb-4">
                <input type="password" className={`form-control ${errors.password ? "is-invalid" : ""}`} 
                    id="password" placeholder="Password" name="password"
                    {...register("password", { 
                        required: "Password is required", 
                        minLength: { 
                            value: 8, 
                            message: "Password must be at least 8 characters" 
                        } 
                    })}
                />
                {errors.password && <span className="text-danger small">{errors.password.message}</span>}
                <label htmlFor="password">Password</label>
            </div>

            <button className="btn btn-primary w-100 py-2 fw-semibold">
                Login
            </button>
        </form>
    );
}

