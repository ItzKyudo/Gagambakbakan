import {
  createElement,
  type IconNode,
  ArrowLeft,
  BookOpen,
  Code2,
  ExternalLink
} from 'lucide';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

const GITHUB_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`;

/* ====================================================
   ABOUT VIEW
   Lore, Folklore, Mechanics & Developers
   ==================================================== */
export function renderAboutView(): string {
  return `
    <div class="page about-page" style="max-width:820px; margin-inline:auto;">
      <header class="page-top about-page-top" style="display:flex; align-items:center; justify-content:space-between; gap:18px;">
        <button type="button" class="btn ghost back-btn" id="btnBackToMain" title="Back to Menu" style="display:inline-flex; align-items:center; gap:8px; padding:8px 16px; font-weight:700; text-transform:uppercase; font-family:var(--label); font-size:15px; letter-spacing:0.06em; flex-shrink:0;">
          ${icon(ArrowLeft, { class: 'ico', width: 16, height: 16, 'stroke-width': 2.2 })}
          <span>Menu</span>
        </button>
        <div class="about-title-group" style="text-align:right;">
          <h1 style="margin:0; line-height:1.1;"><span class="a">About</span> <span class="j">Gagambakbakan</span></h1>
          <p class="note" style="margin:4px 0 0 0;">Two spiders. One twig. The Filipino street derby reborn.</p>
        </div>
      </header>

      <!-- SECTION 1: THE FOLKLORE & NOSTALGIA -->
      <section class="sec about-hero-sec" style="display:flex; flex-direction:column; gap:14px;">
        <div class="about-sec-head">
          <div class="about-sec-icon-badge amber">
            ${icon(BookOpen, { width: 20, height: 20, 'stroke-width': 2.2 })}
          </div>
          <div>
            <h2>The Folklore &amp; Nostalgia</h2>
            <small class="about-tagline">Ang Klasikong Larong Batang Pinoy: Laban ng Gagamba</small>
          </div>
        </div>

        <p class="about-text">
          <strong>Gagambakbakan</strong> celebrates <em>derby ng gagamba</em>, a once-familiar pastime in Filipino neighborhoods. Before phones and video games, kids gathered in schoolyards and along dusty streets to watch their spiders face off on a single stick.
        </p>

        <p class="about-text">
          The search often began at dawn or dusk. Children looked among mango and guava trees, banana leaves, and tall grass, sometimes using flashlights. They kept their spiders in matchboxes fitted with cardboard dividers, and cared for them with small drops of water and the occasional housefly. Some even gave their fighters names based on their appearance or where they were found—like <strong>Gagambang Pari</strong>, <strong>Gagambang Talahib</strong>, <strong>Gagambang Tigre</strong>, and <strong>Gagambang Bahay</strong>.
        </p>

        <p class="about-text">
          The arena was simple: a strand of coconut broomstick, or <em>tingting</em>, balanced over a basin of water. Two spiders met in the middle, gripping, tugging, and sometimes swinging beneath the stick on silk threads. A match ended when one fell into the water, retreated three times, or became tangled in silk. And, as the saying went, <em>walang pikon</em>—no sore losers.
        </p>

        <p class="about-text">
          <strong>Gagambakbakan</strong> brings the spirit of this childhood pastime into a digital game, recreating its close calls, quick movements, and shared excitement without putting real spiders at risk. Spiders play an important role in the environment, so the real ones are best left in the wild.
        </p>
      </section>

      <!-- SECTION 2: THE DEVELOPERS -->
      <section class="sec about-devs-sec" style="display:flex; flex-direction:column; gap:14px; margin-top:8px;">
        <div class="about-sec-head">
          <div class="about-sec-icon-badge jade">
            ${icon(Code2, { width: 20, height: 20, 'stroke-width': 2.2 })}
          </div>
          <div>
            <h2>The Developers</h2>
            <small class="about-tagline">Creators, Engineers &amp; Artisans Behind Gagambakbakan</small>
          </div>
        </div>

        <p class="about-text">
          Crafted with Filipino pride, modern web physics, and deep nostalgic passion for arcade brawlers.
        </p>

        <div class="about-devs-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin-top:4px;">
          <!-- DEV 1: LOUISE KLYDE CALOYLOY -->
          <div class="about-dev-card" style="background:var(--surface-2); border:1px solid var(--line); border-radius:10px; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:14px;">
              <img src="https://github.com/ItzKyudo.png" alt="LOUISE KLYDE CALOYLOY" class="dev-pfp" style="border:2px solid rgba(242, 163, 58, 0.55); box-shadow:0 4px 14px rgba(0,0,0,0.4);" loading="lazy">
              <h3 style="font-family:var(--label); font-size:17px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; margin:0; color:#fff;">LOUISE KLYDE CALOYLOY</h3>
            </div>
            <a href="https://github.com/ItzKyudo" target="_blank" rel="noopener noreferrer" class="dev-github-link" style="display:inline-flex; align-items:center; gap:8px; color:var(--fg); text-decoration:none; font-family:var(--label); font-weight:700; font-size:13.5px; letter-spacing:0.06em; padding:7px 14px; background:rgba(255,255,255,0.06); border:1px solid var(--line); border-radius:6px; transition:all 0.2s ease;">
              ${GITHUB_SVG}
              <span>@ItzKyudo</span>
              ${icon(ExternalLink, { width: 13, height: 13, 'stroke-width': 2.2 })}
            </a>
          </div>

          <!-- DEV 2: RALPH CHESTER CANDIDO -->
          <div class="about-dev-card" style="background:var(--surface-2); border:1px solid var(--line); border-radius:10px; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:14px;">
              <img src="https://github.com/RALPH22222.png" alt="RALPH CHESTER CANDIDO" class="dev-pfp" style="border:2px solid rgba(76, 199, 178, 0.55); box-shadow:0 4px 14px rgba(0,0,0,0.4);" loading="lazy">
              <h3 style="font-family:var(--label); font-size:17px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; margin:0; color:#fff;">RALPH CHESTER CANDIDO</h3>
            </div>
            <a href="https://github.com/RALPH22222" target="_blank" rel="noopener noreferrer" class="dev-github-link" style="display:inline-flex; align-items:center; gap:8px; color:var(--fg); text-decoration:none; font-family:var(--label); font-weight:700; font-size:13.5px; letter-spacing:0.06em; padding:7px 14px; background:rgba(255,255,255,0.06); border:1px solid var(--line); border-radius:6px; transition:all 0.2s ease;">
              ${GITHUB_SVG}
              <span>@RALPH22222</span>
              ${icon(ExternalLink, { width: 13, height: 13, 'stroke-width': 2.2 })}
            </a>
          </div>
        </div>
      </section>
    </div>
  `;
}
