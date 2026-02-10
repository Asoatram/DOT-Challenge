import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, TicketPriority, TicketStatus } from '../generated/prisma/client';
import { hash } from 'bcrypt';

type SeedMode = 'reset' | 'append';
type SeedSize = 'small' | 'medium' | 'large';

interface SeedOptions {
  mode: SeedMode;
  size: SeedSize;
  deterministic: boolean;
}

interface SeedProfile {
  users: {
    admin: number;
    agent: number;
    requester: number;
  };
  categories: number;
  tickets: number;
  maxCommentsPerTicket: number;
}

interface SeedUser {
  email: string;
  name: string;
  role: Role;
}

interface CreatedTicket {
  id: string;
  requesterId: string;
  assigneeId: string | null;
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  const parsedUrl = new URL(databaseUrl);
  const adapter = new PrismaPg({
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : 5432,
    database: parsedUrl.pathname.replace(/^\//, ''),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password ?? ''),
  });

  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

const SEED_TICKET_PREFIX = '[SEED]';
const SEED_COMMENT_PREFIX = '[SEED]';
const SEED_CATEGORY_PREFIX = 'Seed:';
const SEED_EMAIL_DOMAIN = '@seed.local';
const DEFAULT_PASSWORD = 'SeedPass123!';

const FIRST_NAMES = [
  'Ari',
  'Nadia',
  'Rafi',
  'Lina',
  'Dimas',
  'Hana',
  'Faris',
  'Tari',
  'Rani',
  'Iqbal',
  'Salsa',
  'Dio',
  'Mila',
  'Bagas',
  'Citra',
  'Vina',
  'Adit',
  'Raka',
  'Nisa',
  'Reno',
];

const LAST_NAMES = [
  'Saputra',
  'Pratama',
  'Wijaya',
  'Putri',
  'Rahma',
  'Setiawan',
  'Nugroho',
  'Kusuma',
  'Permata',
  'Maulana',
  'Handayani',
];

const CATEGORY_BASE = [
  'Access Management',
  'Network',
  'Hardware',
  'Software',
  'Email',
  'Security',
  'HR System',
  'Finance App',
  'Deployment',
  'Monitoring',
];

const TICKET_SUBJECTS = [
  'VPN not connecting',
  'Cannot reset password',
  'Email not syncing',
  'Laptop running very slow',
  'Application crash on startup',
  'Missing access to dashboard',
  'Deployment failed in CI',
  'Printer unavailable',
  'Database query timing out',
  'Two-factor authentication issue',
];

const COMMENT_SNIPPETS = [
  'Investigating this now.',
  'Need additional logs from your side.',
  'Applied initial workaround, monitoring impact.',
  'Issue reproduced in staging environment.',
  'Escalating to infrastructure team.',
  'Confirmed resolution with requester.',
  'Pending validation after deployment window.',
  'Added notes to runbook for prevention.',
];

function parseArgs(argv: string[]): SeedOptions {
  const getArg = (name: string): string | undefined =>
    argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];

  const modeArg = (getArg('mode') ?? process.env.SEED_MODE ?? 'reset').toLowerCase();
  const sizeArg = (getArg('size') ?? process.env.SEED_SIZE ?? 'medium').toLowerCase();
  const deterministicArg = (getArg('deterministic') ?? process.env.SEED_DETERMINISTIC ?? 'true').toLowerCase();

  const mode: SeedMode = modeArg === 'append' ? 'append' : 'reset';
  const size: SeedSize = sizeArg === 'small' || sizeArg === 'large' ? sizeArg : 'medium';
  const deterministic = deterministicArg !== 'false';

  return { mode, size, deterministic };
}

function getProfile(size: SeedSize): SeedProfile {
  if (size === 'small') {
    return {
      users: { admin: 1, agent: 2, requester: 6 },
      categories: 4,
      tickets: 30,
      maxCommentsPerTicket: 3,
    };
  }

  if (size === 'large') {
    return {
      users: { admin: 1, agent: 12, requester: 40 },
      categories: 10,
      tickets: 300,
      maxCommentsPerTicket: 8,
    };
  }

  return {
    users: { admin: 1, agent: 6, requester: 18 },
    categories: 8,
    tickets: 120,
    maxCommentsPerTicket: 6,
  };
}

function makeRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(items: T[], random: () => number): T {
  const index = Math.floor(random() * items.length);
  return items[index];
}

function weightedPick<T>(items: Array<{ value: T; weight: number }>, random: () => number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = random() * total;
  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function buildBatchTag(deterministic: boolean): string {
  if (deterministic) return 'base';
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

function buildUsers(profile: SeedProfile, mode: SeedMode, batchTag: string, random: () => number): SeedUser[] {
  const users: SeedUser[] = [];

  const makeName = () => `${pick(FIRST_NAMES, random)} ${pick(LAST_NAMES, random)}`;

  const appendSuffix = mode === 'append' ? `+${batchTag}` : '';

  users.push({
    email: `admin${appendSuffix}${SEED_EMAIL_DOMAIN}`,
    name: mode === 'append' ? `Seed Admin ${batchTag}` : 'Seed Admin',
    role: Role.ADMIN,
  });

  for (let i = 0; i < profile.users.agent; i++) {
    const idx = i + 1;
    users.push({
      email: `agent${idx}${appendSuffix}${SEED_EMAIL_DOMAIN}`,
      name: `Agent ${makeName()}`,
      role: Role.AGENT,
    });
  }

  for (let i = 0; i < profile.users.requester; i++) {
    const idx = i + 1;
    users.push({
      email: `requester${idx}${appendSuffix}${SEED_EMAIL_DOMAIN}`,
      name: `Requester ${makeName()}`,
      role: Role.REQUESTER,
    });
  }

  return users;
}

function buildCategoryNames(profile: SeedProfile, mode: SeedMode, batchTag: string): string[] {
  const selected = CATEGORY_BASE.slice(0, profile.categories);
  if (mode === 'append') {
    return selected.map((name) => `${SEED_CATEGORY_PREFIX} ${name} (${batchTag})`);
  }
  return selected.map((name) => `${SEED_CATEGORY_PREFIX} ${name}`);
}

async function resetSeedData(): Promise<number> {
  const commentResult = await prisma.comment.deleteMany({
    where: {
      OR: [
        { body: { startsWith: SEED_COMMENT_PREFIX } },
        { ticket: { title: { startsWith: SEED_TICKET_PREFIX } } },
      ],
    },
  });

  await prisma.ticket.deleteMany({
    where: { title: { startsWith: SEED_TICKET_PREFIX } },
  });

  await prisma.category.deleteMany({
    where: { name: { startsWith: SEED_CATEGORY_PREFIX } },
  });

  await prisma.session.deleteMany({
    where: {
      user: {
        email: { endsWith: SEED_EMAIL_DOMAIN },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: { endsWith: SEED_EMAIL_DOMAIN },
    },
  });

  return commentResult.count;
}

async function seedUsers(users: SeedUser[], passwordHash: string): Promise<Array<{ id: string; role: Role; email: string }>> {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password: passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        password: passwordHash,
      },
    });
  }

