import { forwardRef } from "react";
import clsx from "clsx";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className, id, ...rest }, ref) => {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-200">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-400 outline-none transition-colors focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/30",
          error && "border-card-red focus:border-card-red focus:ring-card-red/30",
          className
        )}
        {...rest}
      />
      {error && <span className="text-sm text-card-red">{error}</span>}
    </div>
  );
});
Input.displayName = "Input";
