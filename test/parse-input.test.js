import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseHoldInput } from "../src/game.js";

describe("parseHoldInput", () => {
  it("returns empty Set for empty input", () => {
    assert.deepEqual(parseHoldInput(""), new Set());
  });

  it("parses space-separated card numbers", () => {
    assert.deepEqual(parseHoldInput("1 3 5"), new Set([0, 2, 4]));
  });

  it("parses comma-separated card numbers", () => {
    assert.deepEqual(parseHoldInput("1,2,5"), new Set([0, 1, 4]));
  });

  it("parses mixed whitespace and comma separators", () => {
    assert.deepEqual(parseHoldInput(" 5, 3 1 "), new Set([4, 2, 0]));
  });

  it("deduplicates duplicate card numbers", () => {
    assert.deepEqual(parseHoldInput("1 1 1"), new Set([0]));
  });

  it("rejects 0 as out of range", () => {
    assert.throws(() => parseHoldInput("0"), /Hold choices must be card numbers from 1 to 5/);
  });

  it("rejects 6 as out of range", () => {
    assert.throws(() => parseHoldInput("6"), /Hold choices must be card numbers from 1 to 5/);
  });

  it("rejects non-integer input", () => {
    assert.throws(() => parseHoldInput("1.5"), /Hold choices must be card numbers from 1 to 5/);
  });

  it("rejects non-numeric input", () => {
    assert.throws(() => parseHoldInput("x"), /Hold choices must be card numbers from 1 to 5/);
  });
});
