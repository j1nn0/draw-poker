#!/usr/bin/env node
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

import {
  createDeck,
  dealHand,
  drawCards,
  evaluateHand,
  calculatePayout,
  drawDoubleUpCards,
  playDoubleUp,
  formatVisualHand,
  formatCardLines,
  getHeldIndexes,
  shuffleDeck,
} from "./game.js";
import {
  loadCredits,
  saveCredits,
  loadHighScores,
  saveHighScores,
  loadAchievements,
  saveAchievements,
} from "./persistence.js";
import { mergeSessionResults, detectNewRecords } from "./scoring.js";
import { emit, on } from "./eventBus.js";
import {
  initAchievements,
  getAchievementProgress,
  getCategoryProgress,
  getTotalUnlocked,
  getAchievementState,
} from "./achievements.js";
import {
  displayWidth,
  formatBoxRow,
  centerBoxText,
  truncateDisplayWidth,
  progressBar,
  localizeHandName,
  formatCard,
  renderCardFaceDown,
  renderCardsRow,
  renderTwoCards,
  renderCardLabels,
  buildHelpText,
  buildStatsOutput,
  buildPayTableText,
  buildAchievementsText,
} from "./view.js";

export function parseArgs(argv) {
  const flags = {
    help: false,
    version: false,
    stats: false,
    paytable: false,
    achievements: false,
    unknown: null,
  };
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg === "--version" || arg === "-v") flags.version = true;
    else if (arg === "--stats") flags.stats = true;
    else if (arg === "--paytable" || arg === "-p") flags.paytable = true;
    else if (arg === "--achievements" || arg === "-a")
      flags.achievements = true;
    else if (arg.startsWith("-")) {
      flags.unknown = arg;
      break;
    } else {
      flags.unknown = arg;
      break;
    }
  }
  return flags;
}

export function getVersion() {
  try {
    const url = new URL("../package.json", import.meta.url);
    const data = readFileSync(url, "utf8");
    const pkg = JSON.parse(data);
    if (typeof pkg.version === "string") return pkg.version;
  } catch {}
  return "0.1.0";
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.unknown) {
    output.write(`不明なオプション: ${flags.unknown}\n`);
    output.write(`${buildHelpText()}\n`);
    process.exitCode = 1;
    return;
  }
  if (flags.help) {
    output.write(`${buildHelpText()}\n`);
    return;
  }
  if (flags.version) {
    output.write(`${getVersion()}\n`);
    return;
  }
  if (flags.paytable) {
    showPayTable();
    return;
  }
  if (flags.achievements) {
    const highScores = loadHighScores();
    const achievementsData = loadAchievements();
    initAchievements(highScores, achievementsData);
    showAchievements();
    return;
  }
  if (flags.stats) {
    const highScores = loadHighScores();
    const credits = loadCredits();
    const achievementsData = loadAchievements();
    initAchievements(highScores, achievementsData);
    const progress = getAchievementProgress();
    const total = getTotalUnlocked();
    output.write(
      `${buildStatsOutput({ highScores, credits, progress, total })}\n`,
    );
    return;
  }

  if (!input.isTTY) {
    output.write("このゲームは対話型ターミナルが必要です。\n");
    return;
  }

  const rl = createInterface({ input, output });

  let credits = loadCredits();
  const highScores = loadHighScores();
  let bestHand = null;
  let gamesPlayed = 0;
  let gamesWon = 0;
  let totalBet = 0;
  let totalPayout = 0;
  let maxCreditReached = credits;
  let maxDoubleUps = 0;
  let lastBet = 1;

  try {
    // Initialize achievements
    const achievementsData = loadAchievements();
    initAchievements(highScores, achievementsData);

    // Achievement notification display
    on("achievement:unlocked", (data) => {
      process.stdout.write("\x07");
      output.write(`\n★ 実績解除: ${data.name} ★\n`);
    });

    emit("session:start", { credits });

    showPayTable();

    while (true) {
      // --- Game over check ---
      if (credits <= 0) {
        const result = await handleGameOver(
          rl,
          {
            gamesPlayed,
            gamesWon,
            bestHand,
            maxDoubleUps,
            maxCreditReached,
            totalBet,
            totalPayout,
          },
          highScores,
        );
        if (!result.doContinue) break;
        credits = result.credits;
        saveCredits(credits);
        maxCreditReached = Math.max(maxCreditReached, credits);
        lastBet = 1;
        emit("gameover");
        continue;
      }

      // --- Bet ---
      const betResult = await handleBet(rl, credits, lastBet);
      if (betResult === null) {
        output.write("またね！\n");
        break;
      }
      credits = betResult.credits;
      lastBet = betResult.lastBet;
      totalBet += betResult.bet;

      // --- Deal & card exchange ---
      const drawResult = await playDraw();
      if (drawResult === null) {
        output.write("またね！\n");
        break;
      }

      // --- Payout & double-up ---
      const payoutResult = await handlePayout(
        rl,
        drawResult,
        betResult.bet,
        credits,
      );
      credits = payoutResult.credits;
      totalPayout += payoutResult.payout;
      maxCreditReached = Math.max(maxCreditReached, credits);
      gamesPlayed += 1;
      if (payoutResult.payout > 0) gamesWon += 1;
      maxDoubleUps = Math.max(maxDoubleUps, payoutResult.doubleUps);
      if (!bestHand || drawResult.result.rank > bestHand.rank)
        bestHand = drawResult.result;

      // --- Continue prompt ---
      const continueAnswer = await rl.question("Enterで続ける、qで終了: ");
      if (continueAnswer.trim().toLowerCase() === "q") break;
      output.write("\n");
    }
  } finally {
    endSession(
      rl,
      {
        credits,
        gamesPlayed,
        gamesWon,
        totalBet,
        totalPayout,
        maxCreditReached,
        bestHand,
        maxDoubleUps,
      },
      highScores,
    );
  }
}

