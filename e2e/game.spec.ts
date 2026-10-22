import {test,expect} from '@playwright/test';
import {questions} from '../src/data';
test('完整同機12題：左方60分通關、右方100分贏PK，重新整理後保留',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button',{name:'同機雙人',exact:true}).click();
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('progressbar',{name:'答題進度',exact:true})).toHaveAttribute('value','0');
  for(let i=0;i<12;i++){
    const q=questions[i];
    const panels=page.locator('.answer-player');
    if(q.kind==='choice'){
      await panels.nth(0).getByRole('button',{name:i<6?q.answer:q.options!.find(o=>o!==q.answer)!,exact:false}).click();
      await panels.nth(1).getByRole('button',{name:q.answer,exact:false}).click();
    }else{
      // First 12 answers correct; remaining left responses are pending and reviewed below.
      await page.getByRole('textbox',{name:'左方答案'}).fill(false?q.answer:'不確定');
      await page.getByRole('textbox',{name:'右方答案'}).fill(q.answer);
    }
    await page.getByRole('button',{name:'鎖定左方答案',exact:true}).click();
    await expect(page.getByText('參考答案：',{exact:false})).toHaveCount(0);
    await page.getByRole('button',{name:'鎖定右方答案',exact:true}).click();
    await expect(page.getByRole('progressbar',{name:'答題進度',exact:true})).toHaveAttribute('value',String(i+1));
    if(i===4)await expect(page.getByLabel('左方試煉目標')).toContainText('必殺已觸發');
    if(i===5)await expect(page.getByLabel('左方試煉目標')).toContainText('已達分數門檻，完成12題後判定');
    if(i===8)await expect(page.getByLabel('左方試煉目標')).toContainText('待複核');
    await page.getByRole('button',{name:i===11?'查看挑戰結果':'前往下一題',exact:false}).click();
  }
  await expect(page.getByRole('heading',{name:'等待複核，暫不決定勝負'})).toBeVisible();
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'演練：判為錯誤',exact:true}).first().click();
  await expect(page.getByRole('heading',{name:'右方贏得對決！'})).toBeVisible();
  await expect(page.locator('.result-scores strong').first()).toHaveText('60 / 100');
  await expect(page.locator('.result-scores').getByText('✓ 達 60 分通關門檻')).toHaveCount(2);
  await page.screenshot({path:'docs/screenshots/completed-battle.png',fullPage:true});
  await page.reload();
  await page.getByRole('button',{name:'我的戰績',exact:true}).click();
  await expect(page.locator('.history-item')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('人機提交、續玩與平板版面',async({page})=>{
  await page.setViewportSize({width:1024,height:768});
  await page.goto('/');
  await page.screenshot({path:'docs/screenshots/lobby-tablet.png',fullPage:true});
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  await page.locator('.options').getByRole('button').first().click();
  await page.getByRole('button',{name:'鎖定左方答案'}).click();
  await expect(page.locator('.feedback')).toBeVisible({timeout:7000});
  await page.screenshot({path:'docs/screenshots/battle-tablet.png',fullPage:true});
  await page.reload();
  await page.getByRole('button',{name:/繼續未完成練習/}).click();
  await expect(page.locator('.round-counter strong')).toHaveText('2');
  await expect(page.getByRole('progressbar',{name:'答題進度',exact:true})).toHaveAttribute('value','1');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('學生介面無角色動作室，八位戰鬥角色素材可載入',async({page,request})=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:'角色動作室',exact:true})).toHaveCount(0);
  await expect(page.locator('.motion-lab')).toHaveCount(0);
  for(let i=0;i<8;i++){
    const response=await request.get(`/art/character-${i}.png`);expect(response.ok()).toBe(true);
  }
});
test('逾時雙方空白皆零分、不重複結算',async({page})=>{
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button',{name:'同機雙人',exact:true}).click();
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  await page.clock.fastForward(11000);
  await expect(page.locator('.feedback .incorrect')).toHaveCount(2);
  const rounds=await page.evaluate(()=>JSON.parse(localStorage.getItem('idiom-king-demo-v2-12')!).active.rounds.length);
  expect(rounds).toBe(1);
});
test('八位英雄都可進入Phaser戰場，沒有載圖錯誤',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const missing:string[]=[];page.on('response',r=>{if(r.url().includes('/art/')&&!r.ok())missing.push(r.url());});
  await page.goto('/');
  const names=['炎刃','凜夜','夜影','雷曜','緋羽','星璃','紫夜','映曦'];
  for(let i=0;i<8;i++){
    await page.getByRole('button',{name:`選擇${names[i]}`,exact:true}).click();
    await page.getByRole('combobox',{name:'對手角色'}).selectOption(String((i+1)%8));
    await page.getByRole('button',{name:'進入 103 年試煉'}).click();
    await expect(page.locator('canvas')).toBeVisible();
    await page.locator('.options').getByRole('button',{name:questions[0].answer,exact:false}).click();
    await page.getByRole('button',{name:'鎖定左方答案'}).click();
    await expect(page.locator('.feedback')).toBeVisible({timeout:7000});
    await page.getByRole('button',{name:'前往下一題',exact:false}).waitFor({state:'visible'});
    await page.waitForTimeout(420);
    await page.locator('.arena').screenshot({path:`docs/screenshots/enlarged-action-${i}.png`});
    await page.waitForTimeout(1500);
    if(i%2===0)await page.screenshot({path:`docs/screenshots/battle-pair-${i}.png`,fullPage:true});
    await page.getByRole('button',{name:'冒險大廳',exact:true}).click();
  }
  expect(errors).toEqual([]);expect(missing).toEqual([]);
});


