// ══════════════════════════════════════════════════════════════
//  무인도 생존기  script.js
// ══════════════════════════════════════════════════════════════

// ─── 난이도 ──────────────────────────────────────────────────
const DCFG = {
  easy:  {label:'🌴 쉬움',   foodDrain:8,  waterDrain:12, moveCost:0, moveTime:0},
  normal:{label:'⚠️ 보통',  foodDrain:12, waterDrain:18, moveCost:4, moveTime:4},
  hard:  {label:'💀 어려움', foodDrain:16, waterDrain:24, moveCost:6, moveTime:6},
};

// ─── 시간 (48칸 = 30분 단위) ─────────────────────────────────
const MAX_TIME = 48;
function slotToTime(s){ const h=Math.floor(s/2),m=s%2===0?'00':'30'; return `${String(h).padStart(2,'0')}:${m}`; }
function getPhase(s){
  if(s<12) return {label:'🌅 아침', cls:'t-morning',color:'#e3b341',night:false};
  if(s<24) return {label:'☀️ 오후', cls:'t-noon',   color:'#f0a050',night:false};
  if(s<36) return {label:'🌆 저녁', cls:'t-evening',color:'#bc8cff',night:false};
  return          {label:'🌙 심야', cls:'t-night',  color:'#58a6ff',night:true};
}

// ─── 장소 ────────────────────────────────────────────────────
const LOCS = {
  beach:   {icon:'🏖', name:'해변',       desc:'모래사장. 조개·유목 수거, SOS 신호 가능.'},
  forest:  {icon:'🌲', name:'숲',         desc:'울창한 나무. 식재료·약초·목재 채취 가능.'},
  river:   {icon:'🏞', name:'강',         desc:'맑은 계곡물. 음용수와 물고기를 얻을 수 있다.'},
  cave:    {icon:'🪨', name:'동굴',       desc:'서늘한 동굴. 휴식하거나 돌을 캘 수 있다.'},
  raft:    {icon:'🛶', name:'뗏목 작업장',desc:'뗏목을 만들거나 구조 신호를 보낼 수 있다.'},
  shelter: {icon:'🏕', name:'은신처',     desc:'보금자리. 행동·제작·요리를 선택할 수 있다.'},
};

// ─── 식재료 ──────────────────────────────────────────────────
const RAW_FOODS = {
  berry:    {icon:'🫐', name:'베리',   rawFood:8,  sickChance:0.05},
  mushroom: {icon:'🍄', name:'버섯',   rawFood:12, sickChance:0.15},
  shellfish:{icon:'🦪', name:'조개',   rawFood:10, sickChance:0.08},
  fish:     {icon:'🐟', name:'생선',   rawFood:20, sickChance:0.12},
  crab:     {icon:'🦀', name:'게',     rawFood:18, sickChance:0.06},
  coconut:  {icon:'🥥', name:'코코넛', rawFood:15, sickChance:0.02, water:10},
  egg:      {icon:'🥚', name:'알',     rawFood:14, sickChance:0.08},
};

// ─── 조리법 ──────────────────────────────────────────────────
const COOKING_METHODS = {
  grill:   {id:'grill',   icon:'🔥', name:'굽기',  time:6},
  boil:    {id:'boil',    icon:'💧', name:'삶기',  time:8},
  steam:   {id:'steam',   icon:'♨️', name:'찌기',  time:8},
  stirfry: {id:'stirfry', icon:'🍳', name:'볶기',  time:6},
};

