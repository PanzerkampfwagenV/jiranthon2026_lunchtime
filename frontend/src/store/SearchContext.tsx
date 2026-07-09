import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type {
  SelectedLocation,
  TravelMode,
  MbtiType,
  LuckyDayInfo,
  Place,
} from '../types';

interface SearchState {
  location: SelectedLocation | null;
  availableMinutes: number;
  mode: TravelMode;
  mbti: MbtiType | null;
  luckyDay: LuckyDayInfo | null;
  places: Place[];
  setLocation: (loc: SelectedLocation | null) => void;
  setAvailableMinutes: (minutes: number) => void;
  setMode: (mode: TravelMode) => void;
  setMbti: (mbti: MbtiType | null) => void;
  setLuckyDay: (info: LuckyDayInfo | null) => void;
  setPlaces: (places: Place[]) => void;
}

const SearchContext = createContext<SearchState | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  // 기본값: 자투리 시간 3시간(180분)
  const [availableMinutes, setAvailableMinutes] = useState<number>(180);
  // 기본값: 대중교통
  const [mode, setMode] = useState<TravelMode>('transit');
  // MBTI는 선택 사항. 기본값 없음(null).
  const [mbti, setMbti] = useState<MbtiType | null>(null);
  // 럭키데이(오늘의 운세)도 선택 사항. 기본값 없음(null).
  const [luckyDay, setLuckyDay] = useState<LuckyDayInfo | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  return (
    <SearchContext.Provider
      value={{
        location,
        availableMinutes,
        mode,
        mbti,
        luckyDay,
        places,
        setLocation,
        setAvailableMinutes,
        setMode,
        setMbti,
        setLuckyDay,
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
