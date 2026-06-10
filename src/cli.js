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
  formatHand,
  formatVisualHand,
  parseHoldInput,
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
  let bestHand = null;
  let maxDoubleUps = 0;
  const highScores = loadHighScores();

  try {

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

        const reset = input.isTTY
          ? await rl.question("Continue with 100 credits? (y/n): ")
          : "n";

        if (reset.trim().toLowerCase() === "y") {
          credits = 100;
          gamesPlayed = 0;
          gamesWon = 0;
          bestHand = null;
          maxDoubleUps = 0;
          continue;
        }

        break;
      }

      output.write(`Credit: ${credits}\n`);
      credits -= 1;
      const shuffled = shuffleDeck(createDeck());
      const initialDeal = dealHand(shuffled);

      let result;

      if (input.isTTY) {
        const exchangeIndexes = await selectExchangeCards(initialDeal.hand);

        if (exchangeIndexes === null) {
          output.write("Goodbye.\n");
          break;
        }

        const heldIndexes = indexesNotSelected(initialDeal.hand, exchangeIndexes);
        const finalDeal = drawCards(initialDeal.hand, initialDeal.deck, heldIndexes);
        result = evaluateHand(finalDeal.hand);
        output.write(`\nFinal:\n${formatVisualHand(finalDeal.hand)}\n`);
        output.write(`Result: ${result.name}\n\n`);
      } else {
        output.write(`Hand: ${formatHand(initialDeal.hand)}\n`);

        const answer = await rl.question("Hold cards (1-5, separated by spaces): ");

        if (answer.trim().toLowerCase() === "q") {
          output.write("Goodbye.\n");
          break;
        }

        try {
          const heldIndexes = parseHoldInput(answer);
          const finalDeal = drawCards(initialDeal.hand, initialDeal.deck, heldIndexes);
          result = evaluateHand(finalDeal.hand);
          output.write(`Final: ${formatHand(finalDeal.hand)}\n`);
          output.write(`Result: ${result.name}\n\n`);
        } catch (error) {
          output.write(`${error.message}\n\n`);
        }
      }
      if (result) {
        let payout = calculatePayout(result.name);
        let currentDoubleUps = 0;

        if (payout > 0) {
          while (currentDoubleUps < 5) {
            const wantDoubleUp = input.isTTY
              ? await rl.question("Double up? (y/n): ")
              : await rl.question("Double up? (y/n): ");

            if (wantDoubleUp.trim().toLowerCase() !== "y") {
              break;
            }

            const doubleUpDeck = shuffleDeck(createDeck());
            const { dealerCard, playerCards } = drawDoubleUpCards(doubleUpDeck);

            output.write(`Dealer: ${formatCard(dealerCard)}\n`);
            output.write(`1: [?]  2: [?]  3: [?]  4: [?]\n`);

            const choice = input.isTTY
              ? await rl.question("Pick a card (1-4): ")
              : await rl.question("Pick a card (1-4): ");

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
        output.write(`Win: ${payout} / Credit: ${credits}\n`);
        gamesPlayed += 1;
        if (payout > 0) gamesWon += 1;
        if (!bestHand || result.rank > bestHand.rank) bestHand = result;
      }

      if (!input.isTTY) {
        playing = false;
        continue;
      }

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
    output.write(`Best hand: ${bestHand ? bestHand.name : "N/A"}\n`);
    output.write(`Max double-ups: ${maxDoubleUps}\n`);
    output.write(`Final credit: ${credits}\n`);

    const newRecords = [];
    if (updatedHighScores.maxCredits === credits && credits > highScores.maxCredits) {
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

function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
