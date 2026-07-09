import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors.js';
import { recommendPlaces } from './recommendation.js';
import { getRoute } from './route.js';
import type { RecommendationResponse } from './types.js';
import { parseRecommendationRequest, parseRouteQuery } from './validation.js';

export const apiRouter = Router();

/** POST /api/recommendations — 자투리 시간 여행 추천 */
apiRouter.post(
  '/recommendations',
  async (req: Request, res: Response, next: NextFunction) => {
    // async 핸들러의 에러는 수동으로 next()에 전달해야 중앙 에러 핸들러로 간다.
    try {
      const parsed = parseRecommendationRequest(req.body);
      const places = await recommendPlaces(parsed);

      if (places.length === 0) {
        throw AppError.noResult('주어진 시간 내 도달 가능한 장소가 없습니다.');
      }

      const body: RecommendationResponse = { places };
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
