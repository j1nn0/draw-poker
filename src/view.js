import { formatCardLines, getPayTable } from "./game.js";

export function localizeHandName(name) {
  const names = {
    "Royal Flush": "ロイヤルストレートフラッシュ",
    "Straight Flush": "ストレートフラッシュ",
    "Four of a Kind": "フォーカード",
    "Full House": "フルハウス",
    "Flush": "フラッシュ",
    "Straight": "ストレート",
    "Three of a Kind": "スリーカード",
    "Two Pair": "ツーペア",
    "Pair": "ワンペア",
    "High Card": "ハイカード",
  };
  return names[name] || name;
}

export function displayWidth(str) {
  let w = 0;
  const visibleStr = str.replace(/\x1b\[[0-9;]*m/g, "");
  for (const char of visibleStr) {
    w += char.charCodeAt(0) > 0x7F ? 2 : 1;
  }
  return w;
}

export function formatBoxRow(content, innerWidth) {
  const padding = Math.max(0, innerWidth - displayWidth(content));
  return `║${content}${" ".repeat(padding)}║`;
}

export function centerBoxText(text, innerWidth) {
  const textWidth = displayWidth(text);
  const leftPadding = Math.max(0, Math.floor((innerWidth - textWidth) / 2));
  const rightPadding = Math.max(0, innerWidth - textWidth - leftPadding);
  return `${" ".repeat(leftPadding)}${text}${" ".repeat(rightPadding)}`;
}

export function truncateDisplayWidth(str, maxWidth) {
  const text = String(str);
  if (maxWidth <= 0) return "";
  if (displayWidth(text) <= maxWidth) return text;

  const ellipsis = "…";
  const targetWidth = Math.max(0, maxWidth - displayWidth(ellipsis));
  let result = "";
  let resultWidth = 0;
  for (const char of text) {
    const charWidth = displayWidth(char);
    if (resultWidth + charWidth > targetWidth) break;
    result += char;
    resultWidth += charWidth;
  }
  return `${result}${maxWidth >= displayWidth(ellipsis) ? ellipsis : ""}`;
}

export function progressBar(current, total, width = 10) {
  const barWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safeTotal = Number.isFinite(total) ? total : 0;
  const ratio = safeTotal > 0 ? safeCurrent / safeTotal : 0;
  const filled = Math.min(barWidth, Math.max(0, Math.round(ratio * barWidth)));
  const empty = barWidth - filled;

  let color;
  if (safeTotal <= 0 || safeCurrent <= Math.floor(safeTotal * 0.3)) {
    color = "\x1b[31m";
  } else if (safeCurrent >= Math.ceil(safeTotal * 0.7)) {
    color = "\x1b[32m";
  } else {
    color = "\x1b[33m";
  }

  return `${color}${"█".repeat(filled)}\x1b[0m${"░".repeat(empty)}`;
}

export function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

export function renderCardFaceDown() {
  return ["+-----+", "|?????|", "|  ?  |", "|?????|", "+-----+"];
}

export function renderCardsRow(cards, faceDownIndexes) {
  const faceDownSet = new Set(faceDownIndexes);
  const allLines = cards.map((card, i) =>
    faceDownSet.has(i) ? renderCardFaceDown() : formatCardLines(card),
  );
  return [0, 1, 2, 3, 4].map((lineIdx) =>
    allLines.map((cardLines) => cardLines[lineIdx]).join(" "),
  ).join("\n");
}

export function renderTwoCards(card1, card2) {
  const lines1 = formatCardLines(card1);
  const lines2 = formatCardLines(card2);
  return lines1.map((line, i) => `${line}  ${lines2[i]}`).join("\n");
}

export function renderCardLabels(count) {
  return Array.from({ length: count }, (_, i) =>
    `${i + 1}`.padStart(3).padEnd(7),
  ).join(" ");
}

export function buildPayTableText() {
  const payTable = getPayTable();
  const HAND_ORDER = [
    "Royal Flush", "Straight Flush", "Four of a Kind", "Full House",
    "Flush", "Straight", "Three of a Kind", "Two Pair", "Pair",
  ];
  const SEP = "═".repeat(46);
  const lines = [];
  lines.push(`\n╔${SEP}╗`);
  lines.push(`║${" ".repeat(17)}ペイテーブル${" ".repeat(17)}║`);
  lines.push(`╠${SEP}╣`);
  lines.push(`║ 役${" ".repeat(28)}${"1×".padStart(4)}${"5×".padStart(6)}${"10×".padStart(5)}║`);
  lines.push(`╠${SEP}╣`);
  for (const handName of HAND_ORDER) {
    const jpName = localizeHandName(handName);
    const pad = " ".repeat(30 - displayWidth(jpName));
    const p1 = String(payTable[handName][1]).padStart(4);
    const p5 = String(payTable[handName][5]).padStart(6);
    const p10 = String(payTable[handName][10]).padStart(5);
    lines.push(`║ ${jpName}${pad}${p1}${p5}${p10}║`);
  }
  lines.push(`╚${SEP}╝\n`);
  return lines.join("\n");
}

export function buildAchievementsText(progress, categories, total) {
  const BOX_WIDTH = 48;
  const CONTENT_WIDTH = BOX_WIDTH - 1;
  const SEP = "═".repeat(BOX_WIDTH);
  const lines = [];
  lines.push(`\n╔${SEP}╗`);
  const title = `実績一覧 (${total}/${progress.length})`;
  lines.push(`${formatBoxRow(centerBoxText(title, BOX_WIDTH), BOX_WIDTH)}`);
  const categoryOrder = ["hand", "doubleup", "cumulative", "milestone", "challenge"];
  const catLabels = {
    hand: "ハンド系", doubleup: "ダブルアップ系", cumulative: "累計系",
    milestone: "マイルストーン系", challenge: "チャレンジ系",
  };
  for (const catId of categoryOrder) {
    const cat = categories[catId];
    if (!cat) continue;
    const catItems = progress.filter((a) => a.category === catId);
    const bar = progressBar(cat.unlocked, cat.total);
    lines.push(`╠${SEP}╣`);
    const categoryLine = ` ${cat.icon || "?"} ${catLabels[catId]} ${bar} ${cat.unlocked}/${cat.total}`;
    lines.push(`${formatBoxRow(categoryLine, BOX_WIDTH)}`);
    const unlocked = catItems.filter((a) => a.unlocked).slice(0, 2);
    const locked = catItems.filter((a) => !a.unlocked).slice(0, 2);
    const shown = [...unlocked, ...locked];
    for (const ach of shown) {
      const marker = ach.unlocked ? "★" : "☆";
      const rawName = `${marker} ${ach.icon} ${ach.name}`;
      const name = truncateDisplayWidth(rawName, CONTENT_WIDTH);
      let suffix = "";
      if (!ach.unlocked) {
        const descriptionPrefix = "  (";
        const descriptionSuffix = ")";
        const descriptionWidth = Math.max(
          0,
          CONTENT_WIDTH - displayWidth(name + descriptionPrefix + descriptionSuffix),
        );
        const description = truncateDisplayWidth(ach.description, descriptionWidth);
        suffix = `${descriptionPrefix}${description}${descriptionSuffix}`;
      }
      const line = `${name}${suffix}`;
      const padTotal = Math.max(0, CONTENT_WIDTH - displayWidth(line));
      lines.push(`║ ${line}${" ".repeat(padTotal)}║`);
    }
    if (catItems.length > shown.length) {
      lines.push(`${formatBoxRow("", BOX_WIDTH)}`);
    }
  }
  lines.push(`╚${SEP}╝\n`);
  return lines.join("\n");
}

export function buildHelpText() {
  const lines = [
    "使い方: draw-poker [オプション]",
    "",
    "オプション:",
    "  -h, --help          ヘルプを表示",
    "  -v, --version       バージョンを表示",
    "      --stats         累計統計と歴代記録を表示",
    "  -p, --paytable      ペイテーブルを表示",
    "  -a, --achievements  実績一覧を表示",
    "",
    "ゲーム操作:",
    "  ←/→  カード選択  Space 交換切替  1-5 直接切替  a 全部交換  k 全部キープ  Enter 決定  q 終了",
    "  ダブルアップ: ←/→ 選択  1-4 直接選択  Enter 決定  q 終了",
    "",
    "データ保存: ~/.draw-poker/ (環境変数 DRAW_POKER_DATA_DIR で変更可)",
  ];
  return lines.join("\n");
}

export function buildStatsOutput({ highScores, credits, progress, total }) {
  const lines = [];
  lines.push("=== draw-poker 統計 ===");
  lines.push("");
  lines.push(`コイン: ${credits}`);
  lines.push("");
  lines.push("歴代記録:");
  lines.push(`  最高コイン: ${highScores.maxCredits}`);
  lines.push(`  最高役: ${localizeHandName(highScores.bestHandName)}`);
  lines.push(`  最大ダブルアップ: ${highScores.maxDoubleUps}`);
  lines.push("");
  lines.push("累計:");
  lines.push(`  通算プレイ回数: ${highScores.totalGamesPlayed}`);
  lines.push(`  通算勝利回数: ${highScores.totalGamesWon}`);
  const net = highScores.totalPayout - highScores.totalBet;
  lines.push(`  通算収支: ${net >= 0 ? "+" : ""}${net}`);
  lines.push(`  総ベット: ${highScores.totalBet}`);
  lines.push(`  総配当: ${highScores.totalPayout}`);
  lines.push("");
  lines.push(`実績: ${total}/${progress.length}`);
  return lines.join("\n");
}
