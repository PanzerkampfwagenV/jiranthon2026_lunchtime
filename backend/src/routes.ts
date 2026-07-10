import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors.js';
import { generatePlaceDetail, isLlmAvailable } from './llm.js';
import { recommendPlaces } from './recommendation.js';
import { getRoute } from './route.js';
import type { PlaceDetailResponse, RecommendationResponse } from './types.js';
import {
  parsePlaceDetailQuery,
  parseRecommendationRequest,
  parseRouteQuery,
} from './validation.js';

export const apiRouter = Router();

/** POST /api/recommendations — 자투리 시간 여행 추천 */
apiRouter.post(
  '/recommendations',
  async (req: Request, res: Response, next: NextFunction) => {
    // async 핸들러의 에러는 수동으로 next()에 전달해야 중앙 에러 핸들러로 간다.
    try {
      const parsed = parseRecommendationRequest(req.body);
      const { places, tagFallback } = await recommendPlaces(parsed);

      if (places.length === 0) {
        throw AppError.noResult('주어진 시간 내 도달 가능한 장소가 없습니다.');
      }

      const body: RecommendationResponse = { places, tagFallback };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/route?origin=lat,lng&destination=lat,lng&mode=walking|transit|driving
 * 두 지점 간 경로(지도용 좌표 목록)와 실제(또는 추정) 소요시간/거리를 반환한다.
 * - driving: Kakao Mobility 자동차 길찾기 실제 경로
 * - walking/transit: 실제 경로 API 미제공 → 직선 대체(isActualRoute=false)
 */
apiRouter.get(
  '/route',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { origin, destination, mode } = parseRouteQuery(
        req.query as Record<string, unknown>,
      );
      const result = await getRoute(origin, destination, mode);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/** 장소 상세 정보 캐시 (같은 장소 반복 조회 시 LLM 재호출 방지). TTL 1시간. */
const PLACE_DETAIL_TTL_MS = 60 * 60 * 1000;
const placeDetailCache = new Map<
  string,
  { data: PlaceDetailResponse; expiresAt: number }
>();

/**
 * GET /api/place-detail?name=...&category=...
 * 장소명 기준으로 활동·하이라이트·소개를 LLM으로 생성한다.
 * 키가 없거나 생성 실패 시 최소 정보(generated=false)로 폴백한다.
 */
apiRouter.get(
  '/place-detail',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, category } = parsePlaceDetailQuery(
        req.query as Record<string, unknown>,
      );

      const cacheKey = `${name}::${category}`;
      const cached = placeDetailCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        res.json(cached.data);
        return;
      }

      let body: PlaceDetailResponse;
      if (isLlmAvailable()) {
        try {
          const detail = await generatePlaceDetail(name, category);
          body = { ...detail, generated: true };
        } catch (err) {
          console.error('[place-detail] LLM 생성 실패, 폴백:', err);
          body = fallbackPlaceDetail(category);
        }
      } else {
        body = fallbackPlaceDetail(category);
      }

      placeDetailCache.set(cacheKey, {
        data: body,
        expiresAt: Date.now() + PLACE_DETAIL_TTL_MS,
      });
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

/** LLM을 사용할 수 없을 때의 최소 상세 정보 */
function fallbackPlaceDetail(category: string): PlaceDetailResponse {
  return {
    activities: [],
    highlights: [],
    summary: `${category} 카테고리의 장소입니다. 자세한 정보는 카카오맵에서 확인해 보세요.`,
    generated: false,
  };
}
