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
