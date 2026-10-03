import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";

const schema = z
  .object({
    name: z.string().min(3, "Full name is required (min 3 characters)"),
    email: z.string().email("Invalid email"),
    telephone: z.string().optional(),
    date_naissance: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

const PLANS = [
  {
    id: "mensuel",
    label: "Monthly",
    price: "300 MAD/month",
    desc: "Gym access + coach follow-up",
  },
  {
    id: "trimestriel",
    label: "Quarterly",
    price: "800 MAD/3 months",
    desc: "Personalized program",
    popular: true,
  },
  {
    id: "annuel",
    label: "Annual VIP",
    price: "2800 MAD/year",
    desc: "Dedicated coach + all inclusive",
  },
];

const SPECIALITES = [
  { id: "musculation", label: "Strength Training", icon: "🏋️", desc: "Muscle and strength gain" },
  { id: "cardio", label: "Cardio", icon: "🏃", desc: "Endurance and weight loss" },
  { id: "crossfit", label: "Crossfit", icon: "🤸", desc: "Full-body high intensity" },
  { id: "natation", label: "Swimming", icon: "🏊", desc: "Complete low-impact training" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = info, 2 = specialty, 3 = plan & payment
  const [selectedPlan, setSelectedPlan] = useState("trimestriel");
  const [selectedSpecialty, setSelectedSpecialty] = useState("musculation");
  const [paymentMethod, setPaymentMethod] = useState("card");

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const goToStep2 = async () => {
    const valid = await trigger([
      "name",
      "email",
      "password",
      "password_confirmation",
    ]);
    if (valid) setStep(2);
  };

  const goToStep3 = () => {
    setStep(3);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/register", {
        ...data,
        plan: selectedPlan,
        specialite: selectedSpecialty,
        payment_method: paymentMethod
      });
      login(res.data.token, res.data.user);
      toast.success("Welcome to VIP Sport Center!");
      navigate("/client");
    } catch (err) {
      const msg = err.response?.data?.message || "Sign-up error";
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors)
          .flat()
          .forEach((e) => toast.error(e));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B2A] via-[#1E3A5F] to-[#2E75B6] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2E75B6] p-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
            🏋️
          </div>
          <h1 className="text-2xl font-black">VIP Sport Center</h1>
          <p className="text-blue-200 text-sm mt-1">
            Create your member account
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 hidden sm:flex">
            <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 1 ? "text-white" : "text-white/40"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-white text-[#1E3A5F]" : "bg-white/20"}`}>
                1
              </div>
              Your info
            </div>
            <div className={`w-6 h-0.5 ${step >= 2 ? "bg-white" : "bg-white/20"}`} />
            <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 2 ? "text-white" : "text-white/40"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-white text-[#1E3A5F]" : "bg-white/20"}`}>
                2
              </div>
              Goal
            </div>
            <div className={`w-6 h-0.5 ${step >= 3 ? "bg-white" : "bg-white/20"}`} />
            <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 3 ? "text-white" : "text-white/40"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? "bg-white text-[#1E3A5F]" : "bg-white/20"}`}>
                3
              </div>
              Plan
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* STEP 1 — Personal information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#1E3A5F] mb-4">
                  Your information
                </h2>

                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full name *
                  </label>
                  <input
                    {...register("name")}
                    placeholder="First name Last name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone + Date of birth */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      {...register("telephone")}
                      placeholder="06XXXXXXXX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of birth
                    </label>
                    <input
                      {...register("date_naissance")}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    {...register("password")}
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm password *
                  </label>
                  <input
                    {...register("password_confirmation")}
                    type="password"
                    placeholder="Repeat the password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm"
                  />
                  {errors.password_confirmation && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={goToStep2}
                  className="w-full bg-[#1E3A5F] hover:bg-[#2E75B6] text-white font-bold py-3 rounded-xl transition mt-2"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* STEP 2 — Goal / Specialty */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-400 hover:text-[#1E3A5F] transition"
                  >
                    ← Back
                  </button>
                  <h2 className="text-lg font-bold text-[#1E3A5F]">
                    What is your goal?
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {SPECIALITES.map(({ id, label, icon, desc }) => (
                    <div
                      key={id}
                      onClick={() => setSelectedSpecialty(id)}
                      className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition-all ${
                        selectedSpecialty === id
                          ? "border-[#2E75B6] bg-[#EBF5FB]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-3xl mb-2">{icon}</div>
                      <p className="font-bold text-[#1E3A5F] text-sm">{label}</p>
                      <p className="text-xs text-gray-500 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mt-2">
                  ℹ️ We will use this information to automatically assign you the best available coach.
                </div>

                <button
                  type="button"
                  onClick={goToStep3}
                  className="w-full bg-[#1E3A5F] hover:bg-[#2E75B6] text-white font-bold py-3 rounded-xl transition mt-4"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* STEP 3 — Choose plan & Payment */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-gray-400 hover:text-[#1E3A5F] transition"
                  >
                    ← Back
                  </button>
                  <h2 className="text-lg font-bold text-[#1E3A5F]">
                    Plan & Payment
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLANS.map(({ id, label, price, desc, popular }) => (
                    <div
                      key={id}
                      onClick={() => setSelectedPlan(id)}
                      className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                        selectedPlan === id
                          ? "border-[#2E75B6] bg-[#EBF5FB]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {popular && (
                        <span className="absolute -top-3 right-4 bg-[#2E75B6] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}

                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedPlan === id
                              ? "border-[#2E75B6]"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedPlan === id && (
                            <div className="w-2 h-2 rounded-full bg-[#2E75B6]" />
                          )}
                        </div>
                        <p className="font-bold text-[#1E3A5F] text-sm leading-tight">{label}</p>
                      </div>
                      <p className="font-bold text-[#2E75B6] text-xs mb-1">{price}</p>
                      <p className="text-gray-500 text-[10px] leading-tight">{desc}</p>
                    </div>
                  ))}
                </div>

                {/* Structured Checkout Section */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <h3 className="font-bold text-[#1E3A5F] mb-4 text-sm">Payment method</h3>

                  {/* Payment Method Toggle */}
                  <div className="flex gap-3 mb-5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border-2 transition ${
                        paymentMethod === "card"
                        ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      💳 Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border-2 transition ${
                        paymentMethod === "cash"
                        ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      💵 Cash (on site)
                    </button>
                  </div>

                  {/* If Card (Mock fields) */}
                  {paymentMethod === "card" && (
                    <div className="space-y-3 mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Card number</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm font-mono" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Expiry</label>
                          <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">CVC</label>
                          <input type="text" placeholder="123" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm font-mono" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">🔒 Secure payment (Simulation)</p>
                    </div>
                  )}

                  {/* If Cash */}
                  {paymentMethod === "cash" && (
                    <div className="mb-5 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-800 animate-in fade-in slide-in-from-top-2 duration-300">
                      You chose to pay on site. Your membership will be finalized at the club reception.
                    </div>
                  )}

                  {/* Summary */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">{PLANS.find(p => p.id === selectedPlan)?.label} plan</span>
                      <span className="font-semibold text-gray-700">{PLANS.find(p => p.id === selectedPlan)?.price.split('/')[0]} MAD</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="text-gray-500">Registration fee</span>
                      <span className="font-semibold text-gray-700">0 MAD</span>
                    </div>
                    <div className="flex justify-between items-center font-black text-[#1E3A5F] text-lg">
                      <span>Total due</span>
                      <span>{PLANS.find(p => p.id === selectedPlan)?.price.split('/')[0]} MAD</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
                  💡 By confirming, you accept our terms and conditions. Your specialized coach will be assigned within 24h.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1E3A5F] hover:bg-[#2E75B6] text-white font-black py-4 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                     "Creating account..."
                  ) : (
                    <>
                      <span>Confirm registration & Pay</span>
                      <span className="text-lg">→</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-[#2E75B6] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
