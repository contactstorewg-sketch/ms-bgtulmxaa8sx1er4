(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function md(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}
function card(title,inner){return '<div class="card"><h2>'+title+'</h2>'+inner+'</div>'}
function pickHtml(p,cls){
  return '<div class="pick '+(cls||'')+'"><div class="name">'+esc(p.player)+(p.team?' <span class="tag">'+esc(p.team)+'</span>':'')+(p.best?' <span class="tag ok">meilleur de la nuit</span>':'')+'</div>'+
  '<div class="meta">'+esc(p.game||p.match||'')+(p.time?' · '+esc(p.time):'')+'</div>'+
  '<div>Chance : <span class="big">'+esc(p.chance)+'</span>'+(p.min&&!p.fair?' · cote minimum <b>'+esc(p.min)+'</b>':'')+'</div>'+(p.fair?'<div>Tu joues à <b class="big">'+esc(p.min)+'</b> ou plus</div>'+fairLine(p):'')+wmLine(p)+
  (p.example?'<div class="ex">👉 '+esc(p.example)+'</div>':'')+'</div>';
}
var DATA={};
function fairLine(p){return p.fair?'<div class="small fair">cote juste '+esc(p.fair)+'</div>':''}
function badge(ok){return ok?'<span class="tag ok">✅ tu joues</span>':'<span class="tag no">❌ tu ne joues pas</span>'}
function wmLine(p){return p.wm?'<div class="wm">Winamax : <b>'+esc(p.wm)+'</b> '+badge(p.wm_ok)+'</div>':''}
function wmPts(p){return p.wm?'<div class="wm">Winamax : <b>'+esc(p.wm)+'</b> '+(p.wm_level==='correct'?'<span class="tag">juste correct</span>':badge(p.wm_ok))+'</div>':''}
function coverLine(p){
  var c=p.cover_point; if(!c) return '';
  var odd=c.odds?esc(c.odds):'–';
  var cls=c.ok?'cover ok':'cover no';
  var o='<div class="'+cls+'">🎯 Couverture point : <b>'+odd+'</b>'+(c.min?' <span class="small">(dès '+esc(c.min)+')</span>':'')+' · '+esc(c.note||'')+'</div>';
  if(c.mise){
    o+='<div class="cover-mise">Mise : <b>'+esc(c.mise)+'</b></div>';
    if(c.outcomes) o+='<div class="cover-out">'+esc(c.outcomes)+'</div>';
  }
  return o;
}
function playable(p){return p.wm?p.wm_ok:true}
function started(d,t){var m=/(\d{1,2})h(\d{2})/.exec(t||'');if(!m||!d.date)return false;var x=new Date(d.date+'T'+('0'+m[1]).slice(-2)+':'+m[2]+':00+01:00');if(+m[1]<12)x=new Date(x.getTime()+864e5);return Date.now()>x.getTime()+5*60e3}
function valRow(p,i){
  return '<div class="vrow"><div class="vtop"><div class="vname">'+(i+1)+'. '+esc(p.player)+' <span class="tag">'+esc(p.team)+'</span>'+(p.star?' <span class="tag ok">⭐</span>':'')+(p.up?' <span class="tag">⬆️</span>':'')+(p.down?' <span class="tag">⬇️</span>':'')+'</div><div class="vodd">'+esc(p.wm)+'<small>Winamax</small></div></div>'+
  '<div class="vone">Gagne <b>1 fois sur '+esc(p.one_in)+'</b></div>'+
  '<div class="meta">'+esc(p.why)+' · '+esc(p.game)+' · '+esc(p.time)+'</div>'+
  '<div class="small fair">cote juste '+esc(p.fair)+' · tu joues dès '+esc(p.min)+(p.market_fair?' · autres sites '+esc(p.market_fair):'')+'</div>'+coverLine(p)+'</div>';
}
function limRow(p){
  return '<div class="vrow lrow"><div class="vtop"><div class="vname">🟡 '+esc(p.player)+' <span class="tag">'+esc(p.team)+'</span>'+(p.down?' <span class="tag">⬇️</span>':'')+'</div><div class="vodd">'+esc(p.wm)+'<small>Winamax</small></div></div>'+
  '<div class="small">Minimum '+esc(p.min)+' · chance '+esc(p.chance)+' · gagne 1 fois sur '+esc(p.one_in)+'</div>'+
  '<div class="meta">'+esc(p.why)+' · '+esc(p.game)+' · '+esc(p.time)+'</div>'+coverLine(p)+'</div>';
}
function sigRow(p){
  return '<div class="vrow srow"><div class="vtop"><div class="vname">🔥 '+esc(p.player)+' <span class="tag">'+esc(p.team)+'</span>'+(p.down?' <span class="tag">⬇️</span>':'')+'</div><div class="vodd">'+(p.wm?esc(p.wm):'–')+'<small>Winamax</small></div></div>'+
  '<div class="vsigs">'+esc(p.signals)+'</div>'+
  '<div class="small">Minimum '+esc(p.min)+' · chance '+esc(p.chance)+' · gagne 1 fois sur '+esc(p.one_in)+'</div>'+
  (p.gap?'<div class="small gap">'+esc(p.gap)+'</div>':'')+
  '<div class="meta">'+esc(p.game)+' · '+esc(p.time)+'</div>'+coverLine(p)+'</div>';
}
function liigaBlocks(d,L){
  if(!L||!(L.values||L.limite||L.feeling))return '';
  var f=function(a){return (a||[]).filter(function(p){return !(d&&started(d,p.time))})};
  var v=f(L.values),lm=f(L.limite),sg=f(L.feeling),o='';
  o+=v.length?v.map(valRow).join(''):'<p class="vnone">❌ Pas de value Liiga.</p>';
  if(lm.length)o+='<h3 class="vlim">🟡 Limite (petite marge)</h3>'+lm.map(limRow).join('');
  if(sg.length)o+='<h3 class="vsig">🔥 Ce qui me fait dire (cote pas forcément bonne)</h3>'+sg.map(sigRow).join('');
  if(L.read_at)o+='<p class="small">Cotes Winamax Liiga lues le '+esc(L.read_at)+'.</p>';
  return o;
}
function resume(d){
  var h=d.hockey,o='';
  var vb='';
  if(h.values_status!=='ok'){
    vb='<p class="vnone">⏳ Cotes Winamax lues à 15h.</p><p class="small">Les values du soir s\'affichent ici après la lecture des cotes.</p>';
  } else {
    var v=(h.values||[]).filter(function(p){return !started(d,p.time)});
    vb=v.length?v.map(valRow).join(''):'<p class="vnone">❌ Pas de value ce soir.</p><p>On ne joue rien. C\'est un bon choix aussi.</p>';
    var lm=(h.values_limite||[]).filter(function(p){return !started(d,p.time)});
    if(lm.length)vb+='<h3 class="vlim">🟡 Limite (petite marge)</h3><p class="small">Cote au-dessus de la cote juste, mais sous le minimum. Petite marge : à toi de voir.</p>'+lm.map(limRow).join('');
    var sg=(h.values_signaux||[]).filter(function(p){return !started(d,p.time)});
    if(sg.length)vb+='<h3 class="vsig">🔥 Ce qui me fait dire (cote pas forcément bonne)</h3><p class="small">Un signal fort pour ces joueurs. Si la cote est sous le minimum, c\'est ton choix.</p>'+sg.map(sigRow).join('');
    if(h.wm_read_at)vb+='<p class="small">Cotes Winamax lues à '+esc(h.wm_read_at)+'. ⭐ = Winamax paie plus que les autres sites. ⬆️ = rôle en hausse ce soir.'+(v.concat(lm,sg).some(function(p){return p.down})?' ⬇️ = en baisse ce soir, mais la cote dépasse son nouveau minimum.':'')+'</p>';
  }
  o+='<div class="card vcard"><h2>💰 Les values du soir</h2>'+vb+'<p class="vfoot">1 € par pari (2 € max si couverture point : buteur + point), jamais de combiné.</p></div>';
  var lb=liigaBlocks(d,h.liiga);if(lb)o+='<div class="card vcard"><h2>🇫🇮 💰 Values Liiga</h2>'+lb+'</div>';
  // Stars : une ligne repliée
  var st;
  if(h.values_status==='ok'){
    st=(h.values_stars||[]).filter(function(p){return !started(d,p.time)});
    var bad=st.filter(function(p){return !p.ok}),good=st.filter(function(p){return p.ok});
    if(st.length){
      var sum=good.length?'⭐ Stars : '+good.map(function(p){return esc(p.player.split(' ').slice(-1)[0])+' '+esc(p.wm)+' ✅'}).join(', '):
        '⭐ Stars : cotes trop basses ce soir ('+bad.slice(0,2).map(function(p){return esc(p.player.split(' ').slice(-1)[0])+' '+esc(p.wm)+' au lieu de '+esc(p.min)+' mini'}).join(', ')+(bad.length>2?'…':'')+')';
      o+='<details class="stars"><summary>'+sum+'</summary><div class="in">'+st.map(function(p){return '<p>'+esc(p.player)+' : Winamax <b>'+esc(p.wm)+'</b>, il faut '+esc(p.min)+' '+(p.ok?'✅':'❌')+' <span class="small">('+esc(p.time)+')</span></p>'}).join('')+'<p class="small">Sur les stars, Winamax se trompe rarement.</p></div></details>';
    }
  } else {
    st=(h.values_stars||[]).filter(function(p){return !started(d,p.time)});
    if(st.length)o+='<details class="stars"><summary>⭐ Stars : tu joues à '+st.slice(0,2).map(function(p){return esc(p.player.split(' ').slice(-1)[0])+' '+esc(p.min)}).join(', ')+(st.length>2?'…':'')+' ou plus</summary><div class="in">'+st.map(function(p){return '<p>'+esc(p.player)+' ('+esc(p.time)+') : tu joues à <b>'+esc(p.min)+'</b> ou plus</p>'}).join('')+'<p class="small">Winamax les paie d\'habitude moins. C\'est rarement bon.</p></div></details>';
  }
  var pts=h.point.filter(function(p){var t=p.time;if(!t){var g=(h.a_jouer.concat(h.surveiller)).filter(function(q){return q.player===p.player})[0];t=g&&g.time}return !started(d,t)});
  pts=pts.filter(playable);
  if(pts.length)o+=card('✅ Au moins 1 point',pts.map(function(p){return '<div class="rrow"><div><b>'+esc(p.player)+'</b>'+(p.game?'<div class="meta">'+esc(p.game)+' · '+esc(p.time)+'</div>':'')+(p.wm?'<div class="wm">Winamax <b>'+esc(p.wm)+'</b> ✅</div>':'')+'</div><div class="rodd">1,53<small>ou plus</small></div></div>'}).join('')+'<p class="small">Passe environ 7 fois sur 10.</p>');
  var f=d.foot;
  if(f&&f.available&&f.picks.length)o+=card('⚽ Foot (pas prouvé rentable)',f.picks.map(function(p){return '<div class="rrow"><div><b>'+esc(p.player)+'</b>'+(p.star?' <span class="tag no">star</span>':'')+'<div class="meta">'+esc(p.match)+' · '+esc(p.day)+'</div></div><div class="rodd">'+esc(p.play)+'<small>ou plus</small></div></div>'}).join(''));
  o+='<p class="small center">Détails dans les autres onglets.<br>Rien n\'est garanti. Besoin d\'aide ? Joueurs Info Service : <a href="tel:0974751313">09 74 75 13 13</a></p>';
  return o;
}
function buteurs(h){
  var o=card('🏒 Buteurs à jouer (1 € chacun)',(h.a_jouer.length?h.a_jouer.map(function(p){return pickHtml(p)}).join(''):'<p>Aucun joueur assez sûr ce soir.</p>')+(h.notes||[]).map(function(l){return '<p class="warn">'+md(l)+'</p>'}).join(''));
  if(h.surveiller.length)o+=card('👀 À surveiller (moins sûrs)',h.surveiller.map(function(p){return pickHtml(p,'watch')}).join(''));
  if(h.liiga){var L=h.liiga;var li='';
    if(L.a_jouer.length)li+=L.a_jouer.map(function(p){return pickHtml(p)}).join('');else if(L.note)li+='<p>'+esc(L.note)+'</p>';
    L.games.forEach(function(g){li+='<h3>'+esc(g.game)+'</h3><ul>'+g.top.map(function(t){return '<li>• '+esc(t.player)+' ('+esc(t.team)+') : '+esc(t.chance)+', tu joues à '+esc(t.min)+' ou plus'+(t.fair?' <span class="fair">(cote juste '+esc(t.fair)+')</span>':'')+'</li>'}).join('')+'</ul>'});
    li=liigaBlocks(null,L)+li;
    o+=card('🇫🇮 Liiga',li);
  } else if(typeof h.liiga_status==='string'&&h.liiga_status){o+=card('🇫🇮 Liiga','<p>'+esc(h.liiga_status.charAt(0).toUpperCase()+h.liiga_status.slice(1))+' aujourd\'hui.</p>')}
  return o;
}
function defs(h){
  var o=h.bestD.length?card('🛡️ Meilleur défenseur de chaque match',h.bestD.map(function(p){return pickHtml(p,'d')}).join('')+'<p class="small">Le meilleur défenseur marque environ 1 soir sur 5. 1 € maximum.</p>'):card('🛡️ Défenseurs','<p>Rien ce soir.</p>');
  if(h.liiga)h.liiga.games.forEach(function(g){if(g.bestD)o+=card('🇫🇮 '+esc(g.game),'<p>🛡️ '+esc(g.bestD.player)+' : '+esc(g.bestD.chance)+', tu joues à '+esc(g.bestD.min)+' ou plus'+(g.bestD.fair?' <span class="fair">(cote juste '+esc(g.bestD.fair)+')</span>':'')+'</p>')});
  return o;
}
function points(h){
  var o=h.point.length?card('✅ Au moins 1 point','<ul>'+h.point.map(function(p){return '<li>• <b>'+esc(p.player)+'</b> : '+esc(p.form)+wmPts(p)+'</li>'}).join('')+'</ul><p>Ce pari passe environ 7 fois sur 10.</p><p>👉 À 1,53 ou plus, c\'est intéressant. Entre 1,39 et 1,52, c\'est juste correct. En dessous de 1,39, tu ne joues pas.</p>'):card('✅ Au moins 1 point','<p>Rien ce soir.</p>');
  if(h.liiga&&h.liiga.point.length)o+=card('🇫🇮 Liiga : au moins 1 point','<ul>'+h.liiga.point.map(function(p){return '<li>• <b>'+esc(p.player)+'</b> : '+esc(p.form)+'. À '+esc(p.min)+' ou plus, tu joues.</li>'}).join('')+'</ul>');
  return o;
}
function matchs(h){
  var d=DATA;
  var o=card('🕗 Matchs (heure de Paris)',(h.intro||[]).map(function(l){return '<p>'+md(l)+'</p>'}).join('')+'<ul>'+(h.games||[]).map(function(g){return '<li><b>'+esc(g.time)+'</b> : '+esc(g.game)+'</li>'}).join('')+'</ul>');
  if(h.shots){var sh=h.shots.filter(function(g){return !started(d,g.time)});
    o+=card('🎯 Qui a le plus tiré au dernier match',(sh.length?sh.map(function(g){return '<h3>'+esc(g.game)+' · '+esc(g.time)+'</h3>'+g.teams.map(function(t){return '<p><b>'+esc(t.team)+'</b> <span class="small">('+esc(t.date)+', '+where(t)+')</span><br>'+t.top.map(function(p){return esc(p.player)+(p.d?' (D)':'')+' : '+p.sog}).join(' · ')+'</p>'}).join('')}).join(''):'<p>Tous les matchs de ce soir ont commencé.</p>')+'<p class="small">Tirs cadrés. Info seulement, Winamax ne propose pas de paris sur les tirs.</p>')}
  if(h.totals.length)o+=card('📈 Match à buts','<ul>'+h.totals.map(function(t,i){return '<li>'+(i+1)+'. '+(t.open?'🔥 ':'')+'<b>'+esc(t.game)+'</b> ('+esc(t.time)+') : environ '+esc(t.book)+' buts attendus (ligne '+esc(t.line)+'). Notre modèle : '+esc(t.model)+'.</li>'}).join('')+'</ul><p class="small">Chiffres des cotes publiques américaines, pas Winamax.</p>');
  return o;
}

function where(x){return (x.home?'contre ':'à ')+esc(x.opp)}
function wl(x){return '<span class="'+(x.win?'okc':'noc')+'">'+(x.win?'gagné':'perdu')+' '+esc(x.score)+'</span>'}
function startedT(d,x){return started(d,x.time)}
function otList(d,list,kind,liiga){
  var later=list.filter(function(x){return !(x.k===4)}),soon=list.filter(function(x){return x.k===4});
  var now=liiga?later:later.filter(function(x){return !startedT(d,x)}),gone=liiga?[]:later.filter(function(x){return startedT(d,x)});
  var o='';
  if(!now.length)o+='<p><b>Aucune équipe ce soir.</b></p>';
  now.forEach(function(x){
    o+='<div class="rrow"><div><b>'+esc(x.team)+'</b> '+where(x)+'<div class="meta">'+esc(x.day)+' · '+esc(x.time)+'</div>';
    if(kind==='nul'){o+='<div class="small">Nul le '+esc(x.nul.date)+' '+where(x.nul)+' ('+(x.nul.kind==='SO'?'tirs au but':'prolongation')+', '+wl(x.nul)+')</div>'+
      '<div class="small">Puis : '+x.between.map(function(b){return (b.win?'✅':'❌')+' '+esc(b.score)}).join(' · ')+'</div>'}
    else o+='<div class="small">Dernier match le '+esc(x.so.date)+' '+where(x.so)+' : '+wl(x.so)+' aux tirs au but</div>';
    if(x.bestD)o+='<div class="bd">🛡️ Meilleur défenseur buteur : <b>'+esc(x.bestD.player)+'</b> '+esc(x.bestD.chance)+', tu joues à <b>'+esc(x.bestD.min)+'</b> ou plus'+(x.bestD.fair?' <span class="fair">(cote juste '+esc(x.bestD.fair)+')</span>':'')+(x.bestD.wm?'<br>Winamax : <b>'+esc(x.bestD.wm)+'</b> '+badge(x.bestD.wm_ok):'')+'</div>';
    o+='</div><div class="rodd info">'+(kind==='nul'?'5e':'TAB')+'<small>match</small></div></div>';
  });
  if(gone.length)o+='<p class="small">Déjà commencé : '+gone.map(function(x){return esc(x.team)}).join(', ')+'.</p>';
  if(kind==='nul'&&soon.length)o+='<p class="small">4e match ce soir (le prochain sera le 5e) : '+soon.map(function(x){return esc(x.team)}).join(', ')+'.</p>';
  return o;
}
function otTab(d,kind){
  var h=d.hockey,key=kind==='nul'?'after_nul':'after_so',o='';
  var intro=kind==='nul'?'<p>Équipe qui a fait un nul (égalité après 60 min), puis a joué 4 matchs. Ce soir, c\'est son 5e match.</p>':'<p>Équipe dont le dernier match s\'est fini aux tirs au but.</p>';
  o+=card(kind==='nul'?'🔁 NHL : 5e match après un nul':'🎯 NHL : juste après des tirs au but',intro+(h[key]?otList(d,h[key],kind):'<p>'+esc(h.nhl_error||'NHL : pas de données.')+'</p>'));
  var L=h.liiga_ot;var li;
  if(!L)li='<p>Liiga : pas de données.</p>';
  else if(!L.day)li='<p>Liiga : pas de match prévu.</p>';
  else li=(L.today?'':'<p class="small">Pas de match ce soir. Prochains matchs le '+esc(L.day)+'.</p>')+otList(d,L[key],kind,true).replace('Aucune équipe ce soir.',L.today?'Aucune équipe ce soir.':'Aucune équipe.');
  o+=card('🇫🇮 Liiga',li);
  o+=card('📊 Est-ce que ça marche ?','<p>'+esc(kind==='nul'?h.hist_nul:h.hist_so)+'</p>');
  return o;
}
function infos(h){
  var o='<p class="small">Touche un titre pour l\'ouvrir.</p>';
  (h.info||[]).filter(function(s){return !isBilan(s)}).forEach(function(s){
    o+='<details><summary>'+md(s.title)+'</summary><div class="in">'+s.lines.map(function(l){return '<p>'+md(l)+'</p>'}).join('')+'</div></details>';
  });
  return o+'<p class="small">Modèle : '+esc(h.model)+'</p>';
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
function imagHtml(m){
  if(!m||!m.scenarios)return card('🌙 Monde imaginaire','<p>Pas encore de données.</p>');
  function st(lbl,x,cls){return '<div class="'+(cls||'')+'"><small>'+lbl+'</small><b>'+esc(x.pct)+'</b><small>'+x.oui+' sur '+x.total+'</small></div>'}
  function lieu(h,opp){return (h?'🏠 à domicile contre ':'✈️ à l\'extérieur à ')+esc(opp)}
  var o=card('🌙 Monde imaginaire','<p>Ici, on suit tes idées. On regarde si elles se répètent, match après match.</p><p class="small">Ce n\'est pas un conseil de pari. On compte, c\'est tout. Mis à jour le '+esc(m.updated)+'.</p>');
  m.scenarios.forEach(function(sc){
    var a=sc.after,b=sc.base,f=sc.focus;
    var x='<p><b>L\'idée :</b> '+esc(sc.rule)+'</p><p>'+esc(sc.origin)+'</p>';
    x+='<h3>📊 Depuis le début de la saison (Liiga)</h3><p class="small">Le match suivant, un défenseur de l\'équipe marque :</p>';
    x+='<div class="istat">'+st('Après TAB',a.tous)+st('Après TAB, 🏠',a.dom)+st('Après TAB, ✈️',a.ext)+'</div>';
    x+='<div class="istat">'+st('Tous les matchs',b.tous,'base')+st('Tous, 🏠',b.dom,'base')+st('Tous, ✈️',b.ext,'base')+'</div>';
    x+='<p class="small">👉 Exemple : sur un match normal, un défenseur de l\'équipe marque '+esc(b.tous.pct)+' du temps. Après des TAB, c\'est '+esc(a.tous.pct)+'. Attention : seulement '+a.tous.total+' cas, c\'est encore peu.</p>';
    if(sc.candidates&&sc.candidates.length)x+='<h3>👀 Prochaines équipes à suivre</h3><p class="small">Leur dernier match s\'est fini aux TAB.</p>'+sc.candidates.map(function(c){return '<div class="icase"><b>'+esc(c.team)+'</b> · '+esc(c.day)+' à '+esc(c.time)+'<br>'+lieu(c.home,c.opp)+'<div class="small">TAB : '+esc(c.tab)+', '+esc(c.tab_day)+'</div></div>'}).join('');
    o+='<div class="card imag"><h2>🌙 '+esc(sc.title)+'</h2>'+x+'</div>';
    if(sc.nhl){var n=sc.nhl,z='<p class="small">Le match suivant, un défenseur de l\'équipe marque. '+esc(n.note)+'</p>';
      function cl(v){return '<td>'+esc(v.pct)+'<br><small>'+v.oui+'/'+v.total+'</small></td>'}
      z+='<table class="it"><tr><th></th><th>Tous</th><th>🏠</th><th>✈️</th></tr>'+n.table.map(function(r){return '<tr><td>'+esc(r.label)+'</td>'+cl(r.tous)+cl(r.dom)+cl(r.ext)+'</tr>'}).join('')+'</table>';
      z+='<p>'+esc(n.test)+'</p><p><b>👉 '+esc(n.verdict)+'</b></p>';
      z+='<details><summary>Saison par saison</summary><div class="in"><table class="it"><tr><th>Saison</th><th>Après TAB</th><th>Tous les matchs</th></tr>'+n.seasons.map(function(r){return '<tr><td>'+esc(r.season)+'</td>'+cl(r.after.tous)+cl(r.base.tous)+'</tr>'}).join('')+'</table></div></details>';
      o+='<div class="card imag"><h2>🏒 '+esc(n.title)+'</h2>'+z+'</div>';
      if(n.edm)o+=card('🛢️ '+esc(n.edm.team)+' après des TAB','<p class="small">'+esc(n.edm.note)+'</p>'+n.edm.cases.map(function(c){return '<div class="icase">'+(c.ok?'✅':'❌')+' '+esc(c.day)+', '+lieu(c.home,c.opp)+' · '+esc(c.score)+'<div class="small">'+(c.ok?'Défenseur buteur : '+esc(c.ds.join(', ')):'Pas de défenseur buteur')+' · TAB avant : '+esc(c.tab)+'</div></div>'}).join(''));}
    if(f){var y='';
      if(f.next)y+='<p>Prochain match : <b>'+esc(f.next.day)+' à '+esc(f.next.time)+'</b>, '+lieu(f.next.home,f.next.opp)+'.</p>';
      if(f.note)y+='<p class="small">'+esc(f.note)+'</p>';
      if(f.defenders&&f.defenders.length)y+='<table class="it"><tr><th>Défenseur</th><th>MJ</th><th>Buts</th><th>Passes</th><th>Tirs</th><th>Temps</th></tr>'+f.defenders.map(function(d){return '<tr><td>'+esc(d.player)+'</td><td>'+d.gp+'</td><td>'+d.g+'</td><td>'+d.a+'</td><td>'+d.tirs+'</td><td>'+esc(d.toi)+'</td></tr>'}).join('')+'</table><p class="small">Saison Liiga. Tirs = toutes les tentatives. Temps = temps de jeu moyen par match.</p>';
      o+=card('🛡️ Les défenseurs de '+esc(f.team),y);}
    if(sc.cases&&sc.cases.length)o+='<details><summary>📋 Tous les cas après TAB ('+sc.cases.length+')</summary><div class="in">'+sc.cases.map(function(c){return '<div class="icase">'+(c.ok?'✅':'❌')+' <b>'+esc(c.team)+'</b> · '+esc(c.day)+', '+lieu(c.home,c.opp)+'<div class="small">'+(c.ok?'Défenseur buteur : '+esc(c.ds.join(', ')):'Pas de défenseur buteur')+' · TAB avant : '+esc(c.tab)+'</div></div>'}).join('')+'</div></details>';
  });
  (m.signal_log||[]).forEach(function(l){
    o+=card('📝 '+esc(l.title)+' · '+esc(l.date),l.teams.map(function(t){return '<div class="icase">'+(t.ds.length?'✅':'❌')+' <b>'+esc(t.team)+'</b> : '+(t.ds.length?esc(t.ds.join(', ')):'aucun défenseur buteur')+'</div>'}).join('')+'<p><b>'+esc(l.result)+'</b></p>'+(l.note?'<p class="small">'+esc(l.note)+'</p>':''));
  });
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
window.Buteurs={resume:resume,buteurs:buteurs,defs:defs,points:points,matchs:matchs,infos:infos,bilan:bilanHtml,foot:footHtml,calc:calc,otTab:otTab,imag:imagHtml,setData:function(d){DATA=d}};
if(typeof document==='undefined')return;
document.querySelectorAll('nav button').forEach(function(b){b.addEventListener('click',function(){
  document.querySelectorAll('nav button').forEach(function(x){x.classList.toggle('on',x===b)});
  document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('on',t.id===b.dataset.tab)});b.scrollIntoView({inline:'center',block:'nearest'});var hh=document.querySelector('header').offsetHeight;if(window.scrollY>hh)window.scrollTo(0,hh);})});
['cP','cO'].forEach(function(id){document.getElementById(id).addEventListener('input',calc)});
fetch('data.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
  document.getElementById('stamp').textContent='Analyse du '+d.date_fr+' · mise à jour '+d.generated;
  DATA=d;var h=d.hockey;
  document.getElementById('resume').innerHTML=resume(d);
  document.getElementById('buteurs').innerHTML=buteurs(h);
  document.getElementById('defs').innerHTML=defs(h);
  document.getElementById('points').innerHTML=points(h);
  document.getElementById('matchs').innerHTML=matchs(h);
  document.getElementById('infos').innerHTML=infos(h);
  document.getElementById('foot').innerHTML=footHtml(d.foot);
  document.getElementById('bilan').innerHTML=bilanHtml(h);
  document.getElementById('nul5').innerHTML=otTab(d,'nul');
  document.getElementById('tab').innerHTML=otTab(d,'so');
}).catch(function(){document.getElementById('stamp').textContent='Impossible de charger l\'analyse. Vérifie ta connexion.'});
fetch('imaginaire.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(m){document.getElementById('imag').innerHTML=imagHtml(m)}).catch(function(){document.getElementById('imag').innerHTML=card('🌙 Monde imaginaire','<p>Impossible de charger. Vérifie ta connexion.</p>')});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){});
})();