// ─── 레시피 (숨겨진 조합, 발견 시 메모에 추가) ───────────────
// ingredients: 식재료 + stored_water 포함 가능, 정확히 일치해야 함
const RECIPES = [
  // ── 굽기 🔥 ──────────────────────────────────────────────
  {id:'grilled_fish',      icon:'🐟', name:'구운 생선',       ingredients:{fish:1},                            method:'grill', food:40, hp:5,  txt:'노릇노릇 구운 생선. 든든하다!'},
  {id:'grilled_crab',      icon:'🦀', name:'구운 게',         ingredients:{crab:1},                            method:'grill', food:35, hp:8,  txt:'껍질이 빨갛게 구워진 게. 달콤하다.'},
  {id:'grilled_shellfish', icon:'🦪', name:'구운 조개',       ingredients:{shellfish:2},                       method:'grill', food:28, hp:3,  txt:'불 향 가득한 구운 조개.'},
  {id:'grilled_egg',       icon:'🍳', name:'구운 계란',       ingredients:{egg:1},                             method:'grill', food:18, hp:4,  txt:'불 위에 직접 구운 계란.'},
  {id:'grilled_egg_herb',  icon:'🍳', name:'약초 계란구이',   ingredients:{egg:1,herb:1},                      method:'grill', food:22, hp:12, txt:'약초를 곁들인 계란구이. 향이 좋다.'},
  {id:'grilled_mush',      icon:'🍄', name:'구운 버섯',       ingredients:{mushroom:2},                        method:'grill', food:24, hp:5,  txt:'불 향 배인 구운 버섯. 고소하다.'},
  {id:'grilled_crab_herb', icon:'🦀', name:'허브 게구이',     ingredients:{crab:1,herb:1},                     method:'grill', food:42, hp:14, txt:'약초를 바른 게구이. 풍미가 깊다.'},
  {id:'grilled_coconut',   icon:'🥥', name:'구운 코코넛',     ingredients:{coconut:1},                         method:'grill', food:22, hp:3,  txt:'불에 구워 단맛이 진해진 코코넛.'},
  {id:'fish_berry_grill',  icon:'🐟', name:'베리 소스 생선',  ingredients:{fish:1,berry:2},                    method:'grill', food:50, hp:8,  txt:'베리 소스를 발라 구운 생선. 새콤달콤!'},

  // ── 삶기 💧 ──────────────────────────────────────────────
  {id:'boiled_egg',        icon:'🥚', name:'삶은 계란',       ingredients:{egg:1,stored_water:1},              method:'boil',  food:22, hp:6,  txt:'단백질이 풍부한 삶은 계란.'},
  {id:'boiled_egg2',       icon:'🥚', name:'계란 두 알 삶기', ingredients:{egg:2,stored_water:1},              method:'boil',  food:40, hp:10, txt:'든든한 삶은 계란 두 알.'},
  {id:'herb_tea',          icon:'🍵', name:'약초차',          ingredients:{herb:2,stored_water:1},              method:'boil',  food:5,  hp:20, txt:'쓴 약초차. 상처가 빠르게 낫는다.'},
  {id:'shellfish_soup',    icon:'🍜', name:'조개국',          ingredients:{shellfish:2,stored_water:1},         method:'boil',  food:30, hp:5,  txt:'시원한 조개국. 속이 풀린다.'},
  {id:'mush_soup',         icon:'🍄', name:'버섯국',          ingredients:{mushroom:2,stored_water:1},          method:'boil',  food:28, hp:6,  txt:'구수한 버섯국.'},
  {id:'coco_milk_soup',    icon:'🥥', name:'코코넛 밀크국',   ingredients:{coconut:1,stored_water:1},           method:'boil',  food:25, hp:8,  txt:'달콤한 코코넛 밀크를 끓였다.'},
  {id:'fish_stew',         icon:'🍲', name:'생선 스튜',       ingredients:{fish:2,mushroom:1,herb:1},           method:'boil',  food:60, hp:15, txt:'깊은 맛의 생선 스튜.'},
  {id:'coco_fish_soup',    icon:'🥥', name:'코코넛 생선국',   ingredients:{coconut:1,fish:1},                   method:'boil',  food:38, hp:10, txt:'달콤하고 고소한 코코넛 생선국.'},
  {id:'shellfish_egg_soup',icon:'🦪', name:'조개 계란국',     ingredients:{shellfish:1,egg:1,stored_water:1},   method:'boil',  food:38, hp:10, txt:'조개 육수에 계란을 풀었다. 고소하다.'},
  {id:'crab_soup',         icon:'🦀', name:'게장국',          ingredients:{crab:1,stored_water:1},              method:'boil',  food:32, hp:8,  txt:'진한 게 육수를 끓였다.'},
  {id:'herb_fish_soup',    icon:'🌿', name:'약초 생선탕',     ingredients:{fish:1,herb:2,stored_water:1},       method:'boil',  food:42, hp:22, txt:'약초와 생선을 함께 끓인 보양식.'},
  {id:'survival_stew',     icon:'🍛', name:'생존 스튜',       ingredients:{fish:1,crab:1,mushroom:1,berry:1},   method:'boil',  food:80, hp:25, txt:'온갖 재료를 넣은 풍성한 스튜! 최고의 식사!'},
  {id:'island_hotpot',     icon:'🫕', name:'무인도 전골',     ingredients:{fish:1,shellfish:2,mushroom:1,stored_water:1}, method:'boil', food:75, hp:20, txt:'섬에서 구한 모든 해산물로 끓인 전골.'},

  // ── 찌기 ♨️ ──────────────────────────────────────────────
  {id:'steamed_egg',       icon:'🥚', name:'계란찜',          ingredients:{egg:2,stored_water:1},               method:'steam', food:35, hp:8,  txt:'부드럽고 폭신한 계란찜.'},
  {id:'fish_steam',        icon:'🐟', name:'생선 찜',         ingredients:{fish:1,herb:1},                      method:'steam', food:38, hp:12, txt:'약초 향 생선 찜. 담백하다.'},
  {id:'crab_steam',        icon:'🦀', name:'게 찜',           ingredients:{crab:1},                             method:'steam', food:30, hp:6,  txt:'촉촉하게 쪄낸 게.'},
  {id:'coco_steam',        icon:'🥥', name:'코코넛 찜',       ingredients:{coconut:1},                          method:'steam', food:20, hp:5,  txt:'촉촉한 코코넛 찜.'},
  {id:'shellfish_steam',   icon:'🦪', name:'조개찜',          ingredients:{shellfish:3},                        method:'steam', food:36, hp:6,  txt:'입이 벌어진 조개찜. 싱싱하다.'},
  {id:'veggie_steam',      icon:'🌿', name:'약초 찜',         ingredients:{herb:3,mushroom:1},                  method:'steam', food:18, hp:25, txt:'약초와 버섯을 쪄냈다. 치유 효과가 높다.'},
  {id:'egg_crab_steam',    icon:'🥚', name:'게살 계란찜',     ingredients:{egg:2,crab:1,stored_water:1},        method:'steam', food:52, hp:14, txt:'게살을 넣은 고급 계란찜.'},

  // ── 볶기 🍳 ──────────────────────────────────────────────
  {id:'berry_jam',         icon:'🫐', name:'열매 잼',         ingredients:{berry:4},                            method:'stirfry', food:25, hp:0,  txt:'달콤한 열매를 졸였다.'},
  {id:'mushroom_stirfry',  icon:'🍄', name:'버섯볶음',        ingredients:{mushroom:2},                         method:'stirfry', food:30, hp:4,  txt:'고소한 버섯볶음.'},
  {id:'egg_stirfry',       icon:'🍳', name:'스크램블 에그',   ingredients:{egg:1},                              method:'stirfry', food:20, hp:5,  txt:'휘저어 볶은 계란. 부드럽다.'},
  {id:'fish_stirfry',      icon:'🐟', name:'생선볶음',        ingredients:{fish:1,mushroom:1},                  method:'stirfry', food:45, hp:8,  txt:'생선과 버섯을 함께 볶았다.'},
  {id:'berry_mush_stirfry',icon:'🫐', name:'베리 버섯볶음',   ingredients:{berry:2,mushroom:2},                 method:'stirfry', food:38, hp:8,  txt:'새콤달콤한 베리와 버섯의 조화.'},
  {id:'crab_stirfry',      icon:'🦀', name:'게볶음',          ingredients:{crab:1,mushroom:1},                  method:'stirfry', food:44, hp:10, txt:'게살과 버섯을 볶았다. 풍미가 좋다.'},
  {id:'island_mix',        icon:'🍱', name:'무인도 볶음밥',   ingredients:{egg:1,fish:1,shellfish:1,mushroom:1}, method:'stirfry', food:70, hp:15, txt:'있는 재료 다 넣고 볶았다. 의외로 맛있다!'},
];

