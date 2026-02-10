type PageMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export async function paginateOffset<T>(args: {
    page?: number;
    limit?: number;
    maxLimit?: number;
    getItems: (skip: number, take: number) => Promise<T[]>;
    getTotal: () => Promise<number>;
}) {
    const page = Math.max(1, args.page ?? 1)
    const maxLimit = args.maxLimit ?? 100;
    const limit = Math.min(args.limit ?? 10, maxLimit);

    const skip = (page - 1) * limit;
    const take = limit;

    const[items, total] = await Promise.all([args.getItems(skip, take), args.getTotal()]);

    const meta: PageMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
    };

    return { items, meta };
}

