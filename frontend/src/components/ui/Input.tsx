import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className = "", error, ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 ${
        error ? "border-red-400" : "border-slate-300"
      } ${className}`}
      {...props}
    />
  ),
);
Input.displayName = "Input";
