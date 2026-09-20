const $=id=>document.getElementById(id);
let active=null,lastTime=null,busy=false,pending=null;
const storageKey=id=>'scene-osc-v2:'+id;
for(const id of ['osc-bridge','osc-host','osc-port','osc-address','osc-lead']){
  try{const saved=localStorage.getItem(storageKey(id));if(saved!==null)$(id).value=saved;}catch{}
  $(id).addEventListener('change',()=>{try{localStorage.setItem(storageKey(id),$(id).value.trim());}catch{}});
}
function log(text){const li=document.createElement('li');li.textContent=new Date().toLocaleTimeString()+' '+text;$('osc-log').prepend(li);while($('osc-log').children.length>8)$('osc-log').lastChild.remove();}
async function deliver(job){
  busy=true;const started=performance.now();
  try{
    $('osc-badge').textContent='送出中';
    const response=await fetch(job.bridge+'/osc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(job.message),signal:AbortSignal.timeout(800)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'轉送失敗');
    const ms=Math.round(performance.now()-started);
    $('osc-badge').textContent='UDP 已送出 · '+job.message.value;
    $('osc-status').textContent=`${job.message.host}:${job.message.port} · HTTP 往返 ${ms} ms · TD 接收待確認`;
    log(`${job.reason} · ${job.message.address} ${job.message.value} · ${ms} ms`);
  }catch(error){$('osc-badge').textContent='送出失敗';$('osc-status').textContent='請確認轉送服務。'+error.message;log(`${job.reason} · ${job.message.value} · 失敗（不重送）`);}
  finally{busy=false;const next=pending;pending=null;if(next)deliver(next);}
}
function send(value,reason){
 const job={message:{host:$('osc-host').value.trim(),port:Number($('osc-port').value),address:$('osc-address').value.trim(),value},bridge:$('osc-bridge').value.trim().replace(/\/$/,''),reason};
 // One in flight, latest pending state only: never replay a backlog of old scenes.
 if(busy){pending=job;return;}deliver(job);
}
export function syncSceneOSC(time,playing,version,force=false){
 const actual=Math.min(2,Math.max(0,Math.floor(time/30)));
 const lead=Math.min(1000,Math.max(0,Number($('osc-lead').value)||0))/1000;
 let next=actual;
 if(!force&&lastTime!==null&&time>=lastTime){
   if(playing&&version==='story')next=Math.min(2,Math.floor((time+lead)/30));
   // Keep an anticipated scene latched if playback pauses before its boundary.
   if(active!==null)next=Math.max(next,active);
 }
 lastTime=time;
 if(next===active&&!force)return;active=next;
 if($('osc-auto').checked)send(next,force?'手動切幕':'分鏡同步');
}
$('osc-auto').onchange=()=>{pending=null;if($('osc-auto').checked&&active!==null)send(active,'啟用同步');};
document.querySelectorAll('[data-osc-test]').forEach(b=>b.onclick=()=>send(Number(b.dataset.oscTest),'手動測試'));
