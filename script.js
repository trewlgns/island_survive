// ══════════════════════════════════════════════════════════════
//  무인도 생존기  script.js
// ══════════════════════════════════════════════════════════════

// ─── 난이도 ──────────────────────────────────────────────────
const DCFG = {
  easy:  {label:'🌴 쉬움',   foodDrain:8,  waterDrain:12, moveCost:0, moveTime:0},
  normal:{label:'⚠️ 보통',  foodDrain:12, waterDrain:18, moveCost:4, moveTime:4},
  hard:  {label:'💀 어려움', foodDrain:16, waterDrain:24, moveCost:6, moveTime:6},
};

// ─── 시간 시스템 (48칸 = 30분 단위) ─────────────────────────
const MAX_TIME = 48; // 하루 48칸
// 칸 → 시각 문자열
function slotToTime(s){ const h=Math.floor(s/2),m=s%2===0?'00':'30'; return `${String(h).padStart(2,'0')}:${m}`; }
// 시각대 정보
function getPhase(s){
  if(s<12) return {label:'🌅 아침',  cls:'t-morning',color:'#e3b341', night:false};
  if(s<24) return {label:'☀️ 오후',  cls:'t-noon',   color:'#f0a050', night:false};
  if(s<36) return {label:'🌆 저녁',  cls:'t-evening',color:'#bc8cff', night:false};
  return          {label:'🌙 심야',  cls:'t-night',  color:'#58a6ff', night:true};
}

// ─── 장소 ────────────────────────────────────────────────────
const LOCS = {
  beach:  {icon:'🏖', name:'해변',       desc:'모래사장. 조개·유목 수거, SOS 신호 가능.'},
  forest: {icon:'🌲', name:'숲',         desc:'울창한 나무. 식재료·약초·목재 채취 가능.'},
  river:  {icon:'🏞', name:'강',         desc:'맑은 계곡물. 음용수와 물고기를 얻을 수 있다.'},
  cave:   {icon:'🪨', name:'동굴',       desc:'서늘한 동굴. 휴식하거나 돌을 캘 수 있다.'},
  raft:   {icon:'🛶', name:'뗏목 작업장',desc:'뗏목을 만들거나 구조 신호를 보낼 수 있다.'},
  shelter:{icon:'🏕', name:'은신처',     desc:'직접 지은 보금자리. 안전하게 쉬고 밤을 보낼 수 있다.'},
};

// ─── 식재료 정의 ─────────────────────────────────────────────
// rawFood: 인벤에 보관되는 날것 식재료
const RAW_FOODS = {
  berry:   {icon:'🫐', name:'베리',     rawFood:8,   sickChance:0.05},
  mushroom:{icon:'🍄', name:'버섯',     rawFood:12,  sickChance:0.15}, // 독버섯 위험
  shellfish:{icon:'🦪',name:'조개',     rawFood:10,  sickChance:0.08},
  fish:    {icon:'🐟', name:'생선',     rawFood:20,  sickChance:0.12},
  crab:    {icon:'🦀', name:'게',       rawFood:18,  sickChance:0.06},
  coconut: {icon:'🥥', name:'코코넛',   rawFood:15,  sickChance:0.02, water:10},
  egg:     {icon:'🥚', name:'알',       rawFood:14,  sickChance:0.08},
};

// ─── 행동 목록 ───────────────────────────────────────────────
// time: 소요 시간칸(30분 단위)
const ACTS = {
  beach:[
    {id:'shellfish', name:'조개 채집',   icon:'🦪', en:4,  time:2, gives:{shellfish:2},   txt:'조개를 주웠다.'},
    {id:'stick',     name:'유목 수거',   icon:'🪵', en:4,  time:2, gives:{wood:2},         txt:'해변에 밀려온 나무를 주웠다.'},
    {id:'sos',       name:'모래 SOS',    icon:'🆘', en:6,  time:4, gives:{rescue:3},        txt:'모래 위에 SOS를 크게 새겼다.'},
    {id:'log',       name:'통나무 수거', icon:'🌳', en:10, time:6, gives:{wood:5},          txt:'큰 통나무를 모았다.'},
    {id:'crabcatch', name:'게 잡기',     icon:'🦀', en:6,  time:4, gives:{crab:1},          txt:'갯바위에서 게를 잡았다.'},
  ],
  forest:[
    {id:'berry',  name:'열매 따기',   icon:'🫐', en:6,  time:2, gives:{berry:3},       txt:'숲에서 열매를 땄다.'},
    {id:'mush',   name:'버섯 채집',   icon:'🍄', en:6,  time:2, gives:{mushroom:2},    txt:'버섯을 채집했다. 독버섯이 섞였을 수도 있다.'},
    {id:'herb',   name:'약초 채집',   icon:'🌿', en:6,  time:2, gives:{herb:2},        txt:'약초를 모았다.'},
    {id:'chop',   name:'나무 베기',   icon:'🪓', en:14, time:6, gives:{wood:6}, req:{axe:1}, txt:'도끼로 나무를 베었다.'},
    {id:'gather', name:'가지 모으기', icon:'🪵', en:8,  time:4, gives:{wood:3},        txt:'마른 나뭇가지를 모았다.'},
    {id:'birdegg',name:'새알 채집',   icon:'🥚', en:8,  time:4, gives:{egg:2},         txt:'나무 위 둥지에서 알을 발견했다.'},
  ],
  river:[
    {id:'drink',  name:'물 마시기',   icon:'💧', en:2,  time:2, gives:{water:35},       txt:'차가운 물을 실컷 마셨다!'},
    {id:'fish',   name:'낚시',        icon:'🎣', en:10, time:6, gives:{fish:2},  req:{rod:1}, txt:'물고기를 낚았다!'},
    {id:'hfish',  name:'맨손 낚시',   icon:'🐟', en:14, time:8, gives:{fish:1},          txt:'맨손으로 작은 물고기를 잡았다.'},
    {id:'fillw',  name:'물통 채우기', icon:'🫙', en:2,  time:2, gives:{stored_water:3},req:{bottle:1}, txt:'물통에 깨끗한 물을 담았다.'},
  ],
  cave:[
    {id:'rest',  name:'휴식',   icon:'😴', en:0,  time:4,  gives:{energy:30,hp:6},  txt:'잠시 쉬었다. 회복된다.'},
    {id:'sleep', name:'수면',   icon:'🌙', en:0,  time:12, gives:{energy:70,hp:18}, nightOnly:true, txt:'충분히 잠들었다. 활력이 돌아왔다.'},
    {id:'stone', name:'돌 캐기',icon:'🪨', en:10, time:4,  gives:{stone:3},          txt:'동굴 벽에서 돌 3개를 캤다.'},
    {id:'med',   name:'명상',   icon:'🧘', en:4,  time:4,  gives:{hp:10},            txt:'마음을 가다듬으니 몸이 회복된다.'},
  ],
  raft:[
    {id:'build', name:'뗏목 조립',  icon:'🛶', en:14, time:8, gives:{rescue:8},  req:{wood:5},   con:{wood:5},  txt:'나무를 엮어 뗏목을 조립했다!'},
    {id:'fire',  name:'봉화 신호',  icon:'🔥', en:10, time:6, gives:{rescue:5},  req:{wood:3},   con:{wood:3},  txt:'봉화를 피워 구조 신호를 보냈다!'},
    {id:'mir',   name:'거울 신호',  icon:'🪞', en:6,  time:4, gives:{rescue:10}, req:{mirror:1},                txt:'거울로 배를 향해 신호를 보냈다!'},
    {id:'flag',  name:'깃발 달기',  icon:'🚩', en:6,  time:4, gives:{rescue:4},  req:{cloth:2},  con:{cloth:2}, txt:'깃발을 만들어 높이 달았다.'},
  ],
  shelter:[
    {id:'srest',    name:'휴식',        icon:'😴', en:0,  time:4,  gives:{energy:38,hp:8},  txt:'은신처에서 편안히 쉬었다.'},
    {id:'ssleep',   name:'수면',        icon:'🌙', en:0,  time:12, gives:{energy:85,hp:22}, nightOnly:true, txt:'은신처에서 깊이 잠들었다.'},
    {id:'upgrade',  name:'은신처 강화', icon:'🔧', en:10, time:6,  gives:{shelterLv:1}, req:{wood:3,stone:2}, con:{wood:3,stone:2}, maxLv:3, txt:'은신처를 더 튼튼하게 보강했다.'},
    {id:'campfire', name:'모닥불 피우기',icon:'🔥',en:6,  time:4,  gives:{campfire:1}, req:{wood:2}, con:{wood:2}, maxCampfire:1, txt:'모닥불을 피웠다.'},
  ],
};

