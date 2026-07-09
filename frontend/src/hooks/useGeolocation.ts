import { useState, useCallback } from 'react';
import type { LatLng } from '../types';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  coords: LatLng | null;
}

/** navigator.geolocation 을 감싼 현재 위치 조회 훅 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    coords: null,
  });

  const requestLocation = useCallback((): Promise<LatLng> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const message = '이 브라우저에서는 위치 기능을 사용할 수 없습니다.';
        setState({ loading: false, error: message, coords: null });
        reject(new Error(message));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setState({ loading: false, error: null, coords });
          resolve(coords);
        },
        (err) => {
          let message = '위치를 가져오지 못했습니다.';
          if (err.code === err.PERMISSION_DENIED) {
            message =
              '위치 권한이 거부되었습니다. 브라우저 설정에서 허용하거나 직접 위치를 입력해 주세요.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = '현재 위치 정보를 사용할 수 없습니다.';
          } else if (err.code === err.TIMEOUT) {
            message = '위치 요청 시간이 초과되었습니다. 다시 시도해 주세요.';
          }
          setState({ loading: false, error: message, coords: null });
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  return { ...state, requestLocation };
}
