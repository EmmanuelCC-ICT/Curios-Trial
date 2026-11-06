export function createIsolatedStorage(backing,prefix='year8-world:v1:'){
 if(!backing)try{backing=globalThis.localStorage;}catch{}
 const memory=new Map();
 return {getItem(key){try{return backing?.getItem(prefix+key)??memory.get(key)??null;}catch{return memory.get(key)??null;}},setItem(key,value){memory.set(key,String(value));try{backing?.setItem(prefix+key,String(value));}catch{}},removeItem(key){memory.delete(key);try{backing?.removeItem(prefix+key);}catch{}}};
}
