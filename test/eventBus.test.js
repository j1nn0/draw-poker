import assert from "node:assert/strict";
import test from "node:test";
import { on, off, emit } from "../src/eventBus.js";

test("emit to event with no listeners does not throw", () => {
  emit("non-existent", { data: 1 });
});

test("on + emit calls listener with data", () => {
  const calls = [];
  on("test:1", (data) => calls.push(data));
  emit("test:1", { x: 1 });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { x: 1 });
});

test("off removes listener", () => {
  const calls = [];
  const fn = (data) => calls.push(data);
  on("test:2", fn);
  emit("test:2", { a: 1 });
  off("test:2", fn);
  emit("test:2", { a: 2 });
  assert.equal(calls.length, 1); // only first emit fired
});

test("off on non-existent event does not throw", () => {
  off("ghost", () => {});
});

test("off removes only the specified listener", () => {
  const callsA = [];
  const callsB = [];
  const fnA = () => callsA.push("A");
  const fnB = () => callsB.push("B");
  on("test:3", fnA);
  on("test:3", fnB);
  off("test:3", fnA);
  emit("test:3", {});
  assert.deepEqual(callsA, []);
  assert.deepEqual(callsB, ["B"]);
});

test("emit with no matching event is no-op", () => {
  emit("no-such-event", { value: 42 });
});

test("multiple on calls add multiple listeners", () => {
  const results = [];
  on("test:multi", (d) => results.push(`a${d}`));
  on("test:multi", (d) => results.push(`b${d}`));
  emit("test:multi", 1);
  assert.deepEqual(results, ["a1", "b1"]);
});
