import { useState } from "react";
import User from "../class/User";

export default function LoginForm() {
  const [dark, setDark] = useState(false);

  const c = {
    bg:           dark ? "#1a1917"                  : "#faf9f7",
    text:         dark ? "#e8e4dc"                  : "#1c1917",
    subtext:      dark ? "rgba(232,228,220,0.50)"   : "rgba(28,25,23,0.55)",
    subtextFaint: dark ? "rgba(232,228,220,0.32)"   : "rgba(28,25,23,0.40)",
    eyebrow:      dark ? "rgba(232,228,220,0.35)"   : "rgba(28,25,23,0.38)",
    border:       dark ? "rgba(255,255,255,0.07)"   : "rgba(28,25,23,0.08)",
    logoBorder:   dark ? "rgba(255,255,255,0.16)"   : "rgba(28,25,23,0.16)",
    dividerLine:  dark ? "rgba(255,255,255,0.07)"   : "rgba(28,25,23,0.09)",
    dividerText:  dark ? "rgba(255,255,255,0.22)"   : "rgba(28,25,23,0.30)",
    badgeText:    dark ? "rgba(255,255,255,0.30)"   : "rgba(28,25,23,0.38)",
    footerText:   dark ? "rgba(255,255,255,0.20)"   : "rgba(28,25,23,0.28)",
    footerLink:   dark ? "rgba(255,255,255,0.38)"   : "rgba(28,25,23,0.48)",
    btnBorder:    dark ? "rgba(255,255,255,0.10)"   : "rgba(28,25,23,0.13)",
    btnBg:        dark ? "rgba(255,255,255,0.04)"   : "#ffffff",
    btnBorderHov: dark ? "rgba(255,255,255,0.20)"   : "rgba(28,25,23,0.22)",
    btnBgHov:     dark ? "rgba(255,255,255,0.07)"   : "#f5f3f0",
    toggleBg:     dark ? "rgba(255,255,255,0.06)"   : "rgba(28,25,23,0.04)",
    toggleBorder: dark ? "rgba(255,255,255,0.10)"   : "rgba(28,25,23,0.10)",
    toggleText:   dark ? "rgba(255,255,255,0.45)"   : "rgba(28,25,23,0.40)",
    gridLine:     dark ? "rgba(255,255,255,0.025)"  : "rgba(28,25,23,0.035)",
    orb1:         dark ? "rgba(139,124,107,0.12)"   : "rgba(164,152,136,0.12)",
    orb2:         dark ? "rgba(107,127,110,0.10)"   : "rgba(120,145,123,0.10)",
    purple:       dark ? "#b0a898"                  : "#6d6560",
    teal:         dark ? "#8fa892"                  : "#4e7a5c",
    amber:        dark ? "#c4a97a"                  : "#8a6a3a",
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden relative font-serif transition-colors duration-300"
      style={{ background: c.bg, color: c.text }}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(${c.gridLine} 1px, transparent 1px),
            linear-gradient(90deg, ${c.gridLine} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Orbs — much softer, warm tones */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none transition-all duration-500"
        style={{ background: `radial-gradient(circle, ${c.orb1} 0%, transparent 70%)` }}
      />
      <div
        className="absolute -bottom-20 right-24 w-[350px] h-[350px] rounded-full pointer-events-none transition-all duration-500"
        style={{ background: `radial-gradient(circle, ${c.orb2} 0%, transparent 70%)` }}
      />

      {/* Theme toggle */}
      <button
        onClick={() => setDark(!dark)}
        className="absolute top-6 right-8 z-10 flex items-center gap-2 rounded-full px-3 py-1.5 font-sans text-[11px] tracking-[0.06em] uppercase transition-all duration-200 cursor-pointer"
        style={{
          background: c.toggleBg,
          border: `1px solid ${c.toggleBorder}`,
          color: c.toggleText,
        }}
      >
        <span className="text-[13px]">{dark ? "☀" : "☾"}</span>
        {dark ? "Dark" : "Light"}
      </button>

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-16 relative transition-colors duration-300"
        style={{ borderRight: `1px solid ${c.border}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors duration-300"
            style={{ border: `1.5px solid ${c.logoBorder}`, color: c.text }}
          >◈</div>
          <span
            className="font-sans text-[11px] tracking-[0.12em] uppercase transition-colors duration-300"
            style={{ color: c.eyebrow }}
          >ASSP</span>
        </div>

        {/* Headline */}
        <div>
          <p
            className="font-sans text-[10px] tracking-[0.22em] uppercase mb-5 transition-colors duration-300"
            style={{ color: c.eyebrow }}
          >
            Adaptive Smart Study Planner
          </p>
          <h1 className="text-[clamp(40px,4.5vw,64px)] font-normal leading-[1.07] tracking-[-0.025em] mb-7">
            Study with<br />
            <em style={{ color: c.purple }} className="transition-colors duration-300">intention.</em><br />
            Learn with<br />
            <em style={{ color: c.teal }} className="transition-colors duration-300">precision.</em>
          </h1>
          <p
            className="font-sans text-sm leading-[1.75] max-w-[380px] transition-colors duration-300"
            style={{ color: c.subtext }}
          >
            AI-powered sessions, adaptive quizzes, and deep productivity insights —
            designed for serious learners.
          </p>
        </div>

        {/* Feature list */}
        <div className="flex flex-col gap-[14px]">
          {[
            { icon: "◉", label: "Smart Session Management", color: c.purple },
            { icon: "◈", label: "AI Quiz Generation",       color: c.teal   },
            { icon: "◎", label: "Productivity Tracking",    color: c.amber  },
          ].map(({ icon, label, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-base leading-none transition-colors duration-300" style={{ color }}>{icon}</span>
              <span className="font-sans text-[13px] transition-colors duration-300" style={{ color: c.subtextFaint }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[420px] flex flex-col justify-center px-10 lg:px-12 relative">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-14">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors duration-300"
            style={{ border: `1.5px solid ${c.logoBorder}`, color: c.text }}
          >◈</div>
          <span
            className="font-sans text-[10px] tracking-[0.12em] uppercase transition-colors duration-300"
            style={{ color: c.eyebrow }}
          >ASSP</span>
        </div>

        {/* Heading */}
        <div className="mb-9">
          <h2
            className="text-[30px] font-normal tracking-[-0.025em] leading-tight mb-2.5 transition-colors duration-300"
            style={{ color: c.text }}
          >
            Welcome back
          </h2>
          <p
            className="font-sans text-[13px] leading-relaxed transition-colors duration-300"
            style={{ color: c.subtext }}
          >
            Sign in to continue your study journey
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={() => User.login()}
          className="w-full py-[13px] px-5 flex items-center justify-center gap-3 rounded-xl font-sans text-[14px] font-medium tracking-[0.01em] transition-all duration-200 cursor-pointer"
          style={{
            border: `1px solid ${c.btnBorder}`,
            background: c.btnBg,
            color: c.text,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = c.btnBorderHov;
            e.currentTarget.style.background = c.btnBgHov;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = c.btnBorder;
            e.currentTarget.style.background = c.btnBg;
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px transition-colors duration-300" style={{ background: c.dividerLine }} />
          <span
            className="font-sans text-[10px] tracking-[0.08em] uppercase transition-colors duration-300"
            style={{ color: c.dividerText }}
          >Secure Login</span>
          <div className="flex-1 h-px transition-colors duration-300" style={{ background: c.dividerLine }} />
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-5 flex-wrap">
          {["End-to-end encrypted", "No password needed", "Free to start"].map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-1.5 font-sans text-[11px] transition-colors duration-300"
              style={{ color: c.badgeText }}
            >
              <span className="text-[9px] font-bold transition-colors duration-300" style={{ color: c.teal }}>✓</span>
              {badge}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          className="font-sans text-[10px] text-center mt-10 leading-relaxed tracking-[0.01em] transition-colors duration-300"
          style={{ color: c.footerText }}
        >
          By continuing, you agree to our{" "}
          <span
            className="cursor-pointer transition-colors duration-200"
            style={{ color: c.footerLink }}
            onMouseEnter={e => e.currentTarget.style.color = dark ? "rgba(255,255,255,0.60)" : "rgba(28,25,23,0.70)"}
            onMouseLeave={e => e.currentTarget.style.color = c.footerLink}
          >Terms of Service</span>
          {" "}and{" "}
          <span
            className="cursor-pointer transition-colors duration-200"
            style={{ color: c.footerLink }}
            onMouseEnter={e => e.currentTarget.style.color = dark ? "rgba(255,255,255,0.60)" : "rgba(28,25,23,0.70)"}
            onMouseLeave={e => e.currentTarget.style.color = c.footerLink}
          >Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}