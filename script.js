
// ─── 난이도 설정 ───────────────────────────────────────────────
const DCFG = {
  easy:  {label:'🌴 쉬움',   timePerAct:1, food:10, water:14, moveCost:0,  moveTime:0},
  normal:{label:'⚠️ 보통',  timePerAct:1, food:15, water:20, moveCost:5,  moveTime:1},
  hard:  {label:'💀 어려움', timePerAct:1, food:20, water:26, moveCost:8,  moveTime:1},
};

// ─── 시간대 ────────────────────────────────────────────────────
// timeSlot: 0=아침, 1=점심, 2=저녁, 3=심야
const TIME_SLOTS = [
  {label:'🌅 아침', cls:'t-morning', color:'#e3b341'},
  {label:'☀️ 점심', cls:'t-noon',    color:'#f0a050'},
  {label:'🌆 저녁', cls:'t-evening', color:'#bc8cff'},
  {label:'🌙 심야', cls:'t-night',   color:'#58a6ff'},
];
const MAX_TIME = 4; // 하루 4칸 (아침~심야)

// ─── 장소 ──────────────────────────────────────────────────────
const LOCS = {
  beach: {icon:'🏖',name:'해변',    desc:'모래사장. 조개·유목 수거, SOS 신호 가능.'},
  forest:{icon:'🌲',name:'숲',      desc:'울창한 나무. 열매·약초·목재 채취 가능.'},
  river: {icon:'🏞',name:'강',      desc:'맑은 계곡물. 음용수와 물고기를 얻을 수 있다.'},
  cave:  {icon:'🪨',name:'동굴',    desc:'서늘한 동굴. 휴식하거나 돌을 캘 수 있다.'},
  raft:  {icon:'🛶',name:'뗏목 작업장',desc:'뗏목으로 구조 신호를 보낼 수 있다.'},
  shelter:{icon:'🏕',name:'은신처', desc:'직접 지은 보금자리. 안전하게 쉬고 밤을 보낼 수 있다.'},
};

