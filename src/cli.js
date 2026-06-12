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
  const highScores = loadHighScores();

  try {
    showPayTable();

    while (playing) {
      if (credits <= 0) {
        output.write("\n╔══════════════════════════════════════╗\n");
        output.write("║                                      ║\n");
        output.write("║        G A M E   O V E R             ║\n");
        output.write("║                                      ║\n");
        output.write("║        OUT OF CREDITS                ║\n");
        output.write("║                                      ║\n");
        output.write("╚══════════════════════════════════════╝\n\n");
        output.write(`Games played: ${gamesPlayed}\n`);
        output.write(`Games won: ${gamesWon}\n`);
        output.write(`Best hand: ${bestHand ? bestHand.name : "N/A"}\n`);
        output.write(`Max double-ups: ${maxDoubleUps}\n\n`);
        output.write(`All-time high scores:\n`);
        output.write(`  Highest credit: ${highScores.maxCredits}\n`);
        output.write(`  Best hand: ${highScores.bestHandName}\n`);
        output.write(`  Max double-ups: ${highScores.maxDoubleUps}\n\n`);

        const answer = await rl.question("Continue with 100 credits? (y/n): ");

        if (answer.trim().toLowerCase() === "y") {
          credits = 100;
          continue;
        }

        break;
      }

      const maxBet = Math.min(5, credits);
      output.write(`Credit: ${credits}\n`);
      let bet = 0;

      while (bet < 1 || bet > maxBet) {
        const answer = await rl.question(`Bet (1-${maxBet}): `);

        if (answer.trim().toLowerCase() === "q") {
          playing = false;
          break;
        }

        bet = parseInt(answer.trim(), 10);

        if (Number.isNaN(bet) || bet < 1 || bet > maxBet) {
          output.write(`Enter a number between 1 and ${maxBet}.\n`);
          bet = 0;
        }
      }

      if (!playing) {
        output.write("Goodbye.\n");
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
        output.write("Goodbye.\n");
        break;
      }

      const heldIndexes = indexesNotSelected(initialDeal.hand, exchangeIndexes);
      const finalDeal = drawCards(initialDeal.hand, initialDeal.deck, heldIndexes);
      const result = evaluateHand(finalDeal.hand);
      output.write(`\nFinal:\n${formatVisualHand(finalDeal.hand)}\n`);
      output.write(`Result: ${result.name}\n\n`);

      let payout = calculatePayout(result.name, bet);
      let currentDoubleUps = 0;

      if (payout > 0) {
        while (currentDoubleUps < 5) {
          const wantDoubleUp = await rl.question("Double up? (y/n): ");

          if (wantDoubleUp.trim().toLowerCase() !== "y") {
            break;
          }

          const doubleUpDeck = shuffleDeck(createDeck());
          const { dealerCard, playerCards } = drawDoubleUpCards(doubleUpDeck);

          output.write(`Dealer: ${formatCard(dealerCard)}\n`);
          output.write(`1: [?]  2: [?]  3: [?]  4: [?]\n`);

          const choice = await rl.question("Pick a card (1-4): ");

          const cardIndex = parseInt(choice.trim(), 10) - 1;

          if (cardIndex < 0 || cardIndex > 3 || Number.isNaN(cardIndex)) {
            output.write("Invalid choice. Double up cancelled.\n");
            break;
          }

          const playerCard = playerCards[cardIndex];
          output.write(`Your card: ${formatCard(playerCard)}\n`);

          if (playDoubleUp(dealerCard, playerCard)) {
            payout *= 2;
            currentDoubleUps += 1;
            output.write(`Win! Payout: ${payout}\n`);
          } else {
            payout = 0;
            output.write("Lose! Payout lost.\n");
            break;
          }
        }

        maxDoubleUps = Math.max(maxDoubleUps, currentDoubleUps);
      }

      credits += payout;
      totalPayout += payout;
      maxCreditReached = Math.max(maxCreditReached, credits);
      saveCredits(credits);
      output.write(`Win: ${payout} / Credit: ${credits}\n`);
      gamesPlayed += 1;

      if (payout > 0) gamesWon += 1;

      if (!bestHand || result.rank > bestHand.rank) bestHand = result;

      const next = await rl.question("Press Enter to continue, q to quit: ");
      playing = next.trim().toLowerCase() !== "q";
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

    output.write("\n=== Game Over ===\n");
    output.write(`Games played: ${gamesPlayed}\n`);
    output.write(`Games won: ${gamesWon}\n`);
    output.write(`Total bet: ${totalBet}\n`);
    output.write(`Total payout: ${totalPayout}\n`);
    const netProfit = totalPayout - totalBet;
    output.write(`Net profit: ${netProfit >= 0 ? "+" : ""}${netProfit}\n`);
    output.write(`Best hand: ${bestHand ? bestHand.name : "N/A"}\n`);
    output.write(`Max double-ups: ${maxDoubleUps}\n`);
    output.write(`Final credit: ${credits}\n`);

    const newRecords = [];

    if (updatedHighScores.maxCredits === maxCreditReached && maxCreditReached > highScores.maxCredits) {
      newRecords.push("Highest credit");
    }

    if (updatedHighScores.bestHandRank === (bestHand ? bestHand.rank : 0) && (bestHand ? bestHand.rank : 0) > highScores.bestHandRank) {
      newRecords.push("Best hand");
    }

    if (updatedHighScores.maxDoubleUps === maxDoubleUps && maxDoubleUps > highScores.maxDoubleUps) {
      newRecords.push("Max double-ups");
    }

    if (newRecords.length > 0) {
      output.write(`\n*** NEW RECORD: ${newRecords.join(", ")} ***\n`);
    }

    output.write(`\nHigh scores (all time):\n`);
    output.write(`  Highest credit: ${updatedHighScores.maxCredits}\n`);
    output.write(`  Best hand: ${updatedHighScores.bestHandName}\n`);
    output.write(`  Max double-ups: ${updatedHighScores.maxDoubleUps}\n`);
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
      output.write("Draw Poker\n");
      output.write("←/→ select  Space toggle  a exchange all  Enter draw  q quit\n\n");
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

function indexesNotSelected(hand, selectedIndexes) {
  const indexes = new Set();

  for (let index = 0; index < hand.length; index += 1) {
    if (!selectedIndexes.has(index)) {
      indexes.add(index);
    }
  }

  return indexes;
}

function showPayTable() {
  output.write("\n╔════════════════════════════════════╗\n");
  output.write("║           Pay Table               ║\n");
  output.write("╠════════════════════════════════════╣\n");
  output.write("║ Hand                1×    5×      ║\n");
  output.write("╠════════════════════════════════════╣\n");
  output.write("║ Royal Flush        250   4000     ║\n");
  output.write("║ Straight Flush      50    250     ║\n");
  output.write("║ Four of a Kind      25    125     ║\n");
  output.write("║ Full House           9     45     ║\n");
  output.write("║ Flush                6     30     ║\n");
  output.write("║ Straight             4     20     ║\n");
  output.write("║ Three of a Kind      3     15     ║\n");
  output.write("║ Two Pair             2     10     ║\n");
  output.write("║ Jacks or Better      1      5     ║\n");
  output.write("╚════════════════════════════════════╝\n\n");
}

function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
