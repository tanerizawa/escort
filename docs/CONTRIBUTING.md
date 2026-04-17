# Contributing

## 1. Branch naming

- Features: `feat/<scope>-<short-kebab>`
- Fixes: `fix/<scope>-<short-kebab>`
- Chores: `chore/<scope>-<short-kebab>`
- Cursor cloud agents: `cursor/<short-kebab>-<hash>`

## 2. Commit style

Conventional Commits:

```
feat(auth): add 2FA TOTP reset flow
fix(booking): prevent double-confirm race
chore(docs): refresh MVP map
```

## 3. Pre-commit hooks

`husky` + `lint-staged` run Prettier and ESLint on staged files. If
the hook didn't install after a fresh clone:

```bash
npm run prepare
```

## 4. Code style

- TypeScript strict mode everywhere.
- Prefer named exports.
- Don't mutate DTOs — decorate with `class-validator` and rely on
  `ValidationPipe`.
- Logging must go through Nest's `Logger` (never bare `console.log`).

## 5. Adding a new feature module (API)

1. Create `apps/api/src/modules/<name>/`.
2. Add `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`.
3. Register DTOs in a dedicated folder if they're shared.
4. Wire the module into `AppModule`.
5. Add feature-flag gating if the module is Phase 2+ (see
   [`MVP_MAP.md`](./MVP_MAP.md)).
6. Add unit + e2e tests, then refresh this doc + `MODULES.md`.

## 6. PR checklist

- [ ] Commits follow conventional style.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] New/changed behaviour has tests.
- [ ] Docs updated (`docs/*.md` or inline JSDoc).
- [ ] `.env.example` updated if you touched env variables.
- [ ] No secrets / PII / personal data committed.

## 7. Reviewing

- Pull the branch locally, run the affected app.
- Check migrations don't break the seed (`npm run db:migrate && npm run db:seed`).
- Verify Swagger updates if you touched DTOs.
