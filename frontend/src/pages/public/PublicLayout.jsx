import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FadeIn from "../../components/ui/FadeIn";

const STATS = [
  { value: "500+", label: "VIP members" },
  { value: "15+", label: "Certified coaches" },
  { value: "98%", label: "Client satisfaction" },
  { value: "10+", label: "Years of experience" },
];

const SERVICES = [
  {
    icon: "🏋️",
    title: "Strength Training",
    desc: "Personalized muscle and strength programs with one-on-one tracking.",
  },
  {
    icon: "🏃",
    title: "Cardio & Endurance",
    desc: "Cardio sessions tailored to burn fat and improve your endurance.",
  },
  {
    icon: "🧘",
    title: "Yoga & Flexibility",
    desc: "Yoga and stretching classes to improve mobility and reduce stress.",
  },
  {
    icon: "🥊",
    title: "CrossFit",
    desc: "Intense functional workouts to build strength and conditioning.",
  },
  {
    icon: "📊",
    title: "Physical Assessment",
    desc: "Complete evaluation: BMI, body composition, confidential health check.",
  },
  {
    icon: "🍎",
    title: "Nutrition Coaching",
    desc: "Personalized nutrition advice to optimize your performance.",
  },
];

const COACHES = [
  {
    name: "Karim Benali",
    role: "Strength & Power",
    exp: "8 years",
    emoji: "💪",
  },
  { name: "Sara Elhajjami", role: "Cardio & Yoga", exp: "6 years", emoji: "🧘" },
  {
    name: "Omar Tazi",
    role: "CrossFit & Functional",
    exp: "5 years",
    emoji: "🏆",
  },
];

const PLANS = [
  {
    name: "Monthly",
    price: "300",
    period: "month",
    features: [
      "Unlimited gym access",
      "Initial physical assessment",
      "Basic program",
      "Coach follow-up",
    ],
    highlight: false,
  },
  {
    name: "Quarterly",
    price: "800",
    period: "3 months",
    features: [
      "Everything in the monthly plan",
      "Full health check",
      "Personalized program",
      "One-on-one sessions",
      "Progress report",
    ],
    highlight: true,
    badge: "Popular",
  },
  {
    name: "Annual VIP",
    price: "2800",
    period: "year",
    features: [
      "Everything in the quarterly plan",
      "Dedicated personal coach",
      "Priority access",
      "Nutrition coaching",
      "24/7 support",
    ],
    highlight: false,
  },
];

const TIPS = [
  {
    cat: "Sport",
    emoji: "🏋️",
    title: "Always warm up",
    desc: "10 minutes before every session cuts injuries by 50%.",
  },
  {
    cat: "Nutrition",
    emoji: "🥗",
    title: "Protein and recovery",
    desc: "Eat 2g of protein per kg of body weight to optimize recovery.",
  },
  {
    cat: "Sport",
    emoji: "💧",
    title: "Hydration and performance",
    desc: "Just 2% dehydration drops your performance by 20%. Drink regularly.",
  },
  {
    cat: "Nutrition",
    emoji: "⏰",
    title: "Meal timing",
    desc: "Eat 2h before training. Recover with protein within 30 min after.",
  },
];

const TESTIMONIALS = [
  {
    name: "Yassine A.",
    result: "-12kg in 4 months",
    text: "The personalized follow-up from my coach changed everything. The programs fit me and the results are there!",
    stars: 5,
  },
  {
    name: "Fatima O.",
    result: "+8kg of muscle",
    text: "The app is really handy, I can see my schedule and my progress in real time. Highly recommended!",
    stars: 5,
  },
  {
    name: "Mehdi C.",
    result: "BMI back to normal",
    text: "The initial physical assessment helped me understand where I stood. My coach built the perfect program.",
    stars: 5,
  },
];

