import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register: client.Registry;

  // Custom metrics
  readonly httpRequestDuration: client.Histogram;
  readonly httpRequestTotal: client.Counter;
  readonly httpErrorTotal: client.Counter;
  readonly activeConnections: client.Gauge;
  readonly wsConnections: client.Gauge;
  readonly bookingTotal: client.Counter;
  readonly paymentTotal: client.Counter;
  readonly notificationSent: client.Counter;
  readonly dbQueryDuration: client.Histogram;
  readonly cacheHitTotal: client.Counter;
  readonly cacheMissTotal: client.Counter;

  constructor() {
    this.register = new client.Registry();

    // Default metrics (CPU, memory, event loop, etc.)
    client.collectDefaultMetrics({ register: this.register, prefix: 'areton_' });

    // ── HTTP Metrics ──────────────────────────

    this.httpRequestDuration = new client.Histogram({
      name: 'areton_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'areton_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpErrorTotal = new client.Counter({
      name: 'areton_http_errors_total',
      help: 'Total number of HTTP errors (4xx/5xx)',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.activeConnections = new client.Gauge({
      name: 'areton_active_connections',
      help: 'Number of active HTTP connections',
      registers: [this.register],
    });

    // ── WebSocket Metrics ─────────────────────

    this.wsConnections = new client.Gauge({
      name: 'areton_websocket_connections',
      help: 'Number of active WebSocket connections',
      registers: [this.register],
    });

    // ── Business Metrics ──────────────────────

    this.bookingTotal = new client.Counter({
      name: 'areton_bookings_total',
      help: 'Total bookings created',
      labelNames: ['status', 'service_type'],
      registers: [this.register],
    });

    this.paymentTotal = new client.Counter({
      name: 'areton_payments_total',
      help: 'Total payments processed',
      labelNames: ['status', 'method'],
      registers: [this.register],
    });

    this.notificationSent = new client.Counter({
      name: 'areton_notifications_sent_total',
      help: 'Total notifications sent',
      labelNames: ['channel', 'type'],
      registers: [this.register],
    });

    // ── Database Metrics ──────────────────────

    this.dbQueryDuration = new client.Histogram({
      name: 'areton_db_query_duration_seconds',
      help: 'Prisma database query duration',
      labelNames: ['model', 'action'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.register],
    });

    // ── Cache Metrics ─────────────────────────

    this.cacheHitTotal = new client.Counter({
      name: 'areton_cache_hits_total',
      help: 'Total Redis cache hits',
      labelNames: ['key_pattern'],
      registers: [this.register],
    });

    this.cacheMissTotal = new client.Counter({
      name: 'areton_cache_misses_total',
      help: 'Total Redis cache misses',
      labelNames: ['key_pattern'],
      registers: [this.register],
    });
  }

  onModuleInit() {
    // Metrics initialized via constructor
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
