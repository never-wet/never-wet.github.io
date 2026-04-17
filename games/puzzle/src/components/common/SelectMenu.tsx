import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface SelectMenuOption {
  value: string;
  label: string;
  description?: string;
}

export function SelectMenu({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionIdBase = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    const initialIndex = options.findIndex((option) => option.value === value);
    return initialIndex >= 0 ? initialIndex : 0;
  });

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    const nextIndex = options.findIndex((option) => option.value === value);
    if (nextIndex >= 0) {
      setHighlightedIndex(nextIndex);
    }
  }, [options, value]);

  useEffect(() => {
    if (!open) {
      setPopoverStyle(null);
      return;
    }

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const viewportPadding = 16;
      const offset = 8;
      const preferredHeight = 280;
      const minimumVisibleHeight = 96;
      const viewportHeight = window.innerHeight;
      const spaceBelow = Math.max(0, viewportHeight - rect.bottom - viewportPadding);
      const spaceAbove = Math.max(0, rect.top - viewportPadding);
      const shouldFlipUpward = spaceBelow < minimumVisibleHeight && spaceAbove > spaceBelow;
      const availableSpace = shouldFlipUpward ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(
        Math.min(minimumVisibleHeight, availableSpace),
        Math.min(preferredHeight, availableSpace),
      );
      const top = shouldFlipUpward
        ? Math.max(viewportPadding, rect.top - maxHeight - offset)
        : rect.bottom + offset;

      setPopoverStyle({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    };

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }

    const selected = listRef.current.querySelector<HTMLElement>("[data-highlighted='true']");
    selected?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const commit = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const moveHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((current) => {
      const next = current + direction;
      if (next < 0) {
        return options.length - 1;
      }
      if (next >= options.length) {
        return 0;
      }
      return next;
    });
  };

  return (
    <div className={`select-menu ${open ? "select-menu--open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="select-menu__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            moveHighlight(event.key === "ArrowDown" ? 1 : -1);
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            const highlighted = options[highlightedIndex];
            if (highlighted) {
              commit(highlighted.value);
            }
          }
        }}
      >
        <span className="select-menu__value">{selectedOption?.label ?? placeholder ?? "Select an option"}</span>
        <span className="select-menu__arrow" aria-hidden="true" />
      </button>

      {open && popoverStyle ? (
        <div
          className="select-menu__popover"
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            top: `${popoverStyle.top}px`,
            left: `${popoverStyle.left}px`,
            width: `${popoverStyle.width}px`,
            maxHeight: `${popoverStyle.maxHeight}px`,
          }}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const highlighted = index === highlightedIndex;

            return (
              <button
                key={option.value}
                id={`${optionIdBase}-${option.value}`}
                type="button"
                role="option"
                aria-selected={selected}
                data-highlighted={highlighted}
                className={`select-menu__option ${selected ? "select-menu__option--selected" : ""} ${
                  highlighted ? "select-menu__option--highlighted" : ""
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => commit(option.value)}
              >
                <span>{option.label}</span>
                {option.description ? <small>{option.description}</small> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
