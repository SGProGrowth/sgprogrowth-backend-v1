import { Module } from '@nestjs/common'
import { StorageModule } from '../storage/storage.module'
import { ImageProcessorService } from './image-processor.service'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'

@Module({
  imports: [StorageModule],
  controllers: [MediaController],
  providers: [MediaService, ImageProcessorService],
  exports: [MediaService],
})
export class MediaModule {}
