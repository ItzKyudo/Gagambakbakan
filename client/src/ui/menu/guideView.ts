import { ALL_ABILITY_IDS, getSpiderAbility, getSpiderInnatePassive } from '../../game/abilities';
import { spiderAbilityIcon } from '../../game/spiderIcons';
import { SPIDERS, spiderSVG } from '../../gb';
import { GagambakbakanScene } from '../../game/GagambakbakanScene';
import { TERRAINS, type TerrainId } from '../../game/terrain';

type SpiderId = (typeof SPIDERS)[number]['id'];
const spiderColors: Record<SpiderId, string> = { weaver: 'azure', hunter: 'jade', guardian: 'ruby', wolf: 'amber', lynx: 'lime' };

function portrait(id: SpiderId, suffix: string): string {
  const spider = SPIDERS.find(item => item.id === id)!;
  return spiderSVG({ name: spider.name, species: id, color: spiderColors[id], pattern: 'stripes', acc: 'none', customPattern: '' }, suffix);
}

const bestUse: Record<(typeof SPIDERS)[number]['id'], readonly string[]> = {
  weaver: [
    'Open a combo by soaking a nearby rival.', 'Cross slippery ground or escape a hazard.',
    'Place it where a rival must cross.', 'Use before incoming damage or to clear burns.',
    'Fire at a soaked rival for extra knockback.', 'Pull a rival away from safe ground.',
    'Retreat from pressure and leave cover behind.', 'Activate after Condensation Snare catches a rival.',
    'Raise it before a melee fighter closes in.', 'Heal when webs or soaked rivals are nearby.',
    'Bite a soaked rival for the knock-up.', 'Land among grouped rivals and leave a trap.',
    'Bind a rival trying to escape.', 'Block shots or slow an approaching rival.',
    'Control a crowded fight around a trap.', 'Fight inside the flooded zone for healing and faster skills.'
  ],
  hunter: [
    'Close a gap and build Tailwind.', 'Jump over a ground strike or prepare Dropkick.',
    'Reach a distant target or drag down an airborne rival.', 'Use before a burst attack or to reveal stealth.',
    'Cut through an enemy web trap from range.', 'Dive while airborne, then bounce to safety.',
    'Sidestep a committed attack and bait the decoy hit.', 'Place where a rival is about to land.',
    'Reflect a shot while gaining Tailwind.', 'Spend built-up Tailwind when you need a shield.',
    'Ambush a marked or airborne rival.', 'Avoid melee pressure and set up an aerial dive.',
    'Use from above when enemies are grouped.', 'Push rivals back while crossing the corridor.',
    'Use on a trapped rival for maximum burst.', 'Keep rivals at the ring edge while chaining jumps.'
  ],
  guardian: [
    'Start Ignite stacks with a fast close strike.', 'Cross a rival and leave a burning trail.',
    'Plant where a rival must approach.', 'Clear a slow before chasing.',
    'Strike an ignited rival to refresh your dash sooner.', 'Pounce after building at least three Ignite stacks.',
    'Blind a nearby rival before repositioning.', 'Trap a rival inside the fire ring.',
    'Use before absorbing close-range attacks.', 'Heal when fire effects or ignited rivals are nearby.',
    'Detonate a rival with several Ignite stacks.', 'Chase a retreating rival while laying fire.',
    'Root a rival to build Ignite safely.', 'Burn enemy webs and turn the arena hazardous.',
    'Finish a low-health rival.', 'Lock rivals in a tight area during a team fight.'
  ],
  wolf: [
    'Shred armor before a stronger follow-up.', 'Avoid projectiles and emerge beneath a rival.',
    'Ground an airborne rival before they escape.', 'Brace against knockback and incoming damage.',
    'Use on a rival whose armor is already shredded.', 'Collapse ground beneath a retreating target.',
    'Stay close to slow and obscure a rival.', 'Catch rivals lined up on the branch.',
    'Use while Shale Armor is active.', 'Hold a position through heavy pressure.',
    'Strike a stationary rival from below.', 'Carry a rival into a wall for the stun.',
    'Trap a mobile rival before they dash or leap.', 'Block a route or projectile lane.',
    'Land on a grouped or stunned rival.', 'Hold the enclosed area behind the stone shield.'
  ],
  lynx: [
    'Poison a rival from outside bite range.', 'Vault into a nature hazard or escape pressure.',
    'Place where a rival must run through.', 'Hide before a surprise attack.',
    'Fire at a large or stationary target to land two needles.', 'Strike, then retreat to ranged distance.',
    'Leave a toxin cloud while escaping.', 'Bind a rival already affected by Toxin.',
    'Raise it before a melee exchange.', 'Heal inside Briar Thicket or while camouflaged.',
    'Seed a target before they regroup with allies.', 'Drop onto a target and refresh your spit.',
    'Disrupt rivals gathered in one area.', 'Block a route and punish anyone near it.',
    'Pull a rival into an existing Briar Thicket.', 'Fight from stealth inside the jungle zone.'
  ]
};

