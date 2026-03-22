import { useState, useEffect } from 'react';
import { UtilsService } from '../services/utils';

/**
 * Tracks the current board path and the visible query assist text.
 */
export function useQueryParams() {
  const utilsService = UtilsService.getInstance();
  const [query, setQuery] = useState(() => utilsService.getCurrentQuery());
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const updateState = () => {
      const currentQuery = utilsService.getCurrentQuery();
      const currentPathname = window.location.pathname;

      setQuery((previousQuery) => previousQuery === currentQuery ? previousQuery : currentQuery);
      setPathname((previousPathname) => previousPathname === currentPathname ? previousPathname : currentPathname);
    };

    const handleLocationChange = () => {
      updateState();
    };

    const intervalId = window.setInterval(() => {
      updateState();
    }, 300);

    window.addEventListener('popstate', handleLocationChange);
    updateState();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [utilsService]);

  return { 
    query,
    pathname
  };
}
