'use client';

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  const base = "transition-colors font-semibold rounded-lg";
  const styles =
    variant === "primary"
      ? "bg-cyan-400 text-slate-900 px-4 py-2 hover:bg-cyan-300"
      : "bg-transparent border border-slate-700 text-slate-200 px-3 py-2 hover:border-cyan-300";

  return (
    <button className={[base, styles, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
