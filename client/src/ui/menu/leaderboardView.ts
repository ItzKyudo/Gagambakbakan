import { supabase } from '../../auth';
import { getLevel } from '../../gb';
import { renderPodiumBadge } from './leaderboardBadge';
import { getRankFromRating, renderRankBadgeSVG, RANK_RATING_LABEL } from './rankTitle';

export function renderLeaderboardView(): string {
  return `
    <section class="page leaderboard-page" aria-labelledby="leaderboardHeading">
      <header class="page-top">
        <button type="button" class="btn ghost" id="btnBackToMain">
          <svg class="ico" aria-hidden="true"><use href="#ic-back"/></svg> Menu
        </button>
        <div class="leaderboard-heading">
          <h1 id="leaderboardHeading" tabindex="-1">Leaderboard</h1>
          <p class="note">Ten leading spiders. Two ways to claim the podium.</p>
        </div>
      </header>
      <div class="leaderboard-filters" role="group" aria-label="Leaderboard type">
        <button type="button" class="btn" data-board="online_exp" aria-pressed="true"><svg class="ico" aria-hidden="true"><use href="#ic-web"/></svg> Highest level</button>
        <button type="button" class="btn" data-board="rating" aria-pressed="false"><svg class="ico" aria-hidden="true"><use href="#ic-rank"/></svg> Highest rank</button>
      </div>
      <p class="note" id="leaderboardDescription">Top 10 players by total online EXP. More EXP breaks level ties.</p>
      <p role="status" id="leaderboardStatus"></p>
      <button type="button" class="btn ghost" id="leaderboardRetry" hidden>Try again</button>
      <table class="leaderboard-table" aria-describedby="leaderboardDescription" hidden>
        <caption class="note">Highest level</caption>
        <thead><tr><th scope="col">Place</th><th scope="col">Player</th><th scope="col">Level / EXP</th></tr></thead>
        <tbody></tbody>
      </table>
    </section>`;
}

export function bindLeaderboardEvents(container: HTMLElement) {
  const page = container.querySelector<HTMLElement>('.leaderboard-page')!;
  const status = page.querySelector<HTMLElement>('#leaderboardStatus')!;
  const retry = page.querySelector<HTMLButtonElement>('#leaderboardRetry')!;
  const table = page.querySelector<HTMLTableElement>('table')!;
  const buttons = page.querySelectorAll<HTMLButtonElement>('[data-board]');
  let selected: 'online_exp' | 'rating' = 'online_exp';
  let request = 0;

  async function load() {
    const current = ++request;
    const byLevel = selected === 'online_exp';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.board === selected)));
    page.querySelector('#leaderboardDescription')!.textContent = byLevel
      ? 'Top 10 players by total online EXP. More EXP breaks level ties.'
      : `Top 10 players by ${RANK_RATING_LABEL} rating. Higher rating leads within each rank.`;
    table.caption!.textContent = byLevel ? 'Highest level' : 'Highest rank';
    table.tHead!.rows[0].cells[2].textContent = byLevel ? 'Level / EXP' : `Rank / ${RANK_RATING_LABEL}`;
    table.hidden = true;
    retry.hidden = true;
    status.textContent = 'Loading leaderboard…';
    if (!supabase) {
      status.textContent = 'Leaderboards are unavailable. Online services are not configured.';
      return;
    }
    try {
      const { data, error } = await supabase.from('profiles')
        .select('username, online_exp, rating')
        .order(selected, { ascending: false, nullsFirst: false })
        .order('username', { ascending: true })
        .limit(10);
      if (current !== request || !page.isConnected) return;
      if (error) throw error;
      const body = table.tBodies[0];
      body.replaceChildren();
      for (const [index, player] of (data ?? []).entries()) {
        const row = body.insertRow();
        const place = index + 1;
        row.className = place <= 3 ? `leaderboard-place-${place}` : '';
        const placeCell = row.insertCell();
        if (place <= 3) {
          placeCell.innerHTML = renderPodiumBadge(byLevel ? 'level' : 'rank', place, 44);
        } else {
          placeCell.textContent = String(place);
        }
        const exp = Math.max(0, player.online_exp ?? 0);
        const rating = Math.max(0, player.rating ?? 0);
        const rank = getRankFromRating(rating);
        const identity = row.insertCell();
        // Only game-defined labels enter markup; player names are assigned as text below.
        identity.innerHTML = `
          <div class="leaderboard-player">
            ${byLevel ? '<svg class="ico" aria-hidden="true"><use href="#ic-web"/></svg>' : renderRankBadgeSVG(rank.id, 56)}
            <div><strong class="leaderboard-name"></strong>
              ${byLevel ? '' : `<span class="leaderboard-rank">${rank.species} · ${rank.title}</span>`}
            </div>
          </div>`;
        identity.querySelector('.leaderboard-name')!.textContent = player.username || 'Player';
        const score = row.insertCell();
        score.className = 'leaderboard-score';
        score.innerHTML = byLevel
          ? `<strong>Level ${getLevel(exp)}</strong><span>${exp.toLocaleString()} EXP</span>`
          : `<strong>${rating.toLocaleString()} ${RANK_RATING_LABEL}</strong>`;
      }
      table.hidden = !data?.length;
      status.textContent = data?.length ? `${data.length} players` : 'No players yet. Play online to start climbing.';
    } catch {
      if (current !== request || !page.isConnected) return;
      status.textContent = 'Could not load the leaderboard. Check your connection and try again.';
      retry.hidden = false;
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.board === 'rating' ? 'rating' : 'online_exp';
    void load();
  }));
  retry.addEventListener('click', () => { void load(); });
  page.querySelector<HTMLElement>('h1')!.focus();
  void load();
}
