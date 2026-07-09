import { useEffect, useState } from 'react';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error' | 'no-key';

const SCRIPT_ID = 'kakao-maps-sdk';

/**
 * Kakao Maps JavaScript SDK를 동적으로 로드하는 훅.
 * VITE_KAKAO_MAP_KEY가 없으면 'no-key' 상태를 반환해
 * 지도 없이도 목록 화면이 동작하도록 한다.
 */
export function useKakaoLoader(): LoadStatus {
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  const [status, setStatus] = useState<LoadStatus>(() =>
    appKey ? 'idle' : 'no-key',
  );

  useEffect(() => {
    if (!appKey) {
      setStatus('no-key');
      return;
    }

    // 이미 로드 완료된 경우
    if (window.kakao?.maps) {
      setStatus('ready');
      return;
    }

    setStatus('loading');

    const onReady = () => {
      window.kakao.maps.load(() => setStatus('ready'));
    };

    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener('load', onReady);
      existing.addEventListener('error', () => setStatus('error'));
      return () => {
        existing.removeEventListener('load', onReady);
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.addEventListener('load', onReady);
    script.addEventListener('error', () => setStatus('error'));
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onReady);
    };
  }, [appKey]);

  return status;
}