// ─── 행동 목록 ────────────────────────────────────────────────
const ACTS = {
  beach:[
    {id:'shell', name:'조개 줍기',   icon:'🦪', en:5,  gives:{food:15},       txt:'조개를 주웠다. 허기가 약간 채워진다.'},
    {id:'stick', name:'유목 수거',   icon:'🪵', en:5,  gives:{wood:2},        txt:'해변에 밀려온 나무를 주웠다.'},
    {id:'sos',   name:'모래 SOS',    icon:'🆘', en:8,  gives:{rescue:3},      txt:'모래 위에 SOS를 크게 새겼다.'},
    {id:'log',   name:'통나무 수거', icon:'🌳', en:15, gives:{wood:5},        txt:'큰 통나무를 모았다.'},
  ],
  forest:[
    {id:'fruit', name:'열매 따기',   icon:'🍓', en:10, gives:{food:25},       txt:'달콤한 열매를 찾았다!'},
    {id:'herb',  name:'약초 채집',   icon:'🌿', en:10, gives:{herb:2},        txt:'상처에 좋은 약초를 모았다.'},
    {id:'chop',  name:'나무 베기',   icon:'🪓', en:20, gives:{wood:6},  req:{axe:1}, txt:'도끼로 나무를 베었다.'},
    {id:'gather',name:'가지 모으기', icon:'🪵', en:12, gives:{wood:3},        txt:'마른 나뭇가지를 모았다.'},
  ],
  river:[
    {id:'drink', name:'물 마시기',   icon:'💧', en:3,  gives:{water:40},      txt:'차가운 물을 실컷 마셨다! 갈증 해소.'},
    {id:'fish',  name:'낚시',        icon:'🎣', en:15, gives:{food:35}, req:{rod:1},    txt:'물고기를 낚았다! 든든하다.'},
    {id:'hfish', name:'맨손 낚시',   icon:'🐟', en:20, gives:{food:15},       txt:'맨손으로 작은 물고기를 잡았다.'},
    {id:'fillw', name:'물통 채우기', icon:'🫙', en:5,  gives:{stored_water:3},req:{bottle:1},txt:'물통에 깨끗한 물을 담았다.'},
  ],
  cave:[
    {id:'rest',  name:'휴식',        icon:'😴', en:0,  gives:{energy:40,hp:8},txt:'잠시 쉬었다. 회복된다.'},
    {id:'sleep', name:'수면',        icon:'🌙', en:0,  gives:{energy:80,hp:20},nightOnly:true,txt:'충분히 잠들었다. 활력이 돌아왔다.'},
    {id:'stone', name:'돌 캐기',     icon:'🪨', en:15, gives:{stone:3},       txt:'동굴 벽에서 돌 3개를 캤다.'},
    {id:'med',   name:'명상',        icon:'🧘', en:5,  gives:{hp:12},         txt:'마음을 가다듬으니 몸이 회복된다.'},
  ],
  raft:[
    {id:'build', name:'뗏목 조립',   icon:'🛶', en:20, gives:{rescue:8},  req:{wood:5},  con:{wood:5},  txt:'나무를 엮어 뗏목을 조립했다! 구조+8'},
    {id:'fire',  name:'봉화 신호',   icon:'🔥', en:15, gives:{rescue:5},  req:{wood:3},  con:{wood:3},  txt:'봉화를 피워 구조 신호를 보냈다!'},
    {id:'mir',   name:'거울 신호',   icon:'🪞', en:10, gives:{rescue:10}, req:{mirror:1},               txt:'거울로 배를 향해 신호를 보냈다!'},
    {id:'flag',  name:'깃발 달기',   icon:'🚩', en:10, gives:{rescue:4},  req:{cloth:2}, con:{cloth:2}, txt:'깃발을 만들어 높이 달았다.'},
  ],
  shelter:[
    {id:'srest', name:'휴식',        icon:'😴', en:0,  gives:{energy:45,hp:10},txt:'은신처에서 편안히 쉬었다. 회복이 빠르다.'},
    {id:'ssleep',name:'수면',        icon:'🌙', en:0,  gives:{energy:90,hp:25},nightOnly:true,txt:'은신처에서 깊이 잠들었다. 완전히 회복됐다.'},
    {id:'upgrade',name:'은신처 강화',icon:'🔧', en:15, gives:{shelterLv:1},req:{wood:3,stone:2},con:{wood:3,stone:2},maxLv:3,txt:'은신처를 더 튼튼하게 보강했다.'},
    {id:'campfire',name:'모닥불 피우기',icon:'🔥',en:10,gives:{campfire:1},req:{wood:2},con:{wood:2},maxCampfire:1,txt:'모닥불을 피웠다. 밤이 따뜻하고 안전해진다.'},
  ],
};

// ─── 제작 ─────────────────────────────────────────────────────
const CRAFTS = [
  {icon:'🪓',name:'돌도끼',    desc:'나무 베기',   req:{wood:3,stone:2}, res:{axe:1}},
  {icon:'🎣',name:'낚싯대',    desc:'낚시 가능',   req:{wood:2,herb:1},  res:{rod:1}},
  {icon:'🫙',name:'대나무통',  desc:'물 보관',     req:{wood:3},         res:{bottle:1}},
  {icon:'🩹',name:'붕대',      desc:'HP +25',      req:{herb:3},         res:{bandage:2}},
  {icon:'🧵',name:'천 조각',   desc:'깃발 재료',   req:{herb:4},         res:{cloth:2}},
  {icon:'🪞',name:'반짝 거울', desc:'거울 신호',   req:{stone:4},        res:{mirror:1}},
  {icon:'🏕',name:'기본 은신처',desc:'밤 안전 확보', req:{wood:8,stone:3}, res:{shelter:1}, oneTime:true},
  {icon:'🪵',name:'울타리',    desc:'야생동물 방어↑',req:{wood:6},       res:{fence:1}, oneTime:true},
];

// ─── 아이템 ────────────────────────────────────────────────────
const ITEMS = {
  wood:{icon:'🪵',name:'나무'}, stone:{icon:'🪨',name:'돌'},  herb:{icon:'🌿',name:'약초'},
  bandage:{icon:'🩹',name:'붕대'}, axe:{icon:'🪓',name:'도끼'}, rod:{icon:'🎣',name:'낚싯대'},
  bottle:{icon:'🫙',name:'물통'}, cloth:{icon:'🧵',name:'천'}, mirror:{icon:'🪞',name:'거울'},
  stored_water:{icon:'💦',name:'물'},
};

