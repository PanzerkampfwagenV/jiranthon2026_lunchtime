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

    // 이미 maps까지 초기화 완료된 경우
    if (window.kakao?.maps) {
      setStatus('ready');
      return;
    }

    setStatus('loading');

    let cancelled = false;

    const onReady = () => {
      // autoload=false 이므로 maps.load로 초기화 후 ready 처리
      window.kakao.maps.load(() => {
        if (!cancelled) setStatus('ready');
      });
    };
    const onError = () => {
      if (!cancelled) setStatus('error');
    };

    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      // 스크립트가 이미 DOM에 있는 경우:
      // window.kakao가 준비돼 있으면 즉시 초기화, 아니면 load 이벤트를 기다린다.
      if (window.kakao) {
        onReady();
      } else {
        existing.addEventListener('load', onReady);
        existing.addEventListener('error', onError);
      }
      return () => {
        cancelled = true;
        existing.removeEventListener('load', onReady);
        existing.removeEventListener('error', onError);
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    // services 라이브러리 포함: 장소 검색(Places) API 사용
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener('load', onReady);
    script.addEventListener('error', onError);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', onReady);
      script.removeEventListener('error', onError);
    };
  }, [appKey]);

  return status;
}
