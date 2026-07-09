import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type {
  SelectedLocation,
  TravelMode,
  Place,
} from '../types';

interface SearchState {
  location: SelectedLocation | null;
  availableMinutes: number;
  mode: TravelMode;
  places: Place[];
  setLocation: (loc: SelectedLocation | null) => void;
  setAvailableMinutes: (minutes: number) => void;
  setMode: (mode: TravelMode) => void;
  setPlaces: (places: Place[]) => void;
}

const SearchContext = createContext<SearchState | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  // 기본값: 자투리 시간 3시간(180분)
  const [availableMinutes, setAvailableMinutes] = useState<number>(180);
  // 기본값: 대중교통
  const [mode, setMode] = useState<TravelMode>('transit');
  const [places, setPlaces] = useState<Place[]>([]);

  return (
    <SearchContext.Provider
      value={{
        location,
        availableMinutes,
        mode,
        places,
        setLocation,
        setAvailableMinutes,
        setMode,
        setPlaces,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSearch(): SearchState {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return ctx;
}
