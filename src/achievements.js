import { on, emit } from "./eventBus.js";

// ── Categories ────────────────────────────────────────────
export const CATEGORIES = {
  hand:   { icon: "\u{1F0CF}", label: "ハンド系", order: 0 },
  doubleup: { icon: "\u{1F3B2}", label: "ダブルアップ系", order: 1 },
  cumulative: { icon: "\u{1F4CA}", label: "累計系", order: 2 },
  milestone:  { icon: "\u{1F3C6}", label: "マイルストーン系", order: 3 },
  challenge:  { icon: "\u{1F525}", label: "チャレンジ系", order: 4 },
};

// ── Achievements ──────────────────────────────────────────
export const ACHIEVEMENTS = [
  // ── ハンド系 (10) ──
  {
    id: "first_pair",
    category: "hand",
    name: "初勝利",
    description: "ペアを揃えて初めての配当を得る",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Pair",
  },
  {
    id: "first_two_pair",
    category: "hand",
    name: "ダブルチャンス",
    description: "ツーペアを達成",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Two Pair",
  },
  {
    id: "first_three_kind",
    category: "hand",
    name: "スリーカード完成",
    description: "スリーカードを達成",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Three of a Kind",
  },
  {
    id: "first_straight",
    category: "hand",
    name: "ストレート達成",
    description: "ストレートを達成",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Straight",
  },
  {
    id: "first_flush",
    category: "hand",
    name: "フラッシュ達成",
    description: "フラッシュを達成",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Flush",
  },
  {
    id: "first_full_house",
    category: "hand",
    name: "フルハウス達成",
    description: "フルハウスを達成",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Full House",
  },
  {
    id: "first_four_kind",
    category: "hand",
    name: "フォーカード達成",
    description: "フォーカードを達成",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Four of a Kind",
  },
  {
    id: "first_straight_flush",
    category: "hand",
    name: "ストレートフラッシュ達成",
    description: "ストレートフラッシュを達成",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Straight Flush",
  },
  {
    id: "first_royal_flush",
    category: "hand",
    name: "ロイヤルストレートフラッシュ達成",
    description: "ロイヤルストレートフラッシュを達成",
    icon: "\u{1F0CF}",
    condition: (ev, st) => st.currentHand && st.currentHand.name === "Royal Flush",
  },
  {
    id: "all_hands",
    category: "hand",
    name: "ポーカーマスター",
    description: "全9種の役（ペア〜ロイヤル）を通算で達成する",
    icon: "\u{1F3C6}",
    condition: (_ev, st) => {
      const winning = new Set([
        "Pair", "Two Pair", "Three of a Kind", "Straight",
        "Flush", "Full House", "Four of a Kind",
        "Straight Flush", "Royal Flush",
      ]);
      const achieved = [...st.handTypesAchieved].filter((h) => winning.has(h));
      return achieved.length >= 9;
    },
  },

  // ── ダブルアップ系 (5) ──
  {
    id: "du_first_win",
    category: "doubleup",
    name: "ダブルアップ初勝利",
    description: "ダブルアップに1回勝利",
    icon: "\u{1F3B2}",
    condition: (ev, _st) => ev.type === "doubleup:win",
  },
  {
    id: "du_streak_3",
    category: "doubleup",
    name: "ダブルアップ3連勝",
    description: "1セッションで3連続成功",
    icon: "\u{1F3B2}",
    condition: (ev, st) => ev.type === "doubleup:win" && st.doubleUpStreak >= 3,
  },
  {
    id: "du_streak_5",
    category: "doubleup",
    name: "ダブルアップ5連勝",
    description: "1セッションで5連続成功（上限到達）",
    icon: "\u{1F3B2}",
    condition: (ev, st) => ev.type === "doubleup:win" && st.doubleUpStreak >= 5,
  },
  {
    id: "du_push_win",
    category: "doubleup",
    name: "命拾い",
    description: "ダブルアップでプッシュ後、次の挑戦で勝利",
    icon: "\u{1F3B2}",
    condition: (ev, st) => ev.type === "doubleup:win" && st.lastDoubleUpResult === "push",
  },
  {
    id: "du_total_10",
    category: "doubleup",
    name: "ダブルアップマスター",
    description: "通算ダブルアップ成功数が10回に到達",
    icon: "\u{1F3B2}",
    condition: (_ev, st) => st.totalDoubleUps >= 10,
  },

  // ── 累計系 (5) ──
  {
    id: "total_50_games",
    category: "cumulative",
    name: "常連プレイヤー",
    description: "通算プレイ回数50回",
    icon: "\u{1F4CA}",
    condition: (_ev, st) => st.totalGamesPlayed >= 50,
  },
  {
    id: "total_200_games",
    category: "cumulative",
    name: "ポーカー中毒",
    description: "通算プレイ回数200回",
    icon: "\u{1F4CA}",
    condition: (_ev, st) => st.totalGamesPlayed >= 200,
  },
  {
    id: "total_bet_1000",
    category: "cumulative",
    name: "ベット1000到達",
    description: "通算ベット額1000コイン",
    icon: "\u{1F4CA}",
    condition: (_ev, st) => st.totalBet >= 1000,
  },
  {
    id: "total_payout_5000",
    category: "cumulative",
    name: "稼ぎ頭",
    description: "通算配当額5000コイン",
    icon: "\u{1F4CA}",
    condition: (_ev, st) => st.totalPayout >= 5000,
  },
  {
    id: "total_profit_1000",
    category: "cumulative",
    name: "黒字経営",
    description: "通算収支（配当−ベット）が+1000",
    icon: "\u{1F4CA}",
    condition: (_ev, st) => (st.totalPayout - st.totalBet) >= 1000,
  },

  // ── マイルストーン系 (4) ──
  {
    id: "coins_500",
    category: "milestone",
    name: "コイン貯蓄",
    description: "所持コインが500に到達",
    icon: "\u{1F3C6}",
    condition: (_ev, st) => st.currentCredits >= 500,
  },
  {
    id: "coins_2000",
    category: "milestone",
    name: "小金持ち",
    description: "所持コインが2,000に到達",
    icon: "\u{1F3C6}",
    condition: (_ev, st) => st.currentCredits >= 2000,
  },
  {
    id: "coins_10000",
    category: "milestone",
    name: "大富豪",
    description: "所持コインが10,000に到達",
    icon: "\u{1F3C6}",
    condition: (_ev, st) => st.currentCredits >= 10000,
  },
  {
    id: "comeback_king",
    category: "milestone",
    name: "逆転王",
    description: "ゲームオーバーから再開し、そのセッション内でコイン500以上に到達",
    icon: "\u{1F3C6}",
    condition: (_ev, st) => st.sessionRecoveredFromZero && st.currentCredits >= 500,
  },

  // ── チャレンジ系 (6) ──
  {
    id: "no_exchange_win",
    category: "challenge",
    name: "ツキ",
    description: "1枚も交換せずに配当を得る",
    icon: "\u{1F525}",
    condition: (ev, st) =>
      ev.type === "hand:evaluated" && st.lastExchangeCount === 0 && st.currentHand && st.currentHand.rank >= 1,
  },
  {
    id: "all_exchange",
    category: "challenge",
    name: "リセット",
    description: "5枚すべて交換して配当を得る",
    icon: "\u{1F525}",
    condition: (ev, st) =>
      ev.type === "hand:evaluated" && st.lastExchangeCount === 5 && st.currentHand && st.currentHand.rank >= 1,
  },
  {
    id: "max_bet_pair",
    category: "challenge",
    name: "一か八か",
    description: "最大ベット(10)でペア以上を出して配当を得る",
    icon: "\u{1F525}",
    condition: (ev, st) =>
      ev.type === "hand:evaluated" && st.lastBet === 10 && st.currentHand && st.currentHand.rank >= 1,
  },
  {
    id: "min_bet_royal",
    category: "challenge",
    name: "奇跡の1コイン",
    description: "最小ベット(1)でロイヤルフラッシュを達成",
    icon: "\u{1F525}",
    condition: (ev, st) =>
      ev.type === "hand:evaluated" && st.lastBet === 1 && st.currentHand && st.currentHand.name === "Royal Flush",
  },
  {
    id: "three_win_streak",
    category: "challenge",
    name: "ハットトリック",
    description: "3ハンド連続で配当を得る",
    icon: "\u{1F525}",
    condition: (_ev, st) => st.winStreak >= 3,
  },
  {
    id: "credits_1_left",
    category: "challenge",
    name: "崖っぷち",
    description: "残り1コインの状態からハンドに勝利する",
    icon: "\u{1F525}",
    condition: (_ev, st) => st.wonFromOneCoin,
  },
];