// ─── 행동 목록 ───────────────────────────────────────────────
const ACTS = {
  beach:[
    {id:'shellfish', name:'조개 채집',   icon:'🦪', en:4,  time:2, gives:{shellfish:2}, txt:'조개를 주웠다.'},
    {id:'stick',     name:'유목 수거',   icon:'🪵', en:4,  time:2, gives:{wood:2},      txt:'해변에 밀려온 나무를 주웠다.'},
    {id:'sos',       name:'모래 SOS',    icon:'🆘', en:6,  time:4, gives:{rescue:3},    txt:'모래 위에 SOS를 크게 새겼다.'},
    {id:'log',       name:'통나무 수거', icon:'🌳', en:10, time:6, gives:{wood:5},      txt:'큰 통나무를 모았다.'},
    {id:'crabcatch', name:'게 잡기',     icon:'🦀', en:6,  time:4, gives:{crab:1},      txt:'갯바위에서 게를 잡았다.'},
  ],
  forest:[
    {id:'berry',   name:'열매 따기',   icon:'🫐', en:6,  time:2, gives:{berry:3},     txt:'숲에서 열매를 땄다.'},
    {id:'mush',    name:'버섯 채집',   icon:'🍄', en:6,  time:2, gives:{mushroom:2},  txt:'버섯을 채집했다. 독버섯 주의!'},
    {id:'herb',    name:'약초 채집',   icon:'🌿', en:6,  time:2, gives:{herb:2},      txt:'약초를 모았다.'},
    {id:'chop',    name:'나무 베기',   icon:'🪓', en:14, time:6, gives:{wood:6}, req:{axe:1}, txt:'도끼로 나무를 베었다.'},
    {id:'gather',  name:'가지 모으기', icon:'🪵', en:8,  time:4, gives:{wood:3},      txt:'마른 나뭇가지를 모았다.'},
    {id:'birdegg', name:'새알 채집',   icon:'🥚', en:8,  time:4, gives:{egg:2},       txt:'둥지에서 알을 발견했다.'},
  ],
  river:[
    {id:'drink', name:'물 마시기',   icon:'💧', en:2,  time:2, gives:{water:35},         txt:'차가운 물을 실컷 마셨다!'},
    {id:'fish',  name:'낚시',        icon:'🎣', en:10, time:6, gives:{fish:2}, req:{rod:1}, txt:'물고기를 낚았다!'},
    {id:'hfish', name:'맨손 낚시',   icon:'🐟', en:14, time:8, gives:{fish:1},             txt:'맨손으로 물고기를 잡았다.'},
    {id:'fillw', name:'물통 채우기', icon:'🫙', en:2,  time:2, gives:{stored_water:3}, req:{bottle:1}, txt:'물통에 물을 담았다.'},
  ],
  cave:[
    {id:'rest',  name:'휴식',   icon:'😴', en:0,  time:4,  gives:{energy:30,hp:6},  txt:'잠시 쉬었다.'},
    {id:'sleep', name:'수면',   icon:'🌙', en:0,  time:12, gives:{energy:70,hp:18}, nightOnly:true, txt:'충분히 잠들었다.'},
    {id:'stone', name:'돌 캐기',icon:'🪨', en:10, time:4,  gives:{stone:3},          txt:'동굴 벽에서 돌 3개를 캤다.'},
    {id:'med',   name:'명상',   icon:'🧘', en:4,  time:4,  gives:{hp:10},            txt:'마음을 가다듬으니 회복된다.'},
  ],
  raft:[
    {id:'build', name:'뗏목 조립', icon:'🛶', en:14, time:8, gives:{rescue:8},  req:{wood:5},  con:{wood:5},  txt:'뗏목을 조립했다!'},
    {id:'fire',  name:'봉화 신호', icon:'🔥', en:10, time:6, gives:{rescue:5},  req:{wood:3},  con:{wood:3},  txt:'봉화 신호를 보냈다!'},
    {id:'mir',   name:'거울 신호', icon:'🪞', en:6,  time:4, gives:{rescue:10}, req:{mirror:1},               txt:'거울로 신호를 보냈다!'},
    {id:'flag',  name:'깃발 달기', icon:'🚩', en:6,  time:4, gives:{rescue:4},  req:{cloth:2}, con:{cloth:2}, txt:'깃발을 달았다.'},
  ],
  shelter:[
    {id:'srest',    name:'휴식',          icon:'😴', en:0,  time:4,  gives:{energy:38,hp:8},   txt:'은신처에서 편안히 쉬었다.'},
    {id:'ssleep',   name:'수면',          icon:'🌙', en:0,  time:12, gives:{energy:85,hp:22},  nightOnly:true, txt:'은신처에서 깊이 잠들었다.'},
    {id:'upgrade',  name:'은신처 강화',   icon:'🔧', en:10, time:6,  gives:{shelterLv:1}, req:{wood:3,stone:2}, con:{wood:3,stone:2}, txt:'은신처를 보강했다.'},
    {id:'campfire', name:'모닥불 피우기', icon:'🔥', en:6,  time:4,  gives:{campfire:1}, req:{wood:2}, con:{wood:2}, txt:'모닥불을 피웠다.'},
  ],
};

// ─── 제작 ────────────────────────────────────────────────────
// basic:true = 은신처 건설 전에도 제작 가능
const CRAFTS = [
  {icon:'🪓',name:'돌도끼',    desc:'나무 베기',      req:{wood:3,stone:2}, res:{axe:1},     basic:true},
  {icon:'🏕',name:'기본 은신처',desc:'밤 안전 확보',  req:{wood:8,stone:3}, res:{shelter:1}, basic:true, oneTime:true},
  {icon:'🎣',name:'낚싯대',    desc:'낚시 가능',      req:{wood:2,herb:1},  res:{rod:1}},
  {icon:'🫙',name:'대나무통',  desc:'물 보관',        req:{wood:3},         res:{bottle:1}},
  {icon:'🩹',name:'붕대',      desc:'HP +25',         req:{herb:3},         res:{bandage:2}},
  {icon:'🧵',name:'천 조각',   desc:'깃발 재료',      req:{herb:4},         res:{cloth:2}},
  {icon:'🪞',name:'반짝 거울', desc:'거울 신호',      req:{stone:4},        res:{mirror:1}},
  {icon:'🪵',name:'울타리',    desc:'야생동물 방어↑', req:{wood:6},         res:{fence:1},   oneTime:true},
];

// ─── 아이템 ──────────────────────────────────────────────────
const ITEMS = {
  wood:{icon:'🪵',name:'나무'},    stone:{icon:'🪨',name:'돌'},     herb:{icon:'🌿',name:'약초'},
  bandage:{icon:'🩹',name:'붕대'}, axe:{icon:'🪓',name:'도끼'},     rod:{icon:'🎣',name:'낚싯대'},
  bottle:{icon:'🫙',name:'물통'},  cloth:{icon:'🧵',name:'천'},     mirror:{icon:'🪞',name:'거울'},
  stored_water:{icon:'💦',name:'물'},
  berry:{icon:'🫐',name:'베리'},   mushroom:{icon:'🍄',name:'버섯'}, shellfish:{icon:'🦪',name:'조개'},
  fish:{icon:'🐟',name:'생선'},    crab:{icon:'🦀',name:'게'},      coconut:{icon:'🥥',name:'코코넛'},
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

// ─── 야생동물 ────────────────────────────────────────────────
const NIGHT_ATTACKS = [
  {txt:'🐗 멧돼지가 야영지를 습격했다!',       dmg:25, fenceBlock:true},
  {txt:'🐺 늑대 무리가 으르렁거리며 다가온다!',dmg:30, fenceBlock:true},
  {txt:'🐻 곰이 냄새를 맡고 접근했다!',        dmg:35, fenceBlock:false},
  {txt:'🦟 독벌레 떼가 덮쳤다!',               dmg:15, fenceBlock:false},
];

// ─── 전역 상태 ───────────────────────────────────────────────
let G={}, diff='easy', selDiff='easy', logEntries=[], dTimer=null;
let shelterTab='act'; // 'act' | 'craft' | 'cook'
let cookSession=null; // 요리 세션

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
  const c=e.target.closest('.dcard'); if(!c) return;
  selDiff=c.dataset.d;
  document.querySelectorAll('.dcard').forEach(el=>el.classList.toggle('sel',el===c));
});

