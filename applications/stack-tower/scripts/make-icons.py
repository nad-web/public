from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
KIND="stack"
def make(size):
    im=Image.new("RGB",(512,512),"#f4efff" if KIND=="word" else "#101522")
    d=ImageDraw.Draw(im)
    if KIND=="word":
        d.rounded_rectangle((98,111,285,307),radius=30,fill="#7650d3")
        d.rounded_rectangle((237,205,413,397),radius=30,fill="#dcf892")
        d.line([(128,151),(147,259),(183,205),(218,259),(242,151)],fill="white",width=13,joint="curve")
        d.line([(365,243),(300,243),(284,263),(295,285),(347,306),(365,328),(351,350),(285,350)],fill="#28223f",width=12,joint="curve")
    else:
        for cx,cy,color,left,right in [(256,325,"#549dc9","#326c99","#3e7eab"),(266,250,"#71d4c9","#3e9795","#53b8ab"),(246,175,"#efac69","#bb7c52","#d99762")]:
            d.polygon([(cx-125,cy),(cx,cy+65),(cx,cy+105),(cx-125,cy+40)],fill=left)
            d.polygon([(cx,cy+65),(cx+125,cy),(cx+125,cy+40),(cx,cy+105)],fill=right)
            d.polygon([(cx,cy-65),(cx+125,cy),(cx,cy+65),(cx-125,cy)],fill=color)
    return im.resize((size,size),Image.Resampling.LANCZOS)
for name,size in [("icon-192.png",192),("icon-512.png",512),("icon-maskable-512.png",512),("apple-touch-icon.png",180)]:make(size).save(ROOT/"assets"/name)
