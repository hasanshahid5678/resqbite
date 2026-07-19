import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, id, className, leftIcon, ...rest }, ref) => {
  const generatedId = id || rest.name;
  return (
    <div className="w-full">
      {label && <label className="label" htmlFor={generatedId}>{label}</label>}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={generatedId}
          className={`input ${leftIcon ? "pl-10" : ""} ${className ?? ""}`}
          {...rest}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, hint, id, className, ...rest }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <textarea ref={ref} id={id} className={`input ${className ?? ""}`} {...rest} />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, hint, id, className, children, ...rest }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <select ref={ref} id={id} className={`input appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat ${className ?? ""}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%231f2d27' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'><path d='M6 9l6 6 6-6'/></svg>\")",
        }}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});
Select.displayName = "Select";