function ImcCalculator() {
  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [imc, setImc] = useState(null);

  const calculate = () => {
    const p = parseFloat(poids);
    const t = parseFloat(taille) / 100;
    if (p > 0 && t > 0) setImc((p / (t * t)).toFixed(1));
  };

  const getImcInfo = (val) => {
    if (val < 18.5) return { label: "Underweight", color: "text-blue-500" };
    if (val < 25) return { label: "Normal weight", color: "text-green-500" };
    if (val < 30) return { label: "Overweight", color: "text-yellow-500" };
    return { label: "Obese", color: "text-red-500" };
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-sm w-full">
      <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">
        Free BMI calculator
      </h3>
      <div className="space-y-3">
        <input
          type="number"
          placeholder="Weight (kg)"
          value={poids}
          onChange={(e) => setPoids(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm"
        />
        <input
          type="number"
          placeholder="Height (cm)"
          value={taille}
          onChange={(e) => setTaille(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E75B6] text-sm"
        />
        <button
          onClick={calculate}
          className="w-full bg-[#1E3A5F] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#2E75B6] transition"
        >
          Calculate my BMI
        </button>
        {imc && (
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-[#1E3A5F]">{imc}</p>
            <p
              className={`text-sm font-semibold mt-1 ${getImcInfo(parseFloat(imc)).color}`}
            >
              {getImcInfo(parseFloat(imc)).label}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicLayout() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="font-sans text-gray-800 bg-white">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E3A5F] rounded-xl flex items-center justify-center text-xl">
              🏋️
            </div>
            <span
              className={`font-bold text-lg ${scrolled ? "text-[#1E3A5F]" : "text-white"}`}
            >
              VIP Sport Center
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              ["Home", "hero"],
              ["Services", "services"],
              ["Coaches", "coaches"],
              ["Pricing", "pricing"],
              ["Resources", "resources"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`text-sm font-medium transition hover:text-[#2E75B6] ${scrolled ? "text-gray-700" : "text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className={`text-sm font-semibold px-4 py-2 rounded-xl border transition ${
                scrolled
                  ? "border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white"
                  : "border-white text-white hover:bg-white hover:text-[#1E3A5F]"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#2E75B6] text-white hover:bg-[#1E3A5F] transition"
            >
              Join the club
            </button>
          </div>
          <button
            className="md:hidden text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={scrolled ? "text-[#1E3A5F]" : "text-white"}>
              ☰
            </span>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white shadow-lg px-6 py-4 space-y-3">
            {[
              ["Home", "hero"],
              ["Services", "services"],
              ["Coaches", "coaches"],
              ["Pricing", "pricing"],
              ["Resources", "resources"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left text-gray-700 font-medium py-2 border-b border-gray-100"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-[#1E3A5F] text-white py-2 rounded-xl font-semibold mt-2"
            >
              Sign in
            </button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2A] via-[#1E3A5F] to-[#2E75B6]" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#2E75B6] opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <FadeIn delay={100}>
            <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now open — memberships available
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
              Transform
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                your body,
              </span>
              <br />
              elevate your life.
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              VIP coaching tailored to you by certified trainers. Custom
              programs, complete assessments and digital support.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-white text-[#1E3A5F] font-bold rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                Get started now →
              </button>
              <button
                onClick={() => scrollTo("services")}
                className="px-8 py-4 border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/10 transition"
              >
                Explore our services
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-12">
              {STATS.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs text-blue-200 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="flex justify-center">
              <ImcCalculator />
            </div>
          </FadeIn>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce text-2xl">
          ↓
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
            <span className="text-[#2E75B6] font-semibold text-sm uppercase tracking-wider">
              Our disciplines
            </span>
            <h2 className="text-4xl font-black text-[#1E3A5F] mt-2">
              Services designed around you
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Every program is tailor-made by our certified coaches.
            </p>
          </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map(({ icon, title, desc }, idx) => (
              <FadeIn key={title} delay={idx * 100}>
                <div
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full"
                >
                <div className="w-14 h-14 bg-[#EBF5FB] rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:bg-[#1E3A5F] transition-colors duration-300">
                  <span>{icon}</span>
                </div>
                <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">
                  {title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* COACHES */}
      <section id="coaches" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
            <span className="text-[#2E75B6] font-semibold text-sm uppercase tracking-wider">
              The team
            </span>
            <h2 className="text-4xl font-black text-[#1E3A5F] mt-2">
              Your expert coaches
            </h2>
            <p className="text-gray-500 mt-4">
              Passionate professionals at your service.
            </p>
          </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {COACHES.map(({ name, role, exp, emoji }, idx) => (
              <FadeIn key={name} delay={idx * 100}>
                <div className="text-center group h-full">
                <div className="w-32 h-32 bg-gradient-to-br from-[#1E3A5F] to-[#2E75B6] rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  {emoji}
                </div>
                <h3 className="text-xl font-bold text-[#1E3A5F]">{name}</h3>
                <p className="text-[#2E75B6] font-medium text-sm mt-1">
                  {role}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  ⭐ {exp} of experience
                </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="py-24 bg-gradient-to-br from-[#0D1B2A] to-[#1E3A5F]"
      >
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
            <span className="text-blue-300 font-semibold text-sm uppercase tracking-wider">
              Pricing
            </span>
            <h2 className="text-4xl font-black text-white mt-2">
              Choose your plan
            </h2>
            <p className="text-blue-200 mt-4">
              Pay online or on site — 3 installments available.
            </p>
          </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(
              ({ name, price, period, features, highlight, badge }, idx) => (
                <FadeIn key={name} delay={idx * 150}>
                  <div
                    className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 h-full ${
                    highlight
                      ? "bg-white shadow-2xl scale-105"
                      : "bg-white/10 backdrop-blur border border-white/20"
                  }`}
                >
                  {badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2E75B6] text-white text-xs font-bold px-4 py-1 rounded-full">
                      {badge}
                    </div>
                  )}
                  <h3
                    className={`text-xl font-bold mb-2 ${highlight ? "text-[#1E3A5F]" : "text-white"}`}
                  >
                    {name}
                  </h3>
                  <div
                    className={`flex items-end gap-1 mb-6 ${highlight ? "text-[#1E3A5F]" : "text-white"}`}
                  >
                    <span className="text-4xl font-black">{price}</span>
                    <span className="text-sm mb-1 opacity-70">
                      MAD / {period}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-center gap-2 text-sm ${highlight ? "text-gray-600" : "text-blue-100"}`}
                      >
                        <span className="text-green-400 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/register")}
                    className={`w-full py-3 rounded-2xl font-bold text-sm transition ${
                      highlight
                        ? "bg-[#1E3A5F] text-white hover:bg-[#2E75B6]"
                        : "bg-white/20 text-white hover:bg-white hover:text-[#1E3A5F]"
                    }`}
                  >
                    Choose this plan
                  </button>
                  </div>
                </FadeIn>
              ),
            )}
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section id="resources" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
            <span className="text-[#2E75B6] font-semibold text-sm uppercase tracking-wider">
              Free resources
            </span>
            <h2 className="text-4xl font-black text-[#1E3A5F] mt-2">
              Training and nutrition best practices
            </h2>
            <p className="text-gray-500 mt-4">
              Expert advice available to everyone, no sign-up required.
            </p>
          </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIPS.map(({ cat, emoji, title, desc }, idx) => (
              <FadeIn key={title} delay={idx * 100}>
                <div
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full"
                >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{emoji}</span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${cat === "Sport" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                  >
                    {cat}
                  </span>
                </div>
                <h3 className="font-bold text-[#1E3A5F] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
            <span className="text-[#2E75B6] font-semibold text-sm uppercase tracking-wider">
              Testimonials
            </span>
            <h2 className="text-4xl font-black text-[#1E3A5F] mt-2">
              They transformed their lives
            </h2>
          </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, result, text, stars }, idx) => (
              <FadeIn key={name} delay={idx * 150}>
                <div
                  className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 h-full"
                >
                <div className="flex text-yellow-400 mb-3">
                  {"★".repeat(stars)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  "{text}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1E3A5F]">{name}</p>
                    <p className="text-[#2E75B6] text-xs font-semibold">
                      {result}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A5F] to-[#2E75B6] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {name[0]}
                  </div>
                </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-[#1E3A5F] to-[#2E75B6]">
        <FadeIn delay={200}>
          <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to start your transformation?
          </h2>
          <p className="text-blue-200 mb-8">
            Join our VIP members and get personalized coaching starting today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-10 py-4 bg-white text-[#1E3A5F] font-black rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-200 text-lg"
            >
              Join the VIP club →
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-10 py-4 border-2 border-white text-white font-black rounded-2xl hover:bg-white hover:text-[#1E3A5F] transition-all duration-200 text-lg"
            >
              Sign in
            </button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0D1B2A] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2E75B6] rounded-lg flex items-center justify-center">
                  🏋️
                </div>
                <span className="font-bold">VIP Sport Center</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted partner for reaching your fitness goals.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-blue-300">Services</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {["Strength", "Cardio", "Yoga", "CrossFit", "Nutrition"].map(
                  (s) => (
                    <li key={s}>{s}</li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-blue-300">Quick links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <button
                    onClick={() => navigate("/login")}
                    className="hover:text-white transition"
                  >
                    Sign in
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/register")}
                    className="hover:text-white transition"
                  >
                    Sign up
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("pricing")}
                    className="hover:text-white transition"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("resources")}
                    className="hover:text-white transition"
                  >
                    Resources
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-blue-300">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📍 Casablanca, Morocco</li>
                <li>📞 +212 6XX XXX XXX</li>
                <li>✉️ contact@sportcenter.ma</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-gray-500 text-sm">
            2025 VIP Sport Center. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
