"use client";

import { useState } from "react";
import Image from "next/image";
import { login } from "./actions";
import SubmitButton from "./SubmitButton";

export default function LoginForm({ initialError }: { initialError: string | null }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[#030303] px-4 font-outfit text-[#F5F2EB]">
      {/* Luxury Ambient Glows */}
      <div className="hidden md:block absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#D4AF37]/10 blur-[180px] pointer-events-none" />
      <div className="hidden md:block absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#C5A059]/5 blur-[180px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#030303]/80 to-[#030303] pointer-events-none" />

      {/* Main Split Layout */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#0A0A0A] shadow-xl md:shadow-[0_30px_90px_rgba(0,0,0,0.95)] md:backdrop-blur-2xl grid md:grid-cols-12">
        {/* Left Visual Brand Panel */}
        <div className="relative hidden md:flex md:col-span-5 flex-col justify-between border-r border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-12">
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3.5 py-1.5 text-[10px] font-medium tracking-[0.25em] uppercase text-[#D4AF37]">
              Restricted Area
            </span>
            <h2 className="text-3xl font-light tracking-tight text-[#F5F2EB]">
              Administration
            </h2>
          </div>

          <div className="my-auto py-10 flex flex-col items-center text-center">
            <div className="relative mb-6 h-40 w-40 overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-[#121212] shadow-2xl ring-4 ring-[#D4AF37]/10">
              <Image
                src="/admin-logo.webp"
                alt="The Label 18 Logo"
                fill
                className="object-cover"
                loading="lazy"
                sizes="160px" />
            </div>
            <h1 className="text-2xl font-normal tracking-wide text-white">
              The Label 18
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#E6D5B8]/70 max-w-[260px]">
              Manage high-end catalogue, inventory, orders, and system
              configurations.
            </p>
          </div>

          <div className="text-xs text-white/30 tracking-widest font-outfit">
            SECURE PORTAL v2.6
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-14 flex flex-col justify-center bg-[#0D0D0D]">
          {/* Mobile Header */}
          <div className="mb-8 flex md:hidden flex-col items-center text-center">
            <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-[#121212] shadow-xl">
              <Image
                src="/admin-logo.webp"
                alt="The Label 18 Logo"
                fill
                className="object-cover"
                priority
                sizes="112px" />
            </div>
            <h1 className="text-2xl font-normal tracking-wide text-white">
              The Label 18
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mt-1">
              Admin Portal
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-3xl font-light tracking-tight text-white">
              Welcome back
            </h3>
            <p className="text-sm text-[#E6D5B8]/70 mt-2">
              Please authenticate your credentials to continue.
            </p>
          </div>

          <form action={login} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-widest text-[#E6D5B8]"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="admin@thelabel18.com or subadmin@gmail.com"
                className="block w-full appearance-none rounded-xl border border-white/20 bg-[#181818] px-4 py-4 text-base text-[#F5F2EB] placeholder-white/30 outline-none transition-colors focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] [&:-webkit-autofill]:[-webkit-text-fill-color:#F5F2EB] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_#181818_inset]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-widest text-[#E6D5B8]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="block w-full appearance-none rounded-xl border border-white/20 bg-[#181818] px-4 py-4 pr-12 text-base text-[#F5F2EB] placeholder-white/30 outline-none transition-colors focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] [&:-webkit-autofill]:[-webkit-text-fill-color:#F5F2EB] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_#181818_inset]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/40 hover:text-[#D4AF37] transition-colors"
                >
                  {showPassword ? (
                    // Eye-off icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {initialError && (
              <div role="alert" className="rounded-xl bg-rose-500/10 p-3.5 text-center text-xs text-rose-400 border border-rose-500/30">
                {initialError}
              </div>
            )}

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-[11px] text-white/40 tracking-wide">
              Protected by enterprise-grade encryption. Unauthorized access is
              prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
