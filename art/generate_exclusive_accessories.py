from pathlib import Path
import json

root = Path('client/public/exclusive-accessories')
root.mkdir(parents=True, exist_ok=True)
art_dir = Path('art/exclusive-accessories')
art_dir.mkdir(parents=True, exist_ok=True)

# 1. Apex Champion Crown SVG (256x256 codeart portable SVG)
crown_style = """
.c-gold { fill: #ffd34d; stroke: #1e272e; stroke-width: 3.5; stroke-linejoin: round; stroke-linecap: round; }
.c-gold-dark { fill: #e1b12c; stroke: #1e272e; stroke-width: 2.5; stroke-linejoin: round; }
.c-velvet { fill: #991b1b; stroke: #1e272e; stroke-width: 3; stroke-linejoin: round; }
.c-velvet-light { fill: #dc2626; }
.c-pearl { fill: #fffdf0; stroke: #1e272e; stroke-width: 2.2; }
.c-pearl-shine { fill: #ffffff; }
.c-ruby { fill: #ff2d55; stroke: #800e13; stroke-width: 2; stroke-linejoin: round; }
.c-ruby-light { fill: #ff7675; }
.c-gem-blue { fill: #0984e3; stroke: #1e272e; stroke-width: 1.8; }
.c-gem-green { fill: #2ed573; stroke: #1e272e; stroke-width: 1.8; }
.c-shine { fill: #ffffff; opacity: 0.9; }
.c-aura { fill: none; stroke: #ffeaa7; stroke-width: 3; stroke-dasharray: 6 5; opacity: 0.6; }
"""

apex_crown_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" data-codeart="exclusive-apex-crown">
<style>{crown_style}</style>
<defs>
  <filter id="crown-glow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#ffd34d" flood-opacity="0.45"/>
  </filter>
</defs>
<g filter="url(#crown-glow)">
  <!-- Radiant Aura -->
  <path class="c-aura" d="M38 175 Q128 140 218 175" />
  
  <!-- Velvet Cap Arch -->
  <path class="c-velvet" d="M48 184 Q128 128 208 184 L202 198 Q128 152 54 198 Z" />
  <path class="c-velvet-light" d="M72 178 Q128 142 184 178 Q128 152 72 178 Z" />

  <!-- Imperial 5-Spire Golden Body -->
  <path class="c-gold" d="M42 188 L34 94 L82 136 L128 54 L174 136 L222 94 L214 188 Z" />
  
  <!-- Inner Spires Facet / Depth Shadows -->
  <polygon class="c-gold-dark" points="128,54 82,136 128,154 174,136" />
  <polygon class="c-gold-dark" points="34,94 56,150 82,136" />
  <polygon class="c-gold-dark" points="222,94 200,150 174,136" />

  <!-- Diadem Base Band -->
  <rect class="c-gold" x="38" y="184" width="180" height="26" rx="10" />
  <rect class="c-gold-dark" x="44" y="190" width="168" height="14" rx="6" />

  <!-- Brow Gemstones -->
  <circle class="c-gem-blue" cx="64" cy="197" r="5.5" />
  <circle class="c-ruby" cx="96" cy="197" r="5.5" />
  <polygon class="c-ruby" points="128,189 135,197 128,205 121,197" />
  <circle class="c-ruby" cx="160" cy="197" r="5.5" />
  <circle class="c-gem-green" cx="192" cy="197" r="5.5" />

  <!-- Central Regal Star Ruby -->
  <polygon class="c-ruby" points="128,102 144,124 128,146 112,124" />
  <polygon class="c-ruby-light" points="128,107 139,124 128,124" />
  <circle class="c-pearl-shine" cx="125" cy="116" r="2.5" />

  <!-- Flanking Accent Gems -->
  <circle class="c-gem-blue" cx="82" cy="150" r="6" />
  <circle class="c-shine" cx="80" cy="148" r="2" />
  <circle class="c-gem-green" cx="174" cy="150" r="6" />
  <circle class="c-shine" cx="172" cy="148" r="2" />

  <!-- Spires Celestial Pearls -->
  <circle class="c-pearl" cx="34" cy="90" r="10" />
  <circle class="c-pearl-shine" cx="31" cy="87" r="3.5" />

  <circle class="c-pearl" cx="82" cy="132" r="7.5" />
  <circle class="c-pearl-shine" cx="80" cy="130" r="2.5" />

  <circle class="c-pearl" cx="174" cy="132" r="7.5" />
  <circle class="c-pearl-shine" cx="172" cy="130" r="2.5" />

  <circle class="c-pearl" cx="222" cy="90" r="10" />
  <circle class="c-pearl-shine" cx="219" cy="87" r="3.5" />

  <!-- Apex Cross Finial & Grand Pearl -->
  <circle class="c-pearl" cx="128" cy="46" r="12" />
  <circle class="c-pearl-shine" cx="124" cy="42" r="4.2" />
  <path class="c-gold" d="M124 18 H132 V36 H124 Z M116 23 H140 V29 H116 Z" />
  <polygon points="128,12 131,18 128,20 125,18" fill="#ffffff" />
