import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors.js';
import { recommendPlaces } from './recommendation.js';
import type { RecommendationResponse } from './types.js';
import { parseRecommendationRequest } from './validation.js';

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
