import type {Verdict} from './domain';
export const ATTACK_SLOT=1220;
export function battleDuration(verdicts:readonly Verdict[],reduce=false){
  return reduce?450:Math.max(1,verdicts.filter(v=>v==='correct').length)*ATTACK_SLOT+100;
}
