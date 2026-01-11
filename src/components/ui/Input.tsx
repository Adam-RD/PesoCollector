'use client';

import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  error?: string;
};

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      {label && <span className="text-slate-300">{label}</span>}
      <input
        className={[
          "rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
}
