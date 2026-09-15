const $=id=>document.getElementById(id);
let active=false,queue=Promise.resolve();
for(const id of ['osc-bridge','osc-host','osc-port','osc-address']){
  try{const saved=localStorage.getItem(id);if(saved)$(id).value=saved;}catch{}
  $(id).addEventListener('change',()=>{try{localStorage.setItem(id,$(id).value.trim());}catch{}});
}
function send(value,reason){
  const message={host:$('osc-host').value.trim(),port:Number($('osc-port').value),address:$('osc-address').value.trim(),value};
  const bridge=$('osc-bridge').value.trim().replace(/\/$/,'');
  queue=queue.then(async()=>{
    try{
      $('osc-badge').textContent='送出中';
      const response=await fetch(bridge+'/osc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(message),signal:AbortSignal.timeout(2500)});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'轉送失敗');
      $('osc-badge').textContent='UDP 已送出';
      $('osc-status').textContent=`${message.host}:${message.port} · 請在 TD 確認接收。`;
      log(`${reason} · ${message.address} ${value} → ${message.host}:${message.port}`);
    }catch(error){
      $('osc-badge').textContent='送出失敗';
      $('osc-status').textContent='請確認轉送服務已啟動及 IP／Port 設定。'+error.message;
      log(`${reason} · ${message.address} ${value} · 失敗`);
    }
  });
}
function log(text){const li=document.createElement('li');li.textContent=new Date().toLocaleTimeString()+' '+text;$('osc-log').prepend(li);while($('osc-log').children.length>5)$('osc-log').lastChild.remove();}
export function syncHeatOSC(next){if(next===active)return;active=next;if($('osc-auto').checked)send(active?1:0,active?'分鏡進入':'分鏡離開');}
$('osc-auto').onchange=()=>send($('osc-auto').checked&&active?1:0,'自動模式切換');
$('osc-enter').onclick=()=>send(1,'手動進入');
$('osc-exit').onclick=()=>send(0,'手動離開');
$('osc-preview').onclick=()=>window.dispatchEvent(new Event('osc-preview-heat'));
