'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const SOURCE='https://github.com/ValentinZeller/overwatch_skins';
const RAW='https://raw.githubusercontent.com/ValentinZeller/overwatch_skins/main/';
const key=value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const isFandom=url=>typeof url==='string'&&/^https:\/\/static\.wikia\.nocookie\.net\//.test(url);
function prioritize(items,paths) {
 const files=new Set(paths),byName=new Map();
 for(const file of files) {
  const match=/^image\/hero\/([^/]+)\/([^/]+)\.webp$/.exec(file);
  if(!match||/_web$/.test(match[2]))continue;
  const identity=key(match[1])+'/'+key(match[2]);
  const matches=byName.get(identity)||[];matches.push(file);byName.set(identity,matches);
 }
 let primary=0,fallbackOnly=0;
 const catalog=items.map(item=>{
  const exact='image/hero/'+item.id+'.webp';
  const names=byName.get(key(item.hero)+'/'+key(item.name))||[];
  const file=files.has(exact)?exact:names.length===1?names[0]:null;
  if(!file){fallbackOnly++;return item;}
  const image=RAW+file.split('/').map(encodeURIComponent).join('/');
  const web=file.replace(/\.webp$/,'_web.webp');
  const preview=files.has(web)?RAW+web.split('/').map(encodeURIComponent).join('/'):image;
  const fallbackImage=[item.image,item.fallbackImage,item.preview,item.fallbackPreview].find(isFandom);
  const fallbackPreview=[item.preview,item.fallbackPreview,fallbackImage].find(isFandom);
  primary++;
  return {...item,image,preview,sourcePage:SOURCE,...(fallbackImage?{fallbackImage,fallbackPreview}: {})};
 });
 return {catalog,primary,fallbackOnly};
}
async function main() {
 const root=path.resolve(__dirname,'..'),file=path.join(root,'acc_details/catalog.js');
 const catalogFormat=require('./catalog-format.cjs'),items=catalogFormat.read(file);
 const response=await fetch('https://api.github.com/repos/ValentinZeller/overwatch_skins/git/trees/main?recursive=1',{headers:{'User-Agent':'Roshine-catalog-source-update',Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error('GitHub source lookup failed: '+response.status);
 const tree=await response.json();
 if(tree.truncated||!Array.isArray(tree.tree))throw new Error('Incomplete source tree; catalog was not changed.');
 const result=prioritize(items,tree.tree.filter(entry=>entry.type==='blob').map(entry=>entry.path));
 if(JSON.stringify(items.map(item=>item.id))!==JSON.stringify(result.catalog.map(item=>item.id)))throw new Error('IDs changed; refusing to save.');
 // Generated catalog: only image URLs/provenance change; ownership and stable IDs do not.
 catalogFormat.write(file,result.catalog);
 console.log(JSON.stringify({total:items.length,primary:result.primary,fallbackOnly:result.fallbackOnly,idsUnchanged:true}));
}
module.exports={prioritize};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
