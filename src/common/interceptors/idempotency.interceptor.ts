import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyKey } from '../../modules/idempotency/entities/idempotency-key.entity';
import * as crypto from 'crypto';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Solo aplicar a métodos POST, PUT, PATCH
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return next.handle();
    }

    const idempotencyKey = request.headers['idempotency-key'] as string;

    // Si no hay idempotency key, continuar normalmente
    if (!idempotencyKey) {
      return next.handle();
    }

    // Validar formato UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      throw new ConflictException('Invalid idempotency key format. Must be a valid UUID.');
    }

    const endpoint = request.url;
    const requestHash = this.generateRequestHash(request.body);

    try {
      // Buscar si ya existe
      const existing = await this.idempotencyRepo.findOne({
        where: { idempotencyKey, endpoint },
      });

      if (existing) {
        // Verificar si expiró
        if (new Date() > existing.expiresAt) {
          await this.idempotencyRepo.delete(existing.id);
          this.logger.log(`Expired idempotency key removed: ${idempotencyKey}`);
        } else {
          // Verificar que el request sea idéntico
          if (existing.requestHash !== requestHash) {
            throw new ConflictException(
              'Idempotency key already used with different request body',
            );
          }

          // Retornar respuesta cacheada
          this.logger.log(`Returning cached response for idempotency key: ${idempotencyKey}`);
          response.status(existing.responseStatus);
          return of(existing.responseBody);
        }
      }

      // Procesar request normalmente
      return next.handle().pipe(
        tap(async (data) => {
          // Guardar respuesta para futura idempotencia
          const expiryHours = parseInt(
            process.env.IDEMPOTENCY_KEY_EXPIRY_HOURS || '24',
            10,
          );
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + expiryHours);

          await this.idempotencyRepo.save({
            idempotencyKey,
            endpoint,
            requestHash,
            responseStatus: response.statusCode,
            responseBody: data,
            expiresAt,
          });

          this.logger.log(`Idempotency key saved: ${idempotencyKey}`);
        }),
      );
    } catch (error) {
      this.logger.error(`Idempotency error: ${error.message}`);
      throw error;
    }
  }

  private generateRequestHash(body: any): string {
    const bodyString = JSON.stringify(body);
    return crypto.createHash('sha256').update(bodyString).digest('hex');
  }
}