const terrainNotes: Record<TerrainId, { description: string; advantage: SpiderId; advantageReason: string; disadvantage: SpiderId; disadvantageReason: string }> = {
  ember: { description: 'Hot cracks drain grip at three points. A vent bursts every eight seconds, and the center can break open.', advantage: 'guardian', advantageReason: 'Resists heat and strengthens fire attacks near vents.', disadvantage: 'weaver', disadvantageReason: 'Webs fade faster in the heat.' },
  dew: { description: 'A sagging, wet vine soaks spiders at the center and makes fast movement skid.', advantage: 'weaver', advantageReason: 'Keeps its footing and uses the wet center for water skills.', disadvantage: 'guardian', disadvantageReason: 'Soaking removes burn pressure.' },
  termite: { description: 'The hollow middle collapses after a strong impact. Block near a tunnel entrance to move beneath the log.', advantage: 'wolf', advantageReason: 'Gains stronger pulses while tunneling.', disadvantage: 'hunter', disadvantageReason: 'Has less open air space inside the tunnel.' },
  bamboo: { description: 'The stalk tilts and wind changes direction. Upper shoots reward well-timed jumps.', advantage: 'hunter', advantageReason: 'Ignores wind push and gains stronger aerial dives.', disadvantage: 'weaver', disadvantageReason: 'Must fight the changing wind on the stalk.' },
  briar: { description: 'Thorns hang beneath the stem and punish contact. Two rose buds can be triggered in the middle.', advantage: 'lynx', advantageReason: 'Crosses thorns without taking thorn damage.', disadvantage: 'wolf', disadvantageReason: 'Ground charges must avoid thorn zones.' },
  lightning: { description: 'A notch breaks the right side. Lightning marks a strike zone before it hits; wet spiders take extra damage.', advantage: 'hunter', advantageReason: 'Can leap over a marked strike.', disadvantage: 'weaver', disadvantageReason: 'Risks extra damage when soaked near lightning.' },
  frost: { description: 'Icy bark causes slides, while pine needles at both ends bounce spiders back toward the center.', advantage: 'weaver', advantageReason: 'Keeps steadier footing through its glide.', disadvantage: 'wolf', disadvantageReason: 'Charges can skid into the needle zones.' },
  lilypad: { description: 'Narrow seams split the driftwood, but spiders can step onto the central pad. It sinks when both spiders stand on it, slowing movement.', advantage: 'hunter', advantageReason: 'Can jump off the sinking pad quickly.', disadvantage: 'wolf', disadvantageReason: 'Loses speed on the sinking pad.' },
  totem: { description: 'Silk curtains hang beneath the branch and stop projectiles. Jump over them or clear them with a heavy strike.', advantage: 'guardian', advantageReason: 'Ignites the curtains and resists the resulting fire.', disadvantage: 'weaver', disadvantageReason: 'Shots are blocked by the curtains.' }
};

