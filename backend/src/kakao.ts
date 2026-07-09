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
const KAKAO_REGION_URL =
  'https://dapi.kakao.com/v2/local/geo/coord2regioncode.json';

interface RegionDocument {
  region_1depth_name: string; // 시/도 (예: 경기)
  region_2depth_name: string; // 시/군/구 (예: 성남시 분당구)
  region_3depth_name: string; // 동/읍/면
}

/**
 * 좌표를 행정구역명(예: "경기 성남시 분당구 삼평동")으로 변환한다.
 * LLM이 출발지 지역을 정확히 인지하도록 프롬프트에 넣는 용도.
 * 실패 시 null을 반환한다(치명적이지 않음).
 */
export async function reverseGeocode(origin: LatLng): Promise<string | null> {
  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) return null;

  const params = new URLSearchParams({
    x: String(origin.lng),
    y: String(origin.lat),
  });
  const res = await fetch(`${KAKAO_REGION_URL}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${restKey}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { documents: RegionDocument[] };
  const d = data.documents[0];
  if (!d) return null;
  return [d.region_1depth_name, d.region_2depth_name, d.region_3depth_name]
    .filter(Boolean)
    .join(' ');
}

/**
 * 카카오 로컬 키워드 검색으로 장소명을 실제 좌표로 변환한다.
 * 출발지 좌표를 기준점으로 주어 가까운 결과가 우선 반환되도록 한다.
 *
 * @returns 검색 결과의 첫 번째 장소. 결과가 없으면 null.
 */
export async function searchPlace(
  keyword: string,
  origin?: LatLng,
): Promise<KakaoPlace | null> {
  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) return null;

  // 1차: 출발지 중심 반경 20km 내에서 검색한다.
  // 동명 장소(전국의 같은 이름)가 서울 등 먼 곳으로 잘못 매칭되는 것을 막는다.
  if (origin) {
    const nearby = await requestSearch(keyword, restKey, origin);
    const picked = pickBestDocument(nearby, keyword);
    if (picked) return toPlace(picked);
  }

  // 2차: 반경 내 결과가 없으면 전국(정확도순)에서 검색한다.
  const all = await requestSearch(keyword, restKey);
  const doc = pickBestDocument(all, keyword);
  return doc ? toPlace(doc) : null;
}

/** 카카오 로컬 키워드 검색 요청. origin이 있으면 반경 20km로 한정한다. */
async function requestSearch(
  keyword: string,
  restKey: string,
  origin?: LatLng,
): Promise<KakaoApiDocument[]> {
  const params = new URLSearchParams({
    query: keyword,
    size: '5',
    sort: 'accuracy',
  });
  if (origin) {
    params.set('x', String(origin.lng));
    params.set('y', String(origin.lat));
    params.set('radius', '20000'); // 20km
  }

  const res = await fetch(`${KAKAO_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${restKey}` },
  });
  if (!res.ok) {
    throw new Error(`Kakao 장소 검색 실패: ${res.status}`);
  }
  const data = (await res.json()) as KakaoApiResponse;
  return data.documents;
}

/** 카카오 문서를 내부 KakaoPlace 형태로 변환한다. */
function toPlace(doc: KakaoApiDocument): KakaoPlace {
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
