const PRODUCTS = window.PRODUCTS || [];const PAGE_SIZE=48;let filtered=[],page=1,view=localStorage.getItem('cabeusView')||'grid',currentSection='',currentSubsection='';let cart={};try{cart=JSON.parse(localStorage.getItem('cabeusCartFull')||'{}')||{}}catch(e){cart={}}const rub=new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0});function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}function uniq(k){return[...new Set(PRODUCTS.map(p=>p[k]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ru',{numeric:true}))}function fillSelect(id,arr){const el=document.getElementById(id);arr.forEach(v=>el.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`))}
function nearestField(id){const el=document.getElementById(id);return el?el.closest('.field'):null}
function setFieldVisible(id,visible){const f=nearestField(id);if(f)f.classList.toggle('hidden-filter',!visible)}
function scopedProducts(){const s=(document.getElementById('sectionFilter')?.value||currentSection||'');const sub=(document.getElementById('subFilter')?.value||currentSubsection||'');return PRODUCTS.filter(p=>(!s||p.section===s)&&(!sub||p.subsection===sub))}
function fillSelectDynamic(id,values,placeholder){const el=document.getElementById(id);if(!el)return;const oldVal=el.value;el.innerHTML=`<option value="">${placeholder}</option>`;values.forEach(v=>el.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));el.value=values.includes(oldVal)?oldVal:''}
function uniqFrom(list,k){return [...new Set(list.map(p=>p[k]).filter(v=>v!==''&&v!=null))].sort((a,b)=>String(a).localeCompare(String(b),'ru',{numeric:true}))}
function hasAny(list,keys){return list.some(p=>keys.some(k=>p[k]!==''&&p[k]!=null&&p[k]!==0))}
function isCabinetScope(list){const txt=list.slice(0,60).map(p=>(p.section+' '+p.subsection+' '+p.name).toLowerCase()).join(' ');return /шкаф|стойк|rack|настенн|напольн/.test(txt)}
function isCopperScope(list){const txt=list.slice(0,60).map(p=>(p.section+' '+p.subsection+' '+p.name).toLowerCase()).join(' ');return /витая|патч-корд|патч корд|patch|cat\.?|utp|ftp|медн|кабель/.test(txt) && !/оптик|fiber|волокон/.test(txt)}
function updateDynamicFilters(){const list=scopedProducts();
  fillSelectDynamic('typeFilter',uniqFrom(list,'type'),'Любой тип');
  fillSelectDynamic('warrantyFilter',uniqFrom(list,'warranty'),'Любая');
  fillSelectDynamic('uFilter',uniqFrom(list,'u'),'U');
  fillSelectDynamic('portsFilter',uniqFrom(list,'ports'),'Порты');
  fillSelectDynamic('catFilter',uniqFrom(list,'cat'),'Cat');
  fillSelectDynamic('colorFilter',uniqFrom(list,'color'),'Цвет');
  fillSelectDynamic('depthFilter',uniqFrom(list,'depth'),'Глубина');
  fillSelectDynamic('widthFilter',uniqFrom(list,'width'),'Ширина');
  fillSelectDynamic('doorFilter',uniqFrom(list,'door'),'Тип двери');
  const hasType=hasAny(list,['type']);
  const hasWarranty=hasAny(list,['warranty']);
  const showUPorts=hasAny(list,['u','ports']) && !/оптик/i.test((currentSection+' '+currentSubsection));
  const showCable=hasAny(list,['cat','shield']) && isCopperScope(list);
  const showCabinet=(hasAny(list,['depth','width','door'])||isCabinetScope(list));
  const hasColor=hasAny(list,['color']);
  setFieldVisible('typeFilter',hasType);
  setFieldVisible('warrantyFilter',hasWarranty);
  setFieldVisible('uFilter',showUPorts);
  setFieldVisible('catFilter',showCable);
  setFieldVisible('colorFilter',showCabinet||hasColor);
}
function onSubsectionChange(){currentSubsection=subFilter.value;updateDynamicFilters();applyFilters()}
function init(){fillSelect('sectionFilter',uniq('section'));fillSelect('typeFilter',uniq('type'));fillSelect('warrantyFilter',uniq('warranty'));fillSelect('uFilter',uniq('u'));fillSelect('portsFilter',uniq('ports'));fillSelect('catFilter',uniq('cat'));fillSelect('colorFilter',uniq('color'));fillSelect('depthFilter',uniq('depth'));fillSelect('widthFilter',uniq('width'));fillSelect('doorFilter',uniq('door'));statProducts.textContent=PRODUCTS.length.toLocaleString('ru-RU');statSections.textContent=uniq('section').length;statStock.textContent=PRODUCTS.filter(p=>p.qty>0).length.toLocaleString('ru-RU');statTransit.textContent=PRODUCTS.filter(p=>p.transit>0).length.toLocaleString('ru-RU');renderCategoryTree();setView(view);updateCartCount();showHome();updateDynamicFilters()}function onSectionChange(){const s=sectionFilter.value;currentSection=s;currentSubsection='';subFilter.innerHTML='<option value="">Все подразделы</option>';[...new Set(PRODUCTS.filter(p=>!s||p.section===s).map(p=>p.subsection).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru')).forEach(v=>subFilter.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));updateDynamicFilters();applyFilters()}function renderCategoryTree(){
  const groups={};
  PRODUCTS.forEach(p=>{const sec=p.section||'Без категории';const sub=p.subsection||'Без подраздела';groups[sec]=groups[sec]||{count:0,subs:{}};groups[sec].count++;groups[sec].subs[sub]=(groups[sec].subs[sub]||0)+1});
  const html=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([sec,data])=>`<div class="cat-section"><button class="cat-title" type="button" onclick="toggleCatSection(this)"><span>${esc(sec)}</span><small>${data.count}</small></button><div class="sub-list"><button type="button" onclick="chooseCatalog('${esc(sec)}','')">Все товары раздела · ${data.count}</button>${Object.entries(data.subs).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([sub,c])=>`<button type="button" onclick="chooseCatalog('${esc(sec)}','${esc(sub)}')">${esc(sub)} · ${c}</button>`).join('')}</div></div>`).join('');
  ['categoryTree','categoryTreeDrawer'].forEach(id=>{const root=document.getElementById(id);if(root)root.innerHTML=html});
}
function openCatalogDrawer(){document.getElementById('catalogDrawer')?.classList.add('open')}
function closeCatalogDrawer(){document.getElementById('catalogDrawer')?.classList.remove('open')}
function showHome(){currentSection='';currentSubsection='';filtered=[];document.getElementById('homeLanding')?.classList.remove('hidden');document.getElementById('shopPage')?.classList.add('hidden');products.innerHTML='';pager.innerHTML='';resultCount.textContent='0'}
function toggleCatalogPanel(){const box=document.getElementById('catalogMenu');if(!box)return;box.classList.toggle('collapsed');const btn=document.getElementById('catalogToggle');if(btn)btn.textContent=box.classList.contains('collapsed')?'Разделы':'Свернуть'}function toggleCatSection(btn){const row=btn.closest('.cat-section');if(row)row.classList.toggle('open')}function chooseCatalog(sec,sub){
  const targetSub=sub||'';
  currentSection=sec||''; currentSubsection=targetSub;
  closeCatalogDrawer();
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
  sectionFilter.value=currentSection;
  onSectionChange();
  currentSubsection=targetSub;
  subFilter.value=currentSubsection;
  updateDynamicFilters();
  const title=document.getElementById('categoryTitle');
  if(title) title.textContent=currentSubsection?`${currentSection} / ${currentSubsection}`:currentSection;
  applyFilters();
  document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
}

/* === Search page mode patch === */
function setSearchMode(){
  document.body.classList.remove('home-mode');
  document.body.classList.add('search-mode');
  const shop=document.getElementById('shopPage');
  if(shop) shop.classList.remove('hidden');
  document.getElementById('homeLanding')?.classList.add('hidden');
}
function clearSearchMode(){
  document.body.classList.remove('search-mode');
}
function searchHeaderHtml(title){
  return `<div class="search-page-header"><div><div class="search-title-label">Результаты поиска</div><div>${esc(title)}</div></div><button class="search-back-btn" onclick="goHome()">← На главную</button></div>`;
}

function runHomeSearch(){
  const v=(document.getElementById('homeSearch')?.value||'').trim();
  closeCatalogDrawer();
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
  currentSection=''; currentSubsection='';
  if(sectionFilter) sectionFilter.value='';
  if(subFilter) subFilter.value='';
  onSectionChange();
  const searchEl=document.getElementById('search');
  if(searchEl) searchEl.value=v;
  const title=document.getElementById('categoryTitle');
  if(title) title.textContent=v ? 'Поиск: '+v : 'Все разделы';
  applyFilters();
  document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
}
function rawNorm(v){return String(v??'').toLowerCase().replace(/ё/g,'е').replace(/,/g,'.').replace(/["'«»()\[\];:/\\|+_]+/g,' ').replace(/-/g,' ').replace(/\s+/g,' ').trim()}function normText(v){return rawNorm(v).replace(/\.(?!\d)/g,' ').replace(/(?<!\d)\./g,' ').replace(/\s+/g,' ').trim()}function searchTokens(q){const src=rawNorm(q);return (src.match(/\d+(?:\.\d+)?|[a-zа-я]+\d*|\d+[a-zа-я]+/gi)||[]).map(x=>x.toLowerCase()).filter(Boolean)}function productSearchText(p){return normText([p.name,p.article,p.code,p.type,p.section,p.subsection,p.producer,p.u&&p.u+'u',p.u&&p.u+' u',p.u&&p.u+'ю',p.u&&p.u+' юнит',p.ports&&p.ports+'порт',p.ports&&p.ports+' портов',p.cat&&'cat'+p.cat,p.cat&&'кат'+p.cat,p.shield,p.color,p.depth&&p.depth+' глубина',p.width&&p.width+' ширина',p.door].filter(Boolean).join(' '))}function fieldContainsExactDecimal(p,t){const re=new RegExp('(^|[^0-9])'+t.replace('.','\\.')+'\\s*(m|м|метр|метра|метров)?([^0-9]|$)','i');return re.test([p.name,p.article,p.code].join(' '))}function tokenMatch(text,p,t){const synonyms={шкаф:['шкаф','шкафы','настенный','телекоммуникационный','rack','рэковый'],стойка:['стойка','стойки','rack'],кабель:['кабель','cable','провод'],патч:['патч','patch','панель','панели'],корд:['корд','cord'],розетка:['розетка','розетки'],черный:['черный','чёрный','black','bk'],синий:['синий','blue','bl'],белый:['белый','white','wh'],серый:['серый','gray','grey'],стекло:['стекло','glass'],металл:['металл','metal']};if(/^\d+\.\d+$/.test(t))return fieldContainsExactDecimal(p,t);if(synonyms[t])return synonyms[t].some(x=>text.includes(x));if(/^\d+$/.test(t)){if(p.u===t||p.ports===t||p.depth===t||p.width===t)return true;const re=new RegExp('(^|\\s)'+t+'(u|ю|порт|портов|м|m)?(\\s|$)','i');return re.test(text)}if(/^cat\d+$/i.test(t)){return text.includes(t)||text.includes(t.replace('cat','кат'))}return text.includes(t)}function matchesSmartSearch(p,q){const tokens=searchTokens(q);if(!tokens.length)return true;const text=productSearchText(p);return tokens.every(t=>tokenMatch(text,p,t))}function activeFilterCount(){let n=0;['sectionFilter','subFilter','typeFilter','stockFilter','minPrice','maxPrice','warrantyFilter','uFilter','portsFilter','catFilter','shieldFilter','colorFilter','depthFilter'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value)n++});return n}function updateFilterSummary(){const el=document.getElementById('filterSummary');if(!el)return;const n=activeFilterCount();el.textContent=n?`Активно: ${n}`:'Компактный режим'}function applyFilters(){updateDynamicFilters();const q=search.value.trim(),s=sectionFilter.value||currentSection,sub=subFilter.value||currentSubsection,t=typeFilter.value,st=stockFilter.value,min=+minPrice.value||0,max=+maxPrice.value||Infinity,w=warrantyFilter.value,u=uFilter.value,ports=portsFilter.value,cat=catFilter.value,sh=shieldFilter.value,color=colorFilter.value,depth=depthFilter.value;filtered=PRODUCTS.filter(p=>matchesSmartSearch(p,q)&&(!s||p.section===s)&&(!sub||p.subsection===sub)&&(!t||p.type===t)&&(!w||p.warranty===w)&&(!u||p.u===u)&&(!ports||p.ports===ports)&&(!cat||p.cat===cat)&&(!sh||p.shield===sh)&&(!color||p.color===color)&&(!depth||p.depth===depth)&&p.price>=min&&p.price<=max&&(!st||(st==='stock'?p.qty>0:st==='transit'?(p.qty>0||p.transit>0):p.qty===0&&p.transit===0)));page=1;updateFilterSummary();render()}function clearFilters(){document.querySelectorAll('.filters input,.filters select').forEach(el=>el.value='');sectionFilter.value=currentSection||'';onSectionChange();subFilter.value=currentSubsection||'';updateFilterSummary();applyFilters()}function toggleFilterPanel(){const box=document.getElementById('filtersBox');if(!box)return;box.classList.toggle('collapsed');const collapsed=box.classList.contains('collapsed');const btn=document.getElementById('filterToggle');if(btn)btn.textContent=collapsed?'Развернуть':'Свернуть'}function setView(v){view=v==='list'?'list':'grid';localStorage.setItem('cabeusView',view);const container=document.getElementById('products');if(container){container.classList.remove('grid','list');container.classList.add(view)}const gb=document.getElementById('gridBtn'),lb=document.getElementById('listBtn');if(gb)gb.classList.toggle('active',view==='grid');if(lb)lb.classList.toggle('active',view==='list');if(document.readyState!=='loading'&&typeof render==='function')render()}function stockTag(p){
  const unit=esc(p.unit||'шт.');
  const transitQty=Number(p.transit||0);
  const transitDate=p.nearTransit?esc(p.nearTransit):'';
  if(Number(p.qty||0)>0){
    return `<span class="tag ok">В наличии: ${p.qty} ${unit}</span>`;
  }
  if(transitQty>0){
    return `<span class="tag">Нет в наличии</span><span class="tag warn">Транзит: ${transitQty} ${unit}</span>${transitDate?`<span class="tag warn">Дата: ${transitDate}</span>`:''}`;
  }
  return `<span class="tag">Нет в наличии</span>`;
}
function availabilitySpecs(p){
  const unit=p.unit||'шт.';
  const rows=[];
  if(Number(p.qty||0)>0){
    rows.push(['Наличие', `В наличии: ${p.qty} ${unit}`]);
  }else{
    rows.push(['Наличие', 'Нет в наличии']);
    if(Number(p.transit||0)>0) rows.push(['Транзит', `${p.transit} ${unit}`]);
    if(p.nearTransit) rows.push(['Дата транзита', p.nearTransit]);
  }
  return rows;
}
function cleanSpecs(p){
  const rows=[
    ['Артикул',p.article],['Код',p.code],['Раздел',p.section],['Подраздел',p.subsection],
    ...availabilitySpecs(p),
    ['Цена',rub.format(p.price)],['Гарантия',p.warranty],['Производитель',p.producer],
    ['Вес, кг',p.w],['U',p.u],['Порты',p.ports],['Категория',p.cat?('Cat'+p.cat):''],
    ['Экранирование',p.shield],['Цвет',p.color],['Ширина, мм',p.width],['Глубина, мм',p.depth],['Дверь',p.door]
  ];
  if(p && p.tinkoSpecs && typeof p.tinkoSpecs==='object'){Object.entries(p.tinkoSpecs).forEach(([k,v])=>rows.push([k,v]));}
  return rows.filter(([k,v])=>v!==undefined&&v!==null&&String(v).trim()!==''&&String(v).trim()!=='0'&&String(v).trim()!=='—');
}
function cardMeta(p){return [p.u&&p.u+'U',p.ports&&p.ports+' портов',p.cat&&'Cat'+p.cat,p.shield,p.color,p.depth&&'глубина '+p.depth,p.warranty&&'гарантия '+p.warranty].filter(Boolean).join(' • ')}

function productImageHtml(p){
  return p && p.img ? `<div class="product-photo"><img src="${p.img}" alt="${esc(p.name||p.article||'')}"></div>` : '';
}
function cardImageHtml(p){
  return p && p.img ? `<div class="card-img" onclick="openProduct(${p.id})"><img src="${p.img}" alt="${esc(p.name||p.article||'')}"></div>` : '';
}


function productCardPhoto(p){
  return p && p.img ? `<div class="product-card-photo" onclick="openProduct(${p.id})"><img src="${p.img}" alt="${esc(p.name||p.article||'')}"></div>` : '';
}
function productDetailPhoto(p){
  return p && p.img ? `<div class="product-detail-photo"><img src="${p.img}" alt="${esc(p.name||p.article||'')}"></div>` : '';
}

function card(p){return`<div class="card">${productCardPhoto(p)}${cardImageHtml(p)}<div><div class="tagrow"><span class="tag">${esc(p.section)}</span>${p.subsection?`<span class="tag">${esc(p.subsection)}</span>`:''}${stockTag(p)}</div><div class="name" onclick="openProduct(${p.id})">${esc(p.name)}</div><div class="article">Арт. ${esc(p.article)} • код ${esc(p.code)} ${p.type?'• '+esc(p.type):''}</div><div class="meta">${esc(cardMeta(p))}</div></div><div><div class="price">${rub.format(p.price)}</div><div class="actions"><input type="number" min="1" value="1" id="q${p.id}"><button class="btn" onclick="addToCart(${p.id})">В корзину</button></div></div></div>`} 
function render(){const start=(page-1)*PAGE_SIZE,list=filtered.slice(start,start+PAGE_SIZE);resultCount.textContent=filtered.length.toLocaleString('ru-RU');empty.classList.toggle('hidden',filtered.length>0);products.classList.remove('grid','list');products.classList.add(view);products.innerHTML=list.map(card).join('');renderPager()}function renderPager(){const pages=Math.ceil(filtered.length/PAGE_SIZE);if(pages<=1){pager.innerHTML='';return}let html='',from=Math.max(1,page-2),to=Math.min(pages,page+2);if(page>1)html+=`<button onclick="page--;render()">←</button>`;for(let i=from;i<=to;i++)html+=`<button class="${i===page?'active':''}" onclick="page=${i};render()">${i}</button>`;if(page<pages)html+=`<button onclick="page++;render()">→</button>`;pager.innerHTML=html}function shortName(p){return String(p.name||'').replace(/^Cabeus\s+/i,'').replace(String(p.article||''),'').replace(/\s+/g,' ').trim()}

const PRODUCT_IMAGES_BY_CODE = {
  "7171c": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAYABYgDASIAAhEBAxEB/8QAHgABAAICAwEBAQAAAAAAAAAAAAECAwQFBgcICQr/xABWEAACAQMCBAQDBQUEBgcGAA8AAQIDBBEFIQYHEjEIQVFhEyJxFDKBkaEJI0JSsRVicsEWJDOCktElQ1OisuHxFzREY3PC8IOjJic1VJPSZUVVZHWz/8QAHAEBAAMAAwEBAAAAAAAAAAAAAAECAwQFBgcI/8QAOhEBAAICAQMDAgQFAwMEAwADAAECAxEEEiExBUFRBhMiMmFxFIGRobEjQsEzUtEVcuHwNGKCJJLx/9oADAMBAAIRAxEAPwD9UwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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"
};
function productImageHtml(p){
  const src = PRODUCT_IMAGES_BY_CODE[String(p.code || '').toLowerCase()];
  return src ? `<div class="product-photo"><img src="${src}" alt="${esc(p.name || p.article || '')}"></div>` : '';
}

function openProduct(id){
  const p=PRODUCTS[id];
  const specs=cleanSpecs(p);
  productContent.innerHTML=`<div class="product-head"><div style="flex:1"><p class="muted">Каталог / ${esc(p.article)}</p><h2>${esc(p.article)}</h2><div class="compact-name">${esc(shortName(p))}</div></div><div class="close" onclick="closeProduct()">×</div></div><div class="product-body">${productDetailPhoto(p)}${productImageHtml(p)}<div class="price">${rub.format(p.price)}</div><div class="avail">${stockTag(p)}</div><div class="specs">${specs.map(([k,v])=>`<div class="spec"><small>${esc(k)}</small>${esc(v)}</div>`).join('')}</div><button class="btn full" onclick="addToCart(${p.id})">Добавить в корзину</button></div>`;
  const box=productModal.querySelector('.box'); if(box) box.classList.add('product-box');
  productModal.classList.add('open');
}
function closeProduct(){productModal.classList.remove('open');const box=productModal.querySelector('.box');if(box)box.classList.remove('product-box')}
function showCartToast(message='Товар добавлен в корзину'){
  const el=document.getElementById('cartToast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__cartToastTimer);
  window.__cartToastTimer=setTimeout(()=>el.classList.remove('show'),1700);
}

function addToCart(id){const el=document.getElementById('q'+id),q=Math.max(1,parseInt(el?.value||'1',10));cart[id]=(cart[id]||0)+q;saveCart();showCartToast()}function saveCart(){localStorage.setItem('cabeusCartFull',JSON.stringify(cart));updateCartCount()}function updateCartCount(){const n=Object.values(cart).reduce((a,b)=>a+Number(b||0),0);if(window.cartCount)cartCount.textContent=n;if(window.cartCountMobile)cartCountMobile.textContent=n}function openCart(){
  let total=0;
  const entries=Object.entries(cart).filter(([id,qty])=>PRODUCTS[id]&&Number(qty)>0);
  const rows=entries.map(([id,qty])=>{
    const p=PRODUCTS[id]; const unit=p.unit||'шт.'; const sum=p.price*qty; total+=sum;
    return `<div class="cart-row"><div><div class="cart-name">${esc(p.article)}</div><div class="cart-sub">${esc(p.name)}</div></div><div class="cart-controls"><input type="number" min="1" value="${qty}" onchange="cart[${id}]=Math.max(1,+this.value||1);saveCart();openCart()"><span class="cart-unit">${esc(unit)}</span><div class="cart-sum">${rub.format(sum)}</div><button class="icon-btn" onclick="delete cart[${id}];saveCart();openCart()">×</button></div></div>`
  }).join('');
  cartItems.innerHTML=rows?`<div class="cart-list">${rows}</div>`:'<div class="empty-cart">Корзина пока пустая. Откройте каталог и добавьте товары.</div>';
  cartTotal.textContent=rub.format(total);
  updateEmailLink();cartModal.classList.add('open')
}
function closeCart(){cartModal.classList.remove('open')}function requestText(){let total=0,lines=['Здравствуйте! Прошу выставить счёт по позициям:',''];Object.entries(cart).forEach(([id,qty])=>{const p=PRODUCTS[id];if(!p)return;const sum=p.price*qty;total+=sum;lines.push(`${p.article} — ${p.name} — ${qty} ${p.unit||'шт.'} × ${rub.format(p.price)} = ${rub.format(sum)}`)});lines.push('',`Итого: ${rub.format(total)}`);const c=comment?.value.trim();if(c)lines.push('','Комментарий: '+c);return lines.join('\n')}function updateEmailLink(){setTimeout(()=>{emailLink.href='mailto:sales@cabeus.ru?subject='+encodeURIComponent('Заявка на счет Cabeus')+'&body='+encodeURIComponent(requestText())},0)}function copyRequest(){navigator.clipboard?.writeText(requestText());copied.classList.remove('hidden');updateEmailLink()}function goHome(){showHome();window.scrollTo({top:0,behavior:'smooth'})}function scrollToInfo(){info.scrollIntoView({behavior:'smooth'})}
function compactKey(v){return String(v??'').toLowerCase().replace(/ё/g,'е').replace(/[^0-9a-zа-я]+/gi,'')}
function codeArticleMatch(p,q){const cq=compactKey(q); if(!cq)return false; return [p.code,p.article].some(v=>compactKey(v).includes(cq))}
function matchesSmartSearch(p,q){const query=String(q||'').trim();if(!query)return true;if(codeArticleMatch(p,query))return true;const tokens=searchTokens(query);if(!tokens.length)return true;const text=productSearchText(p);return tokens.every(t=>codeArticleMatch(p,t)||tokenMatch(text,p,t))}
function qtyStep(inputId,delta){const el=document.getElementById(inputId);if(!el)return;el.value=Math.max(1,(parseInt(el.value||'1',10)||1)+delta)}
function qtyHtml(inputId,value=1){return `<div class="qty-stepper"><button type="button" onclick="qtyStep('${inputId}',-1)">−</button><input id="${inputId}" type="number" min="1" value="${value}"><button type="button" onclick="qtyStep('${inputId}',1)">+</button></div>`}
function addToCartFrom(inputId,id){const el=document.getElementById(inputId);const q=Math.max(1,parseInt(el?.value||'1',10)||1);cart[id]=(cart[id]||0)+q;saveCart()}
function addToCart(id){addToCartFrom('q'+id,id)}
function setCartQty(id,q){cart[id]=Math.max(1,parseInt(q||'1',10)||1);saveCart();openCart()}
function changeCartQty(id,d){cart[id]=Math.max(1,(parseInt(cart[id]||'1',10)||1)+d);saveCart();openCart()}
function card(p){return`<div class="card"><div><div class="tagrow"><span class="tag">${esc(p.section)}</span>${p.subsection?`<span class="tag">${esc(p.subsection)}</span>`:''}${stockTag(p)}</div><div class="name" onclick="openProduct(${p.id})">${esc(p.name)}</div><div class="article">Арт. ${esc(p.article)} • код ${esc(p.code)} ${p.type?'• '+esc(p.type):''}</div><div class="meta">${esc(cardMeta(p))}</div></div><div><div class="price">${rub.format(p.price)}</div><div class="actions">${qtyHtml('q'+p.id,1)}<button class="btn" onclick="addToCart(${p.id})">В корзину</button></div></div></div>`}
function openProduct(id){const p=PRODUCTS[id];const specs=cleanSpecs(p);const qid='qprod'+p.id;productContent.innerHTML=`<div class="product-head"><div style="flex:1"><p class="muted">Каталог / ${esc(p.article)} / код ${esc(p.code)}</p><h2>${esc(p.article)}</h2><div class="compact-name">${esc(shortName(p))}</div></div><div class="close" onclick="closeProduct()">×</div></div><div class="product-body"><div class="price">${rub.format(p.price)}</div><div class="avail">${stockTag(p)}</div><div class="specs">${specs.map(([k,v])=>`<div class="spec"><small>${esc(k)}</small>${esc(v)}</div>`).join('')}</div><div class="actions">${qtyHtml(qid,1)}<button class="btn full" onclick="addToCartFrom('${qid}',${p.id});closeProduct()">Добавить в корзину</button></div></div>`;const box=productModal.querySelector('.box');if(box)box.classList.add('product-box');productModal.classList.add('open')}
function openCart(){let total=0;const entries=Object.entries(cart).filter(([id,qty])=>PRODUCTS[id]&&Number(qty)>0);const rows=entries.map(([id,qty])=>{const p=PRODUCTS[id];const unit=p.unit||'шт.';const sum=p.price*qty;total+=sum;return `<div class="cart-row"><div><div class="cart-name">${esc(p.article)}</div><div class="cart-sub">код ${esc(p.code)} • ${esc(p.name)}</div></div><div class="cart-controls"><div class="qty-stepper"><button type="button" onclick="changeCartQty(${id},-1)">−</button><input type="number" min="1" value="${qty}" onchange="setCartQty(${id},this.value)"><button type="button" onclick="changeCartQty(${id},1)">+</button></div><span class="cart-unit">${esc(unit)}</span><div class="cart-sum">${rub.format(sum)}</div><button class="icon-btn" onclick="delete cart[${id}];saveCart();openCart()">×</button></div></div>`}).join('');cartItems.innerHTML=rows?`<div class="cart-list">${rows}</div>`:'<div class="empty-cart">Корзина пока пустая. Откройте каталог и добавьте товары.</div>';cartTotal.textContent=rub.format(total);updateEmailLink();cartModal.classList.add('open')}
function suggestionScore(p,q){
  q=String(q||'').trim();
  if(!q)return 0;
  const cq=compactKey(q);
  const code=compactKey(p.code);
  const article=compactKey(p.article);
  const name=compactKey(p.name);
  const full=compactKey([p.code,p.article,p.name,p.type,p.section,p.subsection].join(' '));
  let score=0;

  // Самый высокий приоритет: точное совпадение кода товара
  if(code===cq) score+=100000;
  else if(article===cq) score+=90000;
  else if(code.startsWith(cq)) score+=70000;
  else if(article.startsWith(cq)) score+=60000;
  else if(code.includes(cq)) score+=40000;
  else if(article.includes(cq)) score+=30000;
  else if(name.includes(cq)) score+=12000;
  else if(full.includes(cq)) score+=6000;

  if(matchesSmartSearch(p,q)) score+=1000;

  // Штрафуем более длинные коды при одинаковом начале, чтобы 7171c был выше 7171c-5 и 7171c-100
  score -= Math.max(0, code.length - cq.length) * 25;

  return score;
}
function findSuggestions(q,limit=8){
  q=String(q||'').trim();
  if(q.length<2)return[];
  const cq=compactKey(q);
  return PRODUCTS
    .map(p=>[p,suggestionScore(p,q)])
    .filter(x=>x[1]>0)
    .sort((a,b)=>{
      const ac=compactKey(a[0].code), bc=compactKey(b[0].code);
      const exactA=ac===cq, exactB=bc===cq;
      if(exactA!==exactB) return exactA?-1:1;
      if(b[1]!==a[1]) return b[1]-a[1];
      return ac.length-bc.length || a[0].price-b[0].price;
    })
    .slice(0,limit)
    .map(x=>x[0]);
}
function ensureSuggestBox(input){let box=document.getElementById(input.id+'Suggest');if(!box){box=document.createElement('div');box.id=input.id+'Suggest';box.className='suggestions hidden';input.parentElement.appendChild(box)}return box}
function renderSuggestFor(input){const box=ensureSuggestBox(input);const q=input.value.trim();const list=findSuggestions(q);if(!list.length){box.classList.add('hidden');box.innerHTML='';return}box.innerHTML=list.map(p=>`<div class="suggest-item" onmousedown="chooseSuggestion('${input.id}',${p.id});return false">${suggestionThumbHtml(p)}<div class="suggest-copy"><div class="suggest-main">${esc(p.article)} <span class="muted">код ${esc(p.code)}</span></div><div class="suggest-sub">${esc(p.name)}</div></div><div class="suggest-price">${rub.format(p.price)}</div></div>`).join('');box.classList.remove('hidden')}
function chooseSuggestion(inputId,id){const input=document.getElementById(inputId);const p=PRODUCTS[id];if(!input||!p)return;input.value=p.code||p.article;if(inputId==='homeSearch'){runHomeSearch();setTimeout(()=>openProduct(id),80)}else{applyFilters();setTimeout(()=>openProduct(id),50)}document.getElementById(inputId+'Suggest')?.classList.add('hidden')}
function initSearchSuggest(){['homeSearch','search'].forEach(id=>{const input=document.getElementById(id);if(!input)return;input.setAttribute('autocomplete','off');ensureSuggestBox(input);input.addEventListener('input',()=>renderSuggestFor(input));input.addEventListener('focus',()=>renderSuggestFor(input));input.addEventListener('blur',()=>setTimeout(()=>document.getElementById(id+'Suggest')?.classList.add('hidden'),180))})}
const __oldInit=init;init=function(){__oldInit();initSearchSuggest()};


/* === final UX functions: section landing, better drawer, product buy top, VAT === */
function priceHtml(p){return `<div class="price">${rub.format(p.price)}<small>с НДС</small></div>`}
function sectionData(sec){const items=PRODUCTS.filter(p=>p.section===sec);const subs={};items.forEach(p=>{const sub=p.subsection||'Без подраздела';subs[sub]=(subs[sub]||0)+1});return {items,subs}}
function ensureSectionPage(){let el=document.getElementById('sectionPage');if(!el){el=document.createElement('section');el.id='sectionPage';el.className='section-page hidden';const shop=document.getElementById('shopPage');shop?.parentElement?.insertBefore(el,shop)}return el}
function hideSectionPage(){document.getElementById('sectionPage')?.classList.add('hidden')}
function showSectionPage(sec){const pageEl=ensureSectionPage();const data=sectionData(sec);const subs=Object.entries(data.subs).sort((a,b)=>a[0].localeCompare(b[0],'ru'));document.getElementById('homeLanding')?.classList.add('hidden');document.getElementById('shopPage')?.classList.add('hidden');currentSection=sec;currentSubsection='';sectionFilter.value=sec;onSectionChange();const cards=subs.map(([sub,c])=>`<button class="sub-card" type="button" onclick="chooseCatalog('${esc(sec)}','${esc(sub)}')"><b>${esc(sub)}</b><span>${c.toLocaleString('ru-RU')} товаров</span></button>`).join('');pageEl.innerHTML=`<div class="section-hero"><p class="muted">Каталог / ${esc(sec)}</p><h2>${esc(sec)}</h2><p class="muted">Выберите подраздел. Товары показываются внутри подраздела, чтобы каталог не смешивался.</p></div><div class="sub-grid">${cards}</div>`;pageEl.classList.remove('hidden');document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});}
function renderCategoryTree(){const groups={};PRODUCTS.forEach(p=>{const sec=p.section||'Без категории';const sub=p.subsection||'Без подраздела';groups[sec]=groups[sec]||{count:0,subs:{}};groups[sec].count++;groups[sec].subs[sub]=(groups[sec].subs[sub]||0)+1});const html=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([sec,data])=>`<div class="cat-section"><button class="cat-title" type="button" onclick="toggleCatSection(this)"><span>${esc(sec)}</span><small>${data.count.toLocaleString('ru-RU')}</small></button><div class="sub-list"><button class="all-sub" type="button" onclick="chooseCatalog('${esc(sec)}','')"><span>Все подразделы раздела</span><em>${data.count.toLocaleString('ru-RU')}</em></button>${Object.entries(data.subs).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([sub,c])=>`<button type="button" onclick="chooseCatalog('${esc(sec)}','${esc(sub)}')"><span>${esc(sub)}</span><em>${c.toLocaleString('ru-RU')}</em></button>`).join('')}</div></div>`).join('');['categoryTree','categoryTreeDrawer'].forEach(id=>{const root=document.getElementById(id);if(root)root.innerHTML=html})}
function chooseCatalog(sec,sub){const targetSub=sub||'';closeCatalogDrawer();if(sec && !targetSub){showSectionPage(sec);return}hideSectionPage();currentSection=sec||'';currentSubsection=targetSub;document.getElementById('homeLanding')?.classList.add('hidden');document.getElementById('shopPage')?.classList.remove('hidden');sectionFilter.value=currentSection;onSectionChange();currentSubsection=targetSub;subFilter.value=currentSubsection;updateDynamicFilters();const title=document.getElementById('categoryTitle');if(title)title.textContent=currentSubsection?`${currentSection} / ${currentSubsection}`:(currentSection||'Все разделы');applyFilters();document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});}
function showHome(){currentSection='';currentSubsection='';filtered=[];hideSectionPage();document.getElementById('homeLanding')?.classList.remove('hidden');document.getElementById('shopPage')?.classList.add('hidden');products.innerHTML='';pager.innerHTML='';resultCount.textContent='0'}
function runHomeSearch(){const v=(document.getElementById('homeSearch')?.value||'').trim();closeCatalogDrawer();hideSectionPage();document.getElementById('homeLanding')?.classList.add('hidden');document.getElementById('shopPage')?.classList.remove('hidden');currentSection='';currentSubsection='';if(sectionFilter)sectionFilter.value='';if(subFilter)subFilter.value='';onSectionChange();const searchEl=document.getElementById('search');if(searchEl)searchEl.value=v;const title=document.getElementById('categoryTitle');if(title)title.textContent=v?'Поиск: '+v:'Все разделы';applyFilters();document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});}
function card(p){return`<div class="card"><div><div class="tagrow"><span class="tag">${esc(p.section)}</span>${p.subsection?`<span class="tag">${esc(p.subsection)}</span>`:''}${stockTag(p)}</div><div class="name" onclick="openProduct(${p.id})">${esc(p.name)}</div><div class="article">Арт. ${esc(p.article)} • код ${esc(p.code)} ${p.type?'• '+esc(p.type):''}</div><div class="meta">${esc(cardMeta(p))}</div></div><div>${priceHtml(p)}<div class="actions">${qtyHtml('q'+p.id,1)}<button class="btn" onclick="addToCart(${p.id})">В корзину</button></div></div></div>`}
function openProduct(id){const p=PRODUCTS[id];const specs=cleanSpecs(p);const qid='qprod'+p.id;productContent.innerHTML=`<div class="product-head"><div style="flex:1"><p class="muted">Каталог / ${esc(p.article)} / код ${esc(p.code)}</p><h2>${esc(p.article)}</h2><div class="compact-name">${esc(shortName(p))}</div></div><div class="close" onclick="closeProduct()">×</div></div><div class="product-body">${productImageHtml(p)}<div class="product-buy"><div>${priceHtml(p)}<div class="avail">${stockTag(p)}</div></div><div class="actions">${qtyHtml(qid,1)}<button class="btn full" onclick="addToCartFrom('${qid}',${p.id});closeProduct()">Добавить в корзину</button></div></div><div class="specs">${specs.map(([k,v])=>`<div class="spec"><small>${esc(k)}</small>${esc(v)}</div>`).join('')}</div></div>`;const box=productModal.querySelector('.box');if(box)box.classList.add('product-box');productModal.classList.add('open')}


