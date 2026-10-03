import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    try {
      await api.post("/forgot-password", { email });
      setSent(true);
      toast.success("Email sent!");
    } catch {
      toast.error("Email not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B2A] to-[#1E3A5F] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#EBF5FB] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🔑
          </div>
          <h1 className="text-2xl font-black text-[#1E3A5F]">
            Forgot password
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Enter your email to receive a reset link
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mx-auto">
              ✅
            </div>
            <p className="font-semibold text-gray-800">Email sent!</p>
            <p className="text-gray-400 text-sm">
              Check{" "}
              <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                storage/logs/laravel.log
              </code>{" "}
              to find the reset link.
            </p>
            <Link
              to="/login"
              className="block mt-4 text-[#2E75B6] text-sm font-semibold hover:underline"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#1E3A5F] hover:bg-[#2E75B6] text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send the link"}
            </button>
            <Link
              to="/login"
              className="block text-center text-gray-400 text-sm hover:text-gray-600"
            >
              ← Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
