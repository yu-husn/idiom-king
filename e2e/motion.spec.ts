import {test,expect} from '@playwright/test';
import {currentQuestion} from './deck';

test('放大角色在減少動態、低特效及窄視窗仍可答題',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByLabel('減少動態',{exact:true}).check();
  await page.getByLabel('低特效',{exact:true}).check();
  await page.getByRole('button',{name:'同機雙人',exact:true}).click();
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  await expect(page.locator('canvas')).toBeVisible();
  for(let i=0;i<2;i++){
    await page.locator('.answer-player').nth(i).getByRole('button',{name:(await currentQuestion(page,0)).answer,exact:false}).click();
    await page.getByRole('button',{name:i?'鎖定右方答案':'鎖定左方答案',exact:true}).click();
  }
  await expect(page.locator('.feedback')).toBeVisible();
  await page.locator('.arena').screenshot({path:'docs/screenshots/enlarged-reduced-mobile.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'前往下一題',exact:false}).click();
  await expect(page.locator('.round-counter strong')).toHaveText('2');
});