// ─── 제작 ────────────────────────────────────────────────────
const CRAFTS = [
  {icon:'🪓',name:'돌도끼',     desc:'나무 베기',      req:{wood:3,stone:2}, res:{axe:1}},
  {icon:'🎣',name:'낚싯대',     desc:'낚시 가능',      req:{wood:2,herb:1},  res:{rod:1}},
  {icon:'🫙',name:'대나무통',   desc:'물 보관',        req:{wood:3},         res:{bottle:1}},
  {icon:'🩹',name:'붕대',       desc:'HP +25',         req:{herb:3},         res:{bandage:2}},
  {icon:'🧵',name:'천 조각',    desc:'깃발 재료',      req:{herb:4},         res:{cloth:2}},
  {icon:'🪞',name:'반짝 거울',  desc:'거울 신호',      req:{stone:4},        res:{mirror:1}},
  {icon:'🏕',name:'기본 은신처',desc:'밤 안전 확보',   req:{wood:8,stone:3}, res:{shelter:1}, oneTime:true},
  {icon:'🪵',name:'울타리',     desc:'야생동물 방어↑', req:{wood:6},         res:{fence:1},   oneTime:true},
];

// ─── 요리 레시피 ─────────────────────────────────────────────
// difficulty: 1~3 (미니게임 난이도)
// food: 섭취 시 포만감, hp: 체력 회복
const RECIPES = [
  {id:'grilled_fish',   icon:'🍗', name:'구운 생선',     req:{fish:1,    wood:1},           food:40, hp:5,  time:6,  diff:1, txt:'노릇노릇 구운 생선. 든든하다!'},
  {id:'fish_stew',      icon:'🍲', name:'생선 스튜',      req:{fish:2,    mushroom:1,herb:1}, food:60, hp:15, time:10, diff:2, txt:'깊은 맛의 스튜. 체력이 크게 회복된다!'},
  {id:'berry_jam',      icon:'🫐', name:'열매 잼',        req:{berry:4},                     food:25, hp:0,  time:4,  diff:1, txt:'달콤한 열매를 졸였다.'},
  {id:'crab_roast',     icon:'🦀', name:'구운 게',        req:{crab:1,    wood:1},           food:35, hp:8,  time:6,  diff:2, txt:'맛있는 구운 게.'},
  {id:'egg_boil',       icon:'🥚', name:'삶은 알',        req:{egg:1,     stored_water:1},   food:22, hp:6,  time:4,  diff:1, txt:'단백질이 풍부한 삶은 알.'},
  {id:'coco_soup',      icon:'🥥', name:'코코넛 스프',    req:{coconut:1, fish:1},           food:38, hp:10, time:6,  diff:2, txt:'달콤하고 고소한 코코넛 스프.'},
  {id:'herb_tea',       icon:'🍵', name:'약초차',         req:{herb:2,    stored_water:1},   food:5,  hp:20, time:4,  diff:1, txt:'쓴 약초차. 상처가 빠르게 낫는다.'},
  {id:'shellfish_soup', icon:'🦪', name:'조개국',         req:{shellfish:2,stored_water:1},  food:30, hp:5,  time:6,  diff:2, txt:'시원한 조개국.'},
  {id:'survival_stew',  icon:'🍛', name:'생존 스튜',      req:{fish:1,    crab:1,mushroom:1,berry:1}, food:80, hp:25, time:14, diff:3, txt:'온갖 재료를 넣은 풍성한 스튜. 최고의 식사!'},
];

// ─── 아이템 (인벤 표시용) ─────────────────────────────────────
const ITEMS = {
  wood:{icon:'🪵',name:'나무'},     stone:{icon:'🪨',name:'돌'},      herb:{icon:'🌿',name:'약초'},
  bandage:{icon:'🩹',name:'붕대'},  axe:{icon:'🪓',name:'도끼'},      rod:{icon:'🎣',name:'낚싯대'},
  bottle:{icon:'🫙',name:'물통'},   cloth:{icon:'🧵',name:'천'},      mirror:{icon:'🪞',name:'거울'},
  stored_water:{icon:'💦',name:'물'},
  // 식재료
  berry:{icon:'🫐',name:'베리'},    mushroom:{icon:'🍄',name:'버섯'},  shellfish:{icon:'🦪',name:'조개'},
  fish:{icon:'🐟',name:'생선'},     crab:{icon:'🦀',name:'게'},       coconut:{icon:'🥥',name:'코코넛'},
  egg:{icon:'🥚',name:'알'},
};

