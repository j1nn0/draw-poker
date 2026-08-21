import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DATA_DIR = process.env.DRAW_POKER_DATA_DIR || join(homedir(), ".draw-poker");
const CREDITS_FILE = join(DATA_DIR, "credits.json");
const HIGHSCORES_FILE = join(DATA_DIR, "highscores.json");
const ACHIEVEMENTS_FILE = join(DATA_DIR, "achievements.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function writeFileAtomically(filePath, contents) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    writeFileSync(tempPath, contents);
    renameSync(tempPath, filePath);
  } catch (error) {
    try {
      unlinkSync(tempPath);
    } catch {
      // Preserve the original write or rename error.
    }
    throw error;
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
  writeFileAtomically(CREDITS_FILE, JSON.stringify({ credits }, null, 2));
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
  writeFileAtomically(HIGHSCORES_FILE, JSON.stringify(highScores, null, 2));
}

export function loadAchievements() {
  try {
    const data = readFileSync(ACHIEVEMENTS_FILE, "utf8");
    const parsed = JSON.parse(data);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { unlocked: {}, handTypesAchieved: [], totalDoubleUps: 0 };
    }
    const unlocked =
      parsed.unlocked !== null &&
      typeof parsed.unlocked === "object" &&
      !Array.isArray(parsed.unlocked)
        ? Object.fromEntries(
            Object.entries(parsed.unlocked).filter(([, v]) => typeof v === "string"),
          )
        : {};
    const handTypesAchieved = Array.isArray(parsed.handTypesAchieved)
      ? parsed.handTypesAchieved.filter((h) => typeof h === "string")
      : [];
    const totalDoubleUps =
      typeof parsed.totalDoubleUps === "number" &&
      Number.isFinite(parsed.totalDoubleUps) &&
      parsed.totalDoubleUps >= 0
        ? Math.floor(parsed.totalDoubleUps)
        : 0;
    return { unlocked, handTypesAchieved, totalDoubleUps };
  } catch {
    return { unlocked: {}, handTypesAchieved: [], totalDoubleUps: 0 };
  }
}

export function saveAchievements(achievementState) {
  ensureDataDir();
  writeFileAtomically(ACHIEVEMENTS_FILE, JSON.stringify(achievementState, null, 2));
}