// ── State ─────────────────────────────────────────────────
const state = {
  // Persisted in achievements.json
  unlocked: new Map(),          // id → ISO timestamp
  handTypesAchieved: new Set(), // hand names ever achieved
  totalDoubleUps: 0,           // cumulative double-up wins

  // Loaded from highscores
  totalGamesPlayed: 0,
  totalBet: 0,
  totalPayout: 0,

  // Session-local
  currentCredits: 0,
  lastBet: 0,
  lastExchangeCount: -1,
  currentHand: null,
  doubleUpStreak: 0,
  sessionDoubleUps: 0,
  winStreak: 0,
  lastDoubleUpResult: null,
  sessionRecoveredFromZero: false,
  wonFromOneCoin: false,
};

// ── Event handlers ────────────────────────────────────────
function handleBetPlaced(data) {
  state.totalBet += data.bet;
  state.lastBet = data.bet;
  state.currentCredits = data.creditsAfter;
  state.wonFromOneCoin = false;
  if (data.creditsBefore === 1) {
    // Remember so we can check if this hand wins
    state._betFromOne = true;
  } else {
    state._betFromOne = false;
  }
}

function handleExchangeSelected(data) {
  state.lastExchangeCount = data.exchangeIndexes ? data.exchangeIndexes.size : 0;
}

