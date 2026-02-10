import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../prisma/prisma.service';
import { paginateOffset } from '../utils/pagination.helper';
import { ListCommentsDto } from './dto/list-comments.dto';

type AuthenticatedUser = {
  id: string;
  role: string;
};

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly commentSelect = {
    id: true,
    body: true,
    ticketId: true,
    createdAt: true,
    updatedAt: true,
    author: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
  };

  async create(createCommentDto: CreateCommentDto, authorId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: createCommentDto.ticketId },
      select: { id: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.comment.create({
      data: {
        body: createCommentDto.body,
        ticketId: createCommentDto.ticketId,
        authorId,
      },
      select: this.commentSelect,
    });
  }

  findAll(query: ListCommentsDto) {
    const where = query.ticketId ? { ticketId: query.ticketId } : undefined;

    return paginateOffset({
      page: query.page,
      limit: query.limit,
      getItems: (skip, take) =>
        this.prisma.comment.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: this.commentSelect,
        }),
      getTotal: () => this.prisma.comment.count({ where }),
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: this.commentSelect,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, user: AuthenticatedUser) {
    if (!user?.id) {
      throw new UnauthorizedException();
    }

    if (!updateCommentDto.body) {
      throw new BadRequestException('No fields provided for update');
    }

    const existing = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    this.assertCommentWriteAccess(existing.authorId, user);

    return this.prisma.comment.update({
      where: { id },
      data: { body: updateCommentDto.body },
      select: this.commentSelect,
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    if (!user?.id) {
      throw new UnauthorizedException();
    }

    const existing = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    this.assertCommentWriteAccess(existing.authorId, user);

    await this.prisma.comment.delete({
      where: { id },
    });

    return { ok: true };
  }

  private assertCommentWriteAccess(authorId: string, user: AuthenticatedUser) {
    if (user.role === 'ADMIN' || user.id === authorId) {
      return;
    }

    throw new ForbiddenException('You are not allowed to modify this comment');
  }
}
