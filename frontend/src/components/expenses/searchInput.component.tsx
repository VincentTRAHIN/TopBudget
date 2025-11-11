import React, { useCallback, useEffect, useRef, useState } from "react";

interface SearchInputProps {
  initialValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const SearchInput = React.memo<SearchInputProps>(({ initialValue = "", onChange, placeholder, debounceMs = 200 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(initialValue);
  const onChangeRef = useRef(onChange);

  // Garder onChangeRef à jour sans causer de re-render
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Debounce le onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <div className="flex-grow min-w-[150px]">
      <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
        Recherche
      </label>
      <input
        ref={inputRef}
        id="search-input"
        type="text"
        placeholder={placeholder || "Description, commentaire, catégorie..."}
        value={localValue}
        onChange={handleChange}
        className="input"
        autoComplete="off"
      />
    </div>
  );
});

SearchInput.displayName = "SearchInput";

export default SearchInput;