// ─── 이벤트 ──────────────────────────────────────────────────
const EVENTS = [
  {t:'bad', txt:'🌧 폭우가 내린다. 체력이 감소한다.',           e:{hp:-10}},
  {t:'good',txt:'🌈 맑고 화창한 날씨다. 기분이 좋아진다.',     e:{energy:12}},
  {t:'bad', txt:'🐍 독뱀에게 물렸다! 체력이 크게 감소한다.',  e:{hp:-22}},
  {t:'good',txt:'🌊 파도에 통조림 캔이 떠내려왔다!',            e:{food:30}},
  {t:'bad', txt:'😰 극심한 더위로 탈수 증세가 온다.',           e:{water:-18}},
  {t:'good',txt:'✈️ 비행기가 지나갔다. 손을 흔들었다!',         e:{rescue:6}},
  {t:'bad', txt:'🌡 밤새 열병으로 시달렸다.',                   e:{hp:-14,energy:-15}},
  {t:'good',txt:'🥥 코코넛이 떨어졌다.',                        e:{coconut_ev:1}},
  {t:'bad', txt:'🐦 새들이 비축해둔 열매를 먹어버렸다.',        e:{berry_ev:-2}},
  {t:'good',txt:'🌿 희귀한 약초를 발견했다.',                   e:{hp:15}},
];

// ─── 심야 야생동물 ───────────────────────────────────────────
const NIGHT_ATTACKS = [
  {txt:'🐗 멧돼지가 야영지를 습격했다!',       dmg:25, fenceBlock:true},
  {txt:'🐺 늑대 무리가 으르렁거리며 다가온다!',dmg:30, fenceBlock:true},
  {txt:'🐻 곰이 냄새를 맡고 접근했다!',        dmg:35, fenceBlock:false},
  {txt:'🦟 독벌레 떼가 덮쳤다!',               dmg:15, fenceBlock:false},
];

// ─── 전역 상태 ───────────────────────────────────────────────
let G={}, diff='easy', selDiff='easy', logEntries=[], dTimer=null;

// ─── 요리 미니게임 상태 ──────────────────────────────────────
let cookState=null; // {recipe, phase, score, markerPos, markerDir, zones, animId, resultShown}

// ══════════════════════════════════════════════════════════════
//  난이도 카드
// ══════════════════════════════════════════════════════════════
const DIFF_INFO = [
  {key:'easy',  ico:'🌴',nm:'쉬움',   desc:'자원 풍부\n이동 무료\n야생동물 적음'},
  {key:'normal',ico:'⚠️', nm:'보통',  desc:'균형잡힌 도전\n이동 시 소모\n야생동물 주의'},
  {key:'hard',  ico:'💀', nm:'어려움',desc:'생존 극한\n이동 비용↑\n야생동물 빈번'},
];
document.getElementById('diffCards').innerHTML = DIFF_INFO.map((d,i)=>`
  <div class="dcard${i===0?' sel':''}" data-d="${d.key}">
    <span class="di">${d.ico}</span><span class="dn">${d.nm}</span>
    <span class="dd">${d.desc.replace(/\n/g,'<br>')}</span>
  </div>`).join('');
document.getElementById('diffCards').addEventListener('click',e=>{
  const c=e.target.closest('.dcard'); if(!c)return;
  selDiff=c.dataset.d;
  document.querySelectorAll('.dcard').forEach(el=>el.classList.toggle('sel',el===c));
});

// ══════════════════════════════════════════════════════════════
//  게임 시작 / 재시작
// ══════════════════════════════════════════════════════════════
function startGame(){
  diff=selDiff;
  G={
    day:1, timeSlot:0,
    hp:100, food:0, water:70, energy:80, rescue:0, // food는 이제 포만감(직접 관리)
    satiety:70, // 포만감 (0~100)
    inv:{
      // 도구/재료
      wood:0,stone:0,herb:0,bandage:0,axe:0,rod:0,bottle:0,cloth:0,mirror:0,stored_water:0,
      // 식재료
      berry:0,mushroom:0,shellfish:0,fish:0,crab:0,coconut:0,egg:0,
    },
    loc:'beach', dead:false, won:false,
    shelter:false, shelterLv:0, fence:false, campfire:false,
    sick:false,    // 식중독 상태
  };
  logEntries=[];
  document.getElementById('startScreen').classList.remove('show');
  document.getElementById('mainGame').style.display='block';
  document.getElementById('diffBadge').textContent=DCFG[diff].label;
  renderAll();
  addLog('🏝 섬에 표류했다. 살아남아야 한다...','lg-evt');
  addLog('식재료를 모아 요리하면 훨씬 효율적으로 체력을 회복할 수 있다.','lg-info');
  addLog('구조 신호를 100%까지 채우면 탈출!','lg-info');
}
function showStartScreen(){
  document.getElementById('endScreen').classList.remove('show');
  document.getElementById('mainGame').style.display='none';
  document.getElementById('startScreen').classList.add('show');
}

// ══════════════════════════════════════════════════════════════
//  헬퍼
// ══════════════════════════════════════════════════════════════
function isNight(){ return getPhase(G.timeSlot).night; }
function timeCostMove(){ return DCFG[diff].moveTime; }
function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }

// ─── 토스트 알림 ─────────────────────────────────────────────
let toastTimer=null;
function showToast(msg, type='info'){
  const el=document.getElementById('toast');
  el.textContent=msg;
  el.className='toast show toast-'+type;
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{ el.classList.remove('show'); },3000);
}

// ══════════════════════════════════════════════════════════════
//  렌더 전체
// ══════════════════════════════════════════════════════════════
function renderAll(){
  if(cookState&&!cookState.resultShown) return; // 요리 중엔 다른 렌더 스킵
  const ph=getPhase(G.timeSlot);
  document.getElementById('topDay').textContent=G.day+'일차';
  document.getElementById('topTime').textContent=`${ph.label} ${slotToTime(G.timeSlot)}`;
  document.getElementById('topTime').style.color=ph.color;
  document.getElementById('rightDay').textContent=G.day+'일차';
  const rtEl=document.getElementById('rightTime');
  rtEl.textContent=ph.label; rtEl.className='time-b '+ph.cls;
  renderChar(); renderStats(); renderInv();
  renderLocTabs(); renderLocInfo(); renderActions(); renderCrafts(); renderCooking();
  renderRight(); renderLog();
}

