import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const source=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
const factory=(self,caches,fetch,URL)=>runInNewContext(source,{self,caches,fetch,URL});
(function workerCases(factory,onTest,UrlCtor){
  const origin='https://demo.invalid/public/applications/arc-and-ink/';
  const eq=(c,m)=>{if(!c)throw Error(m);};
  function rig({scope=origin,offline=false,missing=false}={}){
    const events=new Map(),data=new Map(),stats={fetches:0,claims:0};
    const reply=s=>({ok:true,body:s,clone(){return reply(s);}});
    const self={registration:{scope},clients:{claim:async()=>{stats.claims++;}},addEventListener:(name,fn)=>events.set(name,fn)};
    const caches={
      keys:async()=>[...data.keys()],delete:async n=>data.delete(n),
      open:async n=>{if(!data.has(n))data.set(n,new Map());const entries=data.get(n);return {
        async addAll(paths){if(missing)throw Error('missing asset');paths.forEach(p=>entries.set(p,reply(p)));},
        async match(key){return entries.get(key);},async put(key,value){entries.set(key,value);}
      };}
    };
    factory(self,caches,async req=>{stats.fetches++;if(offline)throw Error('offline');return reply(req.url);},UrlCtor);
    async function trigger(n){let work;events.get(n)({waitUntil(p){work=p;}});await work;}
    async function request(url,method='GET'){
      let handled=false,r;events.get('fetch')({request:{url,method},respondWith(p){handled=true;r=p;}});return handled?(await r)?.body:'UNHANDLED';
    }
    return {trigger,request,stats,data};
  }
  onTest('Offline navigation and all runtime assets use the installed cache',async()=>{const r=rig({offline:true});await r.trigger('install');await r.trigger('activate');eq(await r.request(origin)===origin+'index.html','directory entry');eq(await r.request(origin+'?v=9')===origin+'index.html','query');eq(await r.request(origin+'js/atlas.js?x=2')===origin+'js/atlas.js','asset');eq(r.stats.fetches===0&&r.stats.claims===1,'cached navigation');});
  onTest('Worker activation deletes only old caches from its exact app scope',async()=>{const r=rig();const old='arc-and-ink::'+origin+'::old',neighbor='arc-and-ink::https://demo.invalid/public/applications/other/::old';r.data.set(old,new Map());r.data.set(neighbor,new Map());r.data.set('sankey-cache',new Map());await r.trigger('install');await r.trigger('activate');eq(!r.data.has(old)&&r.data.has(neighbor)&&r.data.has('sankey-cache'),'isolated cleanup');});
  onTest('Worker skips sibling applications, unknown assets, other origins and writes',async()=>{const r=rig();for(const [url,method] of [[origin+'no-page.html','GET'],['https://demo.invalid/public/applications/stack-tower/','GET'],['https://other.invalid/test','GET'],[origin+'index.html','POST']])eq(await r.request(url,method)==='UNHANDLED',url);});
  onTest('Incomplete install rejects and never claims clients',async()=>{const r=rig({missing:true});let rejected=false;try{await r.trigger('install');}catch(_){rejected=true;}eq(rejected&&r.stats.claims===0,'installation must fail');});
  onTest('A missing cached runtime file can be restored from a successful network response',async()=>{const r=rig();await r.trigger('install');const values=[...r.data.values()][0];values.delete(origin+'styles.css');eq(await r.request(origin+'styles.css')===origin+'styles.css','network restore');eq(values.has(origin+'styles.css')&&r.stats.fetches===1,'repair not cached');});
})(factory,test,URL);
