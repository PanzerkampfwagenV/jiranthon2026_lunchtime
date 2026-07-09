// Kakao Maps JavaScript SDK 최소 타입 선언 (개발자 B가 사용하는 API 범위)
// 전체 SDK 타입은 방대하므로, MapView에서 실제로 쓰는 부분만 선언한다.

declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor();
    extend(latlng: LatLng): void;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setLevel(level: number): void;
    setBounds(bounds: LatLngBounds): void;
    relayout(): void;
  }

  interface MarkerImageOptions {
    offset?: Point;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions);
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    title?: string;
    image?: MarkerImage;
    zIndex?: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setImage(image: MarkerImage): void;
    setZIndex(zIndex: number): void;
    getPosition(): LatLng;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    position?: LatLng;
    removable?: boolean;
    zIndex?: number;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, marker?: Marker): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  namespace event {
    function addListener(
      target: Marker | Map,
      type: string,
      handler: () => void,
    ): void;
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