// ─── 캐릭터 패널 ─────────────────────────────────────────────
function renderChar(){
  const hp=G.hp;
  let state,stTxt,stCls;
  if(hp>=75){state='healthy';stTxt='건강';stCls='st-healthy';}
  else if(hp>=50){state='okay';stTxt='양호';stCls='st-okay';}
  else if(hp>=25){state='tired';stTxt='쇠약';stCls='st-tired';}
  else{state='critical';stTxt='위험!';stCls='st-critical';}
  if(G.sick) stTxt='🤢 식중독'; // 식중독 오버라이드
  const cols={healthy:'#3fb950',okay:'#e3b341',tired:'#f0883e',critical:'#f85149'};
  const c=cols[state];
  const smiles={healthy:'M33,30 Q50,43 67,30',okay:'M33,32 L67,32',tired:'M33,36 Q50,28 67,36',critical:'M28,38 Q50,24 72,38'};
  const eyeSz=state==='critical'?2:3;
  const tired2=(state==='tired'||state==='critical');
  const eyeY=tired2?25:23;
  const eyesHtml=G.energy<20
    ?`<line x1="37" y1="${eyeY+1}" x2="45" y2="${eyeY+3}" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="55" y1="${eyeY+1}" x2="63" y2="${eyeY+3}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`
    :`<circle cx="41" cy="${eyeY}" r="${eyeSz}" fill="${c}"/><circle cx="59" cy="${eyeY}" r="${eyeSz}" fill="${c}"/>`;
  const sweat=G.energy<30?`<text x="66" y="18" font-size="11">💦</text>`:'';
  document.getElementById('charSvg').innerHTML=`<svg viewBox="0 0 100 128" width="96" height="116">
    <circle cx="50" cy="22" r="19" fill="${c}18" stroke="${c}" stroke-width="2"/>
    ${eyesHtml}${sweat}
    <path d="${smiles[state]}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="41" x2="50" y2="85" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="50" y1="56" x2="20" y2="72" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="56" x2="80" y2="72" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="85" x2="30" y2="118" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="50" y1="85" x2="70" y2="118" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`;
  const el=document.getElementById('charSt'); el.textContent=stTxt; el.className='char-st '+stCls;

  let eq='';
  if(G.inv.axe>0)    eq+=`<span class="eq">🪓</span>`;
  if(G.inv.rod>0)    eq+=`<span class="eq">🎣</span>`;
  if(G.inv.bottle>0) eq+=`<span class="eq">🫙</span>`;
  if(G.inv.mirror>0) eq+=`<span class="eq">🪞</span>`;
  if(!eq) eq=`<span style="font-size:11px;color:#8b949e">장비 없음</span>`;
  document.getElementById('equipped').innerHTML=eq;

  // 은신처 표시
  let shelterHtml='';
  if(G.shelter){
    const lvStars='★'.repeat(G.shelterLv)+'☆'.repeat(3-G.shelterLv);
    shelterHtml=`<div class="shelter-badge">🏕 은신처 ${lvStars}`;
    if(G.fence)    shelterHtml+=` <span class="fence-tag">🪵울타리</span>`;
    if(G.campfire) shelterHtml+=` <span class="fire-tag">🔥모닥불</span>`;
    shelterHtml+=`</div>`;
  }
  document.getElementById('charShelter').innerHTML=shelterHtml;

  // 아이템 사용 버튼
  const ca=document.getElementById('charActions'); ca.innerHTML='';
  if(G.inv.bandage>0&&!G.dead){
    const btn=document.createElement('button');
    btn.className='use-item-btn';
    btn.textContent=`🩹 붕대 사용 (🩹-1 / ❤️+25)`;
    btn.addEventListener('click',useBandage); ca.appendChild(btn);
  }
  // 날것 먹기 버튼들
  Object.entries(RAW_FOODS).forEach(([k,rf])=>{
    if((G.inv[k]||0)<=0) return;
    const btn=document.createElement('button');
    btn.className='use-item-btn raw-eat';
    const sickPct=Math.round(rf.sickChance*100);
    btn.innerHTML=`${rf.icon} 날것으로 먹기 <span class="raw-cost">${rf.icon}-1 🍖+${rf.rawFood}${rf.water?` 💧+${rf.water}`:''} <span class="sick-warn">식중독${sickPct}%</span></span>`;
    btn.addEventListener('click',()=>eatRaw(k,rf));
    ca.appendChild(btn);
  });
}

function useBandage(){
  if(G.inv.bandage<=0||G.dead||G.timeSlot>=MAX_TIME)return;
  G.inv.bandage--; G.hp=clamp(G.hp+25,0,100);
  advanceTime(2);
  addLog('🩹 붕대를 사용했다. 체력 +25','lg-good');
  checkAndNextDay();
}

function eatRaw(key, rf){
  if((G.inv[key]||0)<=0||G.dead||G.timeSlot>=MAX_TIME)return;
  G.inv[key]--;
  G.satiety=clamp(G.satiety+rf.rawFood,0,100);
  if(rf.water) G.water=clamp(G.water+(rf.water||0),0,100);
  advanceTime(1);
  addLog(`${rf.icon} ${rf.name}을(를) 날것으로 먹었다. 🍖+${rf.rawFood}`,'lg-info');
  // 식중독 판정
  if(Math.random()<rf.sickChance){
    G.sick=true;
    G.hp=clamp(G.hp-18,0,100);
    addLog('🤢 식중독에 걸렸다! 체력 -18','lg-bad');
    showToast('🤢 식중독! 체력 -18', 'bad');
  }
  checkAndNextDay();
}

// ─── 스탯 바 ─────────────────────────────────────────────────
function renderStats(){
  const stats=[
    {lb:'❤️ 체력',  v:G.hp,      style:'background:#3fb950'},
    {lb:'🍖 포만감',v:G.satiety, style:'background:#e3b341'},
    {lb:'💧 수분',  v:G.water,   style:'background:#58a6ff'},
    {lb:'⚡ 에너지',v:G.energy,  style:'background:#bc8cff'},
  ];
  const sickRow=G.sick?`<div class="sick-row">🤢 식중독 (다음 날 자동 회복)</div>`:'';
  document.getElementById('statsArea').innerHTML=sickRow+stats.map(s=>{
    const v=clamp(Math.round(s.v),0,100);
    return `<div class="stat${v<=25?' low':''}">
      <div class="stat-row"><span class="sl">${s.lb}</span><span class="sv">${v}</span></div>
      <div class="bar-bg"><div class="bar-fill" style="width:${v}%;${s.style}"></div></div>
    </div>`;
  }).join('');
}

// ─── 인벤토리 ────────────────────────────────────────────────
function renderInv(){
  document.getElementById('invGrid').innerHTML=Object.entries(ITEMS).map(([k,it])=>{
    const n=G.inv[k]||0;
    const isFood=k in RAW_FOODS;
    return `<div class="inv-slot${n>0?' filled':''}${isFood?' food-slot':''}">
      <span class="si">${it.icon}</span><span class="sc">${n}</span><span class="sn">${it.name}</span>
    </div>`;
  }).join('');
}

