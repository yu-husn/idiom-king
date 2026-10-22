import ts from 'typescript';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

// Export newly authored review items, never the uploaded source records/roster.
const temp=await mkdtemp(join(tmpdir(),'idiom-bank-export-'));
try{
  for(const name of ['data','annualBank']){
    const source=await readFile(resolve('src',`${name}.ts`),'utf8');
    const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll("'./data'","'./data.mjs'");
    await writeFile(join(temp,`${name}.mjs`),js);
  }
  const {annualPracticeBank:bank}=await import(pathToFileURL(join(temp,'annualBank.mjs')).href);
  await mkdir('docs/question-bank',{recursive:true});
  await writeFile('docs/question-bank/annual-390.json',JSON.stringify(bank,null,2));
  const fields=['year','id','kind','prompt','options','answer','accepted','explanation','source','status'];
  const quote=value=>'"'+String(Array.isArray(value)?value.join('\n'):value??'').replaceAll('"','""')+'"';
  await writeFile('docs/question-bank/年度題庫審核表.csv','\ufeff'+[fields.join(','),...bank.map(q=>fields.map(f=>quote(q[f])).join(','))].join('\r\n'));
  console.log(`Exported ${bank.length} draft questions across ${new Set(bank.map(q=>q.year)).size} years.`);
}finally{
  if(dirname(resolve(temp))!==resolve(tmpdir()))throw new Error('Unsafe temporary export path');
  await rm(temp,{recursive:true,force:true});
}
