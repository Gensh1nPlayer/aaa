(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DetailsImageSources=api;
})(typeof window==='object'?window:globalThis,function(root){
  'use strict';
  const primary=url=>typeof url==='string'&&/^https:\/\/raw\.githubusercontent\.com\/ValentinZeller\/overwatch_skins\//.test(url);
  function candidates(item,preview=false){
    // Prefer recorded originals within each source; preview links explicitly opt into thumbnails.
    const values=(preview?[item.preview,item.fallbackPreview,item.image,item.fallbackImage]:[item.image,item.fallbackImage,item.preview,item.fallbackPreview]).filter(Boolean);
    return [...new Set([...values.filter(primary),...values.filter(url=>!primary(url))])];
  }
  function sourcePage(item){
    return candidates(item).some(primary)?'https://github.com/ValentinZeller/overwatch_skins':item.sourcePage||item.source;
  }
  const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
  const pair=item=>`${key(item.hero)}/${key(item.name)}`;
  const weaponAliases={hanzo:{tokyoredel:'tokyorebel'},genji:{nerfsungerang:'nerfslingerang',sungerang:'nerfslingerang',slingerang:'nerfslingerang'},tracer:{nerfgelfire:'nerfgelfirepro',gelfire:'nerfgelfirepro',gelfirepro:'nerfgelfirepro'}};
  const weaponName=item=>weaponAliases[key(item.hero)]?.[key(item.name)]||key(item.name);
  function weapon(item){
    const match=(root.HERO_GALLERY_WEAPONS||[]).find(entry=>
      (!key(item.hero)||key(entry.hero)===key(item.hero))&&
      (entry.id===item.id||(entry.aliasIds||[]).includes(item.id)||weaponName(entry)===weaponName(item)));
    // Unknown imported names remain visible, without borrowing another item's art.
    return {...item,...(match||{}),kind:'weapon',
      imageAvailable:Boolean(match?.image),imageStatus:match?.imageStatus||'not-found',
      ...(match ? {uncatalogued:false} : {image:null,preview:null,fallbackImage:null,fallbackPreview:null})};
  }
  function variant(item){
    const match=(root.HERO_GALLERY_VARIANT_IMAGES||[]).find(entry=>pair(entry)===pair(item));
    return {...item,kind:'variant',rarity:item.rarity||'unknown',
      id:item.id||`variant/${key(item.hero)}/${key(item.name)}`,
      image:null,preview:null,fallbackImage:null,fallbackPreview:null,
      ...(match||{}),imageAvailable:Boolean(match?.image),
      imageStatus:match ? 'available' : 'not-found',uncatalogued:false};
  }
  // Weapon-only loader. Existing skin candidate ordering and rendering stay intact.
  // Returns a cancel function so an open viewer can abandon a previous image load.
  function load(image,item,preview=false,onFailure){
    const urls=candidates(item,preview);
    let index=0,active=true;
    const stop=()=>{
      if(!active)return;
      active=false;
      if(image.onload===loaded)image.onload=null;
      if(image.onerror===advance)image.onerror=null;
    };
    const fail=()=>{stop();image.removeAttribute('src');onFailure?.();};
    const advance=()=>{
      if(!active)return;
      if(index>=urls.length){fail();return;}
      image.src=urls[index++];
    };
    image.onload=null;image.onerror=null;
    image.referrerPolicy='no-referrer';
    image.onerror=advance;
    const loaded=()=>{
      if(!active)return;
      if(!image.naturalWidth||!image.naturalHeight||
        (image.src.includes('static.wikia.nocookie.net')&&image.naturalWidth===300&&image.naturalHeight===171))advance();
      else stop();
    };
    image.onload=loaded;
    advance();
    return stop;
  }
  return {candidates,sourcePage,weapon,variant,load};
});
