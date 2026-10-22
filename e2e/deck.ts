import type {Page} from '@playwright/test';
import type {Question} from '../src/data';
export async function currentQuestion(page:Page,index:number):Promise<Question>{
  return page.evaluate(i=>JSON.parse(localStorage.getItem('idiom-king-demo-v2-12')!).active.deck[i],index);
}