/* === stock-limited cart + clean product specs + clear price label === */
function maxAvailable(p){
  const stock=Number(p?.qty||0);
  const transit=Number(p?.transit||0);
  if(stock>0) return stock;
  if(transit>0) return transit;
  return 0;
}
function availabilityLabel(p){
  const unit=esc(p.unit||'шт.');
  if(Number(p.qty||0)>0) return `Доступно: ${p.qty} ${unit}`;
  if(Number(p.transit||0)>0) return `Доступно в транзите: ${p.transit} ${unit}`;
  return 'Нет доступного количества';
}
function priceHtml(p){
  return `<div class="price-block"><div class="price-caption">Цена с НДС</div><div class="price">${rub.format(p.price)}</div></div>`;
}
function cleanSpecs(p){
  function addRowsFromObject(obj){
    if(!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([k,v])=>[k,v]);
  }

  // Если характеристики были импортированы с сайта-донора, на странице товара показываем
  // только описание и характеристики донора. Старые поля из исходного каталога остаются
  // в products.js для поиска, фильтров, цены, наличия и корзины, но не смешиваются
  // с донорскими характеристиками в карточке товара.
  let rows = [];
  if(p && (p.donorDescription || p.donorSpecs)){
    rows = [
      ...addRowsFromObject(p.donorSpecs)
    ];
  } else if(p && (p.tinkoDescription || p.tinkoSpecs)){
    rows = [
      ...addRowsFromObject(p.tinkoSpecs)
    ];
  } else {
    rows=[
      ['Артикул',p.article],['Код',p.code],['Тип',p.type],['Гарантия',p.warranty],['Производитель',p.producer],
      ['Единица измерения',p.unit],['Вес, кг',p.w],
      ['U',p.u],['Порты',p.ports],['Категория',p.cat?('Cat'+p.cat):''],
      ['Экранирование',p.shield],['Цвет',p.color],['Ширина, мм',p.width],['Глубина, мм',p.depth],['Дверь',p.door]
    ];
    if(p && p.tinkoSpecs && typeof p.tinkoSpecs==='object'){Object.entries(p.tinkoSpecs).forEach(([k,v])=>rows.push([k,v]));}
  }
  return rows.filter(([k,v])=>v!==undefined&&v!==null&&String(v).trim()!==''&&String(v).trim()!=='0'&&String(v).trim()!=='—'&&String(v).trim().toLowerCase()!=='nan');
}
function qtyStep(inputId,delta,max){
  const el=document.getElementById(inputId); if(!el)return;
  const limit=Number(max||el.max||0);
  let next=(parseInt(el.value||'1',10)||1)+delta;
  if(next<1) next=1;
  if(limit>0 && next>limit){next=limit; alert('Нельзя выбрать больше доступного количества: '+limit);}
  el.value=next;
}
function qtyHtml(inputId,value=1,max=0,unit='шт.'){
  const disabled=max<=0?'disabled':'';
  const safeVal=max>0?Math.min(Math.max(1,value),max):0;
  return `<div class="qty-wrap"><div class="qty-stepper"><button type="button" ${disabled} onclick="qtyStep('${inputId}',-1,${max})">−</button><input id="${inputId}" type="number" min="1" ${max>0?`max="${max}"`:''} value="${safeVal}" ${disabled}><button type="button" ${disabled} onclick="qtyStep('${inputId}',1,${max})">+</button></div><span class="qty-unit">${esc(unit)}</span></div>`;
}
function addToCartFrom(inputId,id){
  const p=PRODUCTS[id]; if(!p)return;
  const limit=maxAvailable(p);
  if(limit<=0){alert('Товара нет в наличии и в транзите. Добавление в заявку недоступно.');return;}
  const el=document.getElementById(inputId);
  let q=Math.max(1,parseInt(el?.value||'1',10)||1);
  const current=Number(cart[id]||0);
  if(current+q>limit){
    const can=Math.max(0,limit-current);
    alert(can>0 ? `Можно добавить ещё только ${can} ${p.unit||'шт.'}. ${availabilityLabel(p)}.` : `В заявке уже максимальное количество. ${availabilityLabel(p)}.`);
    if(el) el.value=can>0?can:1;
    return;
  }
  cart[id]=current+q; saveCart(); updateCartCount();
}
function addToCart(id){addToCartFrom('q'+id,id)}
function setCartQty(id,q){
  const p=PRODUCTS[id]; if(!p)return;
  const limit=maxAvailable(p);
  let val=Math.max(1,parseInt(q||'1',10)||1);
  if(limit<=0){delete cart[id]; saveCart(); openCart(); return;}
  if(val>limit){val=limit; alert('Нельзя выбрать больше доступного количества: '+limit+' '+(p.unit||'шт.'));}
  cart[id]=val; saveCart(); openCart();
}
function changeCartQty(id,d){
  const p=PRODUCTS[id]; if(!p)return;
  const limit=maxAvailable(p);
  let val=(parseInt(cart[id]||'1',10)||1)+d;
  if(val<1) val=1;
  if(limit>0 && val>limit){val=limit; alert('Нельзя выбрать больше доступного количества: '+limit+' '+(p.unit||'шт.'));}
  cart[id]=val; saveCart(); openCart();
}
function card(p){
  const max=maxAvailable(p), unit=p.unit||'шт.';
  return`<div class="card"><div><div class="tagrow"><span class="tag">${esc(p.section)}</span>${p.subsection?`<span class="tag">${esc(p.subsection)}</span>`:''}${stockTag(p)}</div><div class="name" onclick="openProduct(${p.id})">${esc(p.name)}</div><div class="article">Арт. ${esc(p.article)} • код ${esc(p.code)} ${p.type?'• '+esc(p.type):''}</div><div class="meta">${esc(cardMeta(p))}</div></div><div>${priceHtml(p)}<div class="actions">${qtyHtml('q'+p.id,1,max,unit)}<button class="btn" ${max<=0?'disabled':''} onclick="addToCart(${p.id})">В корзину</button></div></div></div>`
}
function openProduct(id){
  const p=PRODUCTS[id]; const specs=cleanSpecs(p); const qid='qprod'+p.id; const max=maxAvailable(p), unit=p.unit||'шт.';
  productContent.innerHTML=`<div class="product-head"><div style="flex:1"><h2 class="product-title-only">${esc(p.name)}</h2></div><div class="close" onclick="closeProduct()">×</div></div><div class="product-body"><div class="product-buy"><div>${priceHtml(p)}<div class="avail">${stockTag(p)}</div></div><div class="actions">${qtyHtml(qid,1,max,unit)}<button class="btn full" ${max<=0?'disabled':''} onclick="addToCartFrom('${qid}',${p.id});closeProduct()">Добавить в корзину</button></div></div><h3 class="spec-title">Характеристики</h3><div class="specs">${specs.map(([k,v])=>`<div class="spec"><small>${esc(k)}</small>${esc(v)}</div>`).join('')}</div></div>`;
  const box=productModal.querySelector('.box'); if(box)box.classList.add('product-box'); productModal.classList.add('open');
}
function openCart(){
  let total=0;
  const entries=Object.entries(cart).filter(([id,qty])=>PRODUCTS[id]&&Number(qty)>0);
  const rows=entries.map(([id,qty])=>{
    const p=PRODUCTS[id]; const unit=p.unit||'шт.'; const limit=maxAvailable(p); let q=Number(qty)||1;
    if(limit>0 && q>limit){q=limit; cart[id]=q; saveCart();}
    const sum=p.price*q; total+=sum;
    return `<div class="cart-row"><div><div class="cart-name">${esc(p.article)}</div><div class="cart-sub">код ${esc(p.code)} • ${esc(p.name)}</div><div class="cart-stock">${esc(availabilityLabel(p))}</div></div><div class="cart-controls"><div class="qty-stepper"><button type="button" onclick="changeCartQty(${id},-1)">−</button><input type="number" min="1" ${limit>0?`max="${limit}"`:''} value="${q}" onchange="setCartQty(${id},this.value)"><button type="button" onclick="changeCartQty(${id},1)">+</button></div><span class="cart-unit">${esc(unit)}</span><div class="cart-sum">${rub.format(sum)}</div><button class="icon-btn" onclick="delete cart[${id}];saveCart();openCart()">×</button></div></div>`
  }).join('');
  cartItems.innerHTML=rows?`<div class="cart-list">${rows}</div>`:'<div class="empty-cart">Корзина пока пустая. Откройте каталог и добавьте товары.</div>';
  cartTotal.textContent=rub.format(total); updateEmailLink(); cartModal.classList.add('open')
}

document.addEventListener('DOMContentLoaded',init);

/* === Home no-products patch === */
function setHomeMode(){
  document.body.classList.add('home-mode');
  const shop=document.getElementById('shopPage');
  if(shop) shop.classList.add('hidden');
  if(window.products) products.innerHTML='';
  if(window.pager) pager.innerHTML='';
  if(window.empty) empty.classList.add('hidden');
}
function setCatalogMode(){
  document.body.classList.remove('home-mode');
  const shop=document.getElementById('shopPage');
  if(shop) shop.classList.remove('hidden');
}
const __origShowHomeFinal = typeof showHome === 'function' ? showHome : null;
showHome = function(){
  currentSection='';
  currentSubsection='';
  filtered=[];
  document.getElementById('homeLanding')?.classList.remove('hidden');
  setHomeMode();
  if(window.resultCount) resultCount.textContent='0';
};
const __origRunHomeSearchFinal = typeof runHomeSearch === 'function' ? runHomeSearch : null;
runHomeSearch = function(){
  setCatalogMode();
  if(__origRunHomeSearchFinal) return __origRunHomeSearchFinal();
};
const __origChooseCatalogFinal = typeof chooseCatalog === 'function' ? chooseCatalog : null;
chooseCatalog = function(sec,sub){
  setCatalogMode();
  if(__origChooseCatalogFinal) return __origChooseCatalogFinal(sec,sub);
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(setHomeMode,0));


/* === Override home search to separate page === */
const __origRunHomeSearchSeparatePage = typeof runHomeSearch === 'function' ? runHomeSearch : null;
runHomeSearch = function(){
  const v=(document.getElementById('homeSearch')?.value||'').trim();
  setSearchMode();

  currentSection='';
  currentSubsection='';
  if(window.sectionFilter) sectionFilter.value='';
  if(window.subFilter) subFilter.value='';
  if(typeof onSectionChange === 'function') onSectionChange();

  const searchEl=document.getElementById('search');
  if(searchEl) searchEl.value=v;

  const title=document.getElementById('categoryTitle');
  if(title){
    title.innerHTML = searchHeaderHtml(v ? `Поиск: ${v}` : 'Все товары');
  }

  page=1;
  if(typeof applyFilters === 'function') applyFilters();
  document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
};


