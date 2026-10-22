import {test,expect} from '@playwright/test';
import {questions} from '../src/data';
test('正常操作12題未達標，重新開始清空本局並保留歷史；縮放仍可操作',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  // Playwright creates a fresh incognito context for each test, never the user's tab.
  expect(await page.evaluate(()=>localStorage.getItem('idiom-king-demo-v2-12'))).not.toContain('"complete":true');
  await page.getByRole('button',{name:'同機雙人',exact:true}).click();
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  for(let i=0;i<12;i++){
    const q=questions[i];
    if(q.options){
      await page.locator('.answer-player').nth(0).getByRole('button',{name:i<4?q.answer:q.options.find(o=>o!==q.answer)!,exact:false}).click();
      await page.locator('.answer-player').nth(1).getByRole('button',{name:q.answer,exact:false}).click();
    }else{
      await page.getByLabel('左方答案',{exact:true}).fill(i===9?'付出少收穫多':q.answer);
      await page.getByLabel('右方答案',{exact:true}).fill(q.answer);
    }
    await page.getByRole('button',{name:'鎖定左方答案',exact:true}).click();
    await page.getByRole('button',{name:'鎖定右方答案',exact:true}).click();
    await page.getByRole('button',{name:i===11?'查看挑戰結果':'前往下一題',exact:false}).click();
  }
  await expect(page.locator('.result-scores strong').first()).toHaveText('55 / 100');
  await expect(page.getByText('未達 60 分，可再次挑戰',{exact:true})).toBeVisible();
  await page.screenshot({path:'docs/screenshots/failed-55.png',fullPage:true});
  await page.getByRole('button',{name:'再次挑戰',exact:true}).click();
  await expect(page.locator('.round-counter strong')).toHaveText('1');
  await expect(page.getByRole('progressbar',{name:'答題進度',exact:true})).toHaveAttribute('value','0');
  await expect(page.locator('.fighter-score strong').first()).toHaveText('0 分');
  await expect(page.locator('canvas')).toHaveCount(1);
  for(const width of [390,1024,1180]){
    await page.setViewportSize({width,height:850});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.getByRole('button',{name:'鎖定左方答案',exact:true})).toBeVisible();
  }
  await page.waitForTimeout(1800);
  await expect(page.locator('.feedback')).toHaveCount(0);
  for(let p=0;p<2;p++)await page.locator('.answer-player').nth(p).getByRole('button',{name:questions[0].answer,exact:false}).click();
  await page.getByRole('button',{name:'鎖定左方答案',exact:true}).click();
  await page.getByRole('button',{name:'鎖定右方答案',exact:true}).click();
  await expect(page.getByRole('progressbar',{name:'答題進度',exact:true})).toHaveAttribute('value','1');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('idiom-king-demo-v2-12')!));
  expect(saved.matches).toHaveLength(1);expect(saved.active.rounds).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('八角色四種雙字屬性配樂、固定肖像比例、字體保留',async({page})=>{
  await page.goto('/');
  await page.getByLabel('介面字體').selectOption('serif');
  await page.reload();
  await expect(page.getByLabel('介面字體')).toHaveValue('serif');
  await page.getByRole('button',{name:'切換配樂',exact:true}).click();
  const names=['炎刃','凜夜','夜影','雷曜','緋羽','星璃','紫夜','映曦'];
  const tracks=new Set<string>();
  for(let i=0;i<8;i++){
    await page.getByRole('button',{name:`選擇${names[i]}`,exact:true}).click();
    const name=['烈焰','流水','暗影','鎏金'][i%4];
    await expect(page.locator('.selected-detail .element')).toHaveText(name);
    const state=await page.evaluate(async()=>{
      const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/src/audio.ts'))!;
      return(await import(url)).music.status();
    });
    expect(state.element).toBe(name);expect(state.playing).toBe(true);expect(state.character).toBe(i);
    tracks.add(state.track);
  }
  expect(tracks.size).toBe(8);
  for(const width of [390,1180]){
    await page.setViewportSize({width,height:850});
    const box=await page.locator('.choose .portrait').first().boundingBox();
    expect(box!.width/box!.height).toBeCloseTo(.75,2);
  }
  await expect(page.locator('.hero-move-controls')).toHaveCount(0);
});
test('12題新制不覆寫或誤用20題舊存檔',async({page})=>{
  const old=JSON.stringify({profileId:'legacy-student',character:5,matches:[{id:'old',version:'demo-v1',complete:true,rounds:[]}],active:{id:'old-active',version:'demo-v1'}});
  await page.addInitScript(value=>localStorage.setItem('idiom-king-demo-v1',value),old);
  await page.goto('/');
  await expect(page.getByRole('button',{name:'選擇星璃',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:/繼續未完成練習/})).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('idiom-king-demo-v1'))).toBe(old);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('idiom-king-demo-v2-12')!));
  expect(saved.matches).toHaveLength(0);
});

