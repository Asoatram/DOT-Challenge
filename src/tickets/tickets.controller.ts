import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { assignTicketDto } from './dto/assign-ticket.dto';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';
import { ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';

@Controller('api/v1/tickets')
@ApiTags('Tickets')
@ApiSecurity('Bearer')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateTicketDto })
  create(@Req() request, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto, request.user.id);
  }

  @Get('/assigned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'AGENT')
  findAssigned(@Req() request, @Query() query: PaginationDto) {
    return this.ticketsService.findAssigned(request.user.id, query.page, query.limit);
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  findRequestedByMe(@Req() request, @Query() query: PaginationDto) {
    return this.ticketsService.findRequestedByMe(
      request.user.id,
      query.page,
      query.limit,
    );
  }

  @Post('/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBody({ type: assignTicketDto })
  assignTicket(@Body() body: assignTicketDto) {
    return this.ticketsService.assignTicket(body.ticketId, body.assigneeId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getSpecific(@Param('id') id: string) {
    return this.ticketsService.getSpecific(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('ADMIN', 'AGENT')
  @ApiBody({ type: UpdateTicketDto })
  update(@Param('id') id: string, @Req() request, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto, request.user);
  }

  

}
