(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'haven.v1';
  const defaults = {
    profile: { adults: 2, seniors: 0, kids: 0, infants: 0, dogs: 0, cats: 0, days: 3, hazards: ['outage'], needs: [] },
    checked: {}, plan: {}, have: { water: '', meals: '' }
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (!s) return clone(defaults);
      return { ...clone(defaults), ...s, profile: { ...defaults.profile, ...s.profile } };
    } catch { return clone(defaults); }
  }
  let state = load();
  let demo = false, stopFlag = false;
  const save = () => { if (demo) return; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const num = v => Math.max(0, Math.min(20, parseInt(v, 10) || 0));

  /* ---------- Supply engine ---------- */
  function build(p) {
    const people = Math.max(1, p.adults + p.seniors + p.kids + p.infants);
    const d = p.days;
    const has = (g, k) => p[g].includes(k);
    const waterGal = Math.ceil(people * d + p.dogs * 0.5 * d + p.cats * 0.25 * d + (has('hazards', 'heat') ? people * 0.5 * d : 0));
    const meals = (p.adults + p.seniors + p.kids) * d * 3;
    const cats = [];
    const C = (name, icon, items) => cats.push({ name, icon, items });

    C('Water', '💧', [
      { id: 'water', t: 'Stored drinking water', q: `${waterGal} gallons`, n: `About 1 gal per person per day for ${d} days${p.dogs + p.cats ? ', plus pets' : ''}${has('hazards','heat') ? ', plus extra for heat' : ''}.`, p: 1 },
      { id: 'purify', t: 'Water purification tablets or filter', q: '1 set', n: 'Backup if stored water runs out.', p: 2 },
      { id: 'bleach', t: 'Unscented household bleach', q: '1 small bottle', n: 'Can disinfect water in a pinch (check label for ratios).', p: 3 }
    ]);

    const food = [
      { id: 'food', t: 'Ready-to-eat, non-perishable food', q: `${meals} meals`, n: 'Canned goods, protein bars, peanut butter, dried fruit, crackers.', p: 1 },
      { id: 'opener', t: 'Manual can opener', q: '1', n: 'An electric one won\'t help you.', p: 2 },
      { id: 'utensils', t: 'Paper plates, cups, utensils', q: '1 pack', n: 'Saves water for dishes.', p: 3 }
    ];
    if (p.infants) {
      food.push({ id: 'formula', t: 'Infant formula and baby food', q: `${p.infants * d * 8} feedings`, n: 'Ready-to-feed formula needs no clean water.', p: 1 });
      food.push({ id: 'diapers', t: 'Diapers and wipes', q: `${p.infants * d * 8} diapers`, n: 'About 8 per infant per day.', p: 2 });
    }
    if (has('needs', 'allergy')) food.push({ id: 'allergy', t: 'Allergy-safe food and epinephrine', q: 'Full supply', n: 'Check expiration dates on auto-injectors.', p: 1 });
    C('Food', '🥫', food);

    const health = [
      { id: 'firstaid', t: 'First-aid kit', q: '1', n: 'Bandages, antiseptic, gauze, tape, gloves, scissors, tweezers.', p: 1 },
      { id: 'hygiene', t: 'Hygiene supplies', q: `${people} sets`, n: 'Toilet paper, soap, hand sanitizer, toothbrush, trash bags.', p: 2 },
      { id: 'otc', t: 'Over-the-counter medicines', q: '1 set', n: 'Pain relief, anti-diarrheal, antihistamine.', p: 3 }
    ];
    if (has('needs', 'meds')) health.unshift({ id: 'meds', t: 'Prescription medication', q: `${Math.max(7, d)}-day supply`, n: 'Ask your pharmacist about an emergency refill. Keep a written list of doses.', p: 1 });
    if (has('needs', 'device')) health.unshift({ id: 'device', t: 'Backup power for medical device', q: '1 battery or generator plan', n: 'Tell your utility company; they may prioritize you. Know your nearest shelter with power.', p: 1 });
    if (has('needs', 'mobility')) health.push({ id: 'mobility', t: 'Spare mobility-aid parts and batteries', q: '1 set', n: 'Plan a way to leave if elevators are down.', p: 2 });
    if (has('needs', 'glasses')) health.push({ id: 'glasses', t: 'Spare glasses and hearing-aid batteries', q: '1 set', n: 'Store them with your kit.', p: 2 });
    if (has('hazards', 'fire') || has('hazards', 'quake')) health.push({ id: 'mask', t: 'N95 respirator masks', q: `${people} masks`, n: 'Smoke and dust protection.', p: 1 });
    C('Health & hygiene', '🩹', health);

    C('Power, light & comms', '🔦', [
      { id: 'flash', t: 'Flashlights (one per person)', q: `${people}`, n: 'Prefer flashlights to candles to avoid fires.', p: 1 },
      { id: 'batt', t: 'Extra batteries', q: '2 sets', n: 'Match your devices.', p: 2 },
      { id: 'radio', t: 'Hand-crank or battery weather radio', q: '1', n: 'Works when phones and internet fail.', p: 1 },
      { id: 'bank', t: 'Charged power banks', q: `${Math.max(2, Math.ceil(people / 2))}`, n: 'Recharge every few months.', p: 2 },
      { id: 'whistle', t: 'Whistle', q: `${people}`, n: 'Signals for help.', p: 3 }
    ]);

    const warm = [
      { id: 'blanket', t: 'Warm blankets or sleeping bags', q: `${people}`, n: 'One per person.', p: 2 },
      { id: 'clothes', t: 'Change of clothes and sturdy shoes', q: `${people} sets`, n: 'Keep shoes by the bed for quakes.', p: 2 }
    ];
    if (has('hazards', 'storm')) warm.push({ id: 'warmers', t: 'Hand warmers, hats, gloves, thermal layers', q: `${people} sets`, n: 'Never run a generator or grill indoors.', p: 1 }, { id: 'coalarm', t: 'Battery-powered carbon monoxide detector', q: '1', n: 'The biggest winter-outage killer is CO poisoning.', p: 1 });
    if (has('hazards', 'heat')) warm.push({ id: 'cool', t: 'Cooling towels, electrolyte packets, battery fan', q: `${people} sets`, n: 'Know where your nearest cooling center is.', p: 1 });
    C('Warmth & shelter', '🧣', warm);

    const haz = [];
    if (has('hazards', 'hurricane')) haz.push(
      { id: 'sand', t: 'Sandbags / flood barriers and plastic sheeting', q: '1 set', n: 'Know your evacuation zone.', p: 2 },
      { id: 'waterproof', t: 'Waterproof bag for documents and phone', q: `${Math.ceil(people / 2)}`, n: 'Keep it by your go-bag.', p: 2 },
      { id: 'gas', t: 'Full gas tank', q: 'Always above half', n: 'Fill up before a storm warning.', p: 2 });
    if (has('hazards', 'quake')) haz.push(
      { id: 'wrench', t: 'Wrench for gas shutoff', q: '1', n: 'Only shut off gas if you smell it or hear a leak.', p: 2 },
      { id: 'secure', t: 'Strap water heater and tall furniture to walls', q: 'Today', n: 'Prevents the most common injuries.', p: 1 });
    if (has('hazards', 'fire')) haz.push(
      { id: 'gobag', t: 'Packed go-bag by the door', q: `${people}`, n: 'Be ready to leave in 5 minutes.', p: 1 },
      { id: 'defens', t: 'Clear leaves and debris within 5 feet of the house', q: 'This weekend', n: 'Embers do the most damage.', p: 2 });
    if (has('hazards', 'outage')) haz.push({ id: 'cooler', t: 'Cooler and ice packs', q: '1', n: 'A closed fridge keeps food safe for about 4 hours.', p: 3 });
    if (haz.length) C('For your local risks', '⚠️', haz);

    if (p.dogs || p.cats) C('Pets', '🐾', [
      { id: 'petfood', t: 'Pet food', q: `${d + 4} days`, n: 'Plus a small extra buffer.', p: 2 },
      { id: 'petid', t: 'Collar tag, carrier or leash, recent photo', q: `${p.dogs + p.cats}`, n: 'Many shelters will not accept pets.', p: 2 },
      { id: 'petmeds', t: 'Pet medications and vaccination records', q: '1 set', n: '', p: 3 }
    ]);

    C('Documents & money', '📄', [
      { id: 'docs', t: 'Copies of IDs, insurance, and medical records', q: '1 waterproof folder + cloud copy', n: 'Also photograph them.', p: 2 },
      { id: 'cash', t: 'Cash in small bills', q: '$100+', n: 'ATMs and card readers fail in outages.', p: 2 },
      { id: 'contacts', t: 'Printed contact list', q: '1', n: 'Phones die. Numbers on paper don\'t.', p: 1 },
      { id: 'map', t: 'Paper map of your area', q: '1', n: 'Mark your evacuation routes.', p: 3 }
    ]);

    return { cats, waterGal, meals };
  }

  /* ---------- Rendering ---------- */
  const form = $('#form');
  function syncForm() {
    const p = state.profile;
    for (const k of ['adults', 'seniors', 'kids', 'infants', 'dogs', 'cats']) form.elements[k].value = p[k];
    form.elements.days.value = p.days;
    $('#haveWater').value = state.have.water;
    $('#haveMeals').value = state.have.meals;
    $('#daysOut').textContent = p.days;
    document.querySelectorAll('.chips').forEach(g => g.querySelectorAll('input').forEach(i => { i.checked = p[g.dataset.group].includes(i.value); }));
    for (const [k, v] of Object.entries(state.plan)) { const el = $('#planForm').elements[k]; if (el) el.value = v; }
  }

  function render() {
    const { cats, waterGal, meals } = build(state.profile);
    $('#statWater').textContent = waterGal;
    $('#statMeals').textContent = meals;
    const root = $('#list'); root.textContent = '';
    let total = 0, done = 0; const todo = [];
    cats.forEach(c => {
      const card = document.createElement('section'); card.className = 'card cat';
      const h = document.createElement('h3'); h.textContent = `${c.icon} ${c.name}`;
      const small = document.createElement('small'); h.append(small); card.append(h);
      let cd = 0;
      c.items.forEach(it => {
        total++;
        const ok = !!state.checked[it.id]; if (ok) { done++; cd++; } else todo.push(it);
        const lab = document.createElement('label'); lab.className = 'item' + (ok ? ' done' : '');
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = ok;
        cb.addEventListener('change', () => { state.checked[it.id] = cb.checked; save(); render(); });
        const t = document.createElement('div'); t.className = 't';
        const b = document.createElement('b'); b.textContent = it.q;
        t.append(it.t + ' — ', b);
        if (it.n) { const n = document.createElement('span'); n.className = 'n'; n.textContent = it.n; t.append(n); }
        lab.append(cb, t); card.append(lab);
      });
      small.textContent = `${cd}/${c.items.length}`;
      root.append(card);
    });
    const pct = total ? Math.round(done / total * 100) : 0;
    $('#ring').style.setProperty('--p', pct); $('#pct').textContent = pct + '%';
    $('#count').textContent = `${done} of ${total} items ready`;
    const nx = $('#next'); nx.textContent = '';
    todo.sort((a, b) => a.p - b.p).slice(0, 3).forEach(it => { const li = document.createElement('li'); li.textContent = it.t; nx.append(li); });
    if (!todo.length) { const li = document.createElement('li'); li.textContent = 'You\'re ready. Review your kit every 6 months.'; nx.append(li); }
    const days = state.profile.days;
    const hw = parseFloat(state.have.water) || 0, hm = parseFloat(state.have.meals) || 0;
    const dw = waterGal / days, dm = meals / days;
    const runDays = Math.min(hw / dw, dm > 0 ? hm / dm : Infinity);
    const shown = Math.floor(runDays * 10) / 10;
    $('#runDays').textContent = `${shown} day${shown === 1 ? '' : 's'}`;
    $('#runBar').style.width = Math.min(100, runDays / days * 100) + '%';
    const sw = Math.max(0, Math.ceil(waterGal - hw)), sm = Math.max(0, meals - hm);
    const parts = [];
    if (sw) parts.push(`${sw} gal of water`);
    if (sm) parts.push(`${sm} meals`);
    $('#runMsg').textContent = parts.length ? `Short ${parts.join(' and ')} for ${days} days.` : `Covered for the full ${days} days.`;
    window.__haven = { cats };
  }

  /* ---------- Events ---------- */
  form.addEventListener('input', e => {
    const t = e.target, p = state.profile;
    if (t.type === 'checkbox') {
      const g = t.closest('.chips').dataset.group;
      p[g] = t.checked ? [...new Set([...p[g], t.value])] : p[g].filter(v => v !== t.value);
    } else if (t.name === 'days') { p.days = Math.min(14, Math.max(3, +t.value || 3)); $('#daysOut').textContent = p.days; }
    else p[t.name] = num(t.value);
    save(); render();
  });
  form.addEventListener('submit', e => e.preventDefault());
  $('#planForm').addEventListener('input', e => { state.plan[e.target.name] = e.target.value; save(); });
  $('#planForm').addEventListener('submit', e => e.preventDefault());

  $('#print').addEventListener('click', () => window.print());
  $('#reset').addEventListener('click', () => {
    if (confirm('Clear your household, checklist, and family plan from this device?')) {
      state = clone(defaults); save(); $('#planForm').reset(); syncForm(); render();
    }
  });
  $('#copy').addEventListener('click', async () => {
    const lines = ['HAVEN — ' + state.profile.days + '-DAY READINESS LIST', ''];
    window.__haven.cats.forEach(c => {
      lines.push(c.name.toUpperCase());
      c.items.forEach(i => lines.push(`[${state.checked[i.id] ? 'x' : ' '}] ${i.t} — ${i.q}`));
      lines.push('');
    });
    const btn = $('#copy');
    try { await navigator.clipboard.writeText(lines.join('\n')); btn.textContent = 'Copied ✓'; }
    catch { btn.textContent = 'Copy failed'; }
    setTimeout(() => (btn.textContent = 'Copy list'), 1800);
  });

  /* ---------- Runway inputs ---------- */
  ['#haveWater', '#haveMeals'].forEach(s => $(s).addEventListener('input', e => {
    state.have[e.target.id === 'haveWater' ? 'water' : 'meals'] = e.target.value; save(); render();
  }));

  /* ---------- Share link ---------- */
  const ALLOWED = { hazards: ['outage', 'storm', 'hurricane', 'quake', 'fire', 'heat'], needs: ['meds', 'device', 'mobility', 'allergy', 'glasses'] };
  function fromHash() {
    const m = location.hash.match(/^#p=(.+)$/); if (!m) return;
    try {
      const o = JSON.parse(atob(decodeURIComponent(m[1]))), p = state.profile;
      for (const k of ['adults', 'seniors', 'kids', 'infants', 'dogs', 'cats']) if (k in o) p[k] = num(o[k]);
      if (o.days) p.days = Math.min(14, Math.max(3, +o.days || 3));
      for (const g of ['hazards', 'needs']) if (Array.isArray(o[g])) p[g] = o[g].filter(v => ALLOWED[g].includes(v));
      save();
    } catch {}
  }
  $('#share').addEventListener('click', async () => {
    const url = location.origin + location.pathname + '#p=' + encodeURIComponent(btoa(JSON.stringify(state.profile)));
    const b = $('#share');
    try { await navigator.clipboard.writeText(url); b.textContent = 'Link copied ✓'; } catch { prompt('Copy your link:', url); }
    setTimeout(() => (b.textContent = 'Share link'), 1800);
  });

  /* ---------- Calendar reminder ---------- */
  $('#ics').addEventListener('click', () => {
    const d = new Date(); d.setMonth(d.getMonth() + 6);
    const pad = n => String(n).padStart(2, '0');
    const ds = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Haven//EN', 'BEGIN:VEVENT', `UID:haven-${Date.now()}@haven`,
      `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ds}`, 'RRULE:FREQ=MONTHLY;INTERVAL=6',
      'SUMMARY:Refresh your Haven emergency kit',
      'DESCRIPTION:Check water\\, food and medication expiry dates\\, recharge power banks and review your family plan.',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'haven-kit-reminder.ics'; a.click(); URL.revokeObjectURL(a.href);
  });

  /* ---------- Read aloud ---------- */
  $('#speak').addEventListener('click', () => {
    const s = window.speechSynthesis, b = $('#speak'); if (!s) { b.textContent = 'Not supported'; return; }
    if (s.speaking) { s.cancel(); b.textContent = 'Read aloud'; return; }
    const text = window.__haven.cats.map(c => {
      const left = c.items.filter(i => !state.checked[i.id]);
      return left.length ? c.name + '. ' + left.map(i => `${i.t}, ${i.q}`).join('. ') : '';
    }).filter(Boolean).join('. ') || 'Everything on your list is ready.';
    const u = new SpeechSynthesisUtterance(text);
    u.onend = u.onerror = () => (b.textContent = 'Read aloud');
    b.textContent = 'Stop reading'; s.speak(u);
  });

  /* ---------- Auto demo with captions ---------- */
  const bar = $('#demoBar'), cap = $('#demoCap'), stepEl = $('#demoStep');
  const wait = async ms => { await new Promise(r => setTimeout(r, ms)); if (stopFlag) throw new Error('stop'); };
  const spot = sel => {
    document.querySelectorAll('.spot').forEach(e => e.classList.remove('spot'));
    const el = sel && $(sel); if (!el) return;
    el.classList.add('spot'); el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const say = (text, step) => { cap.textContent = text; stepEl.textContent = step; };
  const setP = (k, v) => { state.profile[k] = v; syncForm(); render(); };
  const tog = (g, v) => { const a = state.profile[g]; state.profile[g] = a.includes(v) ? a.filter(x => x !== v) : [...a, v]; syncForm(); render(); };
  const typeInto = async (name, text) => {
    const el = $('#planForm').elements[name]; el.value = '';
    for (const ch of text) { el.value += ch; state.plan[name] = el.value; await wait(28); }
  };

  async function startDemo() {
    if (demo) return;
    const snap = clone(state);
    demo = true; stopFlag = false; document.body.classList.add('demoing'); bar.hidden = false;
    try {
      state = clone(defaults); state.profile.hazards = []; state.profile.adults = 1;
      $('#planForm').reset(); syncForm(); render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      say('Meet Haven: a personalized disaster-readiness plan in under a minute. Free, private, and it works offline.', '1/9'); await wait(5500);

      spot('#form');
      say('Step 1: tell Haven who is in your home. Here, a family of five with a baby and a dog.', '2/9'); await wait(2200);
      for (const [k, v] of [['adults', 2], ['kids', 2], ['infants', 1], ['dogs', 1]]) { setP(k, v); await wait(700); }
      await wait(800);

      say('Pick the hazards where you live: wildfire and earthquake.', '3/9'); await wait(1500);
      tog('hazards', 'fire'); await wait(900); tog('hazards', 'quake'); await wait(1200);
      say('Add special needs, like daily medication.', '3/9'); await wait(1300);
      tog('needs', 'meds'); await wait(1500);

      say('Choose how many days to prepare for. Official guidance starts at 3; let\'s plan a full week.', '4/9');
      for (let d = 3; d <= 7; d++) { setP('days', d); await wait(450); }
      await wait(1800);

      spot('.summary');
      say('Instantly, Haven calculates exact amounts: gallons of water and meals of food for this family, pets included.', '5/9'); await wait(6000);

      spot('#list');
      say('Every item is tailored: formula and diapers for the baby, N95 masks for wildfire smoke, medication supply, a go-bag.', '6/9'); await wait(4500);
      const ids = ['water', 'food', 'formula', 'meds', 'mask', 'flash', 'radio', 'gobag', 'firstaid'];
      const have = new Set(window.__haven.cats.flatMap(c => c.items.map(i => i.id)));
      for (const id of ids) if (have.has(id)) { state.checked[id] = true; render(); await wait(650); }
      say('Check items off as you gather them. The readiness score climbs and progress saves on your device.', '6/9'); await wait(4500);

      spot('#runway');
      say('Your runway: enter the water and food you already have to see how many days you could actually last.', '7/9'); await wait(3500);
      state.have.water = '12'; syncForm(); render(); await wait(1200);
      state.have.meals = '30'; syncForm(); render(); await wait(1500);
      say('Haven shows exactly what you\'re short, so you know what to buy first.', '7/9'); await wait(5000);

      spot('#planForm');
      say('Supplies are half the battle. Write your family plan while you\'re calm.', '8/9'); await wait(3000);
      await typeInto('contact', 'Aunt Maria (out of state) — 555-0142'); await wait(500);
      await typeInto('meet1', 'The park across the street'); await wait(500);
      await typeInto('meet2', 'Public library on 5th Ave'); await wait(500);
      await typeInto('route', 'North on Oak St, then Highway 9 to my cousin\'s house'); await wait(1500);

      spot('.summary .actions');
      say('Share your plan with a link, add a 6-month kit reminder to your calendar, print it, or have it read aloud.', '9/9'); await wait(6000);

      spot(null);
      say('Haven: free, private, offline-ready. Now build yours.', '9/9'); await wait(4000);
    } catch (e) { if (e.message !== 'stop') console.error(e); }
    finally {
      demo = false; stopFlag = false; spot(null); bar.hidden = true; document.body.classList.remove('demoing');
      state = snap; $('#planForm').reset(); syncForm(); render(); save();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', startDemo));
  $('#demoStop').addEventListener('click', () => { stopFlag = true; });

  fromHash();
  syncForm(); render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
