"""Original pixel dinosaur icons. Noorullah Adel, 2026. MIT.
Development-only helper; requires Pillow. No third-party artwork or fonts.
"""
from pathlib import Path
import json,subprocess
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
raw=subprocess.check_output(['node','--input-type=module','-e',"import {DINO} from './src/sprites.js';console.log(JSON.stringify(DINO))"],cwd=ROOT,text=True)
pixels=json.loads(raw)
parts=['<rect width="512" height="512" rx="100" fill="#e9eddb"/>']
scale=13;xoff=83;yoff=93
for y,row in enumerate(pixels):
 for x,cell in enumerate(row):
  if cell!=' ':parts.append(f'<rect x="{xoff+x*scale}" y="{yoff+y*scale}" width="{scale}" height="{scale}" fill="'+('#e9eddb' if cell=='.' else '#506952')+'"/>')
parts.extend(['<rect x="226" y="201" width="63" height="14" fill="#d7a24a"/>','<rect x="217" y="215" width="25" height="24" fill="#d7a24a"/>'])
(ROOT/'assets/icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'+''.join(parts)+'</svg>\n')
for name,size in [('icon-192.png',192),('icon-512.png',512),('icon-maskable-512.png',512),('apple-touch-icon.png',180)]:
 factor=4;im=Image.new('RGB',(512*factor,512*factor),'#e9eddb');draw=ImageDraw.Draw(im)
 for y,row in enumerate(pixels):
  for x,cell in enumerate(row):
   if cell!=' ':
    xx=(xoff+x*scale)*factor;yy=(yoff+y*scale)*factor
    draw.rectangle((xx,yy,xx+scale*factor-1,yy+scale*factor-1),fill='#e9eddb' if cell=='.' else '#506952')
 draw.rectangle((226*factor,201*factor,289*factor,215*factor),fill='#d7a24a');draw.rectangle((217*factor,215*factor,242*factor,239*factor),fill='#d7a24a')
 im.resize((size,size),Image.Resampling.LANCZOS).save(ROOT/'assets'/name,optimize=True)
print('Generated original SVG and four PNG dinosaur icons.')
