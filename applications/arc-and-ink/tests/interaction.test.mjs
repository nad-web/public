import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import G from "../js/geometry.js";
import Atlas from "../js/atlas.js";
const src=readFileSync(new URL("../js/game.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const boot=env=>runInNewContext(src,{...env,ArcGeometry:G,ArcAtlas:Atlas});
(function interactionCases(boot,G,A,template,onTest){
  const eq=(yes,msg)=>{if(!yes)throw new Error(msg);};
  function start({width=390,height=410,store=new Map(),deny=false,pointers=false,quota=false}={}){
    const nodes={},docEvents={},winEvents={},classes=new Set(),registeredIds=new Set(Array.from(template.matchAll(/\bid="([^"]+)"/g),m=>m[1]));let active;
    function element(id){
      const handlers={},attrs={};
      return {id,hidden:false,disabled:false,dataset:{},style:{},innerHTML:'',textContent:'',attributes:attrs,
        addEventListener:(name,fn)=>{(handlers[name]??=[]).push(fn);},
        fire(name,data={}){for(const cb of handlers[name]||[])cb({target:this,...data});},
        setAttribute:(k,v)=>{attrs[k]=v;},removeAttribute:k=>{delete attrs[k];},focus(){active=this;},matches:()=>false,
        querySelector(selector){if(selector==='svg')return {outerHTML:'<svg></svg>'};if(selector[0]==='#')return nodes[selector.slice(1)]??null;return nodes[selector]??null;},
        querySelectorAll(selector){return selector==='[data-tool]'?instruments:[];},
        getBoundingClientRect:()=>({left:0,top:0,width,height})
      };
    }
    registeredIds.forEach(id=>nodes[id]=element(id));
    nodes['.mast']=element('mast');nodes['.workbench']=element('workbench');
    const instruments=['line','circle','pin','point'].map(t=>{const i=element(t);i.dataset.tool=t;return i;});
    const root=nodes['arc-game'];root.dataset.preview='yes';root.classList={toggle:(name,on)=>on?classes.add(name):classes.delete(name)};
    nodes.dialog.hidden=true;
    const document={getElementById:id=>nodes[id],addEventListener:(name,fn)=>{docEvents[name]=fn;},get activeElement(){return active;},contains:()=>true};
    const window={PointerEvent:pointers?function PointerEvent(){}:undefined,addEventListener:(name,fn)=>{winEvents[name]=fn;},requestAnimationFrame:f=>f(),isSecureContext:false};
    const localStorage={getItem(k){if(deny)throw Error('blocked');return store.get(k)??null;},setItem(k,v){if(deny||quota)throw Error('blocked');store.set(k,v);}};
    const location={pathname:'/public/applications/arc-and-ink/',protocol:'https:'};
    boot({document,window,localStorage,location,navigator:{},setTimeout:()=>1,clearTimeout:()=>{}});
    function dialog(data){nodes['dialog-body'].fire('click',{target:{closest:()=>({dataset:data})}});}
    function pts(a,b){nodes['point-list'].onclick();dialog({pt:a});if(b)dialog({pt:b});}
    function key(k){docEvents.keydown({target:nodes.board,key:k,preventDefault(){}});}
    function act(t,a,b){instruments.find(x=>x.dataset.tool===t).onclick();pts(a,b);}
    function fromStore(ending){const k=[...store.keys()].find(s=>s.endsWith(':'+ending));return k?JSON.parse(store.get(k)):null;}
    return {nodes,store,dialog,pts,key,act,fromStore,classes,click:id=>nodes[id].onclick(),mark:tool=>instruments.find(t=>t.dataset.tool===tool)};
  }
  function crossings(){return G.start(A.list[0]).points.filter(p=>p.kind==='crossing').map(p=>p.id);}
  onTest('The point picker completes the introductory puzzle and records its proof',()=>{const t=start(),[a,b]=crossings();t.pts(a,b);eq(t.nodes['dialog-title'].textContent==='Construction complete','proof');eq(t.fromStore('score-seam').best===1&&t.fromStore('score-seam').solo,'score');});
  onTest('Undo and redo restore the exact drawing without erasing the best score',()=>{const t=start(),[a,b]=crossings();t.pts(a,b);t.dialog({cmd:'back'});t.click('undo');eq(t.nodes.moves.textContent===0,'undo');t.click('redo');eq(t.nodes.moves.textContent===1&&t.fromStore('score-seam').best===1,'redo');});
  onTest('Hints are opt-in, and a clean replay earns the unaided distinction',()=>{const t=start(),[a,b]=crossings();t.click('hint');t.dialog({cmd:'reveal'});t.dialog({cmd:'back'});t.pts(a,b);eq(t.fromStore('score-seam').solo===false,'hint counted');t.dialog({cmd:'restart-confirm'});t.dialog({cmd:'restart'});t.pts(a,b);eq(t.fromStore('score-seam').solo===true,'fresh solve');});
  onTest('The proof replay can step both ways without changing the saved move log',()=>{const t=start(),[a,b]=crossings();t.pts(a,b);t.dialog({cmd:'trace'});eq(t.nodes['trace-row'].hidden===false,'active');eq(t.nodes['trace-count'].textContent==='0 / 1','initial');t.click('trace-next');eq(t.nodes['trace-count'].textContent==='1 / 1','forward');t.click('trace-prev');t.click('trace-exit');eq(t.nodes.moves.textContent===1&&t.fromStore('drawing-seam').cursor===1,'preserve');});
  onTest('A different level resumes its partially completed compass construction after reload',()=>{const t=start();t.click('atlas-open');t.dialog({level:'twins'});t.act('circle','A','B');const again=start({store:t.store});eq(again.nodes.title.textContent==='Twin beacons'&&again.nodes.moves.textContent===1,'resume');again.act('circle','B','A');eq(again.fromStore('score-twins').best===2,'finish');});
  onTest('Daily and the free notebook keep the campaign drawing separate',()=>{const t=start();t.click('daily-open');eq(String(t.nodes.number.textContent).startsWith('Daily edition'),'daily');t.click('free-open');eq(t.nodes.title.textContent==='Free laboratory','free');t.nodes.board.fire('click',{clientX:36,clientY:48,detail:1});eq(t.nodes.moves.textContent===1,'plant point');t.click('atlas-open');t.dialog({level:'seam'});eq(t.nodes.moves.textContent===0,'separate');t.click('free-open');eq(t.nodes.moves.textContent===1,'free resume');});
  onTest('Focus, label toggle, keyboard tools and distinct duplicate rejection work',()=>{const t=start();t.click('focus-toggle');eq(t.classes.has('is-focused')&&!t.nodes['focus-goal'].hidden,'focus');t.key('c');eq(t.mark('circle').attributes['aria-pressed']==='true','compass');t.pts('A','B');eq(t.nodes.moves.textContent===0,'duplicate rejected');t.key('Escape');eq(!t.classes.has('is-focused'),'exit focus');t.click('options');t.dialog({cmd:'labels'});eq(t.fromStore('settings').points===false,'labels');});
  onTest('Storage denial preserves play for the current visit',()=>{const t=start({deny:true}),[a,b]=crossings();t.pts(a,b);eq(t.nodes['dialog-title'].textContent==='Construction complete','play');t.dialog({cmd:'back'});eq(t.nodes.best.textContent===1,'in memory');});
  onTest('A narrow board still draws labeled points and zoom changes its coordinates',()=>{const t=start({width:320,height:288}),s=t.nodes.board;eq(s.attributes.viewBox==='0 0 320 288','narrow geometry');eq(s.innerHTML.includes('>A</text>'),'label');const before=s.innerHTML;t.click('plus');eq(s.innerHTML!==before,'zoom');t.click('fit');eq(s.innerHTML===before,'fit');});

  onTest('Pointer taps construct the two crossings once, including the following emulated click',()=>{
    const w=390,h=410,t=start({width:w,height:h,pointers:true}),s=t.nodes.board,l=A.list[0];
    const margin=Math.min(26,w*.06,h*.08),scale=Math.min((w-2*margin)/(2*l.view[0]),(h-2*margin)/(2*l.view[1]));
    for(const q of G.start(l).points.filter(p=>p.kind==='crossing')){
      const evt={button:0,pointerId:7,pointerType:'touch',clientX:w/2+q.x*scale,clientY:h/2-q.y*scale};
      s.fire('pointerdown',evt);s.fire('pointerup',evt);s.fire('click',{...evt,detail:1});
    }
    eq(t.nodes['dialog-title'].textContent==='Construction complete'&&t.nodes.moves.textContent===1,'tap sequence');
  });
  onTest('Dragging the free lab pans the diagram without placing a stray point',()=>{
    const t=start({pointers:true});t.click('free-open');const s=t.nodes.board;
    const down={button:0,pointerId:1,pointerType:'touch',clientX:45,clientY:52},up={...down,clientX:98,clientY:52};
    s.fire('pointerdown',down);s.fire('pointermove',up);s.fire('pointerup',up);
    eq(t.nodes.moves.textContent===0&&t.fromStore('drawing-free').camera.x!==0,'pan and tap separate');
  });
  onTest('A quota failure keeps newer progress visible even when older data can still be read',()=>{
    const prefix='noorullah:arc-and-ink:v1:/public/applications/arc-and-ink/:',store=new Map([[prefix+'score-seam',JSON.stringify({best:7,solo:false})]]);
    const t=start({store,quota:true}),[a,b]=crossings();t.pts(a,b);eq(t.nodes.best.textContent===1,'older persisted best hid new in-memory result');
  });
})(boot,G,Atlas,html,test);