async function handleBet(rl, credits, lastBet) {
  const maxBet = Math.min(10, credits);
  output.write(`コイン: ${credits}\n`);
  if (lastBet > maxBet) lastBet = maxBet;
  const betResult = await getBet(rl, maxBet, lastBet);
  if (betResult === null) return null;
  const { bet } = betResult;
  emit("bet:placed", {
    bet,
    creditsBefore: credits,
    creditsAfter: credits - bet,
  });
  return { bet, credits: credits - bet, lastBet: bet };
}

async function playDraw() {
  const shuffled = shuffleDeck(createDeck());
  const initialDeal = dealHand(shuffled);
  const exchangeIndexes = await selectExchangeCards(initialDeal.hand);
  if (exchangeIndexes === null) return null;
  emit("exchange:selected", { exchangeIndexes });

  const heldIndexes = getHeldIndexes(initialDeal.hand, exchangeIndexes);
  const finalDeal = drawCards(initialDeal.hand, initialDeal.deck, heldIndexes);
  const result = evaluateHand(finalDeal.hand);
  emit("hand:evaluated", { hand: finalDeal.hand, result });

  output.write(`\n最終:\n${formatVisualHand(finalDeal.hand)}\n`);
  output.write(`役: ${localizeHandName(result.name)}\n\n`);

  return { hand: finalDeal.hand, result, exchangeCount: exchangeIndexes.size };
}

async function handlePayout(rl, drawResult, bet, credits) {
  let payout = calculatePayout(drawResult.result.name, bet);
  emit("payout:received", { payout, handName: drawResult.result.name, bet });

  let currentDoubleUps = 0;

  if (payout > 0) {
    const duResult = await playDoubleUpLoop(rl, payout);
    payout = duResult.payout;
    currentDoubleUps = duResult.doubleUps;
  }

  const prevCredits = credits;
  credits += payout;

  emit("hand:end", {
    bet,
    payout,
    handResult: drawResult.result,
    doubleUps: currentDoubleUps,
    creditsAfter: credits,
  });

  if (credits !== prevCredits) {
    try {
      saveCredits(credits);
    } catch (err) {
      output.write(`警告: コイン残高の保存に失敗しました (${err.message})\n`);
    }
  }
  output.write(`配当: ${payout} / コイン: ${credits}\n`);

  return { payout, credits, doubleUps: currentDoubleUps };
}

