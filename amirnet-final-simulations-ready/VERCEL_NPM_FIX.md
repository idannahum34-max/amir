# Vercel npm install fix

This build is configured to use npm on Vercel instead of pnpm.

Why:
- Vercel was detecting `pnpm-lock.yaml` and running `pnpm install --frozen-lockfile`.
- pnpm 10 ignored native/optional build scripts in the Vercel environment.
- Rollup then failed with `Cannot find module @rollup/rollup-linux-x64-gnu`.

What changed:
- Removed `pnpm-lock.yaml`.
- Added `package-lock.json`.
- Removed `packageManager: pnpm...` from `package.json`.
- Changed build scripts to use npm-compatible commands.
- Updated `vercel.json` to use:
  - `npm ci --include=optional`
  - `npm run build:vercel`
- Added explicit Linux optional native dependencies for Vercel.
- Added `.npmrc` pointing to the public npm registry.

After uploading this version to GitHub, redeploy on Vercel with build cache disabled.