// ─── 위치 탭 ─────────────────────────────────────────────────
function renderLocTabs(){
  const cfg=DCFG[diff];
  const ct=document.getElementById('locTabs'); ct.innerHTML='';
  Object.entries(LOCS).forEach(([k,l])=>{
    if(k==='shelter'&&!G.shelter) return;
    const isCur=k===G.loc;
    const mt=timeCostMove();
    const canMove=isCur||mt===0||(G.timeSlot+mt<=MAX_TIME&&G.energy>=cfg.moveCost);
    const btn=document.createElement('button');
    btn.className='tab'+(isCur?' cur':'');
    btn.disabled=!canMove&&!isCur;
    let costHtml='';
    if(isCur) costHtml=`<span class="tcur">현재</span>`;
    else if(mt>0) costHtml=`<span class="tc">⚡${cfg.moveCost} ⏱${mt*30}분</span>`;
    btn.innerHTML=`<span class="ti">${l.icon}</span><span class="tn">${l.name}</span>${costHtml}`;
    btn.addEventListener('click',()=>changeLocation(k));
    ct.appendChild(btn);
  });
}

// ─── 위치 정보 ───────────────────────────────────────────────
function renderLocInfo(){
  const l=LOCS[G.loc];
  document.getElementById('locIco').textContent=l.icon;
  document.getElementById('locNm').textContent=l.name;
  document.getElementById('locDesc').textContent=l.desc;
}

// ─── 획득 미리보기 ───────────────────────────────────────────
function givesPreview(gives){
  const icons={water:'💧',energy:'⚡',hp:'❤️',rescue:'🆘',
               wood:'🪵',stone:'🪨',herb:'🌿',stored_water:'💦',shelterLv:'🏕',campfire:'🔥',
               berry:'🫐',mushroom:'🍄',shellfish:'🦪',fish:'🐟',crab:'🦀',coconut:'🥥',egg:'🥚'};
  return Object.entries(gives).filter(([k,v])=>v>0&&icons[k]).map(([k,v])=>`${icons[k]}+${v}`).join(' ');
}

// ─── 행동 렌더 ───────────────────────────────────────────────
function renderActions(){
  const rem=MAX_TIME-G.timeSlot;
  const ph=getPhase(G.timeSlot);
  document.getElementById('actStatus').innerHTML=
    `<span style="color:${ph.color}">${ph.label}</span> <span class="ts-clock">${slotToTime(G.timeSlot)}</span> &nbsp;|&nbsp; 남은 시간: <b>${rem*30}분</b>`;
  const grid=document.getElementById('actGrid'); grid.innerHTML='';
  ACTS[G.loc].forEach(a=>{
    const enoughE=G.energy>=(a.en||0);
    const hasReq=!a.req||Object.entries(a.req).every(([k,v])=>{
      if(k==='shelterLv') return G.shelterLv>=v;
      return (G.inv[k]||0)>=v;
    });
    const notNightOnly=!a.nightOnly||isNight();
    const timeLeft=G.timeSlot+a.time<=MAX_TIME;

    if(a.id==='upgrade'&&G.shelterLv>=3){
      const btn=document.createElement('button'); btn.className='act-btn'; btn.disabled=true;
      btn.innerHTML=`<span class="ai">${a.icon}</span><span class="an">${a.name}</span><span class="ac">최대 레벨 달성</span>`;
      grid.appendChild(btn); return;
    }
    if(a.id==='campfire'&&G.campfire){
      const btn=document.createElement('button'); btn.className='act-btn'; btn.disabled=true;
      btn.innerHTML=`<span class="ai">${a.icon}</span><span class="an">${a.name}</span><span class="ac">이미 피워있음</span>`;
      grid.appendChild(btn); return;
    }

    const ok=enoughE&&hasReq&&notNightOnly&&timeLeft&&!G.dead&&!G.won;
    const btn=document.createElement('button');
    btn.className='act-btn'; btn.disabled=!ok;

    let costStr=a.en?`⚡-${a.en} ⏱-${a.time*30}분`:`⏱-${a.time*30}분`;
    if(a.nightOnly) costStr+=' | 🌙 심야 전용';
    const preview=givesPreview(a.gives);
    let reqHtml='';
    if(a.req) reqHtml=`<span class="ar">필요: ${Object.entries(a.req).map(([k,v])=>ITEMS[k]?ITEMS[k].icon+v:k+v).join(' ')}</span>`;

    btn.innerHTML=`<span class="ai">${a.icon}</span><span class="an">${a.name}</span><span class="ac">${costStr}</span>${preview?`<span class="ag">${preview}</span>`:''}${reqHtml}`;
    btn.addEventListener('click',()=>doAct(a)); grid.appendChild(btn);
  });
  const nd=document.getElementById('ndBtn');
  nd.disabled=G.dead||G.won;
  nd.onclick=nextDay;
}

// ─── 제작 렌더 ───────────────────────────────────────────────
function renderCrafts(){
  const grid=document.getElementById('craftGrid'); grid.innerHTML='';
  CRAFTS.forEach(c=>{
    if(c.oneTime){
      const key=Object.keys(c.res)[0];
      if(key==='shelter'&&G.shelter){
        const btn=document.createElement('button'); btn.className='craft-btn'; btn.disabled=true;
        btn.innerHTML=`<span class="cico">${c.icon}</span><span class="cn">${c.name}</span><span class="cr">이미 건설됨</span>`;
        grid.appendChild(btn); return;
      }
      if(key==='fence'&&G.fence){
        const btn=document.createElement('button'); btn.className='craft-btn'; btn.disabled=true;
        btn.innerHTML=`<span class="cico">${c.icon}</span><span class="cn">${c.name}</span><span class="cr">이미 설치됨</span>`;
        grid.appendChild(btn); return;
      }
    }
    const can=Object.entries(c.req).every(([k,v])=>(G.inv[k]||0)>=v);
    const btn=document.createElement('button');
    btn.className='craft-btn'+(can?' avail':''); btn.disabled=!can||G.dead;
    const rq=Object.entries(c.req).map(([k,v])=>(ITEMS[k]?ITEMS[k].icon:k)+v).join(' ');
    const resStr=Object.entries(c.res).map(([k,v])=>{
      if(k==='shelter') return '🏕 은신처';
      if(k==='fence')   return '🪵 울타리';
      return (ITEMS[k]?ITEMS[k].icon:k)+v;
    }).join(' ');
    btn.innerHTML=`<span class="cico">${c.icon}</span><span class="cn">${c.name}</span><span class="cr">필요: ${rq}</span><span class="cres">→ ${resStr}</span>`;
    btn.addEventListener('click',()=>doCraft(c)); grid.appendChild(btn);
  });
}

