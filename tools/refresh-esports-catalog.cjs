'use strict';
// Regenerates public reference data only; never reads or changes account ownership.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const key=x=>String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const decode=x=>x.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/<[^>]*>/g,'').trim();
async function get(url){
 try{const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);return await r.text();}
 catch(error){if(process.platform!=='win32')throw error;return execFileSync('powershell.exe',['-NoProfile','-Command',`[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); (Invoke-WebRequest -UseBasicParsing -TimeoutSec 30 '${url.replace(/'/g,"''")}').Content`],{encoding:'utf8',maxBuffer:30*1024*1024,timeout:40000});}
}
async function parse(page){const data=JSON.parse(await get('https://overwatch.fandom.com/api.php?'+new URLSearchParams({action:'parse',prop:'text',format:'json',page})));if(!data.parse?.text?.['*'])throw Error('Missing Wiki page '+page);return data.parse.text['*'];}
async function pool(items,fn){let next=0;await Promise.all(Array.from({length:4},async()=>{while(next<items.length){const i=next++;await fn(items[i],i);}}));}
function extract(html,version,heroNames){
 const result=[];
 for(const match of html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)){
  const block=match[1],image=block.match(/href="(https:\/\/static\.wikia\.nocookie\.net\/overwatch_gamepedia\/images\/[^"<>]+\/revision\/latest[^"<>]*)"/),file=block.match(/data-image-(?:name|key)="([^"]+)"/),label=block.match(/<b>([\s\S]*?)<\/b>/);
  if(!image||!file||!label)continue;
  const filename=decode(file[1]),prefix=filename.split(/[ _]Skin[ _]/)[0];
  const hero=heroNames.get(key(prefix));if(!hero||/Weapon|\.svg$/i.test(filename))continue;
  const title=decode(label[1]);if(!title)continue;
  const name=version==='owcs'?filename.replace(/^.*?[ _]Skin[ _]/,'').replace(/\.[^.]+$/,'').replace(/_/g,' ').replace(/^Away OWCS$/,'OWCS Away'):version==='ow1'?'Overwatch 1 '+title:/^Overwatch 2 /.test(title)?title:'Overwatch 2 '+title;
  const original=decode(image[1]);
  const id=hero.replace(/[^a-z0-9.]+/gi,'_')+'/'+('OWL_'+version+'_'+name).toUpperCase().replace(/[^A-Z0-9]+/g,'_');
  result.push({id,hero,name,rarity:'epic',image:original,preview:original.replace('/revision/latest','/revision/latest/scale-to-width-down/600'),sourcePage:'https://overwatch.fandom.com/wiki/'+(version==='owcs'?'Overwatch_Champions_Series#Cosmetics':`OWL_Skins_(Overwatch_${version==='ow1'?'1':'2'})`),acquisition:'esports',gameVersion:version==='owcs'?'ow2':version,referenceOrder:result.length});
 }
 return result;
}
async function main(){
 const file=path.join(root,'acc_details/catalog.js'),original=fs.readFileSync(file,'utf8'),window={};vm.runInNewContext(original,{window});
 const items=JSON.parse(JSON.stringify(window.HERO_GALLERY_CATALOG)).filter(item=>!/\/OWL_(?:OW1|OW2|OWCS)_/.test(item.id)),oldIds=items.map(x=>x.id),heroNames=new Map(items.map(x=>[key(x.hero),x.hero]));
 for(const [alias,hero] of [['S76','Soldier 76'],['McCree','Cassidy'],['Ball','Wrecking Ball']])heroNames.set(key(alias),hero);
 const pages=[['OWL_Skins_(Overwatch_1)','ow1'],['OWL_Skins_(Overwatch_2)','ow2'],['Template:OWCS_Skins','owcs']];
 const additions=[];await pool(pages,async([page,version],i)=>{const parsed=extract(await parse(page),version,heroNames);if(parsed.length<10)throw Error('Unexpected empty '+page);additions[i]=parsed;console.log(page+': '+parsed.length);});
 const index=await get('https://foxyjr.cloudns.ph/overwatch_skins/index'),ids=[...new Set([...index.matchAll(/hero\.php\?id=(\d+)/g)].map(x=>x[1]))];
 if(ids.length<40)throw Error('Incomplete Foxy hero index');
 const metadata=new Map();let reviewed=0;
 await pool(process.argv.includes('--esports-only')?[]:ids,async id=>{
  const html=await get('https://foxyjr.cloudns.ph/overwatch_skins/hero.php?id='+id);let order=0;
  for(const m of html.matchAll(/<div class="item-gallery\b([^>]*)>([\s\S]*?)<\/div>/g)){
   const attrs=m[1],body=m[2],asset=attrs.match(/image\/hero\/([^/']+)\/([^/']+)\.webp/),title=attrs.match(/title="([^"]+)"/);if(!asset||!title)continue;
   const hero=heroNames.get(key(asset[1]));if(!hero)continue;
   const category=decodeURIComponent((body.match(/image\/category\/([^"<>]+)\.webp/)||[])[1]||'');
   const acquisition=category==='shop'?'shop':/^stadium/.test(category)?'stadium':/overwatch (?:esports|league)/.test(category)?'esports':null;
   metadata.set(key(hero)+'/'+key(decode(title[1])),{referenceOrder:order++,...(acquisition?{acquisition}:{}),acquisitionSource:'https://foxyjr.cloudns.ph/overwatch_skins/hero.php?id='+id});
  }
  reviewed++;if(reviewed%10===0)console.log('Hero references: '+reviewed+'/'+ids.length);
 });
 let tagged=0;for(const item of items){const meta=metadata.get(key(item.hero)+'/'+key(item.name));if(meta){Object.assign(item,meta);if(meta.acquisition)tagged++;}if(/^Stadium (?:Elite|All-Star|Rookie)$/.test(item.name))item.acquisition='stadium';}
 const known=new Map(items.map(x=>[key(x.hero)+'/'+key(x.name),x]));const newItems=[];
 for(const entry of additions.flat()){const k=key(entry.hero)+'/'+key(entry.name);if(known.has(k)){const existing=known.get(k);existing.acquisition='esports';existing.gameVersion=entry.gameVersion;if(existing.rarity==='unknown')existing.rarity=entry.rarity;continue;}known.set(k,entry);newItems.push(entry);}
 // Primary source lookup is exact-path only: no guessed hero/skin image URLs.
 let githubMatches=0;try{
  const tree=JSON.parse(await get('https://api.github.com/repos/ValentinZeller/overwatch_skins/git/trees/main?recursive=1'));if(tree.truncated||!tree.tree)throw Error('Incomplete source tree');
  const paths=tree.tree.filter(x=>x.type==='blob').map(x=>x.path),{prioritize}=require('./prioritize-skin-images.cjs'),prioritized=prioritize(newItems,paths);githubMatches=prioritized.primary;newItems.splice(0,newItems.length,...prioritized.catalog);
 }catch(error){console.log('Primary tree unavailable; retaining verified Wiki page URLs: '+error.message);}
 items.push(...newItems);if(new Set(items.map(x=>x.id)).size!==items.length)throw Error('Duplicate IDs');
 if(oldIds.some((id,i)=>items[i].id!==id))throw Error('Existing IDs changed');
 require('./catalog-format.cjs').write(file,items);
 execFileSync(process.execPath,[path.join(__dirname,'build-skin-rarities.cjs')],{stdio:'inherit'});
 console.log(JSON.stringify({original:oldIds.length,added:newItems.length,total:items.length,githubMatches,tagged,referenceHeroes:reviewed,existingIdsUnchanged:true}));
}
module.exports={extract,key};if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
