import { attacks, partyOptions } from './data.js';
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function resistanceMultiplier(resistance) {
  const r = resistance / 100;
  return r < 0 ? 1 - r / 2 : r < 0.75 ? 1 - r : 1 / (4 * r + 1);
}
export function pyroResonance(party) {
  return party.length === 4 && party.every(Boolean) && new Set(party).size === 4 && party.filter(id => partyOptions[id]?.[1] === 'Pyro').length >= 2;
}
export function damage(project, kind = 'charged', time = 0) {
  const { build: b, enemy: e, buff } = project;
  const a = attacks[kind];
  if (!a || kind === 'wait') throw new Error('Select a supported damage action.');
  const buffActive = buff.enabled && time >= buff.start && time < buff.end;
  const baseAtk = 223 + b.weaponAtk;
  const atk = baseAtk * (1 + (24 + b.atkPercent + (pyroResonance(project.party) ? 25 : 0) + (buffActive ? buff.atkPercent : 0)) / 100) + b.flatAtk;
  const bonus = 1 + (a.element === 'Pyro' ? b.pyroBonus : b.physicalBonus) / 100;
  const defense = 190 / (190 + (e.level + 100) * (1 - e.defenseReduction / 100) * (1 - e.defenseIgnore / 100));
  const resistance = resistanceMultiplier(e.resistance);
  // Reactions are explicitly supplied aura assumptions; never amplify every burst wave.
  const reaction = kind === 'charged' && project.reaction !== 'none'
    ? (project.reaction === 'melt' ? 2 : 1.5) * (1 + 2.78 * b.em / (b.em + 1400)) : 1;
  const critRate = clamp((b.critRate + (kind === 'burst' ? 10 : 0)) / 100, 0, 1);
  const nonCrit = atk * a.multiplier * bonus * defense * resistance * reaction;
  return { atk, talent: a.multiplier, bonus, defense, resistance, reaction, critRate, buffActive,
    nonCrit, critical: nonCrit * (1 + b.critDamage / 100), expected: nonCrit * (1 + critRate * b.critDamage / 100) };
}
export function simulate(project) {
  let time = 0, energy = project.initialEnergy, total = 0;
  const ready = {}, events = [], warnings = [];
  for (let cycle = 0; cycle < project.cycles; cycle++) {
    for (const kind of project.actions) {
      const a = attacks[kind];
      const reason = time + 1e-9 < (ready[kind] || 0) ? 'Cooldown unavailable' : energy < a.cost ? 'Insufficient energy' : '';
      const result = kind === 'wait' || reason ? null : damage(project, kind, time);
      if (reason) warnings.push(`Cycle ${cycle + 1}, ${time.toFixed(2)}s: ${a.name} — ${reason}`);
      if (!reason) { energy -= a.cost; ready[kind] = time + a.cooldown; }
      const start = time;
      time += a.duration;
      total += result?.expected || 0;
      events.push({ kind, start, end: time, cycle: cycle + 1, damage: result?.expected || 0, total, energy, reason, buffActive: result?.buffActive || false });
    }
  }
  return { events, total, duration: time, dps: time ? total / time : 0, energy, warnings, feasible: !warnings.length };
}