async function handleGameOver(rl, stats, highScores) {
  const sessionStats = {
    maxCreditReached: stats.maxCreditReached,
    bestHandRank: stats.bestHand ? stats.bestHand.rank : 0,
    bestHandName: stats.bestHand ? stats.bestHand.name : "N/A",
    maxDoubleUps: stats.maxDoubleUps,
    gamesPlayed: stats.gamesPlayed,
    gamesWon: stats.gamesWon,
    totalBet: stats.totalBet,
    totalPayout: stats.totalPayout,
  };
  const updatedHighScores = mergeSessionResults(highScores, sessionStats);

  const GAME_OVER_BOX_WIDTH = 46;
  const SEP = "═".repeat(GAME_OVER_BOX_WIDTH);
  const boxRows = [
    "",
    centerBoxText("ゲームオーバー", GAME_OVER_BOX_WIDTH),
    "",
    centerBoxText("コインがなくなりました", GAME_OVER_BOX_WIDTH),
    "",
  ];

  output.write(`\n╔${SEP}╗\n`);
  for (const row of boxRows) {
    output.write(`${formatBoxRow(row, GAME_OVER_BOX_WIDTH)}\n`);
  }
  output.write(`╚${SEP}╝\n\n`);
  output.write(`プレイ回数: ${stats.gamesPlayed}\n`);
  output.write(`勝利回数: ${stats.gamesWon}\n`);
  output.write(
    `最高役: ${stats.bestHand ? localizeHandName(stats.bestHand.name) : "N/A"}\n`,
  );
  output.write(`最大ダブルアップ: ${stats.maxDoubleUps}\n\n`);
  output.write("歴代記録:\n");
  output.write(`  最高コイン: ${updatedHighScores.maxCredits}\n`);
  output.write(
    `  最高役: ${localizeHandName(updatedHighScores.bestHandName)}\n`,
  );
  output.write(`  最大ダブルアップ: ${updatedHighScores.maxDoubleUps}\n\n`);

  const answer = await rl.question("100コインで続ける？ (y/n): ");
  if (answer.trim().toLowerCase() === "y") {
    return { doContinue: true, credits: 100 };
  }
  return { doContinue: false };
}

async function getBet(rl, maxBet, lastBet) {
  let bet = 0;

  while (bet < 1 || bet > maxBet) {
    const answer = await rl.question(
      `ベット (1-${maxBet}) [${lastBet}] (pで配当表表示、aで実績一覧): `,
    );

    if (answer.trim().toLowerCase() === "q") return null;
    if (answer.trim().toLowerCase() === "p") {
      showPayTable();
      continue;
    }
    if (answer.trim().toLowerCase() === "a") {
      showAchievements();
      continue;
    }

    const trimmed = answer.trim();

    if (trimmed === "") {
      bet = lastBet;
    } else if (/^\d+$/.test(trimmed)) {
      bet = parseInt(trimmed, 10);
    } else {
      output.write("整数で入力してね。\n");
      bet = 0;
      continue;
    }

    if (bet < 1 || bet > maxBet) {
      output.write(`1から${maxBet}の数字を入力してね。\n`);
      bet = 0;
    }
  }

  return { bet };
}

async function playDoubleUpLoop(rl, initialPayout) {
  let payout = initialPayout;
  let doubleUps = 0;

  emit("doubleup:start", { currentPayout: payout });

  while (doubleUps < 5) {
    const answer = await rl.question(
      "ダブルアップする？ [Enter=はい n=やめる]: ",
    );

    if (answer.trim().toLowerCase() === "n") break;

    const doubleUpDeck = shuffleDeck(createDeck());
    const { dealerCard, playerCards } = drawDoubleUpCards(doubleUpDeck);
    const cardIndex = await selectDoubleUpCard(dealerCard, playerCards);

    if (cardIndex === null) {
      output.write("\x1b[2J\x1b[Hダブルアップ中止。\n");
      break;
    }

    const playerCard = playerCards[cardIndex];

    output.write(`\n${renderTwoCards(dealerCard, playerCard)}\n\n`);

    const dealerStr = formatCard(dealerCard);
    const playerStr = formatCard(playerCard);

    const result = playDoubleUp(dealerCard, playerCard);

    if (result === "win") {
      payout *= 2;
      doubleUps += 1;
      emit("doubleup:win", { newPayout: payout });
      output.write(
        `ディーラー ${dealerStr}  VS  あなた ${playerStr} → 勝ち！配当: ${payout}\n`,
      );
    } else if (result === "push") {
      emit("doubleup:push", {});
      output.write(
        `ディーラー ${dealerStr}  VS  あなた ${playerStr} → 引き分け！配当維持。もう1回！\n`,
      );
    } else {
      payout = 0;
      emit("doubleup:lose", {});
      output.write(
        `ディーラー ${dealerStr}  VS  あなた ${playerStr} → 負け！配当はなくなった…\n`,
      );
      break;
    }
  }

  return { payout, doubleUps };
}

