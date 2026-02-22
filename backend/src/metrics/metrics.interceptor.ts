import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MetricsService {
  private requestCount = 0;
  private errorCount = 0;
  private latencyBuckets: Record<string, number> = {
    '50': 0, '100': 0, '250': 0, '500': 0, '1000': 0, '2500': 0, '5000': 0, 'inf': 0,
  };
  private requestsByMethod: Record<string, number> = {};
  private requestsByStatus: Record<string, number> = {};

  recordRequest(method: string, statusCode: number, durationMs: number) {
    this.requestCount++;
    this.requestsByMethod[method] = (this.requestsByMethod[method] || 0) + 1;
    this.requestsByStatus[String(statusCode)] = (this.requestsByStatus[String(statusCode)] || 0) + 1;

    if (statusCode >= 500) this.errorCount++;

    const buckets = [50, 100, 250, 500, 1000, 2500, 5000];
    for (const b of buckets) {
      if (durationMs <= b) { this.latencyBuckets[String(b)]++; break; }
    }
    this.latencyBuckets['inf']++;
  }

  serialize(): string {
    const lines: string[] = [];
    const mem = process.memoryUsage();

    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    lines.push(`http_requests_total ${this.requestCount}`);

    lines.push('# HELP http_errors_total Total HTTP 5xx errors');
    lines.push('# TYPE http_errors_total counter');
    lines.push(`http_errors_total ${this.errorCount}`);

    lines.push('# HELP http_request_duration_ms_bucket Request latency histogram');
    lines.push('# TYPE http_request_duration_ms_bucket histogram');
    for (const [bucket, count] of Object.entries(this.latencyBuckets)) {
      lines.push(`http_request_duration_ms_bucket{le="${bucket}"} ${count}`);
    }

    lines.push('# HELP process_memory_rss_bytes Resident set size');
    lines.push('# TYPE process_memory_rss_bytes gauge');
    lines.push(`process_memory_rss_bytes ${mem.rss}`);

    lines.push('# HELP process_memory_heap_used_bytes Heap used');
    lines.push('# TYPE process_memory_heap_used_bytes gauge');
    lines.push(`process_memory_heap_used_bytes ${mem.heapUsed}`);

    lines.push('# HELP process_uptime_seconds Process uptime');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${Math.floor(process.uptime())}`);

    for (const [method, count] of Object.entries(this.requestsByMethod)) {
      lines.push(`http_requests_by_method{method="${method}"} ${count}`);
    }
    for (const [status, count] of Object.entries(this.requestsByStatus)) {
      lines.push(`http_requests_by_status{status="${status}"} ${count}`);
    }

    return lines.join('\n') + '\n';
  }
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          this.metricsService.recordRequest(req.method, res.statusCode, Date.now() - start);
        },
        error: (err) => {
          const status = err?.status || 500;
          this.metricsService.recordRequest(req.method, status, Date.now() - start);
        },
      }),
    );
  }
}
