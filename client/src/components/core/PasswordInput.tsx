import { useState } from "react";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  id?: string;
  label?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function PasswordInput({
  id,
  label,
  value,
  onChange,
  className = "",
  required,
  disabled,
  minLength,
  autoComplete,
  ...rest
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputId = id ?? "password";

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label className="form-group__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="password-input">
        <input
          {...rest}
          id={inputId}
          type={showPassword ? "text" : "password"}
          className="form-input password-input__field"
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-input__toggle"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          title={showPassword ? "Hide password" : "Show password"}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg
              className="password-input__icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4.5 4.5l15 15"
              />
            </svg>
          ) : (
            <svg
              className="password-input__icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default PasswordInput;
