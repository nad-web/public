/* Arc & Ink · Noorullah Adel · MIT */
(function playArcInk(G, Atlas){
  'use strict';
  const app=document.getElementById('arc-game');
  if(!app || app.dataset.ready) return;
  app.dataset.ready='yes';
  const $=id=>app.querySelector('#'+id), board=$('board'), box=$('board-wrap');
  const copyIcon=id=>{const e=$(id);return e?e.querySelector('svg').outerHTML:'';};
  const hintIcon=copyIcon('hint'), bookIcon=copyIcon('atlas-open');
  const ui={points:true,sound:false};
  const here=location.pathname.replace(/(?:index\.html)?$/,'').replace(/\/?$/,'/');
  const key='noorullah:arc-and-ink:v1:'+here+':';
  const memory=new Map(), unsaved=new Set();
  let savedOK=true;
  function read(k,otherwise){if(unsaved.has(k))return memory.get(k)??otherwise;try{const raw=localStorage.getItem(key+k);return raw===null?(memory.get(k)??otherwise):JSON.parse(raw);}catch(_){return memory.get(k)??otherwise;}}
  function write(k,v){memory.set(k,v);try{localStorage.setItem(key+k,JSON.stringify(v));unsaved.delete(k);return true;}catch(_){unsaved.add(k);if(savedOK){savedOK=false;notify('Browser storage is unavailable. This visit still keeps your drawings.');}return false;}}
  const settings=read('settings',{});if(settings && typeof settings==='object'){ui.sound=settings.sound===true;ui.points=settings.points!==false;}
  const today=()=>new Date().toISOString().slice(0,10);
  function pickPuzzle(id){
    if(id==='free') return Atlas.free;
    if(id==='daily-'+today()) return Atlas.daily(today());
    return Atlas.list.find(p=>p.id===id)||Atlas.list[0];
  }
  let puzzle, state, moves=[], cursor=0, hints=0, tool='line', first=null, hover=null, hoverWorld=null;
  let camera={x:0,y:0,zoom:1}, frame=null, paintPending=false, completed=false;
  let review=null;
  let modal='',sourceFocus=null, timer=0, pointer=null, suppressClickUntil=0, patchStatus='';
  let audio=null, offlineText='Checking offline availability…', focusView=false;
  const levelsById=new Map(Atlas.list.map(l=>[l.id,l]));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const trackKey=p=>p.date?'daily-drawing':'drawing-'+p.id;
  const scoreKey=p=>p.date?'daily-score-'+p.date:'score-'+p.id;
  function records(p){
    const r=read(scoreKey(p),{});return {best:Number.isInteger(r?.best)&&r.best>0?r.best:null,solo:r?.solo===true};
  }
  function recordWin(){
    const old=records(puzzle);
    write(scoreKey(puzzle),{best:Math.min(old.best??Infinity,cursor),solo:old.solo||!hints});
  }
  function totals(){return Atlas.list.filter(l=>records(l).best!==null).length;}
  function persist(){write(trackKey(puzzle),{id:puzzle.id,moves,cursor,hints,camera});}
  function loadPuzzle(p){
    closeDialog(false);
    review=null;puzzle=p; const raw=read(trackKey(p),null), old=raw?.id===p.id?raw:null;
    moves=G.replay(p,old?.moves).actions;
    cursor=Number.isInteger(old?.cursor)?Math.max(0,Math.min(moves.length,old.cursor)):moves.length;
    hints=Math.max(0,Math.min(p.hints.length,Number.isInteger(old?.hints)?old.hints:0));
    camera={x:0,y:0,zoom:1};const v=old?.camera;
    if(v && Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.zoom))camera={x:limitCenter(v.x),y:limitCenter(v.y),zoom:Math.max(.3,Math.min(8,v.zoom))};
    state=G.replay(p,moves.slice(0,cursor));tool=p.tool;first=null;hover=null;hoverWorld=null;patchStatus='';
    completed=G.progress(state,p).done;
    write('last',p.id); update();
  }
  function limitCenter(x){return Math.max(-1000,Math.min(1000,x));}
  function notify(msg){
    const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{t.hidden=true;},3100);
  }
  function tone(win=false){
    if(!ui.sound)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC) return;
      if(!audio)audio=new AC();
      const emit=()=>{if(!ui.sound||audio.state==='closed')return;
        const t=audio.currentTime;const notes=win?[440,554.37,659.25]:[tool==='circle'?392:523.25];
        notes.forEach((f,i)=>{const osc=audio.createOscillator(),gain=audio.createGain(),start=t+.085*i;
          osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.055,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.15);osc.connect(gain);gain.connect(audio.destination);osc.start(start);osc.stop(start+.16);});
      };
      if(audio.state==='suspended')audio.resume().then(emit).catch(()=>{});else emit();
    }catch(_){}
  }
  function action(act){
    if(review!==null)return;
    if(!G.act(state,act)){patchStatus=cursor>=G.LIMIT?'Move limit reached. Undo or restart this drawing.':act.tool==='pin'?'That point already carries a pin.':'That construction already exists. Try another pair.';update();return;}
    moves=moves.slice(0,cursor);moves.push(state.actions[state.actions.length-1]);cursor=moves.length;first=null;hover=null;hoverWorld=null;patchStatus='';
    const won=G.progress(state,puzzle).done;
    const newly=won&&!completed;completed=won;
    if(newly)recordWin();
    persist();update();tone(newly);
    if(newly)showProof();
  }
  function choose(id){
    if(review!==null)return;
    const pt=state.byId.get(id);if(!pt)return;
    if(tool==='pin'){action({tool:'pin',a:id});return;}
    if(tool==='point'){notify('Choose empty paper for a new point, or switch to an instrument.');return;}
    if(first===id){first=null;patchStatus='Selection cleared.';update();return;}
    if(!first){first=id;patchStatus='';update();return;}
    const start=first;first=null;action({tool,a:start,b:id});
  }
  function setTool(t){if(review!==null)return;if(!['line','circle','pin','point'].includes(t)||(t==='point'&&!puzzle.free))return;
    tool=t;first=null;hover=null;hoverWorld=null;patchStatus='';update();}
  function undoRedo(change){
    if(review!==null){setStep(review+change);return;}
    if(change<0 && first){first=null;hover=null;patchStatus='Selection cleared.';update();return;}
    const n=cursor+change;if(n<0||n>moves.length)return;
    cursor=n;first=null;hover=null;hoverWorld=null;state=G.replay(puzzle,moves.slice(0,cursor));completed=G.progress(state,puzzle).done;
    patchStatus=completed?'Construction complete. Open the proof for the reasoning.':'';
    persist();update();
  }
  function promptText(){
    if(review!==null){if(!review)return 'Replay · These are the given marks.';const a=moves[review-1];return 'Replay · '+(a.tool==='line'?'Line through '+a.a+' and '+a.b:a.tool==='circle'?'Circle at '+a.a+' through '+a.b:a.tool==='pin'?'Pinned '+a.a:'Placed a new point')+'.';}
    if(patchStatus)return patchStatus;
    if(completed) return 'Construction complete. Open the proof to review it.';
    if(tool==='point')return 'Point · Tap empty paper to plant a point.';
    if(tool==='pin')return 'Pin · Select the exact point you want to mark.';
    if(tool==='circle')return first?'Center '+first+' · Choose a point on the rim.':'Compass · Choose the center point.';
    return first?'Through '+first+' · Choose a second point.':'Straightedge · Choose the first point.';
  }
  function update(){
    if(!puzzle)return;
    $('chapter').textContent=puzzle.chapter;
    $('number').textContent=puzzle.free?'Open notebook':puzzle.date?'Daily edition · '+puzzle.date:'Experiment '+String(puzzle.index+1).padStart(2,'0')+' / '+Atlas.list.length;
    $('title').textContent=puzzle.title;$('brief').textContent=puzzle.brief;
    $('moves').textContent=cursor;$('par').textContent=puzzle.par||'—';$('best').textContent=puzzle.free?'—':records(puzzle).best??'—';
    const solved=totals();$('book-count').textContent=solved+' / '+Atlas.list.length;$('book-bar').style.width=(solved*100/Atlas.list.length)+'%';
    const g=G.progress(state,puzzle);
    $('instruments').hidden=review!==null;$('trace-row').hidden=review===null;$('point-list').disabled=review!==null;
    $('trace-prev').disabled=!review;$('trace-next').disabled=review===cursor;$('trace-count').textContent=review===null?'':review+' / '+cursor;
    $('goal-count').textContent=(review??cursor)+' '+(cursor===1?'move':'moves')+(puzzle.free?'':g.total>1?' · '+g.count+'/'+g.total:' · target '+puzzle.par);
    $('hint').innerHTML=(puzzle.free||completed?bookIcon:hintIcon)+'<span>'+(puzzle.free?'Notebook':completed?'Open proof':hints?'Hints ('+hints+')':'Open a hint')+'</span>';
    $('instruction').textContent=promptText();$('undo').disabled=!cursor && !first;$('redo').disabled=cursor>=moves.length;
    app.querySelectorAll('[data-tool]').forEach(b=>{const t=b.dataset.tool;b.hidden=t==='point'&&!puzzle.free;b.setAttribute('aria-pressed',String(tool===t));});
    for(const [id,active] of [['atlas-open',!puzzle.date&&!puzzle.free],['daily-open',!!puzzle.date],['free-open',!!puzzle.free]]){
      if(active)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');
    }
    $('plus').disabled=camera.zoom>=8;$('minus').disabled=camera.zoom<=.3;
    schedule();
  }
  function schedule(){if(paintPending)return;paintPending=true;(window.requestAnimationFrame||((f)=>setTimeout(f,16)))(()=>{paintPending=false;draw();});}
  function dimensions(){
    const r=board.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),margin=Math.min(26,w*.06,h*.08);
    const scale=Math.max(.0001,Math.min((w-2*margin)/(2*puzzle.view[0]),(h-2*margin)/(2*puzzle.view[1]))*camera.zoom);
    return {w,h,scale,x:q=>w/2+(q.x-camera.x)*scale,y:q=>h/2-(q.y-camera.y)*scale,
      inverse:(x,y)=>({x:camera.x+(x-w/2)/scale,y:camera.y-(y-h/2)/scale})};
  }
  const fmt=n=>Number(n.toFixed(3));
  function lineEnds(l,f){
    const center={x:camera.x,y:camera.y},d=l.k-l.nx*center.x-l.ny*center.y;
    const foot={x:center.x+d*l.nx,y:center.y+d*l.ny},reach=Math.hypot(f.w,f.h)/f.scale;
    return [{x:foot.x-l.ny*reach,y:foot.y+l.nx*reach},{x:foot.x+l.ny*reach,y:foot.y-l.nx*reach}];
  }
  function shapeSVG(s,f,color,width,fill='none',dash=''){
    const paint=' stroke="'+color+'" stroke-width="'+width+'" fill="'+fill+'"'+(dash?' stroke-dasharray="'+dash+'"':'');
    if(s.type==='circle')return '<circle cx="'+fmt(f.x(s))+'" cy="'+fmt(f.y(s))+'" r="'+fmt(s.r*f.scale)+'"'+paint+'/>';
    const [a,b]=lineEnds(s,f);return '<line x1="'+fmt(f.x(a))+'" y1="'+fmt(f.y(a))+'" x2="'+fmt(f.x(b))+'" y2="'+fmt(f.y(b))+'"'+paint+'/>';
  }
  function visiblePoints(f,pad=7){return state.points.filter(p=>f.x(p)>-pad&&f.x(p)<f.w+pad&&f.y(p)>-pad&&f.y(p)<f.h+pad);}
  function draw(){
    if(!puzzle)return;
    const f=dimensions();frame=f;board.setAttribute('viewBox','0 0 '+f.w+' '+f.h);
    const w=fmt(f.w),h=fmt(f.h);let gap=f.scale*.25;while(gap<13)gap*=2;while(gap>29)gap/=2;
    const gx=fmt((f.w/2-camera.x*f.scale)%(gap*4)),gy=fmt((f.h/2+camera.y*f.scale)%(gap*4));
    const parts=['<title>'+esc(puzzle.title)+'</title><desc>'+esc(puzzle.brief)+' Choose Points for a labeled list.</desc>'];
    parts.push('<defs><pattern id="ink-minor" x="'+gx+'" y="'+gy+'" width="'+gap+'" height="'+gap+'" patternUnits="userSpaceOnUse"><path d="M '+gap+' 0 H 0 V '+gap+'" fill="none" stroke="#31475c" stroke-width=".7"/></pattern><pattern id="ink-major" x="'+gx+'" y="'+gy+'" width="'+(gap*4)+'" height="'+(gap*4)+'" patternUnits="userSpaceOnUse"><path d="M '+(gap*4)+' 0 H 0 V '+(gap*4)+'" fill="none" stroke="#3b5368" stroke-width=".8"/></pattern></defs>');
    parts.push('<rect width="'+w+'" height="'+h+'" fill="#192d42"/><rect width="'+w+'" height="'+h+'" fill="url(#ink-minor)"/><rect width="'+w+'" height="'+h+'" fill="url(#ink-major)"/>');
    let n=0;
    for(const s of state.shapes){
      const circle=s.type==='circle',color=s.given?(circle?(n%2?'#a8dacd':'#9bc3e3'):'#b1c3cb'):(circle?'#efbd78':'#ffd392');
      const fill=s.given&&circle?(n%2?'rgba(111,188,163,.07)':'rgba(114,163,207,.08)'):'none';
      parts.push(shapeSVG(s,f,color,s.given?1.6:2.2,fill));if(s.given&&circle)n++;
    }
    if(first&&(hover||hoverWorld)&&(tool==='line'||tool==='circle')){
      const q=state.byId.get(first),b=state.byId.get(hover)||hoverWorld;
      if(q&&b){const draft=tool==='line'?G.line(q,b):G.circle(q,b);if(draft)parts.push(shapeSVG(draft,f,'#f3dcb2',1.3,'none','5 5'));}
    }
    const placedLabels=[];
    for(const q of visiblePoints(f,8)){
      const x=fmt(f.x(q)),y=fmt(f.y(q)),isSeed=q.kind==='given',marked=state.pins.has(q.id),active=q.id===first||q.id===hover;
      if(active||marked)parts.push('<circle cx="'+x+'" cy="'+y+'" r="'+(active?12:10)+'" stroke="'+(marked?'#ade4bc':'#ffd392')+'" stroke-width="1.8" fill="none"/>');
      if(isSeed)parts.push('<circle cx="'+x+'" cy="'+y+'" r="5.1" fill="#f1ddaf" stroke="#15293c" stroke-width="1.8"/>');
      else parts.push('<circle cx="'+x+'" cy="'+y+'" r="4.1" fill="'+(marked?'#a8ddbe':'#192d42')+'" stroke="'+(marked?'#a8ddbe':'#f3d4a0')+'" stroke-width="1.8"/>');
      if(ui.points||active||marked){
        const labelW=q.id.length*9+4;
        let lx=Math.min(f.w-labelW-2,Math.max(3,x+10)),ly=Math.max(14,Math.min(f.h-4,y-10));
        const overlaps=placedLabels.some(v=>Math.abs(v.x-lx)<labelW+2 && Math.abs(v.y-ly)<14);
        if(overlaps&&!active&&!isSeed&&!marked)continue;
        placedLabels.push({x:lx,y:ly});
        parts.push('<text x="'+lx+'" y="'+ly+'" fill="'+(isSeed?'#f2e7cc':'#e1ebe7')+'" stroke="#192d42" stroke-width="3" paint-order="stroke" font-family="ui-monospace,monospace" font-weight="600" font-size="13">'+esc(q.id)+'</text>');
      }
    }
    board.innerHTML=parts.join('');
  }
  function pointAt(e){
    const f=dimensions(),r=board.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    let best=null,distance=e.pointerType==='mouse'?14:23;
    for(const q of visiblePoints(f)){
      const d=Math.hypot(f.x(q)-x,f.y(q)-y);if(d<=distance){best=q;distance=d;}
    }
    return {hit:best,pos:f.inverse(x,y)};
  }
  function zoom(mult){camera.zoom=Math.min(8,Math.max(.3,camera.zoom*mult));hover=hoverWorld=null;persist();update();}
  function fit(){camera={x:0,y:0,zoom:1};hover=hoverWorld=null;persist();update();}
  function boardTap(e){
    if(review!==null)return;
    const {hit,pos}=pointAt(e);
    if(hit){choose(hit.id);return;}
    if(tool==='point'&&puzzle.free){action({tool:'point',x:pos.x,y:pos.y});return;}
    if(cursor>=G.LIMIT){notify('Undo a move or restart this drawing.');return;}
    notify('Choose a marked dot. Drag the paper to pan, or use Points to select by name.');
  }
  if(window.PointerEvent){
    board.addEventListener('pointerdown',e=>{
      if(pointer||e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,scale:dimensions().scale,dragged:false};
      try{board.setPointerCapture(e.pointerId);}catch(_){}
    });
    board.addEventListener('pointermove',e=>{
      if(pointer&&pointer.id===e.pointerId){
        const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
        if(Math.hypot(dx,dy)>7)pointer.dragged=true;
        if(pointer.dragged){camera.x=limitCenter(pointer.cx-dx/pointer.scale);camera.y=limitCenter(pointer.cy+dy/pointer.scale);hover=hoverWorld=null;schedule();}
      }else if(e.pointerType==='mouse'){const q=pointAt(e);hover=q.hit?.id||null;hoverWorld=q.pos;schedule();}
    });
    board.addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;const moved=pointer.dragged;pointer=null;suppressClickUntil=Date.now()+550;if(!moved)boardTap(e);else persist();});
    board.addEventListener('pointercancel',()=>{pointer=null;hover=hoverWorld=null;schedule();});
    board.addEventListener('lostpointercapture',()=>{if(pointer?.dragged)persist();pointer=null;});
    board.addEventListener('pointerleave',()=>{if(!pointer){hover=hoverWorld=null;schedule();}});
  }
  board.addEventListener('click',e=>{if(Date.now()<suppressClickUntil)return;if(e.detail===0){showPoints();return;}boardTap(e);});
  function openDialog(kind,title,html){
    if(!modal)sourceFocus=document.activeElement;modal=kind;$('dialog-title').textContent=title;$('dialog-body').innerHTML=html;$('dialog').hidden=false;
    app.querySelector('.mast').setAttribute('inert','');app.querySelector('.workbench').setAttribute('inert','');$('close').focus();
  }
  function closeDialog(restore=true){
    if(!modal)return;modal='';$('dialog').hidden=true;app.querySelector('.mast').removeAttribute('inert');app.querySelector('.workbench').removeAttribute('inert');
    if(restore&&sourceFocus&&document.contains(sourceFocus))sourceFocus.focus();sourceFocus=null;
  }
  const btn=(label,cmd,klass='')=>'<button type="button" class="'+klass+'" data-cmd="'+cmd+'">'+esc(label)+'</button>';
  function plate(p,solution=null){
    const set=p.goals.find(g=>solution&&g.every(target=>G.hasTarget(solution,target)))||p.goals[0];
    const pts=Object.values(p.given),x=pts.reduce((n,q)=>n+q.x,0)/pts.length,y=pts.reduce((n,q)=>n+q.y,0)/pts.length;
    const scale=25/Math.max(1,...pts.map(q=>Math.hypot(q.x-x,q.y-y)));
    const px=n=>fmt(40+(n-x)*scale),py=n=>fmt(40-(n-y)*scale);
    function figure(s,color,width){
      if(s.type==='pin')return '<circle cx="'+px(s.x)+'" cy="'+py(s.y)+'" r="4" fill="'+color+'"/>';
      if(s.type==='circle')return '<circle cx="'+px(s.x)+'" cy="'+py(s.y)+'" r="'+fmt(s.r*scale)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"/>';
      const foot={x:s.nx*s.k,y:s.ny*s.k};
      return '<path d="M '+px(foot.x-16*s.ny)+' '+py(foot.y+16*s.nx)+' L '+px(foot.x+16*s.ny)+' '+py(foot.y-16*s.nx)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"/>';
    }
    const clip='plate-'+p.id;
    return '<svg class="proof-plate" viewBox="0 0 80 80" aria-hidden="true"><defs><clipPath id="'+clip+'"><circle cx="40" cy="40" r="34"/></clipPath></defs><circle cx="40" cy="40" r="38.5" fill="#1b3541" stroke="#c9a871"/><g clip-path="url(#'+clip+')">'+p.shapes.map(s=>figure(s,'#96c6c8',1.3)).join('')+set.map(s=>figure(s,'#ffcf86',2.4)).join('')+pts.map(q=>'<circle cx="'+px(q.x)+'" cy="'+py(q.y)+'" r="1.9" fill="#f4e7c6"/>').join('')+'</g></svg>';
  }
  function showAtlas(){
    let html='<p>Choose any experiment. Your best move count and unaided solutions stay in this browser.</p>';
    for(const chapter of Atlas.chapters){
      html+='<h3>'+esc(chapter)+'</h3>';
      for(const l of Atlas.list.filter(x=>x.chapter===chapter)){
        const r=records(l);html+='<button class="level-item" data-level="'+l.id+'"><span>'+(r.best?plate(l):String(l.index+1).padStart(2,'0'))+'</span><b>'+esc(l.title)+'</b><span>'+(!r.best?'Target '+l.par:'✓ '+r.best+(r.solo?' · solo':''))+'</span></button>';
      }
    }
    openDialog('atlas','Puzzle atlas',html);
  }
  function showHints(reveal=false){
    if(review!==null){finishTrace();}
    if(puzzle.free){showNotebook();return;}if(completed){showProof();return;}
    if(reveal&&hints<puzzle.hints.length){hints++;persist();update();}
    let html='<p>'+esc(puzzle.brief)+'</p>';
    if(!hints)html+='<p>Reveal one clue at a time. You can still earn your move target with a hint. For an unaided record, solve a fresh attempt without revealing a clue.</p>';
    for(let i=0;i<hints;i++)html+='<div class="hint-item"><strong>'+(i+1)+'.</strong> '+esc(puzzle.hints[i])+'</div>';
    html+='<div class="action-row">'+(hints<puzzle.hints.length?btn(hints?'Next clue':'Reveal first clue','reveal','primary'):'')+btn('Back to drawing','back')+'</div>';
    openDialog('hints','Field notes',html);
  }
  function showProof(){
    const nextLabel=puzzle.date||puzzle.index===Atlas.list.length-1?'Open puzzle atlas':'Next experiment';
    const target=cursor<=puzzle.par?' · At target or better':'',solo=hints===0?' · Unaided':'';
    openDialog('proof','Construction complete','<div class="proof-top">'+plate(puzzle,state)+'<div class="record-line">'+cursor+' '+(cursor===1?'move':'moves')+target+solo+'</div></div><h3>'+esc(puzzle.title)+'</h3><p>'+esc(puzzle.proof)+'</p><div class="action-row">'+btn(nextLabel,'next','primary')+btn('Replay my construction','trace')+btn('Study drawing','back')+btn('Try again','restart-confirm')+'</div>');
  }
  function showNotebook(){
    const items=state.actions.slice(0,cursor).map((a,i)=>'<li>'+esc(a.tool==='point'?'Placed a point ('+a.x.toFixed(2)+', '+a.y.toFixed(2)+')':a.tool==='pin'?'Pinned '+a.a:a.tool==='circle'?'Circle at '+a.a+' through '+a.b:'Line through '+a.a+' and '+a.b)+'</li>').join('');
    openDialog('notebook','Drawing notebook','<p>'+cursor+' of '+G.LIMIT+' moves used. This drawing resumes in this browser.</p>'+(items?'<ol>'+items+'</ol>':'<p>Your first construction will appear here.</p>')+'<div class="action-row">'+(cursor?btn('Replay my construction','trace','primary'):'')+btn('Save drawing as SVG','export')+btn('Back to drawing','back')+'</div>');
  }
  function showPoints(){
    if(review!==null)return;
    const f=dimensions();
    const buttons=state.points.map(q=>{const side=f.x(q)<0||f.y(q)<0||f.x(q)>f.w||f.y(q)>f.h?' · off board':'';
      return '<button data-pt="'+q.id+'" aria-pressed="'+(q.id===first)+'" aria-label="'+esc(q.id+', '+q.kind+side)+'">'+esc(q.id)+'</button>';}).join('');
    let input='';
    if(puzzle.free)input='<form id="free-coords" class="free-coords"><label>X<input type="number" required step="any" min="-1000" max="1000" name="x" value="0"></label><label>Y<input type="number" required step="any" min="-1000" max="1000" name="y" value="0"></label><button type="submit">Add point</button></form>';
    openDialog('points','Choose a point','<p>'+esc(promptText())+'</p><div class="point-grid">'+buttons+'</div>'+input);
  }
  function showOptions(){
    const row=(label,cmd,state='')=>'<button class="dialog-row" data-cmd="'+cmd+'">'+esc(label)+'<small>'+esc(state)+'</small></button>';
    openDialog('options','Laboratory settings',row('Instrument sounds','sound',ui.sound?'On':'Off')+row('Point labels','labels',ui.points?'Shown':'Hidden')+row('Focus view','focus',focusView?'On':'Off')+row('How to play and install','guide')+row('Drawing notebook and SVG','notebook')+row('Restart this drawing','restart-confirm')+'<p style="margin:1rem 0 0"><small>Developed and designed by Noorullah Adel · 2026 · MIT</small></p>');
  }
  function showGuide(){
    openDialog('guide','Field guide','<h3>Use the instruments</h3><p>For a line, select any two dots. For a circle, select its center first, then a dot on its rim. Every crossing becomes a selectable point. Use Pin when a puzzle asks you to mark a point.</p><p>Solid dots are given points. Hollow dots are constructed. Drag the paper to pan, use + and − to zoom, and select the crosshair to return to the original view. The Points list also reaches off-board intersections.</p><h3>Keep a record</h3><p>Each line, circle and pin counts as one move. Meet the move target or solve unaided to earn both distinctions. Revisit any experiment from the atlas. Each UTC date has its own daily edition. The notebook lets you replay your construction one mark at a time.</p><h3>Use the keyboard</h3><p>L selects the straightedge, C the compass, P the pin and N the point picker. Z undoes and Y redoes. Escape closes a panel or clears the selected point. Tab and Enter operate every button.</p><h3>Install on iPhone</h3><p>Open the published game in Safari. Use Share, choose Add to Home Screen, enable Open as Web App if offered, then tap Add. Launch the new icon for a screen-filling workbench. Other browsers may offer an install command in their menu.</p><p id="offline-status" class="record-line">'+esc(offlineText)+'</p><p><small>Original game, diagrams, writing and synthesized sounds. MIT © 2026 Noorullah Adel.</small></p><div class="action-row">'+btn('Back to drawing','back','primary')+'</div>');
  }
  function confirmRestart(){openDialog('restart','Restart this drawing?','<p>This clears the current marks, redo history and hints on this drawing. Your completed experiments and best scores stay in the atlas.</p><div class="action-row">'+btn('Keep drawing','back')+btn('Restart drawing','restart','primary')+'</div>');}
  function setStep(n){
    review=Math.max(0,Math.min(cursor,n));first=null;hover=hoverWorld=null;state=G.replay(puzzle,moves.slice(0,review));update();
  }
  function finishTrace(){review=null;state=G.replay(puzzle,moves.slice(0,cursor));update();}
  function reset(){
    review=null;
    closeDialog();moves=[];cursor=0;hints=0;completed=false;state=G.start(puzzle);first=null;hover=hoverWorld=null;tool=puzzle.tool;patchStatus='';fit();persist();update();
  }
  function exportDrawing(){
    draw();const svg=board.cloneNode(true);svg.removeAttribute('id');svg.removeAttribute('tabindex');svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width',Math.round(frame.w));svg.setAttribute('height',Math.round(frame.h));
    const meta=document.createElementNS('http://www.w3.org/2000/svg','metadata');meta.textContent='Arc & Ink · Developed and designed by Noorullah Adel · MIT · '+puzzle.title;svg.appendChild(meta);
    const serialized=new XMLSerializer().serializeToString(svg),url=URL.createObjectURL(new Blob([serialized],{type:'image/svg+xml;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='arc-and-ink-'+puzzle.id+'.svg';a.className='export-link';a.textContent='Save the SVG drawing';$('dialog-body').appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},60000);
  }
  function setFocus(next,askNative=true){
    focusView=next;$('focus-goal').hidden=!next;app.classList.toggle('is-focused',next);$('focus-toggle').setAttribute('aria-pressed',String(next));$('focus-toggle').setAttribute('aria-label',next?'Exit focus view':'Enter focus view');
    if(askNative){try{if(next && document.fullscreenEnabled && app.requestFullscreen){const p=app.requestFullscreen();p?.catch(()=>{});}else if(!next&&document.fullscreenElement===app){const p=document.exitFullscreen();p?.catch(()=>{});}}catch(_){}}
    schedule();
  }
  function cmd(name){
    switch(name){
      case 'back':closeDialog();break;
      case 'reveal':showHints(true);break;
      case 'next':if(puzzle.date||puzzle.index===Atlas.list.length-1){showAtlas();}else{loadPuzzle(Atlas.list[puzzle.index+1]);}break;
      case 'sound':ui.sound=!ui.sound;if(!ui.sound&&audio){try{audio.suspend().catch(()=>{});}catch(_){}}write('settings',ui);if(ui.sound)tone();showOptions();break;
      case 'labels':ui.points=!ui.points;write('settings',ui);schedule();showOptions();break;
      case 'focus':closeDialog();setFocus(!focusView);break;
      case 'guide':showGuide();break;
      case 'notebook':showNotebook();break;
      case 'export':exportDrawing();break;
      case 'trace':closeDialog();setStep(0);break;
      case 'restart-confirm':confirmRestart();break;
      case 'restart':reset();break;
    }
  }
  $('dialog-body').addEventListener('click',e=>{
    const item=e.target.closest('button');if(!item)return;
    if(item.dataset.level && levelsById.has(item.dataset.level)){loadPuzzle(levelsById.get(item.dataset.level));return;}
    if(item.dataset.pt){const id=item.dataset.pt;closeDialog();choose(id);if(first&&!modal)showPoints();return;}
    if(item.dataset.cmd)cmd(item.dataset.cmd);
  });
  $('dialog-body').addEventListener('submit',e=>{if(e.target.id!=='free-coords'||!puzzle.free)return;e.preventDefault();const data=new FormData(e.target);closeDialog();setTool('point');action({tool:'point',x:Number(data.get('x')),y:Number(data.get('y'))});});
  $('atlas-open').onclick=showAtlas;$('daily-open').onclick=()=>loadPuzzle(Atlas.daily(today()));$('free-open').onclick=()=>loadPuzzle(Atlas.free);
  $('focus-goal').onclick=()=>showHints();$('trace-prev').onclick=()=>setStep(review-1);$('trace-next').onclick=()=>setStep(review+1);$('trace-exit').onclick=finishTrace;
  $('options').onclick=showOptions;$('hint').onclick=()=>showHints();$('point-list').onclick=showPoints;
  $('undo').onclick=()=>undoRedo(-1);$('redo').onclick=()=>undoRedo(1);$('plus').onclick=()=>zoom(1.4);$('minus').onclick=()=>zoom(1/1.4);$('fit').onclick=fit;
  $('focus-toggle').onclick=()=>setFocus(!focusView);$('close').onclick=()=>closeDialog();
  $('dialog').addEventListener('click',e=>{if(e.target===$('dialog'))closeDialog();});
  app.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&focusView)setFocus(false,false);});
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.altKey||e.isComposing)return;
    if(modal){
      if(e.key==='Escape'){e.preventDefault();closeDialog();return;}
      if(e.key==='Tab'){
        const inputs=[...$('dialog').querySelectorAll('button:not(:disabled),input,a[href]')].filter(el=>!el.hidden);if(!inputs.length)return;
        const first=inputs[0],last=inputs[inputs.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
      return;
    }
    if(e.target?.matches('input,textarea,select,[contenteditable=true]'))return;
    if(e.key==='Escape'){if(review!==null){finishTrace();return;}if(first){first=null;patchStatus='Selection cleared.';update();}else if(focusView)setFocus(false);return;}
    if(review!==null){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setStep(review+(e.key==='ArrowLeft'?-1:1));}return;}
    if(e.metaKey||e.ctrlKey){if(e.key.toLowerCase()==='z'){e.preventDefault();undoRedo(e.shiftKey?1:-1);}return;}
    const k=e.key.toLowerCase(), map={l:'line',c:'circle',p:'pin'};
    if(map[k]){e.preventDefault();setTool(map[k]);}
    else if(k==='n'){e.preventDefault();showPoints();}
    else if(k==='z'||k==='y'){e.preventDefault();undoRedo(k==='z'?-1:1);}
    else if(e.target===board && (e.key==='Enter'||e.key===' ')){e.preventDefault();showPoints();}
    else if(e.target===board && e.key.startsWith('Arrow')){
      const unit=.4/camera.zoom,dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]},d=dirs[e.key];if(d){e.preventDefault();camera.x=limitCenter(camera.x+unit*d[0]);camera.y=limitCenter(camera.y+unit*d[1]);persist();schedule();}
    }
  });
  window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
  if(window.ResizeObserver){new ResizeObserver(schedule).observe(box);}
  window.addEventListener('storage',e=>{
    if(!puzzle||!e.key)return;
    if(e.key===key+trackKey(puzzle)&&e.newValue!==null&&!unsaved.has(trackKey(puzzle))){
      loadPuzzle(puzzle);notify('Loaded the latest drawing from your other tab.');return;
    }
    if(e.key.startsWith(key+'score-'))update();
  });
  function offline(msg){offlineText=msg;if($('offline-status'))$('offline-status').textContent=msg;}
  if(app.dataset.preview==='yes'){offline('Offline installation is available from the published GitHub Pages game.');}
  else if(window.isSecureContext && 'serviceWorker' in navigator && location.protocol!=='file:'){
    navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
      const ready=()=>{if(reg.active?.state==='activated')offline('Offline copy ready on this device.');};
      ready();navigator.serviceWorker.ready.then(ready);
      const track=()=>{const w=reg.installing;if(w)w.addEventListener('statechange',()=>{if(w.state==='redundant')offline('Offline setup did not finish. Reopen online to try again.');else if(w.state==='activated')offline('Offline copy ready on this device.');});};track();reg.addEventListener('updatefound',track);
    }).catch(()=>offline('Offline setup is unavailable in this browser session.'));
  }else{offline('Open the published HTTPS game to prepare an offline copy.');}
  loadPuzzle(pickPuzzle(read('last','seam')));
})(ArcGeometry,ArcAtlas);
