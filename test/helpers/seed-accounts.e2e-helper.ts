import { PrismaService } from '../../src/prisma/prisma.service';

export const SEED_PASSWORD = 'SeedPass123!';

export const SEED_USER_EMAILS = {
  admin: 'admin@seed.local',
  agent: 'agent1@seed.local',
  requester: 'requester1@seed.local',
} as const;

type SeedRole = 'ADMIN' | 'AGENT' | 'REQUESTER';

type SeedUser = {
  id: string;
  email: string;
  role: SeedRole;
};

export type SeedAccounts = {
  admin: SeedUser;
  agent: SeedUser;
  requester: SeedUser;
};

export async function ensureSeedAccounts(prisma: PrismaService): Promise<SeedAccounts> {
  const emails = Object.values(SEED_USER_EMAILS);
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: emails,
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  const byEmail = new Map(users.map((user) => [user.email, user]));
  const missing = emails.filter((email) => !byEmail.has(email));
  if (missing.length > 0) {
    throw new Error(
      `Missing seeded accounts: ${missing.join(', ')}. Run the seed command against your test database.`,
    );
  }

  const admin = byEmail.get(SEED_USER_EMAILS.admin)!;
  const agent = byEmail.get(SEED_USER_EMAILS.agent)!;
  const requester = byEmail.get(SEED_USER_EMAILS.requester)!;

  if (admin.role !== 'ADMIN' || agent.role !== 'AGENT' || requester.role !== 'REQUESTER') {
    throw new Error('Seed account roles do not match expected ADMIN/AGENT/REQUESTER mapping.');
  }

  return { admin, agent, requester };
}
