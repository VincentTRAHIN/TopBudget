'use client';

import React, { useRef, useEffect } from 'react';

/**
 * Composant Tooltip réutilisable avec gestion du clic extérieur
 * 
 * @param children - L'élément déclencheur du tooltip (généralement une icône)
 * @param content - Le contenu à afficher dans le tooltip
 * @param isOpen - État d'ouverture du tooltip
 * @param onToggle - Fonction pour basculer l'état du tooltip
 * @param onClickOutside - Fonction appelée lors d'un clic en dehors du tooltip
 */
interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClickOutside: () => void;
}

export default function Tooltip({
  children,
  content,
  isOpen,
  onToggle,
  onClickOutside,
}: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onClickOutside();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClickOutside]);

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center cursor-pointer text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {children}
      </button>
      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-md shadow-lg md:left-auto md:right-0 md:-translate-x-0"
        >
          {content}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-3 h-3 bg-gray-800 rotate-45 md:left-auto md:right-3"></div>
        </div>
      )}
    </div>
  );
}
