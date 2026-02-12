# Ticketing System API (NestJS + TypeScript)

REST API untuk aplikasi ticketing helpdesk, seperti aplikasi Zendesk atau Zohodesk.

## Challenge backend

### a) Minimal 2 operasi CRUD yang saling berkaitan
Implemented:
- `Ticket` CRUD (create/read/update/delete)
- `Category` CRUD
- `Comment` CRUD

Relationships:
- Satu `Category` memiliki hubungan one-to-one `Ticket`.
- Satu `Ticket` memiliki one-to-many `Comment`.

ERD:

```mermaid
erDiagram
  USER ||--o{ TICKET : requests
  USER ||--o{ TICKET : assigned_to
  CATEGORY ||--o{ TICKET : categorizes
  TICKET ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes

  USER {
    string id PK
    string name
    string email
    string role
  }

  CATEGORY {
    string id PK
    string name
  }

  TICKET {
    string id PK
    string title
    string description
    string status
    string priority
    string requesterId FK
    string assigneeId FK
    string categoryId FK
  }

  COMMENT {
    string id PK
    string body
    string ticketId FK
    string authorId FK
  }
```

### b) Menyimpan data menggunakan database SQL
- Database: PostgreSQL
- ORM: Prisma

### c) Authentication API menggunakan JWT token
- Access token dan refresh token disediakan didalam modul `auth` .
- Endpoint yang terlindung menggunakan `JwtAuthGuard`.
- Beberapa endpoint menggunakan role permission `RolesGuard` + `@Roles(...)`.

### d) e2e testing untuk token API
- jalankan `npm test:e2e` atau cek di postman/swagger 

### e) Pattern project yang digunakan
Pattern yang digunakan adalah **Modular Monolith**.

### f) Alasan memilih pattern tersebut
- NestJs mendukung pengmbangan backend menggunakan pola Modular Monolith sebagai default.
- Setiap fitur memiliki controller, service, dan repositorynya masing-masing.
- Lebih mudah dikembangkan untuk tim kedepannya dikarenakan setiap modul dapat dimiliki oleh developer masing-masing.

## Penjelasan Pattern

```mermaid
flowchart TB
    Client[Client App]

    subgraph API[NestJS Modular Monolith]
      direction TB
      Auth[Auth Module]
      Users[Users Module]
      Tickets[Tickets Module]
      Categories[Categories Module]
      Comments[Comments Module]
      Common[Common Guards and Decorators]
      Prisma[Prisma Module]
    end

    DB[(PostgreSQL)]

    Client -->|HTTP + JWT| API
    Auth --> Common
    Users --> Prisma
    Tickets --> Prisma
    Categories --> Prisma
    Comments --> Prisma
    Tickets --> Categories
    Comments --> Tickets
    Prisma -->|SQL| DB
```

### Flow request aplikasi

```mermaid
sequenceDiagram
  participant C as Client
  participant CT as Controller
  participant S as Service
  participant P as PrismaService
  participant DB as PostgreSQL

  C->>CT: HTTP request + Bearer token
  CT->>S: validate DTO + call use-case
  S->>P: query/command
  P->>DB: SQL
  DB-->>P: result
  P-->>S: mapped data
  S-->>CT: response payload
  CT-->>C: JSON response
```

## Module Structure

```text
src/
  auth/
  users/
  tickets/
  categories/
  comments/
  prisma/
  common/
  utils/
```

## API Endpoints (Current)

| Method | Path | Auth | Role |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Public |
| `POST` | `/auth/login` | No | Public |
| `POST` | `/auth/refresh` | Refresh token | Authenticated |
| `POST` | `/auth/logout` | Refresh token | Authenticated |
| `GET` | `/api/v1/users/me` | Access token | Semua user yang authenticated  |
| `POST` | `/api/v1/tickets` | Access token | Semua user yang authenticated |
| `GET` | `/api/v1/tickets/assigned` | Access token | `ADMIN`, `AGENT` |
| `GET` | `/api/v1/tickets/all` | Access token | `ADMIN` |
| `POST` | `/api/v1/tickets/assign` | Access token | `ADMIN` |
| `PATCH` | `/api/v1/tickets/:id` | Access token | `ADMIN`, `AGENT` |
| `GET` | `/api/v1/tickets/:id` | Access token | Semua user yang authenticated |
| `DELETE` | `/api/v1/tickets/:id` | Access token | `ADMIN` |
| `GET` | `/api/v1/categories` | Access token | Semua user yang authenticated |
| `GET` | `/api/v1/categories/:id` | Access token | Semua user yang authenticated |
| `POST` | `/api/v1/categories` | Access token | `ADMIN` |
| `PATCH` | `/api/v1/categories/:id` | Access token | `ADMIN` |
| `DELETE` | `/api/v1/categories/:id` | Access token | `ADMIN` |
| `GET` | `/api/v1/comments` | Access token | Semua user yang authenticated |
| `GET` | `/api/v1/comments/:id` | Access token | Semua user yang authenticated |
| `POST` | `/api/v1/comments` | Access token | Semua user yang authenticated |
| `PATCH` | `/api/v1/comments/:id` | Access token | Owner comment atau `ADMIN` |
| `DELETE` | `/api/v1/comments/:id` | Access token | Owner comment atau `ADMIN` |

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ticketing"
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
PORT=3000
```

### 3) Run migrations

```bash
npx prisma migrate dev
```

### 4) Optional seed

```bash
npm run db:seed
```

### 5) Run app

```bash
npm run start:dev
```

## Testing

```bash
# e2e tests
npm run test:e2e
```

### E2E Prerequisites

1. Create test env file:

```bash
cp .env.test.example .env.test
```

2. Point `DATABASE_URL` in `.env.test` to a dedicated test database.

3. Seed test database so role accounts are available:

```bash
npm run db:seed
```

## Postman & Swagger

- Postman Collection:
  `https://www.postman.com/apa-yaa-5616/workspace/dot-internship/collection/37302209-dda77739-b422-4275-a25f-daa49f4e613b?action=share&creator=37302209&active-environment=37302209-c75c4c5d-a437-44c9-9578-fed3eff166e3`
- Swagger Docs:
  `http://localhost:3000/docs`
## Loom Video:
`https://www.loom.com/share/1d7e4a8b70ad410698356b119f8141f3`