function handleHandEvaluated(data) {
  state.handTypesAchieved.add(data.result.name);
  state.currentHand = data.result;
}

function handlePayoutReceived(data) {
  state.totalPayout += data.payout;
}

function handleDoubleUpStart() {
  state.lastDoubleUpResult = null;
}

function handleDoubleUpWin() {
  state.doubleUpStreak++;
  state.sessionDoubleUps++;
  state.totalDoubleUps++;
  // du_push_win checks this after the event is processed
}

function handleDoubleUpLose() {
  state.doubleUpStreak = 0;
  state.lastDoubleUpResult = "lose";
}

function handleDoubleUpPush() {
  state.lastDoubleUpResult = "push";
}

function handleHandEnd(data) {
  state.sessionGamesPlayed = (state.sessionGamesPlayed || 0) + 1;
  state.totalGamesPlayed++;
  state.currentCredits = data.creditsAfter;

  // Win streak tracking
  if (data.payout > 0) {
    state.winStreak++;

    // credits_1_left: won a hand after betting from 1 coin
    if (state._betFromOne) {
      state.wonFromOneCoin = true;
    }
  } else {
    state.winStreak = 0;
  }
}

function handleGameOver() {
  state.sessionRecoveredFromZero = true;
  state.winStreak = 0;
}

function resetSessionState() {
  state.currentCredits = 0;
  state.lastBet = 0;
  state.lastExchangeCount = -1;
  state.currentHand = null;
  state.doubleUpStreak = 0;
  state.sessionDoubleUps = 0;
  state.sessionGamesPlayed = 0;
  state.winStreak = 0;
  state.lastDoubleUpResult = null;
  state.sessionRecoveredFromZero = false;
  state.wonFromOneCoin = false;
  state._betFromOne = false;
}

