"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  label: string;
  children: ReactNode;
};

export function IconButton({ active = false, label, children, className = "", ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-md border text-sm transition ${
        active
          ? "border-teal-300/70 bg-teal-300/18 text-teal-100 shadow-[0_0_24px_rgba(79,209,197,0.18)]"
          : "border-white/10 bg-white/[0.055] text-slate-200 hover:border-white/24 hover:bg-white/[0.09]"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
