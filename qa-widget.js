(()=>{
 const widget=document.createElement('div');widget.className='qa-widget';widget.setAttribute('role','group');widget.setAttribute('aria-label','Interactive QA demo');widget.innerHTML='<span class="qa-widget-label">EXPERIENCE THE DIFFERENCE</span><div><button data-qa-mode="without">Without QA</button><button data-qa-mode="with">With QA <span>✧</span></button></div>';
 document.body.append(widget);
 function activate(mode){const target=document.querySelector(mode==='with'?'#with-qa':'#without-qa');if(target){target.click();document.querySelector('#quality-lab').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});widget.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qaMode===mode)));}else{location.href='/?qa='+mode+'#quality-lab';}}
 widget.querySelectorAll('button').forEach(b=>b.onclick=()=>activate(b.dataset.qaMode));
 const selected=new URLSearchParams(location.search).get('qa');if(selected==='with'||selected==='without')activate(selected);
 const lab=document.querySelector('#quality-lab');if(lab){const sync=()=>{const mode=document.querySelector('#with-qa').getAttribute('aria-pressed')==='true'?'with':'without';widget.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qaMode===mode)));};new MutationObserver(sync).observe(lab,{attributes:true,attributeFilter:['class']});sync();}
})();