// ── Core checker ──────────────────────────────────────────
function checkAll() {
  let anyUnlocked = false;

  for (const ach of ACHIEVEMENTS) {
    if (state.unlocked.has(ach.id)) continue;

    // Each condition(event, state) receives the current state snapshot.
    // Handlers above have already updated state; we pass a proxy event
    // with type info so conditions can filter by event type.
    if (ach.condition(state._lastEvent, state)) {
      const timestamp = new Date().toISOString();
      state.unlocked.set(ach.id, timestamp);
      anyUnlocked = true;

      emit("achievement:unlocked", {
        id: ach.id,
        name: ach.name,
        icon: ach.icon,
        description: ach.description,
        category: ach.category,
      });
    }
  }

  return anyUnlocked;
}

function handleEvent(type, data, ...handlers) {
  state._lastEvent = { type, ...data };
  for (const handler of handlers) handler(data);
  checkAll();
}

// ── Public API ────────────────────────────────────────────
let _initialized = false;

export function initAchievements(highScores, achievementsData) {
  // Clear previous state
  state.unlocked = new Map();
  state.handTypesAchieved = new Set();
  state.totalDoubleUps = 0;
  state.totalGamesPlayed = 0;
  state.totalBet = 0;
  state.totalPayout = 0;
  resetSessionState();

  // Load persisted unlocks
  if (achievementsData?.unlocked) {
    for (const [id, ts] of Object.entries(achievementsData.unlocked)) {
      state.unlocked.set(id, ts);
    }
  }
  if (achievementsData?.handTypesAchieved) {
    for (const h of achievementsData.handTypesAchieved) {
      state.handTypesAchieved.add(h);
    }
  }
  state.totalDoubleUps = achievementsData?.totalDoubleUps || 0;

  // Load cumulative from highscores
  state.totalGamesPlayed = highScores?.totalGamesPlayed || 0;
  state.totalBet = highScores?.totalBet || 0;
  state.totalPayout = highScores?.totalPayout || 0;

  // Subscribe once (prevents duplicate handlers on re-init)
  if (!_initialized) {
    _initialized = true;
    on("bet:placed", (d) => handleEvent("bet:placed", d, handleBetPlaced));
    on("exchange:selected", (d) => handleEvent("exchange:selected", d, handleExchangeSelected));
    on("hand:evaluated", (d) => handleEvent("hand:evaluated", d, handleHandEvaluated));
    on("payout:received", (d) => handleEvent("payout:received", d, handlePayoutReceived));
    on("doubleup:start", (d) => handleEvent("doubleup:start", d, handleDoubleUpStart));
    on("doubleup:win", (d) => handleEvent("doubleup:win", d, handleDoubleUpWin));
    on("doubleup:lose", () => handleEvent("doubleup:lose", {}, handleDoubleUpLose));
    on("doubleup:push", () => handleEvent("doubleup:push", {}, handleDoubleUpPush));
    on("hand:end", (d) => handleEvent("hand:end", d, handleHandEnd));
    on("gameover", () => handleEvent("gameover", {}, handleGameOver));
    on("session:start", () => handleEvent("session:start", {}, resetSessionState));
  }
}

export function getAchievementState() {
  return {
    unlocked: Object.fromEntries(state.unlocked),
    handTypesAchieved: [...state.handTypesAchieved],
    totalDoubleUps: state.totalDoubleUps,
  };
}

export function getAchievementProgress() {
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    condition: undefined, // strip function for serialization
    unlocked: state.unlocked.has(a.id),
    timestamp: state.unlocked.get(a.id),
  }));
}

export function getCategoryProgress() {
  const result = {};
  for (const [catId, cat] of Object.entries(CATEGORIES)) {
    const items = ACHIEVEMENTS.filter((a) => a.category === catId);
    const unlockedCount = items.filter((a) => state.unlocked.has(a.id)).length;
    result[catId] = { ...cat, total: items.length, unlocked: unlockedCount };
  }
  return result;
}

export function getTotalUnlocked() {
  let count = 0;
  for (const ach of ACHIEVEMENTS) {
    if (state.unlocked.has(ach.id)) count++;
  }
  return count;
}
