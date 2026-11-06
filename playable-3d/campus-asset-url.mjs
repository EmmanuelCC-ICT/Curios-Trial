// Keep the global device asset choice when a local loader defers decorative maps.
export function resolveCampusAssetURL(url,resolveURL,imagePlaceholder=null){
 if(imagePlaceholder&&typeof url==='string'&&!url.startsWith('data:')&&/\.(png|jpe?g|webp)(?:[?#]|$)/i.test(url))return imagePlaceholder;
 return resolveURL(url);
}