function endSession(rl, state, highScores) {
  const {
    credits,
    gamesPlayed,
    gamesWon,
    totalBet,
    totalPayout,
    maxCreditReached,
    bestHand,
    maxDoubleUps,
  } = state;

  const sessionStats = {
    maxCreditReached,
    bestHandRank: bestHand ? bestHand.rank : 0,
    bestHandName: bestHand ? bestHand.name : "N/A",
    maxDoubleUps,
    gamesPlayed,
    gamesWon,
    totalBet,
    totalPayout,
  };
  const updatedHighScores = mergeSessionResults(highScores, sessionStats);
  emit("session:end", sessionStats);
  const achievementState = getAchievementState();
  try {
    saveHighScores(updatedHighScores);
    saveCredits(credits);
  } catch (err) {
    output.write(`保存に失敗しました: ${err.message}\n`);
  }
  try {
    saveAchievements(achievementState);
  } catch (err) {
    output.write(`実績の保存に失敗しました: ${err.message}\n`);
  }

  output.write("\n=== ゲーム終了 ===\n");
  output.write(`プレイ回数: ${gamesPlayed}\n`);
  output.write(`勝利回数: ${gamesWon}\n`);
  output.write(`総ベット: ${totalBet}\n`);
  output.write(`総配当: ${totalPayout}\n`);

  const netProfit = totalPayout - totalBet;
  output.write(`収支: ${netProfit >= 0 ? "+" : ""}${netProfit}\n`);
  output.write(
    `最高役: ${bestHand ? localizeHandName(bestHand.name) : "N/A"}\n`,
  );
  output.write(`最大ダブルアップ: ${maxDoubleUps}\n`);
  output.write(`最終コイン: ${credits}\n`);

  const sessionPeak = {
    maxCreditReached,
    bestHandRank: bestHand ? bestHand.rank : 0,
    maxDoubleUps,
  };
  const newRecords = detectNewRecords(highScores, sessionPeak);

  if (newRecords.length > 0) {
    output.write(`\n*** 新記録！${newRecords.join("、")} ***\n`);
  }

  output.write(`\n累計:\n`);
  output.write(`  通算プレイ回数: ${updatedHighScores.totalGamesPlayed}\n`);
  output.write(`  通算勝利回数: ${updatedHighScores.totalGamesWon}\n`);
  const totalNet = updatedHighScores.totalPayout - updatedHighScores.totalBet;
  output.write(`  通算収支: ${totalNet >= 0 ? "+" : ""}${totalNet}\n`);

  output.write(`\n歴代記録:\n`);
  output.write(`  最高コイン: ${updatedHighScores.maxCredits}\n`);
  output.write(
    `  最高役: ${localizeHandName(updatedHighScores.bestHandName)}\n`,
  );
  output.write(`  最大ダブルアップ: ${updatedHighScores.maxDoubleUps}\n`);
  rl.close();
}

