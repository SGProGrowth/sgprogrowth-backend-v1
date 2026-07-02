import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../../prisma/prisma.module'
import { StorageService } from '../../modules/storage/storage.service'
import { QUEUE_CLEANUP } from '../queue.constants'

export type CleanupJobData = {
  kind: 'orphan-media' | 'expired-tokens'
}

@Processor(QUEUE_CLEANUP)
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name)

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {
    super()
  }

  async process(job: Job<CleanupJobData>): Promise<void> {
    if (job.data.kind === 'orphan-media') {
      const cutoff = new Date(Date.now() - 7 * 86400000)
      const orphans = await this.prisma.mediaAsset.findMany({
        where: { deletedAt: { lt: cutoff } },
        take: 200,
      })
      for (const asset of orphans) {
        await this.storage.deleteObject(asset.storageKey)
        const variants = asset.variants as Record<string, { key?: string }>
        for (const v of Object.values(variants)) {
          if (v?.key) await this.storage.deleteObject(v.key)
        }
        await this.prisma.mediaAsset.delete({ where: { id: asset.id } })
      }
      this.logger.log(`Hard-deleted ${orphans.length} orphaned media assets`)
      return
    }

    const now = new Date()
    const [emailTokens, resetTokens] = await Promise.all([
      this.prisma.emailVerificationToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
      }),
    ])
    this.logger.log(
      `Cleaned ${emailTokens.count} email tokens, ${resetTokens.count} reset tokens`,
    )
  }
}
