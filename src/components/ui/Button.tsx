'use client';

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "warning" | "danger";
};

export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60 hover:rounded-xl hover:scale-[1.02] active:scale-[0.99]";
  const styles = (() => {
    switch (variant) {
      case "ghost":
        return "border border-slate-700 bg-transparent px-3 py-2 text-slate-200 shadow-sm shadow-slate-900/50 hover:border-cyan-300 hover:bg-slate-900/40 hover:text-cyan-100 active:translate-y-px";
      case "warning":
        return "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 px-4 py-2 text-slate-900 shadow-lg shadow-amber-500/20 hover:brightness-105 active:translate-y-px";
      case "danger":
        return "bg-gradient-to-r from-rose-400 via-red-500 to-rose-400 px-4 py-2 text-white shadow-lg shadow-red-500/25 hover:brightness-105 active:translate-y-px";
      default:
        return "bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 px-4 py-2 text-slate-900 shadow-lg shadow-cyan-500/20 hover:brightness-105 active:translate-y-px";
    }
  })();

  return (
    <button className={[base, styles, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
