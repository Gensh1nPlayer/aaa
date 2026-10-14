(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DetailsImageSources=api;
})(typeof window==='object'?window:globalThis,function(){
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
  return {candidates,sourcePage};
});