/* === Override catalog opening to separate catalog page === */
const __origChooseCatalogSeparatePage = typeof chooseCatalog === 'function' ? chooseCatalog : null;
chooseCatalog = function(sec,sub){
  clearSearchMode();
  document.body.classList.remove('home-mode');
  const shop=document.getElementById('shopPage');
  if(shop) shop.classList.remove('hidden');
  document.getElementById('homeLanding')?.classList.add('hidden');
  if(__origChooseCatalogSeparatePage) return __origChooseCatalogSeparatePage(sec,sub);
};


/* === Override home reset from search/catalog pages === */
const __origGoHomeSearchPage = typeof goHome === 'function' ? goHome : null;
goHome = function(){
  clearSearchMode();
  if(typeof showHome === 'function') showHome();
  window.scrollTo({top:0,behavior:'smooth'});
};
const __origShowHomeSearchPage = typeof showHome === 'function' ? showHome : null;
showHome = function(){
  clearSearchMode();
  currentSection='';
  currentSubsection='';
  filtered=[];
  document.getElementById('homeLanding')?.classList.remove('hidden');
  if(typeof setHomeMode === 'function') setHomeMode();
  else{
    document.body.classList.add('home-mode');
    document.getElementById('shopPage')?.classList.add('hidden');
    if(window.products) products.innerHTML='';
    if(window.pager) pager.innerHTML='';
  }
  if(window.resultCount) resultCount.textContent='0';
};


/* === FINAL navigation fix: catalog/search are separate pages and search resets === */
function resetAllSearchInputsFinal(){
  ['homeSearch','search'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value='';
    const box=document.getElementById(id+'Suggest');
    if(box){box.classList.add('hidden');box.innerHTML='';}
  });
}
function setHomeModeFinal(){
  document.body.classList.remove('search-mode','catalog-mode');
  document.body.classList.add('home-mode');
  document.getElementById('homeLanding')?.classList.remove('hidden');
  document.getElementById('shopPage')?.classList.add('hidden');
  if(window.products) products.innerHTML='';
  if(window.pager) pager.innerHTML='';
  if(window.empty) empty.classList.add('hidden');
  if(window.resultCount) resultCount.textContent='0';
}
function setSearchModeFinal(){
  document.body.classList.remove('home-mode','catalog-mode');
  document.body.classList.add('search-mode');
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
}
function setCatalogModeFinal(){
  document.body.classList.remove('home-mode','search-mode');
  document.body.classList.add('catalog-mode');
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
}
function pageHeaderFinal(kind,title){
  const label = kind === 'search' ? 'Результаты поиска' : 'Каталог';
  return `<div class="catalog-page-header"><div><div class="catalog-title-label">${label}</div><div>${esc(title)}</div></div><button class="catalog-back-btn" onclick="goHome()">← На главную</button></div>`;
}
goHome = function(){
  resetAllSearchInputsFinal();
  currentSection='';
  currentSubsection='';
  filtered=[];
  setHomeModeFinal();
  window.scrollTo({top:0,behavior:'smooth'});
};
showHome = function(){
  goHome();
};
runHomeSearch = function(){
  const q=(document.getElementById('homeSearch')?.value||'').trim();
  setSearchModeFinal();

  currentSection='';
  currentSubsection='';
  if(window.sectionFilter) sectionFilter.value='';
  if(window.subFilter) subFilter.value='';
  if(typeof onSectionChange === 'function') onSectionChange();

  const searchEl=document.getElementById('search');
  if(searchEl) searchEl.value=q;

  const title=document.getElementById('categoryTitle');
  if(title) title.innerHTML = pageHeaderFinal('search', q ? `Поиск: ${q}` : 'Все товары');

  page=1;
  if(typeof applyFilters === 'function') applyFilters();
  document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
};
chooseCatalog = function(sec,sub){
  const targetSub=sub||'';
  resetAllSearchInputsFinal();
  setCatalogModeFinal();

  currentSection=sec||'';
  currentSubsection=targetSub;

  closeCatalogDrawer?.();

  if(window.sectionFilter) sectionFilter.value=currentSection;
  if(typeof onSectionChange === 'function') onSectionChange();

  currentSubsection=targetSub;
  if(window.subFilter) subFilter.value=currentSubsection;
  if(typeof updateDynamicFilters === 'function') updateDynamicFilters();

  const title=document.getElementById('categoryTitle');
  if(title){
    const name = currentSubsection ? `${currentSection} / ${currentSubsection}` : currentSection;
    title.innerHTML = pageHeaderFinal('catalog', name || 'Все разделы');
  }

  page=1;
  if(typeof applyFilters === 'function') applyFilters();
  document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
  // При первом открытии сайта всегда главная без товаров.
  if(!document.body.classList.contains('search-mode') && !document.body.classList.contains('catalog-mode')){
    setHomeModeFinal();
  }
},0));


/* === FINAL smart dynamic filters by selected product group === */
const FILTER_FIELD_MAP_FINAL = [
  ['sectionFilter', ['section']],
  ['subFilter', ['subsection']],
  ['typeFilter', ['type']],
  ['stockFilter', ['qty','transit','nearTransit']],
  ['warrantyFilter', ['warranty']],
  ['priceMin', ['price']],
  ['priceMax', ['price']],
  ['uFilter', ['u']],
  ['portsFilter', ['ports']],
  ['catFilter', ['cat']],
  ['shieldFilter', ['shield']],
  ['colorFilter', ['color']],
  ['depthFilter', ['depth']],
  ['widthFilter', ['width']],
  ['doorFilter', ['door']]
];

function visiblePoolForFiltersFinal(){
  let pool = PRODUCTS.slice();
  const sec = window.sectionFilter ? sectionFilter.value : (currentSection || '');
  const sub = window.subFilter ? subFilter.value : (currentSubsection || '');

  if(sec) pool = pool.filter(p => p.section === sec);
  if(sub) pool = pool.filter(p => p.subsection === sub);

  return pool;
}
function hasRealValueFinal(v){
  if(v===undefined || v===null) return false;
  const s=String(v).trim();
  return s!=='' && s!=='0' && s!=='0.00' && s!=='null' && s!=='undefined';
}
function fieldHasUsefulDataFinal(pool, keys){
  if(!pool || !pool.length) return false;

  // цена и наличие почти всегда полезны, если есть товары
  if(keys.includes('price')) return pool.some(p => Number(p.price) > 0);
  if(keys.includes('qty') || keys.includes('transit')) {
    return pool.some(p => Number(p.qty || 0) > 0 || Number(p.transit || 0) > 0 || hasRealValueFinal(p.nearTransit));
  }

  const values = new Set();
  pool.forEach(p=>{
    keys.forEach(k=>{
      if(hasRealValueFinal(p[k])) values.add(String(p[k]).trim());
    });
  });

  // Если в выбранной группе нет значений — фильтр не нужен.
  // Если только одно значение, фильтр тоже обычно не нужен, кроме важных параметров.
  return values.size > 1;
}
function setFieldVisibleFinal(id, visible){
  const el=document.getElementById(id);
  if(!el) return;
  const field=el.closest('.field') || el.parentElement;
  if(!field) return;
  field.classList.toggle('smart-hidden', !visible);
}
function updateSmartDynamicFiltersFinal(){
  const pool = visiblePoolForFiltersFinal();

  FILTER_FIELD_MAP_FINAL.forEach(([id, keys])=>{
    // Раздел всегда показываем, чтобы можно было сменить раздел.
    if(id==='sectionFilter'){
      setFieldVisibleFinal(id, true);
      return;
    }

    // Подраздел показываем только если выбран раздел и внутри него больше 1 подраздела.
    if(id==='subFilter'){
      const sec = window.sectionFilter ? sectionFilter.value : currentSection;
      const subs = new Set(pool.map(p=>p.subsection).filter(hasRealValueFinal));
      setFieldVisibleFinal(id, !!sec && subs.size > 1);
      return;
    }

    setFieldVisibleFinal(id, fieldHasUsefulDataFinal(pool, keys));
  });

  const filtersBox = document.querySelector('.filters .filter-body') || document.querySelector('.filters');
  if(filtersBox && !document.getElementById('smartFilterNote')){
    const note=document.createElement('div');
    note.id='smartFilterNote';
    note.className='filter-section-note';
    note.textContent='Показаны только параметры выбранной группы товаров';
    filtersBox.prepend(note);
  }

  const visibleCount = FILTER_FIELD_MAP_FINAL.filter(([id])=>{
    const el=document.getElementById(id);
    const field=el?.closest('.field') || el?.parentElement;
    return field && !field.classList.contains('smart-hidden');
  }).length;

  const counter=document.querySelector('.filter-count');
  if(counter) counter.textContent = visibleCount + ' параметров';
}

// Оборачиваем старые функции, чтобы динамика обновлялась при каждом переходе/фильтрации.
const __oldUpdateDynamicFiltersSmart = typeof updateDynamicFilters === 'function' ? updateDynamicFilters : null;
updateDynamicFilters = function(){
  if(__oldUpdateDynamicFiltersSmart) __oldUpdateDynamicFiltersSmart();
  updateSmartDynamicFiltersFinal();
};

const __oldOnSectionChangeSmart = typeof onSectionChange === 'function' ? onSectionChange : null;
onSectionChange = function(){
  if(__oldOnSectionChangeSmart) __oldOnSectionChangeSmart();
  updateSmartDynamicFiltersFinal();
};

const __oldApplyFiltersSmart = typeof applyFilters === 'function' ? applyFilters : null;
applyFilters = function(){
  if(__oldApplyFiltersSmart) __oldApplyFiltersSmart();
  updateSmartDynamicFiltersFinal();
};

// После выбора раздела/подраздела пересчитываем видимость фильтров.
const __oldChooseCatalogSmart = typeof chooseCatalog === 'function' ? chooseCatalog : null;
chooseCatalog = function(sec,sub){
  if(__oldChooseCatalogSmart) __oldChooseCatalogSmart(sec,sub);
  setTimeout(updateSmartDynamicFiltersFinal,0);
};

document.addEventListener('DOMContentLoaded',()=>setTimeout(updateSmartDynamicFiltersFinal,50));


/* === FINAL cart toast and stay on product page === */
function showCartToastFinal(message='Товар добавлен в корзину'){
  let el=document.getElementById('cartToast');
  if(!el){
    el=document.createElement('div');
    el.id='cartToast';
    el.className='cart-toast';
    el.setAttribute('aria-live','polite');
    document.body.appendChild(el);
  }
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__cartToastFinalTimer);
  window.__cartToastFinalTimer=setTimeout(()=>el.classList.remove('show'),1700);
}

const __origAddToCartFinalToast = typeof addToCart === 'function' ? addToCart : null;
addToCart = function(id){
  if(__origAddToCartFinalToast) __origAddToCartFinalToast(id);
  showCartToastFinal('Товар добавлен в корзину');
};

// На всякий случай: если где-то в кнопке осталось closeProduct после addToCart — удаляем обработчиком клика.
document.addEventListener('click', function(e){
  const btn=e.target.closest('button');
  if(!btn) return;
  const code=btn.getAttribute('onclick') || '';
  if(code.includes('addToCart') && code.includes('closeProduct')){
    btn.setAttribute('onclick', code.replace(/;?\s*closeProduct\(\)/g,''));
  }
}, true);


/* === FINAL stock filter: in stock / transit / order === */
function normalizeStockFilterOptionsFinal(){
  const el=document.getElementById('stockFilter');
  if(!el)return;
  const current=el.value || '';
  el.innerHTML = `
    <option value="">Любое наличие</option>
    <option value="stock">В наличии</option>
    <option value="transit">Транзит</option>
    <option value="order">Под заказ</option>
  `;
  if(['','stock','transit','order'].includes(current)) el.value=current;
}
function stockMatchesFinal(p, value){
  if(!value) return true;
  const qty = Number(p.qty || 0);
  const transit = Number(p.transit || 0);
  if(value === 'stock') return qty > 0;
  if(value === 'transit') return qty <= 0 && transit > 0;
  if(value === 'order') return qty <= 0 && transit <= 0;
  return true;
}
function applyStockFilterFinal(list){
  const el=document.getElementById('stockFilter');
  const value=el ? el.value : '';
  return (list || []).filter(p=>stockMatchesFinal(p,value));
}

// Перехватываем applyFilters после старой логики, чтобы наличие работало строго по новым правилам.
const __oldApplyFiltersStockFinal = typeof applyFilters === 'function' ? applyFilters : null;
applyFilters = function(){
  const stockEl=document.getElementById('stockFilter');
  const selectedStock=stockEl ? stockEl.value : '';

  if(__oldApplyFiltersStockFinal) __oldApplyFiltersStockFinal();

  if(selectedStock){
    filtered = applyStockFilterFinal(filtered);
    page=1;
    if(typeof render === 'function') render();
  }

  if(typeof updateSmartDynamicFiltersFinal === 'function') updateSmartDynamicFiltersFinal();
};

document.addEventListener('DOMContentLoaded',()=>setTimeout(normalizeStockFilterOptionsFinal,0));


/* === FINAL filter labels: pairs/ports/U and fixed selects === */
function setSelectFirstOptionTextFinal(selectId, text){
  const el=document.getElementById(selectId);
  if(el && el.options && el.options.length) el.options[0].textContent=text;
}
function updateFilterLabelsFinal(){
  const sec=(document.getElementById('sectionFilter')?.value || currentSection || '').toLowerCase();
  const sub=(document.getElementById('subFilter')?.value || currentSubsection || '').toLowerCase();

  const portsEl=document.getElementById('portsFilter');
  const portsField=portsEl?.closest('.field');
  const portsLabel=portsField?.querySelector('label');

  const uEl=document.getElementById('uFilter');
  const uField=uEl?.closest('.field');
  const uLabel=uField?.querySelector('label');

  const isCable = sec.includes('кабель') || sub.includes('кабель') || sub.includes('витая пара');
  const isCabinet = sec.includes('шкаф') || sub.includes('шкаф') || sub.includes('стойк');
  const isPorts = sub.includes('патч') || sub.includes('панел') || sub.includes('модул') || sub.includes('розет') || sub.includes('компонент');

  if(uLabel) uLabel.textContent = isCabinet ? 'U' : 'U';
  setSelectFirstOptionTextFinal('uFilter','U');

  if(portsLabel){
    if(isCable){
      portsLabel.textContent='Количество пар';
      setSelectFirstOptionTextFinal('portsFilter','Количество пар');
    }else if(isPorts){
      portsLabel.textContent='Количество портов';
      setSelectFirstOptionTextFinal('portsFilter','Количество портов');
    }else{
      portsLabel.textContent='Количество';
      setSelectFirstOptionTextFinal('portsFilter','Количество');
    }
  }

  // Для кабельной продукции поле U не нужно; для шкафов/стоек поле количества пар/портов не нужно.
  if(uField && isCable) uField.classList.add('smart-hidden');
  if(portsField && isCabinet) portsField.classList.add('smart-hidden');
}

// Исправляем зависание/залипание: при смене раздела сбрасываем параметры, которые не относятся к новому разделу.
function resetIrrelevantFiltersFinal(){
  const sec=(document.getElementById('sectionFilter')?.value || currentSection || '').toLowerCase();
  const isCable = sec.includes('кабель');

  if(isCable){
    const u=document.getElementById('uFilter');
    if(u) u.value='';
  }else{
    const ports=document.getElementById('portsFilter');
    if(ports && !sec.includes('компонент') && !sec.includes('патч')) ports.value='';
  }
}

const __oldOnSectionChangePairsFinal = typeof onSectionChange === 'function' ? onSectionChange : null;
onSectionChange = function(){
  if(__oldOnSectionChangePairsFinal) __oldOnSectionChangePairsFinal();
  resetIrrelevantFiltersFinal();
  setTimeout(updateFilterLabelsFinal,0);
};

const __oldUpdateDynamicFiltersPairsFinal = typeof updateDynamicFilters === 'function' ? updateDynamicFilters : null;
updateDynamicFilters = function(){
  if(__oldUpdateDynamicFiltersPairsFinal) __oldUpdateDynamicFiltersPairsFinal();
  setTimeout(updateFilterLabelsFinal,0);
};

const __oldChooseCatalogPairsFinal = typeof chooseCatalog === 'function' ? chooseCatalog : null;
chooseCatalog = function(sec,sub){
  if(__oldChooseCatalogPairsFinal) __oldChooseCatalogPairsFinal(sec,sub);
  setTimeout(updateFilterLabelsFinal,0);
};

document.addEventListener('DOMContentLoaded',()=>setTimeout(updateFilterLabelsFinal,100));


/* === FINAL patchcord filters: length/color/category/shield === */
function isPatchcordGroupFinal(){
  const sec=(document.getElementById('sectionFilter')?.value || currentSection || '').toLowerCase();
  const sub=(document.getElementById('subFilter')?.value || currentSubsection || '').toLowerCase();
  return sub.includes('патч') || sub.includes('patch') || sub.includes('шнур') || sub.includes('корд');
}
function extractLengthFinal(p){
  const source=[p.article,p.name].filter(Boolean).join(' ');
  const m=source.match(/(?:^|[-\s])(\d+(?:[.,]\d+)?)\s*m(?:[-\s]|$)/i) || source.match(/(\d+(?:[.,]\d+)?)\s*м\b/i);
  if(!m)return '';
  return m[1].replace(',', '.') + 'м';
}
function patchcordPoolFinal(){
  let pool=PRODUCTS.slice();
  const sec=document.getElementById('sectionFilter')?.value || currentSection || '';
  const sub=document.getElementById('subFilter')?.value || currentSubsection || '';
  if(sec) pool=pool.filter(p=>p.section===sec);
  if(sub) pool=pool.filter(p=>p.subsection===sub);
  return pool;
}
function fillSelectOptionsFinal(selectId, values, placeholder){
  const el=document.getElementById(selectId);
  if(!el)return;
  const current=el.value;
  const uniq=[...new Set(values.filter(Boolean).map(String))].sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
  el.innerHTML='<option value="">'+placeholder+'</option>'+uniq.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if(uniq.includes(current)) el.value=current;
}
function updatePatchcordFiltersFinal(){
  const active=isPatchcordGroupFinal();
  document.body.classList.toggle('patchcord-active', active);

  const pool=patchcordPoolFinal();
  if(active){
    fillSelectOptionsFinal('lengthFilter', pool.map(extractLengthFinal), 'Любая длина');

    // Показываем важные параметры патч-кордов даже если текущий smart-фильтр их спрятал.
    ['lengthFilter','catFilter','shieldFilter','colorFilter'].forEach(id=>{
      const el=document.getElementById(id);
      const field=el?.closest('.field') || el?.parentElement;
      if(field) field.classList.remove('smart-hidden');
    });

    // Переименовываем подписи понятно для патч-кордов
    const lf=document.getElementById('lengthFilter')?.closest('.field')?.querySelector('label');
    if(lf) lf.textContent='Длина';
    const cf=document.getElementById('catFilter')?.closest('.field')?.querySelector('label');
    if(cf) cf.textContent='Категория';
    const sf=document.getElementById('shieldFilter')?.closest('.field')?.querySelector('label');
    if(sf) sf.textContent='Экран';
    const colf=document.getElementById('colorFilter')?.closest('.field')?.querySelector('label');
    if(colf) colf.textContent='Цвет';
  }else{
    const len=document.getElementById('lengthFilter');
    if(len) len.value='';
  }
}

// Добавляем длину в фильтрацию
const __oldApplyFiltersPatchcordFinal = typeof applyFilters === 'function' ? applyFilters : null;
applyFilters = function(){
  if(__oldApplyFiltersPatchcordFinal) __oldApplyFiltersPatchcordFinal();

  const len=document.getElementById('lengthFilter')?.value || '';
  if(len){
    filtered=filtered.filter(p=>extractLengthFinal(p)===len);
    page=1;
    if(typeof render==='function') render();
  }

  setTimeout(updatePatchcordFiltersFinal,0);
};

const __oldChooseCatalogPatchcordFinal = typeof chooseCatalog === 'function' ? chooseCatalog : null;
chooseCatalog = function(sec,sub){
  if(__oldChooseCatalogPatchcordFinal) __oldChooseCatalogPatchcordFinal(sec,sub);
  setTimeout(updatePatchcordFiltersFinal,0);
};

const __oldUpdateDynamicFiltersPatchcordFinal = typeof updateDynamicFilters === 'function' ? updateDynamicFilters : null;
updateDynamicFilters = function(){
  if(__oldUpdateDynamicFiltersPatchcordFinal) __oldUpdateDynamicFiltersPatchcordFinal();
  setTimeout(updatePatchcordFiltersFinal,0);
};

document.addEventListener('DOMContentLoaded',()=>setTimeout(updatePatchcordFiltersFinal,120));


/* === FINAL category-aware filters v2 === */
const CATEGORY_FILTERS_V2 = {
  cable: ['type','cat','shield','color','pairs','length','warranty','price','stock'],
  patchcord: ['type','cat','shield','color','length','warranty','price','stock'],
  optical: ['type','color','length','warranty','price','stock'],
  cabinet: ['type','u','width','depth','door','color','warranty','price','stock'],
  panels: ['type','ports','cat','shield','color','warranty','price','stock'],
  modules: ['type','cat','shield','color','ports','warranty','price','stock'],
  accessories: ['type','color','warranty','price','stock'],
  default: ['type','warranty','price','stock']
};

const FILTER_ID_BY_KIND_V2 = {
  section:'sectionFilter',
  subsection:'subFilter',
  type:'typeFilter',
  stock:'stockFilter',
  warranty:'warrantyFilter',
  price:'minPrice',
  u:'uFilter',
  ports:'portsFilter',
  pairs:'portsFilter',
  cat:'catFilter',
  shield:'shieldFilter',
  color:'colorFilter',
  depth:'depthFilter',
  width:'widthFilter',
  door:'doorFilter',
  length:'lengthFilter'
};

const ALL_FILTER_IDS_V2 = [
  'typeFilter','stockFilter','warrantyFilter','minPrice','maxPrice',
  'uFilter','portsFilter','catFilter','shieldFilter','colorFilter',
  'depthFilter','widthFilter','doorFilter','lengthFilter'
];

