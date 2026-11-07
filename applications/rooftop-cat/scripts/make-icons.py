"""Original icons. Copyright (c) 2026 Noorullah Adel. MIT. Optional Python/Pillow maintainer tool."""
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
image=Image.new('RGB',(1536,1536),'#f1e5cb');d=ImageDraw.Draw(image)
def box(p):return tuple(int(v*3) for v in p)
def ellipse(p,c):d.ellipse(box(p),fill=c)
def poly(p,c):d.polygon([(int(x*3),int(y*3)) for x,y in p],fill=c)
def line(p,c,w=5):d.line([(int(x*3),int(y*3)) for x,y in p],fill=c,width=w*3,joint='curve')
ellipse((53,49,459,455),'#e5d5b0');poly([(124,265),(119,132),(241,197),(279,198),(391,132),(386,270)],'#d59158');poly([(142,212),(139,161),(197,197)],'#dba28d');poly([(316,200),(370,161),(366,217)],'#dba28d');ellipse((118,159,392,395),'#d59158')
for p in [[(225,170),(234,217)],[(264,170),(263,217)],[(294,173),(285,216)]]:line(p,'#ac6c40',13)
ellipse((190,258,210,288),'#51483d');ellipse((301,258,321,288),'#51483d');ellipse((195,285,261,351),'#f6dcbc');ellipse((249,285,315,351),'#f6dcbc');poly([(240,306),(269,307),(255,324)],'#a16e60')
for p in [[(255,324),(255,337),(249,344),(240,345),(232,337)],[(255,336),(265,345),(273,344),(278,337)],[(163,309),(104,297)],[(162,329),(102,336)],[(348,309),(407,297)],[(349,329),(409,336)]]:line(p,'#675440')
poly([(166,379),(209,396),(258,401),(302,395),(345,378),(334,417),(290,432),(251,438),(211,430),(177,417)],'#668673');poly([(193,405),(168,453),(234,425),(226,398)],'#577c68')
for name,size in [('icon-192.png',192),('icon-512.png',512),('icon-maskable-512.png',512),('apple-touch-icon.png',180)]:image.resize((size,size),Image.Resampling.LANCZOS).save(root/'assets'/name,optimize=True)
print('Created four original PNG icons.')
