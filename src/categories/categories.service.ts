import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly categorySelect = {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        tickets: true,
      },
    },
  };

  private mapCategory(category: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { tickets: number };
  }) {
    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      ticketCount: category._count.tickets,
    };
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.prisma.category.create({
      data: { name: createCategoryDto.name },
      select: this.categorySelect,
    });

    return this.mapCategory(category);
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: this.categorySelect,
    });

    return categories.map((category) => this.mapCategory(category));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: this.categorySelect,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapCategory(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    if (updateCategoryDto.name === undefined) {
      throw new BadRequestException('No fields provided for update');
    }

    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const duplicate = await this.prisma.category.findUnique({
      where: { name: updateCategoryDto.name },
      select: { id: true },
    });

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Category with this name already exists');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { name: updateCategoryDto.name },
      select: this.categorySelect,
    });

    return this.mapCategory(updated);
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.tickets > 0) {
      throw new ConflictException('Cannot delete category that is used by tickets');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { ok: true };
  }
}
