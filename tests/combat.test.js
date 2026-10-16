import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultProject } from '../src/lib/combat/data.js';
import { damage, simulate, resistanceMultiplier, pyroResonance } from '../src/lib/combat/engine.js';
import { validateProject } from '../src/lib/combat/project.js';
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
test('hand-calculated charged hit and expected CRIT', () => {
  const p = defaultProject();
  Object.assign(p.build, {weaponAtk:277, atkPercent:0, flatAtk:0, critRate:50, critDamage:100, pyroBonus:0});
  // (223+277)*1.24 = 620 ATK; 620*2.108*.5*.9 = 588.132.
  const r = damage(p); close(r.nonCrit, 588.132); close(r.critical,1176.264); close(r.expected,882.198);
});
test('resistance branches including boundaries', () => {
  close(resistanceMultiplier(-20),1.1); close(resistanceMultiplier(0),1); close(resistanceMultiplier(10),.9); close(resistanceMultiplier(75),.25); close(resistanceMultiplier(100),.2);
});
test('defense ignores and reductions multiply; complete reduction removes defense', () => {
  const p = defaultProject(); p.enemy.defenseReduction=50; p.enemy.defenseIgnore=50; close(damage(p).defense,.8); p.enemy.defenseReduction=100; close(damage(p).defense,1);
});
test('expected CRIT caps at 100%; Amber burst gets A1', () => {
  const p=defaultProject(); p.build.critRate=190; close(damage(p).expected,damage(p).critical); p.build.critRate=50; close(damage(p,'burst').critRate,.6);
});
test('Melt/Vaporize applies only to charged attack and uses EM', () => {
  const p=defaultProject(); p.reaction='melt'; p.build.em=1400; close(damage(p).reaction,4.78); close(damage(p,'burst').reaction,1); close(damage(p,'normal').reaction,1); p.reaction='vaporize'; close(damage(p).reaction,3.585);
});
test('Pyro resonance requires four unique occupied slots', () => {
  assert.equal(pyroResonance(['amber','bennett','','']),false); assert.equal(pyroResonance(['amber','bennett','kaeya','lisa']),true); assert.equal(pyroResonance(['amber','bennett','kaeya','kaeya']),false);
});
test('buff start inclusive and expiry exclusive', () => {
  const p=defaultProject(); p.buff={enabled:true,atkPercent:15,start:1,end:2}; assert.equal(damage(p,'charged',0).buffActive,false); assert.equal(damage(p,'charged',1).buffActive,true); assert.equal(damage(p,'charged',2).buffActive,false);
});
test('burst cooldown invalidates immediate duplicate', () => {
  const p=defaultProject(); p.actions=['burst','burst']; const r=simulate(p); assert.equal(r.feasible,false); assert.equal(r.events[1].damage,0); assert.match(r.warnings[0],/Cooldown/); close(r.total,damage(p,'burst').expected);
});
test('energy stays depleted across cycles, no fabricated regeneration', () => {
  const p=defaultProject(); p.actions=['burst',...Array(10).fill('wait')]; p.cycles=2; const r=simulate(p); assert.match(r.warnings[0],/Insufficient energy/); assert.equal(r.energy,0);
});
test('zero energy excludes burst damage; wait-only sequence is finite', () => {
  const p=defaultProject(); p.initialEnergy=0; p.actions=['burst']; close(simulate(p).total,0); p.actions=['wait']; close(simulate(p).dps,0);
});
test('valid roundtrip preserves values but discards unknown properties', () => {
  const p=defaultProject(); p.untrusted='ignored'; const q=validateProject(JSON.parse(JSON.stringify(p))); assert.equal(q.untrusted,undefined); assert.deepEqual(q,defaultProject()); q.build.weaponAtk=1; assert.notEqual(p.build.weaponAtk,q.build.weaponAtk);
});
test('reject invalid imports and unbounded simulation input', () => {
  for (const mutate of [p=>p.build.em=NaN,p=>p.enemy.level=-1,p=>p.cycles=1.5,p=>p.actions=['toString'],p=>p.actions=[],p=>p.actions=Array(101).fill('charged'),p=>p.ruleset='future',p=>p.party=['amber','amber','',''],p=>p.buff.end=0,p=>p.initialEnergy=41,p=>p.build=null]) { const p=defaultProject(); mutate(p); assert.throws(()=>validateProject(p)); }
});
