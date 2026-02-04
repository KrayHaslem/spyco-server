interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  allLabel?: string;
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
}: FilterDropdownProps) {
  return (
    <div className="filter-dropdown">
      <label className="filter-dropdown__label">{label}</label>
      <select
        className="filter-dropdown__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FilterDropdown;
