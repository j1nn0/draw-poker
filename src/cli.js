#!/usr/bin/env node
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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
  shuffleDeck,
} from "./game.js";
import { loadCredits, saveCredits, loadHighScores, saveHighScores } from "./persistence.js";
import { updateHighScores } from "./scoring.js";

async function main() {
  const rl = createInterface({ input, output });

  let playing = true;
  let credits = loadCredits();
  let gamesPlayed = 0;
  let gamesWon = 0;
  let totalBet = 0;
  let totalPayout = 0;
  let maxCreditReached = credits;
  let bestHand = null;
  let maxDoubleUps = 0;
  let lastBet = 1;
  const highScores = loadHighScores();

  try {
    showPayTable();

    while (playing) {
      if (credits <= 0) {
        output.write("\n╔══════════════════════════════════════╗\n");
        output.write("║                                      ║\n");
        output.write("║        ゲームオーバー                ║\n");
        output.write("║                                      ║\n");
        output.write("║    コインがなくなりました             ║\n");
        output.write("║                                      ║\n");
        output.write("╚══════════════════════════════════════╝\n\n");
        output.write(`プレイ回数: ${gamesPlayed}\n`);
        output.write(`勝利回数: ${gamesWon}\n`);
        output.write(`最高役: ${bestHand ? localizeHandName(bestHand.name) : "N/A"}\n`);
        output.write(`最大ダブルアップ: ${maxDoubleUps}\n\n`);
        output.write(`歴代記録:\n`);
        output.write(`  最高コイン: ${highScores.maxCredits}\n`);
        output.write(`  最高役: ${localizeHandName(highScores.bestHandName)}\n`);
        output.write(`  最大ダブルアップ: ${highScores.maxDoubleUps}\n\n`);

        const answer = await rl.question("100コインで続ける？ (y/n): ");

        if (answer.trim().toLowerCase() === "y") {
          credits = 100;
          continue;
        }

        break;
      }

      const maxBet = Math.min(10, credits);
      output.write(`コイン: ${credits}\n`);
      if (lastBet > maxBet) lastBet = maxBet;
      let bet = 0;

      while (bet < 1 || bet > maxBet) {
        const answer = await rl.question(`ベット (1-${maxBet}) [${lastBet}]: `);

        if (answer.trim().toLowerCase() === "q") {
          playing = false;
          break;
        }

        bet = answer.trim() === "" ? lastBet : parseInt(answer.trim(), 10);

        if (Number.isNaN(bet) || bet < 1 || bet > maxBet) {
          output.write(`1から${maxBet}の数字を入力してね。\n`);
          bet = 0;
        }
      }
      lastBet = bet;

      if (!playing) {
        output.write("またね！\n");
        break;
      }

      credits -= bet;
      totalBet += bet;
      maxCreditReached = Math.max(maxCreditReached, credits);

      const shuffled = shuffleDeck(createDeck());
      const initialDeal = dealHand(shuffled);

      const exchangeIndexes = await selectExchangeCards(initialDeal.hand);

      if (exchangeIndexes === null) {
        credits += bet;
        totalBet -= bet;
        output.write("またね！\n");
        break;
      }

      const heldIndexes = indexesNotSelected(initialDeal.hand, exchangeIndexes);
      const finalDeal = drawCards(initialDeal.hand, initialDeal.deck, heldIndexes);
      const result = evaluateHand(finalDeal.hand);
      output.write(`\n最終:\n${formatVisualHand(finalDeal.hand)}\n`);
      output.write(`役: ${localizeHandName(result.name)}\n\n`);

      let payout = calculatePayout(result.name, bet);
      let currentDoubleUps = 0;

      if (payout > 0) {
        while (currentDoubleUps < 5) {
          const wantDoubleUp = await rl.question("ダブルアップする？ [Enter=はい n=やめる]: ");

          if (wantDoubleUp.trim().toLowerCase() === "n") {
            break;
          }

          const doubleUpDeck = shuffleDeck(createDeck());
          const { dealerCard, playerCards } = drawDoubleUpCards(doubleUpDeck);

          const cardIndex = await selectDoubleUpCard(dealerCard, playerCards);

          if (cardIndex === null) {
            break;
          }

          const playerCard = playerCards[cardIndex];

          output.write(`\n${renderTwoCards(dealerCard, playerCard)}\n\n`);

          const dealerStr = formatCard(dealerCard);
          const playerStr = formatCard(playerCard);

          if (playDoubleUp(dealerCard, playerCard)) {
            payout *= 2;
            currentDoubleUps += 1;
            output.write(`ディーラー ${dealerStr}  VS  あなた ${playerStr} → 勝ち！配当: ${payout}\n`);
          } else {
            payout = 0;
            output.write(`ディーラー ${dealerStr}  VS  あなた ${playerStr} → 負け！配当はなくなった…\n`);
            break;
          }
        }

        maxDoubleUps = Math.max(maxDoubleUps, currentDoubleUps);
      }

      credits += payout;
      totalPayout += payout;
      maxCreditReached = Math.max(maxCreditReached, credits);
      saveCredits(credits);
      output.write(`配当: ${payout} / コイン: ${credits}\n`);
      gamesPlayed += 1;

      if (payout > 0) gamesWon += 1;

      if (!bestHand || result.rank > bestHand.rank) bestHand = result;

      if (payout > 0) {
        const next = await rl.question("Enterで続ける、qで終了: ");
        playing = next.trim().toLowerCase() !== "q";
      }
      output.write("\n");
    }
  } finally {
    const sessionStats = {
      currentCredits: credits,
      bestHandRank: bestHand ? bestHand.rank : 0,
      bestHandName: bestHand ? bestHand.name : "N/A",
      maxDoubleUps,
    };
    const updatedHighScores = updateHighScores(highScores, sessionStats);
    saveHighScores(updatedHighScores);
    saveCredits(credits);

    output.write("\n=== ゲーム終了 ===\n");
    output.write(`プレイ回数: ${gamesPlayed}\n`);
    output.write(`勝利回数: ${gamesWon}\n`);
    output.write(`総ベット: ${totalBet}\n`);
    output.write(`総配当: ${totalPayout}\n`);
    const netProfit = totalPayout - totalBet;
    output.write(`収支: ${netProfit >= 0 ? "+" : ""}${netProfit}\n`);
    output.write(`最高役: ${bestHand ? localizeHandName(bestHand.name) : "N/A"}\n`);
    output.write(`最大ダブルアップ: ${maxDoubleUps}\n`);
    output.write(`最終コイン: ${credits}\n`);

    const newRecords = [];

    if (updatedHighScores.maxCredits === maxCreditReached && maxCreditReached > highScores.maxCredits) {
      newRecords.push("最高コイン");
    }

    if (updatedHighScores.bestHandRank === (bestHand ? bestHand.rank : 0) && (bestHand ? bestHand.rank : 0) > highScores.bestHandRank) {
      newRecords.push("最高役");
    }

    if (updatedHighScores.maxDoubleUps === maxDoubleUps && maxDoubleUps > highScores.maxDoubleUps) {
      newRecords.push("最大ダブルアップ");
    }

    if (newRecords.length > 0) {
      output.write(`\n*** 新記録！${newRecords.join("、")} ***\n`);
    }

    output.write(`\n歴代記録:\n`);
    output.write(`  最高コイン: ${updatedHighScores.maxCredits}\n`);
    output.write(`  最高役: ${localizeHandName(updatedHighScores.bestHandName)}\n`);
    output.write(`  最大ダブルアップ: ${updatedHighScores.maxDoubleUps}\n`);
    rl.close();
  }
}

