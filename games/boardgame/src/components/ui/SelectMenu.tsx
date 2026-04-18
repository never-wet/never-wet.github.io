import { useEffect, useId, useMemo, useRef, useState } from "react";

interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectMenuProps<T extends string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SelectMenu<T extends string>({ options, value, onChange }: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className={`select-menu${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="select-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="select-trigger-copy">
          <strong>{selected.label}</strong>
          {selected.description ? <small>{selected.description}</small> : null}
        </span>
        <span aria-hidden="true" className="select-chevron" />
      </button>

      {open ? (
        <div className="select-popover" id={listboxId} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`select-option${option.value === value ? " is-selected" : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span className="select-option-copy">
                <strong>{option.label}</strong>
                {option.description ? <small>{option.description}</small> : null}
              </span>
              <span className="select-option-meta">
                {option.value === value ? "Current" : "Choose"}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
