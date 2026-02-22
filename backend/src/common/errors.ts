export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static validation(message: string, details?: unknown) {
    return new AppError('VALIDATION_ERROR', message, 400, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError('FORBIDDEN', message, 403);
  }

  static notFound(resource = 'Resource') {
    return new AppError('NOT_FOUND', `${resource} not found`, 404);
  }

  static conflict(message: string) {
    return new AppError('CONFLICT', message, 409);
  }

  static rateLimited() {
    return new AppError('RATE_LIMITED', 'Too many requests', 429);
  }
}
