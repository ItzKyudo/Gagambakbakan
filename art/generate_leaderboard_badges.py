from pathlib import Path
root = Path('client/public/leaderboard-badges')
root.mkdir(parents=True, exist_ok=True)
metals = [('gold', '#e6b75a', '#fff0bb', '#8e642e'), ('silver', '#b6cdd7', '#edfaff', '#607c8d'), ('bronze', '#c38b63', '#f5d2a7', '#78503d')]
for board in ['level', 'rank']:
 for place, (metal, base, light, shade) in enumerate(metals, 1):
  accent, dark = ('#65ddbd', '#153b35') if board == 'level' else ('#ff8e95', '#401f2d')
  style = f'.c-metal{{fill:{base}}}.c-light{{fill:{light}}}.c-shade{{fill:{shade}}}.c-dark{{fill:{dark}}}.c-ink{{fill:#0d1c22}}.c-accent{{fill:{accent}}}.web{{fill:none;stroke:{accent};stroke-width:2}}.legs{{fill:none;stroke:{base};stroke-width:7;stroke-linecap:round;stroke-linejoin:round}}'
  if board == 'level':
   frame = '<circle class="c-shade" cx="128" cy="120" r="100"/><circle class="c-light" cx="128" cy="116" r="96"/><circle class="c-metal" cx="128" cy="120" r="90"/><circle class="c-dark" cx="128" cy="120" r="80"/>'
   motif = '<path class="web" d="M128 40V194M48 120H208M71 63L185 177M71 177L185 63M128 57L173 75L191 120L173 165L128 183L83 165L65 120L83 75ZM128 81L156 92L167 120L156 148L128 159L100 148L89 120L100 92Z"/>'
  else:
   frame = '<path class="c-shade" d="M128 12L225 51L213 145Q192 201 128 236Q64 201 43 145L31 51Z"/><path class="c-light" d="M128 12L225 51L219 67L128 32L37 67L31 51Z"/><path class="c-metal" d="M128 30L208 62L197 141Q181 185 128 217Q75 185 59 141L48 62Z"/><path class="c-dark" d="M128 43L195 70L185 138Q169 176 128 202Q87 176 71 138L61 70Z"/>'
   motif = '<path class="c-accent" d="M70 74L94 91L88 151L75 126ZM186 74L162 91L168 151L181 126Z"/><path class="c-shade" d="M128 50L143 65L128 80L113 65Z"/>'
  crown = '<path class="c-light" d="M91 37L87 15L112 26L128 7L144 26L169 15L165 37Z"/>' if place == 1 else ''
  spider = '<path class="legs" d="M115 106L91 89L83 67M111 116L80 107L64 91M111 128L78 137L64 158M116 139L96 160L94 180M141 106L165 89L173 67M145 116L176 107L192 91M145 128L178 137L192 158M140 139L160 160L162 180"/><ellipse class="c-ink" cx="128" cy="130" rx="23" ry="30"/><ellipse class="c-metal" cx="128" cy="126" rx="17" ry="25"/><path class="c-light" d="M128 103Q111 116 115 133L128 141Z"/><path class="c-accent" d="M128 112L136 126L128 138L120 126Z"/><circle class="c-ink" cx="128" cy="98" r="17"/><circle class="c-metal" cx="128" cy="96" r="12"/><circle class="c-accent" cx="123" cy="94" r="3"/><circle class="c-accent" cx="133" cy="94" r="3"/><path class="c-light" d="M119 103L124 106L122 114L117 108ZM137 103L132 106L134 114L139 108Z"/>'
  ribbon = '<path class="c-shade" d="M65 187L39 209L68 212L76 235L103 214H153L180 235L188 212L217 209L191 187Z"/><path class="c-metal" d="M75 181H181L172 222H84Z"/><path class="c-ink" d="M83 187H173L167 215H89Z"/>'
  numeral = ''.join(f'<path class="c-light" d="M{x} 192H{x+6}V210H{x}Z"/>' for x in range(128 - (place*6+(place-1)*5)//2, 128 + (place*6+(place-1)*5)//2, 11))
  svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" data-codeart="leaderboard-{board}-{place}"><style>{style}</style>{frame}{motif}{spider}{crown}{ribbon}{numeral}</svg>'
  (root / f'{board}-{place}.svg').write_text(svg, encoding='utf-8')
assert len(list(root.glob('*.svg'))) == 6
