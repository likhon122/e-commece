import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-sm font-medium text-[#091413]"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={id}
          className={cn(
            "flex h-12 w-full rounded-xl border-2 bg-white px-4 py-2 text-sm text-[#091413] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#091413]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E4CC] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60",
            error
              ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200"
              : "border-[#B0E4CC] hover:border-[#408A71] focus-visible:border-[#408A71]",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm font-medium text-red-500">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
