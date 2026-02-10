
  const root = document.documentElement;
  const heroBlock = document.getElementById('heroBlock');

  function clamp(n,min,max){return Math.max(min, Math.min(max,n));}

  function recalc(){
    const vh = window.innerHeight;
    const limit = Math.round(vh * 0.15);
    root.style.setProperty('--limit', limit + 'px');
    update(window.scrollY, limit, vh);
  }

  function update(scrollY, limit, vh){
    const raw = clamp(scrollY / limit, 0, 1);
    const ease = raw*raw*(3-2*raw);

    const minStr = getComputedStyle(root).getPropertyValue('--min').trim();
    const minPx = /vh$/.test(minStr) ? vh * (parseFloat(minStr)/100) : parseFloat(minStr);
    const h = (1 - ease) * vh + ease * minPx;
    root.style.setProperty('--h', h + 'px');

    const scale = 1.15 - (1.15 - 1.0) * ease;
    const ty = (-0.02 * vh) * ease;
    root.style.setProperty('--scale', scale.toFixed(4));
    root.style.setProperty('--ty', ty.toFixed(2) + 'px');
  }

  function onScroll(){
    const vh = window.innerHeight;
    const limit = parseFloat(getComputedStyle(root).getPropertyValue('--limit')) || Math.round(vh*0.15);
    update(window.scrollY, limit, vh);
  }

  window.addEventListener('resize', recalc, {passive:true});
  window.addEventListener('scroll', onScroll, {passive:true});
  recalc();

  (function(){
    const imgA = document.getElementById('heroImgA');
    const imgB = document.getElementById('heroImgB');
    let onA = true;

    function preload(src){
      return new Promise((resolve, reject)=>{
        const im = new Image();
        im.onload = ()=>resolve(src);
        im.onerror = reject;
        im.src = src;
      });
    }

    window.crossfadeTo = async function(src){
      if(!src) return;
      const visible = onA ? imgA : imgB;
      if(visible.getAttribute('src') === src) return;

      try{
        await preload(src);
        const next = onA ? imgB : imgA;
        const cur  = onA ? imgA : imgB;

        next.src = src;
        next.classList.add('show');
        cur.classList.remove('show');

        onA = !onA;
      }catch(e){
        console.warn('Errore preload hero:', e);
      }
    };

    window.addEventListener('load', ()=>{
      const active = document.querySelector('.card.active');
      const url = active?.getAttribute('data-bg');
      if(url) { imgA.src = url; imgA.classList.add('show'); imgB.classList.remove('show'); }
    });
  })();

  (function(){
    const strip = document.getElementById('cardsStrip');
    const dotsCtn = document.getElementById('cardsDots');
    if(!strip || !dotsCtn) return;

    const cards = Array.from(strip.querySelectorAll('.card'));
    let dots = [];

    function setGutter(){
      const w = cards[0].getBoundingClientRect().width;
      const g = Math.max(0, (window.innerWidth/2) - (w/2));
      document.documentElement.style.setProperty('--gutter', g + 'px');
    }

    function updateDots(){
      dots.forEach((d,i)=> d.classList.toggle('active', cards[i].classList.contains('active')));
    }

    function centerCard(el){
      const r = el.getBoundingClientRect(), vw = window.innerWidth;
      const target = strip.scrollLeft + (r.left - (vw/2 - r.width/2));
      const max = strip.scrollWidth - strip.clientWidth;
      strip.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior: 'smooth' });
    }

    function setActive(card){
      cards.forEach(c=>c.classList.remove('active'));
      card.classList.add('active');
      centerCard(card);
      updateDots();
      const url = card.getAttribute('data-bg');
      if(url && typeof crossfadeTo === 'function') crossfadeTo(url);
    }

    function renderDots(){
      dotsCtn.innerHTML = cards.map(()=>'<button class="dot" aria-hidden="true"></button>').join('');
      dots = Array.from(dotsCtn.querySelectorAll('.dot'));
      dots.forEach((dot,i)=> dot.addEventListener('click', ()=> setActive(cards[i])));
      updateDots();
    }

    cards.forEach(c=> c.addEventListener('click', ()=> setActive(c)));

    window.addEventListener('load', ()=>{
      setGutter(); renderDots();
      const cur = document.querySelector('.card.active') || cards[0];
      if(cur) centerCard(cur);
    });
    window.addEventListener('resize', setGutter);

    /* =========================================================
       AUTO-ACTIVE DURANTE SWIPE / SCROLL ORIZZONTALE (MOBILE)
       - Non rompe click/dots
       - Non chiama centerCard mentre stai swipando
       - Aggiorna dots + crossfade quando una card è centrata
    ========================================================= */
    let rafLock = false;
    let lastAuto = null;

    function nearestToCenter(){
      const centerX = window.innerWidth / 2;
      let best = null;
      let bestDist = Infinity;

      for(const c of cards){
        const r = c.getBoundingClientRect();
        const cardCenter = r.left + r.width / 2;
        const dist = Math.abs(cardCenter - centerX);
        if(dist < bestDist){
          bestDist = dist;
          best = c;
        }
      }
      return best;
    }

    function autoSetActive(){
      const best = nearestToCenter();
      if(!best) return;

      if(lastAuto === best) return;

      // soglia: cambia solo se la card è abbastanza centrata
      const r = best.getBoundingClientRect();
      const dist = Math.abs((r.left + r.width/2) - (window.innerWidth/2));
      if(dist > r.width * 0.35) return;

      lastAuto = best;

      // attiva senza "forzare" lo scroll (niente centerCard)
      cards.forEach(c=>c.classList.remove('active'));
      best.classList.add('active');
      updateDots();

      const url = best.getAttribute('data-bg');
      if(url && typeof crossfadeTo === 'function') crossfadeTo(url);
    }

    strip.addEventListener('scroll', ()=>{
      if(rafLock) return;
      rafLock = true;
      requestAnimationFrame(()=>{
        rafLock = false;
        autoSetActive();
      });
    }, { passive:true });

    // quando finisci il gesto, ricalcola (snap finale)
    strip.addEventListener('touchend', ()=> setTimeout(autoSetActive, 80), { passive:true });
    strip.addEventListener('mouseup',  ()=> setTimeout(autoSetActive, 80), { passive:true });

  })();

  (function(){
    function initLayers(scope=document){
      const cards = scope.querySelectorAll('.card');
      cards.forEach(card=>{
        const layers = card.querySelector('.layers');
        if(!layers) return;
        const n = layers.querySelectorAll('.layer').length || 1;
        layers.style.setProperty('--layers', n);
      });
    }
    window.addEventListener('load', ()=> initLayers());
  })();

