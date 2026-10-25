(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function md(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}
function card(title,inner){return '<div class="card"><h2>'+title+'</h2>'+inner+'</div>'}
function pickHtml(p,cls){
  return '<div class="pick '+(cls||'')+'"><div class="name">'+esc(p.player)+(p.team?' <span class="tag">'+esc(p.team)+'</span>':'')+(p.best?' <span class="tag ok">meilleur de la nuit</span>':'')+'</div>'+
  '<div class="meta">'+esc(p.game||p.match||'')+(p.time?' · '+esc(p.time):'')+'</div>'+
  '<div>Chance : <span class="big">'+esc(p.chance)+'</span>'+(p.min?' · cote minimum <b>'+esc(p.min)+'</b>':'')+'</div>'+
  (p.example?'<div class="ex">👉 '+esc(p.example)+'</div>':'')+'</div>';
}
function hockey(h,data){
  var o='';
  o+=card('🏒 Hockey – '+esc(data.date_fr),(h.intro||[]).map(function(l){return '<p>'+md(l)+'</p>'}).join('')+
    (h.games&&h.games.length?'<h3>🕗 Matchs (heure de Paris)</h3><ul>'+h.games.map(function(g){return '<li><b>'+esc(g.time)+'</b> : '+esc(g.game)+'</li>'}).join('')+'</ul>':'')+
    '<p class="small">Modèle : '+esc(h.model)+'</p>');
  o+=card('✅ À jouer (1 € chacun, en simple)',
    (h.a_jouer.length?h.a_jouer.map(function(p){return pickHtml(p)}).join(''):'<p>Aucun joueur assez sûr ce soir. Pas de pari, c\'est aussi un bon choix.</p>')+
    (h.notes||[]).map(function(l){return '<p class="warn">'+md(l)+'</p>'}).join(''));
  if(h.surveiller.length)o+=card('👀 À surveiller (moins sûrs)',h.surveiller.map(function(p){return pickHtml(p,'watch')}).join(''));
  if(h.bestD.length)o+=card('🛡️ Meilleur défenseur de chaque match',h.bestD.map(function(p){return pickHtml(p,'d')}).join('')+'<p class="small">Le meilleur défenseur marque environ 1 soir sur 5. 1 € maximum.</p>');
  if(h.point.length)o+=card('🎯 Plus sûr : « au moins 1 point »','<ul>'+h.point.map(function(p){return '<li>• <b>'+esc(p.player)+'</b> : '+esc(p.form)+'</li>'}).join('')+'</ul>'+
    '<p>Ce pari passe environ 7 fois sur 10.</p><p>👉 À 1,53 ou plus, c\'est intéressant. Entre 1,39 et 1,52, c\'est juste correct. En dessous de 1,39, tu ne joues pas (exemple : 1,17, non).</p>');
  if(h.totals.length)o+=card('📈 Match à buts','<ul>'+h.totals.map(function(t,i){return '<li>'+(i+1)+'. '+(t.open?'🔥 ':'')+'<b>'+esc(t.game)+'</b> ('+esc(t.time)+') : environ '+esc(t.book)+' buts attendus (ligne '+esc(t.line)+'). Notre modèle : '+esc(t.model)+'.</li>'}).join('')+'</ul><p class="small">Chiffres des cotes publiques américaines, pas Winamax.</p>');
  if(h.liiga){var L=h.liiga;var li='';
    if(L.a_jouer.length)li+=L.a_jouer.map(function(p){return pickHtml(p)}).join('');else if(L.note)li+='<p>'+esc(L.note)+'</p>';
    L.games.forEach(function(g){li+='<h3>'+esc(g.game)+'</h3><ul>'+g.top.map(function(t){return '<li>• '+esc(t.player)+' ('+esc(t.team)+') : '+esc(t.chance)+', min '+esc(t.min)+'</li>'}).join('')+(g.bestD?'<li>🛡️ '+esc(g.bestD.player)+' : '+esc(g.bestD.chance)+', min '+esc(g.bestD.min)+'</li>':'')+'</ul>'});
    if(L.point.length)li+='<h3>🎯 Au moins 1 point</h3><ul>'+L.point.map(function(p){return '<li>• <b>'+esc(p.player)+'</b> : '+esc(p.form)+'. À '+esc(p.min)+' ou plus, tu joues.</li>'}).join('')+'</ul>';
    o+=card('🇫🇮 Liiga',li);
  } else if(h.liiga_status){o+=card('🇫🇮 Liiga','<p>'+esc(h.liiga_status.charAt(0).toUpperCase()+h.liiga_status.slice(1))+' aujourd\'hui.</p>')}
  (h.info||[]).filter(function(s){return !isBilan(s)}).forEach(function(s,i){
    o+='<details'+'><summary>'+md(s.title)+'</summary><div class="in">'+s.lines.map(function(l){return '<p>'+md(l)+'</p>'}).join('')+'</div></details>';
  });
  return o;
}
function isBilan(s){return /BILAN D/i.test(s.title)}
function bilanHtml(h){
  var s=(h.info||[]).filter(isBilan)[0];
  if(!s)return card('📋 Bilan','<p>Pas de bilan pour aujourd\'hui.</p>');
  var o=card(md(s.title.replace(/\*\*/g,'').replace(/BILAN D'HIER/i,'Bilan d\'hier')),'<p class="small">Résultats des choix d\'hier, puis les compteurs depuis le début.</p>');
  var cur=null,buf=[],inList=false;
  function flush(){if(inList){buf.push('</ul>');inList=false}if(cur!==null||buf.length)o+=card(cur||'',buf.join(''));buf=[]}
  s.lines.forEach(function(l){
    var t=l.trim();
    if(/^[^\w•]*\*\*[^*]+\*\*\s*$/.test(t)){flush();cur=md(t.replace(/\*\*/g,''));return}
    if(/^.{0,30}:\s*$/.test(t)){if(inList){buf.push('</ul>');inList=false}buf.push('<h3>'+md(t.replace(/:\s*$/,''))+'</h3>');return}
    if(t.indexOf('•')===0){if(!inList){buf.push('<ul class="bl">');inList=true}buf.push('<li>'+md(t.replace(/^•\s*/,''))+'</li>');return}
    if(inList){buf.push('</ul>');inList=false}
    var c=t.indexOf('✅')===0?' ok':(t.indexOf('❌')===0?' no':'');
    buf.push('<p class="bline'+c+'">'+md(t)+'</p>');
  });
  flush();
  return o;
}
function footHtml(f){
  var o=card('⚽ Foot – à lire d\'abord',
    '<p>✅ Mes chiffres sont justes : quand je dis 45 %, le joueur marque environ 45 fois sur 100.</p>'+
    '<p>❌ Mais ce n\'est <b>pas prouvé rentable</b>. Winamax garde environ 15 % pour lui sur chaque cote.</p>'+
    '<p>👉 Exemple : un joueur marque 1 fois sur 2. La cote juste est 2,00. Winamax donne plutôt 1,75. À 1,75, tu perds sur la durée.</p>'+
    '<p>⛔ Pas de pari sur Kane, Mbappé ou Haaland juste parce que le modèle les sort.</p>'+
    '<p>✔️ Tu joues seulement si la cote Winamax est au-dessus de « tu joues à ». C\'est rare, 1 ou 2 fois par semaine.</p>');
  if(!f.available){return o+card('📭 Pas d\'analyse foot','<p>Pas de données foot pour aujourd\'hui.</p>')}
  function fp(p){var c=p.star?'star':'';var x=pickHtml({player:p.player,match:p.league+' · '+p.match,time:p.day,chance:p.chance,min:p.min,example:p.example},c);
    var add='<div class="small">Cote juste '+esc(p.min)+'. Avec la marge de sécurité, tu joues à <b>'+esc(p.play)+'</b> ou plus.'+(p.us_odds?' Cote vue (bookmaker américain, pas Winamax) : '+esc(p.us_odds)+(p.us_ok?' <span class="tag ok">au-dessus</span>':' <span class="tag no">trop basse</span>'):'')+'</div>'+
      (p.star?'<div class="warn">⚠️ Star : le bookmaker la cote souvent mieux que moi. Pas de pari juste sur le modèle.</div>':'');
    return x.replace(/<\/div>$/,add+'</div>')}
  o+=card('⚽ Joueurs à 40 % ou plus',(f.picks.length?f.picks.map(fp).join(''):'<p>Aucun joueur à 40 % ou plus.</p>')+'<p class="small">Mis à jour le '+esc(f.updated)+'. Revérifie que le joueur est titulaire.</p>');
  if(f.others.length)o+=card('👀 À surveiller (30 à 40 %)',f.others.map(fp).join(''));
  return o;
}
function calc(){
  var P=parseFloat(String(document.getElementById('cP').value).replace(',','.'))/100;
  var O=parseFloat(String(document.getElementById('cO').value).replace(',','.'));
  var r=document.getElementById('cR');
  if(!(P>0&&P<1)||!(O>1)){r.className='verdict';r.textContent='Remplis les 2 cases.';return}
  var ev=P*O-1,min=1/P,play=1.10/P;
  function f2(x){return x.toFixed(2).replace('.',',')}
  r.className='verdict '+(ev>=0.10?'ok':'no');
  r.innerHTML=(ev>=0.10?'✅ Tu joues (1 €)':'❌ Tu ne joues pas')+'<div class="small" style="color:#eef3f8">Avantage : '+Math.round(ev*100)+' %. Cote juste : '+f2(min)+'. Tu joues à partir de '+f2(play)+'.</div>';
}
window.Buteurs={hockey:hockey,bilan:bilanHtml,foot:footHtml,calc:calc};
if(typeof document==='undefined')return;
document.querySelectorAll('nav button').forEach(function(b){b.addEventListener('click',function(){
  document.querySelectorAll('nav button').forEach(function(x){x.classList.toggle('on',x===b)});
  document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('on',t.id===b.dataset.tab)});window.scrollTo(0,0);})});
['cP','cO'].forEach(function(id){document.getElementById(id).addEventListener('input',calc)});
fetch('data.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
  document.getElementById('stamp').textContent='Analyse du '+d.date_fr+' · mise à jour '+d.generated;
  document.getElementById('hockey').innerHTML=hockey(d.hockey,d);
  document.getElementById('foot').innerHTML=footHtml(d.foot);
  document.getElementById('bilan').innerHTML=bilanHtml(d.hockey);
}).catch(function(){document.getElementById('stamp').textContent='Impossible de charger l\'analyse. Vérifie ta connexion.'});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){});
})();
