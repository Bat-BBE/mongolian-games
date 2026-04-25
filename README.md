# Mongolian Games

Next.js 16 (фронт) + Express/PostgreSQL/WebSocket (API). Газрын 3D, тоглоом, нэвтэрлт, админ.

## Суулгах

```bash
npm install
cd server && npm install && cd ..
```

## Хөгжүүлэлт

- Фронт: `npm run dev` → [http://localhost:3000](http://localhost:3000)
- API: `npm run dev:server` (порт 4000) — эсвэл `npm run dev:all` (concurrently)

Root дээр `.env.local` үүсгэж [`.env.example`](./.env.example)-ийг дуурайн бөглөнө.  
`server/.env` үүсгэж [`server/.env.example`](./server/.env.example) ашиглана (`DATABASE_URL` зайлшгүй).

## Production checklist

| Зүйл | Тайлбар |
|------|--------|
| `NEXT_PUBLIC_API_URL` | Фронт bundle-д орох: **https**-тай API суурь (сүүлд `/` үгүй). |
| `CORS_ORIGIN` (server) | API дээр фронтын домэйн(үүд) — `https://таны-апп.домэйн` бодитоор. |
| TLS | Хуудас `https` бол API ч `https` + `wss` (mixed content-аас `lib/api.ts` анхааруулга). |
| `DATABASE_URL` | PostgreSQL, SSL (жишээ Neon: `?sslmode=require`). |
| WebSocket | Хост (Railway/Fly/Render) WebSocket-ийг идэвхжүүлсэн, proxy `Upgrade` дамжуулсан. |
| Firebase | `NEXT_PUBLIC_*` + server дээр Admin JSON / `FIREBASE_DATABASE_URL` (хэрэгтэй бол). |
| `JWT_SECRET` / `ADMIN_*` | Админ/хамгаалсан endpoint ашиглавал урт, санамсаргүй нууц. |
| Сурвалж | `npm run build` (фронт), `cd server && npm run build` (API). |
| `npm run lint` | Код стандарт (төслийн ESLint). |

`npm run build` (root) нь Vercel/сүүлчийн static export биш, Node сервертэй `next start` эсвэл Vercel-д тохирно.

## Deploy (екөн)

- **Vercel** (зөвхөн Next) — `NEXT_PUBLIC_*` environment variables. API тусдаа (Fly/Railway) + `NEXT_PUBLIC_API_URL` заана.
- **Monolith** — Docker эсвэл PaaS: Next + `server` хоёуланг нэг домэйн доор reverse proxy (`/api` → Express, WebSocket path-уудыг дамжуулна).

## License

Private project (диплом / дотоод).
