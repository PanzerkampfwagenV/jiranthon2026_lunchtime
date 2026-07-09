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

      let settled = false;
      const TIMEOUT_MS = 8000;

      // macOS/Chrome 환경에서 getCurrentPosition 콜백이 전혀 호출되지 않고
      // 멈추는 경우가 있어, 브라우저 내부 timeout 옵션만 믿지 않고
      // 별도의 안전 타이머로 반드시 응답(에러)을 만들어 준다.
      const fallbackTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const message =
          '위치 요청이 응답하지 않습니다. 기기의 위치 서비스(Wi-Fi/GPS)를 확인하거나 직접 위치를 입력해 주세요.';
        setState({ loading: false, error: message, coords: null });
        reject(new Error(message));
      }, TIMEOUT_MS);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (settled) return;
          settled = true;
          clearTimeout(fallbackTimer);
          const coords: LatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setState({ loading: false, error: null, coords });
          resolve(coords);
        },
        (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(fallbackTimer);
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
        { enableHighAccuracy: false, timeout: TIMEOUT_MS, maximumAge: 300000 },
      );
    });
  }, []);

  return { ...state, requestLocation };
}
