import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { paginateOffset } from 'src/utils/pagination.helper';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma:PrismaService) {}

  async findAll(page?: number, limit?: number) {
    return await paginateOffset({
      page,
      limit,
      getItems: (skip, take) => this.prisma.ticket.findMany({
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          category: true,
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
    getTotal: () => this.prisma.ticket.count(),
    });
  }


  async findAssigned(userId: string, page?: number, limit?: number) {
    return await paginateOffset({
      page,
      limit,
      getItems: (skip, take) => this.prisma.ticket.findMany({
        where: { assigneeId: userId },
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          category: true,
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
    getTotal: () => this.prisma.ticket.count({ where: { assigneeId: userId } }),
    }
  );
  }

  async findRequestedByMe(userId: string, page?: number, limit?: number) {
    return await paginateOffset({
      page,
      limit,
      getItems: (skip, take) =>
        this.prisma.ticket.findMany({
          where: { requesterId: userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            status: true,
            category: true,
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        }),
      getTotal: () => this.prisma.ticket.count({ where: { requesterId: userId } }),
    });
  }

  async create(createTicketDto: CreateTicketDto, requesterId: string) {
    return await this.prisma.ticket.create({
        data: 
        {
          title: createTicketDto.title,
          description: createTicketDto.description,
          priority: createTicketDto.priority,
          categoryId: createTicketDto.categoryId,
          requesterId: requesterId,
          status: 'OPEN',
        },
  })
}

  async assignTicket(ticketId: string, assigneeId: string) {
    return await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId },
    });
  }

  async remove(id: string) {
    return await this.prisma.ticket.delete({
      where: { id },
    });
  }

  getSpecific(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        category: true,
        comments: {
        select: {
          body: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
        },
      },
      },
  });
    }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    actor: { id: string; role: string },
  ) {
    if (actor.role === 'AGENT') {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id },
        select: { assigneeId: true },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      if (ticket.assigneeId !== actor.id) {
        throw new ForbiddenException(
          'Agents can only update tickets assigned to them',
        );
      }
    }

    const data: Prisma.TicketUncheckedUpdateInput = {};

    if (updateTicketDto.title !== undefined) data.title = updateTicketDto.title;
    if (updateTicketDto.description !== undefined) data.description = updateTicketDto.description;
    if (updateTicketDto.status !== undefined) data.status = updateTicketDto.status;
    if (updateTicketDto.priority !== undefined) data.priority = updateTicketDto.priority;
    if (updateTicketDto.assigneeId !== undefined) data.assigneeId = updateTicketDto.assigneeId;
    if (updateTicketDto.categoryId !== undefined) data.categoryId = updateTicketDto.categoryId;

    return await this.prisma.ticket.update({
      where: { id },
      data,
    });
  }
  

}
