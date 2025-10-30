"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";

/**
 * Composant AutocompleteInput - Input avec suggestions filtrées
 *
 * Features:
 * - Filtrage en temps réel avec debounce (useDeferredValue)
 * - Navigation clavier (↑↓ Enter Escape)
 * - Sélection au clic
 * - Saisie libre (pas de restriction aux suggestions)
 * - Max 10 suggestions affichées
 *
 * @param name - Nom du champ
 * @param value - Valeur actuelle
 * @param onChange - Callback de changement (value: string) => void
 * @param suggestions - Tableau des suggestions disponibles
 * @param placeholder - Placeholder de l'input
 * @param className - Classes CSS additionnelles
 * @param disabled - État désactivé
 * @param required - Champ requis
 */
interface AutocompleteInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const AutocompleteInput = ({
  name,
  value,
  onChange,
  suggestions,
  placeholder = "",
  className = "",
  disabled = false,
  required = false,
}: AutocompleteInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce du filtrage avec useDeferredValue
  const deferredValue = useDeferredValue(value);

  // Filtrer les suggestions basées sur la valeur tapée
  const filteredSuggestions = suggestions
    .filter((suggestion) => suggestion.toLowerCase().includes(deferredValue.toLowerCase()))
    .slice(0, 10); // Max 10 suggestions

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gérer la navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          onChange(filteredSuggestions[selectedIndex]);
          setIsOpen(false);
          setSelectedIndex(-1);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Sélectionner une suggestion au clic
  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Gérer le changement de valeur
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0 && filteredSuggestions.length > 0);
    setSelectedIndex(-1);
  };

  // Ouvrir le dropdown au focus
  const handleFocus = () => {
    if (value.length > 0 && filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
          autoComplete="off"
        />
        {filteredSuggestions.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown des suggestions */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors ${
                index === selectedIndex ? "bg-indigo-100" : ""
              }`}
              onMouseEnter={() => setSelectedIndex(index)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
