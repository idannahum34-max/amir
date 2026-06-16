# Vercel install fix

This build uses Yarn Classic on Vercel to bypass the npm 10 "Exit handler never called" install bug.

Important Vercel settings:
- Root Directory: the folder containing package.json
- Install Command can be left to vercel.json
- Build Command can be left to vercel.json
- Output Directory can be left to vercel.json
