import {test,expect} from '@playwright/test';
test('配樂可切換、隨場景更換、關閉後停止發聲，冒險地圖無頁面溢出',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const status=()=>page.evaluate(async()=>{const path=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/src/audio.ts'))!;return (await import(path)).music.status();});
  expect((await status()).playing).toBe(false);
  await page.getByRole('button',{name:'切換配樂',exact:true}).click();
  await expect.poll(async()=>(await status()).playing).toBe(true);
  expect((await status()).context).toBe('running');
  expect((await status()).theme).toBe('journey');
  await page.getByLabel('配樂音量').fill('0.2');
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect.poll(async()=>(await status()).theme).toBe('battle');
  expect((await status()).voices).toBeGreaterThan(0);
  await page.screenshot({path:'docs/screenshots/adventure-battle.png',fullPage:true});
  await page.getByRole('button',{name:'切換配樂',exact:true}).click();
  await expect.poll(async()=>(await status()).playing).toBe(false);
  expect((await status()).voices).toBe(0);
  await page.getByRole('button',{name:'冒險大廳',exact:true}).click();
  await page.setViewportSize({width:1024,height:768});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'世界地圖',exact:true}).click();
  await page.locator('.journey').scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/screenshots/adventure-map.png'});
  expect(errors).toEqual([]);
});


test('十三年度配樂引擎、無下載或試聽入口、關卡區不需橫捲',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.journey')).toHaveCount(0);
  await page.getByRole('button',{name:'選擇星璃',exact:true}).click();
  await expect(page.getByRole('img',{name:'星璃角色立繪',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'世界地圖',exact:true}).click();
  await expect(page.locator('.stage-art')).toHaveCount(13);
  expect(new Set(await page.locator('.stage-art').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundPosition))).size).toBe(13);
  expect((await page.request.get('/art/annual-stages.png')).ok()).toBe(true);
  await page.locator('.stages button').nth(12).click();
  await expect(page.locator('.world-detail h3')).toHaveText('王者之巔');
  await expect(page.locator('.world-detail button')).toBeDisabled();
  await page.locator('.stages button').first().click();
  const status=()=>page.evaluate(async()=>{const path=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/src/audio.ts'))!;return (await import(path)).music.status();});
  await page.getByRole('button',{name:'切換配樂',exact:true}).click();
  await expect(page.getByLabel('年度配樂試聽')).toHaveCount(0);
  for(let year=103;year<=115;year++){
    await page.evaluate(async(year)=>{const path=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/src/audio.ts'))!;(await import(path)).music.play('battle',.2,year);},year);
    await expect.poll(async()=>(await status()).year).toBe(year);
    expect((await status()).playing).toBe(true);
    expect((await status()).voices).toBeGreaterThan(0);
  }
  for(const width of [1024,390]){
    await page.setViewportSize({width,height:850});
    expect(await page.locator('.world-map').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('.stages button')).toHaveCount(13);
  }
  await page.setViewportSize({width:1024,height:900});
  await page.locator('.journey').screenshot({path:'docs/screenshots/compact-annual-map.png'});
  await page.getByRole('button',{name:'冒險大廳',exact:true}).click();
  await page.screenshot({path:'docs/screenshots/fantasy-lobby.png',fullPage:true});
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  await expect.poll(async()=>(await status()).year).toBe(103);
  await expect(page.getByRole('button',{name:'角色動作室',exact:true})).toHaveCount(0);
  await expect(page.locator('.motion-lab')).toHaveCount(0);
  expect(errors).toEqual([]);
});

