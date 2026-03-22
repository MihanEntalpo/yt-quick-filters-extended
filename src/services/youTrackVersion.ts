/**
 * Service for finding appropriate toolbar element for mounting filters
 */
export class YouTrackVersionService {
  private static instance: YouTrackVersionService;

  public static getInstance(): YouTrackVersionService {
    if (!YouTrackVersionService.instance) {
      YouTrackVersionService.instance = new YouTrackVersionService();
    }
    return YouTrackVersionService.instance;
  }

  /**
   * Find toolbar element for mounting filters
   * Prefer the dedicated agile toolbar when present.
   * Fall back to the top bar only when no separate toolbar exists.
   */
  public getTargetElement(): Element | null {
    const forceFallback = localStorage.getItem('ytqf-force-fallback') === 'true';

    if (forceFallback) {
      return this.findToolbarTarget();
    }

    const toolbarTarget = this.findToolbarTarget();
    if (toolbarTarget) {
      return toolbarTarget;
    }

    return this.findTopBarTarget();
  }

  private findTopBarTarget(): Element | null {
    const topBar = document.querySelector('div.yt-agile-board__top-bar');
    if (topBar) {
      const searchPanel = topBar.querySelector('search-query-panel');
      if (searchPanel) {
        const filterContainer = this.getOrCreateFilterContainer();
        const topBarElement = topBar as HTMLElement;

        topBarElement.style.flexWrap = 'wrap';
        topBarElement.style.rowGap = '8px';

        filterContainer.style.cssText = 'display: flex; align-items: center; width: 100%; margin: 8px 0 0; min-width: 0;';

        if (filterContainer.parentElement !== topBar || searchPanel.nextElementSibling !== filterContainer) {
          topBar.insertBefore(filterContainer, searchPanel.nextSibling);
        }

        return filterContainer;
      }
    }

    return null;
  }

  private findToolbarTarget(): Element | null {
    const toolbar = this.findToolbar();
    if (toolbar) {
      const filterContainer = this.getOrCreateFilterContainer();
      filterContainer.style.cssText = 'display: inline-flex; align-items: center;';

      const buttonToolbar = toolbar.querySelector('ng-transclude[rg-button-toolbar]');
      const referenceElement = buttonToolbar && buttonToolbar.parentElement === toolbar
        ? buttonToolbar
        : toolbar.firstElementChild;

      const isAlreadyPositioned = referenceElement
        ? filterContainer.parentElement === toolbar && filterContainer.nextElementSibling === referenceElement
        : filterContainer.parentElement === toolbar && toolbar.lastElementChild === filterContainer;

      if (!isAlreadyPositioned) {
        toolbar.insertBefore(filterContainer, referenceElement);
      }

      return filterContainer;
    }

    return null;
  }

  public findToolbar(): Element | null {
    return document.querySelector('.yt-agile-board__toolbar[data-test="yt-agile-board-toolbar"]') ||
           document.querySelector('.yt-agile-board__toolbar');
  }

  private getOrCreateFilterContainer(): HTMLDivElement {
    let filterContainer = document.getElementById('ytqf-filter-container') as HTMLDivElement | null;

    if (!filterContainer) {
      filterContainer = document.createElement('div');
      filterContainer.id = 'ytqf-filter-container';
    }

    return filterContainer;
  }

}
