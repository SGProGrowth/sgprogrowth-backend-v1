import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { existsSync, statfsSync } from 'fs'
import { join } from 'path'
import { PrismaService } from '../../prisma/prisma.module'
import { RedisService } from '../../redis/redis.service'
import { StorageService } from '../storage/storage.service'
import { MailService } from '../mail/mail.service'
import { QueueSchedulerService } from '../../queue/queue-scheduler.service'

type CheckResult = { status: 'up' | 'down' | 'degraded'; detail?: string; latencyMs?: number }

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private storage: StorageService,
    private mail: MailService,
    private config: ConfigService,
    private queues: QueueSchedulerService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check (legacy)' })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ok', timestamp: new Date().toISOString() }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    const mem = process.memoryUsage()
    return {
      status: 'ok',
      uptime: process.uptime(),
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    const checks = await this.runChecks(true)
    const allUp = Object.values(checks).every((c) => c.status === 'up' || c.status === 'degraded')
    return {
      status: allUp ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    }
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health with all subsystems' })
  async detailed() {
    const checks = await this.runChecks(false)
    const queues = this.redis.isAvailable() ? await this.queues.getQueueStats() : []
    const disk = this.diskUsage()
    const mem = process.memoryUsage()

    return {
      status: Object.values(checks).every((c) => c.status !== 'down') ? 'ok' : 'degraded',
      checks,
      queues,
      system: {
        disk,
        memory: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        },
        nodeVersion: process.version,
        env: this.config.get('NODE_ENV') ?? 'development',
      },
      timestamp: new Date().toISOString(),
    }
  }

  private async runChecks(essentialOnly: boolean): Promise<Record<string, CheckResult>> {
    const checks: Record<string, CheckResult> = {}

    const dbStart = Date.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      checks.database = { status: 'up', latencyMs: Date.now() - dbStart }
    } catch (e) {
      checks.database = {
        status: 'down',
        detail: e instanceof Error ? e.message : 'Database unreachable',
      }
    }

    const redisStart = Date.now()
    if (this.redis.isAvailable()) {
      const ok = await this.redis.ping()
      checks.redis = ok
        ? { status: 'up', latencyMs: Date.now() - redisStart }
        : { status: 'down', detail: 'Redis ping failed' }
    } else {
      checks.redis = { status: 'degraded', detail: 'Redis not configured' }
    }

    if (!essentialOnly) {
      try {
        const provider = this.storage.getProvider()
        checks.storage = { status: 'up', detail: `provider=${provider}` }
      } catch (e) {
        checks.storage = {
          status: 'down',
          detail: e instanceof Error ? e.message : 'Storage check failed',
        }
      }

      const smtpConfigured = Boolean(
        this.config.get('SMTP_HOST') && this.config.get('SMTP_USER'),
      )
      checks.smtp = smtpConfigured
        ? { status: 'up', detail: 'SMTP configured' }
        : { status: 'degraded', detail: 'Dev console mail mode' }

      if (this.redis.isAvailable()) {
        try {
          const stats = await this.queues.getQueueStats()
          const failed = stats.reduce((s, q) => s + q.failed, 0)
          checks.queues = {
            status: failed > 100 ? 'degraded' : 'up',
            detail: `${stats.length} queues, ${failed} failed jobs`,
          }
        } catch (e) {
          checks.queues = {
            status: 'degraded',
            detail: e instanceof Error ? e.message : 'Queue stats unavailable',
          }
        }
      }
    }

    return checks
  }

  private diskUsage() {
    try {
      const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads')
      if (!existsSync(uploadDir)) {
        return { path: uploadDir, status: 'unknown' as const }
      }
      const stats = statfsSync(uploadDir)
      const totalBytes = stats.blocks * stats.bsize
      const freeBytes = stats.bavail * stats.bsize
      return {
        path: uploadDir,
        totalMb: Math.round(totalBytes / 1024 / 1024),
        freeMb: Math.round(freeBytes / 1024 / 1024),
        usedPct: Math.round(((totalBytes - freeBytes) / totalBytes) * 100),
      }
    } catch {
      return { status: 'unknown' as const }
    }
  }
}