function textLowerV2(...args){
  return args.filter(Boolean).join(' ').toLowerCase();
}
function currentPoolV2(){
  let pool = PRODUCTS.slice();
  const sec = document.getElementById('sectionFilter')?.value || currentSection || '';
  const sub = document.getElementById('subFilter')?.value || currentSubsection || '';
  if(sec) pool = pool.filter(p=>p.section===sec);
  if(sub) pool = pool.filter(p=>p.subsection===sub);
  return pool;
}
function categoryKindV2(){
  const sec = document.getElementById('sectionFilter')?.value || currentSection || '';
  const sub = document.getElementById('subFilter')?.value || currentSubsection || '';
  const t = textLowerV2(sec, sub);

  if(t.includes('патч') && t.includes('корд')) return 'patchcord';
  if(t.includes('оптик')) return 'optical';
  if(t.includes('кабель') || t.includes('витая пара') || t.includes('многопар')) return 'cable';
  if(t.includes('шкаф') || t.includes('стойк')) return 'cabinet';
  if(t.includes('панел') || t.includes('patch panel')) return 'panels';
  if(t.includes('модул') || t.includes('розет') || t.includes('компонент')) return 'modules';
  if(t.includes('аксесс') || t.includes('расход')) return 'accessories';
  return 'default';
}
function valueExistsV2(v){
  if(v===undefined || v===null) return false;
  const s=String(v).trim();
  return s!=='' && s!=='0' && s!=='0.00' && s!=='null' && s!=='undefined';
}
function extractLengthV2(p){
  const source=[p.article,p.name].filter(Boolean).join(' ');
  const m=source.match(/(?:^|[-\s])(\d+(?:[.,]\d+)?)\s*m(?:[-\s]|$)/i) || source.match(/(\d+(?:[.,]\d+)?)\s*м\b/i);
  if(!m)return '';
  return m[1].replace(',', '.') + 'м';
}
function fieldValuesV2(pool, kind){
  if(kind==='length') return pool.map(extractLengthV2).filter(valueExistsV2);
  if(kind==='pairs') return pool.map(p=>p.ports).filter(valueExistsV2);
  if(kind==='ports') return pool.map(p=>p.ports).filter(valueExistsV2);
  if(kind==='price') return pool.map(p=>p.price).filter(v=>Number(v)>0);
  if(kind==='stock') return pool.filter(p=>Number(p.qty||0)>0 || Number(p.transit||0)>0 || valueExistsV2(p.nearTransit)).map(p=>'yes');
  return pool.map(p=>p[kind]).filter(valueExistsV2);
}
function hasUsefulFilterV2(pool, kind){
  if(kind==='stock' || kind==='price') return pool.length>0;
  const vals=[...new Set(fieldValuesV2(pool, kind).map(String))];
  return vals.length>1;
}
function fieldElementV2(id){
  const el=document.getElementById(id);
  if(!el)return null;
  return el.closest('.field') || el.parentElement;
}
function setFieldVisibleV2(id, show){
  const field=fieldElementV2(id);
  if(field) field.classList.toggle('smart-hidden', !show);
}
function setLabelV2(id, text){
  const field=fieldElementV2(id);
  const label=field?.querySelector('label');
  if(label) label.textContent=text;
  const el=document.getElementById(id);
  if(el && el.options && el.options.length) el.options[0].textContent=text;
}
function fillSelectV2(id, values, placeholder){
  const el=document.getElementById(id);
  if(!el)return;
  const current=el.value;
  const vals=[...new Set(values.filter(valueExistsV2).map(String))]
    .sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
  el.innerHTML='<option value="">'+placeholder+'</option>'+vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if(vals.includes(current)) el.value=current;
}
function ensureLengthFilterV2(){
  if(document.getElementById('lengthFilter')) return;
  const before=document.getElementById('uFilter')?.closest('.field') || document.getElementById('portsFilter')?.closest('.field');
  const div=document.createElement('div');
  div.className='field';
  div.id='lengthField';
  div.innerHTML='<label>Длина</label><select id="lengthFilter" onchange="applyFilters()"><option value="">Длина</option></select>';
  if(before && before.parentNode) before.parentNode.insertBefore(div,before);
}
function updateLabelsForKindV2(kind){
  setLabelV2('typeFilter','Тип');
  setLabelV2('warrantyFilter','Гарантия');
  setLabelV2('uFilter','U');
  setLabelV2('depthFilter','Глубина');
  setLabelV2('widthFilter','Ширина');
  setLabelV2('doorFilter','Дверь');
  setLabelV2('catFilter','Категория');
  setLabelV2('shieldFilter','Экран');
  setLabelV2('colorFilter','Цвет');
  setLabelV2('lengthFilter','Длина');

  if(kind==='cable') setLabelV2('portsFilter','Количество пар');
  else if(kind==='patchcord') setLabelV2('portsFilter','Количество пар');
  else if(kind==='panels' || kind==='modules') setLabelV2('portsFilter','Количество портов');
  else setLabelV2('portsFilter','Количество');
}
function clearHiddenFilterValuesV2(){
  ALL_FILTER_IDS_V2.forEach(id=>{
    const field=fieldElementV2(id);
    const el=document.getElementById(id);
    if(field && field.classList.contains('smart-hidden') && el) el.value='';
  });
}
function updateCategoryAwareFiltersV2(){
  ensureLengthFilterV2();

  const pool=currentPoolV2();
  const kind=categoryKindV2();
  const allowed=new Set(CATEGORY_FILTERS_V2[kind] || CATEGORY_FILTERS_V2.default);

  // Раздел показываем всегда. Подраздел — только когда есть выбор.
  setFieldVisibleV2('sectionFilter', true);
  const subVals=[...new Set(pool.map(p=>p.subsection).filter(valueExistsV2))];
  setFieldVisibleV2('subFilter', !!(document.getElementById('sectionFilter')?.value || currentSection) && subVals.length>1);

  ALL_FILTER_IDS_V2.forEach(id=>setFieldVisibleV2(id,false));

  allowed.forEach(kindName=>{
    const id=FILTER_ID_BY_KIND_V2[kindName];
    if(!id)return;
    const show=hasUsefulFilterV2(pool, kindName);
    setFieldVisibleV2(id, show);
  });

  updateLabelsForKindV2(kind);

  // Заполняем длину отдельно
  fillSelectV2('lengthFilter', fieldValuesV2(pool,'length'), 'Длина');

  // Важные параметры для кабеля и патч-кордов не скрываем, если значения есть.
  if(kind==='patchcord' || kind==='cable'){
    ['catFilter','shieldFilter','colorFilter','lengthFilter','portsFilter'].forEach(id=>{
      const mapKind = id==='portsFilter' ? 'pairs' : id==='lengthFilter' ? 'length' : id.replace('Filter','');
      if(hasUsefulFilterV2(pool,mapKind)) setFieldVisibleV2(id,true);
    });
  }

  clearHiddenFilterValuesV2();

  const filtersBox=document.querySelector('.filters .filter-body') || document.querySelector('.filters');
  if(filtersBox && !document.getElementById('smartFilterNote')){
    const note=document.createElement('div');
    note.id='smartFilterNote';
    note.className='filter-section-note';
    note.textContent='Показаны только параметры выбранной группы товаров';
    filtersBox.prepend(note);
  }
}

// Добавляем длину в фильтрацию без переписывания остальной логики.
function applyLengthFilterV2(){
  const len=document.getElementById('lengthFilter')?.value || '';
  if(len){
    filtered=filtered.filter(p=>extractLengthV2(p)===len);
    page=1;
    if(typeof render==='function') render();
  }
}

const __oldApplyFiltersCategoryV2 = typeof applyFilters === 'function' ? applyFilters : null;
applyFilters = function(){
  if(__oldApplyFiltersCategoryV2) __oldApplyFiltersCategoryV2();
  applyLengthFilterV2();
  setTimeout(updateCategoryAwareFiltersV2,0);
};

const __oldChooseCatalogCategoryV2 = typeof chooseCatalog === 'function' ? chooseCatalog : null;
chooseCatalog = function(sec,sub){
  if(__oldChooseCatalogCategoryV2) __oldChooseCatalogCategoryV2(sec,sub);
  setTimeout(updateCategoryAwareFiltersV2,0);
};

const __oldOnSectionChangeCategoryV2 = typeof onSectionChange === 'function' ? onSectionChange : null;
onSectionChange = function(){
  if(__oldOnSectionChangeCategoryV2) __oldOnSectionChangeCategoryV2();
  setTimeout(updateCategoryAwareFiltersV2,0);
};

const __oldUpdateDynamicFiltersCategoryV2 = typeof updateDynamicFilters === 'function' ? updateDynamicFilters : null;
updateDynamicFilters = function(){
  if(__oldUpdateDynamicFiltersCategoryV2) __oldUpdateDynamicFiltersCategoryV2();
  setTimeout(updateCategoryAwareFiltersV2,0);
};

document.addEventListener('DOMContentLoaded',()=>setTimeout(updateCategoryAwareFiltersV2,150));

/* === HOTFIX 2026-07-09: stricter product search for U/depth/ports ===
   Fixes cases like "шкаф настенный 6u 350 стекло" returning 12U/15U cabinets.
   Alphanumeric tokens like 6U are now treated as one exact semantic token. */
function searchTokensStrict(q){
  const src=rawNorm(q);
  return (src.match(/\d+[a-zа-я]+|[a-zа-я]+\d+|\d+(?:\.\d+)?|[a-zа-я]+/gi)||[])
    .map(x=>x.toLowerCase())
    .filter(Boolean)
    .filter(x=>x!=='u' && x!=='ю');
}
function tokenMatchStrict(text,p,t){
  const uMatch=t.match(/^(\d+)(u|ю)$/i);
  if(uMatch) return String(p.u||'')===uMatch[1];

  const portMatch=t.match(/^(\d+)(порт|портов|port|ports)$/i);
  if(portMatch) return String(p.ports||'')===portMatch[1];

  if(/^\d+$/.test(t)){
    // Для шкафов число должно точно совпадать с U, глубиной, шириной или портами.
    if(String(p.u||'')===t || String(p.ports||'')===t || String(p.depth||'')===t || String(p.width||'')===t) return true;
    const re=new RegExp('(^|\\s)'+t+'(м|m|mm|мм)?(\\s|$)','i');
    return re.test(text);
  }
  return tokenMatch(text,p,t);
}
function matchesSmartSearch(p,q){
  const query=String(q||'').trim();
  if(!query)return true;
  if(codeArticleMatch(p,query))return true;
  const tokens=searchTokensStrict(query);
  if(!tokens.length)return true;
  const text=productSearchText(p);
  return tokens.every(t=>codeArticleMatch(p,t)||tokenMatchStrict(text,p,t));
}

/* Keep user on product page and show toast after adding from any place. */
function addToCartFrom(inputId,id){
  const el=document.getElementById(inputId);
  const q=Math.max(1,parseInt(el?.value||'1',10)||1);
  cart[id]=(cart[id]||0)+q;
  saveCart();
  showCartToast('Товар добавлен в корзину');
  const btn = (typeof event !== 'undefined' && event && event.currentTarget && event.currentTarget.tagName === 'BUTTON') ? event.currentTarget : null;
  if(btn){
    const oldText = btn.textContent;
    btn.textContent = 'Добавлено ✓';
    btn.classList.add('added');
    clearTimeout(btn.__addedTimer);
    btn.__addedTimer = setTimeout(()=>{ btn.textContent = oldText; btn.classList.remove('added'); }, 1200);
  }
}
function addToCart(id){addToCartFrom('q'+id,id)}
function openProduct(id){
  const p=PRODUCTS[id];
  const specs=cleanSpecs(p);
  const qid='qprod'+p.id;
  productContent.innerHTML=`<div class="product-head"><div style="flex:1"><p class="muted">Каталог / ${esc(p.article)} / код ${esc(p.code)}</p><h2>${esc(p.article)}</h2><div class="compact-name">${esc(shortName(p))}</div></div><div class="close" onclick="closeProduct()">×</div></div><div class="product-body">${typeof productDetailPhoto==='function'?productDetailPhoto(p):''}${typeof productImageHtml==='function'?productImageHtml(p):''}<div class="price">${rub.format(p.price)}</div><div class="avail">${stockTag(p)}</div><div class="specs">${specs.map(([k,v])=>`<div class="spec"><small>${esc(k)}</small>${esc(v)}</div>`).join('')}</div><div class="actions">${qtyHtml(qid,1)}<button class="btn full" onclick="addToCartFrom('${qid}',${p.id})">Добавить в корзину</button></div></div>`;
  const box=productModal.querySelector('.box');
  if(box)box.classList.add('product-box');
  productModal.classList.add('open');
}

/* === FINAL: add-to-cart toast for cards/list/product + stay on product === */
function showAddButtonFeedback(btn){
  if(!btn || btn.tagName !== 'BUTTON') return;
  const oldText = btn.dataset.oldText || btn.textContent;
  btn.dataset.oldText = oldText;
  btn.textContent = 'Добавлено ✓';
  btn.classList.add('added');
  clearTimeout(btn.__addedTimer);
  btn.__addedTimer = setTimeout(()=>{
    btn.textContent = btn.dataset.oldText || oldText;
    btn.classList.remove('added');
  },1200);
}
function addToCartFrom(inputId,id,btn){
  const p=PRODUCTS[id]; if(!p)return;
  const limit=typeof maxAvailable==='function'?maxAvailable(p):999999;
  if(limit<=0){alert('Товара нет в наличии и в транзите. Добавление в корзину недоступно.');return;}
  const el=document.getElementById(inputId);
  let q=Math.max(1,parseInt(el?.value||'1',10)||1);
  const current=Number(cart[id]||0);
  if(current+q>limit){
    const can=Math.max(0,limit-current);
    const msg=typeof availabilityLabel==='function'?availabilityLabel(p):'';
    alert(can>0 ? `Можно добавить ещё только ${can} ${p.unit||'шт.'}. ${msg}` : `В корзине уже максимальное количество. ${msg}`);
    if(el) el.value=can>0?can:1;
    return;
  }
  cart[id]=current+q;
  saveCart();
  if(typeof updateCartCount==='function') updateCartCount();
  if(typeof showCartToast==='function') showCartToast('Товар добавлен в корзину');
  else alert('Товар добавлен в корзину');
  showAddButtonFeedback(btn || (typeof event!=='undefined' && event ? event.currentTarget : null));
}
function addToCart(id,btn){addToCartFrom('q'+id,id,btn || (typeof event!=='undefined' && event ? event.currentTarget : null));}
function card(p){
  const max=typeof maxAvailable==='function'?maxAvailable(p):999999, unit=p.unit||'шт.';
  return`<div class="card"><div><div class="tagrow"><span class="tag">${esc(p.section)}</span>${p.subsection?`<span class="tag">${esc(p.subsection)}</span>`:''}${stockTag(p)}</div><div class="name" onclick="openProduct(${p.id})">${esc(p.name)}</div><div class="article">Арт. ${esc(p.article)} • код ${esc(p.code)} ${p.type?'• '+esc(p.type):''}</div><div class="meta">${esc(cardMeta(p))}</div></div><div>${priceHtml(p)}<div class="actions">${qtyHtml('q'+p.id,1,max,unit)}<button class="btn" ${max<=0?'disabled':''} onclick="addToCart(${p.id},this)">В корзину</button></div></div></div>`
}
function openProduct(id){
  const p=PRODUCTS[id];
  const specs=cleanSpecs(p);
  const qid='qprod'+p.id;
  const max=typeof maxAvailable==='function'?maxAvailable(p):999999, unit=p.unit||'шт.';
  productContent.innerHTML=`<div class="product-head"><div style="flex:1"><h2 class="product-title-only">${esc(p.name)}</h2></div><div class="close" onclick="closeProduct()">×</div></div><div class="product-body">${typeof productDetailPhoto==='function'?productDetailPhoto(p):''}${typeof productImageHtml==='function'?productImageHtml(p):''}<div class="product-buy"><div>${priceHtml(p)}<div class="avail">${stockTag(p)}</div></div><div class="actions">${qtyHtml(qid,1,max,unit)}<button class="btn full" ${max<=0?'disabled':''} onclick="addToCartFrom('${qid}',${p.id},this)">Добавить в корзину</button></div></div><h3 class="spec-title">Характеристики</h3><div class="specs">${specs.map(([k,v])=>`<div class="spec"><small>${esc(k)}</small>${esc(v)}</div>`).join('')}</div></div>`;
  const box=productModal.querySelector('.box');
  if(box)box.classList.add('product-box');
  productModal.classList.add('open');
}

/* === FIX: section selection must open subsection page, not mixed product list === */
function populateSubFilterForSectionFinal(sec){
  const sf=document.getElementById('subFilter');
  if(!sf) return;
  sf.innerHTML='<option value="">Все подразделы</option>';
  [...new Set(PRODUCTS.filter(p=>!sec||p.section===sec).map(p=>p.subsection).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'ru'))
    .forEach(v=>sf.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));
}
function showSectionPage(sec){
  const pageEl=ensureSectionPage();
  const data=sectionData(sec);
  const subs=Object.entries(data.subs).sort((a,b)=>a[0].localeCompare(b[0],'ru'));
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.add('hidden');
  currentSection=sec;
  currentSubsection='';
  if(window.sectionFilter) sectionFilter.value=sec;
  populateSubFilterForSectionFinal(sec);
  if(window.subFilter) subFilter.value='';
  const searchEl=document.getElementById('search');
  if(searchEl) searchEl.value='';
  const cards=subs.map(([sub,c])=>`<button class="sub-card" type="button" onclick="chooseCatalog('${esc(sec)}','${esc(sub)}')"><b>${esc(sub)}</b><span>${c.toLocaleString('ru-RU')} товаров</span></button>`).join('');
  pageEl.innerHTML=`<div class="section-hero"><p class="muted">Каталог / ${esc(sec)}</p><h2>${esc(sec)}</h2><p class="muted">Сначала выберите подраздел. Все товары раздела не смешиваются в одной выдаче.</p><button class="btn ghost" type="button" onclick="goHome()">← На главную</button></div><div class="sub-grid">${cards}</div>`;
  pageEl.classList.remove('hidden');
  document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
}
function onSectionChange(){
  const sec=sectionFilter.value||'';
  currentSection=sec;
  currentSubsection='';
  populateSubFilterForSectionFinal(sec);
  const searchEl=document.getElementById('search');
  if(searchEl) searchEl.value='';
  clearHiddenFilterValuesV2?.();
  updateDynamicFilters?.();
  updateFilterSummary?.();
  if(sec){
    showSectionPage(sec);
    return;
  }
  hideSectionPage?.();
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
  applyFilters();
}
function onSubsectionChange(){
  const sec=sectionFilter.value||currentSection||'';
  const sub=subFilter.value||'';
  if(sec && !sub){ showSectionPage(sec); return; }
  hideSectionPage?.();
  currentSection=sec;
  currentSubsection=sub;
  const searchEl=document.getElementById('search');
  if(searchEl) searchEl.value='';
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
  const title=document.getElementById('categoryTitle');
  if(title) title.textContent=sub?`${sec} / ${sub}`:(sec||'Все разделы');
  applyFilters();
}
function chooseCatalog(sec,sub){
  const targetSub=sub||'';
  closeCatalogDrawer?.();
  if(sec && !targetSub){
    showSectionPage(sec);
    return;
  }
  hideSectionPage?.();
  currentSection=sec||'';
  currentSubsection=targetSub;
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
  if(window.sectionFilter) sectionFilter.value=currentSection;
  populateSubFilterForSectionFinal(currentSection);
  if(window.subFilter) subFilter.value=currentSubsection;
  const searchEl=document.getElementById('search');
  if(searchEl) searchEl.value='';
  updateDynamicFilters?.();
  const title=document.getElementById('categoryTitle');
  if(title) title.textContent=currentSubsection?`${currentSection} / ${currentSubsection}`:(currentSection||'Все разделы');
  applyFilters();
  document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
}