</g>
</svg>"""

# 2. Mythic Laurel Wreath SVG (256x256 codeart portable SVG)
laurel_style = """
.l-gold { fill: #ffd34d; stroke: #1e272e; stroke-width: 3.5; stroke-linejoin: round; }
.l-gold-light { fill: #fff0bb; stroke: #1e272e; stroke-width: 2; stroke-linejoin: round; }
.l-gold-dark { fill: #d4a017; stroke: #1e272e; stroke-width: 2.2; stroke-linejoin: round; }
.l-branch { fill: none; stroke: #1e272e; stroke-width: 8; stroke-linecap: round; }
.l-branch-core { fill: none; stroke: #ffd34d; stroke-width: 5; stroke-linecap: round; }
.l-emerald { fill: #00cec9; stroke: #1e272e; stroke-width: 2.5; stroke-linejoin: round; }
.l-emerald-light { fill: #81ecec; }
.l-star { fill: #ffffff; }
.l-mote { fill: #ffeaa7; stroke: #1e272e; stroke-width: 1.5; }
"""

mythic_laurel_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" data-codeart="exclusive-mythic-laurel">
<style>{laurel_style}</style>
<defs>
  <filter id="laurel-glow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#00cec9" flood-opacity="0.4"/>
  </filter>
</defs>
<g filter="url(#laurel-glow)">
  <!-- Floating Celestial Stardust Motes -->
  <circle class="l-mote" cx="128" cy="42" r="5" />
  <circle class="l-mote" cx="96" cy="54" r="3.5" />
  <circle class="l-mote" cx="160" cy="54" r="3.5" />
  <circle class="l-mote" cx="128" cy="62" r="3" />

  <!-- Outer Branch Stems -->
  <path class="l-branch" d="M60 210 C34 140 50 78 116 52" />
  <path class="l-branch-core" d="M60 210 C34 140 50 78 116 52" />

  <path class="l-branch" d="M196 210 C222 140 206 78 140 52" />
  <path class="l-branch-core" d="M196 210 C222 140 206 78 140 52" />

  <!-- Left Laurel Leaves -->
  <!-- Low Leaf 1 -->
  <path class="l-gold" d="M62 204 C40 196 36 172 58 174 C66 186 68 196 62 204 Z" />
  <path class="l-gold-light" d="M62 204 C46 196 44 178 58 174 Z" />
  <!-- Low Leaf 2 -->
  <path class="l-gold-dark" d="M64 192 C76 170 94 176 86 194 C76 198 68 196 64 192 Z" />

  <!-- Mid Leaf 3 -->
  <path class="l-gold" d="M46 160 C24 148 24 124 46 128 C54 140 54 152 46 160 Z" />
  <path class="l-gold-light" d="M46 160 C32 150 32 132 46 128 Z" />
  <!-- Mid Leaf 4 -->
  <path class="l-gold-dark" d="M52 144 C68 126 84 134 74 152 C64 154 56 150 52 144 Z" />

  <!-- Upper Leaf 5 -->
  <path class="l-gold" d="M48 114 C32 94 40 72 60 82 C64 96 60 106 48 114 Z" />
  <path class="l-gold-light" d="M48 114 C38 100 44 82 60 82 Z" />
  <!-- Upper Leaf 6 -->
  <path class="l-gold-dark" d="M62 98 C80 84 94 96 82 112 C72 112 66 106 62 98 Z" />

  <!-- Apex Leaf Left -->
  <path class="l-gold" d="M78 72 C70 48 90 38 106 54 C102 66 92 74 78 72 Z" />
  <path class="l-gold-light" d="M78 72 C74 56 86 46 106 54 Z" />

  <!-- Right Laurel Leaves -->
  <!-- Low Leaf 1 -->
  <path class="l-gold" d="M194 204 C216 196 220 172 198 174 C190 186 188 196 194 204 Z" />
  <path class="l-gold-light" d="M194 204 C210 196 212 178 198 174 Z" />
  <!-- Low Leaf 2 -->
  <path class="l-gold-dark" d="M192 192 C180 170 162 176 170 194 C180 198 188 196 192 192 Z" />

  <!-- Mid Leaf 3 -->
  <path class="l-gold" d="M210 160 C232 148 232 124 210 128 C202 140 202 152 210 160 Z" />
  <path class="l-gold-light" d="M210 160 C224 150 224 132 210 128 Z" />
  <!-- Mid Leaf 4 -->
  <path class="l-gold-dark" d="M204 144 C188 126 172 134 182 152 C192 154 200 150 204 144 Z" />

  <!-- Upper Leaf 5 -->
  <path class="l-gold" d="M208 114 C224 94 216 72 196 82 C192 96 196 106 208 114 Z" />
  <path class="l-gold-light" d="M208 114 C218 100 212 82 196 82 Z" />
  <!-- Upper Leaf 6 -->
  <path class="l-gold-dark" d="M194 98 C176 84 162 96 174 112 C184 112 190 106 194 98 Z" />

  <!-- Apex Leaf Right -->
  <path class="l-gold" d="M178 72 C186 48 166 38 150 54 C154 66 164 74 178 72 Z" />
  <path class="l-gold-light" d="M178 72 C182 56 170 46 150 54 Z" />

  <!-- Center Grand Brooch Clasp -->
  <circle class="l-gold" cx="128" cy="180" r="18" />
  <polygon class="l-emerald" points="128,166 139,180 128,194 117,180" />
  <polygon class="l-emerald-light" points="128,170 135,180 128,180" />
  <circle class="l-star" cx="125" cy="176" r="2.5" />

  <!-- Gold Laurel Filigree Ribbons -->
  <path class="l-gold-dark" d="M116 192 L100 218 L114 214 L120 226 L124 196 Z" />
  <path class="l-gold-dark" d="M140 192 L156 218 L142 214 L136 226 L132 196 Z" />
</g>
</svg>"""

(root / 'apex-crown.svg').write_text(apex_crown_svg, encoding='utf-8')
(root / 'mythic-laurel.svg').write_text(mythic_laurel_svg, encoding='utf-8')
(art_dir / 'apex-crown.svg').write_text(apex_crown_svg, encoding='utf-8')
(art_dir / 'mythic-laurel.svg').write_text(mythic_laurel_svg, encoding='utf-8')

meta = {
  "schema": "codeart.metadata.v1",
  "art_source": "code",
  "disclose": "code-drawn, no image model",
  "artifacts": [
    {
      "name": "apex-crown",
      "file": "client/public/exclusive-accessories/apex-crown.svg",
      "format": "portable-svg",
      "exclusive_for": "Top 1 Rank & Top 1 Level Leaderboard Champions",
      "palette": ["#ffd34d", "#e1b12c", "#991b1b", "#ff2d55", "#0984e3", "#2ed573", "#ffffff"]
    },
    {
      "name": "mythic-laurel",
      "file": "client/public/exclusive-accessories/mythic-laurel.svg",
      "format": "portable-svg",
      "exclusive_for": "Top 1 Level Leaderboard Legend",
      "palette": ["#ffd34d", "#fff0bb", "#d4a017", "#00cec9", "#81ecec", "#ffffff", "#ffeaa7"]
    }
  ]
}

(art_dir / 'codeart-meta.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
print("Successfully generated codeart2d exclusive accessories SVGs and metadata.")

