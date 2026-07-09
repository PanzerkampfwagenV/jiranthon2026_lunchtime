import type { LatLng } from './types.js';

/** 카카오 장소 검색 결과 (필요한 필드만) */
export interface KakaoPlace {
  name: string;
  category: string;
  location: LatLng;
  address: string;
}

interface KakaoApiDocument {
  place_name: string;
  category_group_name: string;
  category_name: string;
  road_address_name: string;
  address_name: string;
  x: string; // 경도(lng)
  y: string; // 위도(lat)
}

interface KakaoApiResponse {
  documents: KakaoApiDocument[];
}

const KAKAO_SEARCH_URL =
  'https://dapi.kakao.com/v2/local/search/keyword.json';

/**
 * 카카오 로컬 키워드 검색으로 장소명을 실제 좌표로 변환한다.
 * 출발지 좌표를 기준점으로 주어 가까운 결과가 우선 반환되도록 한다.
 *
 * @returns 검색 결과의 첫 번째 장소. 결과가 없으면 null.
 */
export async function searchPlace(
  keyword: string,
  _origin?: LatLng,
): Promise<KakaoPlace | null> {
  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) return null;

  // 정확도(accuracy) 정렬로 여러 결과를 받아 대표 장소를 고른다.
  // distance 정렬은 출발지 근처의 부속 시설(출구/요금소 등)을 잘못 잡는다.
  const params = new URLSearchParams({
    query: keyword,
    size: '5',
    sort: 'accuracy',
  });

  const res = await fetch(`${KAKAO_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${restKey}` },
  });

  if (!res.ok) {
    throw new Error(`Kakao 장소 검색 실패: ${res.status}`);
  }

  const data = (await res.json()) as KakaoApiResponse;
  const doc = pickBestDocument(data.documents, keyword);
  if (!doc) return null;

  return {
    name: doc.place_name,
    category: doc.category_group_name || doc.category_name || '장소',
    location: { lat: Number(doc.y), lng: Number(doc.x) },
    address: doc.road_address_name || doc.address_name,
  };
}

/**
 * 검색 결과 중 가장 대표성 있는 장소를 고른다.
 * - 부속 시설(출구/주차장/화장실/터널 등)로 보이는 이름은 후순위.
 * - 이름이 키워드와 정확히 일치하면 우선.
 */
function pickBestDocument(
  docs: KakaoApiDocument[],
  keyword: string,
): KakaoApiDocument | undefined {
  if (docs.length === 0) return undefined;

  const NOISE = /출입구|출구|주차장|화장실|터널|TG|요금소|정류장|승강장/;
  const normalized = keyword.replace(/\s/g, '');

  const scored = docs.map((d) => {
    let score = 0;
    const name = d.place_name.replace(/\s/g, '');
    if (name === normalized) score += 5;
    else if (name.includes(normalized) || normalized.includes(name)) score += 2;
    if (d.category_group_name) score += 1; // 대표 카테고리 그룹 보유
    if (NOISE.test(d.place_name)) score -= 5;
    return { d, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].d;
}

/** REST 키가 설정되어 장소 검색을 사용할 수 있는지 여부 */
export function isKakaoSearchAvailable(): boolean {
  return Boolean(process.env.KAKAO_REST_API_KEY);
}