export function renderGuideView(): string {
  return `<div class="page guide-page">
    <header class="page-top">
      <div class="page-actions"><button type="button" class="btn ghost" id="btnBackToMain">Menu</button></div>
      <div class="about-title-group"><h1><span class="a">Field</span> <span class="j">Guide</span></h1><p class="note">Know your spider. Read the arena.</p></div>
    </header>
    <div class="guide-tabs guide-main-tabs" role="tablist" aria-label="Field guide" data-guide-group="section">
      <button type="button" role="tab" id="guide-tab-skills" data-guide-value="skills" aria-controls="guide-panel-skills" aria-selected="true" tabindex="0">Spider skills <span>80 skills</span></button>
      <button type="button" role="tab" id="guide-tab-terrain" data-guide-value="terrain" aria-controls="guide-panel-terrain" aria-selected="false" tabindex="-1">Terrain <span>9 arenas</span></button>
    </div>
    <section id="guide-panel-skills" role="tabpanel" aria-labelledby="guide-tab-skills" data-guide-panel="section" data-guide-value="skills">
      <div class="guide-tabs guide-spider-tabs" role="tablist" aria-label="Choose spider" data-guide-group="spider">
        ${SPIDERS.map((spider, index) => `<button type="button" role="tab" id="guide-tab-${spider.id}" data-guide-value="${spider.id}" aria-controls="guide-panel-${spider.id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}"><span class="guide-tab-portrait">${portrait(spider.id, `-guide-tab-${spider.id}`)}</span>${spider.name}</button>`).join('')}
      </div>
      ${SPIDERS.map((spider, spiderIndex) => {
        const innate = getSpiderInnatePassive(spider.id);
        return `<section class="guide-spider" id="guide-panel-${spider.id}" role="tabpanel" aria-labelledby="guide-tab-${spider.id}" data-guide-panel="spider" data-guide-value="${spider.id}" ${spiderIndex ? 'hidden' : ''}>
        <div class="guide-spider-head">
          <div class="guide-spider-intro">
            <div class="guide-spider-portrait">${portrait(spider.id, `-guide-hero-${spider.id}`)}</div>
            <div>
              <h2>${spider.name} <span class="guide-element-pill element-${spider.element.toLowerCase()}">${spider.element}</span></h2>
              <p>${spider.description}</p>
              ${innate ? `
                <div class="guide-innate-box">
                  <span class="guide-innate-badge">Innate Passive &middot; Heavy Attack</span>
                  <div class="guide-innate-content">
                    <strong>${innate.name}:</strong> <span>${innate.description}</span>
                  </div>
                </div>
              ` : ''}
              <span class="guide-skills-count">${ALL_ABILITY_IDS.length} skills</span>
            </div>
          </div>
          <div class="guide-selected-skill" aria-live="polite">
            <p class="guide-skill-prompt" data-guide-prompt>Choose a skill below to see its combat tags, damage scaling, range, and tactical usage.</p>
            <div data-guide-detail hidden>
              <div class="guide-selected-top">
                <img data-guide-icon alt="">
                <div>
                  <div class="guide-selected-meta">
                    <small data-guide-cooldown></small>
                    <span class="guide-sector-badge" data-guide-sector></span>
                  </div>
                  <h3 data-guide-name></h3>
                </div>
              </div>
              <div class="guide-skill-tags" data-guide-tags></div>
              <div class="guide-skill-stat-grid" data-guide-stats>
                <div class="guide-stat-card">
                  <small>Damage / Effect</small>
                  <strong data-guide-damage></strong>
                </div>
                <div class="guide-stat-card">
                  <small>Range / AoE</small>
                  <strong data-guide-range></strong>
                </div>
                <div class="guide-stat-card">
                  <small>Duration / Cooldown</small>
                  <strong data-guide-duration></strong>
                </div>
              </div>
              <p data-guide-desc></p>
              <p class="guide-best-use"><b>Best time to use</b><span data-guide-best></span></p>
            </div>
          </div>
        </div>
        <div class="guide-skill-grid">${ALL_ABILITY_IDS.map((id, index) => {
          const ability = getSpiderAbility(spider.id, id);
          return `<button type="button" class="guide-skill" data-guide-ability="${id}" aria-pressed="false"><img src="${spiderAbilityIcon(spider.id, id)}" alt="" loading="lazy"><span><small>${index + 1} / ${ALL_ABILITY_IDS.length}</small><strong>${ability.name}</strong></span></button>`;
        }).join('')}</div>
      </section>`;
      }).join('')}
    </section>
    <section id="guide-panel-terrain" role="tabpanel" aria-labelledby="guide-tab-terrain" data-guide-panel="section" data-guide-value="terrain" hidden>
      <div class="guide-tabs guide-arena-tabs" role="tablist" aria-label="Choose terrain" data-guide-group="terrain">
        ${TERRAINS.map((terrain, index) => `<button type="button" role="tab" id="guide-tab-${terrain.id}" data-guide-value="${terrain.id}" aria-controls="guide-panel-${terrain.id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" style="--terrain-accent:${terrain.accent}"><canvas width="240" height="130" data-guide-thumbnail="${terrain.id}" aria-hidden="true"></canvas><span class="guide-arena-tab-copy"><small>Arena ${String(index + 1).padStart(2, '0')}</small><strong>${terrain.name}</strong></span></button>`).join('')}
      </div>
      ${TERRAINS.map((terrain, index) => {
        const note = terrainNotes[terrain.id];
        const advantage = SPIDERS.find(spider => spider.id === note.advantage)!;
        const disadvantage = SPIDERS.find(spider => spider.id === note.disadvantage)!;
        return `<article class="guide-terrain" id="guide-panel-${terrain.id}" role="tabpanel" aria-labelledby="guide-tab-${terrain.id}" data-guide-panel="terrain" data-guide-value="${terrain.id}" style="--terrain-accent:${terrain.accent}" ${index ? 'hidden' : ''}>
          <div class="guide-terrain-stage"><canvas width="1200" height="560" data-guide-preview="${terrain.id}" role="img" aria-label="${terrain.name} as it appears in the game"></canvas></div>
          <div class="guide-terrain-body"><div class="guide-terrain-description"><h2>${terrain.name}</h2><p>${note.description}</p></div>
            <div class="guide-matchups" aria-label="Spider matchups">
              <div class="guide-matchup advantage"><div class="guide-matchup-portrait">${portrait(note.advantage, `-guide-${terrain.id}-advantage`)}</div><div><span>Advantage</span><h3>${advantage.name}</h3><p>${note.advantageReason}</p></div></div>
              <div class="guide-matchup disadvantage"><div class="guide-matchup-portrait">${portrait(note.disadvantage, `-guide-${terrain.id}-disadvantage`)}</div><div><span>Disadvantage</span><h3>${disadvantage.name}</h3><p>${note.disadvantageReason}</p></div></div>
            </div>
          </div>
        </article>`;
      }).join('')}
    </section>
  </div>`;
}