// ══════════════════════════════════════════════════════════════
//  요리 시스템
// ══════════════════════════════════════════════════════════════
function renderCooking(){
  const grid=document.getElementById('cookGrid'); grid.innerHTML='';
  RECIPES.forEach(r=>{
    const can=Object.entries(r.req).every(([k,v])=>(G.inv[k]||0)>=v);
    const timeLeft=G.timeSlot+r.time<=MAX_TIME;
    const ok=can&&timeLeft&&!G.dead&&!G.won;
    const btn=document.createElement('button');
    btn.className='cook-btn'+(can?' avail':''); btn.disabled=!ok;
    const rq=Object.entries(r.req).map(([k,v])=>(ITEMS[k]?ITEMS[k].icon:k)+v).join(' ');
    const diffStars='★'.repeat(r.diff)+'☆'.repeat(3-r.diff);
    btn.innerHTML=`
      <span class="cico">${r.icon}</span>
      <span class="cn">${r.name}</span>
      <span class="cook-diff" title="요리 난이도">${diffStars}</span>
      <span class="cr">재료: ${rq}</span>
      <span class="ag">🍖+${r.food}${r.hp?` ❤️+${r.hp}`:''} ⏱-${r.time*30}분</span>`;
    btn.addEventListener('click',()=>startCooking(r)); grid.appendChild(btn);
  });
}

// ─── 요리 미니게임 시작 ──────────────────────────────────────
function startCooking(recipe){
  if(G.dead||G.won)return;
  if(!Object.entries(recipe.req).every(([k,v])=>(G.inv[k]||0)>=v)) return;
  if(G.timeSlot+recipe.time>MAX_TIME) return;

  // 재료 선 소모
  Object.entries(recipe.req).forEach(([k,v])=>{ G.inv[k]=Math.max(0,(G.inv[k]||0)-v); });

  // 미니게임 상태 초기화
  // 난이도에 따라 구간 수(phases) 와 zone 너비 결정
  const phases=recipe.diff+1; // 2~4번 클릭
  const zoneW=recipe.diff===1?0.3:recipe.diff===2?0.22:0.15; // 성공 구간 비율

  cookState={
    recipe,
    phase:0, phases,
    score:0,    // 성공한 클릭 수
    zoneW,
    markerPos:0,   // 0~1
    markerDir:1,
    markerSpeed:recipe.diff===1?0.008:recipe.diff===2?0.012:0.018,
    zoneStart: Math.random()*(1-zoneW),
    animId:null,
    resultShown:false,
  };
  renderCookModal();
  animateCook();
}

function renderCookModal(){
  const cs=cookState;
  const r=cs.recipe;
  document.getElementById('cookModalTitle').textContent=`${r.icon} ${r.name} 요리 중`;
  document.getElementById('cookModalPhase').textContent=`단계 ${cs.phase+1} / ${cs.phases}`;
  document.getElementById('cookModalDesc').textContent=
    cs.phase===0?'재료를 다듬는다...':cs.phase===1?'불 위에 올린다...':cs.phase===2?'간을 맞춘다...':'마무리 한다...';
  document.getElementById('cookModal').classList.add('show');
  updateCookBar();
}

function updateCookBar(){
  if(!cookState)return;
  const cs=cookState;
  const bar=document.getElementById('cookBar');
  const zone=document.getElementById('cookZone');
  const marker=document.getElementById('cookMarker');
  bar.style.position='relative';
  zone.style.left=(cs.zoneStart*100)+'%';
  zone.style.width=(cs.zoneW*100)+'%';
  marker.style.left=(cs.markerPos*100)+'%';
}

function animateCook(){
  if(!cookState)return;
  const cs=cookState;
  cs.markerPos+=cs.markerDir*cs.markerSpeed;
  if(cs.markerPos>=1){cs.markerPos=1;cs.markerDir=-1;}
  if(cs.markerPos<=0){cs.markerPos=0;cs.markerDir=1;}
  updateCookBar();
  cs.animId=requestAnimationFrame(animateCook);
}

function cookClick(){
  if(!cookState||cookState.resultShown)return;
  const cs=cookState;
  cancelAnimationFrame(cs.animId);

  const inZone=cs.markerPos>=cs.zoneStart&&cs.markerPos<=(cs.zoneStart+cs.zoneW);
  if(inZone) cs.score++;

  // 다음 단계
  cs.phase++;
  if(cs.phase<cs.phases){
    cs.zoneStart=Math.random()*(1-cs.zoneW);
    cs.markerPos=Math.random();
    cs.markerDir=Math.random()>0.5?1:-1;
    renderCookModal();
    animateCook();
  } else {
    // 결과 처리
    finishCooking();
  }
}

function finishCooking(){
  const cs=cookState;
  const r=cs.recipe;
  cs.resultShown=true;
  cancelAnimationFrame(cs.animId);

  const ratio=cs.score/cs.phases; // 0~1
  let foodGain, hpGain, quality;
  if(ratio>=0.8){
    quality='완벽!'; foodGain=Math.round(r.food*1.3); hpGain=Math.round((r.hp||0)*1.5);
  } else if(ratio>=0.5){
    quality='성공'; foodGain=r.food; hpGain=r.hp||0;
  } else if(ratio>=0.2){
    quality='부족'; foodGain=Math.round(r.food*0.6); hpGain=0;
  } else {
    quality='실패'; foodGain=Math.round(r.food*0.2); hpGain=0;
  }

  // 스탯 적용
  G.satiety=clamp(G.satiety+foodGain,0,100);
  G.hp=clamp(G.hp+hpGain,0,100);
  advanceTime(r.time);

  // 결과 UI 업데이트
  const qualCls=ratio>=0.8?'cook-perfect':ratio>=0.5?'cook-good':ratio>=0.2?'cook-poor':'cook-fail';
  document.getElementById('cookModalPhase').textContent='완료!';
  document.getElementById('cookModalDesc').innerHTML=
    `<span class="${qualCls}">${quality}</span> — 🍖+${foodGain}${hpGain>0?` ❤️+${hpGain}`:''}`;
  document.getElementById('cookClickBtn').textContent='확인';
  document.getElementById('cookClickBtn').onclick=closeCookModal;

  addLog(`${r.icon} ${r.name} 요리 완료 (${quality}) 🍖+${foodGain}${hpGain>0?` ❤️+${hpGain}`:''}`,
    ratio>=0.5?'lg-good':ratio>=0.2?'lg-info':'lg-bad');
  // 토스트: 요리 결과
  if(ratio>=0.8) showToast(`👨‍🍳 ${r.name} — 완벽한 요리! 🍖+${foodGain} ❤️+${hpGain}`,'good');
  else if(ratio<0.2) showToast(`😢 ${r.name} — 요리 실패...`,'bad');
}

