import React from 'react';
import { createRoot } from 'react-dom/client';
import { QuickFiltersApp } from './components/QuickFiltersApp';
import { TokenManager } from './services/tokenManager';
import { DaysInStatusSettingsService } from './services/daysInStatusSettings';
import './styles.css';

let isSettingsStorageBridgeInitialized = false;

const initializeSettingsStorageBridge = (): void => {
  if (isSettingsStorageBridgeInitialized) {
    return;
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') {
      return;
    }

    const partial: Record<string, boolean | number> = {};

    if (changes.ytqf_hideCreatedTag) {
      partial.hideCreated = Boolean(changes.ytqf_hideCreatedTag.newValue);
    }

    if (changes.ytqf_thresholdYellow) {
      partial.thresholdYellow = Number(changes.ytqf_thresholdYellow.newValue);
    }

    if (changes.ytqf_thresholdRed) {
      partial.thresholdRed = Number(changes.ytqf_thresholdRed.newValue);
    }

    if (changes.ytqf_compactFormat) {
      partial.compactFormat = Boolean(changes.ytqf_compactFormat.newValue);
    }

    if (changes.ytqf_createdTagColored) {
      partial.createdTagColored = Boolean(changes.ytqf_createdTagColored.newValue);
    }

    if (Object.keys(partial).length === 0) {
      return;
    }

    const settingsService = DaysInStatusSettingsService.getInstance();
    settingsService.update(partial);
  });

  isSettingsStorageBridgeInitialized = true;
};

class ContentScript {
  private intervalId: number | null = null;
  private root: any = null;

  private inject(): void {
    // Check if already injected
    if (document.getElementById('ytqf-app')) return;

    // Create a hidden container for the React app
    const appContainer = document.createElement('div');
    appContainer.id = 'ytqf-app';
    appContainer.style.display = 'none'; // Hidden container, portal will handle rendering
    document.body.appendChild(appContainer);

    // Mount React app
    this.root = createRoot(appContainer);
    this.root.render(<QuickFiltersApp />);
  }

  public async start(): Promise<void> {
    initializeSettingsStorageBridge();

    // Prime settings cache once per content script context.
    try {
      await DaysInStatusSettingsService.getInstance().init();
    } catch (error) {
      console.warn('Failed to initialize Days In Status settings cache:', error);
    }

    // Initialize token manager
    try {
      const tokenManager = TokenManager.getInstance();
      await tokenManager.initialize();
    } catch (error) {
      console.warn('⚠️ Failed to initialize token manager:', error);
    }

    // Initial injection
    this.inject();

    // Re-check periodically for SPA navigation or full top-level remounts.
    this.intervalId = window.setInterval(() => {
      this.inject();
    }, 1000);
  }
}

// Initialize content script with delay to ensure service worker is ready
const initializeContentScript = async () => {
  // Check if extension is ready
  if (chrome.runtime?.id) {
    const contentScript = new ContentScript();
    await contentScript.start();
  } else {
    // Retry after a short delay
    setTimeout(initializeContentScript, 100);
  }
};

// Start initialization
initializeContentScript();
