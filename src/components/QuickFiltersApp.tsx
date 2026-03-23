import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Filter } from '../types';
import { StorageService } from '../services/storage';
import { UtilsService } from '../services/utils';
import { YouTrackVersionService } from '../services/youTrackVersion';
import { useQueryParams } from '../hooks/useQueryParams';
import { FilterBar } from './FilterBar';
import { FilterModal } from './FilterModal';
import { ContextMenu } from './ContextMenu';
import { OptionsMenu } from './OptionsMenu';
import { FiltersTransferModal } from './FiltersTransferModal';
import { DaysInStatusUI } from '../services/daysInStatusUI';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  item: Filter | null;
  index: number;
}

interface ModalState {
  isOpen: boolean;
  isEdit: boolean;
  initialName?: string;
  initialQuery?: string;
  index?: number;
}

interface OptionsMenuState {
  isOpen: boolean;
  x: number;
  y: number;
}

interface TransferModalState {
  isOpen: boolean;
  mode: 'export' | 'import';
  jsonValue: string;
  merge: boolean;
  error: string;
}

export const QuickFiltersApp: React.FC = () => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    item: null,
    index: -1
  });
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    isEdit: false
  });
  const [optionsMenu, setOptionsMenu] = useState<OptionsMenuState>({
    isOpen: false,
    x: 0,
    y: 0
  });
  const [transferModal, setTransferModal] = useState<TransferModalState>({
    isOpen: false,
    mode: 'export',
    jsonValue: '',
    merge: true,
    error: ''
  });

  const storageService = StorageService.getInstance();
  const utilsService = UtilsService.getInstance();
  const versionService = YouTrackVersionService.getInstance();
  const daysInStatusUI = DaysInStatusUI.getInstance();
  
  // State to hold the DOM node for the portal
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  // Use custom hook for working with query parameters
  const { query: currentQuery, pathname } = useQueryParams();

  const loadFilters = useCallback(async () => {
    try {
      const loadedFilters = await storageService.getFilters();
      setFilters(loadedFilters);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  }, [storageService]);


  // Effect to find the target elements for the portals
  useEffect(() => {
    const updatePortalTarget = () => {
      const filterTarget = versionService.getTargetElement();
      if (filterTarget) {
        setPortalTarget((previousTarget) => previousTarget === filterTarget ? previousTarget : filterTarget);
        return true;
      }

      return false;
    };

    let attempts = 0;
    const maxAttempts = 20;

    if (updatePortalTarget()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      attempts += 1;
      const found = updatePortalTarget();

      if (found || attempts >= maxAttempts) {
        window.clearInterval(intervalId);
      }
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [pathname, versionService]);

  // Reload filters when pathname changes (board change)
  useEffect(() => {
    loadFilters();
  }, [pathname, loadFilters]);

  // Initialize DaysInStatusUI
  useEffect(() => {
    const initDaysInStatus = async () => {
      await daysInStatusUI.start();
    };
    
    initDaysInStatus();
    
    return () => {
      daysInStatusUI.stop();
    };
  }, [daysInStatusUI]);

  const handleFilterClick = useCallback((query: string) => {
    const nextQuery = utilsService.toggleFilterInQuery(currentQuery, query);
    void utilsService.setQuery(nextQuery);
  }, [utilsService, currentQuery]);

  const handleAddFilter = useCallback(() => {
    setOptionsMenu({
      isOpen: false,
      x: 0,
      y: 0
    });
    setModal({
      isOpen: true,
      isEdit: false
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({
      isOpen: false,
      x: 0,
      y: 0,
      item: null,
      index: -1
    });
  }, []);

  const closeOptionsMenu = useCallback(() => {
    setOptionsMenu({
      isOpen: false,
      x: 0,
      y: 0
    });
  }, []);

  const handleOptionsClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    closeContextMenu();
    setOptionsMenu((prev) => ({
      isOpen: !prev.isOpen,
      x: rect.left,
      y: rect.bottom + 4
    }));
  }, [closeContextMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, item: Filter, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    closeOptionsMenu();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      item,
      index
    });
  }, [closeOptionsMenu]);

  const handleEditFilter = useCallback((item: Filter, index: number) => {
    closeContextMenu();
    setModal({
      isOpen: true,
      isEdit: true,
      initialName: item.label,
      initialQuery: item.query,
      index
    });
  }, [closeContextMenu]);

  const handleDuplicateFilter = useCallback(async (item: Filter, index: number) => {
    closeContextMenu();
    try {
      await storageService.duplicateFilter(index);
      await loadFilters();
    } catch (error) {
      console.error('Failed to duplicate filter:', error);
    }
  }, [closeContextMenu, storageService, loadFilters]);

  const handleMoveFilterLeft = useCallback(async (index: number) => {
    closeContextMenu();
    try {
      await storageService.moveFilter(index, 'left');
      await loadFilters();
    } catch (error) {
      console.error('Failed to move filter left:', error);
    }
  }, [closeContextMenu, storageService, loadFilters]);

  const handleMoveFilterRight = useCallback(async (index: number) => {
    closeContextMenu();
    try {
      await storageService.moveFilter(index, 'right');
      await loadFilters();
    } catch (error) {
      console.error('Failed to move filter right:', error);
    }
  }, [closeContextMenu, storageService, loadFilters]);

  const handleDeleteFilter = useCallback(async (index: number) => {
    closeContextMenu();
    try {
      await storageService.deleteFilter(index);
      await loadFilters();
    } catch (error) {
      console.error('Failed to delete filter:', error);
    }
  }, [closeContextMenu, storageService, loadFilters]);

  const handleModalClose = useCallback(() => {
    setModal({
      isOpen: false,
      isEdit: false
    });
  }, []);

  const handleTransferModalClose = useCallback(() => {
    setTransferModal((prev) => ({
      ...prev,
      isOpen: false,
      error: ''
    }));
  }, []);

  const handleModalSave = useCallback(async (name: string, query: string, index?: number) => {
    try {
      if (modal.isEdit && typeof index === 'number') {
        await storageService.updateFilter(index, { label: name, query });
      } else {
        await storageService.addFilter({ label: name, query });
      }
      await loadFilters();
      handleModalClose();
    } catch (error) {
      console.error('Failed to save filter:', error);
    }
  }, [modal.isEdit, storageService, loadFilters, handleModalClose]);

  const handleOpenExport = useCallback(() => {
    closeOptionsMenu();
    setTransferModal({
      isOpen: true,
      mode: 'export',
      jsonValue: JSON.stringify(filters, null, 2),
      merge: true,
      error: ''
    });
  }, [closeOptionsMenu, filters]);

  const handleOpenImport = useCallback(() => {
    closeOptionsMenu();
    setTransferModal({
      isOpen: true,
      mode: 'import',
      jsonValue: '',
      merge: true,
      error: ''
    });
  }, [closeOptionsMenu]);

  const handleTransferJsonChange = useCallback((value: string) => {
    setTransferModal((prev) => ({
      ...prev,
      jsonValue: value,
      error: ''
    }));
  }, []);

  const handleTransferMergeChange = useCallback((value: boolean) => {
    setTransferModal((prev) => ({
      ...prev,
      merge: value,
      error: ''
    }));
  }, []);

  const handleImportFilters = useCallback(async () => {
    try {
      const importedFilters = storageService.parseImportedFilters(transferModal.jsonValue);
      const confirmationMessage = transferModal.merge
        ? 'Are you sure you want to merge these filters?\n\nExisting filters with matching names will be updated, new filters will be added, and current filters missing from the import will stay unchanged.'
        : 'Are you sure you want to replace all current filters with the imported filters?\n\nThis will remove any current filters that are not present in the import.';

      if (!window.confirm(confirmationMessage)) {
        return;
      }

      await storageService.importFilters(importedFilters, transferModal.merge);
      await loadFilters();
      handleTransferModalClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import filters.';
      setTransferModal((prev) => ({
        ...prev,
        error: message
      }));
    }
  }, [handleTransferModalClose, loadFilters, storageService, transferModal.jsonValue, transferModal.merge]);


  // Determine active filter based on current query
  const activeFilterIndices = utilsService.getActiveFilterIndices(filters, currentQuery);

  return (
    <>
      {/* Render FilterBar */}
      {portalTarget ? (
        ReactDOM.createPortal(
          <FilterBar
            filters={filters}
            activeFilterIndices={activeFilterIndices}
            onFilterClick={handleFilterClick}
            onAddFilter={handleAddFilter}
            onOptionsClick={handleOptionsClick}
            onContextMenu={handleContextMenu}
          />,
          portalTarget
        )
      ) : (
        <FilterBar
          filters={filters}
          activeFilterIndices={activeFilterIndices}
          onFilterClick={handleFilterClick}
          onAddFilter={handleAddFilter}
          onOptionsClick={handleOptionsClick}
          onContextMenu={handleContextMenu}
        />
      )}
      
      {/* Render context menu and modal in document.body for proper layering */}
      {contextMenu.isOpen && contextMenu.item && 
        ReactDOM.createPortal(
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextMenu.item}
            index={contextMenu.index}
            onEdit={handleEditFilter}
            onDuplicate={handleDuplicateFilter}
            onMoveLeft={handleMoveFilterLeft}
            onMoveRight={handleMoveFilterRight}
            onDelete={handleDeleteFilter}
            canMoveLeft={contextMenu.index > 0}
            canMoveRight={contextMenu.index >= 0 && contextMenu.index < filters.length - 1}
            onClose={closeContextMenu}
          />,
          document.body
        )
      }

      {optionsMenu.isOpen &&
        ReactDOM.createPortal(
          <OptionsMenu
            x={optionsMenu.x}
            y={optionsMenu.y}
            onExport={handleOpenExport}
            onImport={handleOpenImport}
            onClose={closeOptionsMenu}
          />,
          document.body
        )
      }
      
      {modal.isOpen && 
        ReactDOM.createPortal(
          <FilterModal
            isOpen={modal.isOpen}
            isEdit={modal.isEdit}
            initialName={modal.initialName}
            initialQuery={modal.initialQuery}
            index={modal.index}
            onClose={handleModalClose}
            onSave={handleModalSave}
          />,
          document.body
        )
      }

      {transferModal.isOpen &&
        ReactDOM.createPortal(
          <FiltersTransferModal
            isOpen={transferModal.isOpen}
            mode={transferModal.mode}
            jsonValue={transferModal.jsonValue}
            merge={transferModal.merge}
            error={transferModal.error}
            onJsonChange={handleTransferJsonChange}
            onMergeChange={handleTransferMergeChange}
            onClose={handleTransferModalClose}
            onImport={handleImportFilters}
          />,
          document.body
        )
      }
    </>
  );
};
