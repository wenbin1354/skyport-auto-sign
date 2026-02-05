(async()=>{
  const h=await(await fetch(location.href)).text();
  const f=document.createElement('iframe');f.style.display='none';
  window.addEventListener('message',e=>{if(e.data?.t==='G'){console.clear();console.log(JSON.stringify(e.data.d,null,4));f.remove()}});
  document.body.appendChild(f);
  f.contentDocument.write(h.replace(/<head[^>]*>/i,m=>m+`<script>
    const _f=window.fetch;window.fetch=async(...a)=>{
      const[u,c]=a;
      if(c?.headers){
        let k={};
        (c.headers instanceof Headers?c.headers:Object.entries(c.headers)).forEach(x=>{const[n,v]=Array.isArray(x)?x:[x,c.headers[x]];k[n.toLowerCase()]=v});
        if(k['sk-game-role'])window.parent.postMessage({t:'G',d:{cred:k.cred,skGameRole:k['sk-game-role'],timestamp:k.timestamp,sign:k.sign}},'*');
      }return _f(u,c)}
  <\/script><base href="${location.href}">`));
  f.contentDocument.close();
})();