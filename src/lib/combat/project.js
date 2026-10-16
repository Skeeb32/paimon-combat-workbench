import { attacks, defaultProject, partyOptions, provenance } from './data.js';
const ranges = {
  build: { weaponAtk: [0, 2000], atkPercent: [0, 1000], flatAtk: [0, 10000], critRate: [0, 200], critDamage: [0, 1000], pyroBonus: [0, 1000], physicalBonus: [0, 1000], em: [0, 10000] },
  enemy: { level: [1, 200], resistance: [-100, 1000], defenseReduction: [0, 100], defenseIgnore: [0, 100] },
  buff: { atkPercent: [0, 1000], start: [0, 10000], end: [0, 10000] },
};
export function validateProject(value) {
  if (!value || value.schemaVersion !== 1 || value.ruleset !== provenance.ruleset) throw new Error('Unsupported schema or ruleset. Import a workbench v1 export.');
  const out = defaultProject();
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 120) throw new Error('Project name must contain 1–120 characters.');
  out.name = value.name;
  for (const [group, fields] of Object.entries(ranges)) {
    for (const [key, [min, max]] of Object.entries(fields)) {
      const n = value[group]?.[key];
      if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw new Error(`${group}.${key} must be between ${min} and ${max}.`);
      out[group][key] = n;
    }
  }
  if (typeof value.buff.enabled !== 'boolean' || value.buff.end <= value.buff.start) throw new Error('Buff end must be after its start; enabled must be boolean.');
  out.buff.enabled = value.buff.enabled;
  if (!Array.isArray(value.party) || value.party.length !== 4 || value.party[0] !== 'amber' || value.party.some(id => id !== '' && !Object.hasOwn(partyOptions, id)) || new Set(value.party.filter(Boolean)).size !== value.party.filter(Boolean).length) throw new Error('Use four slots, Amber first, and no duplicate characters.');
  if (!['none', 'melt', 'vaporize'].includes(value.reaction)) throw new Error('Unsupported reaction.');
  if (!Array.isArray(value.actions) || value.actions.length < 1 || value.actions.length > 100 || value.actions.some(id => !Object.hasOwn(attacks, id))) throw new Error('Use 1–100 supported actions.');
  if (!Number.isInteger(value.cycles) || value.cycles < 1 || value.cycles > 10) throw new Error('Cycles must be between 1 and 10.');
  if (!Number.isFinite(value.initialEnergy) || value.initialEnergy < 0 || value.initialEnergy > 40) throw new Error('Initial energy must be between 0 and 40.');
  return { ...out, party: [...value.party], reaction: value.reaction, actions: [...value.actions], cycles: value.cycles, initialEnergy: value.initialEnergy };
}
export function evaluate(project, calculate, simulate, kind) {
  try { const p = validateProject(project); return { hit: calculate(p, kind), rotation: simulate(p), error: '' }; }
  catch (error) { return { hit: null, rotation: null, error: error.message }; }
}