// ══════════════════════════════════════════════════════════════
//  게임 시작
// ══════════════════════════════════════════════════════════════
function startGame(){
  diff=selDiff;
  G={
    day:1, timeSlot:0,
    hp:100, satiety:70, water:70, energy:80, rescue:0,
    inv:{
      wood:0,stone:0,herb:0,bandage:0,axe:0,rod:0,bottle:0,cloth:0,mirror:0,stored_water:0,
      berry:0,mushroom:0,shellfish:0,fish:0,crab:0,coconut:0,egg:0,
    },
    loc:'beach', dead:false, won:false,
    shelter:false, shelterLv:0, fence:false, campfire:false,
    sick:false,
    discoveredRecipes:[],
  };
  shelterTab='act';
  cookSession=null;
  logEntries=[];
  document.getElementById('startScreen').classList.remove('show');
  document.getElementById('mainGame').style.display='block';
  document.getElementById('diffBadge').textContent=DCFG[diff].label;
  renderAll();
  addLog('🏝 섬에 표류했다. 살아남아야 한다...','lg-evt');
  addLog('식재료를 모아 은신처에서 요리하면 포만감·체력을 크게 회복할 수 있다.','lg-info');
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

let toastTimer=null;
function showToast(msg,type='info'){
  const el=document.getElementById('toast');
  el.textContent=msg; el.className='toast show toast-'+type;
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),3200);
}

// ══════════════════════════════════════════════════════════════
//  렌더 전체
// ══════════════════════════════════════════════════════════════
function renderAll(){
  if(cookSession) return; // 요리 모달 열린 동안 배경 렌더 스킵
  const ph=getPhase(G.timeSlot);
  document.getElementById('topDay').textContent=G.day+'일차';
  document.getElementById('topTime').textContent=`${ph.label} ${slotToTime(G.timeSlot)}`;
  document.getElementById('topTime').style.color=ph.color;
  document.getElementById('rightDay').textContent=G.day+'일차';
  const rtEl=document.getElementById('rightTime');
  rtEl.textContent=ph.label; rtEl.className='time-b '+ph.cls;
  renderChar(); renderStats(); renderInv();
  renderLocTabs(); renderLocInfo(); renderActions(); renderShelterPanel();
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
  if(G.sick) stTxt='🤢 식중독';
  const cols={healthy:'#3fb950',okay:'#e3b341',tired:'#f0883e',critical:'#f85149'};
  const c=cols[state];
  const smiles={healthy:'M33,30 Q50,43 67,30',okay:'M33,32 L67,32',tired:'M33,36 Q50,28 67,36',critical:'M28,38 Q50,24 72,38'};
  const eyeSz=state==='critical'?2:3, tired2=state==='tired'||state==='critical', eyeY=tired2?25:23;
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
  // 은신처 상태
  let sh='';
  if(G.shelter){
    const stars='★'.repeat(G.shelterLv)+'☆'.repeat(3-G.shelterLv);
    sh=`<div class="shelter-badge">🏕 은신처 ${stars}`;
    if(G.fence)    sh+=` <span class="fence-tag">🪵울타리</span>`;
    if(G.campfire) sh+=` <span class="fire-tag">🔥모닥불</span>`;
    sh+=`</div>`;
  }
  document.getElementById('charShelter').innerHTML=sh;
  // 아이템 사용 버튼
  const ca=document.getElementById('charActions'); ca.innerHTML='';
  if(G.inv.bandage>0&&!G.dead){
    const btn=document.createElement('button');
    btn.className='use-item-btn';
    btn.textContent=`🩹 붕대 사용 (🩹-1 / ❤️+25)`;
    btn.addEventListener('click',useBandage); ca.appendChild(btn);
  }
  Object.entries(RAW_FOODS).forEach(([k,rf])=>{
    if((G.inv[k]||0)<=0) return;
    const btn=document.createElement('button');
    btn.className='use-item-btn raw-eat';
    const sp=Math.round(rf.sickChance*100);
    btn.innerHTML=`${rf.icon} 날것으로 먹기 <span class="raw-cost">${rf.icon}-1 🍖+${rf.rawFood}${rf.water?` 💧+${rf.water}`:''} <span class="sick-warn">식중독${sp}%</span></span>`;
    btn.addEventListener('click',()=>eatRaw(k,rf)); ca.appendChild(btn);
  });
}

function useBandage(){
  if(G.inv.bandage<=0||G.dead||G.timeSlot>=MAX_TIME) return;
  G.inv.bandage--; G.hp=clamp(G.hp+25,0,100);
  advanceTime(2); addLog('🩹 붕대를 사용했다. 체력 +25','lg-good'); checkAndNextDay();
}
function eatRaw(key,rf){
  if((G.inv[key]||0)<=0||G.dead||G.timeSlot>=MAX_TIME) return;
  G.inv[key]--;
  G.satiety=clamp(G.satiety+rf.rawFood,0,100);
  if(rf.water) G.water=clamp(G.water+rf.water,0,100);
  advanceTime(1);
  addLog(`${rf.icon} ${rf.name}을(를) 날것으로 먹었다. 🍖+${rf.rawFood}`,'lg-info');
  if(Math.random()<rf.sickChance){
    G.sick=true; G.hp=clamp(G.hp-18,0,100);
    addLog('🤢 식중독에 걸렸다! 체력 -18','lg-bad');
    showToast('🤢 식중독! 체력 -18','bad');
  }
  checkAndNextDay();
}

// ─── 스탯 ────────────────────────────────────────────────────
function renderStats(){
  const stats=[
    {lb:'❤️ 체력',  v:G.hp,      style:'background:#3fb950'},
    {lb:'🍖 포만감',v:G.satiety, style:'background:#e3b341'},
    {lb:'💧 수분',  v:G.water,   style:'background:#58a6ff'},
    {lb:'⚡ 에너지',v:G.energy,  style:'background:#bc8cff'},
  ];
  const sickRow=G.sick?`<div class="sick-row">🤢 식중독 진행 중 (다음 날 자동 회복)</div>`:'';
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
    const n=G.inv[k]||0, isFood=k in RAW_FOODS;
    return `<div class="inv-slot${n>0?' filled':''}${isFood?' food-slot':''}">
      <span class="si">${it.icon}</span><span class="sc">${n}</span><span class="sn">${it.name}</span>
    </div>`;
  }).join('');
}