/* === STABLE ROUTER / SEARCH / PRODUCT / CARD FINAL FIX === */
(function(){
  const $ = id => document.getElementById(id);
  const enc = v => encodeURIComponent(String(v||''));
  const dec = v => { try{return decodeURIComponent(String(v||''))}catch(e){return String(v||'')} };
  const safe = v => (typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const money = n => (typeof rub!=='undefined'&&rub&&rub.format)?rub.format(Number(n)||0):((Number(n)||0).toLocaleString('ru-RU')+' ₽');
  let routing = false;

  function unitOf(p){ return p && p.unit ? p.unit : 'шт.'; }
  function maxAvail(p){ return Math.max(Number(p?.qty||0), Number(p?.transit||0)); }
  function stockChip(p){ const u=unitOf(p); if(Number(p?.qty||0)>0) return `<span class="stock-chip ok">В наличии: ${safe(p.qty)} ${safe(u)}</span>`; if(Number(p?.transit||0)>0) return `<span class="stock-chip warn">Транзит: ${safe(p.transit)} ${safe(u)}</span>`; return `<span class="stock-chip order">Под заказ</span>`; }
  function hashFor(st){
    if(!st || st.view==='home') return '#home';
    if(st.view==='section') return '#section='+enc(st.section||'');
    if(st.view==='catalog') return '#catalog='+enc(st.section||'')+'&sub='+enc(st.subsection||'')+'&page='+(Number(st.page)||1);
    if(st.view==='search') return '#search='+enc(st.query||'')+'&page='+(Number(st.page)||1);
    if(st.view==='product') return '#product='+enc(st.id||0);
    if(st.view==='cart') return '#cart';
    return '#home';
  }
  function parseRoute(){
    const h=String(location.hash||'').replace(/^#/,'');
    if(!h || h==='home') return {view:'home'};
    const q=new URLSearchParams(h);
    if(h.startsWith('section=')) return {view:'section',section:dec(q.get('section'))};
    if(h.startsWith('catalog=')) return {view:'catalog',section:dec(q.get('catalog')),subsection:dec(q.get('sub')),page:Number(q.get('page'))||1};
    if(h.startsWith('search=')) return {view:'search',query:dec(q.get('search')||''),page:Number(q.get('page'))||1};
    if(h.startsWith('product=')) return {view:'product',id:Number(q.get('product'))||0};
    if(h==='cart') return {view:'cart'};
    return {view:'home'};
  }
  function currentRoute(){
    if(document.body.classList.contains('search-mode')) return {view:'search',query:($('search')?.value||$('homeSearch')?.value||''),page:page||1};
    if(currentSection && currentSubsection) return {view:'catalog',section:currentSection,subsection:currentSubsection,page:page||1};
    if(currentSection) return {view:'section',section:currentSection};
    return {view:'home'};
  }
  function setRoute(st,replace){ if(routing) return; try{ (replace?history.replaceState:history.pushState).call(history,st,'',location.pathname+location.search+hashFor(st)); }catch(e){} }
  function closeDrawer(){ try{closeCatalogDrawer()}catch(e){} document.querySelectorAll('.catalog-drawer,.drawer,.catalog-panel').forEach(el=>el.classList.remove('open','active','show')); document.body.classList.remove('drawer-open','catalog-open'); }
  function resetScroll(){ setTimeout(()=>window.scrollTo({top:0,behavior:'auto'}),0); }
  function scrollToResults(){ setTimeout(()=>{ const t=$('categoryTitle')||$('shopPage'); const h=(document.querySelector('.top,.topbar,header')?.getBoundingClientRect().height||84)+18; if(t){ const y=t.getBoundingClientRect().top+pageYOffset-h; scrollTo({top:Math.max(0,y),behavior:'auto'}); } },0); }
  function setMode(mode){ document.body.classList.remove('home-mode','section-mode','catalog-mode','search-mode','product-mode'); document.body.classList.add(mode+'-mode'); }
  function clearList(){ if($('products'))$('products').innerHTML=''; if($('pager'))$('pager').innerHTML=''; if($('resultCount'))$('resultCount').textContent='0'; }
  function ensureProductPage(){ let el=$('productPageReal'); if(!el){ el=document.createElement('section'); el.id='productPageReal'; el.className='product-real-page hidden'; ($('catalog')||document.body).appendChild(el); } return el; }
  function hideProductPage(){ $('productPageReal')?.classList.add('hidden'); $('productModal')?.classList.remove('open','desktop-product-open'); }

  window.renderCategoryTree = function(){
    const groups={}; PRODUCTS.forEach(p=>{const sec=p.section||'Без категории', sub=p.subsection||'Без подраздела'; groups[sec]=groups[sec]||{count:0,subs:{}}; groups[sec].count++; groups[sec].subs[sub]=(groups[sec].subs[sub]||0)+1;});
    const html=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([sec,data])=>`<div class="cat-section"><button class="cat-title" type="button" onclick="toggleCatSection(this)"><span>${safe(sec)}</span><small>${Number(data.count).toLocaleString('ru-RU')}</small></button><div class="sub-list"><button class="all-sub" type="button" onclick="chooseCatalog('${safe(sec)}','')"><span>Показать подразделы</span><em>${Object.keys(data.subs).length}</em></button>${Object.entries(data.subs).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([sub,c])=>`<button type="button" onclick="chooseCatalog('${safe(sec)}','${safe(sub)}')"><span>${safe(sub)}</span><em>${Number(c).toLocaleString('ru-RU')}</em></button>`).join('')}</div></div>`).join('');
    ['categoryTree','categoryTreeDrawer'].forEach(id=>{const r=$(id); if(r)r.innerHTML=html;});
  };

  function populateSub(sec,sub){ const sf=$('subFilter'); if(!sf)return; sf.innerHTML='<option value="">Все подразделы</option>'; [...new Set(PRODUCTS.filter(p=>!sec||p.section===sec).map(p=>p.subsection).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru')).forEach(v=>sf.insertAdjacentHTML('beforeend',`<option value="${safe(v)}">${safe(v)}</option>`)); if(sub) sf.value=sub; }

  function renderSection(sec,push){ closeDrawer(); hideProductPage(); currentSection=sec||''; currentSubsection=''; page=1; setMode('section'); $('homeLanding')?.classList.add('hidden'); $('shopPage')?.classList.add('hidden'); clearList(); if($('sectionFilter'))$('sectionFilter').value=sec||''; populateSub(sec,''); if($('search'))$('search').value=''; let el=$('sectionPage'); if(!el){el=document.createElement('section'); el.id='sectionPage'; el.className='section-page'; ($('shopPage')?.parentElement||$('catalog')||document.body).insertBefore(el,$('shopPage')||null);} const subs={}; PRODUCTS.filter(p=>p.section===sec).forEach(p=>{const s=p.subsection||'Без подраздела'; subs[s]=(subs[s]||0)+1;}); const cards=Object.entries(subs).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([s,c])=>`<button class="sub-card" type="button" onclick="chooseCatalog('${safe(sec)}','${safe(s)}')"><b>${safe(s)}</b><span>${Number(c).toLocaleString('ru-RU')} товаров</span></button>`).join(''); el.innerHTML=`<div class="section-hero"><p class="muted">Каталог / ${safe(sec)}</p><h2>${safe(sec)}</h2><p class="muted">Сначала выберите подраздел. Все товары раздела открываются отдельно внутри выбранного подраздела.</p><button class="catalog-back-btn" type="button" onclick="goHome()">← На главную</button></div><div class="sub-grid">${cards}</div>`; el.classList.remove('hidden'); if(push) setRoute({view:'section',section:sec},false); resetScroll(); }

  function renderCatalog(sec,sub,push,pn){ closeDrawer(); hideProductPage(); if(!sec || !sub) return renderSection(sec,push); currentSection=sec; currentSubsection=sub; page=Number(pn)||1; setMode('catalog'); $('sectionPage')?.classList.add('hidden'); $('homeLanding')?.classList.add('hidden'); $('shopPage')?.classList.remove('hidden'); if($('sectionFilter'))$('sectionFilter').value=sec; populateSub(sec,sub); if($('search'))$('search').value=''; const title=$('categoryTitle'); if(title) title.innerHTML=`<div class="catalog-page-header"><div><div class="catalog-title-label">Каталог</div><div>${safe(sec)} / ${safe(sub)}</div></div><button class="catalog-back-btn" type="button" onclick="goHome()">← На главную</button></div>`; filtered=PRODUCTS.filter(p=>p.section===sec && p.subsection===sub); try{updateDynamicFilters()}catch(e){} render(); if(push) setRoute({view:'catalog',section:sec,subsection:sub,page:page},false); scrollToResults(); }

  function renderSearch(q,push,pn){ closeDrawer(); hideProductPage(); currentSection=''; currentSubsection=''; page=Number(pn)||1; setMode('search'); $('sectionPage')?.classList.add('hidden'); $('homeLanding')?.classList.add('hidden'); $('shopPage')?.classList.remove('hidden'); if($('sectionFilter'))$('sectionFilter').value=''; populateSub('',''); if($('homeSearch'))$('homeSearch').value=q||''; if($('search'))$('search').value=q||''; const title=$('categoryTitle'); if(title) title.innerHTML=`<div class="catalog-page-header"><div><div class="catalog-title-label">Результаты поиска</div><div>Поиск: ${safe(q||'')}</div></div><button class="catalog-back-btn" type="button" onclick="goHome()">← На главную</button></div>`; filtered=PRODUCTS.filter(p=>matchesSmartSearch(p,q||'')); render(); if(push) setRoute({view:'search',query:q||'',page:page},false); scrollToResults(); }

  function renderHome(push){ closeDrawer(); hideProductPage(); currentSection=''; currentSubsection=''; page=1; filtered=[]; setMode('home'); $('sectionPage')?.classList.add('hidden'); $('shopPage')?.classList.add('hidden'); $('homeLanding')?.classList.remove('hidden'); clearList(); if($('homeSearch'))$('homeSearch').value=''; if($('search'))$('search').value=''; if(push) setRoute({view:'home'},false); resetScroll(); }

  window.chooseCatalog=function(sec,sub){ if(sec && sub) renderCatalog(sec,sub,true,1); else if(sec) renderSection(sec,true); else renderHome(true); };
  window.showSectionPage=function(sec){ renderSection(sec,true); };
  window.goHome=function(){ renderHome(true); };
  window.showHome=window.goHome;
  window.runHomeSearch=function(){ const q=($('homeSearch')?.value || $('search')?.value || '').trim(); if(!q){ renderHome(true); return; } renderSearch(q,true,1); };
  window.onSectionChange=function(){ const sec=$('sectionFilter')?.value||''; if(sec) renderSection(sec,true); else renderHome(true); };
  window.onSubsectionChange=function(){ const sec=$('sectionFilter')?.value||currentSection||''; const sub=$('subFilter')?.value||''; if(sec && sub) renderCatalog(sec,sub,true,1); else if(sec) renderSection(sec,true); else renderHome(true); };

  function updateTotal(inputId){ const inp=$(inputId); if(!inp)return; const wrap=inp.closest('.card, .product-real-page, .product-page-buy, .product-buy'); const box=wrap?.querySelector('.price-box-final'); if(!box)return; const price=Number(box.dataset.price||0), unit=box.dataset.unit||'шт.'; const n=Math.max(0,parseInt(inp.value||'0',10)||0); const line=box.querySelector('.total-price-line'); if(line) line.textContent=n>0?`Итого за ${n} ${unit}: ${money(price*n)}`:'Введите количество'; }
  window.qtyStep=function(inputId,delta){ const el=$(inputId); if(!el)return; const cur=parseInt(el.value||'0',10)||0; el.value=Math.max(1,cur+delta); updateTotal(inputId); };
  window.qtyHtml=function(inputId,value=1,max=0,unit='шт.'){ return `<div class="qty-stepper qty-stepper-final"><button type="button" onclick="qtyStep('${safe(inputId)}',-1)">−</button><input id="${safe(inputId)}" type="number" inputmode="numeric" min="1" value="${safe(value)}" oninput="updateQtyTotalFinal('${safe(inputId)}')"><button type="button" onclick="qtyStep('${safe(inputId)}',1)">+</button></div><span class="qty-unit">${safe(unit)}</span>`; };
  window.updateQtyTotalFinal=updateTotal;
  window.addToCartFrom=function(inputId,id,btn){ const p=PRODUCTS[id]; if(!p)return; const el=$(inputId); const q=parseInt(el?.value||'',10); if(!q || q<1){ if(typeof showCartToast==='function') showCartToast('Введите количество больше 0'); return; } const limit=maxAvail(p); if(limit<=0){ if(typeof showCartToast==='function') showCartToast('Товар под заказ'); return; } if(Number(cart[id]||0)+q>limit){ if(typeof showCartToast==='function') showCartToast('Количество больше доступного'); return; } cart[id]=Number(cart[id]||0)+q; saveCart(); if(typeof showCartToast==='function') showCartToast('Товар добавлен в корзину'); const b=btn || (typeof event!=='undefined'&&event?event.currentTarget:null); if(b){const old=b.textContent; b.textContent='Добавлено ✓'; setTimeout(()=>b.textContent=old,1000);} };
  window.addToCart=function(id,btn){ addToCartFrom('q'+id,id,btn); };

  function priceBox(p,qid){ const u=unitOf(p), pr=Number(p.price)||0; return `<div class="price-box-final" data-input="${safe(qid)}" data-price="${pr}" data-unit="${safe(u)}"><div class="unit-price-label">Цена за 1 ${safe(u)} с НДС</div><div class="unit-price-value">${money(pr)}</div><div class="total-price-line">Итого за 1 ${safe(u)}: ${money(pr)}</div></div>`; }
  window.card=function(p){ const qid='q'+p.id, max=maxAvail(p), u=unitOf(p); return `<div class="card product-card-final"><div class="card-main"><div class="name" onclick="openProduct(${p.id})">${safe(p.name)}</div><div class="code-stock-line"><span>Код: ${safe(p.code||p.article||'')}</span>${stockChip(p)}</div></div><div class="card-buy">${priceBox(p,qid)}<div class="card-control-row">${qtyHtml(qid,1,max,u)}<button class="btn" ${max<=0?'disabled':''} onclick="addToCart(${p.id},this)">В корзину</button></div></div></div>`; };

  window.renderPager=function(){ const pages=Math.ceil(filtered.length/PAGE_SIZE); const pager=$('pager'); if(!pager)return; if(pages<=1){pager.innerHTML='';return;} let html='',from=Math.max(1,page-2),to=Math.min(pages,page+2); if(page>1)html+=`<button onclick="setCatalogPage(${page-1})">←</button>`; for(let i=from;i<=to;i++) html+=`<button class="${i===page?'active':''}" onclick="setCatalogPage(${i})">${i}</button>`; if(page<pages)html+=`<button onclick="setCatalogPage(${page+1})">→</button>`; pager.innerHTML=html; };
  window.setCatalogPage=function(n){ page=Number(n)||1; render(); const st=currentRoute(); st.page=page; setRoute(st,false); scrollToResults(); };

  window.openProduct=function(id,skipPush){ const p=PRODUCTS[id]; if(!p)return; closeDrawer(); currentSection=p.section||currentSection||''; currentSubsection=p.subsection||currentSubsection||''; setMode('product'); $('homeLanding')?.classList.add('hidden'); $('shopPage')?.classList.add('hidden'); $('sectionPage')?.classList.add('hidden'); const el=ensureProductPage(); const qid='qprod'+p.id, u=unitOf(p), max=maxAvail(p); const specs=cleanSpecs(p).map(([k,v])=>`<div class="spec"><small>${safe(k)}</small>${safe(v)}</div>`).join(''); const photo=(typeof productDetailPhoto==='function'?productDetailPhoto(p):'') || (typeof productImageHtml==='function'?productImageHtml(p):''); el.innerHTML=`<div class="product-real-head"><button class="catalog-back-btn" type="button" onclick="history.length>1?history.back():goHome()">← Назад</button><h1>${safe(p.name)}</h1><div class="code-stock-line"><span>Код: ${safe(p.code||p.article||'')}</span>${stockChip(p)}</div></div><div class="product-real-grid"><div class="product-real-photo">${photo}</div><aside class="product-real-buy">${priceBox(p,qid)}<div class="card-control-row product-controls">${qtyHtml(qid,1,max,u)}<button class="btn" ${max<=0?'disabled':''} onclick="addToCartFrom('${qid}',${p.id},this)">Добавить в корзину</button></div><h2>Характеристики</h2><div class="specs">${specs}</div></aside></div>`; el.classList.remove('hidden'); setTimeout(()=>updateTotal(qid),0); if(!skipPush) setRoute({view:'product',id:p.id},false); resetScroll(); };

  window.closeProduct=function(){ history.length>1 ? history.back() : renderHome(true); };

  function route(st){ routing=true; try{ st=st||parseRoute(); if(st.view==='section') renderSection(st.section,false); else if(st.view==='catalog') renderCatalog(st.section,st.subsection,false,st.page); else if(st.view==='search') renderSearch(st.query||'',false,st.page); else if(st.view==='product') openProduct(st.id,true); else if(st.view==='cart'&&typeof openCart==='function') openCart(); else renderHome(false); } finally { routing=false; } }
  // Back/Forward is handled once by FINAL SINGLE ROUTER below.
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ try{renderCategoryTree()}catch(e){} const st=parseRoute(); history.replaceState(st,'',location.pathname+location.search+hashFor(st)); route(st); },80));
})();

/* === CHECKOUT, DELIVERY AND HOME PAYMENT BLOCK 2026-07-11 === */
(function(){
  const money=n=>(typeof rub!=='undefined'&&rub?.format)?rub.format(Number(n)||0):(Number(n||0).toLocaleString('ru-RU')+' ₽');
  const safe=v=>(typeof esc==='function'?esc(v):String(v??''));
  const totalProducts=()=>Object.entries(cart||{}).reduce((s,[id,q])=>s+(Number(PRODUCTS[id]?.price)||0)*Number(q||0),0);
  const deliveryMode=()=>document.querySelector('input[name="delivery"]:checked')?.value||'moscow';
  const deliveryCost=(sum,mode)=>mode==='moscow'?(sum>=30000?0:1000):mode==='pickup'?0:null;
  const draft={};
  function remember(){['checkoutCompany','checkoutInn','checkoutPerson','checkoutPhone','checkoutEmail','checkoutCity','checkoutAddress','comment'].forEach(id=>{const e=document.getElementById(id);if(e)draft[id]=e.value});draft.delivery=deliveryMode()}
  function restore(){Object.entries(draft).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.value=v});if(draft.delivery){const r=document.querySelector(`input[name="delivery"][value="${draft.delivery}"]`);if(r)r.checked=true}}
  function itemRow(id,q){const p=PRODUCTS[id],sum=Number(p.price||0)*q,max=Math.max(Number(p.qty||0),Number(p.transit||0)),src=typeof getProductImageSrc==='function'?getProductImageSrc(p):'';return `<article class="checkout-item"><button class="checkout-thumb" type="button" onclick="closeCart();openProduct(${id})">${src?`<img src="${safe(src)}" alt="" loading="lazy">`:'<span>Cabeus</span>'}</button><div class="checkout-item-main"><button type="button" onclick="closeCart();openProduct(${id})">${safe(p.name)}</button><small>Код: ${safe(p.code||p.article||'')} · ${Number(p.qty||0)>0?`В наличии: ${p.qty}`:Number(p.transit||0)>0?`В транзите: ${p.transit}`:'Под заказ'}</small><em>${money(p.price)} за ${safe(p.unit||'шт.')}</em></div><div class="checkout-qty"><button type="button" onclick="rememberCheckout();changeCartQty(${id},-1)">−</button><input type="number" min="1" ${max?`max="${max}"`:''} value="${q}" onchange="rememberCheckout();setCartQty(${id},this.value)"><button type="button" onclick="rememberCheckout();changeCartQty(${id},1)">+</button></div><b class="checkout-line-total">${money(sum)}</b><button class="checkout-remove" type="button" aria-label="Удалить" onclick="rememberCheckout();delete cart[${id}];saveCart();openCart()">×</button></article>`}
  window.rememberCheckout=remember;
  window.updateCheckoutTotals=function(){const sum=totalProducts(),mode=deliveryMode(),cost=deliveryCost(sum,mode),grand=sum+(cost||0),left=Math.max(0,30000-sum);const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val};set('checkoutProductsTotal',money(sum));set('checkoutDeliveryTotal',cost==null?'Рассчитает менеджер':cost===0?'Бесплатно':money(cost));set('cartTotal',money(grand));const progress=document.getElementById('deliveryProgress');if(progress)progress.innerHTML=mode==='moscow'?(left?`Добавьте товаров ещё на <b>${money(left)}</b> — доставка будет бесплатной.`:'<b>Бесплатная доставка по Москве доступна.</b>'):(mode==='pickup'?'<b>Самовывоз бесплатный.</b>':'Предварительный итог указан без стоимости доставки.');const address=document.getElementById('checkoutAddress')?.closest('label');if(address)address.classList.toggle('hidden',mode==='pickup');remember();if(typeof updateEmailLink==='function')updateEmailLink()};
  window.openCart=function(){remember();const entries=Object.entries(cart||{}).filter(([id,q])=>PRODUCTS[id]&&Number(q)>0);const box=document.querySelector('#cartModal .cart-modal-box');if(!box)return;box.innerHTML=`<div class="checkout-head"><div><p>Оформление заказа</p><h2>Корзина <span>${entries.length}</span></h2></div><button class="checkout-close" type="button" onclick="closeCart()">×</button></div><div class="checkout-steps"><span class="active">1. Корзина</span><span>2. Контакты</span><span>3. Доставка</span></div>${entries.length?`<div class="checkout-layout"><main><div class="checkout-items">${entries.map(([id,q])=>itemRow(id,Number(q))).join('')}</div><section class="checkout-form"><h3>Контактные данные</h3><div class="checkout-fields"><label>Организация или ФИО<input id="checkoutCompany" type="text" placeholder="Название организации"></label><label>ИНН<input id="checkoutInn" type="text" inputmode="numeric" placeholder="Необязательно"></label><label>Контактное лицо<input id="checkoutPerson" type="text"></label><label>Телефон<input id="checkoutPhone" type="tel"></label><label>Email<input id="checkoutEmail" type="email"></label><label>Город<input id="checkoutCity" type="text" value="Москва"></label></div><h3>Получение заказа</h3><div class="delivery-options"><label><input type="radio" name="delivery" value="moscow" checked onchange="updateCheckoutTotals()"><span><b>Москва, в пределах МКАД</b><small>Бесплатно от 30 000 ₽, иначе 1 000 ₽</small></span></label><label><input type="radio" name="delivery" value="outside" onchange="updateCheckoutTotals()"><span><b>За пределами МКАД</b><small>Стоимость рассчитает менеджер</small></span></label><label><input type="radio" name="delivery" value="region" onchange="updateCheckoutTotals()"><span><b>Другой регион</b><small>Транспортной компанией</small></span></label><label><input type="radio" name="delivery" value="pickup" onchange="updateCheckoutTotals()"><span><b>Самовывоз</b><small>Бесплатно</small></span></label></div><label class="checkout-address">Адрес доставки<input id="checkoutAddress" type="text" placeholder="Улица, дом, подъезд, этаж"></label><label class="checkout-address">Комментарий<textarea id="comment" placeholder="Сроки, разгрузка, дополнительные пожелания"></textarea></label></section></main><aside class="checkout-summary"><h3>Ваш заказ</h3><div><span>Товары</span><b id="checkoutProductsTotal"></b></div><div><span>Доставка</span><b id="checkoutDeliveryTotal"></b></div><div class="delivery-progress" id="deliveryProgress"></div><div class="checkout-grand"><span>Итого</span><b id="cartTotal"></b></div><small>Наличие, сроки транзита и цена подтверждаются менеджером перед выставлением счёта.</small><button class="btn full" type="button" onclick="submitCheckoutRequest()">Отправить заявку</button><button class="btn secondary full" type="button" onclick="copyRequest()">Скопировать заказ</button><a id="emailLink" class="btn secondary full" href="#">Отправить на email</a><p id="copied" class="muted hidden">Заявка скопирована.</p></aside></div>`:'<div class="checkout-empty"><b>Корзина пока пустая</b><span>Добавьте товары из каталога или конструктора комплекта.</span><button class="btn" onclick="closeCart();openCatalogDrawer()">Перейти в каталог</button></div>'}`;restore();updateCheckoutTotals();cartModal.classList.add('open')};
  window.__checkoutOpenCart=window.openCart;
  function requestText(){const sum=totalProducts(),mode=deliveryMode(),cost=deliveryCost(sum,mode),names={moscow:'Москва, в пределах МКАД',outside:'За пределами МКАД',region:'Другой регион / транспортная компания',pickup:'Самовывоз'},lines=['Заявка Cabeus',''];Object.entries(cart||{}).filter(([id,q])=>PRODUCTS[id]&&Number(q)>0).forEach(([id,q])=>{const p=PRODUCTS[id];lines.push(`${p.code||p.article} — ${p.name} — ${q} ${p.unit||'шт.'} — ${money(Number(p.price||0)*q)}`)});lines.push('',`Товары: ${money(sum)}`,`Получение: ${names[mode]}`,`Доставка: ${cost==null?'рассчитывает менеджер':cost===0?'бесплатно':money(cost)}`,`Предварительный итог: ${money(sum+(cost||0))}`);[['checkoutCompany','Организация'],['checkoutInn','ИНН'],['checkoutPerson','Контакт'],['checkoutPhone','Телефон'],['checkoutEmail','Email'],['checkoutCity','Город'],['checkoutAddress','Адрес'],['comment','Комментарий']].forEach(([id,label])=>{const v=document.getElementById(id)?.value?.trim();if(v)lines.push(`${label}: ${v}`)});return lines.join('\n')}
  window.copyRequest=async function(){remember();try{await navigator.clipboard.writeText(requestText());document.getElementById('copied')?.classList.remove('hidden')}catch(e){prompt('Скопируйте заявку:',requestText())}};
  window.submitCheckoutRequest=function(){remember();const phone=document.getElementById('checkoutPhone'),email=document.getElementById('checkoutEmail');if(!phone?.value.trim()&&!email?.value.trim()){phone?.focus();if(typeof showCartToast==='function')showCartToast('Укажите телефон или email');return}location.href=`mailto:sales@cabeus.ru?subject=${encodeURIComponent('Заявка с каталога Cabeus')}&body=${encodeURIComponent(requestText())}`};
  function injectHome(){const home=document.getElementById('homeLanding');if(home&&!document.getElementById('payment-delivery'))home.insertAdjacentHTML('beforeend',`<section class="payment-delivery" id="payment-delivery"><div class="payment-heading"><p>Условия заказа</p><h2>Оплата и доставка</h2><span>Для организаций и проектных заказов</span></div><div class="payment-grid"><article><i>₽</i><b>Безналичная оплата</b><span>Оплата по счёту. Все цены указаны с НДС.</span></article><article><i>✓</i><b>Бесплатно от 30 000 ₽</b><span>По Москве в пределах МКАД.</span></article><article><i>→</i><b>Москва — 1 000 ₽</b><span>При заказе менее 30 000 ₽.</span></article><article><i>⌖</i><b>За МКАД и по России</b><span>Стоимость рассчитывает менеджер по адресу и удалённости.</span></article></div><div class="payment-note"><div><b>Самовывоз — бесплатно.</b><span>Сроки, разгрузка и подъём согласовываются отдельно.</span></div><button class="btn" type="button" onclick="openCatalogDrawer()">Перейти в каталог</button></div></section>`);const nav=document.querySelector('.nav');if(nav&&!nav.querySelector('.header-payment-link'))nav.querySelector('.cart')?.insertAdjacentHTML('beforebegin','<a class="header-payment-link" href="#payment-delivery" onclick="if(typeof goHome===\'function\')goHome()">Оплата и доставка</a>')}
  document.addEventListener('DOMContentLoaded',injectHome);if(document.readyState!=='loading')injectHome();
})();

/* Checkout renderer must win over legacy cart renderers above. */
if(window.__checkoutOpenCart)window.openCart=window.__checkoutOpenCart;

/* === STABLE FILTER ENGINE 2026-07-11 ===
   Single final implementation. It intentionally does not register route/history
   listeners and leaves donorDescription/donorSpecs rendering untouched. */