function selectExchangeCards(hand) {
  return new Promise((resolve) => {
    const exchangeIndexes = new Set();
    let selectedIndex = 0;
    const wasRaw = input.isRaw;
    const initialEval = evaluateHand(hand);

    const render = () => {
      output.write("\x1b[2J\x1b[H");
      output.write("ドローポーカー\n");
      output.write(
        "←/→選択  1-5切替  Space切替  a全部交換  k全部キープ  Enter決定  q終了\n\n",
      );
      output.write(
        `${formatVisualHand(hand, selectedIndex, exchangeIndexes)}\n`,
      );
      output.write(`現在の役: ${localizeHandName(initialEval.name)}\n`);
    };

    const cleanup = () => {
      input.off("keypress", onKeypress);
      input.setRawMode(wasRaw);
    };

    const finish = (selection) => {
      cleanup();
      resolve(selection);
    };

    const onKeypress = (_text, key) => {
      if (key.name === "left") {
        selectedIndex = (selectedIndex + hand.length - 1) % hand.length;
        render();
        return;
      }

      if (key.name === "right") {
        selectedIndex = (selectedIndex + 1) % hand.length;
        render();
        return;
      }

      if (key.name === "space") {
        if (exchangeIndexes.has(selectedIndex)) {
          exchangeIndexes.delete(selectedIndex);
        } else {
          exchangeIndexes.add(selectedIndex);
        }

        render();
        return;
      }

      if (key.name === "a") {
        for (let index = 0; index < hand.length; index += 1) {
          exchangeIndexes.add(index);
        }

        render();
        return;
      }
      if (key.name === "k") {
        exchangeIndexes.clear();
        render();
        return;
      }
      if (key.name === "return") {
        finish(exchangeIndexes);
        return;
      }

      if (["1", "2", "3", "4", "5"].includes(key.name)) {
        const index = parseInt(key.name, 10) - 1;
        if (exchangeIndexes.has(index)) {
          exchangeIndexes.delete(index);
        } else {
          exchangeIndexes.add(index);
        }
        selectedIndex = index;
        render();
        return;
      }

      if (key.name === "q" || (key.ctrl && key.name === "c")) {
        finish(null);
      }
    };

    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKeypress);
    render();
  });
}

function selectDoubleUpCard(dealerCard, playerCards) {
  return new Promise((resolve) => {
    let selectedIndex = 0;
    const wasRaw = input.isRaw;

    const render = () => {
      output.write("\x1b[2J\x1b[H");
      output.write("ダブルアップ\n\n");
      output.write("ディーラー:\n");
      output.write(`${formatCardLines(dealerCard).join("\n")}\n\n`);
      output.write("←/→選択  1-4で直接選択  Enter決定  q終了\n\n");
      const cursorLine = playerCards
        .map((_, i) => (i === selectedIndex ? "   v   " : "       "))
        .join(" ");
      output.write(`${cursorLine}\n`);
      output.write(`${renderCardsRow(playerCards, [0, 1, 2, 3])}\n`);
      output.write(`${renderCardLabels(4)}\n`);
    };

    const cleanup = () => {
      input.off("keypress", onKeypress);
      input.setRawMode(wasRaw);
    };

    const finish = (selection) => {
      cleanup();
      resolve(selection);
    };

    const onKeypress = (_text, key) => {
      if (key.name === "left") {
        selectedIndex = (selectedIndex + 3) % 4;
        render();
        return;
      }

      if (key.name === "right") {
        selectedIndex = (selectedIndex + 1) % 4;
        render();
        return;
      }

      if (key.name === "return") {
        finish(selectedIndex);
        return;
      }

      if (["1", "2", "3", "4"].includes(key.name)) {
        finish(parseInt(key.name, 10) - 1);
        return;
      }

      if (key.name === "q" || (key.ctrl && key.name === "c")) {
        finish(null);
      }
    };

    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKeypress);
    render();
  });
}

export function showPayTable() {
  output.write(buildPayTableText());
}

export function showAchievements() {
  const progress = getAchievementProgress();
  const categories = getCategoryProgress();
  const total = getTotalUnlocked();
  output.write(buildAchievementsText(progress, categories, total));
}

// Re-export pure view helpers for test compatibility (tests import from cli.js)
export {
  displayWidth,
  formatBoxRow,
  centerBoxText,
  truncateDisplayWidth,
  progressBar,
  localizeHandName,
  formatCard,
  renderCardFaceDown,
  renderCardsRow,
  renderTwoCards,
  renderCardLabels,
  buildHelpText,
  buildStatsOutput,
};

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