function closeCookModal(){
  document.getElementById('cookModal').classList.remove('show');
  cookState=null;
  renderAll();
  checkWL();
}

// ─── 우측 패널 ───────────────────────────────────────────────
function renderRight(){
  // 48칸 타임바: 그룹 4개 (아침/오후/저녁/심야) 각 12칸
  let pips='';
  const phaseColors=['#e3b341','#f0a050','#bc8cff','#58a6ff'];
  for(let i=0;i<MAX_TIME;i++){
    const used=i<G.timeSlot;
    const cur=i===G.timeSlot;
    const phIdx=Math.floor(i/12);
    const col=phaseColors[phIdx];
    const style=used?`background:#21262d;border-color:#30363d`:
                cur?`background:${col};box-shadow:0 0 5px ${col}88`:
                `background:${col}33;border-color:${col}55`;
    pips+=`<div class="pip2" style="${style}" title="${slotToTime(i)}"></div>`;
  }
  document.getElementById('pipRow').innerHTML=`<div class="pip2-row">${pips}</div>`;
  document.getElementById('actRem').textContent=`${(MAX_TIME-G.timeSlot)*30}분 남음`;
  const rp=clamp(Math.round(G.rescue),0,100);
  document.getElementById('rescPct').textContent=rp+'%';
  document.getElementById('rescFill').style.width=rp+'%';
}

// ─── 로그 ────────────────────────────────────────────────────
function renderLog(){
  document.getElementById('logWrap').innerHTML=logEntries.map(e=>`<div class="lg ${e.c}">${e.m}</div>`).join('');
}
function addLog(m,c='lg-info'){
  logEntries.unshift({m,c}); if(logEntries.length>60)logEntries.pop(); renderLog();
}

// ══════════════════════════════════════════════════════════════
//  이동 / 행동 / 제작
// ══════════════════════════════════════════════════════════════
function changeLocation(loc){
  if(loc===G.loc||G.dead||G.won)return;
  const cfg=DCFG[diff];
  const mt=timeCostMove();
  if(mt>0){
    if(G.timeSlot+mt>MAX_TIME||G.energy<cfg.moveCost)return;
    G.energy=Math.max(0,G.energy-cfg.moveCost);
    advanceTime(mt);
    addLog(`${LOCS[loc].icon} ${LOCS[loc].name}(으)로 이동 ⚡-${cfg.moveCost} ⏱-${mt*30}분`,'lg-info');
  } else {
    addLog(`${LOCS[loc].icon} ${LOCS[loc].name}(으)로 이동했다.`,'lg-info');
  }
  G.loc=loc;
  checkAndNextDay();
}

function doAct(a){
  if(G.dead||G.won)return;
  G.energy=Math.max(0,G.energy-(a.en||0));
  // gives 처리
  if(a.gives.water)   G.water  =clamp(G.water  +a.gives.water,  0,100);
  if(a.gives.energy)  G.energy =clamp(G.energy +a.gives.energy, 0,100);
  if(a.gives.hp)      G.hp     =clamp(G.hp     +a.gives.hp,     0,100);
  if(a.gives.rescue)  G.rescue =clamp(G.rescue +a.gives.rescue, 0,100);
  if(a.gives.wood)    G.inv.wood    +=(a.gives.wood||0);
  if(a.gives.stone)   G.inv.stone   +=(a.gives.stone||0);
  if(a.gives.herb)    G.inv.herb    +=(a.gives.herb||0);
  if(a.gives.stored_water) G.inv.stored_water+=(a.gives.stored_water||0);
  if(a.gives.shelterLv)    G.shelterLv=Math.min(3,G.shelterLv+(a.gives.shelterLv||0));
  if(a.gives.campfire)     G.campfire=true;
  // 식재료
  ['berry','mushroom','shellfish','fish','crab','coconut','egg'].forEach(k=>{
    if(a.gives[k]) G.inv[k]=(G.inv[k]||0)+a.gives[k];
  });
  if(a.con) Object.entries(a.con).forEach(([k,v])=>{ G.inv[k]=Math.max(0,(G.inv[k]||0)-v); });
  advanceTime(a.time);
  const col=a.gives.rescue>4||a.gives.hp>0||a.gives.energy>0?'lg-good':'lg-info';
  addLog(a.txt, col);
  checkAndNextDay();
}

function doCraft(c){
  if(!Object.entries(c.req).every(([k,v])=>(G.inv[k]||0)>=v))return;
  Object.entries(c.req).forEach(([k,v])=>{ G.inv[k]-=v; });
  if(c.res.shelter){ G.shelter=true; G.loc='shelter'; addLog('🏕 은신처를 지었다!','lg-good'); }
  else if(c.res.fence){ G.fence=true; addLog('🪵 울타리를 설치했다!','lg-good'); }
  else {
    Object.entries(c.res).forEach(([k,v])=>{ G.inv[k]=(G.inv[k]||0)+v; });
    addLog(`⚒ ${c.name}을(를) 제작했다!`,'lg-good');
  }
  renderAll();
}

// ══════════════════════════════════════════════════════════════
//  시간 / 날 진행
// ══════════════════════════════════════════════════════════════
function advanceTime(slots){ G.timeSlot=Math.min(MAX_TIME,G.timeSlot+slots); }

function checkAndNextDay(){
  if(G.timeSlot>=MAX_TIME) nextDay();
  else { renderAll(); checkWL(); }
}

