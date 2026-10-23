"""Author the four matchmaking emblems as portable SVG. No image model used."""
from pathlib import Path
from math import hypot
import hashlib
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "client/public/ranks"
OUT.mkdir(parents=True, exist_ok=True)

RANKS = [
    ("wolf-spider", "Wolf Spider", "Grave Stalker", ["#fff0c2", "#c69758", "#76502b", "#281e17"], "#cba16b"),
    ("huntsman-spider", "Huntsman Spider", "Nightmare Prowler", ["#effbff", "#a7c4d4", "#526d83", "#1b2735"], "#a9d3e2"),
    ("philippine-tarantula", "Philippine Tarantula", "Hellspawn", ["#fff0bd", "#e5a04e", "#a4482b", "#381a22"], "#f0a25b"),
    ("brown-widow", "Brown Widow", "Death's Empress", ["#fff4c8", "#e6bd63", "#9a652c", "#33202d"], "#f26b76"),
]


def gradient(name, colors, radial=False):
    tag = "radialGradient" if radial else "linearGradient"
    attrs = 'cx="32%" cy="24%" r="78%"' if radial else 'x1="15%" y1="0%" x2="83%" y2="100%"'
    return f'<{tag} id="{name}" {attrs}>' + ''.join(
        f'<stop offset="{i / (len(colors)-1):.3f}" stop-color="{c}"/>'
        for i, c in enumerate(colors)
    ) + f'</{tag}>'


def path(d, fill, extra=""):
    return f'<path d="{d}" fill="{fill}" {extra}/>'


def ellipse(x, y, rx, ry, fill, extra=""):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'


def segment(a, b, width, end_width):
    x, y = a
    ex, ey = b
    length = hypot(ex-x, ey-y)
    assert length > 0
    nx, ny = -(ey-y)/length, (ex-x)/length
    pts = [(x+nx*width, y+ny*width), (ex+nx*end_width, ey+ny*end_width),
           (ex-nx*end_width, ey-ny*end_width), (x-nx*width, y-ny*width)]
    d = 'M' + ' L'.join(f'{px:.2f} {py:.2f}' for px, py in pts) + ' Z'
    return path(d, 'url(#limb)', 'stroke="#18151b" stroke-width="2" stroke-linejoin="round"') + path(
        f'M{x+nx*width*.5:.2f} {y+ny*width*.5:.2f} L{ex+nx*end_width*.4:.2f} {ey+ny*end_width*.4:.2f}',
        'none', 'stroke="url(#edge)" stroke-width="2.2" stroke-linecap="round" opacity=".7"')


