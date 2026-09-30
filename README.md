# call_human()

The AI that makes you do it yourself. An AI tutor that plans a coding problem into steps and calls *you* to write each one. It never outputs code.

See `PLAN.md` for the full build plan.

## Dev

```bash
pnpm install
pnpm dev
```

## Env

| Var | Used by |
|---|---|
| `STRIPE_PAYMENT_LINK` | `/buy` redirects here (read per request). Unset shows "checkout opens soon". |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients and `proxy.ts` (proxy is a no-op when unset) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase clients, browser-safe |
| `SUPABASE_SECRET_KEY` | `lib/supabase/admin.ts`, server only, bypasses RLS |
| `IP_HASH_SALT` | salts IP hashes for the free-tier limit |

Schema lives in `supabase/migrations/`. Copy `.env.example` to `.env.local` for local dev.
