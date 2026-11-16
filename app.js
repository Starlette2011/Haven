(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'haven.v1';
  const defaults = {
    profile: { adults: 2, seniors: 0, kids: 0, infants: 0, dogs: 0, cats: 0, days: 3, hazards: ['outage'], needs: [] },
    checked: {}, plan: {}
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
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
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

  syncForm(); render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
