(() => {
  const KEY = 'alex1805-v1';
  const defaults = { entered:false, chapter1:false, letterOpened:false, letterKept:false, lastView:'home' };
  let state = load();

  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];
  const gate = $('#gate');
  const world = $('#world');
  const backdrop = $('#modalBackdrop');

  function load(){
    try { return {...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}')}; }
    catch { return {...defaults}; }
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function haptic(ms=18){ if (navigator.vibrate) navigator.vibrate(ms); }

  function enterWorld(){
    state.entered = true; save();
    gate.classList.remove('active'); gate.hidden = true; world.hidden = false;
    navigate(state.lastView || 'home', false); render();
    if (!sessionStorage.getItem('alex1805-greeted')) {
      sessionStorage.setItem('alex1805-greeted','1');
      setTimeout(() => openModal('talkModal'), 450);
    }
  }

  function navigate(name, persist=true){
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.go === name));
    if (persist){ state.lastView=name; save(); }
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function openModal(id){
    $$('.modal').forEach(m => m.hidden = true);
    const modal = $('#'+id); if (!modal) return;
    backdrop.hidden = false; modal.hidden = false; document.body.style.overflow='hidden'; haptic();
  }
  function closeModal(){
    backdrop.hidden = true; $$('.modal').forEach(m => m.hidden = true); document.body.style.overflow='';
  }

  function render(){
    const done = state.chapter1;
    $('#progressBar').style.width = done ? '100%' : '8%';
    $('#progressPercent').textContent = done ? '100%' : '0%';
    $('#progressText').textContent = done ? 'الفصل الأول مكتمل' : 'البداية';
    $('#topProgress').textContent = done ? '1805 · الفصل الأول ✓' : '1805 · البداية';
    $('#completedCount').textContent = done ? '1' : '0';
    $('#memoryLetterCount').textContent = (state.letterOpened || state.letterKept) ? '1' : '0';
    $('#memoryPeopleCount').textContent = done ? '3' : '0';

    const portrait = $('#archivistPortrait');
    const talkPortrait = $('#talkPortrait');
    if (done) {
      portrait.src='alex1805-assets/archivist-smile.webp'; talkPortrait.src='alex1805-assets/archivist-smile.webp';
      $('#archivistLine').textContent='«أحسنت. الآن صار للقصر ذاكرة… وهناك رسالة باسمك.»';
      $('#talkHeading').textContent='الآن بدأت ترى ما بين الصفحات.';
      $('#talkCopy').textContent='ثلاثة وجوه ظهرت على الحائط. لا تحفظ الأسماء بالقوة؛ دع العلاقات هي التي تُبقيها في ذهنك.';
      $('#letterCount').textContent = state.letterOpened ? 'لا رسائل جديدة' : '1 رسالة جديدة';
      $('#threadCount').textContent='3 وجوه ظهرت';
      $('#threadHint').textContent='أول شبكة ظهرت. اضغط على أي وجه لترى فقط ما تعرفه حتى الآن.';
      $('#threadEmpty').hidden=true; $('#characterNetwork').hidden=false;
      $('#firstLetter').classList.remove('sealed');
      $('#letterTitle').textContent='إلى Alex، بعد الباب الأول';
      $('#letterSubtitle').textContent=state.letterOpened ? 'تم فتحها' : 'وصلت الآن';
      $('#emptyLetters').hidden=true;
      $('#memoryQuote').textContent='«الأسماء تبدأ كغرباء، ثم تتحول إلى خيوط لا يمكنك تجاهلها.»';
      const door2 = $('.door-card[data-chapter="2"]');
      door2.classList.remove('locked'); door2.classList.add('unlocked');
      door2.querySelector('small').textContent='ظهر بعد الفصل الأول'; door2.querySelector('.door-state').textContent='قريبًا';
    } else {
      portrait.src='alex1805-assets/archivist-neutral.webp'; talkPortrait.src='alex1805-assets/archivist-neutral.webp';
      $('#letterCount').textContent='0 رسالة جديدة'; $('#threadCount').textContent='لا توجد روابط بعد';
      $('#threadEmpty').hidden=false; $('#characterNetwork').hidden=true;
      $('#firstLetter').classList.add('sealed');
      $('#emptyLetters').hidden=false;
    }
  }

  function completeChapter1(){
    if (state.chapter1) { closeModal(); return; }
    state.chapter1=true; save(); render(); closeModal();
    setTimeout(() => openModal('unlockModal'), 180);
  }

  function reset(){
    localStorage.removeItem(KEY); sessionStorage.removeItem('alex1805-greeted'); state={...defaults};
    world.hidden=true; gate.hidden=false; gate.classList.add('active'); closeModal(); render();
  }

  $('#enterBtn').addEventListener('click', enterWorld);
  $('#continueBtn').addEventListener('click', () => openModal('readerModal'));
  $('.door-card[data-chapter="1"]').addEventListener('click', () => openModal('readerModal'));
  $('#finishChapterBtn').addEventListener('click', completeChapter1);
  $('#talkBtn').addEventListener('click', () => openModal('talkModal'));
  $('#seeUnlockBtn').addEventListener('click', () => { closeModal(); navigate('threads'); });
  $('#firstLetter').addEventListener('click', () => {
    if (!state.chapter1) { openModal('talkModal'); return; }
    state.letterOpened=true; save(); render(); openModal('letterModal');
  });
  $('#keepLetterBtn').addEventListener('click', () => { state.letterKept=true; save(); render(); closeModal(); navigate('memory'); });

  $$('[data-go]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.go)));
  $$('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });

  $$('.character-node').forEach(n => n.addEventListener('click', () => {
    const name=n.dataset.name;
    $('#talkHeading').textContent=name;
    $('#talkCopy').textContent = name==='آنا بافلوفنا'
      ? 'أول مضيفة تستقبلك في عالم 1805. أنت تعرفها الآن من الصالون الذي بدأت فيه الحكاية.'
      : name==='الأمير فاسيلي'
      ? 'أحد الوجوه التي ظهرت مبكرًا في الصالون. لن أضيف شيئًا لم تقرأه.'
      : 'وجه جديد في دائرتك الأولى. راقب طريقته في الدخول إلى الحديث أكثر من حفظ اسمه.';
    openModal('talkModal');
  }));

  $('#menuBtn').addEventListener('click', () => { $('#sideSheet').hidden=false; haptic(); });
  $('#closeMenu').addEventListener('click', () => $('#sideSheet').hidden=true);
  $('#resetBtn').addEventListener('click', reset);
  $('#resetFromGate').addEventListener('click', reset);

  if (state.entered) { gate.hidden=true; world.hidden=false; navigate(state.lastView || 'home', false); }
  else { gate.hidden=false; world.hidden=true; }
  render();
})();
