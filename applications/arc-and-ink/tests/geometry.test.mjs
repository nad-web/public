import test from "node:test";
import G from "../js/geometry.js";
import Atlas from "../js/atlas.js";
(function testSuite(G,Atlas,onTest){
  const {point:p,line:L,circle:C,mid,intersections:cross,dist}=G;
  const eq=(v,msg)=>{if(!v) throw new Error(msg);};
  function complete(level,choice=0,reverse=false){
    const base=Atlas.list.find(l=>l.id===(level.baseId||level.id));
    const f=level.transform||((q)=>q), s=G.start(level);
    function id(q){const match=s.points.find(pt=>G.samePoint(pt,f(q))); eq(match,base.id+' cannot reach '+JSON.stringify(q));return match.id;}
    function draw(tool,a,b){let first=id(a), second=b?id(b):undefined;if(reverse && tool==='line') [first,second]=[second,first];
      eq(G.act(s,{tool,a:first,b:second}),base.id+' rejected '+[tool,first,second].join(' '));}
    const cir=(a,b)=>draw('circle',a,b), lin=(a,b)=>draw('line',a,b);
    function meet(a,b){cir(a,b);cir(b,a);return cross(C(a,b),C(b,a));}
    function bisect(a,b){const [x,y]=meet(a,b);lin(x,y);return G.bisector(a,b);}
    const {A,B,C:V,O,P,T}=base.given;
    switch(base.id){
      case 'seam': {const [x,y]=cross(C(A,B),C(B,A));lin(x,y);break;}
      case 'orbit':cir(A,B);break;
      case 'twins':meet(A,B);break;
      case 'triangle':{const v=meet(A,B)[choice];lin(A,v);lin(B,v);break;}
      case 'midpoint':bisect(A,B);draw('pin',mid(A,B));break;
      case 'mirror':cir(A,P);cir(B,P);draw('pin',G.reflect(P,L(A,B)));break;
      case 'angle':{cir(O,A);const u=dist(O,A)/dist(O,B),q=p(O.x+(B.x-O.x)*u,O.y+(B.y-O.y)*u);const [x,y]=meet(A,q);lin(x,y);break;}
      case 'plumb':cir(A,P);cir(B,P);lin(P,G.reflect(P,L(A,B)));break;
      case 'diameter':bisect(A,B);cir(mid(A,B),A);break;
      case 'touch':{cir(T,O);const e=p(2*T.x-O.x,2*T.y-O.y);bisect(O,e);break;}
      case 'circum':case 'hub':{const l=bisect(A,B),m=bisect(A,V),o=cross(l,m)[0];if(base.id==='hub')draw('pin',o);else cir(o,A);break;}
      case 'parallel':{const q=G.reflect(P,L(A,B)),r=p(2*P.x-q.x,2*P.y-q.y);cir(A,P);cir(B,P);lin(P,q);cir(P,q);bisect(q,r);break;}
      case 'square':{const b=p(2*O.x-A.x,2*O.y-A.y),l=bisect(A,b),[u,v]=cross(l,C(O,A));lin(A,u);lin(u,b);lin(b,v);lin(v,A);break;}
      case 'hex':{const dial=C(O,A);cir(A,O);const [u,v]=cross(dial,C(A,O));const other=(r,skip)=>cross(dial,C(r,O)).find(j=>!G.samePoint(j,skip));cir(u,O);cir(v,O);const m=other(u,A),n=other(v,A);cir(m,O);const back=other(m,u),chain=[A,u,m,back,n,v];chain.forEach((q,i)=>lin(q,chain[(i+1)%6]));break;}
      case 'gate':{bisect(O,P);const center=mid(O,P);cir(center,P);for(const j of cross(C(O,T),C(center,P))) lin(P,j);break;}
      default:throw new Error('Missing route for '+base.id);
    }
    eq(s.actions.length===level.par,base.id+' reference move count');
    eq(G.progress(s,level).done,base.id+' goal not recognized');
    const replayed=G.replay(level,JSON.parse(JSON.stringify(s.actions)));
    eq(G.progress(replayed,level).done,base.id+' replay broke');
    eq(!G.progress(G.replay(level,s.actions.slice(0,-1)),level).done,base.id+' final move is redundant in this route');
    return s;
  }
  for(const l of Atlas.list) onTest(l.title+' is solvable at its stated move target',()=>complete(l));
  onTest('Every chapter starts with an unsolved goal',()=>Atlas.list.forEach(l=>eq(!G.progress(G.start(l),l).done,l.id)));
  onTest('Either equilateral apex and reversed line direction are accepted',()=>complete(Atlas.list[3],1,true));
  onTest('Mismatched triangle apexes do not win',()=>{const l=Atlas.list[3],s=G.start(l);G.act(s,{tool:'circle',a:'A',b:'B'});G.act(s,{tool:'circle',a:'B',b:'A'});const apex=s.points.filter(q=>q.kind==='crossing' && Math.abs(q.y)>1);G.act(s,{tool:'line',a:'A',b:apex[0].id});G.act(s,{tool:'line',a:'B',b:apex[1].id});eq(!G.progress(s,l).done,'mixed apex');});
  onTest('A point between visible pixels is never a puzzle move',()=>{const l=Atlas.list[4],s=G.start(l);eq(!G.act(s,{tool:'point',x:0,y:0}),l.id);eq(!G.act(s,{tool:'pin',a:'missing'}),l.id);});
  onTest('Wrong center, duplicate contributor and near miss are rejected or unsolved',()=>{const l=Atlas.list[1],s=G.start(l);G.act(s,{tool:'circle',a:'B',b:'A'});eq(!G.progress(s,l).done,l.id);eq(!G.act(s,{tool:'circle',a:'B',b:'A'}),'duplicate');eq(!G.sameShape(C(p(0,0),p(1,0)),C(p(.001,0),p(1.001,0))),'tolerance');});
  onTest('Parallel lines and concentric or disjoint circles produce no crossings',()=>{eq(cross(L(p(0,0),p(1,0)),L(p(0,1),p(1,1))).length===0,'parallel');eq(cross(C(p(0,0),p(1,0)),C(p(0,0),p(2,0))).length===0,'concentric');eq(cross(C(p(0,0),p(1,0)),C(p(3,0),p(4,0))).length===0,'apart');});
  onTest('Tangent pairs have exactly one crossing and crossings are deduplicated',()=>{const c=C(p(0,0),p(1,0));eq(cross(c,C(p(2,0),p(3,0))).length===1,'two circles');eq(cross(c,L(p(-1,1),p(1,1))).length===1,'line');const l=Atlas.list[0],s=complete(l);eq(s.points.filter(pt=>pt.y>1).length===1,'same meeting');});
  onTest('Degenerate and unknown tools preserve state',()=>{const s=G.start(Atlas.free);for(const a of [null,{tool:'circle',a:'A',b:'A'},{tool:'line',a:'A',b:'Z'},{tool:'point',x:NaN,y:0},{tool:'bad',a:'A',b:'B'}])eq(!G.act(s,a),'invalid move');eq(!s.actions.length,'action history');});
  onTest('Free notebook accepts original points and caps work at the stated move limit',()=>{const s=G.start(Atlas.free);for(let i=0;i<G.LIMIT;i++)eq(G.act(s,{tool:'point',x:i,y:2}),String(i));eq(!G.act(s,{tool:'point',x:99,y:2}),'limit');eq(!G.progress(s,Atlas.free).done,'free mode');});
  onTest('An invalid stored tail preserves the safe replay prefix',()=>{const l=Atlas.list[2],s=G.replay(l,[{tool:'circle',a:'A',b:'B'},{tool:'invalid'},{tool:'circle',a:'B',b:'A'}]);eq(s.actions.length===1,'tail');});
  onTest('UTC daily variants repeat for the same date and change across dates',()=>{const a=Atlas.daily('2026-11-21'),b=Atlas.daily('2026-11-21'),c=Atlas.daily('2026-11-22');eq(JSON.stringify(a.given)===JSON.stringify(b.given),'unstable');eq(JSON.stringify(a.given)!==JSON.stringify(c.given),'unchanged');});
  onTest('All thirteen eligible daily experiments have solvable transformed versions',()=>{const ids=new Set();for(let i=0;i<126;i++){const d=new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10),l=Atlas.daily(d);complete(l,i%2,!!(i%2));ids.add(l.baseId);}eq(ids.size===13,'daily coverage '+ids.size);});
})(G,Atlas,test);