  return prisma.user.findMany({
    where: { email: { in: users.map((u) => u.email) } },
    select: { id: true, role: true, email: true },
  });
}

async function seedCategories(names: string[]): Promise<Array<{ id: string; name: string }>> {
  for (const name of names) {
    await prisma.category.upsert({
      where: { name },
      update: { name },
      create: { name },
    });
  }

  return prisma.category.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });
}

async function seedTickets(
  count: number,
  users: Array<{ id: string; role: Role }>,
  categories: Array<{ id: string }>,
  mode: SeedMode,
  batchTag: string,
  random: () => number,
): Promise<CreatedTicket[]> {
  const requesters = users.filter((u) => u.role === Role.REQUESTER);
  const assignees = users.filter((u) => u.role === Role.AGENT || u.role === Role.ADMIN);

  const created: CreatedTicket[] = [];

  for (let i = 0; i < count; i++) {
    const requester = pick(requesters, random);
    const withAssignee = random() < 0.8;
    const assignee = withAssignee ? pick(assignees, random) : null;
    const withCategory = random() < 0.9;
    const category = withCategory ? pick(categories, random) : null;

    const status = weightedPick<TicketStatus>(
      [
        { value: TicketStatus.OPEN, weight: 35 },
        { value: TicketStatus.IN_PROGRESS, weight: 30 },
        { value: TicketStatus.RESOLVED, weight: 25 },
        { value: TicketStatus.CLOSED, weight: 10 },
      ],
      random,
    );

    const priority = weightedPick<TicketPriority>(
      [
        { value: TicketPriority.LOW, weight: 20 },
        { value: TicketPriority.MEDIUM, weight: 50 },
        { value: TicketPriority.HIGH, weight: 30 },
      ],
      random,
    );

    const subject = pick(TICKET_SUBJECTS, random);
    const sequence = i + 1;
    const batchSuffix = mode === 'append' ? ` (${batchTag})` : '';

    const ticket = await prisma.ticket.create({
      data: {
        title: `${SEED_TICKET_PREFIX} ${subject} #${sequence}${batchSuffix}`,
        description: `Mock ticket generated by seeder for development and testing. Case ${sequence} about "${subject.toLowerCase()}".`,
        status,
        priority,
        requesterId: requester.id,
        assigneeId: assignee?.id ?? null,
        categoryId: category?.id ?? null,
      },
      select: {
        id: true,
        requesterId: true,
        assigneeId: true,
      },
    });

    created.push(ticket);
  }

  return created;
}

