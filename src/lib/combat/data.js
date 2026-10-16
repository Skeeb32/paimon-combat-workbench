export const provenance = {
  schemaVersion: 1, ruleset: 'amber-c0-l90-t9-v1', reviewed: '2026-10-16',
  gameVersion: 'Unpinned; limited legacy mechanics only',
  sources: [
    'https://library.keqingmains.com/combat-mechanics/damage/damage-formula',
    'https://library.keqingmains.com/characters/pyro/amber',
    'https://library.keqingmains.com/combat-mechanics/elemental-effects/elemental-resonance',
  ],
};
export const partyOptions = { amber: ['Amber', 'Pyro'], bennett: ['Bennett', 'Pyro'], kaeya: ['Kaeya', 'Cryo'], lisa: ['Lisa', 'Electro'], barbara: ['Barbara', 'Hydro'] };
// Only the charged shot and N1 timing are frame-derived. Burst timing is an explicit approximation.
export const attacks = {
  charged: { name: 'Fully charged shot', multiplier: 2.108, duration: 1.6, element: 'Pyro', cooldown: 0, cost: 0 },
  normal: { name: 'First normal shot', multiplier: 0.6636, duration: 26 / 60, element: 'Physical', cooldown: 0, cost: 0 },
  burst: { name: 'Fiery Rain (full hit)', multiplier: 8.5925, duration: 3.2, element: 'Pyro', cooldown: 12, cost: 40 },
  wait: { name: 'Wait 1 second', duration: 1, cooldown: 0, cost: 0 },
};
export function defaultProject() {
  return { schemaVersion: 1, ruleset: provenance.ruleset, name: 'Amber · charged-shot study',
    build: { weaponAtk: 400, atkPercent: 50, flatAtk: 311, critRate: 50, critDamage: 100, pyroBonus: 46.6, physicalBonus: 0, em: 0 },
    enemy: { level: 90, resistance: 10, defenseReduction: 0, defenseIgnore: 0 },
    party: ['amber', '', '', ''], reaction: 'none', initialEnergy: 40,
    buff: { enabled: false, atkPercent: 15, start: 0, end: 10 },
    actions: ['charged', 'charged', 'burst', 'charged'], cycles: 1,
  };
}
