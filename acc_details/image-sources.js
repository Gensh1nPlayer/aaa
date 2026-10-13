(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DetailsImageSources=api;
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const primary=url=>typeof url==='string'&&/^https:\/\/raw\.githubusercontent\.com\/ValentinZeller\/overwatch_skins\//.test(url);
  function candidates(item,preview=false){
    const values=(preview?[item.preview,item.image,item.fallbackPreview,item.fallbackImage]:[item.image,item.preview,item.fallbackImage,item.fallbackPreview]).filter(Boolean);
    return [...new Set([...values.filter(primary),...values.filter(url=>!primary(url))])];
  }
  function sourcePage(item){
    return candidates(item).some(primary)?'https://github.com/ValentinZeller/overwatch_skins':item.sourcePage||item.source;
  }
  return {candidates,sourcePage};
});