// ─── 위치 탭 ─────────────────────────────────────────────────
function renderLocTabs(){
  const cfg=DCFG[diff], ct=document.getElementById('locTabs'); ct.innerHTML='';
  Object.entries(LOCS).forEach(([k,l])=>{
    const isCur=k===G.loc, mt=timeCostMove();
    const notBuilt=k==='shelter'&&!G.shelter;
    const canMove=isCur||mt===0||(G.timeSlot+mt<=MAX_TIME&&G.energy>=cfg.moveCost);
    const btn=document.createElement('button');
    btn.className='tab'+(isCur?' cur':'')+(notBuilt?' unbuilt':'');
    btn.disabled=!canMove&&!isCur; // 미건설이어도 이동 자체는 허용
    let ch='';
    if(isCur) ch=`<span class="tcur">현재</span>`;
    else if(notBuilt) ch=`<span class="tc">🔨 미건설</span>`;
    else if(mt>0) ch=`<span class="tc">⚡${cfg.moveCost} ⏱${mt*30}분</span>`;
    btn.innerHTML=`<span class="ti">${l.icon}</span><span class="tn">${l.name}</span>${ch}`;
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
  const icons={water:'💧',energy:'⚡',hp:'❤️',rescue:'🆘',wood:'🪵',stone:'🪨',herb:'🌿',
               stored_water:'💦',shelterLv:'🏕',campfire:'🔥',berry:'🫐',mushroom:'🍄',
               shellfish:'🦪',fish:'🐟',crab:'🦀',coconut:'🥥',egg:'🥚'};
  return Object.entries(gives).filter(([k,v])=>v>0&&icons[k]).map(([k,v])=>`${icons[k]}+${v}`).join(' ');
}

// ─── 행동 렌더 ───────────────────────────────────────────────
function renderActions(){
  const ph=getPhase(G.timeSlot);
  document.getElementById('actStatus').innerHTML=
    `<span style="color:${ph.color}">${ph.label}</span> <span class="ts-clock">${slotToTime(G.timeSlot)}</span> &nbsp;|&nbsp; 남은 시간: <b>${(MAX_TIME-G.timeSlot)*30}분</b>`;

  // 은신처 탭 바 표시 여부
  const atShelter=G.loc==='shelter';
  const tabBar=document.getElementById('shelterTabBar');
  const actPanel=document.getElementById('actPanel');
  const craftPanel=document.getElementById('craftPanel');
  const cookPanel=document.getElementById('cookPanel');
  tabBar.style.display=atShelter?'block':'none';
  actPanel.style.display=(!atShelter||shelterTab==='act')?'block':'none';
  craftPanel.style.display=(atShelter&&shelterTab==='craft')?'block':'none';
  cookPanel.style.display=(atShelter&&shelterTab==='cook')?'block':'none';

  // 탭 버튼 상태 + 요리대 탭은 은신처 건설 후에만 표시
  tabBar.querySelectorAll('.stab').forEach(b=>{
    b.classList.toggle('stab-cur',b.dataset.tab===shelterTab);
    if(b.dataset.tab==='cook') b.style.display=G.shelter?'':'none';
  });

  const grid=document.getElementById('actGrid'); grid.innerHTML='';
  // 은신처 미건설 시 행동 안내
  if(G.loc==='shelter'&&!G.shelter){
    grid.innerHTML=`<div class="shelter-notice">
      🏕 은신처가 아직 없습니다.<br>
      <span>제작대 탭에서 <b>기본 은신처</b>를 건설하면<br>휴식·요리 기능이 해금됩니다.</span>
    </div>`;
    return;
  }
  ACTS[G.loc].forEach(a=>{
    const enoughE=G.energy>=(a.en||0);
    const hasReq=!a.req||Object.entries(a.req).every(([k,v])=>
      k==='shelterLv'?G.shelterLv>=v:(G.inv[k]||0)>=v);
    const notNightOnly=!a.nightOnly||isNight();
    const timeLeft=G.timeSlot+a.time<=MAX_TIME;
    if(a.id==='upgrade'&&G.shelterLv>=3){
      const btn=document.createElement('button'); btn.className='act-btn'; btn.disabled=true;
      btn.innerHTML=`<span class="ai">${a.icon}</span><span class="an">${a.name}</span><span class="ac">최대 레벨</span>`;
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
    if(a.nightOnly) costStr+=' | 🌙 심야전용';
    const preview=givesPreview(a.gives);
    let reqHtml='';
    if(a.req) reqHtml=`<span class="ar">필요: ${Object.entries(a.req).map(([k,v])=>ITEMS[k]?ITEMS[k].icon+v:k+v).join(' ')}</span>`;
    btn.innerHTML=`<span class="ai">${a.icon}</span><span class="an">${a.name}</span><span class="ac">${costStr}</span>${preview?`<span class="ag">${preview}</span>`:''}${reqHtml}`;
    btn.addEventListener('click',()=>doAct(a)); grid.appendChild(btn);
  });
  const nd=document.getElementById('ndBtn');
  nd.disabled=G.dead||G.won; nd.onclick=nextDay;
}

// ─── 은신처 탭 패널 ──────────────────────────────────────────
function renderShelterPanel(){
  if(G.loc!=='shelter') return;
  // 미건설 시 요리대 탭 숨김
  const cookTab=document.querySelector('.stab[data-tab="cook"]');
  if(cookTab) cookTab.style.display=G.shelter?'':'none';
  // 요리대 탭이 선택된 상태에서 은신처 건설 전이면 행동 탭으로 전환
  if(shelterTab==='cook'&&!G.shelter) switchShelterTab('act');
  if(shelterTab==='craft') renderCrafts();
  if(shelterTab==='cook')  renderCookPanel();
}

function switchShelterTab(tab){
  shelterTab=tab;
  document.querySelectorAll('.stab').forEach(b=>b.classList.toggle('stab-cur',b.dataset.tab===tab));
  const actPanel=document.getElementById('actPanel');
  const craftPanel=document.getElementById('craftPanel');
  const cookPanel=document.getElementById('cookPanel');
  actPanel.style.display=tab==='act'?'block':'none';
  craftPanel.style.display=tab==='craft'?'block':'none';
  cookPanel.style.display=tab==='cook'?'block':'none';
  renderShelterPanel();
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
    // 은신처 미건설 시 basic이 아닌 항목은 잠금
    const locked=!G.shelter&&!c.basic;
    if(locked){
      const btn=document.createElement('button'); btn.className='craft-btn craft-locked'; btn.disabled=true;
      btn.innerHTML=`<span class="cico">${c.icon}</span><span class="cn">${c.name}</span><span class="cr">🔒 은신처 건설 후 해금</span>`;
      grid.appendChild(btn); return;
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

// ─── 요리 패널 (인라인, 요리 시작 버튼만 표시) ───────────────
function renderCookPanel(){
  const el=document.getElementById('cookPanel');
  if(!G.campfire){
    el.innerHTML=`<div class="cook-campfire-notice">
      🔥 요리하려면 먼저 <b>모닥불을 피워야</b> 합니다.<br>
      <span style="font-size:11px;color:#8b949e">행동 탭 → 모닥불 피우기 (🪵나무 ×2)</span>
    </div>`;
    return;
  }
  el.innerHTML=`
    <div class="cook-start-wrap">
      <div class="cook-start-desc">모닥불이 피워져 있다. 보유한 식재료로 요리할 수 있다.</div>
      <button class="cook-open-btn" onclick="openCookModal()">🍳 요리 시작</button>
    </div>`;
}

// ══════════════════════════════════════════════════════════════
//  요리 모달 (재료선택 → 조리법선택 → 결과)
// ══════════════════════════════════════════════════════════════

function openCookModal(){
  if(G.dead||G.won||!G.campfire) return;
  cookSession={phase:'ingredient', selectedIngredients:{}, selectedMethod:null};
  document.getElementById('cookModal').classList.add('show');
  renderCookModalPhase();
}

function renderCookModalPhase(){
  const cs=cookSession;
  if(!cs) return;
  document.getElementById('cookModalBack').style.display=cs.phase==='method'?'inline-block':'none';
  document.getElementById('cookModalClose').style.display=cs.phase==='result'?'none':'inline-block';
  if(cs.phase==='ingredient') renderIngredientPhase();
  else if(cs.phase==='method') renderMethodPhase();
  else renderResultPhase();
}

// ─── Phase 1: 재료 선택 ──────────────────────────────────────
function renderIngredientPhase(){
  const cs=cookSession;
  document.getElementById('cookModalTitle').textContent='🍳 요리대 — 재료 선택';
  // 보유 식재료 버튼
  const foodKeys=[...Object.keys(RAW_FOODS),'stored_water'].filter(k=>(G.inv[k]||0)>0);
  const ingrGrid=foodKeys.map(k=>{
    const it=ITEMS[k], sel=(cs.selectedIngredients[k]||0);
    const inv=G.inv[k]||0;
    const full=sel>=inv;
    return `<button class="ingr-btn${sel>0?' selected':''}" onclick="toggleIngredient('${k}')" ${full&&sel>0?'':''}>
      ${sel>0?`<span class="ingr-selected-count">×${sel}</span>`:''}
      <span class="ib-icon">${it.icon}</span>
      <span class="ib-name">${it.name}</span>
      <span class="ib-qty">보유 ${inv}개</span>
    </button>`;
  }).join('');

  // 선택된 재료 요약 + 수량 조절
  const selEntries=Object.entries(cs.selectedIngredients).filter(([,v])=>v>0);
  const selHtml=selEntries.length===0
    ?`<span style="color:#8b949e44;font-size:12px">재료를 선택하세요</span>`
    :selEntries.map(([k,v])=>{
      const it=ITEMS[k];
      return `<span class="cook-sel-item">
        ${it.icon} ${it.name} ×${v}
        <button class="qty-btn" onclick="adjustIngredient('${k}',-1)">−</button>
        <button class="qty-btn" onclick="adjustIngredient('${k}',1)" ${v>=(G.inv[k]||0)?'disabled':''}>+</button>
      </span>`;
    }).join('');

  // 레시피 메모 (발견된 것만)
  const memoHtml=buildMemoHtml();

  const canNext=selEntries.length>0;
  document.getElementById('cookModalBody').innerHTML=`
    <div class="cook-phase-label">보유 식재료</div>
    ${foodKeys.length===0
      ?`<div style="color:#8b949e;font-size:12px;padding:12px 0;text-align:center">식재료가 없습니다.<br>숲·강·해변에서 채집하세요.</div>`
      :`<div class="cook-ingr-grid">${ingrGrid}</div>`}
    <div class="cook-phase-label" style="margin-top:8px">선택된 재료</div>
    <div class="cook-sel-wrap">${selHtml}</div>
    ${memoHtml}
    <button class="cook-confirm-btn" onclick="goToMethodPhase()" ${canNext?'':'disabled'}>
      다음: 조리법 선택 →
    </button>`;
}

function buildMemoHtml(){
  const found=G.discoveredRecipes;
  if(found.length===0){
    return `<div class="cook-memo">
      <div class="cook-memo-title">📖 발견한 레시피</div>
      <div class="cook-memo-empty">아직 발견된 레시피가 없습니다. 재료와 조리법을 조합해보세요!</div>
    </div>`;
  }
  const rows=found.map(id=>{
    const r=RECIPES.find(x=>x.id===id); if(!r) return '';
    const ingrStr=Object.entries(r.ingredients).map(([k,v])=>(ITEMS[k]?ITEMS[k].icon:k)+'×'+v).join(' ');
    const mIcon=COOKING_METHODS[r.method]?COOKING_METHODS[r.method].icon:'🔥';
    return `<div class="cook-memo-entry">${r.icon} <b>${r.name}</b> — ${ingrStr} + ${mIcon}${COOKING_METHODS[r.method]?.name||r.method}</div>`;
  }).join('');
  return `<div class="cook-memo">
    <div class="cook-memo-title">📖 발견한 레시피 (${found.length}/${RECIPES.length})</div>
    ${rows}
  </div>`;
}

function toggleIngredient(key){
  const cs=cookSession; if(!cs) return;
  const cur=cs.selectedIngredients[key]||0;
  if(cur>0){ cs.selectedIngredients[key]=0; }
  else {
    if((G.inv[key]||0)<=0) return;
    cs.selectedIngredients[key]=1;
  }
  renderIngredientPhase();
}

function adjustIngredient(key,delta){
  const cs=cookSession; if(!cs) return;
  const cur=cs.selectedIngredients[key]||0;
  const max=G.inv[key]||0;
  const next=clamp(cur+delta,0,max);
  cs.selectedIngredients[key]=next;
  renderIngredientPhase();
}

function goToMethodPhase(){
  const cs=cookSession; if(!cs) return;
  const sel=Object.entries(cs.selectedIngredients).filter(([,v])=>v>0);
  if(sel.length===0) return;
  cs.phase='method';
  renderCookModalPhase();
}

// ─── Phase 2: 조리법 선택 ────────────────────────────────────
function renderMethodPhase(){
  const cs=cookSession;
  document.getElementById('cookModalTitle').textContent='🍳 요리대 — 조리법 선택';
  // 선택된 재료 요약
  const selSummary=Object.entries(cs.selectedIngredients).filter(([,v])=>v>0)
    .map(([k,v])=>`${ITEMS[k].icon}${v}`).join(' ');

  const methodBtns=Object.values(COOKING_METHODS).map(m=>`
    <button class="method-btn${cs.selectedMethod===m.id?' selected':''}" onclick="selectMethod('${m.id}')">
      <span class="mb-icon">${m.icon}</span>
      ${m.name}
      <span class="mb-time">⏱ ${m.time*30}분</span>
    </button>`).join('');

  // 시간 체크
  const selMethod=cs.selectedMethod?COOKING_METHODS[cs.selectedMethod]:null;
  const timeOk=!selMethod||(G.timeSlot+selMethod.time<=MAX_TIME);
  const canCook=cs.selectedMethod&&timeOk;
  const warnHtml=selMethod&&!timeOk?`<div class="cook-time-warn">⚠️ 시간이 부족합니다 (필요: ${selMethod.time*30}분)</div>`:'';

  document.getElementById('cookModalBody').innerHTML=`
    <div class="cook-sel-recap">선택한 재료: ${selSummary}</div>
    <div class="cook-phase-label" style="margin-top:12px">조리법을 선택하세요</div>
    <div class="cook-method-grid">${methodBtns}</div>
    ${warnHtml}
    <button class="cook-confirm-btn" onclick="resolveCooking()" ${canCook?'':'disabled'}>
      🍳 요리 시작!
    </button>`;
}

function selectMethod(id){
  cookSession.selectedMethod=id;
  renderMethodPhase();
}

function cookGoBack(){
  cookSession.phase='ingredient';
  cookSession.selectedMethod=null;
  renderCookModalPhase();
}

// ─── 요리 결과 처리 ──────────────────────────────────────────
function resolveCooking(){
  const cs=cookSession; if(!cs) return;
  const method=COOKING_METHODS[cs.selectedMethod];
  if(!method) return;
  if(G.timeSlot+method.time>MAX_TIME){
    showToast('⚠️ 시간이 부족합니다!','bad'); return;
  }
  // 재료 유효성 재확인
  const sel=Object.entries(cs.selectedIngredients).filter(([,v])=>v>0);
  for(const [k,v] of sel){
    if((G.inv[k]||0)<v){ showToast('재료가 부족합니다!','bad'); closeCookModal(); return; }
  }
  // 재료 소비
  sel.forEach(([k,v])=>{ G.inv[k]=Math.max(0,(G.inv[k]||0)-v); });
  advanceTime(method.time);

  // 레시피 매칭
  const matched=matchRecipe(cs.selectedIngredients,cs.selectedMethod);
  if(matched){
    const isNew=!G.discoveredRecipes.includes(matched.id);
    if(isNew) G.discoveredRecipes.push(matched.id);
    G.satiety=clamp(G.satiety+matched.food,0,100);
    if(matched.hp) G.hp=clamp(G.hp+matched.hp,0,100);
    cs.phase='result';
    cs.result={success:true, recipe:matched, isNew};
    if(isNew){ addLog(`📖 새 레시피 발견: ${matched.icon} ${matched.name}!`,'lg-evt'); }
    addLog(`${matched.icon} ${matched.name} 완성! 🍖+${matched.food}${matched.hp?` ❤️+${matched.hp}`:''}`, 'lg-good');
  } else {
    // 실패: 재료 rawFood 합산 × 0.4
    let failFood=0;
    sel.forEach(([k,v])=>{ if(RAW_FOODS[k]) failFood+=RAW_FOODS[k].rawFood*v; });
    failFood=Math.round(failFood*0.4);
    G.satiety=clamp(G.satiety+failFood,0,100);
    cs.phase='result';
    cs.result={success:false, food:failFood};
    addLog(`🍚 실패한 요리... 🍖+${failFood}(재료 40%)`, 'lg-info');
  }
  renderCookModalPhase();
}

function matchRecipe(selectedIngredients,selectedMethod){
  return RECIPES.find(r=>{
    if(r.method!==selectedMethod) return false;
    const rKeys=Object.keys(r.ingredients);
    const sKeys=Object.keys(selectedIngredients).filter(k=>selectedIngredients[k]>0);
    if(rKeys.length!==sKeys.length) return false;
    return rKeys.every(k=>selectedIngredients[k]===r.ingredients[k]);
  });
}

// ─── Phase 3: 결과 ───────────────────────────────────────────
function renderResultPhase(){
  const cs=cookSession;
  document.getElementById('cookModalTitle').textContent='🍳 요리 결과';
  document.getElementById('cookModalBack').style.display='none';
  let html='';
  if(cs.result.success){
    const r=cs.result.recipe;
    html=`<div class="cook-result-box">
      <span class="cook-result-icon">${r.icon}</span>
      <div class="cook-result-name">${r.name}</div>
      ${cs.result.isNew?`<div class="cook-result-new-badge">✨ 첫 발견! 레시피 메모에 추가됨</div>`:''}
      <div class="cook-result-stats">🍖 +${r.food}${r.hp?` &nbsp; ❤️ +${r.hp}`:''}</div>
      <div style="font-size:11px;color:#8b949e;margin-top:6px">${r.txt}</div>
    </div>`;
    if(cs.result.isNew) showToast(`✨ 새 레시피 발견: ${r.name}!`,'good');
  } else {
    html=`<div class="cook-result-box">
      <span class="cook-result-icon">🍚</span>
      <div class="cook-result-name cook-result-fail">실패한 요리...</div>
      <div class="cook-result-stats" style="color:#f0a050">🍖 +${cs.result.food}</div>
      <div class="cook-result-fail-sub">재료 기본 효율의 40%. 레시피를 찾아보세요.</div>
    </div>`;
  }
  html+=`<button class="cook-confirm-btn" onclick="closeCookModal()">확인</button>`;
  document.getElementById('cookModalBody').innerHTML=html;
}

function closeCookModal(){
  document.getElementById('cookModal').classList.remove('show');
  cookSession=null;
  renderAll(); checkWL();
}

// ══════════════════════════════════════════════════════════════
//  우측 패널
// ══════════════════════════════════════════════════════════════
function renderRight(){
  const phaseColors=['#e3b341','#f0a050','#bc8cff','#58a6ff'];
  let pips='';
  for(let i=0;i<MAX_TIME;i++){
    const used=i<G.timeSlot, cur=i===G.timeSlot, phIdx=Math.floor(i/12), col=phaseColors[phIdx];
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
  logEntries.unshift({m,c}); if(logEntries.length>60) logEntries.pop(); renderLog();
}

// ══════════════════════════════════════════════════════════════
//  이동 / 행동 / 제작
// ══════════════════════════════════════════════════════════════
function changeLocation(loc){
  if(loc===G.loc||G.dead||G.won) return;
  if(loc!=='shelter') shelterTab='act';
  else if(!G.shelter) shelterTab='craft'; // 미건설 시 제작대 탭으로 자동 전환
  const cfg=DCFG[diff], mt=timeCostMove();
  if(mt>0){
    if(G.timeSlot+mt>MAX_TIME||G.energy<cfg.moveCost) return;
    G.energy=Math.max(0,G.energy-cfg.moveCost);
    advanceTime(mt);
    addLog(`${LOCS[loc].icon} ${LOCS[loc].name}(으)로 이동 ⚡-${cfg.moveCost} ⏱-${mt*30}분`,'lg-info');
  } else {
    addLog(`${LOCS[loc].icon} ${LOCS[loc].name}(으)로 이동했다.`,'lg-info');
  }
  G.loc=loc; checkAndNextDay();
}

function doAct(a){
  if(G.dead||G.won) return;
  G.energy=Math.max(0,G.energy-(a.en||0));
  if(a.gives.water)   G.water  =clamp(G.water  +(a.gives.water||0),  0,100);
  if(a.gives.energy)  G.energy =clamp(G.energy +(a.gives.energy||0), 0,100);
  if(a.gives.hp)      G.hp     =clamp(G.hp     +(a.gives.hp||0),     0,100);
  if(a.gives.rescue)  G.rescue =clamp(G.rescue +(a.gives.rescue||0), 0,100);
  if(a.gives.wood)    G.inv.wood    +=(a.gives.wood||0);
  if(a.gives.stone)   G.inv.stone   +=(a.gives.stone||0);
  if(a.gives.herb)    G.inv.herb    +=(a.gives.herb||0);
  if(a.gives.stored_water) G.inv.stored_water+=(a.gives.stored_water||0);
  if(a.gives.shelterLv)    G.shelterLv=Math.min(3,G.shelterLv+(a.gives.shelterLv||0));
  if(a.gives.campfire)     G.campfire=true;
  ['berry','mushroom','shellfish','fish','crab','coconut','egg'].forEach(k=>{
    if(a.gives[k]) G.inv[k]=(G.inv[k]||0)+a.gives[k];
  });
  if(a.con) Object.entries(a.con).forEach(([k,v])=>{ G.inv[k]=Math.max(0,(G.inv[k]||0)-v); });
  advanceTime(a.time);
  addLog(a.txt, a.gives.rescue>4||a.gives.hp>0||a.gives.energy>0?'lg-good':'lg-info');
  checkAndNextDay();
}

function doCraft(c){
  if(!Object.entries(c.req).every(([k,v])=>(G.inv[k]||0)>=v)) return;
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
  if(G.dead||G.won) return;
  // 요리 중이면 강제 종료
  if(cookSession){ cookSession=null; document.getElementById('cookModal').classList.remove('show'); }
  const cfg=DCFG[diff];
  const psat=G.satiety, pw=G.water, pe=G.energy, ph=G.hp;
  G.day++; G.timeSlot=0; G.campfire=false;
  G.satiety=Math.max(0,G.satiety-cfg.foodDrain);
  G.water  =Math.max(0,G.water  -cfg.waterDrain);
  const shelterBonus=G.shelter?G.shelterLv*5:0;
  G.energy=clamp(G.energy+35+shelterBonus,0,100);
  if(G.inv.stored_water>0){ G.water=clamp(G.water+G.inv.stored_water*10,0,100); G.inv.stored_water=0; }
  if(G.satiety<=0) G.hp=Math.max(0,G.hp-15);
  if(G.water<=0)   G.hp=Math.max(0,G.hp-20);
  if(G.sick){ G.hp=Math.max(0,G.hp-10); G.sick=false; addLog('🤢 식중독이 회복됐다.','lg-info'); }
  let decay=false;
  if(G.rescue>0&&Math.random()<(diff==='hard'?0.15:0.08)){ G.rescue=Math.max(0,G.rescue-10); decay=true; }
  let ev=null;
  if(Math.random()<(diff==='easy'?0.3:diff==='normal'?0.4:0.5)){
    ev=EVENTS[Math.floor(Math.random()*EVENTS.length)]; applyEvent(ev);
  }
  let na=null;
  const naChance=diff==='easy'?0.2:diff==='normal'?0.35:0.5;
  if(Math.random()<naChance){
    na=NIGHT_ATTACKS[Math.floor(Math.random()*NIGHT_ATTACKS.length)];
    const blocked=(na.fenceBlock&&G.fence)||G.campfire;
    if(!blocked){ G.hp=Math.max(0,G.hp-na.dmg); }
    na._blocked=blocked;
  }
  const satD=Math.round(G.satiety-psat), wD=Math.round(G.water-pw);
  const eD=Math.round(G.energy-pe), hD=Math.round(G.hp-ph);
  showDayModal(G.day,satD,wD,eD,hD,ev,decay,na);
  addLog(`📅 ${G.day}일차가 시작됐다.`,'lg-day');
  if(ev)    addLog(ev.txt,ev.t==='bad'?'lg-bad':'lg-good');
  if(decay) addLog('🌧 악천후로 구조 신호가 손상됐다!','lg-bad');
  if(na){
    if(na._blocked) addLog(`${na.txt} → 방어 성공!`,'lg-good');
    else { addLog(`${na.txt} ❤️-${na.dmg}`,'lg-bad'); showToast(`${na.txt} ❤️-${na.dmg}`,'bad'); }
  }
}

function applyEvent(ev){
  Object.entries(ev.e).forEach(([k,v])=>{
    if(k==='rescue')    G.rescue  =clamp(G.rescue+v,0,100);
    else if(k==='hp')   G.hp      =clamp(G.hp+v,0,100);
    else if(k==='water')G.water   =clamp(G.water+v,0,100);
    else if(k==='energy')G.energy =clamp(G.energy+v,0,100);
    else if(k==='coconut_ev') G.inv.coconut=(G.inv.coconut||0)+v;
    else if(k==='berry_ev'){
      const lose=Math.min(G.inv.berry||0,Math.abs(v));
      G.inv.berry=Math.max(0,(G.inv.berry||0)-lose);
    }
    else if(k==='food') G.satiety=clamp(G.satiety+v,0,100);
  });
}

// ─── 하루 모달 ───────────────────────────────────────────────
function showDayModal(day,satD,wD,eD,hD,ev,decay,na){
  document.getElementById('dmoDay').textContent=day+'일차';
  function ch(ico,lb,v){
    const cls=v>0?'pos':v<0?'neg':'neu';
    return `<div class="dmo-ch ${cls}"><span class="ci">${ico}</span><span class="cv">${(v>0?'+':'')+v}</span><span class="cl">${lb}</span></div>`;
  }
  document.getElementById('dmoChanges').innerHTML=ch('❤️','체력',hD)+ch('🍖','포만감',satD)+ch('💧','수분',wD)+ch('⚡','에너지',eD);
  let evLines=[];
  if(!ev&&!decay&&!na) evLines.push(`<span style="color:#8b949e">특별한 이벤트 없이 밤이 지나갔다.</span>`);
  if(decay) evLines.push(`<span style="color:#ff7b72">🌧 악천후로 구조 신호 일부가 손상됐다.</span>`);
  if(ev)    evLines.push(`<span style="color:${ev.t==='bad'?'#ff7b72':'#7ee787'}">${ev.txt}</span>`);
  if(na){
    const col=na._blocked?'#7ee787':'#ff7b72';
    const suf=na._blocked?' → <b>방어 성공!</b>':` → ❤️-${na.dmg}`;
    evLines.push(`<span style="color:${col}">${na.txt}${suf}</span>`);
  }
  document.getElementById('dmoEvt').innerHTML=evLines.join('<br>');
  document.getElementById('dayModal').classList.add('show');
  let t=5; document.getElementById('dmoTimer').textContent=`${t}초 후 자동으로 닫힘`;
  if(dTimer) clearInterval(dTimer);
  dTimer=setInterval(()=>{ t--; document.getElementById('dmoTimer').textContent=`${t}초 후 자동으로 닫힘`; if(t<=0)closeDayModal(); },1000);
}

function closeDayModal(){
  if(dTimer){clearInterval(dTimer);dTimer=null;}
  document.getElementById('dayModal').classList.remove('show');
  renderAll(); checkWL();
}

// ─── 승패 ────────────────────────────────────────────────────
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
  const rc=G.discoveredRecipes.length>0?` · 레시피 ${G.discoveredRecipes.length}개 발견`:'';
  document.getElementById('endStats').innerHTML=
    `생존: <b>${G.day}일</b> · 난이도: <b>${DCFG[diff].label}</b>${si}${rc}<br>
     최종 체력: <b>${Math.round(G.hp)}</b> · 구조 진행도: <b>${Math.round(G.rescue)}%</b><br>
     보유 나무: <b>${G.inv.wood}</b> · 약초: <b>${G.inv.herb}</b> · 돌: <b>${G.inv.stone}</b>`;
}
