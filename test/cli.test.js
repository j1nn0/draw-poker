import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

function runCli(input) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["./src/cli.js"], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

test("immediate quit: q exits 0 and shows Draw Poker, Enter card numbers, and Goodbye.", async () => {
  const { code, stdout } = await runCli("q\n");

  assert.equal(code, 0);
  assert.match(stdout, /Draw Poker/);
  assert.match(stdout, /Enter card numbers to hold, or q to quit\./);
  assert.match(stdout, /Goodbye\./);
});

test("one-hand play: 1 2 exits 0 and shows Hand:, Final:, and Result:", async () => {
  const { code, stdout } = await runCli("1 2\n");

  assert.equal(code, 0);
  assert.match(stdout, /Hand:/);
  assert.match(stdout, /Final:/);
  assert.match(stdout, /Result:/);
});

test("invalid input: x exits 0 and shows hold error message.", async () => {
  const { code, stdout } = await runCli("x\n");

  assert.equal(code, 0);
  assert.match(stdout, /Hold choices must be card numbers from 1 to 5\./);
});