// ─── 이벤트 ────────────────────────────────────────────────────
const EVENTS = [
  {t:'bad', txt:'🌧 폭우가 내린다. 체력이 감소한다.',          e:{hp:-10}},
  {t:'good',txt:'🌈 맑고 화창한 날씨다. 기분이 좋아진다.',    e:{energy:12}},
  {t:'bad', txt:'🐍 독뱀에게 물렸다! 체력이 크게 감소한다.', e:{hp:-22}},
  {t:'good',txt:'🌊 파도에 통조림 캔이 떠내려왔다!',           e:{food:30}},
  {t:'bad', txt:'😰 극심한 더위로 탈수 증세가 온다.',          e:{water:-18}},
  {t:'good',txt:'✈️ 비행기가 지나갔다. 손을 흔들었다!',        e:{rescue:6}},
  {t:'bad', txt:'🌡 밤새 열병으로 시달렸다.',                  e:{hp:-14,energy:-15}},
  {t:'good',txt:'🥥 코코넛이 떨어졌다. 수분과 허기가 채워진다.',e:{food:20,water:20}},
  {t:'bad', txt:'🐦 새들이 비축해둔 열매를 먹어버렸다.',       e:{food:-15}},
  {t:'good',txt:'🌿 희귀한 약초를 발견했다.',                  e:{hp:15}},
];

// 심야 야생동물 공격 이벤트 (별도 관리)
const NIGHT_ATTACKS = [
  {txt:'🐗 멧돼지가 야영지를 습격했다!',    dmg:25, fenceBlock:true},
  {txt:'🐺 늑대 무리가 으르렁거리며 다가온다!', dmg:30, fenceBlock:true},
  {txt:'🐻 곰이 냄새를 맡고 접근했다!',       dmg:35, fenceBlock:false},
  {txt:'🦟 독벌레 떼가 덮쳤다!',              dmg:15, fenceBlock:false},
];

// ─── 전역 상태 ────────────────────────────────────────────────
let G={}, diff='easy', selDiff='easy', logEntries=[], dTimer=null;

// ─── 난이도 카드 ─────────────────────────────────────────────
const DIFF_INFO = [
  {key:'easy',  ico:'🌴',nm:'쉬움',   desc:'자원 풍부\n하루 4시간대\n이동 무료'},
  {key:'normal',ico:'⚠️', nm:'보통',  desc:'균형잡힌 도전\n하루 4시간대\n이동 시 소모'},
  {key:'hard',  ico:'💀', nm:'어려움',desc:'생존 극한\n하루 4시간대\n이동 비용↑'},
];
document.getElementById('diffCards').innerHTML = DIFF_INFO.map((d,i)=>`
  <div class="dcard${i===0?' sel':''}" data-d="${d.key}">
    <span class="di">${d.ico}</span>
    <span class="dn">${d.nm}</span>
    <span class="dd">${d.desc.replace(/\n/g,'<br>')}</span>
  </div>`).join('');
document.getElementById('diffCards').addEventListener('click',e=>{
  const c=e.target.closest('.dcard');
  if(!c)return;
  selDiff=c.dataset.d;
  document.querySelectorAll('.dcard').forEach(el=>el.classList.toggle('sel',el===c));
});

// ─── 시작 ────────────────────────────────────────────────────
function startGame(){
  diff=selDiff;
  const cfg=DCFG[diff];
  G={
    day:1,
    timeSlot:0,       // 0=아침,1=점심,2=저녁,3=심야
    hp:100,food:70,water:70,energy:80,rescue:0,
    inv:{wood:0,stone:0,herb:0,bandage:0,axe:0,rod:0,bottle:0,cloth:0,mirror:0,stored_water:0},
    loc:'beach',
    dead:false,won:false,
    shelter:false,    // 은신처 건설 여부
    shelterLv:0,      // 은신처 레벨 (0~3)
    fence:false,      // 울타리 설치 여부
    campfire:false,   // 모닥불 여부 (하루마다 리셋)
  };
  logEntries=[];
  document.getElementById('startScreen').classList.remove('show');
  document.getElementById('mainGame').style.display='block';
  document.getElementById('diffBadge').textContent=cfg.label;
  renderAll();
  addLog('🏝 섬에 표류했다. 살아남아야 한다...','lg-evt');
  addLog('구조 신호를 100%까지 채우면 탈출할 수 있다.','lg-info');
}
function showStartScreen(){
  document.getElementById('endScreen').classList.remove('show');
  document.getElementById('mainGame').style.display='none';
  document.getElementById('startScreen').classList.add('show');
}

