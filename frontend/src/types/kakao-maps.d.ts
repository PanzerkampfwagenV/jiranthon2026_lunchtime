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

  interface CustomOverlayOptions {
    position: LatLng;
    content?: string | HTMLElement;
    map?: Map;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
  }

  namespace event {
    function addListener(
      target: Marker | Map,
      type: string,
      handler: () => void,
    ): void;
  }

  interface PolylineOptions {
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
    map?: Map;
  }

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
    setPath(path: LatLng[]): void;
  }

  function load(callback: () => void): void;

  // services 라이브러리 (장소 검색 등)
  namespace services {
    /** 검색 결과 상태 코드 */
    enum Status {
      OK = 'OK',
      ZERO_RESULT = 'ZERO_RESULT',
      ERROR = 'ERROR',
    }

    /** 키워드 검색 결과 항목 (일부 필드만 선언) */
    interface PlacesSearchResultItem {
      id: string;
      place_name: string;
      category_group_name: string;
      category_name: string;
      address_name: string;
      road_address_name: string;
      /** 경도 (문자열) */
      x: string;
      /** 위도 (문자열) */
      y: string;
      phone: string;
      place_url: string;
    }

    interface Pagination {
      totalCount: number;
      hasNextPage: boolean;
      current: number;
      gotoPage(page: number): void;
      nextPage(): void;
    }

    interface KeywordSearchOptions {
      /** 결과 개수 (1~15) */
      size?: number;
      /** 페이지 번호 */
      page?: number;
      /** 카테고리 그룹 코드로 결과를 필터링 (예: 'PO3' 공공기관) */
      category_group_code?: string;
    }

    class Places {
      constructor();
      keywordSearch(
        keyword: string,
        callback: (
          result: PlacesSearchResultItem[],
          status: Status,
          pagination: Pagination,
        ) => void,
        options?: KeywordSearchOptions,
      ): void;
    }

    /** 주소 검색 결과 항목 (일부 필드만 선언) */
    interface AddressSearchResultItem {
      address_name: string;
      /** 경도 (문자열) */
      x: string;
      /** 위도 (문자열) */
      y: string;
    }

    /** 주소 ↔ 좌표 변환 서비스. "서울", "강남구"처럼 지역/주소를 입력했을 때 사용한다. */
    class Geocoder {
      constructor();
      addressSearch(
        address: string,
        callback: (
          result: AddressSearchResultItem[],
          status: Status,
        ) => void,
      ): void;
    }
  }
}

interface Window {
  kakao: typeof kakao;
}
