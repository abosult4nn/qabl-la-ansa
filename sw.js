const CACHE_NAME = 'qabl-la-ansa-v3-shortcuts-fix-2';
const ASSETS = ['./manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

function patchIndex(html){
  const cssFix = `
  /* qabl-la-ansa iPhone layout fix */
  html,body{overflow-x:hidden!important;width:100%!important;}
  .app{padding-bottom:calc(190px + var(--safe-bottom))!important;overflow-x:hidden!important;}
  .summary-card{grid-template-columns:56px minmax(0,1fr)!important;gap:10px!important;padding:16px!important;overflow:hidden!important;}
  .summary-card>div:not(.summary-icon){min-width:0!important;}
  .summary-icon{width:54px!important;height:54px!important;border-radius:19px!important;font-size:26px!important;}
  .summary-main{overflow-wrap:anywhere!important;white-space:normal!important;}
  .mini-stats{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;min-width:0!important;}
  .mini-pill{min-width:0!important;white-space:nowrap!important;padding:10px 5px!important;gap:4px!important;font-size:13px!important;}
  .mini-pill .ico{font-size:15px!important;flex:0 0 auto!important;}
  .composer.open{max-height:360px!important;margin-bottom:120px!important;}
  .composer textarea{min-height:132px!important;}
  .toast{bottom:calc(106px + var(--safe-bottom))!important;}
  @media (max-width:390px){
    .summary-main{font-size:18px!important;}
    .summary-card{grid-template-columns:50px minmax(0,1fr)!important;padding:14px!important;}
    .summary-icon{width:48px!important;height:48px!important;font-size:22px!important;border-radius:17px!important;}
    .mini-stats{gap:5px!important;}
    .mini-pill{font-size:12px!important;padding:9px 4px!important;gap:3px!important;}
    .mini-pill .ico{display:none!important;}
  }
  `;

  html = html.replace(/قبل لا أنسى - منبّه/g, 'قبل لا أنسى - منبه');

  if(!html.includes('qabl-la-ansa iPhone layout fix')){
    html = html.replace('</style>', cssFix + '\n  </style>');
  }

  if(!html.includes('function isIOSDevice()')){
    html = html.replace(
      "function toast(msg){ els.toast.textContent = msg; els.toast.classList.add('show'); setTimeout(()=> els.toast.classList.remove('show'), 2200); }",
      "function toast(msg){ els.toast.textContent = msg; els.toast.classList.add('show'); setTimeout(()=> els.toast.classList.remove('show'), 2200); }\n  function isIOSDevice(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }"
    );
  }

  html = html.replace(
    "recognition.onerror = () => { stopRecordingUI(); toast('التسجيل غير متاح الآن'); };",
    "recognition.onerror = () => { stopRecordingUI(); openComposer(true); toast('استخدم مايك الكيبورد للإملاء'); };"
  );

  html = html.replace(
`function toggleRecognition(){
    openComposer(true);
    if(!recognition){ els.input.focus(); toast('استخدم مايك الكيبورد في iPhone'); return; }
    if(isRecording){ recognition.stop(); return; }
    try{ recognition.start(); }catch{ toast('التسجيل غير متاح'); }
  }`,
`function toggleRecognition(){
    openComposer(true);
    if(isIOSDevice()){
      els.voiceLabel.textContent = 'استخدم مايك الكيبورد للإملاء';
      setTimeout(() => { els.input.focus(); els.composer.scrollIntoView({behavior:'smooth', block:'center'}); }, 180);
      toast('اضغط مايك الكيبورد داخل مربع الكتابة');
      return;
    }
    if(!recognition){ els.input.focus(); toast('استخدم مايك الكيبورد للإملاء'); return; }
    if(isRecording){ recognition.stop(); return; }
    try{ recognition.start(); }catch{ stopRecordingUI(); toast('استخدم مايك الكيبورد للإملاء'); }
  }`
  );

  html = html.replace(
`function openComposer(force){
    const open = typeof force === 'boolean' ? force : !els.composer.classList.contains('open');
    els.composer.classList.toggle('open', open);
    if(open) setTimeout(() => els.input.focus(), 120);
  }`,
`function openComposer(force){
    const open = typeof force === 'boolean' ? force : !els.composer.classList.contains('open');
    els.composer.classList.toggle('open', open);
    if(open) setTimeout(() => {
      els.input.focus();
      els.composer.scrollIntoView({behavior:'smooth', block:'center'});
    }, 160);
  }`
  );

  return html;
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if(req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/qabl-la-ansa/')){
    event.respondWith(
      fetch(req, {cache:'no-store'})
        .then(res => res.text())
        .then(html => new Response(patchIndex(html), {headers:{'Content-Type':'text/html; charset=utf-8'}}))
        .catch(() => caches.match('./index.html').then(res => res || fetch('./index.html')))
    );
    return;
  }

  event.respondWith(caches.match(req).then(res => res || fetch(req)));
});
