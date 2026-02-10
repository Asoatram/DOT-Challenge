import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles/roles.guard';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, RolesGuard],
})
export class CategoriesModule {}
