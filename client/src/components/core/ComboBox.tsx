import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";

interface ComboBoxOption {
  id: string;
  label: string;
  [key: string]: unknown;
}

interface ComboBoxProps<T extends ComboBoxOption> {
  value: T | null;
  onChange: (value: T | null) => void;
  onSearch: (query: string) => Promise<T[]>;
  onCreateNew?: (query: string) => void;
  allowCreate?: boolean;
  createLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  renderOption?: (option: T) => React.ReactNode;
}

function ComboBox<T extends ComboBoxOption>({
  value,
  onChange,
  onSearch,
  onCreateNew,
  allowCreate = false,
  createLabel = "Create",
  placeholder = "Search...",
  disabled = false,
  renderOption,
}: ComboBoxProps<T>) {
  const [inputValue, setInputValue] = useState(value?.label || "");
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setInputValue(value?.label || "");
  }, [value]);

  const handleBlurLogic = useCallback(() => {
    setIsOpen(false);
    const trimmedInput = inputValue.trim();

    if (!trimmedInput) {
      // Input is blank - reset to current value if exists
      if (value) {
        setInputValue(value.label);
      }
      return;
    }

    // If input matches the currently selected value, do nothing
    if (value && value.label.toLowerCase() === trimmedInput.toLowerCase()) {
      return;
    }

    // Check for case-insensitive exact match in options
    const exactMatch = options.find(
      (o) => o.label.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (exactMatch) {
      // Auto-select the matching option
      onChange(exactMatch);
      setInputValue(exactMatch.label);
    } else if (allowCreate && onCreateNew) {
      // No match - trigger create modal and clear input to prevent re-trigger
      setInputValue("");
      onCreateNew(trimmedInput);
    } else if (value) {
      // No match and can't create - reset to current value
      setInputValue(value.label);
    }
  }, [value, inputValue, options, allowCreate, onCreateNew, onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleBlurLogic();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleBlurLogic]);

  const search = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        const results = await onSearch(query);
        setOptions(results);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error("Search error: ", error);
        setOptions([]);
      }
      setIsLoading(false);
    },
    [onSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    setIsOpen(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);
  };

  const handleSelect = (option: T) => {
    onChange(option);
    setInputValue(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateNew = () => {
    if (onCreateNew && inputValue.trim()) {
      onCreateNew(inputValue.trim());
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        search(inputValue);
      }
      return;
    }

    const totalOptions =
      options.length + (allowCreate && inputValue.trim() ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < options.length) {
            handleSelect(options[highlightedIndex]);
          } else if (allowCreate) {
            handleCreateNew();
          }
        }
        break;
      case "Escape":
        setIsOpen(false);
        if (value) {
          setInputValue(value.label);
        }
        break;
    }
  };

  const handleClear = () => {
    onChange(null);
    setInputValue("");
    setOptions([]);
    inputRef.current?.focus();
  };

  const showCreateOption =
    allowCreate &&
    inputValue.trim() &&
    !options.some((o) => o.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <div className="combo-box" ref={containerRef}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            search(inputValue);
          }}
          onBlur={(e) => {
            // Only handle blur if focus is leaving the container entirely
            // (not when clicking dropdown options)
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              handleBlurLogic();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: "1.25rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="combo-box__dropdown">
          {isLoading ? (
            <div className="combo-box__loading">Loading...</div>
          ) : options.length === 0 && !showCreateOption ? (
            <div className="combo-box__loading">No results found</div>
          ) : (
            <>
              {options.map((option, index) => (
                <div
                  key={option.id}
                  className={`combo-box__option ${
                    highlightedIndex === index
                      ? "combo-box__option--highlighted"
                      : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    handleSelect(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {renderOption ? renderOption(option) : option.label}
                </div>
              ))}
              {showCreateOption && (
                <div
                  className={`combo-box__option combo-box__option--create ${
                    highlightedIndex === options.length
                      ? "combo-box__option--highlighted"
                      : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    handleCreateNew();
                  }}
                  onMouseEnter={() => setHighlightedIndex(options.length)}
                >
                  {createLabel} &quot;{inputValue}&quot;
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ComboBox;
