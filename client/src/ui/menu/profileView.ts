import { getAuthUser, supabase } from '../../auth';
import { getColor, getExpProgress, getLevel, getLooks, getProgress, getUnlockedIds, spiderSVG } from '../../gb';
import { SKILLS_LIST } from '../../game/abilities';
import { fetchMatchHistory, MATCH_MODES, summarizeMatches, type MatchMode, type MatchRecord } from '../../matchHistory';
import { getRankFromRating, getRankProgress, renderRankBadgeSVG, RANK_RATING_LABEL } from './rankTitle';
import { renderLeaderboardBadge } from './leaderboardBadge';

export function renderProfileView(slot: 'p1' | 'p2'): string {
  const progress = getProgress();
  const rank = getRankFromRating(progress.rating);
  const unlocked = getUnlockedIds(progress);
  const looks = typeof getLooks === 'function' ? getLooks() : {
    p1: { name: 'Player 1', color: 'amber', pattern: 'none', acc: 'none', customPattern: '' },
    p2: { name: 'Player 2', color: 'jade', pattern: 'none', acc: 'none', customPattern: '' }
  };
  const lk = looks[slot] || looks.p1;
  const spiderHtml = typeof spiderSVG === 'function' ? spiderSVG(lk, '-profile') : '';
  const spiderColor = typeof getColor === 'function' ? getColor(lk.color) : { main: '#f2a33a', light: '#ffd694', label: 'Amber' };
  const rankProgress = typeof getRankProgress === 'function'
    ? getRankProgress(progress.rating)
    : { progressPct: 0, ratingInTier: 0, ratingForTier: 100, nextRank: null };
  const expProgress = typeof getExpProgress === 'function'
    ? getExpProgress(progress.onlineExp)
    : { expIntoLevel: 0, expForLevel: 100 };
  const name = (lk.name || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

  return `<section class="page profile-page" aria-labelledby="profileName">
    <header class="page-top">
      <button class="btn ghost" type="button" id="btnProfileBack"><svg class="ico" aria-hidden="true"><use href="#ic-back"/></svg> Menu</button>
    </header>

    <div class="profile-hero">
      <div class="profile-spider-col">
        <div class="profile-spider-stage" aria-hidden="true">
          <div class="profile-spider-glow" style="--spider-glow:${spiderColor.main};"></div>
          ${spiderHtml}
        </div>
        <div class="profile-identity-info">
          <h1 id="profileName" tabindex="-1">${name}</h1>
          <p class="profile-identity-sub">${slot === 'p1' ? `Level ${getLevel(progress.onlineExp)} (${expProgress.expIntoLevel} / ${expProgress.expForLevel} EXP) · ${spiderColor.label} Shell` : 'Player 2 · Local PvP fighter'}</p>
        </div>

        <div class="profile-achievements-card">
          <div class="profile-achievements-header">
            <span class="profile-achievements-title">Podium Achievements</span>
            <small class="profile-achievements-hint">${slot === 'p1' ? 'Top 3 Leaderboard' : 'Local Fighter'}</small>
          </div>
          <div id="profileBadges" class="profile-badges" role="status">
            ${slot === 'p1' ? '<div class="profile-loading-badge">Checking leaderboard places…</div>' : '<p class="profile-no-badges">Player 2 battles locally on this machine without leaderboard standings.</p>'}
          </div>
        </div>
      </div>

      <div class="profile-rank-col">
        ${slot === 'p1' ? `
          <div class="profile-rank-card">
            <div class="profile-rank-emblem-wrap">
              <div class="profile-rank-glow" style="background:${rank.badgeCol};"></div>
              ${renderRankBadgeSVG(rank.id, 500)}
            </div>

            <div class="profile-rank-bottom">
              <div class="profile-rank-details">
                <span class="profile-rank-badge" style="background:${rank.badgeCol};">Current Rank</span>
                <h2 class="profile-rank-title" style="color:${rank.badgeCol};">${rank.species} · ${rank.title}</h2>
              </div>

              <div class="profile-rank-progress-wrap">
                <div class="profile-rpc-header">
                  <span class="profile-rpc-label">Rank Progression</span>
                  <span class="profile-rpc-value"><strong>${progress.rating.toLocaleString()}</strong> ${RANK_RATING_LABEL}</span>
                </div>
                <div class="profile-rpc-track">
                  <div class="profile-rpc-fill" style="width:${Math.max(4, rankProgress.progressPct)}%; background:${rank.badgeCol};"></div>
                </div>
                <div class="profile-rpc-footer">
                  <span>${rank.title} (${rank.minRating ?? 0} ${RANK_RATING_LABEL})</span>
                  <span class="profile-rpc-pct">${rankProgress.progressPct}%</span>
                  <span>${rankProgress.nextRank ? `${rankProgress.nextRank.title} (${rankProgress.nextRank.minRating} ${RANK_RATING_LABEL})` : 'Peak Tier'}</span>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <div class="profile-rank-card profile-p2-card">
            <div class="profile-p2-badge">
              <svg class="ico" aria-hidden="true" width="56" height="56"><use href="#ic-versus"/></svg>
            </div>
            <div class="profile-p2-details">
              <span class="profile-rank-badge">Local PvP</span>
              <h2 class="profile-rank-title">Player 2 Fighter</h2>
              <p class="profile-p2-desc">Guest combatant on this machine. Battles recorded under Local PvP mode with shared ability pool.</p>
            </div>
          </div>
        `}
      </div>
    </div>

    <section class="profile-card-section" aria-labelledby="profileBattleHeading">
      <div class="profile-section-header">
        <h2 id="profileBattleHeading">Battle Record</h2>
        <p class="note">Completed matches recorded since profile history was introduced. Earlier matches are not included.</p>
      </div>
      <div class="leaderboard-filters profile-filters" role="group" aria-label="Filter matches by mode">
        ${Object.entries(slot === 'p1' ? { all: 'All modes', ...MATCH_MODES } : { '2p': MATCH_MODES['2p'] }).map(([m, label], index) => `<button class="btn ghost" type="button" data-profile-mode="${m}" aria-pressed="${index === 0}">${label}</button>`).join('')}
      </div>
      <p id="profileHistoryStatus" role="status">Loading match history…</p>
      <button class="btn ghost" type="button" id="profileHistoryRetry" hidden>Retry history</button>
      <dl class="profile-stats" id="profileStats" hidden></dl>
      <div class="profile-history-wrap">
        <table class="leaderboard-table profile-history" hidden>
          <caption>Recent matches</caption>
          <thead><tr><th scope="col">Result</th><th scope="col">Opponent</th><th scope="col">Mode</th><th scope="col">Rounds</th><th scope="col">Played</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <button class="btn ghost" type="button" id="profileMore" hidden>Show more matches</button>
    </section>

    <section class="profile-card-section" aria-labelledby="profileAbilitiesHeading">
      <div class="profile-section-header">
        <h2 id="profileAbilitiesHeading">Unlocked Abilities <small class="profile-count-badge">${unlocked.length} / ${SKILLS_LIST.length}</small></h2>
        <p class="note">${slot === 'p2' ? 'Uses this account’s shared ability pool. ' : ''}Read-only. Manage unlocks from the Abilities menu.</p>
      </div>
      <ul class="profile-abilities">${SKILLS_LIST.filter(skill => unlocked.includes(skill.id)).map(skill => `
        <li><svg class="ico" aria-hidden="true"><use href="#${skill.icon}"/></svg>
          <div><h3>${skill.name}</h3><p>${skill.desc}</p><small>${skill.cd}s cooldown · ${skill.use === 'hang' ? 'While hanging' : 'While standing'}</small></div></li>`).join('')}</ul>
    </section>
  </section>`;
}

export function bindProfileEvents(container: HTMLElement, slot: 'p1' | 'p2') {
  const page = container.querySelector<HTMLElement>('.profile-page')!;
  const name = page.querySelector<HTMLElement>('#profileName')!;
  name.textContent = getLooks()[slot].name;
  name.focus();
  const status = page.querySelector<HTMLElement>('#profileHistoryStatus')!;
  const retry = page.querySelector<HTMLButtonElement>('#profileHistoryRetry')!;
  const more = page.querySelector<HTMLButtonElement>('#profileMore')!;
  const stats = page.querySelector<HTMLElement>('#profileStats')!;
  const table = page.querySelector<HTMLTableElement>('table')!;
  let mode: MatchMode | 'all' = slot === 'p1' ? 'all' : '2p';
  let records: MatchRecord[] = [];
  let loaded = false;
  let visibleCount = 20;

  function display() {
    if (!loaded) return;
    const filtered = records.filter(record => mode === 'all' || record.mode === mode);
    const summary = summarizeMatches(filtered);
    stats.hidden = false;
    stats.innerHTML = Object.entries({ Matches: summary.played, Wins: summary.wins, Losses: summary.losses, 'Win rate': `${summary.winRate}%` })
      .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
    table.caption!.textContent = `${mode === 'all' ? 'All modes' : MATCH_MODES[mode]} · Most recent first`;
    const body = table.tBodies[0];
    body.replaceChildren();
    for (const record of filtered.slice(0, visibleCount)) {
      const row = body.insertRow();
      row.className = record.won ? 'profile-win' : 'profile-loss';
      for (const value of [record.won ? 'Victory' : 'Defeat', record.opponent, MATCH_MODES[record.mode],
        `${record.rounds_won} – ${record.rounds_lost}`, new Date(record.played_at).toLocaleString()]) {
        row.insertCell().textContent = value;
      }
    }
    table.hidden = !filtered.length;
    more.hidden = filtered.length <= visibleCount;
    status.textContent = filtered.length ? `Showing ${Math.min(visibleCount, filtered.length)} of ${filtered.length} matches.` : 'No recorded matches in this mode yet.';
  }

  async function load() {
    retry.hidden = true;
    status.textContent = 'Loading match history…';
    try {
      records = await fetchMatchHistory(slot);
      if (!page.isConnected) return;
      loaded = true;
      display();
    } catch {
      if (!page.isConnected) return;
      status.textContent = 'Could not load match history. Check your connection and try again.';
      retry.hidden = false;
    }
  }
  page.querySelectorAll<HTMLButtonElement>('[data-profile-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.profileMode as MatchMode | 'all';
    visibleCount = 20;
    page.querySelectorAll<HTMLButtonElement>('[data-profile-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    display();
  }));
  more.addEventListener('click', () => { visibleCount += 20; display(); });
  retry.addEventListener('click', () => { void load(); });
  void load();

  async function loadBadges() {
    const user = getAuthUser();
    if (slot !== 'p1' || !user || !supabase) return;
    const badges = page.querySelector<HTMLElement>('#profileBadges')!;
    badges.innerHTML = '<div class="profile-loading-badge">Checking leaderboard places…</div>';
    try {
      const boards = await Promise.all(['online_exp', 'rating'].map(column => supabase!.from('profiles')
        .select('id').order(column, { ascending: false, nullsFirst: false })
        .order('username', { ascending: true }).limit(3)));
      if (!page.isConnected) return;
      if (boards.some(board => board.error)) throw new Error('Leaderboard unavailable');
      badges.replaceChildren();
      const earned = boards.map((board, index) => {
        const position = board.data?.findIndex(player => player.id === user.id) ?? -1;
        return renderLeaderboardBadge(index === 0 ? 'level' : 'rank', position + 1);
      }).filter(Boolean);
      badges.innerHTML = earned.length
        ? earned.join('')
        : '<p class="profile-no-badges">No podium badges yet. Rank in the top 3 on either leaderboard to claim a spider badge.</p>';
    } catch {
      if (page.isConnected) badges.innerHTML = '<p class="profile-no-badges">Leaderboard badges unavailable right now.</p>';
    }
  }
  void loadBadges();
}