function nextDay(){
  if(G.dead||G.won)return;
  const cfg=DCFG[diff];
  const psat=G.satiety, pw=G.water, pe=G.energy, ph=G.hp;

  G.day++;
  G.timeSlot=0;
  G.campfire=false;

  G.satiety=Math.max(0,G.satiety-cfg.foodDrain);
  G.water  =Math.max(0,G.water  -cfg.waterDrain);

  const shelterBonus=G.shelter?G.shelterLv*5:0;
  G.energy=clamp(G.energy+35+shelterBonus,0,100);

  if(G.inv.stored_water>0){ G.water=clamp(G.water+G.inv.stored_water*10,0,100); G.inv.stored_water=0; }

  if(G.satiety<=0)  G.hp=Math.max(0,G.hp-15);
  if(G.water<=0)    G.hp=Math.max(0,G.hp-20);

  // 식중독 진행/회복
  if(G.sick){ G.hp=Math.max(0,G.hp-10); G.sick=false; addLog('🤢 식중독이 회복됐다.','lg-info'); }

  let decay=false;
  if(G.rescue>0&&Math.random()<(diff==='hard'?0.15:0.08)){ G.rescue=Math.max(0,G.rescue-10); decay=true; }

  // 일반 이벤트
  let ev=null;
  if(Math.random()<(diff==='easy'?0.3:diff==='normal'?0.4:0.5)){
    ev=EVENTS[Math.floor(Math.random()*EVENTS.length)];
    applyEvent(ev);
  }

  // 야생동물
  let nightAttack=null;
  const naChance=diff==='easy'?0.2:diff==='normal'?0.35:0.5;
  if(Math.random()<naChance){
    nightAttack=NIGHT_ATTACKS[Math.floor(Math.random()*NIGHT_ATTACKS.length)];
    let blocked=(nightAttack.fenceBlock&&G.fence)||G.campfire;
    if(!blocked){ G.hp=Math.max(0,G.hp-nightAttack.dmg); }
    nightAttack._blocked=blocked;
  }

  const satD=Math.round(G.satiety-psat), wD=Math.round(G.water-pw);
  const eD=Math.round(G.energy-pe), hD=Math.round(G.hp-ph);
  showDayModal(G.day,satD,wD,eD,hD,ev,decay,nightAttack);
  addLog(`📅 ${G.day}일차가 시작됐다.`,'lg-day');
  if(ev)addLog(ev.txt,ev.t==='bad'?'lg-bad':'lg-good');
  if(decay)addLog('🌧 악천후로 구조 신호가 손상됐다!','lg-bad');
  if(nightAttack){
    if(nightAttack._blocked) addLog(`${nightAttack.txt} → 방어 성공!`,'lg-good');
    else addLog(`${nightAttack.txt} ❤️-${nightAttack.dmg}`,'lg-bad');
  }
}

function applyEvent(ev){
  Object.entries(ev.e).forEach(([k,v])=>{
    if(k==='rescue')    G.rescue  =clamp(G.rescue+v,0,100);
    else if(k==='hp')   G.hp      =clamp(G.hp+v,0,100);
    else if(k==='water')G.water   =clamp(G.water+v,0,100);
    else if(k==='energy')G.energy =clamp(G.energy+v,0,100);
    // 이벤트로 식재료 획득/손실
    else if(k==='coconut_ev'){ G.inv.coconut=(G.inv.coconut||0)+v; }
    else if(k==='berry_ev'){
      const lose=Math.min(G.inv.berry||0,Math.abs(v));
      G.inv.berry=Math.max(0,(G.inv.berry||0)-lose);
    }
    else if(k==='food') G.satiety=clamp(G.satiety+v,0,100); // 통조림 등
  });
}

// ─── 하루 모달 ───────────────────────────────────────────────
function showDayModal(day,satD,wD,eD,hD,ev,decay,nightAttack){
  document.getElementById('dmoDay').textContent=day+'일차';
  function ch(ico,lb,v){
    const cls=v>0?'pos':v<0?'neg':'neu';
    return `<div class="dmo-ch ${cls}"><span class="ci">${ico}</span><span class="cv">${(v>0?'+':'')+v}</span><span class="cl">${lb}</span></div>`;
  }
  document.getElementById('dmoChanges').innerHTML=ch('❤️','체력',hD)+ch('🍖','포만감',satD)+ch('💧','수분',wD)+ch('⚡','에너지',eD);

  let evLines=[];
  if(!ev&&!decay&&!nightAttack) evLines.push(`<span style="color:#8b949e">특별한 이벤트 없이 밤이 지나갔다.</span>`);
  if(decay) evLines.push(`<span style="color:#ff7b72">🌧 악천후로 구조 신호 일부가 손상됐다.</span>`);
  if(ev)    evLines.push(`<span style="color:${ev.t==='bad'?'#ff7b72':'#7ee787'}">${ev.txt}</span>`);
  if(nightAttack){
    const col=nightAttack._blocked?'#7ee787':'#ff7b72';
    const suf=nightAttack._blocked?' → <b>방어 성공!</b>':` → ❤️-${nightAttack.dmg}`;
    evLines.push(`<span style="color:${col}">${nightAttack.txt}${suf}</span>`);
  }
  document.getElementById('dmoEvt').innerHTML=evLines.join('<br>');
  document.getElementById('dayModal').classList.add('show');
  let t=5; document.getElementById('dmoTimer').textContent=`${t}초 후 자동으로 닫힘`;
  if(dTimer)clearInterval(dTimer);
  dTimer=setInterval(()=>{
    t--; document.getElementById('dmoTimer').textContent=`${t}초 후 자동으로 닫힘`;
    if(t<=0)closeDayModal();
  },1000);

  // 야생동물 공격이 있었을 때 토스트로 즉시 알림
  if(nightAttack&&!nightAttack._blocked){
    showToast(`${nightAttack.txt} ❤️-${nightAttack.dmg}`,'bad');
  }
}

function closeDayModal(){
  if(dTimer){clearInterval(dTimer);dTimer=null;}
  document.getElementById('dayModal').classList.remove('show');
  renderAll(); checkWL();
}

// ─── 승패 체크 ───────────────────────────────────────────────
function checkWL(){
  if(G.hp<=0){G.dead=true;showEnd(false,`${G.day}일간 버텼지만 결국 섬을 벗어나지 못했습니다.`);}
  else if(G.rescue>=100){G.won=true;showEnd(true,`${G.day}일 만에 구조대가 도착했습니다!`);}
}

function showEnd(win,msg){
  document.getElementById('endScreen').classList.add('show');
  document.getElementById('endTitle').textContent=win?'🎉 구조됨!':'💀 사망';
  document.getElementById('endTitle').style.color=win?'#3fb950':'#f85149';
  document.getElementById('endMsg').textContent=msg;
  const si=G.shelter?` · 은신처 Lv.${G.shelterLv}`:'';
  document.getElementById('endStats').innerHTML=
    `생존: <b>${G.day}일</b> · 난이도: <b>${DCFG[diff].label}</b>${si}<br>
     최종 체력: <b>${Math.round(G.hp)}</b> · 구조 진행도: <b>${Math.round(G.rescue)}%</b><br>
     보유 나무: <b>${G.inv.wood}</b> · 약초: <b>${G.inv.herb}</b> · 돌: <b>${G.inv.stone}</b>`;
}
