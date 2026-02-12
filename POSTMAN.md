# Postman Credentials dan Cara Pakai

Dokumen ini diasumsikan untuk environment Postman yang sudah kamu buat.

## Kredensial yang Tersedia (Seeder)

Jika data dibuat dari `npm run db:seed` (mode default), gunakan akun berikut:

- `admin@seed.local` / `SeedPass123!` (role `ADMIN`)
- `agent1@seed.local` / `SeedPass123!` (role `AGENT`)
- `requester1@seed.local` / `SeedPass123!` (role `REQUESTER`)

Catatan:

- Seeder membuat lebih banyak user dengan pola email `agentN@seed.local` dan `requesterN@seed.local`.
- Semua user seed memakai password yang sama: `SeedPass123!`.

## Cara Pakai Environment yang Sudah Ada

Pastikan environment kamu punya variabel:

- `baseUrl`
- `accessToken`
- `refreshToken`

## Alur Pemakaian

1. Login ke `POST {{baseUrl}}/auth/login` dengan salah satu kredensial di atas.
2. Ambil `access_token` dan `refresh_token` dari response login.
3. Simpan ke environment:
   - `accessToken` = `access_token`
   - `refreshToken` = `refresh_token`
4. Untuk endpoint protected biasa (`/api/v1/users/me`, `/api/v1/tickets`, dll), pakai Bearer token `{{accessToken}}`.
5. Untuk endpoint `POST /auth/refresh` dan `POST /auth/logout`, pakai Bearer token `{{refreshToken}}`.

## Permission (RBAC Matrix)

Legenda:

- `Y`: diizinkan
- `N`: tidak diizinkan
- `OWNER`: hanya pemilik resource (author comment)

| Endpoint | ADMIN | AGENT | REQUESTER | Catatan |
| --- | --- | --- | --- | --- |
| `POST /auth/register` | Y | Y | Y | Public (tanpa token) |
| `POST /auth/login` | Y | Y | Y | Public (tanpa token) |
| `POST /auth/refresh` | Y | Y | Y | Perlu `refreshToken` |
| `POST /auth/logout` | Y | Y | Y | Perlu `refreshToken` |
| `GET /api/v1/users/me` | Y | Y | Y | Perlu `accessToken` |
| `POST /api/v1/tickets` | Y | Y | Y | Perlu `accessToken` |
| `GET /api/v1/tickets/assigned` | Y | Y | N | Perlu `accessToken` |
| `GET /api/v1/tickets/all` | Y | N | N | Perlu `accessToken` |
| `POST /api/v1/tickets/assign` | Y | N | N | Perlu `accessToken` |
| `GET /api/v1/tickets/:id` | Y | Y | Y | Perlu `accessToken` |
| `PATCH /api/v1/tickets/:id` | Y | Y | N | Perlu `accessToken` |
| `DELETE /api/v1/tickets/:id` | Y | N | N | Perlu `accessToken` |
| `GET /api/v1/categories` | Y | Y | Y | Perlu `accessToken` |
| `GET /api/v1/categories/:id` | Y | Y | Y | Perlu `accessToken` |
| `POST /api/v1/categories` | Y | N | N | Perlu `accessToken` |
| `PATCH /api/v1/categories/:id` | Y | N | N | Perlu `accessToken` |
| `DELETE /api/v1/categories/:id` | Y | N | N | Perlu `accessToken` |
| `GET /api/v1/comments` | Y | Y | Y | Perlu `accessToken` |
| `GET /api/v1/comments/:id` | Y | Y | Y | Perlu `accessToken` |
| `POST /api/v1/comments` | Y | Y | Y | Perlu `accessToken` |
| `PATCH /api/v1/comments/:id` | Y | OWNER | OWNER | `ADMIN` bisa semua comment |
| `DELETE /api/v1/comments/:id` | Y | OWNER | OWNER | `ADMIN` bisa semua comment |

## Body Login Contoh

```json
{
  "email": "admin@seed.local",
  "password": "SeedPass123!"
}
```

## Contoh Header Authorization

`Authorization: Bearer <token>`
