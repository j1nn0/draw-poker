import assert from "node:assert/strict";
import test, { beforeEach, afterEach } from "node:test";
import {
  initAchievements,
  getAchievementProgress,
  getCategoryProgress,
  getTotalUnlocked,
  getAchievementState,
} from "../src/achievements.js";
import { emit, on, off } from "../src/eventBus.js";

// Collect achievement:unlocked events during a test
let unlockedEvents = [];

beforeEach(() => {
  unlockedEvents = [];
  on("achievement:unlocked", (data) => {
    unlockedEvents.push(data.id);
  });
});

afterEach(() => {
  // Reset: re-init with empty data
  initAchievements(
    { totalGamesPlayed: 0, totalBet: 0, totalPayout: 0 },
    { unlocked: {}, handTypesAchieved: [], totalDoubleUps: 0 },
  );
  off("achievement:unlocked", () => {});
});

// ── Hand achievements ──

test("first_pair unlocks on Pair hand", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Pair", rank: 1 } });
  assert.ok(unlockedEvents.includes("first_pair"));
});

test("first_two_pair unlocks on Two Pair", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Two Pair", rank: 2 } });
  assert.ok(unlockedEvents.includes("first_two_pair"));
});

test("first_three_kind unlocks on Three of a Kind", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Three of a Kind", rank: 3 } });
  assert.ok(unlockedEvents.includes("first_three_kind"));
});

test("first_straight unlocks on Straight", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Straight", rank: 4 } });
  assert.ok(unlockedEvents.includes("first_straight"));
});

test("first_flush unlocks on Flush", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Flush", rank: 5 } });
  assert.ok(unlockedEvents.includes("first_flush"));
});

test("first_full_house unlocks on Full House", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Full House", rank: 6 } });
  assert.ok(unlockedEvents.includes("first_full_house"));
});

test("first_four_kind unlocks on Four of a Kind", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Four of a Kind", rank: 7 } });
  assert.ok(unlockedEvents.includes("first_four_kind"));
});

test("first_straight_flush unlocks on Straight Flush", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Straight Flush", rank: 8 } });
  assert.ok(unlockedEvents.includes("first_straight_flush"));
});

test("first_royal_flush unlocks on Royal Flush", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Royal Flush", rank: 9 } });
  assert.ok(unlockedEvents.includes("first_royal_flush"));
});

test("all_hands unlocks after achieving all 9 winning hand types across sessions", () => {
  initAchievements(emptyHighScores(), {
    unlocked: {},
    handTypesAchieved: [
      "Pair", "Two Pair", "Three of a Kind", "Straight",
      "Flush", "Full House", "Four of a Kind",
    ],
    totalDoubleUps: 0,
  });
  // Achieve the last two needed
  emit("hand:evaluated", { result: { name: "Straight Flush", rank: 8 } });
  assert.ok(!unlockedEvents.includes("all_hands")); // need 1 more
  emit("hand:evaluated", { result: { name: "Royal Flush", rank: 9 } });
  assert.ok(unlockedEvents.includes("all_hands"));
});

test("all_hands does not fire on non-winning hands", () => {
  initAchievements(emptyHighScores(), {
    unlocked: {},
    handTypesAchieved: ["High Card"],
    totalDoubleUps: 0,
  });
  emit("hand:evaluated", { result: { name: "High Card", rank: 0 } });
  assert.ok(!unlockedEvents.includes("all_hands"));
});

// ── Double-up achievements ──

test("du_first_win unlocks on first double-up win", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("doubleup:win", { newPayout: 20 });
  assert.ok(unlockedEvents.includes("du_first_win"));
});

test("du_streak_3 unlocks after 3 consecutive double-up wins", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("doubleup:win", { newPayout: 10 });
  emit("doubleup:win", { newPayout: 20 });
  assert.ok(!unlockedEvents.includes("du_streak_3"));
  emit("doubleup:win", { newPayout: 40 });
  assert.ok(unlockedEvents.includes("du_streak_3"));
});

test("du_streak_3 resets on lose", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("doubleup:win", { newPayout: 10 });
  emit("doubleup:win", { newPayout: 20 });
  emit("doubleup:lose", {});
  emit("doubleup:win", { newPayout: 10 });
  emit("doubleup:win", { newPayout: 20 });
  assert.ok(!unlockedEvents.includes("du_streak_3")); // streak reset
});

test("du_streak_5 unlocks at 5 consecutive wins", () => {
  initAchievements(emptyHighScores(), emptyAch());
  for (let i = 0; i < 5; i++) {
    emit("doubleup:win", { newPayout: 10 * (i + 1) });
  }
  assert.ok(unlockedEvents.includes("du_streak_5"));
});

test("du_push_win unlocks when win follows a push", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("doubleup:push", {});
  emit("doubleup:win", { newPayout: 20 });
  assert.ok(unlockedEvents.includes("du_push_win"));
});

test("du_push_win does not unlock without preceding push", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("doubleup:win", { newPayout: 10 });
  assert.ok(!unlockedEvents.includes("du_push_win"));
});

