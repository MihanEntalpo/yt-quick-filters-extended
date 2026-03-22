import React, { useEffect, useRef } from 'react';
import './FiltersTransferModal.css';

interface FiltersTransferModalProps {
  isOpen: boolean;
  mode: 'export' | 'import';
  jsonValue: string;
  merge: boolean;
  error: string;
  onJsonChange: (value: string) => void;
  onMergeChange: (value: boolean) => void;
  onClose: () => void;
  onImport: () => void;
}

export const FiltersTransferModal: React.FC<FiltersTransferModalProps> = ({
  isOpen,
  mode,
  jsonValue,
  merge,
  error,
  onJsonChange,
  onMergeChange,
  onClose,
  onImport
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTextarea = () => {
      textareaRef.current?.focus();
      if (mode === 'export') {
        textareaRef.current?.select();
      }
    };

    setTimeout(focusTextarea, 0);
  }, [isOpen, mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isExport = mode === 'export';

  return (
    <>
      <div id="ytqf-transfer-modal-backdrop" onClick={onClose} />
      <div id="ytqf-transfer-modal">
        <div className="card">
          <div className="hdr">
            {isExport ? 'Export Filters' : 'Import Filters'}
          </div>

          <div className="body">
            <p className="transfer-copy">
              {isExport
                ? 'Copy this JSON to back up or share your current board filters.'
                : 'Paste a JSON array of filters to import into the current board.'}
            </p>

            <textarea
              ref={textareaRef}
              className={`transfer-textarea ${error ? 'error' : ''}`}
              value={jsonValue}
              onChange={(e) => onJsonChange(e.target.value)}
              readOnly={isExport}
              spellCheck={false}
              placeholder='[{"label":"My Tasks","query":"Assignee: me"}]'
            />

            {!isExport && (
              <>
                <label className="transfer-checkbox">
                  <input
                    type="checkbox"
                    checked={merge}
                    onChange={(e) => onMergeChange(e.target.checked)}
                  />
                  <span>Merge</span>
                </label>

                <p className="transfer-hint">
                  {merge
                    ? 'Matching filter names will be updated, new filters will be added, and other current filters will stay untouched.'
                    : 'All current filters will be replaced with the imported set.'}
                </p>
              </>
            )}

            {error && <div className="transfer-error">{error}</div>}
          </div>

          <div className="f">
            <button id="ytqf-transfer-cancel" onClick={onClose}>
              {isExport ? 'Close' : 'Cancel'}
            </button>
            {!isExport && (
              <button className="primary" id="ytqf-transfer-import" onClick={onImport}>
                Import
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
