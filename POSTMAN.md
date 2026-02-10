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

## Body Login Contoh

```json
{
  "email": "admin@seed.local",
  "password": "SeedPass123!"
}
```

## Contoh Header Authorization

`Authorization: Bearer <token>`
