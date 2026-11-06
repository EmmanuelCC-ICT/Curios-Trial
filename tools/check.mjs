import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');let checked=0;const missing=[];
const report=JSON.parse(await readFile(resolve(root,'docs/extraction.json'),'utf8'));
for(const path of report.runtimeModules){const file=resolve(root,path),source=await readFile(file,'utf8');const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status)throw Error(result.stderr);checked++;for(const [,ref]of source.matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g)){if(!ref.startsWith('.'))continue;const target=resolve(dirname(file),ref.split('?')[0]);try{await stat(target);}catch{missing.push(path+': '+ref);}}}
const html=await readFile(resolve(root,'playable-3d/index.html'),'utf8');if(/supabase|guest-shell|feedback-widget|economy-lab|modules\/est-prep/.test(html))throw Error('Original service/lesson entry point remains.');
if(missing.length)throw Error(missing.join('\n'));
console.log(checked+' runtime modules parse; local imports resolve; no original service or lesson scripts in game entry.');
