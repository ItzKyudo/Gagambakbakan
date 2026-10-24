import { createElement, BookOpen, GraduationCap, Settings, LogIn, type IconNode } from 'lucide';
import { getColor, getExpProgress, getLooks, getProgress, getSettings, getUnlockedIds, spiderSVG, getBattlefieldsData } from '../../gb';
import { SKILLS_LIST } from '../../game/abilities';
import { getRankFromRating, getRankProgress, renderRankBadgeSVG, RANK_RATING_LABEL } from './rankTitle';
import { getAuthUser } from '../../auth';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

/* ====================================================
   1. MAIN MENU VIEW (Matching menu.html)
   ==================================================== */
export function renderMainMenuView(activePanel: 'main' | 'play' = 'main'): string {
  const user = getAuthUser();
  const looks = getLooks();
  const st = getSettings();
  const prog = getProgress();
  const expInfo = getExpProgress(prog.onlineExp);
  const unlockedCount = getUnlockedIds(prog).length;

  const stats = getBattlefieldsData(prog);
  const rankInfo = getRankFromRating(stats.rating);
  const rankProgress = getRankProgress(stats.rating);











  return `
    <!-- TOP CENTER TITLE WITH NO CONTAINER -->
    <header class="menu-title-header">
      <svg class="title-twig" viewBox="0 0 300 78" aria-hidden="true">
        <rect x="6" y="8" width="288" height="14" rx="7" fill="#7b5b3e"/>
        <rect x="6" y="8" width="288" height="4" rx="2" fill="#a58059"/>
        <g stroke-linecap="round" stroke-width="2.4" fill="none">
          <g stroke="#f2a33a"><path d="M96 22v14"/><path d="M82 52l-14-12M84 58l-18 2M110 52l14-12M108 58l18 2"/></g>
          <g stroke="#4cc7b2"><path d="M204 22v14"/><path d="M190 52l-14-12M192 58l-18 2M218 52l14-12M216 58l18 2"/></g>
        </g>
        <ellipse cx="96" cy="48" rx="15" ry="12" fill="#f2a33a"/><circle cx="96" cy="38" r="8" fill="#ffd694"/>
        <ellipse cx="204" cy="48" rx="15" ry="12" fill="#4cc7b2"/><circle cx="204" cy="38" r="8" fill="#b0f2e3"/>
      </svg>
      <h1 class="menu-main-title"><span class="a">Gagam</span><span class="j">bakbakan</span></h1>
      <p class="menu-sub-title">Two spiders. One twig.</p>
    </header>

    <!-- SPLIT BODY: BUTTONS FAR LEFT, CHARACTER DISPLAY FAR RIGHT -->
    <main class="menu-split-body">
      <div class="menu-left-col">
        <nav class="panel" id="pMain" aria-label="Main menu" ${activePanel === 'play' ? 'hidden' : ''}>
          <button type="button" class="mb primary" id="btnGoPlay">
            <span class="mi"><svg class="ico"><use href="#ic-play"/></svg></span>
            <span class="ml">${user ? 'Play' : 'Play as Guest'}</span>
            <small>${user ? 'vs AI, PvP, or Online' : 'No account needed, including online'}</small>
          </button>
          ${!user ? `
            <button type="button" class="mb" id="btnGoAccount">
              <span class="mi">${icon(LogIn, { class: 'ico', width: 20, height: 20, 'stroke-width': 2.1 })}</span>
              <span class="ml">Log In</span>
              <small>Save progress and play ranked</small>
            </button>
          ` : ''}
          ${user ? `
            <button type="button" class="mb" id="btnGoAbilities">
              <span class="mi"><svg class="ico"><use href="#ic-web"/></svg></span>
              <span class="ml">Abilities</span>
              <small id="abCount">Level ${expInfo.level} &middot; ${unlockedCount} of ${SKILLS_LIST.length} unlocked</small>
            </button>
          ` : ''}
          <button type="button" class="mb" id="btnGoLeaderboard">
            <span class="mi"><svg class="ico" aria-hidden="true"><use href="#ic-rank"/></svg></span>
            <span class="ml">Leaderboard</span>
            <small>Highest level &amp; rank</small>
          </button>
          <button type="button" class="mb" id="btnGoLearn">
            <span class="mi">${icon(GraduationCap, { class: 'ico', width: 20, height: 20, 'stroke-width': 2.1 })}</span>
            <span class="ml">Learn</span>
            <small>Interactive battle tutorial</small>
          </button>
          <button type="button" class="mb" id="btnGoSettings">
            <span class="mi">${icon(Settings, { class: 'ico', width: 20, height: 20, 'stroke-width': 2.1 })}</span>
            <span class="ml">Settings</span>
            <small>Keys, sound, music</small>
          </button>
          <button type="button" class="mb" id="btnGoAbout">
            <span class="mi">${icon(BookOpen, { class: 'ico', width: 20, height: 20, 'stroke-width': 2.1 })}</span>
            <span class="ml">About</span>
            <small>Lore, rules &amp; credits</small>
          </button>
        </nav>

        <nav class="panel" id="pPlay" aria-label="Choose a mode" ${activePanel === 'play' ? '' : 'hidden'}>
          <h2>Play</h2>
          <button type="button" class="mb ${user ? 'selected' : ''}" id="btnModeRank">
            <span class="mi"><svg class="ico"><use href="#ic-rank"/></svg></span>
            <span class="ml" id="rankBtnLabel">Rank</span>
            <small id="rankBtnTag">${user ? `Strict same-rank &bull; ${rankInfo.title}` : 'Log in to play ranked'}</small>
            <div class="online-queue-side" id="rankQueueSide" style="display:none;">
              <span class="queue-timer-val" id="rankQueueTimer">00:00</span>
              <span class="queue-cancel-x" id="btnCancelRankQueue" title="Cancel Queue" aria-label="Cancel queue">✕</span>
            </div>
          </button>
          <button type="button" class="mb" id="btnModeCpu">
            <span class="mi"><svg class="ico"><use href="#ic-cpu"/></svg></span>
            <span class="ml">vs AI</span>
            <small id="diffNote">${st.diff.charAt(0).toUpperCase() + st.diff.slice(1)} diff</small>
          </button>
          <button type="button" class="mb mb-online ${user ? '' : 'selected'}" id="btnModeOnline">
            <span class="mi"><svg class="ico"><use href="#ic-globe"/></svg></span>
            <span class="ml" id="onlineBtnLabel">Multiplayer Online</span>
            <small id="onlineBtnTag">${user ? 'Quick match' : 'Guest quick match'}</small>
            <div class="online-queue-side" id="onlineQueueSide" style="display:none;">
              <span class="queue-timer-val" id="onlineQueueTimer">00:00</span>
              <span class="queue-cancel-x" id="btnCancelQueue" title="Cancel Queue" aria-label="Cancel queue">✕</span>
            </div>
          </button>
          <button type="button" class="mb" id="btnMode2p">
            <span class="mi"><svg class="ico"><use href="#ic-versus"/></svg></span>
            <span class="ml">PvP</span>
            <small>2 players, 1 keyboard</small>
          </button>
          <button type="button" class="mb quiet" id="btnPlayBack">
            <span class="mi"><svg class="ico"><use href="#ic-back"/></svg></span>
            <span class="ml">Back</span>
          </button>
        </nav>

        <div class="panel thanks" id="pQuit" hidden>
          <h2>Thanks for playing!</h2>
          <p>Until the next duel above the pond.</p>
          <button type="button" class="mb quiet" id="btnQuitBack">
            <span class="mi"><svg class="ico"><use href="#ic-back"/></svg></span>
            <span class="ml">Back</span>
          </button>
        </div>
      </div>

      <!-- FAR RIGHT: CHARACTER DISPLAY (ONLY WHEN LOGGED IN) -->
      ${user ? `
        <aside class="showcase menu-right-col" aria-label="Your spider">
          <div class="showcase-card" id="showcaseSpiderCard">
            <!-- 1. SPIDER NAME & IDENTITY (OPENS PROFILE) -->
            <div class="showcase-id-badge" id="badgeViewProfile" role="button" tabindex="0" title="Click to view profile &amp; battle history" style="--badge-c:${getColor(looks.p1.color).main};">
              <div class="sib-header">
                <i class="sib-dot" style="background:${getColor(looks.p1.color).main}; box-shadow: 0 0 10px ${getColor(looks.p1.color).main};"></i>
                <span class="sib-name" id="showcaseName">${looks.p1.name}</span>
                <button type="button" class="sib-view-profile" id="btnViewProfile" title="View profile &amp; battle stats">View Profile &rsaquo;</button>
                <span class="sib-lvl-badge">LVL ${expInfo.level}</span>
              </div>
              <div class="sib-sub">
                <span class="sib-rank" style="color:${rankInfo.badgeCol};">${rankInfo.species} &bull; ${rankInfo.title} (${stats.rating} ${RANK_RATING_LABEL})</span>
                <span class="sib-color-label" style="color:${getColor(looks.p1.color).light};">${getColor(looks.p1.color).label}</span>
              </div>
            </div>

            <!-- 2. PODIUM & SPIDER DISPLAY -->
            <div class="showcase-podium">
              <div class="showcase-glow" style="--spider-glow:${getColor(looks.p1.color).main};"></div>
              <div class="stage" id="showcaseStage" role="button" tabindex="0" title="Click to customize your spider">
                ${spiderSVG(looks.p1, '-showcase')}
              </div>
              <div class="showcase-reflection"></div>
              <button type="button" class="showcase-customize-hint" id="btnQuickCustomize" title="Customize Spider">
                <svg class="ico" width="13" height="13" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Customize</span>
              </button>
            </div>

            <!-- 3. WINS & LOST STATS (BELOW SPIDER CHARACTER DISPLAY) -->
            <div class="showcase-stats-card" title="Battlefield Stats: ${stats.played} Matches (${stats.wins}W - ${stats.losses}L)">
              <div class="ssc-main">
                <div class="ssc-stat ssc-wins">
                  <span class="ssc-label">Wins</span>
                  <span class="ssc-val wins-val">${stats.wins}</span>
                </div>
                <div class="ssc-divider"></div>
                <div class="ssc-stat ssc-lost">
                  <span class="ssc-label">Lost</span>
                  <span class="ssc-val lost-val">${stats.losses}</span>
                </div>
                <div class="ssc-divider"></div>
                <div class="ssc-stat ssc-winrate">
                  <span class="ssc-label">Win Rate</span>
                  <span class="ssc-val rate-val">${stats.winRate}%</span>
                </div>
              </div>
            </div>

            <!-- 4. LEVEL & ONLINE EXP PROGRESS CARD -->
            <div class="menu-level-card" role="button" tabindex="0" title="View Abilities Tree">
              <div class="mlc-top">
                <span class="mlc-badge">LEVEL ${expInfo.level}</span>
                <span class="mlc-exp">${expInfo.expIntoLevel} / ${expInfo.expForLevel} EXP</span>
              </div>
              <div class="mlc-track">
                <div class="mlc-fill" style="width:${Math.max(5, expInfo.progressPct)}%;"></div>
              </div>
              <div class="mlc-sub">
                <span class="mlc-prog-label">Skill Mastery</span>
                <span class="mlc-skills-count">${unlockedCount} / ${SKILLS_LIST.length} Unlocked &rsaquo;</span>
              </div>
            </div>
          </div>

          <div class="showcase-card rank-showcase-card" id="showcaseRankCard" style="display:none;">
            <!-- 1. RANK CARD HEADER -->
            <div class="rank-card-header">
              <span class="rch-badge" style="background:${rankInfo.badgeCol};">CURRENT RANK</span>
              <h2 class="rch-title" style="color:${rankInfo.badgeCol};">${rankInfo.title}</h2>
              <span class="rch-mmr">${stats.rating} ${RANK_RATING_LABEL} &bull; ${rankInfo.species}</span>
            </div>

            <!-- 2. RANK BADGE EMBLEM -->
            <div class="rank-emblem-wrap">
              <div class="rank-emblem-glow" style="background:${rankInfo.badgeCol};"></div>
              ${renderRankBadgeSVG(rankInfo.id, 120)}
            </div>

            <!-- 3. RANK PROGRESSION TOWARDS NEXT TIER -->
            <div class="rank-progress-card">
              <div class="rpc-header">
                <span class="rpc-label">Rank Progress</span>
                <span class="rpc-val">${rankProgress.nextRank ? `${rankProgress.ratingInTier} / ${rankProgress.ratingForTier} ${RANK_RATING_LABEL}` : 'MAX RANK'}</span>
              </div>
              <div class="rpc-track">
                <div class="rpc-fill" style="width:${rankProgress.progressPct}%; background:${rankInfo.badgeCol};"></div>
              </div>
              <div class="rpc-sub">
                <span>${rankInfo.title}</span>
                <span>${rankProgress.nextRank ? rankProgress.nextRank.title : "Death's Empress"}</span>
              </div>
            </div>

            <!-- 4. BATTLEFIELDS RECORD (WINS, LOSSES, WIN RATE) -->
            <div class="showcase-stats-card" title="Battlefield Stats: ${stats.played} Matches (${stats.wins}W - ${stats.losses}L)">
              <div class="ssc-main">
                <div class="ssc-stat ssc-wins">
                  <span class="ssc-label">Wins</span>
                  <span class="ssc-val wins-val">${stats.wins}</span>
                </div>
                <div class="ssc-divider"></div>
                <div class="ssc-stat ssc-lost">
                  <span class="ssc-label">Lost</span>
                  <span class="ssc-val lost-val">${stats.losses}</span>
                </div>
                <div class="ssc-divider"></div>
                <div class="ssc-stat ssc-winrate">
                  <span class="ssc-label">Win Rate</span>
                  <span class="ssc-val rate-val">${stats.winRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      ` : `
        <div class="menu-right-col" style="display:flex; align-items:center; justify-content:center; flex:1; min-width:0;">
          <div class="account-preview-arena" id="menuBattlePreview" title="Live AI Sparring"></div>
        </div>
      `}
    </main>
  `;
}

