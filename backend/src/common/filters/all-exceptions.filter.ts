import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error'

    if (status >= 500) {
      this.logger.error(
        {
          requestId: request.requestId,
          path: request.url,
          method: request.method,
          status,
          error: exception instanceof Error ? exception.stack : String(exception),
        },
        'Unhandled exception',
      )
    }

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (message as { message?: string }).message,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    })
  }
}
