import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DATA_DIR = process.env.DRAW_POKER_DATA_DIR || join(homedir(), ".draw-poker");
const CREDITS_FILE = join(DATA_DIR, "credits.json");
const HIGHSCORES_FILE = join(DATA_DIR, "highscores.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadCredits() {
  try {
    const data = readFileSync(CREDITS_FILE, "utf8");
    const parsed = JSON.parse(data);
    if (typeof parsed.credits === "number" && parsed.credits >= 0) {
      return parsed.credits;
    }
  } catch {
    // File missing or malformed — return default
  }
  return 100;
}

export function saveCredits(credits) {
  ensureDataDir();
  writeFileSync(CREDITS_FILE, JSON.stringify({ credits }, null, 2));
}

const DEFAULT_HIGH_SCORES = {
  maxCredits: 0,
  bestHandRank: 0,
  bestHandName: "N/A",
  maxDoubleUps: 0,
  totalGamesPlayed: 0,
  totalGamesWon: 0,
  totalBet: 0,
  totalPayout: 0,
};

export function loadHighScores() {
  try {
    const data = readFileSync(HIGHSCORES_FILE, "utf8");
    const parsed = JSON.parse(data);
    return Object.fromEntries(
      Object.entries(DEFAULT_HIGH_SCORES).map(([key, defaultVal]) => [
        key,
        typeof parsed[key] === typeof defaultVal ? parsed[key] : defaultVal,
      ]),
    );
  } catch {
    return { ...DEFAULT_HIGH_SCORES };
  }
}

export function saveHighScores(highScores) {
  ensureDataDir();
  writeFileSync(HIGHSCORES_FILE, JSON.stringify(highScores, null, 2));
}
