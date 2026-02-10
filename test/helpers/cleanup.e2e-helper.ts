import { PrismaService } from '../../src/prisma/prisma.service';

export function createRunPrefix() {
  return `[E2E:${Date.now()}]`;
}

export async function cleanupE2EArtifacts(prisma: PrismaService, prefix: string) {
  await prisma.comment.deleteMany({
    where: {
      OR: [
        { body: { startsWith: prefix } },
        { ticket: { title: { startsWith: prefix } } },
      ],
    },
  });

  await prisma.ticket.deleteMany({
    where: {
      title: { startsWith: prefix },
    },
  });

  await prisma.category.deleteMany({
    where: {
      name: { startsWith: prefix },
    },
  });
}

export async function cleanupSessionsForUsers(prisma: PrismaService, userIds: string[]) {
  if (userIds.length === 0) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });
}