(function(){
  const ids=['typeFilter','stockFilter','minPrice','maxPrice','warrantyFilter','uFilter','portsFilter','catFilter','shieldFilter','colorFilter','depthFilter','widthFilter','doorFilter','lengthFilter'];
  const byKind={type:'typeFilter',stock:'stockFilter',price:'minPrice',warranty:'warrantyFilter',u:'uFilter',ports:'portsFilter',cat:'catFilter',shield:'shieldFilter',color:'colorFilter',depth:'depthFilter',width:'widthFilter',door:'doorFilter',length:'lengthFilter'};
  const allowed={
    cabinet:['type','u','width','depth','door','color','warranty','price','stock'],
    cable:['type','ports','cat','shield','color','warranty','price','stock'],
    patchcord:['type','length','color','cat','shield','warranty','price','stock'],
    panels:['type','ports','cat','shield','color','warranty','price','stock'],
    optical:['type','ports','length','color','warranty','price','stock'],
    default:['type','ports','cat','shield','color','warranty','price','stock']
  };
  const clean=v=>v==null?'':String(v).trim();
  const present=v=>{const s=clean(v).toLowerCase();return s!==''&&s!=='0'&&s!=='0.00'&&s!=='null'&&s!=='undefined'};
  const spec=(p,names)=>{const d=p&&p.donorSpecs&&typeof p.donorSpecs==='object'?p.donorSpecs:{};for(const name of names){if(present(d[name]))return clean(d[name])}return ''};
  function dimensions(p){
    const text=[p.name,p.article].filter(Boolean).join(' ');
    const m=text.match(/(\d{2,4})\s*[xх×]\s*(\d{2,4})\s*[xх×]\s*(\d{2,4})\s*(?:mm|мм)?/i);
    return m?{width:m[1],depth:m[2],height:m[3]}:{width:'',depth:'',height:''};
  }
  function doorValue(p){
    const raw=clean(spec(p,['Двери','Тип двери','Передняя дверь'])||p.door).toLowerCase().replace(/ё/g,'е');
    if(!raw)return '';
    if(/стекл/.test(raw)&&/(металл|перфор|сплош)/.test(raw))return 'стекло + металл';
    if(/стекл/.test(raw))return 'стекло';
    if(/перфор/.test(raw))return 'перфорированный металл';
    if(/металл|сплош/.test(raw))return 'металл';
    return raw;
  }
  function lengthValue(p){
    const direct=spec(p,['Длина, м','Длина, метр','Длина кабеля, м','Длина']);
    if(present(direct)){const m=direct.match(/\d+(?:[.,]\d+)?/);if(m)return m[0].replace(',','.')+' м'}
    const src=[p.article,p.name].filter(Boolean).join(' ');
    const m=src.match(/(?:^|[-\s])(\d+(?:[.,]\d+)?)\s*(?:m|м)(?=[-\s,;)]|$)/i);
    return m?m[1].replace(',','.')+' м':'';
  }
  function value(p,k){
    if(k==='width')return clean(p.width)||dimensions(p).width;
    if(k==='depth')return clean(spec(p,['Глубина, мм','Глубина'])||p.depth)||dimensions(p).depth;
    if(k==='u')return clean(spec(p,['Высота, U','Высота U','Количество юнитов'])||p.u);
    if(k==='ports')return clean(spec(p,['Количество портов','Кол-во портов','Количество пар','Кол-во пар'])||p.ports);
    if(k==='door')return doorValue(p);
    if(k==='length')return lengthValue(p);
    if(k==='cat')return clean(spec(p,['Категория','Категория кабеля'])||p.cat).replace(/^cat\s*/i,'');
    if(k==='shield')return clean(spec(p,['Экранирование','Тип экранирования','Экран'])||p.shield).toUpperCase();
    return clean(p[k]);
  }
  function scope(){
    const sec=clean(document.getElementById('sectionFilter')?.value||currentSection);
    const sub=clean(document.getElementById('subFilter')?.value||currentSubsection);
    return PRODUCTS.filter(p=>(!sec||p.section===sec)&&(!sub||p.subsection===sub));
  }
  function kind(){
    const s=clean(document.getElementById('sectionFilter')?.value||currentSection).toLowerCase();
    const sub=clean(document.getElementById('subFilter')?.value||currentSubsection).toLowerCase();
    const t=s+' '+sub;
    if(/шкаф|стойк/.test(t))return 'cabinet';
    if(/патч.?корд|шнур/.test(t)&&!/оптик/.test(t))return 'patchcord';
    if(/витая пара|кабель медн|многопар/.test(t))return 'cable';
    if(/патч.?панел|кросс|модул|розет/.test(t)&&!/оптик/.test(t))return 'panels';
    if(/оптик|волокон/.test(t))return 'optical';
    return 'default';
  }
  function unique(pool,k){return [...new Set(pool.map(p=>value(p,k)).filter(present))].sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}))}
  function field(id){const el=document.getElementById(id);return el&&(el.closest('.field')||el.parentElement)}
  function show(id,on){field(id)?.classList.toggle('smart-hidden',!on)}
  function options(id,vals,label){
    const el=document.getElementById(id);if(!el)return;
    const old=el.value;el.innerHTML=`<option value="">${label}</option>`+vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    el.value=vals.includes(old)?old:'';
  }
  function label(id,text){const f=field(id);if(f?.querySelector('label'))f.querySelector('label').textContent=text}
  function useful(pool,k){if(k==='price'||k==='stock')return pool.length>0;return unique(pool,k).length>1}
  function refresh(){
    const pool=scope(),k=kind(),permit=new Set(allowed[k]||allowed.default);
    options('typeFilter',unique(pool,'type'),'Любой тип');
    options('warrantyFilter',unique(pool,'warranty'),'Любая');
    options('uFilter',unique(pool,'u'),'U');
    options('portsFilter',unique(pool,'ports'),k==='cable'?'Количество пар':k==='panels'?'Количество портов':'Количество');
    options('catFilter',unique(pool,'cat'),'Категория');
    options('shieldFilter',unique(pool,'shield'),'Экран');
    options('colorFilter',unique(pool,'color'),'Цвет');
    options('depthFilter',unique(pool,'depth'),'Глубина');
    options('widthFilter',unique(pool,'width'),'Ширина');
    options('doorFilter',unique(pool,'door'),'Тип двери');
    options('lengthFilter',unique(pool,'length'),'Длина');
    ids.forEach(id=>show(id,false));
    permit.forEach(k2=>{const id=byKind[k2];if(id)show(id,useful(pool,k2));if(k2==='price')show('maxPrice',pool.length>0)});
    label('portsFilter',k==='cable'?'Количество пар':k==='panels'?'Количество портов':'Количество');
    label('doorFilter','Тип двери');
    ids.forEach(id=>{const el=document.getElementById(id);if(el&&field(id)?.classList.contains('smart-hidden'))el.value=''});
    updateFilterSummary();
  }
  function stockOk(p,v){const q=Number(p.qty||0),t=Number(p.transit||0);return !v||(v==='stock'?q>0:v==='transit'?q<=0&&t>0:q<=0&&t<=0)}
  window.activeFilterCount=activeFilterCount=function(){return ids.reduce((n,id)=>n+(document.getElementById(id)?.value?1:0),0)};
  window.updateDynamicFilters=updateDynamicFilters=function(){refresh()};
  window.applyFilters=applyFilters=function(){
    const get=id=>clean(document.getElementById(id)?.value), sec=get('sectionFilter')||currentSection,sub=get('subFilter')||currentSubsection;
    const selected={type:get('typeFilter'),stock:get('stockFilter'),warranty:get('warrantyFilter'),u:get('uFilter'),ports:get('portsFilter'),cat:get('catFilter'),shield:get('shieldFilter'),color:get('colorFilter'),depth:get('depthFilter'),width:get('widthFilter'),door:get('doorFilter'),length:get('lengthFilter')};
    const q=get('search'),min=Number(get('minPrice')||0),max=get('maxPrice')?Number(get('maxPrice')):Infinity;
    filtered=PRODUCTS.filter(p=>matchesSmartSearch(p,q)&&(!sec||p.section===sec)&&(!sub||p.subsection===sub)&&(!selected.type||value(p,'type')===selected.type)&&(!selected.warranty||value(p,'warranty')===selected.warranty)&&(!selected.u||value(p,'u')===selected.u)&&(!selected.ports||value(p,'ports')===selected.ports)&&(!selected.cat||value(p,'cat')===selected.cat)&&(!selected.shield||value(p,'shield')===selected.shield)&&(!selected.color||value(p,'color')===selected.color)&&(!selected.depth||value(p,'depth')===selected.depth)&&(!selected.width||value(p,'width')===selected.width)&&(!selected.door||value(p,'door')===selected.door)&&(!selected.length||value(p,'length')===selected.length)&&Number(p.price||0)>=min&&Number(p.price||0)<=max&&stockOk(p,selected.stock));
    page=1;updateFilterSummary();render();
  };
  window.clearFilters=clearFilters=function(){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});const s=document.getElementById('sectionFilter'),sub=document.getElementById('subFilter'),q=document.getElementById('search');if(s)s.value=currentSection||'';if(sub)sub.value=currentSubsection||'';if(q)q.value='';refresh();applyFilters()};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,250));
})();

