import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  help?: string;
  icon?: string;
  action?: ReactNode;
}
export function AuthField({
  label,
  error,
  help,
  icon,
  action,
  id,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold sm:text-[13px]"
      >
        {label}
      </label>
      <div
        className={cn(
          "flex min-h-12 items-center gap-2 rounded-lg border bg-white px-4 focus-within:border-primary",
          error ? "border-red-500" : "border-border",
        )}
      >
        {icon && (
          <img
            src={icon}
            alt=""
            width="16"
            height="16"
            className="opacity-60"
          />
        )}
        <input
          {...props}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error || help ? id + "-help" : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-subtle disabled:text-subtle",
            className,
          )}
        />
        {action}
      </div>
      {(error || help) && (
        <p
          id={id + "-help"}
          className={cn(
            "mt-1 text-[11px] leading-4",
            error ? "text-red-600" : "text-subtle",
          )}
        >
          {error || help}
        </p>
      )}
    </div>
  );
}
export const primaryButton =
  "min-h-11 rounded-[7px] bg-primary px-4 text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45";
