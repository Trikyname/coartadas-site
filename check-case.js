#!/usr/bin/env node
/* check-case.js — proves the case in caso.js before it goes on the page. Run: node check-case.js
   It reads the same data and the same rule checks the page uses, tries every possible night and
   fails (exit code 1) unless all of this holds:
     1. Exactly one night fits the house, the crime and the clues.
     2. Every clue is needed: without any one of them, more than one night fits.
     3. The night is reached without guessing: reasoning from one rule or one clue at a time, with
        no trial and error, removes every room but the right one from every hour.
     4. No clue names the crime scene: none places anyone in the crime room at the crime hour, and
        none, with the rules of the house alone, forces any one person to be there (the game's
        filter: AGENTS.md, decision 4).
     5. The house is drawn as the data says: doors join distinct rooms and none is repeated. */
'use strict';

const { CASE, adjacent, clueHolds, atScene, walks, holds } = require('./caso.js');

const S = CASE.suspects.length, H = CASE.hours.length, R = CASE.rooms.length;
const { room: CR, hour: CH } = CASE.crime;
let failed = 0;
function check(ok, what) {
  console.log((ok ? 'ok   ' : 'FAIL ') + what);
  if (!ok) failed++;
}
const roomName = r => CASE.rooms[r].en;
const who = s => CASE.suspects[s].name;

// Every walk one suspect could take through the night, by the house alone.
function rowsOf(n) {
  if (n === 0) return [[]];
  const out = [];
  for (const head of rowsOf(n - 1)) for (let r = 0; r < R; r++) out.push(head.concat(r));
  return out;
}
const allRows = rowsOf(H);
const walkRows = allRows.filter(walks);

// Every night: one walk per suspect.
function nights(rows, n) {
  if (n === 0) return [[]];
  const out = [];
  for (const rest of nights(rows, n - 1)) for (const row of rows) out.push(rest.concat([row]));
  return out;
}
const everyNight = nights(walkRows, S);
const houseNights = everyNight.filter(b => atScene(b).length === 1);
console.log(`${walkRows.length} walks per suspect, ${everyNight.length} nights by the house, ${houseNights.length} with exactly one person at the scene\n`);

// 5. The house.
const seen = new Set();
let doorsOk = true;
for (const [a, b] of CASE.doors) {
  const key = Math.min(a, b) + '-' + Math.max(a, b);
  if (a === b || a < 0 || b < 0 || a >= R || b >= R || seen.has(key)) doorsOk = false;
  seen.add(key);
}
check(doorsOk, 'doors join two distinct rooms and none is repeated');
check(!CASE.stay, 'the case says nobody stays put (stay: false), and walks() enforces it');

// 1. One night.
const fits = houseNights.filter(holds);
check(fits.length === 1, `exactly one night fits the house, the crime and the clues (found ${fits.length})`);
const truth = fits[0];
if (truth) {
  console.log('\nThe night:');
  for (let s = 0; s < S; s++) console.log(`  ${who(s).padEnd(6)} ${truth[s].map((r, h) => CASE.hours[h] + 'h ' + roomName(r)).join(' → ')}`);
  console.log(`  At the scene (${roomName(CR)}, ${CASE.hours[CH]}h): ${atScene(truth).map(who).join(', ')}\n`);
}

// 2. Every clue is needed.
CASE.clues.forEach((c, i) => {
  const others = CASE.clues.filter((_, j) => j !== i);
  const n = houseNights.filter(b => others.every(o => clueHolds(o, b))).length;
  check(n > 1, `clue ${i + 1} (${c.kind}) is needed: without it ${n} nights fit`);
});

// 4. No clue names the scene.
CASE.clues.forEach((c, i) => {
  check(!(c.kind === 'at' && c.hour === CH && c.room === CR), `clue ${i + 1} does not place anyone in the crime room at the crime hour`);
  const withIt = houseNights.filter(b => clueHolds(c, b));
  const forced = [];
  for (let s = 0; s < S; s++) if (withIt.length && withIt.every(b => b[s][CH] === CR)) forced.push(who(s));
  check(forced.length === 0, `clue ${i + 1}, with the rules of the house alone, puts nobody at the scene` + (forced.length ? ` (it puts ${forced.join(', ')})` : ''));
});

// 3. No guessing. Each constraint (one walk, the scene, one clue) removes the rooms it alone rules
// out given what is still possible; repeat until nothing changes. If that ends with one room per
// cell, the night is reached by reasoning, one step at a time, without trying a room to see.
function propagate() {
  const D = [];
  for (let s = 0; s < S; s++) { D.push([]); for (let h = 0; h < H; h++) D[s].push(new Set(Array.from({ length: R }, (_, r) => r))); }
  const constraints = [];
  for (let s = 0; s < S; s++) constraints.push({ name: `walk of ${who(s)}`, cells: Array.from({ length: H }, (_, h) => [s, h]), ok: b => walks(b[s]) });
  constraints.push({ name: 'one person at the scene', cells: Array.from({ length: S }, (_, s) => [s, CH]), ok: b => atScene(b).length === 1 });
  CASE.clues.forEach((c, i) => {
    const people = c.kind === 'at' ? [c.who] : c.kind === 'before' ? [c.first, c.second] : [c.a, c.b];
    const cells = [];
    for (const s of people) for (let h = 0; h < H; h++) cells.push([s, h]);
    constraints.push({ name: `clue ${i + 1}`, cells, ok: b => clueHolds(c, b) });
  });
  let steps = 0, changed = true;
  while (changed) {
    changed = false;
    for (const k of constraints) {
      const support = k.cells.map(() => new Set());
      const b = Array.from({ length: S }, () => Array(H).fill(-1));
      (function walk(i) {
        if (i === k.cells.length) {
          if (k.ok(b)) k.cells.forEach(([s, h], j) => support[j].add(b[s][h]));
          return;
        }
        const [s, h] = k.cells[i];
        for (const r of D[s][h]) { b[s][h] = r; walk(i + 1); }
        b[s][h] = -1;
      })(0);
      k.cells.forEach(([s, h], j) => {
        for (const r of [...D[s][h]]) if (!support[j].has(r)) { D[s][h].delete(r); changed = true; steps++; }
      });
    }
  }
  return { D, steps };
}
const { D, steps } = propagate();
const solvedByReasoning = D.every((row, s) => row.every((d, h) => d.size === 1 && truth && d.has(truth[s][h])));
check(solvedByReasoning, `the night is reached without guessing (${steps} removals, one rule or clue at a time)`);

// The page's own verdict agrees: the true night holds and a night with one cell changed does not.
if (truth) {
  check(holds(truth), 'holds() accepts the true night');
  let rejectsAll = true;
  for (let s = 0; s < S; s++) for (let h = 0; h < H; h++) for (let r = 0; r < R; r++) {
    if (r === truth[s][h]) continue;
    const b = truth.map(row => row.slice()); b[s][h] = r;
    if (holds(b)) rejectsAll = false;
  }
  check(rejectsAll, 'holds() rejects every night with one cell changed');
}

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
