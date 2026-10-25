/* Détecteur de grille Mines 5x5 (diamants verts / mines rouges) */
(function(g){
function classify(r,gg,b){
  var mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
  if(mx<30)return 0;var dl=mx-mn,s=dl/mx;if(s<0.33)return 0;
  var h;if(mx===r)h=((gg-b)/dl+6)%6;else if(mx===gg)h=(b-r)/dl+2;else h=(r-gg)/dl+4;h*=60;
  if(h>=95&&h<=165)return 1;           // vert = diamant
  if(h>=290||h<=22)return 2;           // rouge / magenta = mine
  return 0;
}
function detectPixels(d,W,H){
  var N=W*H,lab=new Uint8Array(N),i,p;
  for(i=0,p=0;i<N;i++,p+=4)lab[i]=classify(d[p],d[p+1],d[p+2]);
  var vis=new Uint8Array(N),st=new Int32Array(N),comps=[];
  for(i=0;i<N;i++){if(!lab[i]||vis[i])continue;var t=lab[i],sp=0;st[sp++]=i;vis[i]=1;
    var c={t:t,a:0,x0:W,x1:0,y0:H,y1:0,sx:0,sy:0};
    while(sp){var k=st[--sp],x=k%W,y=(k-x)/W;c.a++;c.sx+=x;c.sy+=y;
      if(x<c.x0)c.x0=x;if(x>c.x1)c.x1=x;if(y<c.y0)c.y0=y;if(y>c.y1)c.y1=y;
      if(x>0&&!vis[k-1]&&lab[k-1]===t){vis[k-1]=1;st[sp++]=k-1}
      if(x<W-1&&!vis[k+1]&&lab[k+1]===t){vis[k+1]=1;st[sp++]=k+1}
      if(y>0&&!vis[k-W]&&lab[k-W]===t){vis[k-W]=1;st[sp++]=k-W}
      if(y<H-1&&!vis[k+W]&&lab[k+W]===t){vis[k+W]=1;st[sp++]=k+W}}
    if(c.a>=10)comps.push(c);}
  // fusion des morceaux d'une même icône
  var merged=true;
  while(merged){merged=false;
    for(var a=0;a<comps.length&&!merged;a++)for(var b=a+1;b<comps.length;b++){var A=comps[a],B=comps[b];if(A.t!==B.t)continue;
      var m=0.12*Math.max(A.x1-A.x0,A.y1-A.y0,B.x1-B.x0,B.y1-B.y0)+1;
      if(A.x0-m<=B.x1&&B.x0-m<=A.x1&&A.y0-m<=B.y1&&B.y0-m<=A.y1){
        A.a+=B.a;A.sx+=B.sx;A.sy+=B.sy;A.x0=Math.min(A.x0,B.x0);A.x1=Math.max(A.x1,B.x1);A.y0=Math.min(A.y0,B.y0);A.y1=Math.max(A.y1,B.y1);
        comps.splice(b,1);merged=true;break;}}}
  if(comps.length<5)return fail('Pas assez d\'icônes vertes/rouges trouvées');
  // taille de référence = mode des aires (échelle log)
  var best=-1,A=0;
  comps.forEach(function(c){var n=0;comps.forEach(function(o){if(Math.abs(Math.log(o.a/c.a))<0.92)n++});if(n>best||(n===best&&c.a>A)){best=n;A=c.a}});
  var kept=comps.filter(function(c){return c.a>=A/9&&c.a<=A*2.6});
  kept.forEach(function(c){c.cx=c.sx/c.a;c.cy=c.sy/c.a;c.w=c.x1-c.x0+1;c.h=c.y1-c.y0+1});
  var ws=kept.map(function(c){return Math.max(c.w,c.h)}).sort(function(a,b){return a-b});var S=ws[ws.length>>1];
  function axis(key){var arr=kept.slice().sort(function(a,b){return a[key]-b[key]});var groups=[],cur=null;
    arr.forEach(function(c){if(cur&&c[key]-cur.last<0.55*S){cur.m.push(c);cur.last=c[key]}else{cur={m:[c],last:c[key]};groups.push(cur)}});
    groups.forEach(function(g){g.pos=g.m.reduce(function(s,c){return s+c[key]},0)/g.m.length});
    var bw=null,bs=-1;
    for(var i=0;i+5<=groups.length;i++){var w=groups.slice(i,i+5),pit=[];for(var j=1;j<5;j++)pit.push(w[j].pos-w[j-1].pos);
      var mx=Math.max.apply(0,pit),mn=Math.min.apply(0,pit);if(mn<0.8*S||mx/mn>1.35)continue;
      var sc=w.reduce(function(s,g){return s+g.m.length},0);if(sc>bs){bs=sc;bw=w}}
    return bw;}
  function lattice(key,P){ // lignes régulières espacées de P (tolère des rangées coupées au bord)
    var bestL=null,bs=-1;
    kept.forEach(function(anc){if(Math.min(anc.w,anc.h)<0.7*S)return;
      for(var off=-4;off<=0;off++){var L=[],sc=0;
        for(var k=0;k<5;k++){var pos=anc[key]+(off+k)*P,m=kept.filter(function(c){return Math.abs(c[key]-pos)<0.42*P});L.push({pos:pos,m:m});sc+=m.length*10;if(!m.length){var lim=key==='cy'?H:W;if(pos>0.2*P&&pos<lim-0.2*P)sc-=1;else sc-=0.5*Math.min(1,Math.max(-pos,pos-lim,0)/P)}}
        if(sc>bs){bs=sc;bestL=L}}});
    return bestL;}
  function pitch(gr){return (gr[4].pos-gr[0].pos)/4}
  var cols=axis('cx'),rows=axis('cy');
  if(cols&&!rows)rows=lattice('cy',pitch(cols));
  else if(rows&&!cols)cols=lattice('cx',pitch(rows));
  if(!cols||!rows)return fail('Grille 5×5 non reconnue');
  var grid=[],area=[];for(i=0;i<25;i++){grid.push('?');area.push(0)}
  kept.forEach(function(c){var ci=-1,ri=-1;cols.forEach(function(g,k){if(g.m.indexOf(c)>=0)ci=k});rows.forEach(function(g,k){if(g.m.indexOf(c)>=0)ri=k});
    if(ci<0||ri<0)return;var idx=ri*5+ci;if(c.a>area[idx]){area[idx]=c.a;grid[idx]=c.t===1?'D':'M'}});
  var s=grid.join('');
  return {ok:s.indexOf('?')<0,grid:s,found:25-(s.split('?').length-1),
    box:{x0:cols[0].pos,x1:cols[4].pos,y0:rows[0].pos,y1:rows[4].pos,W:W,H:H}};
  function fail(msg){return {ok:false,grid:'?????????????????????????',found:0,error:msg}}
}
function detectFromSource(src,sw,sh){
  var sc=Math.min(1,520/Math.max(sw,sh)),W=Math.max(1,Math.round(sw*sc)),H=Math.max(1,Math.round(sh*sc));
  var cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d',{willReadFrequently:true});
  x.drawImage(src,0,0,W,H);return detectPixels(x.getImageData(0,0,W,H).data,W,H);
}
g.MinesDetector={detectPixels:detectPixels,detectFromSource:detectFromSource};
})(typeof window!=='undefined'?window:globalThis);
