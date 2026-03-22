import React from 'react';
import { FilterBarProps } from '../types';
import { DaysInStatusButton } from './DaysInStatusButton';
import './FilterBar.css';

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  activeFilterIndices,
  onFilterClick,
  onAddFilter,
  onContextMenu,
  onOptionsClick
}) => {
  return (
    <div id="ytqf-bar">
      <DaysInStatusButton />
      
      <button className="btn ghost" onClick={onAddFilter}>
        Add filter...
      </button>

      <button className="btn ghost ytqf-options-button" onClick={onOptionsClick} title="Options" aria-label="Options">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M9.47 1.7a1 1 0 0 0-1.94 0l-.2.93a5.6 5.6 0 0 0-1.17.49l-.8-.5a1 1 0 0 0-1.26.14L2.7 4.1a1 1 0 0 0-.14 1.26l.5.8c-.2.37-.36.76-.48 1.16l-.94.2a1 1 0 0 0 0 1.96l.94.2c.12.4.28.8.48 1.16l-.5.8a1 1 0 0 0 .14 1.26l1.4 1.4a1 1 0 0 0 1.26.14l.8-.5c.37.2.76.37 1.17.49l.2.92a1 1 0 0 0 1.94 0l.2-.92c.4-.12.8-.28 1.16-.49l.8.5a1 1 0 0 0 1.26-.14l1.4-1.4a1 1 0 0 0 .14-1.26l-.5-.8c.2-.36.37-.75.49-1.16l.92-.2a1 1 0 0 0 0-1.96l-.92-.2a5.6 5.6 0 0 0-.49-1.16l.5-.8a1 1 0 0 0-.14-1.26l-1.4-1.4a1 1 0 0 0-1.26-.14l-.8.5a5.6 5.6 0 0 0-1.16-.49l-.2-.93ZM8 10.33A2.33 2.33 0 1 1 8 5.67a2.33 2.33 0 0 1 0 4.66Z" />
        </svg>
      </button>

      {filters.map((filter, index) => (
        <button
          key={index}
          className={`btn ${activeFilterIndices.has(index) ? 'active' : ''}`}
          title={filter.query}
          onClick={() => onFilterClick(filter.query)}
          onContextMenu={(e) => onContextMenu(e, filter, index)}
        >
          <span className="lbl">{filter.label}</span>
        </button>
      ))}
    </div>
  );
};
