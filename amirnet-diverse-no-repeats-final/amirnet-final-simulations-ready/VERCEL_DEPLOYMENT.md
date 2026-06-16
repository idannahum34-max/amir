# Vercel Deployment

1. Push the project to GitHub.
2. Create a Vercel project from the GitHub repository.
3. Set the framework preset to Vite if Vercel does not detect it automatically.
4. Confirm these settings:
   - Install command: `pnpm install --frozen-lockfile`
   - Build command: `pnpm build:vercel`
   - Output directory: `dist/public`
5. Add environment variables:
   - `DATABASE_URL`
   - `COOKIE_SECRET`
   - `OWNER_EMAIL`
   - `OPENAI_API_KEY`
6. Before the first public launch, run migrations and seed against the production database:

```bash
DATABASE_URL="..." pnpm db:push
DATABASE_URL="..." pnpm db:seed
```

7. Deploy.
8. Test signup, login, logout, `/demo`, `/practice`, `/exam`, `/vocabulary`, `/pricing`, and `/admin` using the `OWNER_EMAIL` account.
