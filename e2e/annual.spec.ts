import {test,expect} from '@playwright/test';
import {questions} from '../src/data';
import {STORAGE_KEY,emptyStore,type Match} from '../src/domain';
import {currentQuestion} from './deck';
function previous(pending=false):Match{return {id:'test-prior-103',year:103,profileId:emptyStore().profileId,opponentId:'bot',character:0,mode:'bot',difficulty:1,createdAt:'2026-10-22T00:00:00Z',version:'demo-v2-12',complete:true,
 rounds:questions.map((q,i)=>({questionId:q.id,answers:[{raw:q.answer,verdict:pending&&i===0?'review':'correct',reason:'test fixture',elapsed:1000},{raw:'',verdict:'incorrect',reason:'test fixture',elapsed:10000}]}))};}
test('104需先通過103，待複核不得解鎖',async({page})=>{
  await page.addInitScript(({key,store})=>localStorage.setItem(key,JSON.stringify(store)),{key:STORAGE_KEY,store:{...emptyStore(),matches:[previous(true)]}});
  await page.goto('/');await page.getByRole('button',{name:'世界地圖',exact:true}).click();
  await page.locator('.stages button').nth(1).click();await expect(page.locator('.world-detail button')).toBeDisabled();
});
test('104完整隨機12題，續玩保持題目與選項，年度成績分開',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  // Only the prerequisite is simulated; all 104 answers use real UI in an isolated context.
  await page.evaluate(({key,store})=>localStorage.setItem(key,JSON.stringify(store)),{key:STORAGE_KEY,store:{...emptyStore(),matches:[previous()]}});
  await page.reload();await page.getByRole('button',{name:'同機雙人',exact:true}).click();
  await page.getByRole('button',{name:'世界地圖',exact:true}).click();await page.locator('.stages button').nth(1).click();
  await page.getByRole('button',{name:'進入 104 年試煉',exact:true}).click();
  const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('idiom-king-demo-v2-12')!).active.deck);
  expect(original).toHaveLength(12);
  for(let i=0;i<12;i++){
    if(i===3){await page.reload();await page.getByRole('button',{name:'繼續未完成練習',exact:false}).click();
      expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('idiom-king-demo-v2-12')!).active.deck)).toEqual(original);}
    const q=await currentQuestion(page,i);
    for(let p=0;p<2;p++){
      if(q.options)await page.locator('.answer-player').nth(p).getByRole('button',{name:q.answer,exact:false}).click();
      else await page.getByLabel(p?'右方答案':'左方答案',{exact:true}).fill(q.answer);
      await page.getByRole('button',{name:p?'鎖定右方答案':'鎖定左方答案',exact:true}).click();
    }
    if(i===0){await expect(page.locator('.feedback')).toContainText(q.explanation);await page.screenshot({path:'docs/screenshots/104-random-battle.png',fullPage:true});}
    await page.getByRole('button',{name:i===11?'查看挑戰結果':'前往下一題',exact:false}).click();
  }
  await expect(page.locator('.result-scores strong').first()).toHaveText('100 / 100');
  await page.getByRole('button',{name:'我的戰績',exact:true}).click();
  await expect(page.locator('tbody tr').nth(1)).toContainText('100');
  await expect(page.locator('.history-item')).toHaveCount(2);
  await page.screenshot({path:'docs/screenshots/104-random-history.png',fullPage:true});expect(errors).toEqual([]);
});
