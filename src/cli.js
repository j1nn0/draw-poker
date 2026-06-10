#!/usr/bin/env node
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  createDeck,
  dealHand,
  drawCards,
  evaluateHand,
  formatHand,
  formatVisualHand,
  parseHoldInput,
  shuffleDeck,
} from "./game.js";

async function main() {
  const rl = createInterface({ input, output });

  if (!input.isTTY) {
    output.write("Draw Poker\n");
    output.write("Enter card numbers to hold, or q to quit.\n\n");
  }

  try {
    let playing = true;

    while (playing) {
      const shuffled = shuffleDeck(createDeck());
      const initialDeal = dealHand(shuffled);

      if (input.isTTY) {
        const exchangeIndexes = await selectExchangeCards(initialDeal.hand);

        if (exchangeIndexes === null) {
          output.write("Goodbye.\n");
          break;
        }

        const heldIndexes = indexesNotSelected(initialDeal.hand, exchangeIndexes);
        const finalDeal = drawCards(initialDeal.hand, initialDeal.deck, heldIndexes);
        const result = evaluateHand(finalDeal.hand);
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
          const result = evaluateHand(finalDeal.hand);
          output.write(`Final: ${formatHand(finalDeal.hand)}\n`);
          output.write(`Result: ${result.name}\n\n`);
        } catch (error) {
          output.write(`${error.message}\n\n`);
        }
      }

      if (!input.isTTY) {
        playing = false;
        continue;
      }

      const next = await rl.question("Play again? (Y/n): ");
      playing = next.trim().toLowerCase() !== "n";
      output.write("\n");
    }
  } finally {
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

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