function selectExchangeCards(hand) {
  return new Promise((resolve) => {
    const exchangeIndexes = new Set();
    let selectedIndex = 0;
    const wasRaw = input.isRaw;

    const render = () => {
      output.write("\x1b[2J\x1b[H");
      output.write("ドローポーカー\n");
      output.write("←/→選択  Space切替  a全部交換  k全部キープ  Enter決定  q終了\n\n");
      output.write(`${formatVisualHand(hand, selectedIndex, exchangeIndexes)}\n`);
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
      output.write("←/→で選択  Enterで決定  qでやめる\n\n");
      const cursorLine = playerCards.map((_, i) =>
        i === selectedIndex ? "   v   " : "       ",
      ).join(" ");
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

function indexesNotSelected(hand, selectedIndexes) {
  const indexes = new Set();

  for (let index = 0; index < hand.length; index += 1) {
    if (!selectedIndexes.has(index)) {
      indexes.add(index);
    }
  }

  return indexes;
}

function localizeHandName(name) {
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

function showPayTable() {
  output.write("\n╔══════════════════════════════════════════════╗\n");
  output.write("║                  ペイテーブル                 ║\n");
  output.write("╠══════════════════════════════════════════════╣\n");
  output.write("║ 役                           1×     5×   10×║\n");
  output.write("╠══════════════════════════════════════════════╣\n");
  output.write("║ ロイヤルストレートフラッシュ   500   2500  8000║\n");
  output.write("║ ストレートフラッシュ           100    500  1000║\n");
  output.write("║ フォーカード                    50    250   500║\n");
  output.write("║ フルハウス                      10     50   100║\n");
  output.write("║ フラッシュ                       7     35    70║\n");
  output.write("║ ストレート                       5     25    50║\n");
  output.write("║ スリーカード                      3     15    30║\n");
  output.write("║ ツーペア                         2     10    20║\n");
  output.write("║ ワンペア                         1      5    10║\n");
  output.write("╚══════════════════════════════════════════════╝\n\n");
}

function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

function renderCardFaceDown() {
  return ["+-----+", "|?????|", "|  ?  |", "|?????|", "+-----+"];
}

function renderCardsRow(cards, faceDownIndexes) {
  const faceDownSet = new Set(faceDownIndexes);
  const allLines = cards.map((card, i) =>
    faceDownSet.has(i) ? renderCardFaceDown() : formatCardLines(card),
  );
  return [0, 1, 2, 3, 4].map((lineIdx) =>
    allLines.map((cardLines) => cardLines[lineIdx]).join(" "),
  ).join("\n");
}

function renderTwoCards(card1, card2) {
  const lines1 = formatCardLines(card1);
  const lines2 = formatCardLines(card2);
  return lines1.map((line, i) => `${line}  ${lines2[i]}`).join("\n");
}

function renderCardLabels(count) {
  return Array.from({ length: count }, (_, i) =>
    `${i + 1}`.padStart(3).padEnd(7),
  ).join(" ");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
