import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles/roles.guard';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, RolesGuard],
})
export class CommentsModule {}
