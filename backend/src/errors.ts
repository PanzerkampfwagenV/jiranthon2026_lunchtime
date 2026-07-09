import type { ErrorCode } from './types.js';

/** 애플리케이션 에러. API 계약(3.3)의 에러 코드 규격을 따른다. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;

  constructor(code: ErrorCode, message: string, httpStatus: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
  }

  static invalidInput(message: string): AppError {
    return new AppError('INVALID_INPUT', message, 400);
  }

  static noResult(message: string): AppError {
    return new AppError('NO_RESULT', message, 404);
  }

  static upstream(message: string): AppError {
    return new AppError('UPSTREAM_ERROR', message, 502);
  }
}
