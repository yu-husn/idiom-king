import {test,expect} from '@playwright/test';
import {currentQuestion} from './deck';

test('實際作答觸發蓄力、接近命中、收招，雙方依序出手',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-22T00:00:00Z')});
  await page.goto('/');
  await page.getByRole('button',{name:'同機雙人',exact:true}).click();
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  const arena=page.locator('.arena');
  await expect(arena).toHaveAttribute('data-phase','待機');
  await page.clock.pauseAt(await page.evaluate(()=>new Date(Date.now()+1000).toISOString()));
  for(let i=0;i<2;i++){
    await page.locator('.answer-player').nth(i).getByRole('button',{name:(await currentQuestion(page,0)).answer,exact:false}).click();
    await page.getByRole('button',{name:i?'鎖定右方答案':'鎖定左方答案',exact:true}).click();
  }
  await page.clock.runFor(200);
  await expect(arena).toHaveAttribute('data-phase','蓄力');
  expect(Number(await arena.getAttribute('data-left-x'))).toBeLessThan(295);
  await arena.screenshot({path:'docs/screenshots/exchange-01-charge.png'});
  await page.clock.runFor(390);
  await expect(arena).toHaveAttribute('data-phase','命中');
  expect(Number(await arena.getAttribute('data-left-x'))).toBeGreaterThan(570);
  expect(Number(await arena.getAttribute('data-right-x'))).toBeGreaterThanOrEqual(805);
  await arena.screenshot({path:'docs/screenshots/exchange-02-impact.png'});
  await page.clock.runFor(300);
  await expect(arena).toHaveAttribute('data-phase','收招');
  await arena.screenshot({path:'docs/screenshots/exchange-03-recover.png'});
  await page.clock.runFor(920);
  await expect(arena).toHaveAttribute('data-phase','命中');
  expect(Number(await arena.getAttribute('data-right-x'))).toBeLessThan(530);
  await page.clock.runFor(850);
  await expect(arena).toHaveAttribute('data-phase','等待下一回合');
  await expect(arena).toHaveAttribute('data-left-x','295');
  await expect(arena).toHaveAttribute('data-right-x','805');
  await arena.screenshot({path:'docs/screenshots/exchange-04-idle.png'});
  await page.getByRole('button',{name:'前往下一題',exact:false}).click();
  await expect(page.getByRole('timer')).toContainText('10');
  expect(errors).toEqual([]);
});

test('十秒黑字方框倒數，逾時保留已鎖定答案並只結算一次',async({page})=>{
  await page.clock.install({time:new Date('2026-10-22T00:00:00Z')});
  await page.goto('/');
  await page.getByRole('button',{name:'同機雙人',exact:true}).click();
  await page.clock.pauseAt(await page.evaluate(()=>new Date(Date.now()+1000).toISOString()));
  await page.getByRole('button',{name:'進入 103 年試煉'}).click();
  const timer=page.getByRole('timer',{name:'作答倒數'});
  await expect(timer).toContainText('10');
  expect(await timer.locator('strong').evaluate(el=>getComputedStyle(el).color)).toBe('rgb(0, 0, 0)');
  await page.locator('.answer-player').first().getByRole('button',{name:(await currentQuestion(page,0)).answer,exact:false}).click();
  await page.getByRole('button',{name:'鎖定左方答案',exact:true}).click();
  await page.clock.runFor(7200);
  await expect(timer).toHaveClass(/urgent/);
  await timer.screenshot({path:'docs/screenshots/timer-10-seconds.png'});
  await page.clock.runFor(3000);
  await expect(page.locator('.feedback .correct')).toHaveCount(1);
  await expect(page.locator('.feedback .incorrect')).toHaveCount(1);
  const rounds=await page.evaluate(()=>JSON.parse(localStorage.getItem('idiom-king-demo-v2-12')!).active.rounds);
  expect(rounds).toHaveLength(1);expect(rounds[0].answers[1].elapsed).toBe(10000);
  expect(rounds[0].answers[0].verdict).toBe('correct');
});