async function seedComments(
  tickets: CreatedTicket[],
  users: Array<{ id: string; role: Role }>,
  maxCommentsPerTicket: number,
  random: () => number,
): Promise<number> {
  const agentPool = users.filter((u) => u.role === Role.AGENT || u.role === Role.ADMIN);
  const commentRows: Array<{ body: string; ticketId: string; authorId: string }> = [];

  for (const ticket of tickets) {
    const count = Math.floor(random() * (maxCommentsPerTicket + 1));
    for (let i = 0; i < count; i++) {
      const candidateAuthors = [ticket.requesterId, ...agentPool.map((u) => u.id)];
      if (ticket.assigneeId) candidateAuthors.push(ticket.assigneeId);

      const authorId = pick(candidateAuthors, random);
      const snippet = pick(COMMENT_SNIPPETS, random);
      commentRows.push({
        ticketId: ticket.id,
        authorId,
        body: `${SEED_COMMENT_PREFIX} ${snippet}`,
      });
    }
  }

  if (commentRows.length === 0) return 0;

  const result = await prisma.comment.createMany({ data: commentRows });
  return result.count;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const profile = getProfile(options.size);
  const seedNum = options.deterministic ? 1337 : Date.now();
  const random = makeRandom(seedNum);
  const batchTag = buildBatchTag(options.deterministic);
  const passwordHash = await hash(DEFAULT_PASSWORD, 10);

  if (options.mode === 'reset') {
    await resetSeedData();
  }

  const userSeeds = buildUsers(profile, options.mode, batchTag, random);
  const users = await seedUsers(userSeeds, passwordHash);
  const categories = await seedCategories(buildCategoryNames(profile, options.mode, batchTag));
  const tickets = await seedTickets(profile.tickets, users, categories, options.mode, batchTag, random);
  const commentsCount = await seedComments(tickets, users, profile.maxCommentsPerTicket, random);

  console.log('Seed completed');
  console.log(`mode=${options.mode} size=${options.size} deterministic=${String(options.deterministic)}`);
  console.log(`users=${users.length} categories=${categories.length} tickets=${tickets.length} comments=${commentsCount}`);
  console.log('Session seeding skipped by design.');
  console.log(`Default password for seeded users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
