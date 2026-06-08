import { execFileSync } from "node:child_process";

execFileSync("npx", ["drizzle-kit", "push"], { stdio: "inherit" });