test("du_push_win: doubleup:start resets push state between chains", () => {
  initAchievements(emptyHighScores(), emptyAch());
  // Chain one: push → push state lost because doubleup:start resets it
  emit("doubleup:start", { currentPayout: 10 });
  emit("doubleup:push", {});
  emit("doubleup:start", { currentPayout: 10 });
  emit("doubleup:win", { newPayout: 10 });
  assert.ok(!unlockedEvents.includes("du_push_win"));
});

test("du_total_10 unlocks after 10 cumulative double-up wins", () => {
  initAchievements(emptyHighScores(), {
    unlocked: {},
    handTypesAchieved: [],
    totalDoubleUps: 8,
  });
  emit("doubleup:win", { newPayout: 10 });
  assert.ok(!unlockedEvents.includes("du_total_10"));
  emit("doubleup:win", { newPayout: 20 });
  assert.ok(unlockedEvents.includes("du_total_10"));
});

// ── Cumulative achievements ──

test("total_50_games unlocks at 50 total games played", () => {
  initAchievements({ ...emptyHighScores(), totalGamesPlayed: 49 }, emptyAch());
  emit("hand:end", { payout: 0, creditsAfter: 50 });
  assert.ok(unlockedEvents.includes("total_50_games"));
});

test("total_200_games unlocks at 200 total games played", () => {
  initAchievements({ ...emptyHighScores(), totalGamesPlayed: 199 }, emptyAch());
  emit("hand:end", { payout: 0, creditsAfter: 50 });
  assert.ok(unlockedEvents.includes("total_200_games"));
});

test("total_bet_1000 unlocks at cumulative bet 1000", () => {
  initAchievements({ ...emptyHighScores(), totalBet: 990 }, emptyAch());
  emit("bet:placed", { bet: 10, creditsBefore: 100, creditsAfter: 90 });
  assert.ok(unlockedEvents.includes("total_bet_1000"));
});

test("total_payout_5000 unlocks at cumulative payout 5000", () => {
  initAchievements({ ...emptyHighScores(), totalPayout: 4900 }, emptyAch());
  emit("payout:received", { payout: 100, handName: "Flush", bet: 5 });
  assert.ok(unlockedEvents.includes("total_payout_5000"));
});

test("total_profit_1000 unlocks when net profit reaches 1000", () => {
  initAchievements({ ...emptyHighScores(), totalBet: 3000, totalPayout: 4000 }, emptyAch());
  // profit is 1000 already, should unlock immediately on any check
  emit("hand:end", { payout: 0, creditsAfter: 50 });
  assert.ok(unlockedEvents.includes("total_profit_1000"));
});

// ── Milestone achievements ──

test("coins_500 unlocks when credits reach 500", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:end", { payout: 500, creditsAfter: 500 });
  assert.ok(unlockedEvents.includes("coins_500"));
});

test("coins_2000 unlocks when credits reach 2000", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:end", { payout: 2000, creditsAfter: 2000 });
  assert.ok(unlockedEvents.includes("coins_2000"));
});

test("coins_10000 unlocks when credits reach 10000", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:end", { payout: 10000, creditsAfter: 10000 });
  assert.ok(unlockedEvents.includes("coins_10000"));
});

test("comeback_king unlocks after game over recovery hitting 500", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("gameover", {});
  emit("hand:end", { payout: 600, creditsAfter: 600 });
  assert.ok(unlockedEvents.includes("comeback_king"));
});

test("comeback_king requires gameover first", () => {
  initAchievements(emptyHighScores(), emptyAch());
  // No gameover event emitted
  emit("hand:end", { payout: 600, creditsAfter: 600 });
  assert.ok(!unlockedEvents.includes("comeback_king"));
});

// ── Challenge achievements ──

test("no_exchange_win unlocks on win with 0 exchanges", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("exchange:selected", { exchangeIndexes: new Set() });
  emit("hand:evaluated", { result: { name: "Pair", rank: 1 } });
  assert.ok(unlockedEvents.includes("no_exchange_win"));
});

test("no_exchange_win does not trigger on loss", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("exchange:selected", { exchangeIndexes: new Set() });
  emit("hand:evaluated", { result: { name: "High Card", rank: 0 } });
  assert.ok(!unlockedEvents.includes("no_exchange_win"));
});

test("all_exchange unlocks on win with 5 exchanges", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("exchange:selected", { exchangeIndexes: new Set([0, 1, 2, 3, 4]) });
  emit("hand:evaluated", { result: { name: "Pair", rank: 1 } });
  assert.ok(unlockedEvents.includes("all_exchange"));
});

test("max_bet_pair unlocks on pair+ with bet 10", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("bet:placed", { bet: 10, creditsBefore: 100, creditsAfter: 90 });
  emit("hand:evaluated", { result: { name: "Pair", rank: 1 } });
  assert.ok(unlockedEvents.includes("max_bet_pair"));
});

test("max_bet_pair does not trigger on loss at max bet", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("bet:placed", { bet: 10, creditsBefore: 100, creditsAfter: 90 });
  emit("hand:evaluated", { result: { name: "High Card", rank: 0 } });
  assert.ok(!unlockedEvents.includes("max_bet_pair"));
});