export function bindGuideView(container: HTMLElement): () => void {
  const root = container.querySelector<HTMLElement>('.guide-page');
  if (!root) return () => {};
  root.querySelectorAll<HTMLElement>('.guide-spider').forEach(panel => {
    const species = panel.dataset.guideValue as SpiderId;
    const buttons = [...panel.querySelectorAll<HTMLButtonElement>('[data-guide-ability]')];
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      const id = button.dataset.guideAbility as (typeof ALL_ABILITY_IDS)[number];
      const ability = getSpiderAbility(species, id);
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      panel.querySelector<HTMLElement>('[data-guide-prompt]')!.hidden = true;
      panel.querySelector<HTMLElement>('[data-guide-detail]')!.hidden = false;
      panel.querySelector<HTMLImageElement>('[data-guide-icon]')!.src = spiderAbilityIcon(species, id);
      panel.querySelector<HTMLElement>('[data-guide-name]')!.textContent = ability.name;
      panel.querySelector<HTMLElement>('[data-guide-cooldown]')!.textContent = `${ability.cd}s cooldown`;
      panel.querySelector<HTMLElement>('[data-guide-desc]')!.textContent = ability.desc;
      panel.querySelector<HTMLElement>('[data-guide-best]')!.textContent = bestUse[species][index];

      const tagsEl = panel.querySelector<HTMLElement>('[data-guide-tags]');
      if (tagsEl) {
        tagsEl.innerHTML = (ability.tags || [])
          .map(tag => `<span class="guide-tag">${tag}</span>`)
          .join('');
      }
      const sectorEl = panel.querySelector<HTMLElement>('[data-guide-sector]');
      if (sectorEl) {
        sectorEl.textContent = ability.sectorName;
        sectorEl.style.color = ability.sectorColor;
      }
      const damageEl = panel.querySelector<HTMLElement>('[data-guide-damage]');
      if (damageEl) damageEl.textContent = ability.damage || '—';
      const rangeEl = panel.querySelector<HTMLElement>('[data-guide-range]');
      if (rangeEl) rangeEl.textContent = ability.range || '—';
      const durationEl = panel.querySelector<HTMLElement>('[data-guide-duration]');
      if (durationEl) durationEl.textContent = ability.duration || 'Instant';
    }));
  });
  const previews = new Map<TerrainId, (seconds: number) => void>();
  TERRAINS.forEach(terrain => {
    const canvas = root.querySelector<HTMLCanvasElement>(`[data-guide-preview="${terrain.id}"]`)!;
    const thumbnail = root.querySelector<HTMLCanvasElement>(`[data-guide-thumbnail="${terrain.id}"]`)!;
    previews.set(terrain.id, GagambakbakanScene.createTerrainPreview(canvas, thumbnail, terrain.id));
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const started = performance.now() - 3000;
  let activeTerrain: TerrainId | null = null;
  let frame = 0;
  let lastFrame = 0;
  const animate = (now: number) => {
    if (activeTerrain && !document.hidden && now - lastFrame >= 33) {
      previews.get(activeTerrain)!((now - started) / 1000);
      lastFrame = now;
    }
    frame = requestAnimationFrame(animate);
  };
  const selectTerrain = (terrain: TerrainId | null) => {
    activeTerrain = terrain;
    if (terrain && !reducedMotion && !frame) frame = requestAnimationFrame(animate);
    if (!terrain && frame) { cancelAnimationFrame(frame); frame = 0; }
  };
  root.querySelectorAll<HTMLElement>('[role="tablist"]').forEach(list => {
    const group = list.dataset.guideGroup;
    const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const activate = (tab: HTMLButtonElement) => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      root.querySelectorAll<HTMLElement>(`[data-guide-panel="${group}"]`).forEach(panel => {
        panel.hidden = panel.dataset.guideValue !== tab.dataset.guideValue;
      });
      if (group === 'terrain') selectTerrain(tab.dataset.guideValue as TerrainId);
      if (group === 'section' && tab.dataset.guideValue === 'terrain') {
        selectTerrain(root.querySelector<HTMLButtonElement>('[data-guide-group="terrain"] [aria-selected="true"]')!.dataset.guideValue as TerrainId);
      }
      if (group === 'section' && tab.dataset.guideValue === 'skills') selectTerrain(null);
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault();
        activate(tabs[next]);
        tabs[next].focus();
      });
    });
  });
  return () => { if (frame) cancelAnimationFrame(frame); };
}
