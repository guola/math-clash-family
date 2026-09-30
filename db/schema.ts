import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const leaderboard = sqliteTable("leaderboard", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nickname: text("nickname").notNull(),
  score: integer("score").notNull(),
  bestCombo: integer("best_combo").notNull().default(0),
  mode: text("mode", { enum: ["solo", "duo"] }).notNull(),
  lang: text("lang", { enum: ["zh", "en", "ja"] }).notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_leaderboard_score_created").on(table.score, table.createdAt)]);

export const rooms = sqliteTable("rooms", {
  code: text("code").primaryKey(),
  seed: integer("seed").notNull(),
  status: text("status", { enum: ["lobby", "active", "complete"] }).notNull().default("lobby"),
  startAt: integer("start_at"),
  createdAt: integer("created_at").notNull(),
});

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  nickname: text("nickname").notNull(),
  slot: integer("slot").notNull(),
  score: integer("score").notNull().default(0),
  combo: integer("combo").notNull().default(0),
  finished: integer("finished", { mode: "boolean" }).notNull().default(false),
  submitted: integer("submitted", { mode: "boolean" }).notNull().default(false),
  lang: text("lang", { enum: ["zh", "en", "ja"] }).notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  uniqueIndex("idx_players_room_slot").on(table.roomCode, table.slot),
  index("idx_players_room").on(table.roomCode),
]);
