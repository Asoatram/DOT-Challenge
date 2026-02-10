import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('CategoriesService', () => {
  let service: CategoriesService;
  const prismaMock = {
    category: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a category', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(null);
    prismaMock.category.create.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'Hardware',
      createdAt: new Date('2026-02-10T00:00:00.000Z'),
      updatedAt: new Date('2026-02-10T00:00:00.000Z'),
      _count: { tickets: 0 },
    });

    const result = await service.create({ name: 'Hardware' });

    expect(prismaMock.category.create).toHaveBeenCalledWith({
      data: { name: 'Hardware' },
      select: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'cat-1',
        name: 'Hardware',
        ticketCount: 0,
      }),
    );
  });

  it('throws conflict when creating duplicate category', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: 'cat-dup' });

    await expect(service.create({ name: 'Hardware' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns mapped categories list', async () => {
    prismaMock.category.findMany.mockResolvedValueOnce([
      {
        id: 'cat-1',
        name: 'Email',
        createdAt: new Date('2026-02-10T00:00:00.000Z'),
        updatedAt: new Date('2026-02-10T00:00:00.000Z'),
        _count: { tickets: 3 },
      },
    ]);

    const result = await service.findAll();

    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: expect.any(Object),
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'cat-1',
        name: 'Email',
        ticketCount: 3,
      }),
    ]);
  });

  it('throws not found when category does not exist', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws bad request when update payload is empty', async () => {
    await expect(service.update('cat-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws not found when updating non-existent category', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce(null);

    await expect(service.update('cat-1', { name: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws conflict when updating to duplicate name', async () => {
    prismaMock.category.findUnique
      .mockResolvedValueOnce({ id: 'cat-1' })
      .mockResolvedValueOnce({ id: 'cat-2' });

    await expect(service.update('cat-1', { name: 'Duplicate' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('updates category successfully', async () => {
    prismaMock.category.findUnique
      .mockResolvedValueOnce({ id: 'cat-1' })
      .mockResolvedValueOnce(null);
    prismaMock.category.update.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'Updated',
      createdAt: new Date('2026-02-10T00:00:00.000Z'),
      updatedAt: new Date('2026-02-11T00:00:00.000Z'),
      _count: { tickets: 2 },
    });

    const result = await service.update('cat-1', { name: 'Updated' });

    expect(prismaMock.category.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { name: 'Updated' },
      select: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'cat-1',
        name: 'Updated',
        ticketCount: 2,
      }),
    );
  });

  it('throws conflict when deleting category used by tickets', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({
      id: 'cat-1',
      _count: { tickets: 1 },
    });

    await expect(service.remove('cat-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes category when unused', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({
      id: 'cat-1',
      _count: { tickets: 0 },
    });
    prismaMock.category.delete.mockResolvedValueOnce({ id: 'cat-1' });

    const result = await service.remove('cat-1');

    expect(prismaMock.category.delete).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
    });
    expect(result).toEqual({ ok: true });
  });
});