test("min_bet_royal unlocks on royal flush with bet 1", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("bet:placed", { bet: 1, creditsBefore: 10, creditsAfter: 9 });
  emit("hand:evaluated", { result: { name: "Royal Flush", rank: 9 } });
  assert.ok(unlockedEvents.includes("min_bet_royal"));
});

test("min_bet_royal does not trigger on flush with bet 1", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("bet:placed", { bet: 1, creditsBefore: 10, creditsAfter: 9 });
  emit("hand:evaluated", { result: { name: "Flush", rank: 5 } });
  assert.ok(!unlockedEvents.includes("min_bet_royal"));
});

test("three_win_streak unlocks after 3 consecutive winning hands", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:end", { payout: 10, creditsAfter: 110 });
  emit("hand:end", { payout: 20, creditsAfter: 130 });
  assert.ok(!unlockedEvents.includes("three_win_streak"));
  emit("hand:end", { payout: 5, creditsAfter: 135 });
  assert.ok(unlockedEvents.includes("three_win_streak"));
});

test("three_win_streak resets on losing hand", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:end", { payout: 10, creditsAfter: 110 });
  emit("hand:end", { payout: 0, creditsAfter: 100 }); // loss
  emit("hand:end", { payout: 10, creditsAfter: 110 });
  emit("hand:end", { payout: 10, creditsAfter: 120 });
  assert.ok(!unlockedEvents.includes("three_win_streak")); // streak reset by loss
});

test("credits_1_left unlocks when betting from 1 coin and winning", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("bet:placed", { bet: 1, creditsBefore: 1, creditsAfter: 0 });
  emit("hand:end", { payout: 50, creditsAfter: 50 });
  assert.ok(unlockedEvents.includes("credits_1_left"));
});

test("credits_1_left does not trigger when betting normally and winning", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("bet:placed", { bet: 1, creditsBefore: 100, creditsAfter: 99 });
  emit("hand:end", { payout: 5, creditsAfter: 104 });
  assert.ok(!unlockedEvents.includes("credits_1_left"));
});

// ── State persistence round-trip ──

test("getAchievementState returns serializable state", () => {
  initAchievements({ ...emptyHighScores(), totalBet: 100 }, emptyAch());
  emit("hand:evaluated", { result: { name: "Pair", rank: 1 } });
  const state = getAchievementState();
  assert.ok(typeof state.unlocked === "object");
  assert.ok(state.unlocked.first_pair !== undefined);
  assert.ok(Array.isArray(state.handTypesAchieved));
  assert.ok(state.handTypesAchieved.includes("Pair"));
  assert.equal(typeof state.totalDoubleUps, "number");
  // Verify JSON-serializable
  const json = JSON.stringify(state);
  const parsed = JSON.parse(json);
  assert.equal(parsed.unlocked.first_pair, state.unlocked.first_pair);
});

test("getAchievementProgress returns all achievements with unlock status", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("doubleup:win", { newPayout: 10 });
  const progress = getAchievementProgress();
  assert.equal(progress.length, 30);
  const duFirst = progress.find((a) => a.id === "du_first_win");
  assert.ok(duFirst.unlocked);
  const notUnlocked = progress.find((a) => a.id === "first_royal_flush");
  assert.equal(notUnlocked.unlocked, false);
  // condition function stripped
  assert.equal(duFirst.condition, undefined);
});

test("getCategoryProgress returns per-category counts", () => {
  initAchievements(emptyHighScores(), emptyAch());
  emit("hand:evaluated", { result: { name: "Pair", rank: 1 } });
  const cats = getCategoryProgress();
  assert.ok(cats.hand);
  assert.equal(cats.hand.total, 10);
  assert.equal(cats.hand.unlocked >= 1, true); // at least first_pair
  assert.ok(cats.doubleup);
  assert.ok(cats.cumulative);
  assert.ok(cats.milestone);
  assert.ok(cats.challenge);
});

test("getTotalUnlocked returns correct count", () => {
  initAchievements(emptyHighScores(), emptyAch());
  assert.equal(getTotalUnlocked(), 0);
  emit("hand:evaluated", { result: { name: "Pair", rank: 1 } });
  emit("hand:evaluated", { result: { name: "Two Pair", rank: 2 } });
  assert.equal(getTotalUnlocked(), 2);
});

test("pre-unlocked achievements do not re-unlock", () => {
  initAchievements(emptyHighScores(), {
    unlocked: { first_pair: "2026-01-01T00:00:00.000Z" },
    handTypesAchieved: [],
    totalDoubleUps: 0,
  });
  emit("hand:evaluated", { result: { name: "Pair", rank: 1 } });
  assert.ok(!unlockedEvents.includes("first_pair"));
});

// ── helpers ──

function emptyHighScores() {
  return { totalGamesPlayed: 0, totalBet: 0, totalPayout: 0 };
}

function emptyAch() {
  return { unlocked: {}, handTypesAchieved: [], totalDoubleUps: 0 };
}
