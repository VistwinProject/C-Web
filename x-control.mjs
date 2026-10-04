// Explicit ?x=1 opt-in; static previews retain their existing local controls.
export function connectX({snapshot, apply}) {
  if(new URLSearchParams(location.search).get('x')!=='1')return;
  const instance=crypto.randomUUID();
  let epoch=null,appliedId=null,error=null,stopped=false;
  const seen=new Set();
  const badge=document.createElement('span');badge.id='x-status';badge.setAttribute('role','status');
  badge.textContent='X 連線中';document.querySelector('.playback').append(badge);
  async function tick(){
    try{
      const state=snapshot();
      const r=await fetch('/api/x/report',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({instance,epoch,appliedId,error,...state}),signal:AbortSignal.timeout(2000)});
      const result=await r.json();
      if(!r.ok)throw Error(result.error||'X 連線中斷');
      if(epoch!==result.epoch){epoch=result.epoch;appliedId=null;error=null;seen.clear();}
      badge.textContent=state.ready?'X 已連接 · 主頁回報中':'X 已連接 · 畫面準備中';
      if(result.command&&!seen.has(result.command.id)){
        seen.add(result.command.id);if(seen.size>100)seen.delete(seen.values().next().value);
        error=null;
        try{apply(result.command.operation);}catch(e){error=e.message;}
        appliedId=result.command.id;
      }
    }catch(e){badge.textContent=e.message||'X 連線中斷 · 本機操作仍可用';}
    if(!stopped)setTimeout(tick,500);
  }
  addEventListener('pagehide',()=>{stopped=true;});tick();
}
