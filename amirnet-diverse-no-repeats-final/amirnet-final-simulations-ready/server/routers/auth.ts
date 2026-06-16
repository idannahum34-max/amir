import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { createHash, pbkdf2, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z } from "zod";
import * as db from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const pbkdf2Async = promisify(pbkdf2);
const HASH_ITERATIONS = 210_000;
const HASH_KEYLEN = 32;
const HASH_DIGEST = "sha256";

const credentialsSchema = z.object({
  email: z.string().email().max(320).transform(value => value.trim().toLowerCase()),
  password: z.string().min(8).max(200),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(100),
});

function publicUser(user: NonNullable<Awaited<ReturnType<typeof db.getUserByOpenId>>>) {
  const { passwordHash: _passwordHash, ...safeUser } = user as typeof user & { passwordHash?: string | null };
  return safeUser;
}

function localOpenId(email: string) {
  return `local_${createHash("sha256").update(email).digest("hex").slice(0, 48)}`;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await pbkdf2Async(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST);
  return `pbkdf2$${HASH_ITERATIONS}$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [algorithm, iterationsRaw, salt, hashHex] = storedHash.split("$");
  if (algorithm !== "pbkdf2" || !iterationsRaw || !salt || !hashHex) return false;
  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 100_000) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await pbkdf2Async(password, salt, iterations, expected.length, HASH_DIGEST);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function setSessionCookie(ctx: any, user: NonNullable<Awaited<ReturnType<typeof db.getUserByOpenId>>>) {
  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name ?? user.email ?? "",
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export const authRouter = router({
  me: publicProcedure.query(opts => (opts.ctx.user ? publicUser(opts.ctx.user) : null)),

  register: publicProcedure.input(registerSchema).mutation(async ({ input, ctx }) => {
    const existing = await db.getUserByEmail(input.email);
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "כבר קיים משתמש עם כתובת האימייל הזו" });
    }

    const openId = localOpenId(input.email);
    await db.upsertUser({
      openId,
      name: input.name,
      email: input.email,
      loginMethod: "email",
      passwordHash: await hashPassword(input.password),
      lastSignedIn: new Date(),
    } as any);

    const user = await db.getUserByOpenId(openId);
    if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "יצירת המשתמש נכשלה" });
    await setSessionCookie(ctx, user);
    return publicUser(user);
  }),

  login: publicProcedure.input(credentialsSchema).mutation(async ({ input, ctx }) => {
    const user = await db.getUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, (user as any).passwordHash))) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "אימייל או סיסמה שגויים" });
    }

    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    await setSessionCookie(ctx, user);
    return publicUser(user);
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