def draw(index, slug, name, title, colors, accent):
    light, mid, shade, dark = colors
    body_colors = {
        1: ["#c9ab80", "#806447", "#40332a", "#18171a"],
        2: ["#c5baa0", "#8b806c", "#49443f", "#1a1c22"],
        3: ["#ffca87", "#d17a3d", "#7b3d27", "#281b1c"],
        4: ["#b99a88", "#735044", "#35272b", "#13141c"],
    }[index]
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc" data-codeart="rank-icon" data-anchor="256 256">',
         f'<title id="title">{name} — {title}</title>',
         '<desc id="desc">Code-drawn matchmaking emblem with eight articulated spider legs, shaded carapace and beveled metal frame. Light falls from the upper left.</desc>',
         f'<style>.c-accent{{fill:{accent}}}.c-light{{fill:{light}}}.c-dark{{fill:{dark}}}.c-ink{{fill:#11131b}}</style>',
         '<defs>', gradient('metal', [light, mid, shade, light, mid, dark]),
         gradient('edge', [light, mid, shade]), gradient('enamel', ["#34414b", "#19212c", "#0c1019"], True),
         gradient('body', body_colors, True), gradient('limb', body_colors),
         gradient('gem', ["#fff5db", accent, "#501d31"], True),
         '<filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#020409" flood-opacity=".8"/></filter>',
         '<clipPath id="field"><path d="M256 85 L385 135 L370 306 Q345 365 256 406 Q167 365 142 306 L127 135 Z"/></clipPath>',
         '</defs>']
    # Each promotion adds an unmistakable silhouette change, independent of colour.
    for side in [False, True]:
        s.append('<g' + (' transform="translate(512 0) scale(-1 1)"' if side else '') + '>')
        for feather in range(index - 1):
            x = 108 - feather*22
            y = 170 + feather*32
            s.append(path(f'M142 {y+106} Q{x-16} {y+55} {x-11} {y-32} L{x+21} {y-5} L{x+26} {y+46} L165 {y+119} Z', 'url(#metal)', 'stroke="#15151e" stroke-width="4"'))
            s.append(path(f'M{x-5} {y-19} Q{x+2} {y+57} 150 {y+104}', 'none', f'stroke="{light}" stroke-width="2" opacity=".65"'))
        s.append('</g>')
    shield = 'M256 55 L411 117 L393 311 Q367 387 256 438 Q145 387 119 311 L101 117 Z'
    s += [path(shield, 'url(#metal)', 'stroke="#10131c" stroke-width="6" filter="url(#shadow)"'),
          path('M256 72 L396 126 L380 309 Q354 373 256 422 Q158 373 132 309 L116 126 Z', '#11151e', f'stroke="{dark}" stroke-width="3"'),
          path('M256 85 L385 135 L370 306 Q345 365 256 406 Q167 365 142 306 L127 135 Z', 'url(#enamel)', f'stroke="{mid}" stroke-width="2"'),
          path('M108 119 L256 61 L402 119 M124 310 Q150 381 252 430', 'none', f'stroke="{light}" stroke-width="2" opacity=".7"')]
    s.append('<g clip-path="url(#field)" fill="none" stroke="#9aabb8" stroke-width="1" opacity=".13">')
    for x, y in [(95,90), (256,55), (417,90), (450,240), (408,390), (256,445), (104,390), (62,240)]:
        s.append(f'<path d="M256 247 L{x} {y}"/>')
    for r in [53,92,135,179]:
        s.append(f'<path d="M256 {247-r} Q{256+r*.23} {247-r*.3} {256+r*.7} {247-r*.7} Q{256+r*.45} {247-r*.15} {256+r} 247 Q{256+r*.45} {247+r*.15} {256+r*.7} {247+r*.7} Q{256+r*.23} {247+r*.3} 256 {247+r} Q{256-r*.23} {247+r*.3} {256-r*.7} {247+r*.7} Q{256-r*.45} {247+r*.15} {256-r} 247 Q{256-r*.45} {247-r*.15} {256-r*.7} {247-r*.7} Q{256-r*.23} {247-r*.3} 256 {247-r}"/>')
    s.append('</g>')
    # Four legs per side, with species-specific spread and mass.
    shapes = {
        1: [((238,216),(194,164),(176,115)), ((230,232),(167,209),(133,163)), ((230,250),(168,272),(134,309)), ((239,265),(195,322),(183,368))],
        2: [((238,216),(178,175),(113,158)), ((230,232),(156,220),(103,239)), ((230,250),(163,276),(118,311)), ((239,265),(198,321),(167,363))],
        3: [((235,213),(193,167),(178,123)), ((224,232),(163,214),(138,171)), ((224,253),(169,279),(137,321)), ((238,271),(203,324),(193,368))],
        4: [((239,218),(194,166),(183,111)), ((233,234),(168,208),(126,165)), ((232,251),(167,277),(131,328)), ((241,268),(199,328),(187,378))],
    }[index]
    width = {1:9, 2:8, 3:14, 4:7}[index]
    s.append('<g filter="url(#shadow)">')
    for mirror in [False, True]:
        s.append('<g' + (' transform="translate(512 0) scale(-1 1)"' if mirror else '') + '>')
        for a, b, c in shapes:
            s += [segment(a,b,width,width*.8), ellipse(*b,width*.9,width*.9,'url(#body)'), segment(b,c,width*.75,1.2)]
            if index in (1,3):
                for j in range(1, 8):
                    t=j/9
                    hx=b[0]+(c[0]-b[0])*t
                    hy=b[1]+(c[1]-b[1])*t
                    s.append(path(f'M{hx:.1f} {hy:.1f} l{-width*.8:.1f} -7', 'none', f'stroke="{body_colors[1]}" stroke-width="1.1" opacity=".8"'))
        s.append('</g>')
    # Abdomen behind the thorax; the widow's generous pear shape is intentional.
    rx, ry = {1:(29,49),2:(30,40),3:(43,49),4:(46,57)}[index]
    s += [ellipse(256,286,rx,ry,'url(#body)', 'stroke="#17151a" stroke-width="3"'),
          ellipse(246,271,rx*.45,ry*.45,'#f5ddbe', 'opacity=".07"')]
    if index == 4:
        s.append(path('M239 266 Q256 274 273 266 L260 286 L273 309 Q256 302 239 309 L251 286 Z', 'url(#gem)', 'stroke="#4a222b" stroke-width="1.5"'))
        s.append(path('M233 261 Q237 243 253 238', 'none', 'stroke="#f9e5d4" stroke-width="3" stroke-linecap="round" opacity=".5"'))
    else:
        for j in range(4):
            y=270+j*12
            s.append(path(f'M{256-rx*.65} {y-4} L256 {y+5} L{256+rx*.65} {y-4} L256 {y+12} Z', body_colors[3], 'opacity=".65"'))
        s.append(path('M251 251 Q246 279 254 324 L262 324 Q255 280 261 251 Z', body_colors[1], 'opacity=".6"'))
    s += [ellipse(256,231,35 if index==3 else 28,39,'url(#body)', 'stroke="#17151a" stroke-width="3"'),
          path('M252 198 Q241 219 251 247 L260 247 Q253 217 262 198 Z', body_colors[0], 'opacity=".5"'),
          ellipse(256,202,24,17,'url(#body)', 'stroke="#211a1c" stroke-width="2"')]
    for x, y, r in [(247,198,4),(265,198,4),(238,202,2.5),(274,202,2.5)]:
        s += [ellipse(x,y,r+1,r+1,'#12121a'), ellipse(x,y,r,r,'url(#gem)'), ellipse(x-1,y-1,1,1,'#fff2d5')]
    for flip in [False, True]:
        s.append('<g' + (' transform="translate(512 0) scale(-1 1)"' if flip else '') + '>')
        s += [path('M246 187 Q230 177 240 166 Q240 179 251 180 Z', 'url(#limb)', 'stroke="#20191b" stroke-width="2"'),
              path('M235 204 Q216 200 220 185 Q225 196 237 195 Z', 'url(#limb)', 'stroke="#20191b" stroke-width="2"')]
        s.append('</g>')
    s.append('</g>')
    # Insets and tier marks remain readable when the fine web engraving disappears.
    for x in [131,381]:
        s += [ellipse(x,134,5,5,'url(#edge)'), ellipse(x-1,133,1.5,1.5,light)]
    s.append(path('M213 392 L256 370 L299 392 L256 417 Z','url(#metal)', 'stroke="#11131b" stroke-width="3"'))
    for i in range(index):
        x=256+(i-(index-1)/2)*13
        s.append(path(f'M{x-3} 388 L{x+3} 388 L{x+3} 401 L{x-3} 401 Z', '#23212a'))
    if index == 4:
        s += [path('M211 76 L199 39 L230 56 L256 23 L282 56 L313 39 L301 76 Z', 'url(#metal)', 'stroke="#18151e" stroke-width="4" stroke-linejoin="round"'),
              path('M256 38 L265 56 L256 69 L247 56 Z','url(#gem)', 'stroke="#674b2f" stroke-width="2"')]
    else:
        s.append(path('M256 42 L270 62 L256 81 L242 62 Z','url(#metal)', 'stroke="#18151e" stroke-width="3"'))
    s.append('</svg>')
    svg='\n'.join(s)+'\n'
    parsed=ET.fromstring(svg)
    assert parsed.attrib['viewBox']=='0 0 512 512'
    assert len(shapes)*2==8
    return svg


outputs=[]
for index, (slug, name, title, colors, accent) in enumerate(RANKS, 1):
    svg=draw(index,slug,name,title,colors,accent)
    dest=OUT / f'{slug}.svg'
    dest.write_text(svg,encoding='utf-8')
    outputs.append({'rank':index,'name':name,'title':title,'svg':dest.name,'sha256':hashlib.sha256(svg.encode()).hexdigest()})
(OUT/'codeart-meta.json').write_text(json.dumps({
    'art_source':'code','placeholder':False,'disclosure':'code-drawn, no image model',
    'purpose':'Online matchmaking rank icons; independent of EXP and ability unlocks',
    'source':'art/ranks/build_icons.py','source_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'canvas':[512,512],'background':'transparent','light_direction':'upper left','icons':outputs,
},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'pass','icons':len(outputs),'output':str(OUT)}))
