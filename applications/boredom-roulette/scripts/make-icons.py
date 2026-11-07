"""Original vector and PNG wheel icons. Noorullah Adel, 2026. MIT.
Optional development helper: requires Pillow. No font or image assets are used.
"""
from pathlib import Path
from math import sin, cos, pi
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
COLORS=['#ffbd98','#b8dfc8','#d9c4ed','#f5df8d','#b8cff4','#efbfd7']
def point(angle,radius):
    return (256+radius*cos((angle-90)*pi/180),256+radius*sin((angle-90)*pi/180))
paths=[]
for i,color in enumerate(COLORS):
    a,b=point(i*60,171),point((i+1)*60,171)
    paths.append(f'<path d="M256 256 L{a[0]:.3f} {a[1]:.3f} A171 171 0 0 1 {b[0]:.3f} {b[1]:.3f}Z" fill="{color}" stroke="#fffefa" stroke-width="5"/>')
star=[point(i*30,43 if i%2==0 else 17) for i in range(12)]
points=' '.join(f'{x:.3f},{y:.3f}' for x,y in star)
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="108" fill="#3243c9"/><circle cx="256" cy="256" r="182" fill="#fffefa"/>'+''.join(paths)+f'<circle cx="256" cy="256" r="74" fill="#fffefa"/><circle cx="256" cy="256" r="62" fill="#3243c9"/><polygon points="{points}" fill="#f5df8d"/></svg>'
(ROOT/'assets/icon.svg').write_text(svg+'\n')
for name,size in [('icon-192.png',192),('icon-512.png',512),('icon-maskable-512.png',512),('apple-touch-icon.png',180)]:
    scale=4
    im=Image.new('RGB',(512*scale,512*scale),'#3243c9');d=ImageDraw.Draw(im)
    def box(r):return tuple(v*scale for v in (256-r,256-r,256+r,256+r))
    d.ellipse(box(182),fill='#fffefa')
    for i,color in enumerate(COLORS):d.pieslice(box(171),i*60-90,(i+1)*60-90,fill=color,outline='#fffefa',width=5*scale)
    d.ellipse(box(74),fill='#fffefa');d.ellipse(box(62),fill='#3243c9');d.polygon([(x*scale,y*scale)for x,y in star],fill='#f5df8d')
    im.resize((size,size),Image.Resampling.LANCZOS).save(ROOT/'assets'/name,optimize=True)
print('Generated original SVG and four PNG icons.')
