import { useState } from "react";

export function PasscodeInput({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return (
    <div className={`passcode ${focused ? "passcode--focused" : ""}`}>
      <label className="field-label" htmlFor={`passcode-${label}`}>
        {label}
      </label>
      <input
        id={`passcode-${label}`}
        className="text-input"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
      />
      <div className="passcode__grid">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            className="passcode__key"
            onClick={() => onChange(`${value}${digit}`.slice(0, maxLength))}
          >
            {digit}
          </button>
        ))}
        <button type="button" className="passcode__key passcode__key--wide" onClick={() => onChange(value.slice(0, -1))}>
          Delete
        </button>
        <button type="button" className="passcode__key passcode__key--wide" onClick={() => onChange("")}>
          Clear
        </button>
      </div>
    </div>
  );
}