/* === EMERGENCY FINAL FORMAT FIX: cart rendering === */
(function(){
  const safe = v => (typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const money = n => (typeof rub!=='undefined'&&rub&&rub.format)?rub.format(Number(n)||0):((Number(n)||0).toLocaleString('ru-RU')+' ₽');
  const unitOf = p => p && p.unit ? p.unit : 'шт.';
  const availText = p => Number(p?.qty||0)>0 ? `Доступно: ${p.qty} ${unitOf(p)}` : (Number(p?.transit||0)>0 ? `Транзит: ${p.transit} ${unitOf(p)}` : 'Под заказ');
  const maxAvail = p => Math.max(Number(p?.qty||0), Number(p?.transit||0));
  window.openCart=function(){
    if(typeof closeCatalogDrawer==='function') { try{closeCatalogDrawer()}catch(e){} }
    let total=0;
    const entries=Object.entries(cart||{}).filter(([id,qty])=>PRODUCTS[id]&&Number(qty)>0);
    const rows=entries.map(([id,qty])=>{
      const p=PRODUCTS[id], unit=unitOf(p), q=Math.max(1,parseInt(qty,10)||1), sum=(Number(p.price)||0)*q, max=maxAvail(p);
      total+=sum;
      const qid='cartq'+id;
      return `<div class="cart-row-clean"><div><div class="cart-name">${safe(p.article||p.name)}</div><div class="cart-sub">код ${safe(p.code||'')} • ${safe(p.name||'')}</div><div class="cart-stock">${safe(availText(p))}</div></div><div class="cart-line"><div class="qty-wrap"><div class="qty-stepper"><button type="button" onclick="changeCartQty(${id},-1)">−</button><input id="${qid}" type="number" min="1" ${max>0?`max="${max}"`:''} value="${q}" onchange="setCartQty(${id},this.value)"><button type="button" onclick="changeCartQty(${id},1)">+</button></div><span class="qty-unit">${safe(unit)}</span></div><div class="cart-price">${money(sum)}</div><button class="cart-delete" type="button" onclick="if(typeof askDeleteCartItem==='function')askDeleteCartItem(${id});else if(confirm('Удалить товар из корзины?')){delete cart[${id}];saveCart();openCart();}">Удалить</button></div></div>`;
    }).join('');
    if(window.cartItems) cartItems.innerHTML=rows?`<div class="cart-list">${rows}</div>`:'<div class="empty-cart">Корзина пока пустая. Откройте каталог и добавьте товары.</div>';
    if(window.cartTotal) cartTotal.textContent=money(total);
    if(typeof updateEmailLink==='function') updateEmailLink();
    if(window.cartModal) cartModal.classList.add('open');
    try{ history.replaceState(history.state||{},'',location.href); }catch(e){}
  };
})();

/* === PRODUCT PAGE ROUTER/LAYOUT FINAL REPAIR 20260709 === */
(function(){
  const $ = id => document.getElementById(id);
  const safe = v => (typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const money = n => (typeof rub!=='undefined'&&rub&&rub.format)?rub.format(Number(n)||0):((Number(n)||0).toLocaleString('ru-RU')+' ₽');
  const unitOf = p => (p && p.unit) ? p.unit : 'шт.';
  const maxAvail = p => Math.max(Number(p?.qty||0), Number(p?.transit||0));
  function stockChip2(p){ const u=unitOf(p); if(Number(p?.qty||0)>0) return `<span class="stock-chip ok">В наличии: ${safe(p.qty)} ${safe(u)}</span>`; if(Number(p?.transit||0)>0) return `<span class="stock-chip warn">Транзит: ${safe(p.transit)} ${safe(u)}</span>`; return `<span class="stock-chip order">Под заказ</span>`; }
  function ensureProductPage2(){ let el=$('productPageReal'); if(!el){ el=document.createElement('section'); el.id='productPageReal'; el.className='product-real-page hidden'; ($('catalog')||document.body).appendChild(el); } return el; }
  function hideProductPage2(){ $('productPageReal')?.classList.add('hidden'); $('productModal')?.classList.remove('open','desktop-product-open'); }
  function setMode2(mode){ document.body.classList.remove('home-mode','section-mode','catalog-mode','search-mode','product-mode'); document.body.classList.add(mode+'-mode'); }
  function hashProduct(id){ return location.pathname+location.search+'#product='+encodeURIComponent(String(id||0)); }
  function setProductRoute(id,replace){ try{ (replace?history.replaceState:history.pushState).call(history,{view:'product',id:id},'',hashProduct(id)); }catch(e){} }
  function priceBox2(p,qid){ const u=unitOf(p), pr=Number(p.price)||0; return `<div class="price-box-final" data-input="${safe(qid)}" data-price="${pr}" data-unit="${safe(u)}"><div class="unit-price-label">Цена за 1 ${safe(u)} с НДС</div><div class="unit-price-value">${money(pr)}</div><div class="total-price-line">Итого за 1 ${safe(u)}: ${money(pr)}</div></div>`; }
  window.card=function(p){ const qid='q'+p.id, max=maxAvail(p), u=unitOf(p); return `<div class="card product-card-final"><div class="card-main"><div class="name" onclick="openProduct(${p.id})">${safe(p.name)}</div><div class="code-stock-line"><span>Код: ${safe(p.code||p.article||'')}</span>${stockChip2(p)}</div></div><div class="card-buy">${priceBox2(p,qid)}<div class="card-control-row"><div class="qty-wrap">${qtyHtml(qid,1,max,u)}<span class="qty-unit">${safe(u)}</span></div><button class="btn" ${max<=0?'disabled':''} onclick="addToCart(${p.id},this)">В корзину</button></div></div></div>`; };
  window.openProduct=function(id,skipPush){
    const p=PRODUCTS[id]; if(!p) return;
    try{closeCatalogDrawer()}catch(e){}
    currentSection=p.section||''; currentSubsection=p.subsection||'';
    setMode2('product');
    document.querySelector('.hero')?.classList.add('hidden-product-route');
    $('homeLanding')?.classList.add('hidden'); $('shopPage')?.classList.add('hidden'); $('sectionPage')?.classList.add('hidden'); $('info')?.classList.add('hidden');
    const stats=document.querySelector('.stats'); if(stats) stats.classList.add('hidden-product-route');
    const el=ensureProductPage2(); const qid='qprod'+p.id, u=unitOf(p), max=maxAvail(p);
    const specs=(typeof cleanSpecs==='function'?cleanSpecs(p):[]).map(([k,v])=>`<div class="spec"><small>${safe(k)}</small>${safe(v)}</div>`).join('');
    const photo=(typeof productDetailPhoto==='function'?productDetailPhoto(p):'') || (typeof productImageHtml==='function'?productImageHtml(p):'');
    el.innerHTML=`<div class="product-real-head"><button class="catalog-back-btn" type="button" onclick="history.length>1?history.back():goHome()">← Назад</button><h1>${safe(p.name)}</h1><div class="code-stock-line"><span>Код: ${safe(p.code||p.article||'')}</span>${stockChip2(p)}</div></div><div class="product-real-grid"><div class="product-real-photo">${photo || '<div class="muted">Изображение отсутствует</div>'}</div><aside class="product-real-buy">${priceBox2(p,qid)}<div class="card-control-row product-controls"><div class="qty-wrap">${qtyHtml(qid,1,max,u)}<span class="qty-unit">${safe(u)}</span></div><button class="btn" ${max<=0?'disabled':''} onclick="addToCartFrom('${qid}',${p.id},this)">Добавить в корзину</button></div><h2>Характеристики</h2><div class="specs">${specs}</div></aside></div>`;
    el.classList.remove('hidden'); setTimeout(()=>{try{updateTotal(qid)}catch(e){}},0); if(!skipPush) setProductRoute(p.id,false); setTimeout(()=>window.scrollTo({top:0,behavior:'auto'}),0);
  };
  const oldGoHome=window.goHome;
  window.goHome=function(){ document.querySelector('.hero')?.classList.remove('hidden-product-route'); document.querySelector('.stats')?.classList.remove('hidden-product-route'); $('info')?.classList.remove('hidden'); hideProductPage2(); if(typeof oldGoHome==='function') return oldGoHome(); };
  // Route visibility is restored by FINAL SINGLE ROUTER below.
})();

/* === PRODUCT PAGE SEARCH BAR FINAL ADD === */
(function(){
  const $ = id => document.getElementById(id);
  const safe = v => (typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const money = n => (typeof rub!=='undefined'&&rub&&rub.format)?rub.format(Number(n)||0):((Number(n)||0).toLocaleString('ru-RU')+' ₽');
  const unitOf = p => (p && p.unit) ? p.unit : 'шт.';
  const maxAvail = p => Math.max(Number(p?.qty||0), Number(p?.transit||0));
  function stockChip(p){ const u=unitOf(p); if(Number(p?.qty||0)>0) return `<span class="stock-chip ok">В наличии: ${safe(p.qty)} ${safe(u)}</span>`; if(Number(p?.transit||0)>0) return `<span class="stock-chip warn">Транзит: ${safe(p.transit)} ${safe(u)}</span>`; return `<span class="stock-chip order">Под заказ</span>`; }
  function ensureProductPage(){ let el=$('productPageReal'); if(!el){ el=document.createElement('section'); el.id='productPageReal'; el.className='product-real-page hidden'; ($('catalog')||document.body).appendChild(el); } return el; }
  function setMode(mode){ document.body.classList.remove('home-mode','section-mode','catalog-mode','search-mode','product-mode'); document.body.classList.add(mode+'-mode'); }
  function priceBox(p,qid){ const u=unitOf(p), pr=Number(p.price)||0; return `<div class="price-box-final" data-input="${safe(qid)}" data-price="${pr}" data-unit="${safe(u)}"><div class="unit-price-label">Цена за 1 ${safe(u)} с НДС</div><div class="unit-price-value">${money(pr)}</div><div class="total-price-line">Итого за 1 ${safe(u)}: ${money(pr)}</div></div>`; }
  window.runProductSearch=function(){ const q=($('productSearch')?.value||'').trim(); if(!q) return; if($('homeSearch')) $('homeSearch').value=q; if($('search')) $('search').value=q; if(typeof runHomeSearch==='function') runHomeSearch(); };
  window.openProduct=function(id,skipPush){
    const p=PRODUCTS[id]; if(!p) return;
    try{closeCatalogDrawer()}catch(e){}
    currentSection=p.section||''; currentSubsection=p.subsection||'';
    setMode('product');
    document.querySelector('.hero')?.classList.add('hidden-product-route');
    document.querySelector('.stats')?.classList.add('hidden-product-route');
    $('homeLanding')?.classList.add('hidden'); $('shopPage')?.classList.add('hidden'); $('sectionPage')?.classList.add('hidden'); $('info')?.classList.add('hidden');
    const el=ensureProductPage(); const qid='qprod'+p.id, u=unitOf(p), max=maxAvail(p);
    const specs=(typeof cleanSpecs==='function'?cleanSpecs(p):[]).map(([k,v])=>`<div class="spec"><small>${safe(k)}</small>${safe(v)}</div>`).join('');
    const photo=(typeof productDetailPhoto==='function'?productDetailPhoto(p):'') || (typeof productImageHtml==='function'?productImageHtml(p):'');
    el.innerHTML=`<div class="product-page-search"><div class="product-search-title">Быстрый поиск по каталогу</div><div class="product-search-row"><input id="productSearch" type="search" placeholder="Поиск: шкаф 15, патч-корд 1.5 синий, Cat6 UTP..." onkeydown="if(event.key==='Enter')runProductSearch()"><button class="btn" type="button" onclick="runProductSearch()">Найти</button></div></div><div class="product-real-head"><button class="catalog-back-btn" type="button" onclick="history.length>1?history.back():goHome()">← Назад</button><h1>${safe(p.name)}</h1><div class="code-stock-line"><span>Код: ${safe(p.code||p.article||'')}</span>${stockChip(p)}</div></div><div class="product-real-grid"><div class="product-real-photo">${photo || '<div class="muted">Изображение отсутствует</div>'}</div><aside class="product-real-buy">${priceBox(p,qid)}<div class="card-control-row product-controls"><div class="qty-wrap">${qtyHtml(qid,1,max,u)}<span class="qty-unit">${safe(u)}</span></div><button class="btn" ${max<=0?'disabled':''} onclick="addToCartFrom('${qid}',${p.id},this)">Добавить в корзину</button></div><h2>Характеристики</h2><div class="specs">${specs}</div></aside></div>`;
    el.classList.remove('hidden'); setTimeout(()=>{try{updateTotal(qid)}catch(e){}},0);
    if(!skipPush){ try{history.pushState({view:'product',id:p.id},'',location.pathname+location.search+'#product='+encodeURIComponent(String(p.id)));}catch(e){} }
    setTimeout(()=>window.scrollTo({top:0,behavior:'auto'}),0);
  };
})();

/* === FINAL SINGLE ROUTER + PRODUCT SEARCH SUGGESTIONS FIX 20260709 === */
(function(){
  const $ = (id) => document.getElementById(id);
  const enc = (v) => encodeURIComponent(String(v ?? ''));
  const dec = (v) => { try { return decodeURIComponent(String(v ?? '')); } catch(e) { return String(v ?? ''); } };
  const html = (v) => (typeof esc === 'function' ? esc(v) : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const money = (n) => (typeof rub !== 'undefined' && rub && rub.format) ? rub.format(Number(n)||0) : ((Number(n)||0).toLocaleString('ru-RU') + ' ₽');
  const unitOf = (p) => (p && p.unit) ? p.unit : 'шт.';
  const maxAvail = (p) => Math.max(Number(p?.qty || 0), Number(p?.transit || 0));
  let internalRouting = false;

  function productById(id){ return PRODUCTS && PRODUCTS[Number(id)] ? PRODUCTS[Number(id)] : null; }
  function stockChipFinal(p){
    const u = unitOf(p);
    if (Number(p?.qty || 0) > 0) return `<span class="stock-chip ok">В наличии: ${html(p.qty)} ${html(u)}</span>`;
    if (Number(p?.transit || 0) > 0) return `<span class="stock-chip warn">Транзит: ${html(p.transit)} ${html(u)}</span>`;
    return `<span class="stock-chip order">Под заказ</span>`;
  }
  function priceBoxFinal(p, qid){
    const u = unitOf(p), pr = Number(p.price) || 0;
    return `<div class="price-box-final" data-input="${html(qid)}" data-price="${pr}" data-unit="${html(u)}"><div class="unit-price-label">Цена за 1 ${html(u)} с НДС</div><div class="unit-price-value">${money(pr)}</div><div class="total-price-line">Итого за 1 ${html(u)}: ${money(pr)}</div></div>`;
  }
  function qtyBlockFinal(qid, max, u){
    if (typeof qtyHtml === 'function') return `<div class="qty-wrap">${qtyHtml(qid, 1, max, u)}<span class="qty-unit">${html(u)}</span></div>`;
    return `<div class="qty-wrap"><button type="button" onclick="decQty('${html(qid)}')">−</button><input id="${html(qid)}" value="1" inputmode="numeric"><button type="button" onclick="incQty('${html(qid)}')">+</button><span class="qty-unit">${html(u)}</span></div>`;
  }
  function hideProductPageFinal(){
    $('productPageReal')?.classList.add('hidden');
    $('productModal')?.classList.remove('open','desktop-product-open');
  }
  function ensureProductPageFinal(){
    let el = $('productPageReal');
    if (!el) {
      el = document.createElement('section');
      el.id = 'productPageReal';
      el.className = 'product-real-page hidden';
      ($('catalog') || document.body).appendChild(el);
    }
    return el;
  }
  function setBodyMode(mode){
    document.body.classList.remove('home-mode','section-mode','catalog-mode','search-mode','product-mode');
    document.body.classList.add(mode + '-mode');
  }
  function closeDrawerFinal(){
    try { if (typeof closeCatalogDrawer === 'function') closeCatalogDrawer(); } catch(e) {}
    document.querySelectorAll('.catalog-drawer,.drawer,.catalog-panel,.drawer-backdrop').forEach(el => el.classList.remove('open','active','show'));
    document.body.classList.remove('drawer-open','catalog-open');
  }
  function hideHomeBlocks(){
    document.querySelector('.hero')?.classList.add('hidden-product-route');
    document.querySelector('.stats')?.classList.add('hidden-product-route');
    $('info')?.classList.add('hidden');
    $('homeLanding')?.classList.add('hidden');
  }
  function showHomeBlocks(){
    document.querySelector('.hero')?.classList.remove('hidden-product-route');
    document.querySelector('.stats')?.classList.remove('hidden-product-route');
    $('info')?.classList.remove('hidden');
  }
  function clearProductAndSection(){
    hideProductPageFinal();
    $('sectionPage')?.classList.add('hidden');
  }
  function hashForRoute(st){
    if (!st || st.view === 'home') return '#home';
    if (st.view === 'section') return '#section=' + enc(st.section || '');
    if (st.view === 'catalog') return '#catalog=' + enc(st.section || '') + '&sub=' + enc(st.subsection || '') + '&page=' + (Number(st.page) || 1);
    if (st.view === 'search') return '#search=' + enc(st.query || '') + '&page=' + (Number(st.page) || 1);
    if (st.view === 'product') return '#product=' + enc(st.id || 0);
    if (st.view === 'cart') return '#cart';
    return '#home';
  }
  function parseRouteFinal(){
    const raw = String(location.hash || '').replace(/^#/, '');
    if (!raw || raw === 'home') return {view:'home'};
    const qs = new URLSearchParams(raw);
    if (raw.startsWith('section=')) return {view:'section', section: dec(qs.get('section'))};
    if (raw.startsWith('catalog=')) return {view:'catalog', section: dec(qs.get('catalog')), subsection: dec(qs.get('sub')), page: Number(qs.get('page')) || 1};
    if (raw.startsWith('search=')) return {view:'search', query: dec(qs.get('search') || ''), page: Number(qs.get('page')) || 1};
    if (raw.startsWith('product=')) return {view:'product', id: Number(qs.get('product')) || 0};
    if (raw === 'cart') return {view:'cart'};
    return {view:'home'};
  }
  function pushRoute(st, replace){
    if (internalRouting) return;
    const url = location.pathname + location.search + hashForRoute(st);
    try { (replace ? history.replaceState : history.pushState).call(history, st, '', url); } catch(e) {}
  }
  function resetScroll(){ setTimeout(() => window.scrollTo({top:0, behavior:'auto'}), 0); }
  function scrollToCatalogTitle(){
    setTimeout(() => {
      const target = $('categoryTitle') || $('shopPage') || $('catalog');
      const head = document.querySelector('.top, header');
      const offset = (head ? head.getBoundingClientRect().height : 82) + 18;
      if (target) window.scrollTo({top: Math.max(0, target.getBoundingClientRect().top + pageYOffset - offset), behavior:'auto'});
    }, 0);
  }
  function populateSubFinal(sec, sub){
    const sf = $('subFilter');
    if (!sf) return;
    sf.innerHTML = '<option value="">Все подразделы</option>';
    [...new Set(PRODUCTS.filter(p => !sec || p.section === sec).map(p => p.subsection).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,'ru'))
      .forEach(v => sf.insertAdjacentHTML('beforeend', `<option value="${html(v)}">${html(v)}</option>`));
    if (sub) sf.value = sub;
  }
  function clearListFinal(){
    if ($('products')) $('products').innerHTML = '';
    if ($('pager')) $('pager').innerHTML = '';
    if ($('resultCount')) $('resultCount').textContent = '0';
  }
  function routeHome(push){
    closeDrawerFinal();
    currentSection = ''; currentSubsection = ''; page = 1; filtered = [];
    setBodyMode('home');
    clearProductAndSection();
    showHomeBlocks();
    $('shopPage')?.classList.add('hidden');
    $('homeLanding')?.classList.remove('hidden');
    clearListFinal();
    if ($('homeSearch')) $('homeSearch').value = '';
    if ($('search')) $('search').value = '';
    if (push) pushRoute({view:'home'}, false);
    resetScroll();
  }
  function routeSection(sec, push){
    sec = sec || '';
    closeDrawerFinal(); clearProductAndSection(); showHomeBlocks();
    currentSection = sec; currentSubsection = ''; page = 1;
    setBodyMode('section');
    $('homeLanding')?.classList.add('hidden');
    $('shopPage')?.classList.add('hidden');
    clearListFinal();
    if ($('sectionFilter')) $('sectionFilter').value = sec;
    populateSubFinal(sec, '');
    if ($('search')) $('search').value = '';
    let el = $('sectionPage');
    if (!el) {
      el = document.createElement('section'); el.id = 'sectionPage'; el.className = 'section-page';
      ($('shopPage')?.parentElement || $('catalog') || document.body).insertBefore(el, $('shopPage') || null);
    }
    const subs = {};
    PRODUCTS.filter(p => p.section === sec).forEach(p => { const s = p.subsection || 'Без подраздела'; subs[s] = (subs[s] || 0) + 1; });
    const cards = Object.entries(subs).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([s,c]) => `<button class="sub-card" type="button" onclick="chooseCatalog('${html(sec)}','${html(s)}')"><b>${html(s)}</b><span>${Number(c).toLocaleString('ru-RU')} товаров</span></button>`).join('');
    el.innerHTML = `<div class="section-hero"><p class="muted">Каталог / ${html(sec)}</p><h2>${html(sec)}</h2><p class="muted">Сначала выберите подраздел. Все товары раздела открываются отдельно внутри выбранного подраздела.</p><button class="catalog-back-btn" type="button" onclick="goHome()">← На главную</button></div><div class="sub-grid">${cards}</div>`;
    el.classList.remove('hidden');
    if (push) pushRoute({view:'section', section: sec}, false);
    resetScroll();
  }
  function routeCatalog(sec, sub, push, pn){
    if (!sec || !sub) return routeSection(sec, push);
    closeDrawerFinal(); clearProductAndSection(); showHomeBlocks();
    currentSection = sec; currentSubsection = sub; page = Number(pn) || 1;
    setBodyMode('catalog');
    $('homeLanding')?.classList.add('hidden');
    $('shopPage')?.classList.remove('hidden');
    if ($('sectionFilter')) $('sectionFilter').value = sec;
    populateSubFinal(sec, sub);
    if ($('search')) $('search').value = '';
    const title = $('categoryTitle');
    if (title) title.innerHTML = `<div class="catalog-page-header"><div><div class="catalog-title-label">Каталог</div><div>${html(sec)} / ${html(sub)}</div></div><button class="catalog-back-btn" type="button" onclick="goHome()">← На главную</button></div>`;
    filtered = PRODUCTS.filter(p => p.section === sec && p.subsection === sub);
    try { if (typeof updateDynamicFilters === 'function') updateDynamicFilters(); } catch(e) {}
    try { render(); } catch(e) { console.error(e); }
    if (push) pushRoute({view:'catalog', section:sec, subsection:sub, page:page}, false);
    scrollToCatalogTitle();
  }
  function routeSearch(q, push, pn){
    q = String(q || '').trim();
    closeDrawerFinal(); clearProductAndSection(); showHomeBlocks();
    currentSection = ''; currentSubsection = ''; page = Number(pn) || 1;
    setBodyMode('search');
    $('homeLanding')?.classList.add('hidden');
    $('shopPage')?.classList.remove('hidden');
    if ($('sectionFilter')) $('sectionFilter').value = '';
    populateSubFinal('', '');
    if ($('homeSearch')) $('homeSearch').value = q;
    if ($('search')) $('search').value = q;
    const title = $('categoryTitle');
    if (title) title.innerHTML = `<div class="catalog-page-header"><div><div class="catalog-title-label">Результаты поиска</div><div>Поиск: ${html(q)}</div></div><button class="catalog-back-btn" type="button" onclick="goHome()">← На главную</button></div>`;
    filtered = PRODUCTS.filter(p => typeof matchesSmartSearch === 'function' ? matchesSmartSearch(p, q) : String((p.name||'') + ' ' + (p.article||'') + ' ' + (p.code||'')).toLowerCase().includes(q.toLowerCase()));
    try { render(); } catch(e) { console.error(e); }
    if (push) pushRoute({view:'search', query:q, page:page}, false);
    scrollToCatalogTitle();
  }
  function routeProduct(id, push){
    const p = productById(id); if (!p) return routeHome(push);
    closeDrawerFinal();
    currentSection = p.section || ''; currentSubsection = p.subsection || '';
    setBodyMode('product');
    hideHomeBlocks();
    $('shopPage')?.classList.add('hidden');
    $('sectionPage')?.classList.add('hidden');
    const el = ensureProductPageFinal();
    const qid = 'qprod' + p.id, u = unitOf(p), max = maxAvail(p);
    const specs = (typeof cleanSpecs === 'function' ? cleanSpecs(p) : []).map(([k,v]) => `<div class="spec"><small>${html(k)}</small>${html(v)}</div>`).join('');
    const donorDesc = String(p.donorDescription || p.tinkoDescription || '').trim();
    const aboutBlock = typeof productAboutHtml==='function'?productAboutHtml(p,donorDesc):'';
    const photo = (typeof productDetailPhoto === 'function' ? productDetailPhoto(p) : '') || (typeof productImageHtml === 'function' ? productImageHtml(p) : '');
    el.innerHTML = `<div class="product-page-search"><div class="product-search-title">Поиск по каталогу</div><div class="product-search-row"><input id="productSearch" type="search" autocomplete="off" placeholder="Название, код, артикул или характеристики"><button class="btn" type="button" onclick="runProductSearch()">Найти</button></div></div><nav class="product-breadcrumbs" aria-label="Навигация"><button type="button" onclick="history.length>1?history.back():goHome()">← Назад</button><span>Каталог</span><i>/</i><span>${html(p.section||'')}</span><i>/</i><span>${html(p.subsection||'')}</span></nav><div class="product-main-layout"><section class="product-media-panel"><div class="product-real-photo">${photo || '<div class="product-no-photo">Изображение отсутствует</div>'}</div></section><section class="product-summary-panel"><div class="product-summary-top"><h1>${html(p.name)}</h1><div class="product-identity"><span>Код товара: <b>${html(p.code||'—')}</b></span>${p.article&&p.article!==p.code?`<span>Артикул: <b>${html(p.article)}</b></span>`:''}</div><div class="product-availability">${stockChipFinal(p)}</div></div>${priceBoxFinal(p,qid)}<div class="product-purchase"><div class="product-purchase-label">Количество</div><div class="card-control-row product-controls">${qtyBlockFinal(qid,max,u)}<button class="btn product-add-main" ${max<=0?'disabled':''} onclick="addToCartFrom('${qid}',${p.id},this)">Добавить в корзину</button></div></div></section></div><div class="product-details-layout">${aboutBlock}<section class="product-content-section product-characteristics collapsed"><button type="button" class="characteristics-toggle" aria-expanded="false" onclick="toggleProductSpecs(this)"><span><small>Технические данные · ${(typeof cleanSpecs==='function'?cleanSpecs(p):[]).length} параметров</small><b>Характеристики</b></span><i>＋</i></button><div class="specs product-specs-collapsible">${specs}</div></section></div>${typeof compatibleAccessoriesHtml==='function'?compatibleAccessoriesHtml(p):''}<div class="mobile-buy-bar"><div><small>Цена с НДС</small><b>${money(Number(p.price)||0)}</b></div><button class="btn" ${max<=0?'disabled':''} onclick="addToCartFrom('${qid}',${p.id},this)">В корзину</button></div>`;
    el.classList.remove('hidden');
    attachSuggestToInput($('productSearch'));
    setTimeout(() => { try { updateTotal(qid); } catch(e) {} }, 0);
    if (push) pushRoute({view:'product', id:p.id}, false);
    resetScroll();
  }
  function routeFinal(st, replaceCurrent){
    internalRouting = true;
    try {
      st = st || parseRouteFinal();
      if (replaceCurrent) {
        try { history.replaceState(st, '', location.pathname + location.search + hashForRoute(st)); } catch(e) {}
      }
      if (st.view === 'section') routeSection(st.section, false);
      else if (st.view === 'catalog') routeCatalog(st.section, st.subsection, false, st.page);
      else if (st.view === 'search') routeSearch(st.query || '', false, st.page);
      else if (st.view === 'product') routeProduct(st.id, false);
      else if (st.view === 'cart') { routeHome(false); if (typeof openCart === 'function') openCart(); }
      else routeHome(false);
    } finally { internalRouting = false; }
  }

  window.goHome = function(){ routeHome(true); };
  window.chooseCatalog = function(sec, sub){ if (sub) routeCatalog(sec, sub, true, 1); else routeSection(sec, true); };
  window.runHomeSearch = function(){ const q = ($('homeSearch')?.value || $('search')?.value || '').trim(); if (q) routeSearch(q, true, 1); };
  window.runProductSearch = function(){ const q = ($('productSearch')?.value || '').trim(); if (q) routeSearch(q, true, 1); };
  window.openProduct = function(id, skipPush){ routeProduct(id, !skipPush); };
  window.setCatalogPage = function(n){ page = Number(n) || 1; try { render(); } catch(e) {} const st = parseRouteFinal(); if (st.view === 'catalog') st.page = page; else if (st.view === 'search') st.page = page; pushRoute(st, false); scrollToCatalogTitle(); };

  const oldOpenCart = window.openCart;
  window.openCart = function(){ if (typeof oldOpenCart === 'function') oldOpenCart(); };

  function suggestionRows(q){
    if (!q || q.trim().length < 2) return [];
    if (typeof findSuggestions === 'function') return findSuggestions(q).slice(0, 8);
    const nq = q.toLowerCase();
    return PRODUCTS.filter(p => String((p.article||'')+' '+(p.code||'')+' '+(p.name||'')).toLowerCase().includes(nq)).slice(0,8);
  }
  function ensureSuggestFor(input){
    if (!input) return null;
    let box = $(input.id + 'Suggest');
    if (!box) { box = document.createElement('div'); box.id = input.id + 'Suggest'; box.className = 'suggestions hidden'; input.parentElement.appendChild(box); }
    return box;
  }
  function renderSuggestFinal(input){
    const box = ensureSuggestFor(input); if (!box) return;
    const list = suggestionRows(input.value || '');
    if (!list.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.innerHTML = list.map(p => `<div class="suggest-item" onmousedown="chooseSuggestionFinal('${html(input.id)}',${p.id});return false">${suggestionThumbHtml(p)}<div class="suggest-copy"><div class="suggest-main">${html(p.article || '')} <span class="muted">код ${html(p.code || '')}</span></div><div class="suggest-sub">${html(p.name || '')}</div></div><div class="suggest-price">${money(p.price)}</div></div>`).join('');
    box.classList.remove('hidden');
  }
  function attachSuggestToInput(input){
    if (!input || input.dataset.finalSuggestAttached === '1') return;
    input.dataset.finalSuggestAttached = '1';
    input.setAttribute('autocomplete','off');
    ensureSuggestFor(input);
    input.addEventListener('input', () => renderSuggestFinal(input));
    input.addEventListener('focus', () => renderSuggestFinal(input));
    input.addEventListener('blur', () => setTimeout(() => $(input.id + 'Suggest')?.classList.add('hidden'), 180));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const q=(input.value||'').trim(); if(q) routeSearch(q,true,1); } });
  }
  window.chooseSuggestionFinal = function(inputId, id){
    const input = $(inputId); const p = productById(id); if (!p || !input) return;
    input.value = p.code || p.article || p.name || '';
    $(inputId + 'Suggest')?.classList.add('hidden');
    routeProduct(p.id, true);
  };
  window.chooseSuggestion = window.chooseSuggestionFinal;

  // Перехватываем старые дублирующие обработчики. Иначе они снова ломают Back/Forward.
  window.addEventListener('popstate', function(e){ e.stopImmediatePropagation(); routeFinal(e.state || parseRouteFinal(), false); }, true);
  window.addEventListener('hashchange', function(e){ e.stopImmediatePropagation(); routeFinal(parseRouteFinal(), true); }, true);

  document.addEventListener('DOMContentLoaded', function(){
    attachSuggestToInput($('homeSearch'));
    attachSuggestToInput($('search'));
    try { if (typeof renderCategoryTree === 'function') renderCategoryTree(); } catch(e) {}
    setTimeout(() => routeFinal(parseRouteFinal(), true), 120);
  });
})();

/* === HOTFIX: reliable live suggestions on product page search === */
(function(){
  function $(id){ return document.getElementById(id); }
  function esc2(v){ return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
  function money2(n){ try { return new Intl.NumberFormat('ru-RU').format(Number(n)||0) + ' ₽'; } catch(e){ return (Number(n)||0) + ' ₽'; } }
  function getProductSuggestBox(){
    let box = $('productSearchLiveSuggest');
    if(!box){
      box = document.createElement('div');
      box.id = 'productSearchLiveSuggest';
      box.className = 'suggestions product-live-suggest hidden';
      document.body.appendChild(box);
    }
    return box;
  }
  function productQueryList(q){
    q = String(q||'').trim();
    if(q.length < 2) return [];
    if(typeof findSuggestions === 'function'){
      try { return findSuggestions(q).slice(0,10); } catch(e) {}
    }
    const nq = q.toLowerCase().replace(/ё/g,'е');
    return (window.PRODUCTS || PRODUCTS || []).filter(p => {
      const hay = String([p.article,p.code,p.name,p.section,p.subsection,p.type].filter(Boolean).join(' ')).toLowerCase().replace(/ё/g,'е');
      return hay.includes(nq);
    }).slice(0,10);
  }
  function positionProductSuggest(input, box){
    const r = input.getBoundingClientRect();
    box.style.left = Math.max(8, r.left) + 'px';
    box.style.top = (r.bottom + 6) + 'px';
    box.style.width = Math.max(280, r.width) + 'px';
  }
  function renderProductSuggest(){
    const input = $('productSearch');
    const box = getProductSuggestBox();
    if(!input){ box.classList.add('hidden'); return; }
    const list = productQueryList(input.value);
    if(!list.length){ box.innerHTML=''; box.classList.add('hidden'); return; }
    positionProductSuggest(input, box);
    box.innerHTML = list.map(p => `<div class="suggest-item" data-product-id="${Number(p.id)}">${suggestionThumbHtml(p)}<div class="suggest-copy"><div class="suggest-main">${esc2(p.article || '')} <span class="muted">код ${esc2(p.code || '')}</span></div><div class="suggest-sub">${esc2(p.name || '')}</div></div><div class="suggest-price">${money2(p.price)}</div></div>`).join('');
    box.classList.remove('hidden');
  }
  document.addEventListener('input', function(e){ if(e.target && e.target.id === 'productSearch') renderProductSuggest(); }, true);
  document.addEventListener('focusin', function(e){ if(e.target && e.target.id === 'productSearch') renderProductSuggest(); }, true);
  document.addEventListener('keydown', function(e){
    if(e.target && e.target.id === 'productSearch' && e.key === 'Enter'){
      e.preventDefault();
      const q = e.target.value.trim();
      if(q && typeof routeSearch === 'function') routeSearch(q, true, 1);
      else if(q && typeof window.runHomeSearch === 'function') window.runHomeSearch();
    }
  }, true);
  document.addEventListener('mousedown', function(e){
    const item = e.target.closest && e.target.closest('#productSearchLiveSuggest .suggest-item');
    if(item){
      e.preventDefault();
      const id = Number(item.getAttribute('data-product-id'));
      getProductSuggestBox().classList.add('hidden');
      if(typeof routeProduct === 'function') routeProduct(id, true);
      else if(typeof window.openProduct === 'function') window.openProduct(id);
      return;
    }
    if(!e.target.closest || !e.target.closest('#productSearchLiveSuggest, #productSearch')) getProductSuggestBox().classList.add('hidden');
  }, true);
  window.addEventListener('scroll', function(){ const input=$('productSearch'), box=$('productSearchLiveSuggest'); if(input && box && !box.classList.contains('hidden')) positionProductSuggest(input, box); }, true);
  window.addEventListener('resize', function(){ const input=$('productSearch'), box=$('productSearchLiveSuggest'); if(input && box && !box.classList.contains('hidden')) positionProductSuggest(input, box); });
})();

function suggestionThumbHtml(p){
  const src=typeof getProductImageSrc==='function'?getProductImageSrc(p):'';
  return src?`<span class="suggest-thumb"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.closest('.suggest-thumb')?.classList.add('no-image');this.remove()"></span>`:'<span class="suggest-thumb no-image" aria-hidden="true">C</span>';
}

/* === PRODUCT IMAGES BY CODE MANIFEST === */
(function(){
  function normCode(v){ return String(v || '').trim().toLowerCase().replace(/с/g,'c'); }
  function firstImageFromManifest(code){
    const map = window.PRODUCT_IMAGES_BY_CODE || {};
    const val = map[normCode(code)] || map[String(code || '').trim()];
    if(Array.isArray(val)) return val[0] || '';
    return val || '';
  }
  function imageForProduct(p){
    if(!p) return '';
    return firstImageFromManifest(p.code) || p.img || '';
  }
  try {
    (window.PRODUCTS || PRODUCTS || []).forEach(function(p){
      const src = imageForProduct(p);
      if(src) p.img = src;
    });
  } catch(e) {}
  window.getProductImageSrc = imageForProduct;
  window.productImageHtml = function(p){
    const src = imageForProduct(p);
    return src ? `<div class="product-photo"><img src="${src}" alt="${esc(p.name || p.article || '')}" loading="lazy" onerror="this.closest('.product-photo')?.remove()"></div>` : '';
  };
  window.cardImageHtml = function(p){
    const src = imageForProduct(p);
    return src ? `<div class="card-img" onclick="openProduct(${Number(p.id)})"><img src="${src}" alt="${esc(p.name || p.article || '')}" loading="lazy" onerror="this.closest('.card-img')?.remove()"></div>` : '';
  };
  window.productCardPhoto = function(p){
    const src = imageForProduct(p);
    return src ? `<div class="product-card-photo" onclick="openProduct(${Number(p.id)})"><img src="${src}" alt="${esc(p.name || p.article || '')}" loading="lazy" onerror="this.closest('.product-card-photo')?.remove()"></div>` : '';
  };
  window.productDetailPhoto = function(p){
    const src = imageForProduct(p);
    const alt = esc(p && (p.name || p.article || '') || '');
    const safeSrc = String(src || '').replace(/'/g, '%27');
    return src ? `<button class="product-detail-photo product-photo-zoom" type="button" onclick="openImageLightbox('${safeSrc}', '${alt.replace(/'/g, '&#39;')}')"><img src="${src}" alt="${alt}" loading="lazy" onerror="this.closest('.product-detail-photo')?.remove()"><span class="photo-hint">Нажмите, чтобы увеличить</span></button>` : '';
  };

  window.openImageLightbox = function(src, alt){
    if(!src) return;
    let box = document.getElementById('imageLightbox');
    if(!box){
      box = document.createElement('div');
      box.id = 'imageLightbox';
      box.className = 'image-lightbox';
      box.innerHTML = `<div class="image-lightbox-box" role="dialog" aria-modal="true"><button class="image-lightbox-close" type="button" aria-label="Закрыть">×</button><img alt=""></div>`;
      document.body.appendChild(box);
      box.addEventListener('click', function(e){ if(e.target === box || e.target.classList.contains('image-lightbox-close')) closeImageLightbox(); });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeImageLightbox(); });
    }
    const img = box.querySelector('img');
    img.src = src;
    img.alt = alt || '';
    box.classList.add('open');
    document.body.classList.add('lightbox-open');
  };

  window.closeImageLightbox = function(){
    const box = document.getElementById('imageLightbox');
    if(box){ box.classList.remove('open'); const img=box.querySelector('img'); if(img) img.removeAttribute('src'); }
    document.body.classList.remove('lightbox-open');
  };
})();

/* === CATALOG CARD THUMBNAILS 2026-07-11 === */
(function(){
  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  const money=n=>typeof rub!=='undefined'?rub.format(Number(n)||0):`${Number(n||0).toLocaleString('ru-RU')} ₽`;
  const unit=p=>p?.unit||'шт.';
  const max=p=>Math.max(Number(p?.qty||0),Number(p?.transit||0));
  const stock=p=>Number(p?.qty||0)>0?`<span class="stock-chip ok">В наличии: ${safe(p.qty)} ${safe(unit(p))}</span>`:Number(p?.transit||0)>0?`<span class="stock-chip warn">Транзит: ${safe(p.transit)} ${safe(unit(p))}</span>`:'<span class="stock-chip order">Под заказ</span>';
  const price=(p,qid)=>`<div class="price-box-final" data-input="${qid}" data-price="${Number(p.price)||0}" data-unit="${safe(unit(p))}"><div class="unit-price-label">Цена за 1 ${safe(unit(p))} с НДС</div><div class="unit-price-value">${money(p.price)}</div><div class="total-price-line">Итого за 1 ${safe(unit(p))}: ${money(p.price)}</div></div>`;
  const thumb=p=>{const src=typeof getProductImageSrc==='function'?getProductImageSrc(p):'';return src?`<button class="product-card-photo" type="button" onclick="openProduct(${Number(p.id)})" aria-label="Открыть товар"><img src="${safe(src)}" alt="${safe(p.name||'')}" loading="lazy" onerror="this.closest('.product-card-photo')?.classList.add('no-image');this.remove()"></button>`:`<button class="product-card-photo no-image" type="button" onclick="openProduct(${Number(p.id)})" aria-label="Открыть товар"><span>Cabeus</span></button>`};
  window.card=card=function(p){
    const qid='q'+p.id,u=unit(p),available=max(p);
    return `<div class="card product-card-final thumbnail-card">${thumb(p)}<div class="card-main"><div class="name" onclick="openProduct(${p.id})">${safe(p.name)}</div><div class="code-stock-line"><span>Код: ${safe(p.code||p.article||'')}</span>${stock(p)}</div></div><div class="card-buy">${price(p,qid)}<div class="card-control-row"><div class="qty-wrap">${qtyHtml(qid,1,available,u)}</div><button class="btn" ${available<=0?'disabled':''} onclick="addToCart(${p.id},this)">В корзину</button></div></div></div>`;
  };
})();

/* === MULTI-IMAGE PRODUCT GALLERY 2026-07-11 === */
(function(){
  const norm=v=>String(v||'').trim().toLowerCase().replace(/с/g,'c');
  const images=p=>{const v=(window.PRODUCT_IMAGES_BY_CODE||{})[norm(p?.code)];return (Array.isArray(v)?v:[v]).filter(Boolean)};
  const js=v=>String(v||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  window.productDetailPhoto=function(p){
    const list=images(p),alt=esc(p?.name||p?.article||'');if(!list.length)return '';
    const thumbs=list.length>1?`<div class="product-gallery-thumbs">${list.map((src,i)=>`<button type="button" aria-label="Фото ${i+1}" onclick="selectProductGalleryImage(this,'${js(src)}','${js(alt)}')"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>`:'';
    return `<div class="product-gallery"><button class="product-detail-photo product-photo-zoom" type="button" onclick="openProductGalleryLightbox(this)"><img src="${esc(list[0])}" alt="${alt}" loading="lazy" onerror="this.closest('.product-gallery')?.remove()"><span class="photo-hint">${list.length>1?'Фото 1 из '+list.length+' · нажмите, чтобы увеличить':'Нажмите, чтобы увеличить'}</span></button>${thumbs}</div>`;
  };
  window.selectProductGalleryImage=function(btn,src,alt){const gallery=btn.closest('.product-gallery'),main=gallery?.querySelector('.product-detail-photo img');if(main){main.src=src;main.alt=alt||''}gallery?.querySelectorAll('.product-gallery-thumbs button').forEach(x=>x.classList.toggle('active',x===btn))};
  window.openProductGalleryLightbox=function(btn){const gallery=btn.closest('.product-gallery'),src=btn.querySelector('img')?.src,alt=btn.querySelector('img')?.alt||'';const list=[...gallery.querySelectorAll('.product-gallery-thumbs img')].map(x=>x.src);window.__lightboxImages=list.length?list:[src];window.__lightboxIndex=Math.max(0,window.__lightboxImages.indexOf(src));openImageLightbox(src,alt);ensureLightboxArrows()};
  function ensureLightboxArrows(){const box=document.getElementById('imageLightbox'),inner=box?.querySelector('.image-lightbox-box');if(!inner||inner.querySelector('.image-lightbox-prev'))return;inner.insertAdjacentHTML('beforeend','<button class="image-lightbox-prev" type="button" aria-label="Предыдущее фото" onclick="stepImageLightbox(-1)">‹</button><button class="image-lightbox-next" type="button" aria-label="Следующее фото" onclick="stepImageLightbox(1)">›</button>')}
  window.stepImageLightbox=function(delta){const list=window.__lightboxImages||[];if(list.length<2)return;window.__lightboxIndex=(Number(window.__lightboxIndex||0)+delta+list.length)%list.length;const img=document.querySelector('#imageLightbox img');if(img)img.src=list[window.__lightboxIndex]};
})();

/* === PRODUCT PAGE KEY FACTS 2026-07-11 === */
(function(){
  const clean=v=>String(v??'').trim();
  const spec=(p,names)=>{const d=p?.donorSpecs&&typeof p.donorSpecs==='object'?p.donorSpecs:{};for(const n of names){if(clean(d[n]))return clean(d[n])}return ''};
  const add=(rows,label,value)=>{if(clean(value)&&!rows.some(x=>x.label===label))rows.push({label,value:clean(value)})};
  window.productKeyFactsHtml=function(p){
    const rows=[],text=clean([p.section,p.subsection,p.name,p.type].join(' ')).toLowerCase();
    const dims=clean(p.name).match(/(\d{2,4})\s*[xх×]\s*(\d{2,4})\s*[xх×]\s*(\d{2,4})/i);
    if(/шкаф|стойк/.test(text)){
      add(rows,'Высота',spec(p,['Высота, U'])||p.u?`${spec(p,['Высота, U'])||p.u}U`:'');
      add(rows,'Ширина',p.width||(dims&&dims[1])?`${p.width||(dims&&dims[1])} мм`:'');
      add(rows,'Глубина',spec(p,['Глубина, мм'])||p.depth||(dims&&dims[2])?`${spec(p,['Глубина, мм'])||p.depth||(dims&&dims[2])} мм`:'');
      add(rows,'Формат',/\b10["″]/.test(p.name)?'10″':'19″');
      add(rows,'Исполнение',spec(p,['Исполнение'])||(/настенн/i.test(p.name)?'Настенное':/напольн/i.test(p.name)?'Напольное':''));
      add(rows,'Двери',spec(p,['Двери'])||p.door);
    }else if(/кабель|витая пара|патч.?корд/.test(text)){
      add(rows,'Категория',p.cat?`Cat${p.cat}`:spec(p,['Категория']));
      add(rows,'Экран',p.shield||spec(p,['Экранирование','Экран']));
      add(rows,'Количество пар',spec(p,['Количество пар'])||p.ports);
      add(rows,'Длина',spec(p,['Длина кабеля, м','Длина, м']));
      add(rows,'Цвет',p.color||spec(p,['Цвет']));
      add(rows,'Тип',p.type||spec(p,['Функционал']));
    }else{
      add(rows,'Тип',p.type||spec(p,['Функционал']));
      add(rows,'Производитель',p.producer||spec(p,['Производитель']));
      add(rows,'Гарантия',p.warranty);
      add(rows,'Цвет',p.color||spec(p,['Цвет']));
      add(rows,'U',p.u);
      add(rows,'Порты',p.ports);
    }
    if(!rows.length)return '';
    return `<div class="product-key-facts"><div>${rows.slice(0,6).map(x=>`<article><span>${esc(x.label)}</span><b>${esc(x.value)}</b></article>`).join('')}</div></div>`;
  };
  window.productAboutHtml=function(p,description){const facts=productKeyFactsHtml(p),desc=clean(description);return `<section class="product-content-section product-about"><div class="about-heading"><p>Краткая информация</p><h2>О товаре</h2></div>${facts}${desc?`<div class="product-description-text">${esc(desc)}</div>`:'<div class="product-description-text muted">Подробное описание для этого товара пока не добавлено.</div>'}</section>`};
  window.toggleProductSpecs=function(btn){const section=btn.closest('.product-characteristics'),box=section?.querySelector('.product-specs-collapsible');if(!section||!box)return;const open=section.classList.toggle('expanded');section.classList.toggle('collapsed',!open);btn.setAttribute('aria-expanded',String(open));const icon=btn.querySelector('i');if(icon)icon.textContent=open?'−':'＋'};
})();

/* === CABINET COMPATIBLE ACCESSORIES 2026-07-11 === */
(function(){
  const norm=v=>String(v||'').toLowerCase().replace(/ё/g,'е');
  const value=(p,names)=>{const d=p?.donorSpecs&&typeof p.donorSpecs==='object'?p.donorSpecs:{};for(const n of names){if(d[n]!=null&&String(d[n]).trim())return String(d[n]).trim()}return ''};
  const num=v=>{const m=String(v||'').match(/\d+(?:[.,]\d+)?/);return m?Number(m[0].replace(',','.')):0};
  const color=p=>/черн|9004|black/.test(norm([p?.color,p?.name].join(' ')))?'black':/сер|7035|gray|grey/.test(norm([p?.color,p?.name].join(' ')))?'gray':'';
  function profile(p){
    const text=norm([p.name,p.subsection,p.type].join(' ')),spec=norm(value(p,['Функционал']));
    if(!/шкаф телекоммуникационный|стойка 19/.test(text+' '+spec))return null;
    const dim=String(p.name||'').match(/(\d{2,4})\s*[xх×]\s*(\d{2,4})\s*[xх×]?\s*(\d{0,4})/i);
    const depth=num(value(p,['Глубина, мм','Глубина'])||p.depth||(dim&&dim[2]));
    const useful=num(value(p,['Полезная глубина, мм']))||(depth?Math.max(0,depth-60):0);
    const code=String(p.article||p.name||'').toUpperCase();
    const series=(code.match(/\b(ND-SC|ND-05C|SH-05C|SH-05F|SH-05A|SH-05B)\b/)||[])[1]||'';
    const productName=norm(p.name);const standard=/\b10["″]|10\s*дюйм/.test(productName)&&!/\b19["″]|19\s*дюйм/.test(productName)?'10':'19';
    return {standard,installation:/настенн/.test(text)||/настенное/.test(norm(value(p,['Исполнение'])))?'wall':/напольн/.test(text)||/напольное/.test(norm(value(p,['Исполнение'])))?'floor':'rack',depth,useful,u:num(value(p,['Высота, U'])||p.u),series,color:color(p)};
  }
  const groups=[
    {key:'shelves',title:'Полки',test:t=>/полк/.test(t)},
    {key:'fans',title:'Вентиляция и термостаты',test:t=>/вентилятор|охлажден|термостат|терморегулятор|контрольн.*панел.*термо/.test(t)},
    {key:'organizers',title:'Кабельные органайзеры',test:t=>/органайзер|щеточн.*ввод/.test(t)},
    {key:'fasteners',title:'Монтажный крепёж',test:t=>/(?:крепежн.*комплект|комплект.*крепеж|клетев.*гайк|винт.*шайб)/.test(t)},
    {key:'grounding',title:'Заземление шкафа',test:t=>/заземлен|медн.*шин/.test(t)},
    {key:'pdu',title:'Блоки розеток PDU',test:t=>/блок.*розет|pdu/.test(t)},
    {key:'rails',title:'Направляющие и опоры',test:t=>/направляющ|роликов.*опор|винтов.*опор|цокол/.test(t)},
    {key:'panels',title:'Патч-панели',test:t=>/(?:патч.?панел|коммутационн.*панел)/.test(t)&&!/оптич/.test(t)}
  ];
  function candidateGroup(p){const t=norm([p.name,p.subsection,p.type,value(p,['Функционал'])].join(' '));return groups.find(g=>g.test(t))}
  function compatibility(c,cab,g){
    const t=norm([c.name,c.subsection,c.type,value(c,['Функционал'])].join(' '));let score=0,reasons=[];
    const says10=/\b10["″]|10\s*дюйм/.test(t),says19=/\b19["″]|19\s*дюйм/.test(t);
    if(cab.standard==='10'&&says19&&!says10)return null;
    if(cab.standard==='19'&&says10&&!says19)return null;
    if(cab.standard==='19'&&says19){score+=45;reasons.push('формат 19″')}
    if(cab.standard==='10'&&says10){score+=45;reasons.push('формат 10″')}
    const depthMentions=[...t.matchAll(/глубин[а-яa-z]*\s*(\d{3,4})\s*мм/g)].map(m=>Number(m[1]));
    const ctDepth=num(value(c,['Глубина, мм','Глубина'])||c.depth)||Number(depthMentions[0]||0);
    const cabinetDepth=num((t.match(/шкаф[а-яa-z]*[^,.]{0,40}(?:с\s+)?глубин[а-яa-z]*\s*(\d{3,4})\s*мм/)||[])[1]);
    const namedDepth=num((t.match(/(?:wm|tray|fc)[-\s]?(\d{2,4})/i)||[])[1]);
    const targetDepth=namedDepth&&namedDepth<100?namedDepth*10:namedDepth;
    if(/для настенн/.test(t)&&cab.installation!=='wall')return null;
    if(/для напольн/.test(t)&&cab.installation!=='floor')return null;
    if(g.key==='fans'&&/tray[-\s]?(\d{2,3})\b/.test(t)){
      if(cab.installation!=='floor')return null;
      const raw=Number((t.match(/tray[-\s]?(\d{2,3})\b/)||[])[1]);const d=raw<200?raw*10:raw;if(cab.depth&&d!==cab.depth)return null;
      score+=90;reasons.push(`для напольного шкафа ${d} мм`);
    }
    if(g.key==='fans'&&/термостат|терморегулятор|контрольн.*панел/.test(t)){
      if(/для обогрев|smart.?pdu|датчик.*влажност/.test(t))return null;
      score+=70;reasons.push('управление вентиляцией');
    }
    if(g.key==='shelves'){
      const declaredDepth=cabinetDepth||targetDepth;
      if(declaredDepth&&cab.depth&&declaredDepth!==cab.depth)return null;
      if(ctDepth&&cab.useful&&ctDepth>cab.useful)return null;
      if(declaredDepth&&declaredDepth===cab.depth){score+=100;reasons.push(`для шкафа глубиной ${cab.depth} мм`)}
      else if(ctDepth){score+=35;reasons.push(`глубина полки ${ctDepth} мм`)}
    }
    if(g.key==='rails'){
      if(cab.installation!=='floor')return null;
      const d=cabinetDepth||num((t.match(/jh05[-\s]?(\d{2})-/i)||[])[1])*100;if(d&&cab.depth&&d!==cab.depth)return null;
      if(d){score+=85;reasons.push(`для глубины ${d} мм`)}
    }
    if(g.key==='pdu'&&cab.installation==='wall'){
      if(/вертикальн/.test(t))return null;
      if(/горизонтальн/.test(t)){score+=30;reasons.push('горизонтальная установка')}
      if(/\b(6|8)\s*розет/.test(t))score+=15;
    }
    if(g.key==='organizers'){
      const u=num(c.u);if(cab.u&&u>Math.max(2,Math.floor(cab.u/3)))return null;
      const verticalU=num((t.match(/(?:вертикальн|для шкаф)[^,.]{0,45}\b(\d{1,2})\s*u\b/)||[])[1]);
      if(verticalU&&cab.u&&verticalU!==cab.u)return null;
      if(cab.u&&cab.u<=12&&/вертикальн|кабельн.*кольц/.test(t)&&!says19)return null;
      if(u===1){score+=25;reasons.push('занимает 1U')}
    }
    if(g.key==='fasteners'){
      if(/клипс|для труб|маркер|боков.*стен/.test(t))return null;
      score+=35;reasons.push('монтаж в 19″ профиль');
    }
    if(g.key==='grounding'){
      if(/главн.*шин|гзш|блок.*шин|шина pe|монтажн.*плат|вертикальн|\b1\s*м\b|1000\s*мм/.test(t))return null;
      if(!says19&&!/комплект.*заземлен/.test(t))return null;
      const u=num(c.u);if(cab.u&&u>cab.u)return null;
      score+=45;reasons.push('компактное заземление шкафа');
    }
    if(g.key==='panels'){
      if(cab.installation==='wall'&&/настенн|углов|(?:^|[-\s])wl(?:[-\s]|$)|(?:^|[-\s])con(?:[-\s]|$)/.test(t))return null;
      const u=num(c.u);if(cab.u&&u>cab.u)return null;score+=35;reasons.push(`патч-панель ${cab.standard}″`);
    }
    if(cab.series&&t.includes(norm(cab.series))){score+=120;reasons.unshift(`для серии ${cab.series}`)}
    const cc=color(c);if(cc&&cab.color&&cc===cab.color){score+=22;reasons.push('совпадает цвет')}else if(cc&&cab.color&&cc!==cab.color)score-=8;
    if(Number(c.qty||0)>0){score+=25;reasons.push('в наличии')}else if(Number(c.transit||0)>0){score+=8;reasons.push('в транзите')}else return null;
    return {score,reason:[...new Set(reasons)].slice(0,3).join(' · ')||'подходит по назначению'};
  }
  function recommendations(p){
    const cab=profile(p);if(!cab)return [];
    const out=new Map(groups.map(g=>[g.key,[]]));
    PRODUCTS.forEach(c=>{if(c.id===p.id)return;const g=candidateGroup(c);if(!g)return;const fit=compatibility(c,cab,g);if(fit)out.get(g.key).push({p:c,...fit,g})});
    return groups.map(g=>({g,items:out.get(g.key).sort((a,b)=>b.score-a.score||Number(a.p.price)-Number(b.p.price))})).filter(x=>x.items.length);
  }
  function image(p){const src=typeof getProductImageSrc==='function'?getProductImageSrc(p):'';return src?`<img src="${esc(src)}" alt="${esc(p.name||'')}" loading="lazy" onerror="this.closest('.accessory-img')?.classList.add('no-image');this.remove()">`:'<span>Cabeus</span>'}
  function card(x){const p=x.p,u=p.unit||'шт.',available=Math.max(Number(p.qty||0),Number(p.transit||0));return `<article class="accessory-card constructor-item" data-category="${esc(x.g.key)}" data-product-id="${p.id}"><label class="accessory-select"><input type="checkbox" onchange="toggleAccessoryChoice(${p.id},this.checked)"><span>Выбрать</span></label><button class="accessory-img${typeof getProductImageSrc==='function'&&getProductImageSrc(p)?'':' no-image'}" type="button" onclick="openProduct(${p.id})">${image(p)}</button><div class="accessory-card-body"><div class="accessory-reason">${esc(x.reason)}</div><button class="accessory-name" type="button" onclick="openProduct(${p.id})">${esc(p.name)}</button><div class="accessory-code">Код: ${esc(p.code||p.article||'')}</div><div class="accessory-price-row"><div><b>${rub.format(Number(p.price)||0)}</b><small>${Number(p.qty||0)>0?`В наличии: ${p.qty} ${esc(u)}`:`Транзит: ${p.transit} ${esc(u)}`}</small></div><div class="constructor-qty" aria-label="Количество"><button type="button" disabled onclick="stepAccessoryQty(${p.id},-1)">−</button><input id="accQty${p.id}" type="number" min="1" max="${available}" value="1" disabled onchange="setAccessoryQty(${p.id},this.value)"><button type="button" disabled onclick="stepAccessoryQty(${p.id},1)">+</button></div></div></div></article>`}
  window.compatibleAccessoriesHtml=function(p){const rows=recommendations(p);if(!rows.length)return '';window.__accessoryConstructor={mainId:p.id,items:{}};const count=rows.reduce((n,x)=>n+x.items.length,0);return `<section class="compatible-accessories accessory-constructor" data-main-id="${p.id}"><div class="accessories-head"><div><p>Подбор по формату, глубине и типу установки</p><h2>Соберите комплект</h2><div class="constructor-subtitle">Откройте нужный раздел и выберите аксессуары</div></div><span>${count} совместимых позиций</span></div><div class="constructor-layout"><div class="constructor-products">${rows.map(x=>`<section class="accessory-group collapsed" data-group="${esc(x.g.key)}"><button class="accessory-group-toggle" type="button" aria-expanded="false" onclick="toggleAccessoryGroup(this)"><span>${esc(x.g.title)}<small>${x.items.length} позиций</small></span><i>＋</i></button><div class="accessory-grid">${x.items.map(card).join('')}</div></section>`).join('')}</div><aside class="constructor-summary"><h3>Ваш комплект</h3><div class="constructor-summary-line"><span>Основной товар</span><b>${rub.format(Number(p.price)||0)}</b></div><div class="constructor-summary-line"><span>Аксессуары <em id="constructorSelectedCount">0 позиций</em></span><b id="constructorAccessoriesTotal">${rub.format(0)}</b></div><div class="constructor-summary-total"><span>Итого</span><b id="constructorGrandTotal">${rub.format(Number(p.price)||0)}</b></div><p id="constructorEmptyHint">Отметьте аксессуары слева</p><button class="btn secondary full" id="addAccessoriesBtn" type="button" disabled onclick="addAccessoryBundle(false)">Добавить аксессуары</button><button class="btn full" type="button" onclick="addAccessoryBundle(true)">Добавить весь комплект</button><small>Основной товар не добавится повторно, если уже находится в корзине.</small></aside></div></section>`};
  window.toggleAccessoryGroup=function(btn){const group=btn.closest('.accessory-group'),root=btn.closest('.constructor-products');if(!group)return;const opening=group.classList.contains('collapsed');root?.querySelectorAll('.accessory-group').forEach(x=>{x.classList.add('collapsed');const b=x.querySelector('.accessory-group-toggle');if(b){b.setAttribute('aria-expanded','false');const i=b.querySelector('i');if(i)i.textContent='＋'}});if(opening){group.classList.remove('collapsed');btn.setAttribute('aria-expanded','true');const i=btn.querySelector('i');if(i)i.textContent='−'}};
  window.addRecommendedAccessory=function(id,btn){const p=PRODUCTS[id];if(!p)return;const available=Math.max(Number(p.qty||0),Number(p.transit||0));if(available<=0)return;if(Number(cart[id]||0)+1>available){if(typeof showCartToast==='function')showCartToast('Количество больше доступного');return}cart[id]=Number(cart[id]||0)+1;saveCart();if(typeof showCartToast==='function')showCartToast('Аксессуар добавлен в корзину');if(btn){const old=btn.textContent;btn.textContent='Добавлено ✓';btn.disabled=true;setTimeout(()=>{btn.textContent=old;btn.disabled=false},1000)}};
  function constructorState(){return window.__accessoryConstructor||{mainId:null,items:{}}}
  window.filterAccessoryConstructor=function(category,btn){const root=btn.closest('.accessory-constructor');root?.querySelectorAll('.constructor-tabs button').forEach(x=>x.classList.toggle('active',x===btn));root?.querySelectorAll('.accessory-group').forEach(x=>x.classList.toggle('constructor-hidden',category!=='all'&&x.dataset.group!==category))};
  window.toggleAccessoryChoice=function(id,checked){const state=constructorState(),item=document.querySelector(`.constructor-item[data-product-id="${id}"]`),controls=item?.querySelectorAll('.constructor-qty button,.constructor-qty input');if(checked)state.items[id]=Math.max(1,Number(item?.querySelector('.constructor-qty input')?.value)||1);else delete state.items[id];controls?.forEach(x=>x.disabled=!checked);item?.classList.toggle('selected',checked);updateConstructorTotals()};
  window.stepAccessoryQty=function(id,delta){const input=document.getElementById('accQty'+id);if(!input||input.disabled)return;const max=Number(input.max)||Infinity;input.value=Math.max(1,Math.min(max,(Number(input.value)||1)+delta));setAccessoryQty(id,input.value)};
  window.setAccessoryQty=function(id,value){const input=document.getElementById('accQty'+id),p=PRODUCTS[id];if(!input||!p)return;const max=Math.max(Number(p.qty||0),Number(p.transit||0)),q=Math.max(1,Math.min(max,Math.floor(Number(value)||1)));input.value=q;if(constructorState().items[id]!=null)constructorState().items[id]=q;updateConstructorTotals()};
  window.updateConstructorTotals=function(){const state=constructorState(),entries=Object.entries(state.items),main=PRODUCTS[state.mainId],accessories=entries.reduce((sum,[id,q])=>sum+(Number(PRODUCTS[id]?.price)||0)*q,0),count=entries.reduce((n,[,q])=>n+q,0);const countEl=document.getElementById('constructorSelectedCount'),accEl=document.getElementById('constructorAccessoriesTotal'),grand=document.getElementById('constructorGrandTotal'),btn=document.getElementById('addAccessoriesBtn'),hint=document.getElementById('constructorEmptyHint');if(countEl)countEl.textContent=`${count} ${count===1?'позиция':count<5?'позиции':'позиций'}`;if(accEl)accEl.textContent=rub.format(accessories);if(grand)grand.textContent=rub.format((Number(main?.price)||0)+accessories);if(btn)btn.disabled=!entries.length;if(hint)hint.classList.toggle('hidden',!!entries.length)};
  window.addAccessoryBundle=function(includeMain){const state=constructorState(),entries=Object.entries(state.items);let added=0;if(includeMain&&state.mainId!=null&&!Number(cart[state.mainId]||0)){const p=PRODUCTS[state.mainId],available=Math.max(Number(p?.qty||0),Number(p?.transit||0));if(available>0){cart[state.mainId]=1;added++}}for(const [id,q] of entries){const p=PRODUCTS[id],available=Math.max(Number(p?.qty||0),Number(p?.transit||0)),can=Math.max(0,available-Number(cart[id]||0)),take=Math.min(q,can);if(take>0){cart[id]=Number(cart[id]||0)+take;added++}}if(!added){if(typeof showCartToast==='function')showCartToast(entries.length?'Выбранные товары уже в корзине':'Выберите аксессуары');return}saveCart();if(typeof showCartToast==='function')showCartToast(includeMain?'Комплект добавлен в корзину':'Аксессуары добавлены в корзину')};
})();

if(window.__checkoutOpenCart)window.openCart=window.__checkoutOpenCart;
