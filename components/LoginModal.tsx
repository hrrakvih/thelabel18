"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "login" | "register";

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn, signUp, loginPrompt } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Mount/unmount with a tick of delay so the entrance transition can play
  useEffect(() => {
    if (isOpen) {
      const t = requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
      return () => {
        cancelAnimationFrame(t);
        document.body.style.overflow = "";
      };
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  };

  const switchMode = (newMode: Mode) => {
    setError(null);
    setSuccess(null);
    setMode(newMode);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      resetForm();
      setMode("login");
      onClose();
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "login") {
      if (!email.trim() || !password) {
        setLoading(false);
        setError("Please enter both email and password.");
        return;
      }
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        handleClose();
      }
      return;
    }

    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
      setLoading(false);
      setError("Please fill in all fields.");
      return;
    }

    const { error } = await signUp({ fullName, phone, email, password });
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      // Email confirmation is disabled, so signUp() already creates a session.
      // No need to show a "check your email" message — just close the modal.
      handleClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#0d0d0d] to-black border border-[#d4af37]/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(212,175,55,0.05)] transition-all duration-300 ease-out ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-[#d4af37] hover:bg-white/5 transition-colors duration-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 pt-10 pb-9 sm:px-10">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="relative w-16 h-16 rounded-full ring-1 ring-[#d4af37]/30 p-[2px]">
              <div className="w-full h-full rounded-full overflow-hidden bg-black">
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  width={64}
                  height={64}
                  priority
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Contextual Login Banner */}
          {loginPrompt && (
            <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-3.5 py-2.5 text-center">
              <span className="text-[11.5px] font-outfit font-medium tracking-wide text-[#d4af37]">
                {loginPrompt}
              </span>
            </div>
          )}

          {/* Heading */}
          <h2 className="text-center font-outfit font-light text-white text-xl tracking-[0.1em] mb-1">
            {mode === "login" ? "Welcome Back" : "Create Your Account"}
          </h2>
          <p className="text-center font-outfit font-light text-white/40 text-[12px] tracking-wide mb-7">
            {mode === "login"
              ? "Sign in to continue"
              : "Join us for a curated experience"}
          </p>

          {/* Tabs */}
          <div className="relative flex bg-white/[0.04] border border-white/10 rounded-full p-1 mb-7">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#D4AF37] transition-transform duration-300 ease-out shadow-sm ${
                mode === "register" ? "translate-x-[calc(100%+8px)]" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`relative z-10 flex-1 py-2.5 font-outfit font-semibold text-[11px] tracking-[0.2em] uppercase rounded-full transition-colors duration-300 ${
                mode === "login" ? "text-black" : "text-white/50 hover:text-white/80"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`relative z-10 flex-1 py-2.5 font-outfit font-semibold text-[11px] tracking-[0.2em] uppercase rounded-full transition-colors duration-300 ${
                mode === "register" ? "text-black" : "text-white/50 hover:text-white/80"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <FieldWithIcon>
                  <UserIcon />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="peer w-full bg-transparent text-white text-sm font-outfit font-light placeholder:text-white/30 focus:outline-none py-3.5"
                  />
                </FieldWithIcon>

                <FieldWithIcon>
                  <PhoneIcon />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="peer w-full bg-transparent text-white text-sm font-outfit font-light placeholder:text-white/30 focus:outline-none py-3.5"
                  />
                </FieldWithIcon>
              </>
            )}

            <FieldWithIcon>
              <MailIcon />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full bg-transparent text-white text-sm font-outfit font-light placeholder:text-white/30 focus:outline-none py-3.5"
              />
            </FieldWithIcon>

            <FieldWithIcon>
              <LockIcon />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full bg-transparent text-white text-sm font-outfit font-light placeholder:text-white/30 focus:outline-none py-3.5"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-white/30 hover:text-[#E6C35C] transition-colors shrink-0"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </FieldWithIcon>

            {error && (
              <p className="text-red-400/90 text-[12px] font-outfit font-light text-center leading-relaxed">
                {error}
              </p>
            )}
            {success && (
              <p className="text-emerald-400/90 text-[12px] font-outfit font-light text-center leading-relaxed">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#D4AF37] hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-black font-outfit font-bold text-[12px] tracking-[0.2em] uppercase rounded-full py-3.5 transition-all duration-300 mt-2 shadow-[0_4px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_28px_rgba(212,175,55,0.55)]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Please wait
                </span>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center font-outfit font-light text-white/30 text-[11px] tracking-wide mt-6">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("register")}
                  className="text-[#E6C35C] hover:text-[#F5E6C8] font-medium transition-colors"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="text-[#E6C35C] hover:text-[#F5E6C8] font-medium transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- small presentational helpers ---------- */

function FieldWithIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 focus-within:border-[#d4af37]/50 rounded-xl px-4 transition-colors duration-300">
      {children}
    </div>
  );
}

function iconProps() {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    className: "w-4 h-4 text-white/30 shrink-0",
  };
}

function UserIcon() {
  return (
    <svg {...iconProps()}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps()}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps()}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps()}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}