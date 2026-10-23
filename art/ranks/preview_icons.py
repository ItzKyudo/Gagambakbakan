"""Package rendered rank icons and review their alpha, margins and UI sizes."""
from pathlib import Path
import json
import shutil
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'art/ranks'
OUT = ROOT / 'client/public/ranks'
meta = json.loads((OUT / 'codeart-meta.json').read_text(encoding='utf-8'))
sheet = Image.new('RGB', (1440, 820), '#0d121b')
draw = ImageDraw.Draw(sheet)
font_path = 'C:/Windows/Fonts/seguisb.ttf'
font = lambda size: ImageFont.truetype(font_path, size)
draw.text((48, 30), 'GAGAMBAKBAKAN / COMPETITIVE RANKS', font=font(26), fill='#f2e7cf')
draw.text((48, 72), 'Shaded metal + enamel  /  Transparent SVG & PNG  /  Independent of EXP', font=font(18), fill='#9daab8')
checks = []
for n, rank in enumerate(meta['icons']):
    slug = Path(rank['svg']).stem
    rendered = ART / 'rendered' / slug
    report = json.loads((rendered / 'codeart-meta.json').read_text(encoding='utf-8'))
    src = rendered / 'base' / f'{slug}.png'
    icon = Image.open(src).convert('RGBA')
    alpha = icon.getchannel('A')
    bounds = alpha.getbbox()
    assert icon.size == (512, 512), (slug, icon.size)
    assert alpha.getextrema() == (0, 255), (slug, 'missing transparent or opaque pixels')
    assert bounds and min(bounds[:2]) > 0 and max(bounds[2:]) < 512, (slug, 'clipped artwork')
    assert report['qa']['status'] == 'pass', (slug, report['qa'])
    shutil.copyfile(src, OUT / f'{slug}.png')
    for size in (64, 128, 256):
        icon.resize((size,size),Image.Resampling.LANCZOS).save(OUT / f'{slug}-{size}.png')
    x = 24 + n*354
    draw.rounded_rectangle((x,120,x+336,790),radius=12,fill='#141c28',outline='#2b3748')
    draw.text((x+20,139),f'0{n+1} / MATCHMAKING',font=font(14),fill='#94a6b8')
    sheet.paste(icon.resize((310,310),Image.Resampling.LANCZOS),(x+13,177),icon.resize((310,310),Image.Resampling.LANCZOS))
    draw.text((x+20,492),rank['name'],font=font(23),fill='#f0e6d3')
    draw.text((x+20,526),rank['title'],font=font(18),fill='#a8b7c9')
    draw.line((x+20,570,x+316,570),fill='#2b3748')
    for dx, size, bg, label in [(20,96,'#0a0e15','96 / DARK'),(124,64,'#e5e7eb','64 / LIGHT'),(228,32,'#303b4c','32 / UI')]:
        bx,by=x+dx,600
        draw.rounded_rectangle((bx,by,bx+96,by+108),radius=7,fill=bg)
        small=icon.resize((size,size),Image.Resampling.LANCZOS)
        sheet.paste(small,(bx+(96-size)//2,by+(108-size)//2),small)
        draw.text((bx,722),label,font=font(12),fill='#94a6b8')
    checks.append({'icon':slug,'status':'pass','size':[512,512],'alpha_bounds':list(bounds),'transparent_background':True,'unclipped':True,'svg_render_qa':'pass'})
sheet.save(ART/'rank-icons-preview.png')
(ART/'export-qa.json').write_text(json.dumps({'status':'pass','checks':checks},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'pass','icons':len(checks),'preview':str(ART/'rank-icons-preview.png')}))