// ─── 시간대 헬퍼 ─────────────────────────────────────────────
function isNight(){ return G.timeSlot===3; }
function timeCostPerAction(){ return 1; } // 행동 1개 = 시간 1칸
function timeCostMove(){ return DCFG[diff].moveTime; }

// ─── 렌더 전체 ───────────────────────────────────────────────
function renderAll(){
  const ts=TIME_SLOTS[G.timeSlot];
  document.getElementById('topDay').textContent=G.day+'일차';
  document.getElementById('topTime').textContent=ts.label;
  document.getElementById('topTime').style.color=ts.color;
  document.getElementById('rightDay').textContent=G.day+'일차';
  const rtEl=document.getElementById('rightTime');
  rtEl.textContent=ts.label; rtEl.className='time-b '+ts.cls;
  renderChar(); renderStats(); renderInv();
  renderLocTabs(); renderLocInfo(); renderActions(); renderCrafts();
  renderRight(); renderLog();
}

// ─── 캐릭터 ──────────────────────────────────────────────────
function renderChar(){
  const hp=G.hp;
  let state,stTxt,stCls;
  if(hp>=75){state='healthy';stTxt='건강';stCls='st-healthy';}
  else if(hp>=50){state='okay';stTxt='양호';stCls='st-okay';}
  else if(hp>=25){state='tired';stTxt='쇠약';stCls='st-tired';}
  else{state='critical';stTxt='위험!';stCls='st-critical';}
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

  // 장비
  let eq='';
  if(G.inv.axe>0)    eq+=`<span class="eq">🪓</span>`;
  if(G.inv.rod>0)    eq+=`<span class="eq">🎣</span>`;
  if(G.inv.bottle>0) eq+=`<span class="eq">🫙</span>`;
  if(G.inv.mirror>0) eq+=`<span class="eq">🪞</span>`;
  if(!eq) eq=`<span style="font-size:11px;color:#8b949e">장비 없음</span>`;
  document.getElementById('equipped').innerHTML=eq;

  // 은신처 상태
  let shelterHtml='';
  if(G.shelter){
    const lvStars='★'.repeat(G.shelterLv)+'☆'.repeat(3-G.shelterLv);
    shelterHtml+=`<div class="shelter-badge">🏕 은신처 ${lvStars}`;
    if(G.fence) shelterHtml+=` <span class="fence-tag">🪵 울타리</span>`;
    if(G.campfire) shelterHtml+=` <span class="fire-tag">🔥 모닥불</span>`;
    shelterHtml+=`</div>`;
  }
  document.getElementById('charShelter').innerHTML=shelterHtml;

  // 붕대 사용 버튼
  const ca=document.getElementById('charActions');
  ca.innerHTML='';
  if(G.inv.bandage>0&&!G.dead){
    const btn=document.createElement('button');
    btn.className='use-item-btn';
    btn.textContent=`🩹 붕대 사용  (🩹-1 / ❤️+25)`;
    btn.addEventListener('click',useBandage); ca.appendChild(btn);
  }
}

function useBandage(){
  if(G.inv.bandage<=0||G.dead)return;
  if(G.timeSlot>=MAX_TIME)return;
  G.inv.bandage--; G.hp=Math.min(100,G.hp+25);
  advanceTime(1);
  addLog('🩹 붕대를 사용했다. 체력 +25','lg-good');
  checkAndNextDay();
}

// ─── 스탯 ────────────────────────────────────────────────────
function renderStats(){
  const stats=[
    {lb:'❤️ 체력',  cls:'bar-hp',    v:G.hp,    style:'background:#3fb950'},
    {lb:'🍖 포만감',cls:'bar-food',  v:G.food,  style:'background:#e3b341'},
    {lb:'💧 수분',  cls:'bar-water', v:G.water, style:'background:#58a6ff'},
    {lb:'⚡ 에너지',cls:'bar-energy',v:G.energy,style:'background:#bc8cff'},
  ];
  document.getElementById('statsArea').innerHTML=stats.map(s=>{
    const v=Math.max(0,Math.min(100,Math.round(s.v)));
    return `<div class="stat${v<=25?' low':''}">
      <div class="stat-row"><span class="sl">${s.lb}</span><span class="sv">${v}</span></div>
      <div class="bar-bg"><div class="bar-fill" style="width:${v}%;${s.style}"></div></div>
    </div>`;
  }).join('');
}

