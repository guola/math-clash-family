import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { leaderboard } from "@/db/schema";

function cleanName(value: unknown) {
  return String(value ?? "PLAYER").trim().replace(/[<>]/g, "").slice(0, 14) || "PLAYER";
}

export async function GET() {
  try {
    const rows = await getDb().select().from(leaderboard).orderBy(desc(leaderboard.score), desc(leaderboard.createdAt)).limit(10);
    return Response.json({ leaderboard: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("leaderboard:get", error);
    return Response.json({ error: "Leaderboard is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const score = Math.max(0, Math.min(999999, Number(payload.score) || 0));
    const bestCombo = Math.max(0, Math.min(9999, Number(payload.bestCombo) || 0));
    const mode = payload.mode === "duo" ? "duo" : "solo";
    const lang = payload.lang === "en" || payload.lang === "ja" ? payload.lang : "zh";
    const [row] = await getDb().insert(leaderboard).values({ nickname: cleanName(payload.nickname), score, bestCombo, mode, lang, createdAt: Date.now() }).returning();
    return Response.json({ score: row }, { status: 201 });
  } catch (error) {
    console.error("leaderboard:post", error);
    return Response.json({ error: "Score could not be saved." }, { status: 503 });
  }
}
