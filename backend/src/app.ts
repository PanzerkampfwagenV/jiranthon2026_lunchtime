import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors.js';
import { apiRouter } from './routes.js';
import type { ErrorResponse } from './types.js';

export function createApp() {
  const app = express();

  // CORS: 환경변수로 허용 오리진 지정. 미설정 시 개발 편의를 위해 전체 허용.
  const corsOrigin = process.env.CORS_ORIGIN;
  app.use(
    cors({
      origin: corsOrigin
        ? corsOrigin.split(',').map((o) => o.trim())
        : true,
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  // 헬스 체크
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiRouter);

  // 404 핸들러
  app.use((_req: Request, res: Response) => {
    const body: ErrorResponse = {
      error: { code: 'INVALID_INPUT', message: '존재하지 않는 경로입니다.' },
    };
    res.status(404).json(body);
  });

  // 중앙 에러 핸들러 — 에러 응답 규격(3.3) 통일
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      const body: ErrorResponse = {
        error: { code: err.code, message: err.message },
      };
      res.status(err.httpStatus).json(body);
      return;
    }

    // JSON 파싱 실패 등 예기치 못한 에러
    console.error('[unhandled error]', err);
    const body: ErrorResponse = {
      error: { code: 'UPSTREAM_ERROR', message: '서버 내부 오류가 발생했습니다.' },
    };
    res.status(500).json(body);
  });

  return app;
}
