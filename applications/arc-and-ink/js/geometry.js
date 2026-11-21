/* Arc & Ink · Noorullah Adel · MIT */
const ArcGeometry = (function makeGeometry(){
  'use strict';
  // Coordinates are in drawing units. Pointer hit areas are handled separately by the view.
  const EPS = 1e-7, MATCH = 1e-5, LIMIT = 60;
  const point = (x, y) => ({x, y});
  const dist = (p,q) => Math.hypot(p.x-q.x, p.y-q.y);
  const mid = (p,q) => point((p.x+q.x)/2, (p.y+q.y)/2);
  const samePoint = (p,q) => !!p && !!q && dist(p,q)<MATCH;
  function line(p,q){
    const length=dist(p,q);
    if(length<EPS) return null;
    let nx=(q.y-p.y)/length, ny=(p.x-q.x)/length;
    if(nx < -EPS || (Math.abs(nx)<=EPS && ny<0)){ nx=-nx; ny=-ny; }
    return {type:'line',nx,ny,k:nx*p.x+ny*p.y};
  }
  function circle(p,q){
    const r=dist(p,q);
    return r<EPS ? null : {type:'circle',x:p.x,y:p.y,r};
  }
  function sameShape(a,b){
    if(!a || !b || a.type!==b.type) return false;
    if(a.type==='circle') return samePoint(a,b) && Math.abs(a.r-b.r)<MATCH;
    const s=a.nx*b.nx+a.ny*b.ny<0?-1:1;
    return Math.hypot(a.nx-s*b.nx,a.ny-s*b.ny)<MATCH && Math.abs(a.k-s*b.k)<MATCH;
  }
  function intersections(a,b){
    if(a.type==='line' && b.type==='line'){
      const d=a.nx*b.ny-a.ny*b.nx;
      if(Math.abs(d)<EPS) return [];
      return [point((a.k*b.ny-a.ny*b.k)/d,(a.nx*b.k-a.k*b.nx)/d)];
    }
    if(a.type==='line' || b.type==='line'){
      const l=a.type==='line'?a:b, c=a.type==='circle'?a:b;
      const offset=l.k-l.nx*c.x-l.ny*c.y;
      if(Math.abs(offset)>c.r+EPS) return [];
      const foot=point(c.x+l.nx*offset,c.y+l.ny*offset);
      const h=Math.sqrt(Math.max(0,c.r*c.r-offset*offset));
      if(h<Math.sqrt(EPS)*0.1) return [foot];
      return [point(foot.x-l.ny*h,foot.y+l.nx*h),point(foot.x+l.ny*h,foot.y-l.nx*h)];
    }
    const d=dist(a,b);
    if(d<EPS || d>a.r+b.r+EPS || d<Math.abs(a.r-b.r)-EPS) return [];
    const ux=(b.x-a.x)/d, uy=(b.y-a.y)/d;
    const t=(a.r*a.r-b.r*b.r+d*d)/(2*d), h=Math.sqrt(Math.max(0,a.r*a.r-t*t));
    const foot=point(a.x+t*ux,a.y+t*uy);
    if(h<Math.sqrt(EPS)*0.1) return [foot];
    return [point(foot.x-uy*h,foot.y+ux*h),point(foot.x+uy*h,foot.y-ux*h)];
  }
  function alphabet(i){
    let label='';
    do {label=String.fromCharCode(65+i%26)+label; i=Math.floor(i/26)-1;} while(i>=0);
    return label;
  }
  function appendPoint(s,p,id,kind){
    const found=s.points.find(q=>samePoint(p,q));
    if(found) return found;
    if(!id){do {id=alphabet(s.serial++);} while(s.ids.has(id));}
    const item={x:p.x,y:p.y,id,kind};
    s.points.push(item); s.ids.add(id); s.byId.set(id,item);
    return item;
  }
  function appendShape(s,obj,given){
    if(!obj || s.shapes.some(old=>sameShape(old,obj))) return false;
    for(const old of s.shapes){
      for(const p of intersections(old,obj)){
        if(Number.isFinite(p.x) && Number.isFinite(p.y)) appendPoint(s,p,null,'crossing');
      }
    }
    s.shapes.push({...obj,given});
    return true;
  }
  function start(puzzle){
    const state={points:[],ids:new Set(),byId:new Map(),shapes:[],pins:new Set(),actions:[],serial:0,free:!!puzzle.free};
    for(const [id,p] of Object.entries(puzzle.given)) appendPoint(state,p,id,'given');
    for(const s of puzzle.shapes) appendShape(state,s,true);
    return state;
  }
  function act(s,action){
    if(!action || typeof action!=='object' || s.actions.length>=LIMIT) return false;
    const {tool,a,b,x,y}=action;
    let canonical;
    if(tool==='point'){
      if(!s.free || !Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x)>1000 || Math.abs(y)>1000 || s.points.some(p=>samePoint(p,{x,y}))) return false;
      appendPoint(s,point(x,y),null,'placed'); canonical={tool,x,y};
    }else{
      const first=s.byId.get(a);
      if(!first) return false;
      if(tool==='pin'){
        if(s.pins.has(a)) return false;
        s.pins.add(a); canonical={tool,a};
      }else{
        const second=s.byId.get(b);
        if(!second || a===b || (tool!=='line' && tool!=='circle')) return false;
        if(!appendShape(s,tool==='line'?line(first,second):circle(first,second),false)) return false;
        canonical={tool,a,b};
      }
    }
    s.actions.push(canonical);
    return true;
  }
  function replay(puzzle,actions){
    const s=start(puzzle);
    if(Array.isArray(actions)) for(const a of actions.slice(0,LIMIT)) if(!act(s,a)) break;
    return s;
  }
  const pin=p=>({type:'pin',x:p.x,y:p.y});
  function hasTarget(s,t){
    if(t.type==='pin') return s.points.some(p=>s.pins.has(p.id) && samePoint(p,t));
    return s.shapes.some(obj=>sameShape(t,obj));
  }
  function progress(s,puzzle){
    if(!puzzle.goals.length) return {done:false,count:0,total:0};
    let best={done:false,count:-1,total:0};
    for(const g of puzzle.goals){
      const count=g.filter(t=>hasTarget(s,t)).length;
      if(count>best.count) best={done:count===g.length,count,total:g.length};
    }
    return best;
  }
  // Daily editions use similarity transforms. Incidence, angles and distance ratios survive them.
  function similarity(angle,scale,mirror,tx,ty){
    const c=Math.cos(angle),s=Math.sin(angle), handed=mirror?-1:1;
    return p=>point(tx+scale*(c*handed*p.x-s*p.y),ty+scale*(s*handed*p.x+c*p.y));
  }
  function transformShape(s,f){
    if(s.type==='pin') return pin(f(s));
    if(s.type==='circle') return circle(f(s),f(point(s.x+s.r,s.y)));
    const p=point(s.nx*s.k,s.ny*s.k);
    return line(f(p),f(point(p.x-s.ny,p.y+s.nx)));
  }
  function reflect(p,l){
    const d=2*(l.k-l.nx*p.x-l.ny*p.y); return point(p.x+d*l.nx,p.y+d*l.ny);
  }
  function bisector(p,q){
    const m=mid(p,q); return line(m,point(m.x+p.y-q.y,m.y+q.x-p.x));
  }
  return {point,dist,mid,line,circle,pin,samePoint,sameShape,intersections,start,act,replay,progress,hasTarget,similarity,transformShape,reflect,bisector,LIMIT};
})();
if (typeof module !== "undefined" && module.exports) module.exports = ArcGeometry;
