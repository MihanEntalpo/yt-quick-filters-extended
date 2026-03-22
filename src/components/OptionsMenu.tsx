import React, { useEffect, useRef } from 'react';
import './OptionsMenu.css';

interface OptionsMenuProps {
  x: number;
  y: number;
  onExport: () => void;
  onImport: () => void;
  onClose: () => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  x,
  y,
  onExport,
  onImport,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleBlur = () => {
      onClose();
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const w = menu.offsetWidth;
      const h = menu.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      menu.style.left = Math.min(x, vw - w - 8) + 'px';
      menu.style.top = Math.min(y, vh - h - 8) + 'px';
    }
  }, [x, y]);

  return (
    <div ref={menuRef} id="ytqf-options-menu">
      <div
        className="mi"
        onClick={(e) => {
          e.stopPropagation();
          onExport();
        }}
      >
        Export Filters
      </div>

      <div
        className="mi"
        onClick={(e) => {
          e.stopPropagation();
          onImport();
        }}
      >
        Import Filters
      </div>
    </div>
  );
};