// ─── 인벤토리 ─────────────────────────────────────────────────
function renderInv(){
  document.getElementById('invGrid').innerHTML=Object.entries(ITEMS).map(([k,it])=>{
    const n=G.inv[k]||0;
    return `<div class="inv-slot${n>0?' filled':''}">
      <span class="si">${it.icon}</span><span class="sc">${n}</span><span class="sn">${it.name}</span>
    </div>`;
  }).join('');
}

// ─── 위치 탭 ─────────────────────────────────────────────────
function renderLocTabs(){
  const cfg=DCFG[diff];
  const ct=document.getElementById('locTabs'); ct.innerHTML='';
  Object.entries(LOCS).forEach(([k,l])=>{
    // 은신처는 지은 후에만 탭 표시
    if(k==='shelter'&&!G.shelter) return;
    const isCur=k===G.loc;
    const mt=timeCostMove();
    const canMove=isCur||mt===0||(G.timeSlot+mt<=MAX_TIME&&G.energy>=cfg.moveCost);
    const btn=document.createElement('button');
    btn.className='tab'+(isCur?' cur':'');
    btn.disabled=!canMove&&!isCur;
    let costHtml='';
    if(isCur) costHtml=`<span class="tcur">현재</span>`;
    else if(mt>0) costHtml=`<span class="tc">⚡${cfg.moveCost} ⏱${mt}</span>`;
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

// ─── 획득량 미리보기 문자열 생성 ─────────────────────────────
function givesPreview(gives){
  const parts=[];
  const icons={food:'🍖',water:'💧',energy:'⚡',hp:'❤️',rescue:'🆘',
               wood:'🪵',stone:'🪨',herb:'🌿',stored_water:'💦',shelterLv:'🏕',campfire:'🔥'};
  Object.entries(gives).forEach(([k,v])=>{
    if(v>0&&icons[k]) parts.push(`${icons[k]}+${v}`);
  });
  return parts.join(' ');
}

// ─── 행동 목록 렌더 ──────────────────────────────────────────
function renderActions(){
  const remaining=MAX_TIME-G.timeSlot;
  const ts=TIME_SLOTS[G.timeSlot];
  document.getElementById('actStatus').innerHTML=
    `시간대: <b style="color:${ts.color}">${ts.label}</b> &nbsp;|&nbsp; 남은 시간: <b>${remaining} / ${MAX_TIME}</b>`;
  const grid=document.getElementById('actGrid'); grid.innerHTML='';
  ACTS[G.loc].forEach(a=>{
    // 행동 가능 조건
    const enoughE=G.energy>=(a.en||0);
    const hasReq=!a.req||Object.entries(a.req).every(([k,v])=>{
      if(k==='shelterLv') return G.shelterLv>=v;
      return G.inv[k]>=v;
    });
    const notNightOnly=!a.nightOnly||isNight();
    const timeLeft=G.timeSlot<MAX_TIME;

    // 은신처 강화 최대 레벨 체크
    if(a.id==='upgrade'&&G.shelterLv>=3){
      const btn=document.createElement('button');
      btn.className='act-btn'; btn.disabled=true;
      btn.innerHTML=`<span class="ai">${a.icon}</span><span class="an">${a.name}</span><span class="ac">최대 레벨 달성</span>`;
      grid.appendChild(btn); return;
    }
    // 모닥불 이미 피운 경우
    if(a.id==='campfire'&&G.campfire){
      const btn=document.createElement('button');
      btn.className='act-btn'; btn.disabled=true;
      btn.innerHTML=`<span class="ai">${a.icon}</span><span class="an">${a.name}</span><span class="ac">이미 피워있음</span>`;
      grid.appendChild(btn); return;
    }

    const ok=enoughE&&hasReq&&notNightOnly&&timeLeft&&!G.dead&&!G.won;
    const btn=document.createElement('button');
    btn.className='act-btn'; btn.disabled=!ok;

    // 코스트 표시
    let costStr=a.en?`⚡-${a.en} ⏱-1`:'⏱-1 (에너지 무료)';
    if(a.nightOnly) costStr+=' | 🌙 심야 전용';

    // 획득량 미리보기
    const preview=givesPreview(a.gives);

    // 필요 아이템
    let reqHtml='';
    if(a.req) reqHtml=`<span class="ar">필요: ${Object.entries(a.req).map(([k,v])=>ITEMS[k]?ITEMS[k].icon+v:k+v).join(' ')}</span>`;

    btn.innerHTML=`<span class="ai">${a.icon}</span><span class="an">${a.name}</span><span class="ac">${costStr}</span><span class="ag">${preview}</span>${reqHtml}`;
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
    // oneTime 제작물: 이미 있으면 숨기거나 비활성
    if(c.oneTime){
      const key=Object.keys(c.res)[0];
      if(key==='shelter'&&G.shelter){
        const btn=document.createElement('button');
        btn.className='craft-btn'; btn.disabled=true;
        btn.innerHTML=`<span class="cico">${c.icon}</span><span class="cn">${c.name}</span><span class="cr">이미 건설됨</span>`;
        grid.appendChild(btn); return;
      }
      if(key==='fence'&&G.fence){
        const btn=document.createElement('button');
        btn.className='craft-btn'; btn.disabled=true;
        btn.innerHTML=`<span class="cico">${c.icon}</span><span class="cn">${c.name}</span><span class="cr">이미 설치됨</span>`;
        grid.appendChild(btn); return;
      }
    }
    const can=Object.entries(c.req).every(([k,v])=>G.inv[k]>=v);
    const btn=document.createElement('button');
    btn.className='craft-btn'+(can?' avail':''); btn.disabled=!can||G.dead;
    const rq=Object.entries(c.req).map(([k,v])=>ITEMS[k].icon+v).join(' ');
    // 결과물 미리보기
    const resStr=Object.entries(c.res).map(([k,v])=>{
      if(k==='shelter') return '🏕 은신처';
      if(k==='fence')   return '🪵 울타리';
      return (ITEMS[k]?ITEMS[k].icon:'')+v;
    }).join(' ');
    btn.innerHTML=`<span class="cico">${c.icon}</span><span class="cn">${c.name}</span><span class="cr">필요: ${rq}</span><span class="cres">→ ${resStr}</span>`;
    btn.addEventListener('click',()=>doCraft(c)); grid.appendChild(btn);
  });
}

// ─── 우측 패널 ───────────────────────────────────────────────
function renderRight(){
  // 시간 슬롯 표시
  let pips='';
  for(let i=0;i<MAX_TIME;i++){
    const ts=TIME_SLOTS[i];
    const used=i<G.timeSlot;
    const cur=i===G.timeSlot;
    pips+=`<div class="pip ${used?'used':cur?'cur-pip':'avail'}" title="${ts.label}"></div>`;
  }
  document.getElementById('pipRow').innerHTML=pips;
  document.getElementById('actRem').textContent=`${G.timeSlot}/${MAX_TIME}`;
  const rp=Math.min(100,Math.round(G.rescue));
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

// ─── 이동 ────────────────────────────────────────────────────
function changeLocation(loc){
  if(loc===G.loc||G.dead||G.won)return;
  const cfg=DCFG[diff];
  const mt=timeCostMove();
  if(mt>0){
    if(G.timeSlot+mt>MAX_TIME||G.energy<cfg.moveCost)return;
    G.energy=Math.max(0,G.energy-cfg.moveCost);
    advanceTime(mt);
    addLog(`${LOCS[loc].icon} ${LOCS[loc].name}(으)로 이동 ⚡-${cfg.moveCost} ⏱-${mt}`,'lg-info');
  } else {
    addLog(`${LOCS[loc].icon} ${LOCS[loc].name}(으)로 이동했다.`,'lg-info');
  }
  G.loc=loc; renderAll();
  checkAndNextDay();
}

// ─── 행동 수행 ───────────────────────────────────────────────
function doAct(a){
  if(G.dead||G.won)return;
  G.energy=Math.max(0,G.energy-(a.en||0));
  if(a.gives.food)   G.food  =Math.min(100,G.food  +a.gives.food);
  if(a.gives.water)  G.water =Math.min(100,G.water +a.gives.water);
  if(a.gives.energy) G.energy=Math.min(100,G.energy+a.gives.energy);
  if(a.gives.hp)     G.hp    =Math.min(100,G.hp    +a.gives.hp);
  if(a.gives.rescue) G.rescue=Math.min(100,G.rescue+a.gives.rescue);
  if(a.gives.wood)   G.inv.wood  +=a.gives.wood;
  if(a.gives.stone)  G.inv.stone +=a.gives.stone;
  if(a.gives.herb)   G.inv.herb  +=a.gives.herb;
  if(a.gives.stored_water) G.inv.stored_water+=a.gives.stored_water;
  if(a.gives.shelterLv)    G.shelterLv=Math.min(3,G.shelterLv+a.gives.shelterLv);
  if(a.gives.campfire)     G.campfire=true;
  if(a.con) Object.entries(a.con).forEach(([k,v])=>{ G.inv[k]=Math.max(0,G.inv[k]-v); });
  advanceTime(1);
  addLog(a.txt, a.gives.rescue>4?'lg-good':a.gives.hp>0||a.gives.energy>0?'lg-good':'lg-info');
  checkAndNextDay();
}

// ─── 제작 ────────────────────────────────────────────────────
function doCraft(c){
  if(!Object.entries(c.req).every(([k,v])=>G.inv[k]>=v))return;
  Object.entries(c.req).forEach(([k,v])=>{ G.inv[k]-=v; });
  // 특수 제작물 처리
  if(c.res.shelter){ G.shelter=true; G.loc='shelter'; addLog('🏕 은신처를 지었다! 이제 안전하게 밤을 보낼 수 있다.','lg-good'); }
  else if(c.res.fence){ G.fence=true; addLog('🪵 울타리를 설치했다. 야생동물 방어력이 높아진다!','lg-good'); }
  else {
    Object.entries(c.res).forEach(([k,v])=>{ G.inv[k]=(G.inv[k]||0)+v; });
    addLog(`⚒ ${c.name}을(를) 제작했다!`,'lg-good');
  }
  renderAll();
}

// ─── 시간 진행 ───────────────────────────────────────────────
function advanceTime(slots){
  G.timeSlot=Math.min(MAX_TIME, G.timeSlot+slots);
}

// ─── 하루 종료 체크 ──────────────────────────────────────────
function checkAndNextDay(){
  if(G.timeSlot>=MAX_TIME) nextDay();
  else { renderAll(); checkWL(); }
}

// ─── 다음 날 ─────────────────────────────────────────────────
function nextDay(){
  if(G.dead||G.won)return;
  const cfg=DCFG[diff];
  const pf=G.food,pw=G.water,pe=G.energy,ph=G.hp;

  G.day++;
  G.timeSlot=0;
  G.campfire=false; // 모닥불은 매일 초기화

  G.food =Math.max(0,G.food -cfg.food);
  G.water=Math.max(0,G.water-cfg.water);

  // 은신처 레벨에 따른 에너지 회복 보너스
  const shelterBonus=G.shelter? G.shelterLv*5 : 0;
  G.energy=Math.min(100,G.energy+35+shelterBonus);

  if(G.inv.stored_water>0){G.water=Math.min(100,G.water+G.inv.stored_water*10);G.inv.stored_water=0;}
  if(G.food<=0)  G.hp=Math.max(0,G.hp-15);
  if(G.water<=0) G.hp=Math.max(0,G.hp-20);

  let decay=false;
  if(G.rescue>0&&Math.random()<(diff==='hard'?0.15:0.08)){G.rescue=Math.max(0,G.rescue-10);decay=true;}

  // 일반 이벤트
  let ev=null;
  if(Math.random()<(diff==='easy'?0.3:diff==='normal'?0.4:0.5)){
    ev=EVENTS[Math.floor(Math.random()*EVENTS.length)];
    Object.entries(ev.e).forEach(([k,v])=>{
      if(k==='rescue')G.rescue=Math.min(100,G.rescue+v);
      else if(k==='hp')    G.hp    =Math.min(100,Math.max(0,G.hp+v));
      else if(k==='food')  G.food  =Math.min(100,Math.max(0,G.food+v));
      else if(k==='water') G.water =Math.min(100,Math.max(0,G.water+v));
      else if(k==='energy')G.energy=Math.min(100,Math.max(0,G.energy+v));
    });
  }

  // 심야 야생동물 공격 이벤트
  let nightAttack=null;
  const nightAttackChance=diff==='easy'?0.2:diff==='normal'?0.35:0.5;
  if(Math.random()<nightAttackChance){
    nightAttack=NIGHT_ATTACKS[Math.floor(Math.random()*NIGHT_ATTACKS.length)];
    let blocked=false;
    if(nightAttack.fenceBlock&&G.fence) blocked=true;
    if(G.campfire) blocked=true; // 모닥불로도 방어

    if(!blocked){
      G.hp=Math.max(0,G.hp-nightAttack.dmg);
    }
    nightAttack._blocked=blocked;
  }

  const fd=Math.round(G.food-pf), wd=Math.round(G.water-pw);
  const ed=Math.round(G.energy-pe), hd=Math.round(G.hp-ph);
  showDayModal(G.day,fd,wd,ed,hd,ev,decay,nightAttack);
  addLog(`📅 ${G.day}일차가 시작됐다.`,'lg-day');
  if(ev) addLog(ev.txt,ev.t==='bad'?'lg-bad':'lg-good');
  if(decay) addLog('🌧 악천후로 구조 신호가 손상됐다!','lg-bad');
  if(nightAttack){
    if(nightAttack._blocked){
      addLog(`${nightAttack.txt} → 방어 성공!`,'lg-good');
    } else {
      addLog(`${nightAttack.txt} 체력 -${nightAttack.dmg}`,'lg-bad');
    }
  }
}

// ─── 하루 모달 ───────────────────────────────────────────────
function showDayModal(day,fd,wd,ed,hd,ev,decay,nightAttack){
  document.getElementById('dmoDay').textContent=day+'일차';
  function ch(ico,lb,v){
    const cls=v>0?'pos':v<0?'neg':'neu';
    return `<div class="dmo-ch ${cls}"><span class="ci">${ico}</span><span class="cv">${(v>0?'+':'')+v}</span><span class="cl">${lb}</span></div>`;
  }
  document.getElementById('dmoChanges').innerHTML=ch('❤️','체력',hd)+ch('🍖','포만감',fd)+ch('💧','수분',wd)+ch('⚡','에너지',ed);

  let evLines=[];
  if(!ev&&!decay&&!nightAttack) evLines.push(`<span style="color:#8b949e">특별한 이벤트 없이 밤이 지나갔다.</span>`);
  if(decay) evLines.push(`<span style="color:#ff7b72">🌧 악천후로 구조 신호 일부가 손상됐다.</span>`);
  if(ev)    evLines.push(`<span style="color:${ev.t==='bad'?'#ff7b72':'#7ee787'}">${ev.txt}</span>`);
  if(nightAttack){
    const col=nightAttack._blocked?'#7ee787':'#ff7b72';
    const suffix=nightAttack._blocked?' → <b>방어 성공!</b>':` → ❤️-${nightAttack.dmg}`;
    evLines.push(`<span style="color:${col}">${nightAttack.txt}${suffix}</span>`);
  }
  document.getElementById('dmoEvt').innerHTML=evLines.join('<br>');
  document.getElementById('dayModal').classList.add('show');
  let t=4; document.getElementById('dmoTimer').textContent=`${t}초 후 자동으로 닫힘`;
  if(dTimer)clearInterval(dTimer);
  dTimer=setInterval(()=>{
    t--; document.getElementById('dmoTimer').textContent=`${t}초 후 자동으로 닫힘`;
    if(t<=0)closeDayModal();
  },1000);
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

// ─── 종료 화면 ───────────────────────────────────────────────
function showEnd(win,msg){
  document.getElementById('endScreen').classList.add('show');
  document.getElementById('endTitle').textContent=win?'🎉 구조됨!':'💀 사망';
  document.getElementById('endTitle').style.color=win?'#3fb950':'#f85149';
  document.getElementById('endMsg').textContent=msg;
  const shelterInfo=G.shelter?` · 은신처 Lv.${G.shelterLv}`:'';
  document.getElementById('endStats').innerHTML=
    `생존: <b>${G.day}일</b> · 난이도: <b>${DCFG[diff].label}</b>${shelterInfo}<br>
     최종 체력: <b>${Math.round(G.hp)}</b> · 구조 진행도: <b>${Math.round(G.rescue)}%</b><br>
     보유 나무: <b>${G.inv.wood}</b> · 약초: <b>${G.inv.herb}</b> · 돌: <b>${G.inv.stone}</b>`;
}
