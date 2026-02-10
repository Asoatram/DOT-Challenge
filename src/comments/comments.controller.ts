import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles/roles.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';

type AuthenticatedRequestUser = {
  id: string;
  email: string;
  role: string;
};

@Controller('api/v1/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'AGENT', 'REQUESTER')
@ApiTags('Comments')
@ApiSecurity('Bearer')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateCommentDto })
  create(
    @Req() req: Request & { user: AuthenticatedRequestUser },
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(createCommentDto, req.user.id);
  }

  @Get()
  findAll(@Query() query: ListCommentsDto) {
    return this.commentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateCommentDto })
  update(
    @Req() req: Request & { user: AuthenticatedRequestUser },
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, updateCommentDto, req.user);
  }

  @Delete(':id')
  remove(
    @Req() req: Request & { user: AuthenticatedRequestUser },
    @Param('id') id: string,
  ) {
    return this.commentsService.remove(id, req.user);
  }
}
