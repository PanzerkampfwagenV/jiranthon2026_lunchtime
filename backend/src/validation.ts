import { AppError } from './errors.js';
import type {
  LatLng,
  RecommendationRequest,
  TravelMode,
  TripType,
} from './types.js';

const VALID_MODES: TravelMode[] = ['walking', 'transit', 'driving'];
const VALID_TRIP_TYPES: TripType[] = ['oneway', 'roundtrip'];

/** availableMinutes 허용 범위 (프론트 입력 UI: 10~180분) */
const MIN_AVAILABLE_MINUTES = 10;
const MAX_AVAILABLE_MINUTES = 180;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function parseLocation(raw: unknown): LatLng {
  if (typeof raw !== 'object' || raw === null) {
    throw AppError.invalidInput('location은 필수입니다.');
  }
  const { lat, lng } = raw as Record<string, unknown>;
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    throw AppError.invalidInput('location.lat, location.lng는 숫자여야 합니다.');
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw AppError.invalidInput('location 좌표 범위가 올바르지 않습니다.');
  }
  return { lat, lng };
}

/** 요청 본문을 검증하고 정규화된 RecommendationRequest로 변환한다. */
export function parseRecommendationRequest(
  body: unknown,
): RecommendationRequest {
  if (typeof body !== 'object' || body === null) {
    throw AppError.invalidInput('요청 본문이 올바르지 않습니다.');
  }

  const { location, availableMinutes, mode, tags, tripType } =
    body as Record<string, unknown>;

  const parsedLocation = parseLocation(location);

  if (!isFiniteNumber(availableMinutes)) {
    throw AppError.invalidInput('availableMinutes는 필수입니다.');
  }
  if (
    availableMinutes < MIN_AVAILABLE_MINUTES ||
    availableMinutes > MAX_AVAILABLE_MINUTES
  ) {
    throw AppError.invalidInput(
      `availableMinutes는 ${MIN_AVAILABLE_MINUTES}~${MAX_AVAILABLE_MINUTES} 범위여야 합니다.`,
    );
  }

  if (typeof mode !== 'string' || !VALID_MODES.includes(mode as TravelMode)) {
    throw AppError.invalidInput(
      `mode는 ${VALID_MODES.join(', ')} 중 하나여야 합니다.`,
    );
  }

  let parsedTags: string[] | undefined;
  if (tags !== undefined) {
    if (
      !Array.isArray(tags) ||
      !tags.every((t): t is string => typeof t === 'string')
    ) {
      throw AppError.invalidInput('tags는 문자열 배열이어야 합니다.');
    }
    parsedTags = tags;
  }

  let parsedTripType: TripType = 'roundtrip';
  if (tripType !== undefined) {
    if (
      typeof tripType !== 'string' ||
      !VALID_TRIP_TYPES.includes(tripType as TripType)
    ) {
      throw AppError.invalidInput(
        `tripType은 ${VALID_TRIP_TYPES.join(', ')} 중 하나여야 합니다.`,
      );
    }
    parsedTripType = tripType as TripType;
  }

  return {
    location: parsedLocation,
    availableMinutes,
    mode: mode as TravelMode,
    tags: parsedTags,
    tripType: parsedTripType,
  };
}

/** GET /api/route 쿼리 파라미터 파싱 결과 */
export interface RouteQuery {
  origin: LatLng;
  destination: LatLng;
  mode: TravelMode;
}

function parseLatLngQuery(raw: unknown, label: string): LatLng {
  if (typeof raw !== 'string') {
    throw AppError.invalidInput(`${label}는 필수입니다.`);
  }
  const [latStr, lngStr] = raw.split(',');
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    throw AppError.invalidInput(`${label}는 "lat,lng" 형식이어야 합니다.`);
  }
  return parseLocation({ lat, lng });
}

/** GET /api/route?origin=lat,lng&destination=lat,lng&mode=... 쿼리 검증 */
export function parseRouteQuery(
  query: Record<string, unknown>,
): RouteQuery {
  const origin = parseLatLngQuery(query.origin, 'origin');
  const destination = parseLatLngQuery(query.destination, 'destination');

  const { mode } = query;
  if (typeof mode !== 'string' || !VALID_MODES.includes(mode as TravelMode)) {
    throw AppError.invalidInput(
      `mode는 ${VALID_MODES.join(', ')} 중 하나여야 합니다.`,
    );
  }

  return { origin, destination, mode: mode as TravelMode };
}

/** GET /api/place-detail 쿼리 파라미터 파싱 결과 */
export interface PlaceDetailQuery {
  name: string;
  category: string;
}

const MAX_NAME_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 50;

/** GET /api/place-detail?name=...&category=... 쿼리 검증 */
export function parsePlaceDetailQuery(
  query: Record<string, unknown>,
): PlaceDetailQuery {
  const { name, category } = query;
  if (typeof name !== 'string' || name.trim() === '') {
    throw AppError.invalidInput('name은 필수입니다.');
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw AppError.invalidInput(`name은 ${MAX_NAME_LENGTH}자를 넘을 수 없습니다.`);
  }
  const parsedCategory =
    typeof category === 'string' ? category.slice(0, MAX_CATEGORY_LENGTH) : '장소';

  return { name: name.trim(), category: parsedCategory };
}
