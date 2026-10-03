import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import { useNavigate, Link } from "react-router-dom";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    reValidateMode: "onSubmit", // Prevent Zod from auto-clearing root error on blur
  });

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const res = await api.post("/login", data);
      login(res.data.token, res.data.user);
      toast.success("Signed in successfully!");
      const role = res.data.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "coach") navigate("/coach");
      else if (role === "client") navigate("/client");
      else navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Sign-in error";
      setError("root.serverError", { type: "server", message: msg });
      toast.error(msg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#2E75B6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🏋️</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">
            VIP Sport Center
          </h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Visible error message */}
        {errors.root?.serverError?.message && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <p className="text-red-600 text-sm font-medium">{errors.root.serverError.message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register("email")}
              onChange={(e) => {
                register("email").onChange(e);
                if (errors.root?.serverError) clearErrors("root.serverError");
              }}
              type="email"
              placeholder="your@email.com"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${
                errors.email || errors.root?.serverError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#2E75B6] focus:border-transparent"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register("password")}
              onChange={(e) => {
                register("password").onChange(e);
                if (errors.root?.serverError) clearErrors("root.serverError");
              }}
              type="password"
              placeholder="••••••••"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${
                errors.password || errors.root?.serverError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#2E75B6] focus:border-transparent"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-[#2E75B6] hover:underline cursor-pointer"
            >
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E3A5F] hover:bg-[#2E75B6] text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Sign up */}
        <p className="text-center text-sm text-gray-500 mt-5">
          Not a member yet?{" "}
          <Link
            to="/register"
            className="text-[#2E75B6] font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>

        {/* Back home */}
        <div className="text-center mt-3">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Back to home
          </Link>
        </div>

        {/* Test accounts */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            TEST ACCOUNTS
          </p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>🔴 Admin: admin@sportcenter.ma / Admin@1234</p>
            <p>🔵 Coach: karim@sportcenter.ma / Coach@1234</p>
            <p>🟢 Client: yassine.amrani@gmail.com / Client@1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
