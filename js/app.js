/* Wedding Planner v1.4 — app UI. All data lives in localStorage under "wp-*" keys (arrays of {id} items or plain objects),
   which the Scout sync engine (sync-hook / sync-core / sync-app) merges per item through Google Drive. */
(function () {
  'use strict';
  var VERSION = '1.5';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function parseD(s) { if (!s) return null; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtD(s) { var d = parseD(s); return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  /* ---------------- seed data ---------------- */
  var GROUPS = [
    ['12', '12+ months out'], ['9', '9 months out'], ['6', '6 months out'], ['4', '4 months out'],
    ['2', '2 months out'], ['1', '1 month out'], ['w', 'Week of'], ['d', 'Day of']];
  // [id, group, days-before-wedding, title, owner]
  var T = [
    ['t01', '12', 400, 'Celebrate the engagement & tell family', 'Couple'],
    ['t02', '12', 395, 'Agree on an overall budget range together', 'Couple'],
    ['t03', '12', 390, 'Pick a season / target date range', 'Couple'],
    ['t04', '12', 385, 'Draft a rough guest count & list', 'Couple'],
    ['t05', '12', 380, 'Define style, vision & priorities', 'Couple'],
    ['t06', '12', 375, 'Consider hiring a planner or day-of coordinator', 'Couple'],
    ['t07', '12', 370, 'Tour venues & build a shortlist', 'Couple'],
    ['t08', '12', 365, 'Book ceremony & reception venue; set the date', 'Couple'],
    ['t09', '12', 360, 'Get wedding insurance (if the venue requires it)', 'Couple'],
    ['t10', '12', 355, 'Book photographer (and videographer)', 'Couple'],
    ['t11', '12', 350, 'Choose wedding party', 'Couple'],
    ['t12', '12', 345, 'Start a wedding website', 'Couple'],
    ['t13', '9', 300, 'Book caterer (if not in-house) & bar service', 'Couple'],
    ['t14', '9', 295, 'Book band or DJ', 'Couple'],
    ['t15', '9', 290, 'Book officiant', 'Couple'],
    ['t16', '9', 285, 'Shop for wedding dress / attire', 'Couple'],
    ['t17', '9', 280, 'Reserve hotel room blocks for guests', 'Couple'],
    ['t18', '9', 275, 'Book florist', 'Couple'],
    ['t19', '9', 270, 'Send save-the-dates (destination: 10–12 months)', 'Couple'],
    ['t20', '9', 265, 'Plan engagement photos', 'Couple'],
    ['t21', '6', 200, 'Register for gifts', 'Couple'],
    ['t22', '6', 195, 'Order invitations & stationery', 'Couple'],
    ['t23', '6', 190, 'Book hair & makeup', 'Couple'],
    ['t24', '6', 185, 'Choose wedding party attire', 'Couple'],
    ['t25', '6', 180, 'Book rentals (tables, chairs, linens, tent)', 'Couple'],
    ['t26', '6', 175, 'Book transportation', 'Couple'],
    ['t27', '6', 170, 'Plan & book the honeymoon (check passports)', 'Couple'],
    ['t28', '6', 165, 'Book rehearsal dinner venue', 'Family'],
    ['t29', '4', 130, 'Schedule cake tasting & order cake', 'Couple'],
    ['t30', '4', 125, 'Buy wedding rings', 'Couple'],
    ['t31', '4', 120, 'Finalize menu with caterer', 'Couple'],
    ['t32', '4', 115, 'Plan ceremony details & readings', 'Couple'],
    ['t33', '4', 110, 'Order favors & welcome bags', 'Couple'],
    ['t34', '4', 105, 'Groom / partner attire fitting', 'Couple'],
    ['t35', '2', 65, 'Mail invitations (6–8 weeks before)', 'Couple'],
    ['t36', '2', 60, 'First dress fitting', 'Couple'],
    ['t37', '2', 58, 'Write vows', 'Couple'],
    ['t38', '2', 55, 'Hair & makeup trial', 'Couple'],
    ['t39', '2', 50, 'Finalize day-of timeline with vendors', 'Couple'],
    ['t40', '2', 45, 'Buy gifts for wedding party & parents', 'Couple'],
    ['t41', '1', 30, 'RSVP deadline — chase missing replies', 'Couple'],
    ['t42', '1', 28, 'Get the marriage license', 'Couple'],
    ['t43', '1', 25, 'Give final headcount to caterer & venue', 'Couple'],
    ['t44', '1', 22, 'Create seating chart & escort cards', 'Couple'],
    ['t45', '1', 20, 'Final dress fitting', 'Couple'],
    ['t46', '1', 18, 'Confirm all vendors; send shot list & music list', 'Couple'],
    ['t47', '1', 14, 'Prepare final payments & tip envelopes', 'Family'],
    ['t48', 'w', 7, 'Break in shoes; pack for honeymoon', 'Couple'],
    ['t49', 'w', 5, 'Deliver welcome bags & décor to venue', 'Family'],
    ['t50', 'w', 3, 'Confirm timeline with wedding party', 'Couple'],
    ['t51', 'w', 2, 'Manicure / self-care; pick up attire', 'Couple'],
    ['t52', 'w', 1, 'Rehearsal & rehearsal dinner', 'Family'],
    ['t53', 'd', 0, 'Eat breakfast & hydrate', 'Couple'],
    ['t54', 'd', 0, 'Bring rings, license, vows & emergency kit', 'Couple'],
    ['t55', 'd', 0, 'Hand tip envelopes to point person', 'Family'],
    ['t56', 'd', 0, 'Enjoy the day!', 'Couple'],
    ['t57', '12', 362, 'Shortlist caterers experienced with vegetarian & vegan menus', 'Couple'],
    ['t58', '9', 298, 'Ask caterers: separate prep surfaces/utensils, no meat stocks, gelatin, fish sauce or animal rennet', 'Couple'],
    ['t59', '4', 128, 'Taste the full vegetarian menu (incl. vegan & gluten-free dishes)', 'Couple'],
    ['t60', '4', 118, 'Confirm vegan & gluten-free options for every course and the cake', 'Couple'],
    ['t61', '1', 24, 'Give caterer final meal counts by option + dietary list', 'Couple'],
    ['t62', '1', 21, 'Order labels / menu cards marking V, VG, GF and allergens', 'Couple'],
    ['t63', '1', 19, 'Arrange vendor (staff) meals for photographer, band/DJ, planner', 'Couple']];
  var B = [
    ['venue', 'Venue & rentals', 22], ['catering', 'Catering & bar (vegetarian-forward)', 25], ['photo', 'Photography & video', 12],
    ['attire', 'Attire & beauty', 8], ['flowers', 'Flowers & décor', 9], ['music', 'Music & entertainment', 7],
    ['planner', 'Planner / coordinator', 4], ['stationery', 'Stationery & postage', 2], ['rings', 'Rings', 3],
    ['cake', 'Cake & desserts', 2], ['transport', 'Transportation', 2], ['favors', 'Favors & gifts', 1],
    ['officiant', 'Officiant & license', 1], ['contingency', 'Contingency (buffer)', 2]];
  var STEPS = [
    ['s1', 'Agree on a comfortable total budget', 'Use the Budget comfort step in the Wedding profile journey.'],
    ['s2', 'Choose a season or date range', 'Pick 2–3 target months. Off-season (Nov–Mar) and Fridays/Sundays are often 20–40% cheaper.'],
    ['s3', 'Estimate the guest count', 'A rough number drives venue size and ~40–50% of the budget (catering is per head).'],
    ['s4', 'Describe your style & vision', 'Formal or relaxed? Beach, barn, city, garden? Colors? Save inspiration in Ideas.'],
    ['s5', 'Rank your booking priorities', 'Decide what matters most so the money goes there first.'],
    ['s6', 'Build a venue shortlist & tour', 'Ask about capacity, availability, in-house catering, minimums and what is included.'],
    ['s7', 'Book the venue and lock the date', 'Then enter the date in Settings — every task gets a real due date.'],
    ['s8', 'Book the top-priority vendors', 'Usually photographer, caterer and band/DJ book up 9–12 months out.']];
  var CATNOTE = 'Vegetarian-first menu with plenty of choice (vegan & gluten-free on every course). Includes food, bar, staff, service charge & tax, cake-cutting fee and vendor meals. Prefer caterers experienced with plant-based menus.';
  var MEALSEED = [['Vegetarian entrée A', 'e.g. wild-mushroom risotto'], ['Vegetarian entrée B', 'e.g. eggplant parmesan / stuffed peppers'], ['Vegan', 'e.g. coconut curry with jasmine rice'], ['Gluten-free vegetarian', 'e.g. polenta with roasted vegetables'], ["Kids' vegetarian", 'e.g. mac & cheese, veggie bites']];
  var MENUSEED = [
    ['Passed appetizers', 'Caprese skewers with balsamic', 'V, GF'], ['Passed appetizers', 'Mushroom & gruyère tartlets', 'V'], ['Passed appetizers', 'Crispy cauliflower bites, buffalo or sesame', 'VG'],
    ['Passed appetizers', 'Spanakopita triangles', 'V'], ['Passed appetizers', 'Vegetable summer rolls with peanut sauce', 'VG, GF'], ['Passed appetizers', 'Whipped feta & roasted grape crostini', 'V'],
    ['Stations', 'Pasta station: cacio e pepe, pesto, marinara with seasonal veg', 'V (vegan & GF pasta available)'], ['Stations', 'Mezze bar: hummus, baba ganoush, falafel, tabbouleh, warm pita', 'VG'],
    ['Stations', 'Taco & grain-bowl bar: black beans, roasted sweet potato, jackfruit, salsas, guac', 'VG, GF'], ['Stations', 'Grazing table: cheeses, fruit, nuts, crackers, crudités', 'V'],
    ['Stations', 'Risotto or polenta bar with mushrooms, peas & parmesan', 'V, GF'], ['Entrées', 'Wild-mushroom risotto', 'V, GF'], ['Entrées', 'Eggplant parmesan / stacked eggplant', 'V'],
    ['Entrées', 'Stuffed bell peppers with quinoa & black beans', 'VG, GF'], ['Entrées', 'Butternut squash ravioli, brown-butter sage', 'V'], ['Entrées', 'Thai coconut vegetable curry', 'VG, GF'], ['Entrées', 'Roasted cauliflower steak with romesco', 'VG, GF'],
    ['Sides', 'Garlic-herb roasted potatoes', 'VG, GF'], ['Sides', 'Seasonal roasted vegetables', 'VG, GF'], ['Sides', 'Mixed greens, pears, candied pecans', 'V, GF'], ['Sides', 'Artisan bread & whipped butter / olive oil', 'V'],
    ['Desserts', 'Wedding cake (ask for a vegan tier)', 'V'], ['Desserts', 'Mini cheesecakes & fruit tarts', 'V'], ['Desserts', 'Dark-chocolate avocado mousse', 'VG, GF'], ['Desserts', 'Donut or cookie bar', 'V'],
    ['Late-night snacks', 'Soft pretzels with beer-cheese & mustard', 'V'], ['Late-night snacks', 'Mini grilled cheese & tomato-soup shooters', 'V'], ['Late-night snacks', 'Loaded fries / veggie sliders', 'V'], ['Late-night snacks', 'Popcorn bar', 'VG, GF'],
    ['Drinks', 'Signature cocktails (one for each of you)', ''], ['Drinks', 'Mocktails & infused waters', 'VG'], ['Drinks', 'Beer & wine (check vegan-friendly wines/fining)', ''], ['Drinks', 'Coffee & tea with oat/almond milk', 'VG']];
  var COURSES = ['Passed appetizers', 'Stations', 'Entrées', 'Sides', 'Desserts', 'Late-night snacks', 'Drinks', 'Other'];
  var PRI = ['Venue', 'Food & drink', 'Photography', 'Videography', 'Music / band', 'Attire', 'Flowers & décor', 'Guest count (bigger party)', 'Honeymoon', 'Planner'];
  var SCHED = [['r1', '09:00', 'Hair & makeup begins'], ['r2', '12:00', 'Photographer arrives'], ['r3', '13:30', 'First look & portraits'],
    ['r4', '15:30', 'Guests arrive'], ['r5', '16:00', 'Ceremony'], ['r6', '16:30', 'Cocktail hour'], ['r7', '17:30', 'Grand entrance & dinner'],
    ['r8', '18:30', 'Toasts'], ['r9', '18:45', 'First dance & parent dances'], ['r10', '19:00', 'Dancing'], ['r11', '20:30', 'Cake cutting'], ['r12', '22:00', 'Send-off']];

  function seed() {
    if (load('wp-settings', null) === null) save('wp-settings', { seedVer: 2 });
    if (load('wp-tasks', null) === null) save('wp-tasks', T.map(function (t) { return { id: t[0], g: t[1], off: t[2], title: t[3], owner: t[4], done: false, notes: '', due: '' }; }));
    if (load('wp-budget', null) === null) save('wp-budget', B.map(function (b) { return { id: b[0], name: b[1], pct: b[2], est: '', actual: '', notes: b[0] === 'catering' ? CATNOTE : '' }; }));
    if (load('wp-steps', null) === null) save('wp-steps', STEPS.map(function (s) { return { id: s[0], title: s[1], hint: s[2], done: false, notes: '' }; }));
    if (load('wp-priorities', null) === null) save('wp-priorities', PRI.map(function (p, i) { return { id: 'p' + (i + 1), item: p, level: '', rank: i + 1, notes: '' }; }));
    if (load('wp-schedule', null) === null) save('wp-schedule', SCHED.map(function (r) { return { id: r[0], time: r[1], title: r[2], who: '', where: '', notes: '' }; }));
    if (load('wp-meals', null) === null) save('wp-meals', MEALSEED.map(function (m, i) { return { id: 'ml' + (i + 1), name: m[0], notes: m[1] }; }));
    if (load('wp-menu', null) === null) save('wp-menu', MENUSEED.map(function (m, i) { return { id: 'mn' + (i + 1), course: m[0], name: m[1], tags: m[2], notes: '', pick: false }; }));
    var st = load('wp-settings', {});
    if (!(num(st.seedVer) >= 2)) {   // v1.2 migration for phones that installed v1/v1.1
      var ts = load('wp-tasks', []), have = {}; ts.forEach(function (t) { have[t.id] = 1; });
      var add = T.filter(function (t) { return +t[0].slice(1) >= 57 && !have[t[0]]; }).map(function (t) { return { id: t[0], g: t[1], off: t[2], title: t[3], owner: t[4], done: false, notes: '', due: '' }; });
      if (add.length) save('wp-tasks', ts.concat(add));
      var bs = load('wp-budget', []);
      save('wp-budget', bs.map(function (b) { return b.id === 'catering' && b.name === 'Catering & bar' ? Object.assign({}, b, { name: 'Catering & bar (vegetarian-forward)', notes: b.notes || CATNOTE }) : b; }));
      save('wp-settings', Object.assign({}, load('wp-settings', {}), { seedVer: 2 }));
    }
    ['wp-payments', 'wp-vendors', 'wp-guests', 'wp-tables', 'wp-ideas', 'wp-decisions', 'wp-venues'].forEach(function (k) { if (load(k, null) === null) save(k, []); });
  }

  /* ---------------- derived ---------------- */
  function S() { return load('wp-settings', {}); }
  function anchor() { var s = S(); return { d: parseD(s.date) || parseD(s.dateFrom), firm: !!parseD(s.date) }; }
  function totalBudget() { var s = S(); return num(s.budget); }
  function taskDue(t) {
    if (t.due) return parseD(t.due);
    var a = anchor().d; if (!a) return null;
    var d = new Date(a); d.setDate(d.getDate() - t.off); return d;
  }
  function relLabel(t) {
    if (t.off <= 0) return 'Day of';
    if (t.off < 14) return t.off + ' day' + (t.off > 1 ? 's' : '') + ' before';
    if (t.off < 60) return '~' + Math.round(t.off / 7) + ' weeks before';
    return '~' + Math.round(t.off / 30.4) + ' months before';
  }
  function catEst(c) { return c.est !== '' && c.est != null ? num(c.est) : totalBudget() * num(c.pct) / 100; }
  function guestPeople() {
    var out = []; load('wp-guests', []).forEach(function (h) { (h.members || []).forEach(function (m) { out.push({ h: h, m: m }); }); }); return out;
  }
  function guestCounts() {
    var c = { households: 0, invited: 0, yes: 0, no: 0, pending: 0, kids: 0, meals: {}, gifts: 0, thanks: 0 };
    var hs = load('wp-guests', []); c.households = hs.length;
    hs.forEach(function (h) { if (h.gift) c.gifts++; if (h.thanks) c.thanks++; });
    guestPeople().forEach(function (p) {
      c.invited++; var r = p.m.rsvp || 'Pending';
      if (r === 'Attending') { c.yes++; if (p.m.meal) c.meals[p.m.meal] = (c.meals[p.m.meal] || 0) + 1; } else if (r === 'Declined') c.no++; else c.pending++;
      if (p.m.child) c.kids++;
    });
    return c;
  }
  function team() {
    return { Me: '' };   // single user: one Google account on the phone + computer (address learned at sign-in, never stored in code)
  }
  function syncTeam() {
    var E = window.SXMSync && window.SXMSync.EMAILS; if (!E) return;
    var t = team();
    Object.keys(E).forEach(function (k) { delete E[k]; });
    Object.keys(t).forEach(function (k) { E[k] = t[k]; });
  }

  /* ---------------- generic edit modal ---------------- */
  var modal = $('#edit-modal');
  function closeM() { modal.classList.remove('active'); }
  modal.addEventListener('click', function (e) { if (e.target === modal || e.target.hasAttribute('data-close')) closeM(); });
  function field(f, v) {
    var id = 'f_' + f.k, val = v == null ? '' : v, h;
    if (f.type === 'check') return '<label class="cb"><input type="checkbox" class="chk" id="' + id + '"' + (val ? ' checked' : '') + '> ' + esc(f.label) + '</label>';
    if (f.type === 'select') h = '<select id="' + id + '">' + f.opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    else if (f.type === 'textarea') h = '<textarea id="' + id + '" placeholder="' + esc(f.ph || '') + '">' + esc(val) + '</textarea>';
    else h = '<input id="' + id + '" type="' + ({ number: 'text', money: 'text' }[f.type] || f.type || 'text') + '"' + (f.type === 'money' || f.type === 'number' ? ' inputmode="decimal"' : '') + ' value="' + esc(val) + '" placeholder="' + esc(f.ph || '') + '">';
    return '<label class="f">' + esc(f.label) + h + '</label>';
  }
  function readField(f) { var el = $('#f_' + f.k); if (!el) return undefined; return f.type === 'check' ? el.checked : el.value.trim(); }
  function edit(title, fields, obj, onSave, onDelete, extraHtml, extraRead) {
    $('#edit-title').textContent = title;
    $('#edit-body').innerHTML = fields.map(function (f) { return field(f, obj[f.k]); }).join('') + (extraHtml || '') +
      '<div class="actions">' + (onDelete ? '<button class="btn danger" id="m-del">Delete</button>' : '') + '<button class="btn" id="m-save">Save</button></div>';
    modal.classList.add('active');
    $('#m-save').onclick = function () { var o = Object.assign({}, obj); fields.forEach(function (f) { var v = readField(f); if (v !== undefined) o[f.k] = v; }); if (extraRead) extraRead(o); closeM(); onSave(o); render(); };
    if (onDelete) $('#m-del').onclick = function () { if (confirm('Delete this item?')) { closeM(); onDelete(); render(); } };
  }
  function crud(key, fields, title) {
    return {
      add: function (defaults) { edit('Add ' + title, fields, Object.assign({ id: uid() }, defaults || {}), function (o) { var a = load(key, []); a.push(o); save(key, a); }); },
      open: function (id) {
        var a = load(key, []), it = a.filter(function (x) { return x.id === id; })[0]; if (!it) return;
        edit('Edit ' + title, fields, it, function (o) { var b = load(key, []).map(function (x) { return x.id === id ? o : x; }); save(key, b); },
          function () { save(key, load(key, []).filter(function (x) { return x.id !== id; })); });
      },
      toggle: function (id, prop) { save(key, load(key, []).map(function (x) { if (x.id === id) { x = Object.assign({}, x); x[prop] = !x[prop]; } return x; })); render(); }
    };
  }
  var OWNERS = ['Couple'].concat(peopleNames(), ['Family', 'Planner', 'Vendor']);
  var VCATS = ['Venue', 'Catering', 'Bar', 'Photographer', 'Videographer', 'Florist', 'Band / DJ', 'Officiant', 'Planner', 'Hair & makeup', 'Attire', 'Cake', 'Rentals', 'Stationery', 'Transportation', 'Hotel', 'Other'];
  var C = {
    tasks: crud('wp-tasks', [{ k: 'title', label: 'Task' }, { k: 'owner', label: 'Owner', type: 'select', opts: OWNERS }, { k: 'due', label: 'Due date (override; blank = auto from wedding date)', type: 'date' }, { k: 'done', label: 'Done', type: 'check' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'task'),
    budget: crud('wp-budget', [{ k: 'name', label: 'Category' }, { k: 'pct', label: '% of total budget', type: 'number' }, { k: 'est', label: 'Estimated $ (blank = % × total)', type: 'money' }, { k: 'actual', label: 'Actual / contracted $', type: 'money' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'category'),
    payments: crud('wp-payments', [{ k: 'label', label: 'Payment', ph: 'e.g. Venue deposit' }, { k: 'cat', label: 'Category', type: 'select', opts: B.map(function (b) { return b[1]; }).concat(['Other']) }, { k: 'vendor', label: 'Vendor' }, { k: 'amount', label: 'Amount $', type: 'money' }, { k: 'due', label: 'Due date', type: 'date' }, { k: 'paid', label: 'Paid', type: 'check' }, { k: 'paidBy', label: 'Paid by', type: 'select', opts: [''].concat(peopleNames(), ['His family', 'Her family', 'Other']) }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'payment'),
    vendors: crud('wp-vendors', [{ k: 'cat', label: 'Category', type: 'select', opts: VCATS }, { k: 'name', label: 'Business name' }, { k: 'contact', label: 'Contact person' }, { k: 'phone', label: 'Phone', type: 'tel' }, { k: 'email', label: 'Email', type: 'email' }, { k: 'link', label: 'Website / link', type: 'url' }, { k: 'quote', label: 'Quote $', type: 'money' }, { k: 'status', label: 'Status', type: 'select', opts: ['Researching', 'Contacted', 'Quote received', 'Meeting set', 'Contract sent', 'Booked', 'Declined'] }, { k: 'deposit', label: 'Deposit $', type: 'money' }, { k: 'depositDue', label: 'Deposit due', type: 'date' }, { k: 'depositPaid', label: 'Deposit paid', type: 'check' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'vendor'),
    tables: crud('wp-tables', [{ k: 'name', label: 'Table name / number' }, { k: 'cap', label: 'Seats', type: 'number' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'table'),
    schedule: crud('wp-schedule', [{ k: 'time', label: 'Time', type: 'time' }, { k: 'title', label: 'What' }, { k: 'who', label: 'Who' }, { k: 'where', label: 'Where' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'schedule item'),
    ideas: crud('wp-ideas', [{ k: 'title', label: 'Title' }, { k: 'cat', label: 'Category', type: 'select', opts: ['Overall vibe', 'Venue', 'Décor', 'Flowers', 'Attire', 'Cake', 'Music', 'Food', 'Stationery', 'Photos', 'Other'] }, { k: 'url', label: 'Link (Pinterest, Instagram…)', type: 'url' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'idea'),
    decisions: crud('wp-decisions', [{ k: 'date', label: 'Date', type: 'date' }, { k: 'topic', label: 'Topic', ph: 'e.g. Season' }, { k: 'decision', label: 'Decision', type: 'textarea' }, { k: 'by', label: 'Decided by', ph: 'e.g. Both of us' }, { k: 'status', label: 'Status', type: 'select', opts: ['Decided', 'Leaning', 'Open question', 'Revisit'] }, { k: 'notes', label: 'Why / alternatives considered', type: 'textarea' }], 'decision'),
    venues: crud('wp-venues', [{ k: 'name', label: 'Venue' }, { k: 'location', label: 'Location' }, { k: 'link', label: 'Website', type: 'url' }, { k: 'capacity', label: 'Capacity', type: 'number' }, { k: 'price', label: 'Price / minimum $', type: 'money' }, { k: 'dates', label: 'Available dates' }, { k: 'included', label: "What's included", type: 'textarea' }, { k: 'rating', label: 'Rating', type: 'select', opts: ['', '★', '★★', '★★★', '★★★★', '★★★★★'] }, { k: 'status', label: 'Status', type: 'select', opts: ['Idea', 'Inquired', 'Tour booked', 'Toured', 'Top choice', 'Booked', 'Ruled out'] }, { k: 'notes', label: 'Pros / cons', type: 'textarea' }], 'venue'),
    meals: crud('wp-meals', [{ k: 'name', label: 'Meal option (shown on RSVP)' }, { k: 'notes', label: 'Description', type: 'textarea' }], 'meal option'),
    menu: crud('wp-menu', [{ k: 'course', label: 'Course', type: 'select', opts: COURSES }, { k: 'name', label: 'Dish / idea' }, { k: 'tags', label: 'Dietary tags', ph: 'V, VG, GF, contains nuts…' }, { k: 'pick', label: 'On our menu (shortlisted)', type: 'check' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'menu item'),
    steps: crud('wp-steps', [{ k: 'title', label: 'Step' }, { k: 'done', label: 'Done', type: 'check' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'step'),
    priorities: crud('wp-priorities', [{ k: 'item', label: 'Item' }, { k: 'level', label: 'Priority', type: 'select', opts: ['', 'Must-have', 'Important', 'Nice to have', 'Skip'] }, { k: 'rank', label: 'Rank (1 = book first)', type: 'number' }, { k: 'notes', label: 'Notes', type: 'textarea' }], 'priority')
  };

  /* guest household editor (members are nested so a household syncs as one item) */
  var RSVP = ['Pending', 'Attending', 'Declined'];
  function mealList() { return [''].concat(load('wp-meals', []).map(function (m) { return m.name; })); }
  var GF = [{ k: 'household', label: 'Household / invitation name', ph: 'e.g. The Smith Family' }, { k: 'side', label: 'Side', type: 'select', opts: ['', N1() + "'s", N2() + "'s", 'Both / friends'] }, { k: 'group', label: 'Group', ph: 'Family, college friends, work…' }, { k: 'address', label: 'Mailing address', type: 'textarea' }, { k: 'email', label: 'Email', type: 'email' }, { k: 'phone', label: 'Phone', type: 'tel' }, { k: 'plusOne', label: 'Plus-one allowed', type: 'check' }, { k: 'table', label: 'Table' }, { k: 'saveDate', label: 'Save-the-date sent', type: 'check' }, { k: 'invite', label: 'Invitation sent', type: 'check' }, { k: 'gift', label: 'Gift received', type: 'textarea', ph: 'What was it?' }, { k: 'thanks', label: 'Thank-you sent', type: 'check' }, { k: 'notes', label: 'Notes', type: 'textarea' }];
  function memberHtml(m, i) {
    return '<div class="member" data-i="' + i + '"><input data-m="name" placeholder="Guest name" value="' + esc(m.name) + '">' +
      '<div class="mrow"><select data-m="rsvp">' + RSVP.map(function (r) { return '<option' + (r === (m.rsvp || 'Pending') ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' +
      '<select data-m="meal">' + (function () { var l = mealList(); if (m.meal && l.indexOf(m.meal) < 0) l.push(m.meal); return l; })().map(function (r) { return '<option value="' + r + '"' + (r === (m.meal || '') ? ' selected' : '') + '>' + (r || 'Meal…') + '</option>'; }).join('') + '</select></div>' +
      '<div class="mrow"><input data-m="diet" placeholder="Dietary notes" value="' + esc(m.diet) + '"><label class="cb" style="margin:0"><input type="checkbox" class="chk" data-m="child"' + (m.child ? ' checked' : '') + '> Child</label></div>' +
      '<button type="button" class="btn sm alt" data-rm="' + i + '" style="margin-top:6px">Remove guest</button></div>';
  }
  function editHousehold(id) {
    var hs = load('wp-guests', []), h = id ? hs.filter(function (x) { return x.id === id; })[0] : { id: uid(), members: [{ name: '', rsvp: 'Pending' }] };
    if (!h) return;
    var members = (h.members || []).map(function (m) { return Object.assign({}, m); });
    function readMembers() { return Array.prototype.map.call(document.querySelectorAll('#members .member'), function (el) { var m = {}; el.querySelectorAll('[data-m]').forEach(function (i) { m[i.getAttribute('data-m')] = i.type === 'checkbox' ? i.checked : i.value.trim(); }); return m; }); }
    function draw() { $('#members').innerHTML = members.map(memberHtml).join(''); document.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { members = readMembers(); members.splice(+b.getAttribute('data-rm'), 1); draw(); }; }); }
    edit(id ? 'Edit household' : 'Add household', GF, h, function (o) {
      var all = load('wp-guests', []); var ix = all.findIndex(function (x) { return x.id === o.id; });
      if (ix >= 0) all[ix] = o; else all.push(o); save('wp-guests', all);
    }, id ? function () { save('wp-guests', load('wp-guests', []).filter(function (x) { return x.id !== id; })); } : null,
      '<div class="grp">Guests in this household</div><div id="members"></div><button type="button" class="btn alt sm" id="add-m" style="margin-bottom:12px">+ Add guest</button>',
      function (o) { o.members = readMembers().filter(function (m) { return m.name; }); });
    draw(); $('#add-m').onclick = function () { members = readMembers(); members.push({ name: '', rsvp: 'Pending' }); draw(); };
  }

  /* ---------------- pages ---------------- */
  function head(t, sub) { return '<h2>' + esc(t) + '</h2>' + (sub ? '<p class="sub">' + sub + '</p>' : ''); }
  function bar(p, over) { return '<div class="bar' + (over ? ' over' : '') + '"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>'; }
  function N1() { return ((S().name1 || '').split(' ')[0]) || 'Partner 1'; }
  function N2() { return ((S().name2 || '').split(' ')[0]) || 'Partner 2'; }
  function couple() { var s = S(); var a = (s.name1 || '').split(' ')[0], b = (s.name2 || '').split(' ')[0]; return a && b ? a + ' & ' + b : (a || b ? (a || b) + ' & Partner' : 'Our Wedding'); }

  function deadlines(n) {
    var items = [];
    load('wp-tasks', []).forEach(function (t) { if (!t.done) { var d = taskDue(t); items.push({ d: d, t: t.title, k: 'Task', off: t.off }); } });
    load('wp-payments', []).forEach(function (p) { if (!p.paid && p.due) items.push({ d: parseD(p.due), t: (p.label || 'Payment') + (p.amount ? ' — ' + money(num(p.amount)) : ''), k: 'Payment', off: 0 }); });
    load('wp-vendors', []).forEach(function (v) { if (!v.depositPaid && v.depositDue) items.push({ d: parseD(v.depositDue), t: 'Deposit: ' + (v.name || v.cat), k: 'Deposit', off: 0 }); });
    items.sort(function (a, b) { if (a.d && b.d) return a.d - b.d; if (a.d) return -1; if (b.d) return 1; return b.off - a.off; });
    return items.slice(0, n);
  }

  function pOverviewBase() {
    var s = S(), a = anchor(), tasks = load('wp-tasks', []), done = tasks.filter(function (t) { return t.done; }).length;
    var tot = totalBudget(), cats = load('wp-budget', []), spent = cats.reduce(function (x, c) { return x + num(c.actual); }, 0);
    var paid = load('wp-payments', []).filter(function (p) { return p.paid; }).reduce(function (x, p) { return x + num(p.amount); }, 0);
    var gc = guestCounts(), steps = load('wp-steps', []), sd = steps.filter(function (x) { return x.done; }).length;
    var cd = '';
    if (a.d) {
      var days = daysBetween(today(), a.d);
      cd = days >= 0 ? '<div class="count"><div><b>' + Math.floor(days / 30.4) + '</b><small>months</small></div><div><b>' + days + '</b><small>days</small></div><div><b>' + Math.floor(days / 7) + '</b><small>weeks</small></div></div>' : '<div class="count"><div><b>&#9829;</b><small>Married!</small></div></div>';
    }
    var when = s.date ? fmtD(s.date) : (s.dateFrom ? 'Tentatively ' + fmtD(s.dateFrom) + (s.dateTo ? ' – ' + fmtD(s.dateTo) : '') : (s.season ? 'Target: ' + esc(s.season) : 'Date not set yet'));
    var h = '<div class="card hero"><h1 class="names">' + esc(couple()) + '</h1><div class="when">' + when + (s.location ? ' · ' + esc(s.location) : '') + '</div>' + cd +
      (!s.date ? '<div style="margin-top:14px"><a class="btn sm alt" href="#settings">Set the date</a></div>' : '') + '</div>';
    if (sd < steps.length) h += '<a href="#start" style="text-decoration:none;color:inherit"><div class="card"><div class="stat"><div class="k">Getting started</div><div class="v">' + sd + ' of ' + steps.length + ' first steps</div></div>' + bar(steps.length ? sd / steps.length * 100 : 0) + '<div class="m sub" style="margin:8px 0 0">Next: ' + esc((steps.filter(function (x) { return !x.done; })[0] || {}).title || '') + ' &rsaquo;</div></div></a>';
    h += '<div class="grid2"><div class="card stat"><div class="k">Budget used</div><div class="v">' + (tot ? money(spent) : '—') + '</div><div class="m sub" style="margin:2px 0 0">' + (tot ? 'of ' + money(tot) + ' · ' + money(paid) + ' paid' : 'Set a budget') + '</div>' + bar(tot ? spent / tot * 100 : 0, tot && spent > tot) + '</div>' +
      '<div class="card stat"><div class="k">Tasks</div><div class="v">' + done + ' / ' + tasks.length + '</div><div class="m sub" style="margin:2px 0 0">' + Math.round(tasks.length ? done / tasks.length * 100 : 0) + '% complete</div>' + bar(tasks.length ? done / tasks.length * 100 : 0) + '</div>' +
      '<div class="card stat"><div class="k">Guests</div><div class="v">' + gc.invited + '</div><div class="m sub" style="margin:2px 0 0">' + gc.yes + ' attending · ' + gc.pending + ' pending' + (s.guestEst ? ' · est. ' + esc(s.guestEst) : '') + '</div></div>' +
      '<div class="card stat"><div class="k">Vendors booked</div><div class="v">' + load('wp-vendors', []).filter(function (v) { return v.status === 'Booked'; }).length + '</div><div class="m sub" style="margin:2px 0 0">' + load('wp-vendors', []).length + ' tracked</div></div></div>';
    var dl = deadlines(window.innerWidth >= 1000 ? 8 : 5);
    h += '<div class="ov-cols">';
    h += '<div class="card"><h3>Next deadlines</h3><ul class="list" style="margin-top:6px">' + (dl.length ? dl.map(function (x) {
      var late = x.d && x.d < today();
      return '<li class="row"><div class="main"><div class="t">' + esc(x.t) + '</div><div class="m">' + esc(x.k) + ' · ' + (x.d ? fmtD(iso(x.d)) : relLabel({ off: x.off })) + '</div></div>' + (late ? '<span class="pill w">Overdue</span>' : '') + '</li>';
    }).join('') : '<li class="empty">Nothing due — nice!</li>') + '</ul></div>';
    var dec = load('wp-decisions', []).slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); }).slice(0, 3);
    if (dec.length) h += '<div class="card"><h3>Recent decisions</h3><ul class="list">' + dec.map(function (d) { return '<li class="row"><div class="main"><div class="t">' + esc(d.topic) + '</div><div class="m">' + esc(d.decision) + '</div></div></li>'; }).join('') + '</ul></div>';
    var bud = cats.slice().sort(function (x, y) { return catEst(y) - catEst(x); }).slice(0, 6);
    h += '<div class="card desk-only"><h3>Budget at a glance</h3>' + (tot ? bud.map(function (c) { var e = catEst(c), ac = num(c.actual); return '<div class="kv"><span>' + esc(c.name) + '</span><b>' + money(ac) + ' / ' + money(e) + '</b></div>' + bar(e ? ac / e * 100 : 0, ac > e); }).join('') : '<p class="sub" style="margin:6px 0 0">Set a total budget in Settings to see category targets.</p>') + '<a class="btn sm alt" href="#budget" style="margin-top:12px">Open budget</a></div>';
    var picks = load('wp-menu', []).filter(function (m) { return m.pick; });
    h += '<div class="card desk-only"><h3>Vegetarian menu shortlist</h3>' + (picks.length ? '<ul class="list">' + picks.slice(0, 8).map(function (m) { return '<li class="row"><div class="main"><div class="t">' + esc(m.name) + '</div><div class="m">' + esc(m.course || '') + '</div></div></li>'; }).join('') + '</ul>' : '<p class="sub" style="margin:6px 0 0">' + load('wp-menu', []).length + ' vegetarian menu ideas ready — star your favorites on the Menu page.</p>') + '<a class="btn sm alt" href="#menu" style="margin-top:12px">Open menu</a></div>';
    h += '</div>';
    return '<h1 style="display:none">Overview</h1><div>' + h + '</div>';
  }

  var VISION = [{ k: 'season', label: 'Season / target', ph: 'e.g. Fall 2027' }, { k: 'dateFrom', label: 'Date range from', type: 'date' }, { k: 'dateTo', label: 'Date range to', type: 'date' }, { k: 'guestEst', label: 'Guest count estimate', type: 'number' }, { k: 'style', label: 'Style', ph: 'e.g. Rustic, modern, beach, black-tie' }, { k: 'colors', label: 'Colors' }, { k: 'vision', label: 'Vision (in your words)', type: 'textarea' }];

  var tFilter = 'all';
  function pTimelineBase() {
    var a = anchor(), tasks = load('wp-tasks', []);
    var h = head('Timeline', a.d ? (a.firm ? 'Due dates are counted back from ' + fmtD(iso(a.d)) + '.' : 'Tentative due dates from the start of your date range (' + fmtD(iso(a.d)) + ').') : 'No date yet — tasks show how far ahead of the wedding they are due. Enter a date (or date range) in Settings and real due dates appear.');
    h += '<div class="seg">' + [['all', 'All'], ['open', 'To do'], ['done', 'Done']].map(function (x) { return '<button data-tf="' + x[0] + '" class="' + (tFilter === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    GROUPS.forEach(function (g) {
      var list = tasks.filter(function (t) { return t.g === g[0] && (tFilter === 'all' || (tFilter === 'done') === !!t.done); }).sort(function (x, y) { return y.off - x.off; });
      var all = tasks.filter(function (t) { return t.g === g[0]; });
      if (!all.length) return;
      h += '<div class="grp">' + g[1] + '<small>' + all.filter(function (t) { return t.done; }).length + '/' + all.length + '</small></div><div class="card" style="padding:4px 14px"><ul class="list">' +
        (list.length ? list.map(function (t) {
          var d = taskDue(t), late = d && !t.done && d < today();
          return '<li class="row' + (t.done ? ' done' : '') + '"><input type="checkbox" class="chk" data-tg="tasks" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + '><div class="main" data-op="tasks" data-id="' + t.id + '"><div class="t">' + esc(t.title) + '</div><div class="m">' + (d ? fmtD(iso(d)) : relLabel(t)) + ' · ' + esc(t.owner || '') + (t.notes ? ' · ' + esc(t.notes) : '') + '</div></div>' + (late ? '<span class="pill w">Overdue</span>' : '') + '</li>';
        }).join('') : '<li class="empty">—</li>') + '</ul></div>';
    });
    h += '<button class="btn alt" data-add="tasks" style="width:100%;margin-top:6px">+ Add task</button>';
    return h;
  }

  function pBudgetBase() {
    var tot = totalBudget(), cats = load('wp-budget', []), pays = load('wp-payments', []).slice().sort(function (a, b) { return (a.due || '9').localeCompare(b.due || '9'); });
    var est = cats.reduce(function (x, c) { return x + catEst(c); }, 0), act = cats.reduce(function (x, c) { return x + num(c.actual); }, 0), pct = cats.reduce(function (x, c) { return x + num(c.pct); }, 0);
    var paid = pays.filter(function (p) { return p.paid; }).reduce(function (x, p) { return x + num(p.amount); }, 0);
    var h = head('Budget', 'Typical industry allocations are pre-filled — adjust the % or override estimates. ' + (tot ? '' : 'Set a total in Settings or in the Wedding profile journey.'));
    h += '<div class="grid2"><div class="card stat"><div class="k">Total budget</div><div class="v">' + (tot ? money(tot) : '—') + '</div></div><div class="card stat"><div class="k">Actual / contracted</div><div class="v">' + money(act) + '</div>' + bar(tot ? act / tot * 100 : 0, tot && act > tot) + '</div>' +
      '<div class="card stat"><div class="k">Paid so far</div><div class="v">' + money(paid) + '</div></div><div class="card stat"><div class="k">Remaining</div><div class="v">' + (tot ? money(tot - act) : '—') + '</div></div></div>';
    if (Math.round(pct) !== 100) h += '<p class="sub">Allocations add up to ' + pct + '% (aim for 100%).</p>';
    h += '<div class="card" style="padding:4px 14px"><ul class="list">' + cats.map(function (c) {
      var e = catEst(c), a = num(c.actual);
      return '<li class="row" data-op="budget" data-id="' + c.id + '"><div class="main"><div class="t">' + esc(c.name) + ' <span class="pill n">' + esc(c.pct) + '%</span></div><div class="m">Est. ' + money(e) + (a ? ' · Actual ' + money(a) : '') + '</div>' + (e ? bar(a / e * 100, a > e) : '') + '</div></li>';
    }).join('') + '<li class="row"><div class="main"><b>Total</b></div><div class="money"><b>' + money(est) + '</b><div class="m">est.</div></div><div class="money"><b>' + money(act) + '</b><div class="m">actual</div></div></li></ul></div>' +
      '<button class="btn sm alt" data-add="budget">+ Add category</button>';
    h = h.replace('<div class="card" style="padding:4px 14px"><ul class="list">', '<div class="card dt-wrap desk"><table class="dt"><thead><tr><th>Category</th><th class="r">%</th><th class="r">Estimate</th><th class="r">Actual</th><th style="width:22%">Used</th><th>Notes</th></tr></thead><tbody>' + cats.map(function (c) {
      var e = catEst(c), a = num(c.actual);
      return '<tr data-op="budget" data-id="' + c.id + '"><td><b>' + esc(c.name) + '</b></td><td class="r">' + esc(c.pct) + '%</td><td class="r money">' + money(e) + '</td><td class="r money">' + (a ? money(a) : '—') + '</td><td>' + (e ? bar(a / e * 100, a > e) : '') + '</td><td class="nt">' + esc(c.notes || '') + '</td></tr>';
    }).join('') + '</tbody><tfoot><tr><td>Total</td><td class="r">' + pct + '%</td><td class="r money">' + money(est) + '</td><td class="r money">' + money(act) + '</td><td></td><td></td></tr></tfoot></table></div><div class="card mob" style="padding:4px 14px"><ul class="list">');
    h += '<div class="grp">Payments & deposits<small>' + money(paid) + ' paid</small></div>' + (pays.length ? '<div class="card dt-wrap desk"><table class="dt"><thead><tr><th style="width:40px">Paid</th><th>Payment</th><th>Vendor</th><th>Category</th><th>Due</th><th>Paid by</th><th class="r">Amount</th></tr></thead><tbody>' + pays.map(function (p) {
      var late = !p.paid && p.due && parseD(p.due) < today();
      return '<tr class="' + (p.paid ? 'done' : '') + '"><td><input type="checkbox" class="chk" data-tg="payments" data-id="' + p.id + '"' + (p.paid ? ' checked' : '') + '></td><td data-op="payments" data-id="' + p.id + '"><b>' + esc(p.label || 'Payment') + '</b></td><td>' + esc(p.vendor || '') + '</td><td>' + esc(p.cat || '') + '</td><td>' + (p.due ? fmtD(p.due) : '') + (late ? ' <span class="pill w">Overdue</span>' : '') + '</td><td>' + esc(p.paidBy || '') + '</td><td class="r money">' + money(num(p.amount)) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '') + '<div class="card' + (pays.length ? ' mob' : '') + '" style="padding:4px 14px"><ul class="list">' + (pays.length ? pays.map(function (p) {
      var late = !p.paid && p.due && parseD(p.due) < today();
      return '<li class="row' + (p.paid ? ' done' : '') + '"><input type="checkbox" class="chk" data-tg="payments" data-id="' + p.id + '"' + (p.paid ? ' checked' : '') + '><div class="main" data-op="payments" data-id="' + p.id + '"><div class="t">' + esc(p.label || 'Payment') + '</div><div class="m">' + [p.vendor, p.cat, p.due ? 'due ' + fmtD(p.due) : '', p.paidBy ? 'by ' + p.paidBy : ''].filter(Boolean).map(esc).join(' · ') + '</div></div>' + (late ? '<span class="pill w">Overdue</span>' : '') + '<div class="money">' + money(num(p.amount)) + '</div></li>';
    }).join('') : '<li class="empty">Track deposits and installments here</li>') + '</ul></div><button class="btn sm alt" data-add="payments">+ Add payment</button>' +
      '<div style="margin-top:12px"><button class="btn sm alt" id="csv-budget">Export budget CSV</button></div>';
    return h;
  }

  var vFilter = '';
  function pVendorsBase() {
    var vs = load('wp-vendors', []);
    var cats = VCATS.filter(function (c) { return vs.some(function (v) { return v.cat === c; }); });
    var h = head('Vendors', 'Contacts, quotes, contracts and deposits.');
    h += '<div class="toolbar"><select id="vf"><option value="">All categories</option>' + cats.map(function (c) { return '<option' + (vFilter === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select><button class="btn" data-add="vendors">+ Vendor</button></div>';
    var list = vs.filter(function (v) { return !vFilter || v.cat === vFilter; });
    if (list.length) h += '<div class="card dt-wrap desk"><table class="dt"><thead><tr><th>Business</th><th>Category</th><th>Contact</th><th>Phone / email</th><th class="r">Quote</th><th class="r">Deposit</th><th>Status</th></tr></thead><tbody>' + list.map(function (v) {
      return '<tr data-op="vendors" data-id="' + v.id + '"><td><b>' + esc(v.name || v.cat) + '</b>' + (v.link ? '<br><a class="lnk m" href="' + esc(v.link) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + esc(v.link) + '</a>' : '') + '</td><td>' + esc(v.cat || '') + '</td><td>' + esc(v.contact || '') + '</td><td>' + [v.phone, v.email].filter(Boolean).map(esc).join('<br>') + '</td><td class="r money">' + (v.quote ? money(num(v.quote)) : '') + '</td><td class="r money">' + (v.deposit ? money(num(v.deposit)) + '<div class="m">' + (v.depositPaid ? '✓ paid' : (v.depositDue ? 'due ' + fmtD(v.depositDue) : '')) + '</div>' : '') + '</td><td><span class="pill' + (v.status === 'Booked' ? ' g' : v.status === 'Declined' ? ' n' : '') + '">' + esc(v.status || 'Researching') + '</span></td></tr>';
    }).join('') + '</tbody></table></div>';
    h += '<div class="card' + (list.length ? ' mob' : '') + '" style="padding:4px 14px"><ul class="list">' + (list.length ? list.map(function (v) {
      return '<li class="row" data-op="vendors" data-id="' + v.id + '"><div class="main"><div class="t">' + esc(v.name || v.cat) + '</div><div class="m">' + [v.cat, v.contact, v.phone, v.quote ? 'quote ' + money(num(v.quote)) : '', v.deposit ? 'deposit ' + money(num(v.deposit)) + (v.depositPaid ? ' ✓ paid' : (v.depositDue ? ' due ' + fmtD(v.depositDue) : '')) : ''].filter(Boolean).map(esc).join(' · ') + '</div>' + (v.link ? '<a class="lnk m" href="' + esc(v.link) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + esc(v.link) + '</a>' : '') + '</div><span class="pill' + (v.status === 'Booked' ? ' g' : v.status === 'Declined' ? ' n' : '') + '">' + esc(v.status || 'Researching') + '</span></li>';
    }).join('') : '<li class="empty">No vendors yet</li>') + '</ul></div>';
    return h;
  }

  var gq = '', gr = '';
  function pGuestsBase() {
    var c = guestCounts(), hs = load('wp-guests', []), s = S();
    var h = head('Guest list', c.households + ' households · ' + c.invited + ' guests' + (s.guestEst ? ' (estimate ' + esc(s.guestEst) + ')' : ''));
    h += '<div class="grid2"><div class="card stat"><div class="k">Attending</div><div class="v">' + c.yes + '</div></div><div class="card stat"><div class="k">Pending</div><div class="v">' + c.pending + '</div></div><div class="card stat"><div class="k">Declined</div><div class="v">' + c.no + '</div></div><div class="card stat"><div class="k">Children</div><div class="v">' + c.kids + '</div></div></div>';
    var meals = Object.keys(c.meals);
    if (meals.length) h += '<div class="card"><h3>Meal counts (attending)</h3>' + meals.map(function (m) { return '<div class="kv"><span>' + esc(m) + '</span><b>' + c.meals[m] + '</b></div>'; }).join('') + '</div>';
    h += '<div class="card"><div class="kv"><span>Plus-ones allowed</span><b>' + hs.filter(function (x) { return x.plusOne; }).length + '</b></div><div class="kv"><span>Gifts received</span><b>' + c.gifts + '</b></div><div class="kv"><span>Thank-yous sent</span><b>' + c.thanks + ' / ' + c.gifts + '</b></div></div>';
    h += '<div class="toolbar"><input id="gq" placeholder="Search guests" value="' + esc(gq) + '"><select id="gr"><option value="">All RSVPs</option>' + RSVP.map(function (r) { return '<option' + (gr === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select><button class="btn" id="add-h">+ Household</button></div>';
    var q = gq.toLowerCase();
    var list = hs.filter(function (x) {
      var txt = (x.household + ' ' + (x.members || []).map(function (m) { return m.name; }).join(' ') + ' ' + (x.group || '')).toLowerCase();
      return (!q || txt.indexOf(q) >= 0) && (!gr || (x.members || []).some(function (m) { return (m.rsvp || 'Pending') === gr; }));
    }).sort(function (a, b) { return (a.household || '').localeCompare(b.household || ''); });
    var rows = [];
    list.forEach(function (x) { var ms = x.members && x.members.length ? x.members : [{}]; ms.forEach(function (m, i) { rows.push({ x: x, m: m, first: i === 0, n: ms.length }); }); });
    if (list.length) h += '<div class="card dt-wrap desk"><table class="dt"><thead><tr><th>Household</th><th>Guest</th><th>RSVP</th><th>Meal</th><th>Dietary</th><th>Side</th><th>Group</th><th>Table</th><th>Invite</th><th>Gift / thanks</th></tr></thead><tbody>' + rows.map(function (r) {
      var x = r.x, m = r.m;
      return '<tr data-gh="' + x.id + '" class="' + (r.first ? 'hh' : 'sub') + '">' + (r.first ? '<td rowspan="' + r.n + '"><b>' + esc(x.household || m.name || 'Household') + '</b>' + (x.plusOne ? ' <span class="pill n">+1</span>' : '') + '</td>' : '') + '<td>' + esc(m.name || '') + (m.child ? ' <span class="pill n">child</span>' : '') + '</td><td><span class="pill ' + (m.rsvp === 'Attending' ? 'g' : m.rsvp === 'Declined' ? 'n' : '') + '">' + esc(m.rsvp || 'Pending') + '</span></td><td>' + esc(m.meal || '') + '</td><td>' + esc(m.diet || '') + '</td>' +
        (r.first ? '<td rowspan="' + r.n + '">' + esc(x.side || '') + '</td><td rowspan="' + r.n + '">' + esc(x.group || '') + '</td><td rowspan="' + r.n + '">' + esc(x.table || '') + '</td><td rowspan="' + r.n + '">' + (x.invite ? '✓ sent' : x.saveDate ? 'STD ✓' : '') + '</td><td rowspan="' + r.n + '">' + (x.gift ? 'Gift ✓' : '') + (x.thanks ? ' · Thanked ✓' : '') + '</td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
    h += '<div class="card' + (list.length ? ' mob' : '') + '" style="padding:4px 14px"><ul class="list">' + (list.length ? list.map(function (x) {
      var ms = x.members || [];
      return '<li class="row" data-gh="' + x.id + '"><div class="main"><div class="t">' + esc(x.household || (ms[0] && ms[0].name) || 'Household') + '</div><div class="m">' + ms.map(function (m) { return esc(m.name) + ' <span class="pill ' + (m.rsvp === 'Attending' ? 'g' : m.rsvp === 'Declined' ? 'n' : '') + '">' + esc(m.rsvp || 'Pending') + '</span>' + (m.meal ? ' ' + esc(m.meal) : ''); }).join('<br>') + '</div><div class="m">' + [x.side, x.group, x.table ? 'Table ' + x.table : '', x.plusOne ? '+1' : '', x.gift ? 'Gift ✓' : '', x.thanks ? 'Thanked ✓' : ''].filter(Boolean).map(esc).join(' · ') + '</div></div></li>';
    }).join('') : '<li class="empty">' + (hs.length ? 'No matches' : 'Add your first household') + '</li>') + '</ul></div><button class="btn sm alt" id="csv-guests">Export guests CSV</button>';
    return h;
  }

  function pSeatingBase() {
    var tables = load('wp-tables', []), hs = load('wp-guests', []);
    var h = head('Seating chart', 'Add tables, then assign each household a table (in the household editor or the picker below).');
    var assigned = {};
    hs.forEach(function (x) { if (x.table) (assigned[x.table] = assigned[x.table] || []).push(x); });
    function seatsOf(x) { return (x.members || []).filter(function (m) { return m.rsvp !== 'Declined'; }).length; }
    h += tables.map(function (t) {
      var hh = assigned[t.name] || [], n = hh.reduce(function (a, x) { return a + seatsOf(x); }, 0), cap = num(t.cap);
      return '<div class="tbl" data-op="tables" data-id="' + t.id + '"><h4><span>' + esc(t.name) + '</span><span class="pill' + (cap && n > cap ? ' w' : '') + '">' + n + (cap ? ' / ' + cap : '') + '</span></h4><div class="chips">' + (hh.length ? hh.map(function (x) { return (x.members || []).filter(function (m) { return m.rsvp !== 'Declined'; }).map(function (m) { return '<span>' + esc(m.name) + '</span>'; }).join(''); }).join('') : '<span style="background:none;color:var(--mute)">Empty</span>') + '</div></div>';
    }).join('') || '<div class="card empty">No tables yet</div>';
    h += '<button class="btn alt" data-add="tables" style="width:100%">+ Add table</button>';
    var un = hs.filter(function (x) { return !x.table || !tables.some(function (t) { return t.name === x.table; }); }).filter(function (x) { return seatsOf(x) > 0; });
    h += '<div class="grp">Unassigned<small>' + un.reduce(function (a, x) { return a + seatsOf(x); }, 0) + ' guests</small></div><div class="card" style="padding:4px 14px"><ul class="list">' + (un.length ? un.map(function (x) {
      return '<li class="row"><div class="main"><div class="t">' + esc(x.household || 'Household') + '</div><div class="m">' + seatsOf(x) + ' seat(s)</div></div><select data-seat="' + x.id + '" style="width:auto"><option value="">Assign…</option>' + tables.map(function (t) { return '<option>' + esc(t.name) + '</option>'; }).join('') + '</select></li>';
    }).join('') : '<li class="empty">Everyone is seated</li>') + '</ul></div>';
    return h;
  }

  function pMenuBase() {
    var items = load('wp-menu', []), meals = load('wp-meals', []), c = guestCounts();
    var h = head('Menu & Catering', 'Vegetarian-first: you are both vegetarian. Starter ideas below; edit, add or delete anything and tick ★ to shortlist.');
    h += '<div class="card"><h3>Guest meal options</h3><p class="sub" style="margin:4px 0 6px">These appear as the meal choice on every guest\'s RSVP.</p><ul class="list">' + meals.map(function (m) {
      return '<li class="row" data-op="meals" data-id="' + m.id + '"><div class="main"><div class="t">' + esc(m.name) + '</div><div class="m">' + esc(m.notes || '') + '</div></div><b>' + (c.meals[m.name] || 0) + '</b></li>';
    }).join('') + '</ul><button class="btn sm alt" data-add="meals">+ Add meal option</button></div>';
    COURSES.forEach(function (co) {
      var l = items.filter(function (x) { return (x.course || 'Other') === co; }); if (!l.length && co === 'Other') return;
      h += '<div class="grp">' + esc(co) + '<small>' + l.filter(function (x) { return x.pick; }).length + ' shortlisted</small></div><div class="card" style="padding:4px 14px"><ul class="list">' + (l.length ? l.map(function (x) {
        return '<li class="row"><input type="checkbox" class="chk" data-tg="menu" data-id="' + x.id + '"' + (x.pick ? ' checked' : '') + ' aria-label="Shortlist"><div class="main" data-op="menu" data-id="' + x.id + '"><div class="t">' + esc(x.name) + '</div>' + (x.tags || x.notes ? '<div class="m">' + [x.tags, x.notes].filter(Boolean).map(esc).join(' · ') + '</div>' : '') + '</div></li>';
      }).join('') : '<li class="empty">—</li>') + '</ul></div>';
    });
    h += '<button class="btn alt" data-add="menu" style="width:100%">+ Add menu item</button>';
    h += '<div class="card" style="margin-top:12px"><h3>Questions for caterers</h3><ul class="sub" style="margin:6px 0 0;padding-left:18px">' + ['How much vegetarian & vegan catering have you done? Can we see sample menus and photos?', 'Do you use separate prep surfaces, utensils and fryers for vegetarian food?', 'Are stocks, sauces and dressings meat-free? Any gelatin, fish sauce, anchovy (Caesar, Worcestershire), lard or animal rennet in cheese?', 'Can every course have a vegan and a gluten-free option? How do you prevent cross-contact for allergies?', 'Can we taste the full vegetarian menu, including vegan / GF dishes?', 'Will you label dishes and stations (V, VG, GF, nuts) and provide menu cards?', 'Vendor / staff meals: price per vendor meal for the photographer, band/DJ, planner?', 'Per-person price, service charge, tax, gratuity, cake-cutting & corkage fees? Final-count deadline?'].map(function (q) { return '<li style="margin-bottom:4px">' + esc(q) + '</li>'; }).join('') + '</ul></div>';
    return h;
  }

  function pDayofBase() {
    var rs = load('wp-schedule', []).slice().sort(function (a, b) { return (a.time || '').localeCompare(b.time || ''); });
    var h = head('Day-of schedule', 'Run of show — a typical afternoon ceremony is pre-filled; adjust times and share with vendors and the wedding party.');
    h += '<div class="card" style="padding:4px 14px"><ul class="list">' + rs.map(function (r) {
      var t = r.time ? new Date('2000-01-01T' + r.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';
      return '<li class="row" data-op="schedule" data-id="' + r.id + '"><div class="time">' + esc(t) + '</div><div class="main"><div class="t">' + esc(r.title) + '</div><div class="m">' + [r.where, r.who, r.notes].filter(Boolean).map(esc).join(' · ') + '</div></div></li>';
    }).join('') + '</ul></div><button class="btn alt" data-add="schedule" style="width:100%">+ Add item</button>';
    return h;
  }

  function pIdeasBase() {
    var xs = load('wp-ideas', []);
    var h = head('Ideas & inspiration', 'Save links (Pinterest, Instagram, websites) and notes.');
    h += '<div class="card" style="padding:4px 14px"><ul class="list">' + (xs.length ? xs.map(function (x) {
      return '<li class="row" data-op="ideas" data-id="' + x.id + '"><div class="main"><div class="t">' + esc(x.title || 'Idea') + ' <span class="pill n">' + esc(x.cat || '') + '</span></div>' + (x.url ? '<a class="lnk m" href="' + esc(x.url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + esc(x.url) + '</a>' : '') + (x.notes ? '<div class="m">' + esc(x.notes) + '</div>' : '') + '</div></li>';
    }).join('') : '<li class="empty">No ideas saved yet</li>') + '</ul></div><button class="btn alt" data-add="ideas" style="width:100%">+ Add idea</button>';
    return h;
  }

  function pDecisions() {
    var xs = load('wp-decisions', []).slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var h = head('Decisions log', 'Record what you decided, when, who agreed and why — so nobody has to re-litigate it later.');
    h += '<div class="card" style="padding:4px 14px"><ul class="list">' + (xs.length ? xs.map(function (x) {
      return '<li class="row" data-op="decisions" data-id="' + x.id + '"><div class="main"><div class="t">' + esc(x.topic || 'Decision') + '</div><div class="m">' + esc(x.decision || '') + '</div><div class="m">' + [x.date ? fmtD(x.date) : '', x.by].filter(Boolean).map(esc).join(' · ') + '</div></div><span class="pill' + (x.status === 'Decided' ? ' g' : x.status === 'Open question' ? ' w' : '') + '">' + esc(x.status || '') + '</span></li>';
    }).join('') : '<li class="empty">No decisions yet</li>') + '</ul></div><button class="btn alt" data-add="decisions" style="width:100%">+ Log a decision</button>';
    return h;
  }

  var SF = [{ k: 'name1', label: 'Partner 1 name', ph: 'Name' }, { k: 'name2', label: 'Partner 2 name', ph: 'Name' }, { k: 'date', label: 'Wedding date (leave blank until booked)', type: 'date' }, { k: 'location', label: 'Location / venue', ph: 'Venue or town' }, { k: 'budget', label: 'Total budget $', type: 'money', ph: '$' }];
  function locSel(k, opts, cur) { return '<select data-sset="' + k + '">' + Object.keys(opts).map(function (o) { return '<option value="' + o + '"' + (cur === o ? ' selected' : '') + '>' + esc(opts[o].label) + '</option>'; }).join('') + '</select>'; }
  function locCard(s) {
    return '<div class="card" id="loc-card"><h3>📍 Wedding location & home</h3><p class="sub" style="margin:4px 0 10px">Local tips, venue types, season notes and budget estimates follow the wedding location. Honeymoon flight times follow where the couple lives.</p>' +
      '<label class="f">Wedding location' + locSel('wloc', WLOC, wlocKey()) + '</label>' + (wlocKey() === 'other' ? '<label class="f">Town / region<input data-sset="wlocText" value="' + esc(s.wlocText || '') + '" placeholder="e.g. Asheville, NC"></label>' : '') +
      '<label class="f">Couple’s home (honeymoon departure)' + locSel('home', HOMES, homeKey()) + '</label>' + (homeKey() === 'other' ? '<label class="f">Home town / airport<input data-sset="homeText" value="' + esc(s.homeText || '') + '" placeholder="e.g. Austin, TX (AUS)"></label>' : '') +
      '<div class="kv"><span>Estimates use</span><b>' + esc(WL().label) + '</b></div><div class="kv"><span>Honeymoon flights from</span><b>' + esc(HL().air || HL().label) + '</b></div></div>';
  }
  function peopleCard() {
    var a = load('wp-people', []), me = (localStorage.getItem('wp-sync-account') || '').toLowerCase();
    return '<div class="card" id="people-card"><h3>👥 People planning together</h3><p class="sub" style="margin:4px 0 10px">Everyone listed here can sign in with their Google account and edit the same plan. Names appear in task owners, “paid by” and “last edited by”. E-mails are saved only in the shared Drive data, never in the app code.</p>' +
      '<div class="ppl">' + a.map(function (x) { var mine = x.email && me.indexOf('"' + x.email.toLowerCase() + '"') >= 0; return '<div class="ppl-r' + (mine ? ' me' : '') + '"><div class="ppl-av">' + esc(((x.name || '?').trim()[0] || '?').toUpperCase()) + '</div><div class="ppl-f"><input data-pp="' + x.id + '.name" value="' + esc(x.name || '') + '" placeholder="Name"><input data-pp="' + x.id + '.email" type="email" value="' + esc(x.email || '') + '" placeholder="Google e-mail (optional)"><input data-pp="' + x.id + '.role" value="' + esc(x.role || '') + '" placeholder="Role (e.g. Partner, Mom)"></div>' + (mine ? '<span class="ppl-me">You</span>' : '') + '<button type="button" class="x sm" data-ppdel="' + x.id + '" aria-label="Remove">×</button></div>'; }).join('') + '</div><button class="btn sm" data-ppadd="1">+ Add person</button></div>';
  }
  function activityCard() {
    var meta = load('wp-sync-meta', {}), rows = Object.keys(meta).map(function (k) { return [k.split('#')[0], meta[k]]; }).filter(function (x) { return x[1] && x[1].t > 0; }).sort(function (a, b) { return b[1].t - a[1].t; });
    var seen = {}, out = []; rows.forEach(function (r) { var key = r[0] + '|' + r[1].by; if (seen[key] || out.length >= 8) return; seen[key] = 1; out.push(r); });
    var NAMES = { 'wp-tasks': 'Timeline', 'wp-budget': 'Budget', 'wp-payments': 'Payments', 'wp-guests': 'Guests', 'wp-tables': 'Seating', 'wp-vendors': 'Vendors', 'wp-venues': 'Venues', 'wp-settings': 'Settings', 'wp-people': 'People', 'wp-profile': 'Wedding journey', 'wp-menu': 'Menu', 'wp-honey': 'Honeymoon', 'wp-hm-itin': 'Itinerary', 'wp-hm-book': 'Bookings', 'wp-lists': 'Checklists', 'wp-decisions': 'Decisions', 'wp-ideas': 'Mood boards', 'wp-schedule': 'Day-of' };
    return '<div class="card" id="activity-card"><h3>🕒 Recent edits</h3>' + (out.length ? '<ul class="act">' + out.map(function (r) { return '<li><b>' + esc(r[1].by || 'Someone') + '</b> edited <span>' + esc(NAMES[r[0]] || r[0].replace('wp-', '')) + '</span><small>' + esc(new Date(r[1].t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) + '</small></li>'; }).join('') + '</ul>' : '<p class="empty">Edits from everyone will show here after syncing.</p>') + '</div>';
  }
  function pSettings() {
    var s = S();
    var h = head('Settings', 'Everything is editable. Leave fields blank until you know them.');
    h += '<div class="card">' + SF.concat(VISION).map(function (f) { return field(f, s[f.k]); }).join('') + '<button class="btn" id="save-settings" style="width:100%">Save settings</button></div>';
    h += locCard(s) + peopleCard() + activityCard();
    h += '<div class="card"><h3>Sync (everyone, all devices)</h3><p class="sub" style="margin:6px 0 10px">Tap <b>Sign in</b> at the top and use your own Google account. Everyone’s changes go to one shared “Wedding Planner Sync” folder in Google Drive (shared by the organizer), and edits merge item by item.</p>' +
      '<div class="kv"><span>Signed in as</span><b>' + esc((function () { try { return JSON.parse(localStorage.getItem('wp-sync-account') || '{}').email || 'Not signed in'; } catch (e) { return 'Not signed in'; } })()) + '</b></div><div class="kv"><span>You appear as</span><b>' + esc(localStorage.getItem('wp-sync-me') || '—') + '</b></div></div>';
    h += '<div class="card"><h3>Backup & export</h3><p class="sub" style="margin:6px 0 10px">A JSON backup contains everything and can be restored on the phone or the computer.</p>' +
      '<div class="toolbar"><button class="btn sm" id="x-json">Export backup (JSON)</button><button class="btn sm alt" id="i-json">Import backup</button><input type="file" id="i-file" accept="application/json,.json" style="display:none"></div>' +
      '<div class="toolbar"><button class="btn sm alt" id="csv-guests2">Guests CSV</button><button class="btn sm alt" id="csv-budget2">Budget CSV</button></div></div>';
    h += '<p class="sub" style="text-align:center">Wedding Planner v' + VERSION + '</p>';
    return h;
  }
  function pMoreBase() {
    var items = [['start', 'Getting Started'], ['menu', 'Menu & Catering (vegetarian)'], ['vendors', 'Vendors'], ['seating', 'Seating chart'], ['dayof', 'Day-of schedule'], ['ideas', 'Ideas & inspiration'], ['decisions', 'Decisions log'], ['settings', 'Settings, sync & backup']];
    return head('More') + '<div class="card menu">' + items.map(function (i) { return '<a href="#' + i[0] + '">' + i[1] + '</a>'; }).join('') + '</div>';
  }

  /* ---------------- CSV ---------------- */
  function csv(rows) { return rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n') + '\r\n'; }
  function exportGuests() {
    var rows = [['Household', 'Guest', 'RSVP', 'Meal', 'Dietary', 'Child', 'Side', 'Group', 'Table', 'Plus-one allowed', 'Address', 'Email', 'Phone', 'Save-the-date sent', 'Invitation sent', 'Gift', 'Thank-you sent', 'Notes']];
    load('wp-guests', []).forEach(function (h) { (h.members && h.members.length ? h.members : [{}]).forEach(function (m) { rows.push([h.household, m.name, m.rsvp || 'Pending', m.meal, m.diet, m.child ? 'Y' : '', h.side, h.group, h.table, h.plusOne ? 'Y' : '', h.address, h.email, h.phone, h.saveDate ? 'Y' : '', h.invite ? 'Y' : '', h.gift, h.thanks ? 'Y' : '', h.notes]); }); });
    WPBackup.saveFile('wedding-guests-' + WPBackup.stamp() + '.csv', csv(rows), 'text/csv');
  }
  function exportBudget() {
    var rows = [['Type', 'Category / payment', 'Allocation %', 'Estimated', 'Actual', 'Vendor', 'Amount', 'Due', 'Paid', 'Paid by', 'Notes']];
    load('wp-budget', []).forEach(function (c) { rows.push(['Category', c.name, c.pct, Math.round(catEst(c)), num(c.actual) || '', '', '', '', '', '', c.notes]); });
    load('wp-payments', []).forEach(function (p) { rows.push(['Payment', (p.cat ? p.cat + ': ' : '') + (p.label || ''), '', '', '', p.vendor, num(p.amount) || '', p.due, p.paid ? 'Y' : '', p.paidBy, p.notes]); });
    rows.push(['Total budget', '', '', totalBudget(), '', '', '', '', '', '', '']);
    WPBackup.saveFile('wedding-budget-' + WPBackup.stamp() + '.csv', csv(rows), 'text/csv');
  }

  /* ---------------- router & events ---------------- */
  /* ======================================================================================
     v1.4 "Scout-style" rich layer: guided profile, scoring, estimators, explorer, rings…
     ====================================================================================== */
  function ring(p, size, label, sub) {
    size = size || 64; var r = size / 2 - 6, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, p || 0));
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="rb"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="rf" style="stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + (c * (1 - v / 100)).toFixed(1) + '"/></svg><b>' + (label != null ? label : Math.round(v) + '%') + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
  }
  var ART = '<svg class="art" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="gl" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#fff7ef"/><stop offset="1" stop-color="#f3e4e1" stop-opacity="0"/></radialGradient></defs><rect width="600" height="200" fill="url(#gl)"/>' +
    [[40, 170, -30], [90, 190, -10], [520, 180, 20], [570, 160, 35]].map(function (b) { return '<g transform="translate(' + b[0] + ' ' + b[1] + ') rotate(' + b[2] + ')"><path d="M0 0 C 10 -60, 30 -110, 20 -160" stroke="#8a9a7b" stroke-width="2" fill="none"/>' + [20, 50, 80, 110, 140].map(function (y, i) { return '<ellipse cx="' + (i % 2 ? 14 : 2) + '" cy="-' + y + '" rx="12" ry="6" fill="#a8b89a" opacity=".75" transform="rotate(' + (i % 2 ? 30 : -30) + ' ' + (i % 2 ? 14 : 2) + ' -' + y + ')"/>'; }).join('') + '<circle cx="20" cy="-165" r="13" fill="#e8b4b8"/><circle cx="20" cy="-165" r="7" fill="#d48a93"/></g>'; }).join('') +
    [[150, 30], [450, 40], [300, 18], [220, 60], [380, 70]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.5" fill="#c9a86a" opacity=".7"><animate attributeName="opacity" values=".2;.9;.2" dur="' + (2 + p[0] % 3) + 's" repeatCount="indefinite"/></circle>'; }).join('') + '</svg>';
  function heroBand(icon, title, sub, theme) { return '<div class="band band-' + (theme || 'rose') + '">' + ART + '<div class="band-in"><div class="band-ic">' + icon + '</div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>'; }
  function callout(txt, kind) { return '<div class="callout ' + (kind || '') + '">' + txt + '</div>'; }
  function chips(key, opts, multi, cur) {
    cur = cur == null ? '' : cur;
    return '<div class="chipset">' + opts.map(function (o) { var on = multi ? (cur || []).indexOf(o) >= 0 : cur === o; return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-pf="' + key + '" data-v="' + esc(o) + '"' + (multi ? ' data-multi="1"' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div>';
  }
  function slider(key, min, max, step, val, fmt) { return '<div class="sl"><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-pfr="' + key + '" data-fmt="' + (fmt || '') + '"><output>' + fmtV(val, fmt) + '</output></div>'; }
  function fmtV(v, f) { v = +v; return f === '$' ? money(v) : f === '%' ? v + '%' : f === 'mi' ? (v >= 1000 ? 'Destination' : v + ' mi') : String(v); }
  function P() { return load('wp-profile', {}); }
  function setP(k, v) { var p = P(); p[k] = v; save('wp-profile', p); }

  /* ---------- guided wedding profile ---------- */
  var TOT = [['formal', 'Black-tie & formal', 'Relaxed & laid-back'], ['inout', 'Indoors', 'Outdoors'], ['classic', 'Classic & timeless', 'Modern & unexpected'], ['size', 'Big celebration', 'Intimate gathering'], ['time', 'Daytime brunch / lunch', 'Evening party'], ['dance', 'Dance floor all night', 'Long dinner & conversation']];
  var VIBES = ['Garden', 'Rustic barn', 'Boho', 'Modern minimal', 'Black-tie', 'Beach', 'Vintage', 'Industrial loft', 'Mountain', 'City chic', 'Vineyard', 'Cottagecore'];
  var PRIO_ALL = ['Food & drink', 'Venue', 'Photography', 'Music / band', 'Guest experience', 'Attire', 'Flowers & décor', 'Videography', 'Honeymoon', 'Planner'];
  var TOPICS = [
    ['vision', '✨', 'Vision & vibe', 'Start with feelings, not logistics. Pick a side on each card — there are no wrong answers, and disagreements are great conversation starters.'],
    ['guests', '💌', 'Guest count', 'The single biggest cost driver: food, drink, chairs, favors and venue size all scale per head. Each guest adds roughly $150–$400.'],
    ['season', '🍂', 'Season & date ideas', 'Peak season (May–Oct Saturdays) books 12–18 months out. Fridays, Sundays and Nov–Mar often save 20–40%.'],
    ['budget', '💰', 'Budget comfort', 'Agree on a comfortable total before touring anything. The U.S. average is ~$33k for ~115 guests; most couples land between $15k and $60k.'],
    ['location', '📍', 'Location type', 'Hometown, where you live now, or a destination? Travel distance shapes guest count, budget and the weekend itinerary.'],
    ['prio', '🏆', 'Priorities', 'Rank what matters most. Your top three get extra budget (“splurge”), anything marked skip gets zero. This drives the budget split.'],
    ['food', '🥗', 'Vegetarian food style', 'You are both vegetarian, so the whole menu is meat-free. Decide how you want to serve it and how much is fully vegan.'],
    ['summary', '💍', 'Our wedding profile', 'Everything you decided, in one place — and what it means for budget, checklist and next steps.']];
  function topicDone(id, p) {
    p = p || P();
    return ({ vision: p.tot && Object.keys(p.tot).length >= 3, guests: !!p.guests, season: (p.seasons || []).length > 0, budget: !!p.budget, location: !!p.loc, prio: !!p.rank, food: !!p.service, summary: !!p.applied })[id];
  }
  function profileProgress() { var p = P(); var n = TOPICS.filter(function (t) { return topicDone(t[0], p); }).length; return { n: n, of: TOPICS.length }; }
  var topicCur = 'vision';
  function ranked() { var p = P(); var r = (p.rank || PRIO_ALL).filter(function (x) { return PRIO_ALL.indexOf(x) >= 0; }); PRIO_ALL.forEach(function (x) { if (r.indexOf(x) < 0) r.push(x); }); return r; }
  var CAT_OF = { 'Food & drink': ['catering', 'cake'], 'Venue': ['venue'], 'Photography': ['photo'], 'Videography': ['photo'], 'Music / band': ['music'], 'Attire': ['attire'], 'Flowers & décor': ['flowers'], 'Planner': ['planner'], 'Guest experience': ['favors', 'transport'], 'Honeymoon': [] };
  function profileSplits() {
    var p = P(), r = ranked(), skip = p.skip || [], pct = {};
    B.forEach(function (b) { pct[b[0]] = b[2]; });
    r.slice(0, 3).forEach(function (it, i) { (CAT_OF[it] || []).forEach(function (c) { pct[c] = pct[c] * [1.35, 1.25, 1.15][i]; }); });
    skip.forEach(function (it) { (CAT_OF[it] || []).forEach(function (c) { if (c !== 'catering' && c !== 'venue') pct[c] = it === 'Videography' ? pct[c] * 0.7 : 0; }); });
    if (p.service === 'Food trucks' || p.service === 'Buffet') pct.catering *= 0.9;
    var tot = 0; Object.keys(pct).forEach(function (k) { tot += pct[k]; });
    Object.keys(pct).forEach(function (k) { pct[k] = Math.round(pct[k] / tot * 1000) / 10; });
    return pct;
  }
  /* ---------- v1.5: wedding location + couple's home (settings-driven local content) ---------- */
  var WLOC = {
    cos: { label: 'Colorado Springs, CO', short: 'Colorado Springs',
      est: [['Lower-cost area', 0.85], ['Colorado Springs', 1], ['Denver / Boulder', 1.2], ['Mountain resort town', 1.35]], estDef: 'Colorado Springs',
      vtypes: ['Mountain lodge', 'Ranch / barn', 'Red rocks (Garden of the Gods area)', 'Resort hotel (Broadmoor-style)', 'Brewery / taproom', 'Restaurant', 'Park / public land (permit)', 'Botanical garden', 'Loft / warehouse', 'Museum / gallery', 'Backyard', 'Hotel ballroom'],
      seasons: { Spring: 'Mild days, but Front Range snow is possible into May.', Summer: 'Long evenings; afternoon thunderstorms, so plan early ceremonies and shelter. Peak prices.', Fall: 'Golden aspens in September; early snow can arrive in October. Great produce for veg menus.', Winter: 'Best value, snowy mountain views; plan for icy roads.' },
      jseasons: { Spring: 'Fresh greens; late snow possible', Summer: 'Long evenings; afternoon storms', Fall: 'Golden aspens & harvest feasts', Winter: 'Snowy peaks & best value' },
      storm: 'Front Range summer thunderstorms usually build in the afternoon; outdoor weddings need a confirmed plan B and a tent quote.',
      sugg: [['Plan for the altitude (about 6,000 ft)', 'Water stations, sunscreen and shade; remind out-of-town guests to hydrate and go easy on alcohol on day one.', '']],
      vq: ['Storm & snow plan: indoor backup and tent cost?'],
      rain: ' On the Front Range, summer storms often build in the afternoon, so a morning or early-afternoon ceremony is safer.',
      guides: [
        ['🏔️', 'Planning a Colorado Springs wedding', 'Popular venue types around Colorado Springs and the Front Range include mountain lodges, ranches and barns, venues with red-rock views near Garden of the Gods, Broadmoor-style resort hotels, breweries and taprooms, restaurants and botanical gardens. Summer and fall weekends book first, so tour early and score each venue in Compare & score. Ask every caterer how they handle a fully vegetarian menu at altitude (baking and cooking times change).'],
        ['⛰️', 'Altitude & weather tips', 'Colorado Springs sits at roughly 6,000 ft, and mountain venues are higher. The air is dry and the sun is strong: plan water stations, sunscreen, shade and a few blankets for chilly evenings. Out-of-town guests should drink extra water, go easy on alcohol the first day and expect to feel winded on stairs. Expect afternoon thunderstorms in summer (move inside if you hear thunder) and snow that can arrive in early fall or late spring. Temperatures can swing a lot between day and night.'],
        ['📜', 'Permits for outdoor & public-land ceremonies', 'Many public places need a permit or reservation for a ceremony: city parks (Garden of the Gods is a city park), state parks and national forest land each have their own rules. Check group-size limits, fees, amplified sound, chairs and arches, parking, and whether vendors need their own permits. Apply months ahead for popular dates, and get approval in writing.']] },
    nalb: { label: 'New Albany, IN (Louisville metro)', short: 'New Albany / Louisville',
      est: [['Lower-cost area', 0.85], ['New Albany / Southern Indiana', 0.9], ['Louisville metro', 1], ['Upscale downtown / historic venue', 1.25]], estDef: 'New Albany / Southern Indiana',
      vtypes: ['Barn / farm', 'Winery / vineyard', 'Ohio River view / riverfront', 'Historic mansion or estate', 'Distillery / bourbon-country venue', 'Brewery / taproom', 'Restaurant', 'Church / chapel', 'Park / public land (permit)', 'Hotel ballroom', 'Loft / warehouse', 'Backyard'],
      seasons: { Spring: 'Redbuds and dogwoods; spring storms and severe-weather watches, so have an indoor plan B.', Summer: 'Hot and humid: plan shade, fans, cold water and an air-conditioned or tented reception.', Fall: 'Most popular: mild days and fall color. Great produce for veg menus.', Winter: 'Best value; occasional ice or snow, and holiday conflicts.' },
      jseasons: { Spring: 'Redbuds, dogwoods & spring storms', Summer: 'Long, hot & humid evenings', Fall: 'Fall color & harvest feasts', Winter: 'Cozy candlelight & best value' },
      storm: 'Southern Indiana and Louisville get pop-up thunderstorms in summer and severe-weather watches in spring; outdoor weddings need a confirmed plan B and a tent quote.',
      sugg: [['Plan for heat & humidity', 'Shade, fans, cold water and an air-conditioned indoor option for summer dates; bug spray near the river at dusk.', ''], ['Get the marriage license from the right state', 'The license comes from the state where the ceremony happens: Indiana for New Albany, Kentucky for Louisville.', '']],
      vq: ['Storm & heat plan: indoor backup, air conditioning and tent cost?'],
      rain: ' Around Louisville, spring brings strong storms and summer brings pop-up thunderstorms, so watch the forecast and know the indoor shelter.',
      guides: [
        ['🌉', 'Planning a New Albany / Louisville wedding', 'Venue types around New Albany, Southern Indiana and Louisville include barns and farms, wineries and vineyards, Ohio River views and riverfront spaces, historic mansions and estates, distillery or bourbon-country venues, breweries, restaurants and chapels. Louisville Muhammad Ali International Airport (SDF) is close by for out-of-town guests. Big local event weekends (for example Derby season in spring) can fill hotels and raise prices, so check the calendar before you pick a date. Score every venue in Compare & score after each tour.'],
        ['🌦️', 'Humidity, heat & spring storms', 'Summers are hot and humid: plan shade, fans, cold water stations, an air-conditioned or tented reception and lighter fabrics. Spring brings strong thunderstorms and severe-weather watches, so know where guests would shelter and set a weather-call deadline. Fall is usually the most comfortable season. Expect mosquitoes near the river at dusk.'],
        ['📜', 'Permits & two-state logistics', 'Parks and other public spaces usually need a permit or reservation for a ceremony; check group size, fees, amplified sound, parking and vendor rules, and get approval in writing. Indiana and Kentucky are across the river from each other: get the marriage license from the state where the ceremony takes place, and check each venue’s rules on outside caterers and alcohol.']] },
    other: { label: 'Other', short: '',
      est: [['Low-cost area', 0.8], ['Average', 1], ['High-cost metro', 1.35]], estDef: 'Average',
      vtypes: ['Barn / farm', 'Garden / estate', 'Hotel ballroom', 'Restaurant', 'Winery', 'Beach', 'Loft / warehouse', 'Backyard', 'Museum / gallery', 'Mountain lodge', 'Botanical garden', 'Park / public land (permit)'],
      seasons: { Spring: 'Fresh flowers, changeable weather, books fast in May.', Summer: 'Long evenings, heat & storms; peak prices.', Fall: 'Most popular season; gorgeous produce for veg menus.', Winter: 'Best value, cozy candlelit vibe, holiday conflicts.' },
      jseasons: { Spring: 'Peonies & fresh greens', Summer: 'Long golden evenings', Fall: 'Harvest feasts & warm colors', Winter: 'Candlelight & best value' },
      storm: 'Outdoor weddings need a confirmed plan B and a tent quote.', sugg: [], vq: ['Rain plan and tent cost?'], rain: '', guides: [] }
  };
  var HOMES = {
    cos: { label: 'Colorado Springs, CO', air: 'COS/DEN', note: 'Colorado Springs (most routes via Denver)' },
    nalb: { label: 'New Albany, IN (Louisville metro)', air: 'SDF', note: 'Louisville (SDF), most routes with one connection' },
    other: { label: 'Other', air: '', note: '' }
  };
  function wlocKey() { var k = S().wloc; return WLOC[k] ? k : 'cos'; }
  function WL() { var k = wlocKey(), o = WLOC[k]; if (k === 'other') { var t = (S().wlocText || '').trim(); return Object.assign({}, o, { label: t || 'Other', short: t }); } return o; }
  function homeKey() { var k = S().home; return HOMES[k] ? k : 'cos'; }
  function HL() { var k = homeKey(), o = HOMES[k]; if (k === 'other') { var t = (S().homeText || '').trim(); return Object.assign({}, o, { label: t || 'Other' }); } return o; }
  function teamPeople() { return load('wp-people', []).filter(function (x) { return x && (x.name || '').trim(); }); }
  function peopleNames() { var a = []; teamPeople().forEach(function (x) { var n = x.name.trim().split(' ')[0]; if (a.indexOf(n) < 0) a.push(n); }); [N1(), N2()].forEach(function (n) { if (!/^Partner /.test(n) && a.indexOf(n) < 0) a.unshift(n); }); return a; }
  function suggestions() {
    var p = P(), s = [], t = p.tot || {};
    if (!p.budget) s.push(['Agree on a budget range', 'Use the Budget comfort step in the Wedding profile journey.', 'budget']);
    if (t.inout === 'b') { s.push(['Plan a storm backup (tent or indoor space)', WL().storm, '']); s.push(['Check permits for an outdoor or public-land ceremony', 'Parks and other public land each have their own permit or reservation rules. Apply early.', '']); }
    WL().sugg.forEach(function (x) { s.push(x); });
    if (p.loc === 'Destination') s.push(['Research destination marriage requirements', 'Some countries need documents weeks ahead; many couples marry legally at home first.', '']);
    if (p.loc === 'Destination' || +p.travel >= 200) s.push(['Reserve hotel room blocks early', 'Out-of-town guests need blocks 9–12 months out.', '']);
    if (+p.guests >= 150) s.push(['Shortlist venues seating 150+', 'Large venues book first; check capacity with a dance floor.', 'compare']);
    if (+p.guests && +p.guests <= 50) s.push(['Look at restaurants & private dining rooms', 'Intimate weddings fit beautifully in restaurant buyouts — often the best veg food.', 'compare']);
    if ((p.seasons || []).indexOf('Winter') >= 0 || (p.days || []).indexOf('Friday') >= 0 || (p.days || []).indexOf('Sunday') >= 0) s.push(['Ask venues for off-peak pricing', 'Winter, Friday and Sunday dates often unlock 20–40% discounts.', '']);
    if (+p.vegan >= 50) s.push(['Find a caterer strong in vegan cooking', 'With ' + p.vegan + '% vegan dishes, interview plant-based specialists first.', 'menu']);
    (p.must || []).indexOf('Vegan cake tier') >= 0 && s.push(['Book a baker who does vegan tiers', 'Ask for a tasting of the vegan sponge and frosting.', '']);
    var r = ranked();
    s.push(['Book your #1 priority first: ' + r[0], 'The thing you ranked highest should be booked right after the venue.', 'compare']);
    s.push(['Tour 3+ venues and score them', 'Use Compare & score to rate each venue on the criteria you care about.', 'compare']);
    s.push(['Build the first guest list draft', 'Start with must-invites from both families.', 'guests']);
    return s;
  }
  function topicBody(id, p) {
    var h = '', t = p.tot || {};
    if (id === 'vision') {
      h += '<div class="tot">' + TOT.map(function (x) { return '<div class="tot-row"><button type="button" class="totc' + (t[x[0]] === 'a' ? ' on' : '') + '" data-tot="' + x[0] + '" data-v="a">' + esc(x[1]) + '</button><span class="vs">or</span><button type="button" class="totc' + (t[x[0]] === 'b' ? ' on' : '') + '" data-tot="' + x[0] + '" data-v="b">' + esc(x[2]) + '</button></div>'; }).join('') + '</div>';
      h += '<div class="q">Which words feel like <i>us</i>? (pick any)</div>' + chips('vibes', VIBES, true, p.vibes);
      h += '<div class="q">Color mood</div>' + chips('mood', ['Soft & romantic', 'Earthy & green', 'Bold & jewel-toned', 'Black & white', 'Bright & colorful', 'Neutral & airy'], false, p.mood);
      h += '<label class="f">In one sentence, the day should feel…<textarea data-pft="vision" placeholder="e.g. like a big garden dinner party with everyone we love">' + esc(p.vision || '') + '</textarea></label>';
    } else if (id === 'guests') {
      var g = +p.guests || 100;
      h += '<div class="q">Roughly how many guests?</div>' + slider('guests', 10, 300, 5, g);
      h += '<div class="impact"><div><b>' + money(g * 150) + '–' + money(g * 400) + '</b><small>catering & bar range</small></div><div><b>' + Math.ceil(g / 8) + '</b><small>tables of 8</small></div><div><b>' + (g <= 50 ? 'Intimate' : g <= 120 ? 'Classic' : g <= 200 ? 'Large' : 'Grand') + '</b><small>size feel</small></div></div>';
      h += '<div class="q">Who is definitely invited?</div>' + chips('circles', ['Immediate family', 'Extended family', 'Close friends', 'College friends', 'Work friends', 'Family friends', 'Plus-ones for all', 'Kids welcome'], true, p.circles);
      h += callout('<b>Conversation tip:</b> each write their own “must-invite” list first, then compare. The overlap is your A-list.');
    } else if (id === 'season') {
      h += '<div class="q">Seasons we would love</div>' + chips('seasons', ['Spring', 'Summer', 'Fall', 'Winter'], true, p.seasons);
      h += '<div class="q">Year</div>' + chips('year', [String(new Date().getFullYear() + 1), String(new Date().getFullYear() + 2), 'Not sure yet'], false, p.year);
      h += '<div class="q">Days of the week we are open to</div>' + chips('days', ['Saturday', 'Friday', 'Sunday', 'Weekday', 'Holiday weekend'], true, p.days);
      h += '<div class="q">How flexible are we on the date?</div>' + slider('flex', 0, 10, 1, p.flex == null ? 5 : p.flex);
      h += '<div class="seasons">' + [['Spring', '🌸', WL().seasons.Spring], ['Summer', '☀️', WL().seasons.Summer], ['Fall', '🍁', WL().seasons.Fall], ['Winter', '❄️', WL().seasons.Winter]].map(function (x) { return '<div class="sea' + ((p.seasons || []).indexOf(x[0]) >= 0 ? ' on' : '') + '"><span>' + x[1] + '</span><b>' + x[0] + '</b><small>' + x[2] + '</small></div>'; }).join('') + '</div>';
    } else if (id === 'budget') {
      var bu = +p.budget || 35000, g2 = +p.guests || 100;
      h += '<div class="q">Total budget we are comfortable with</div>' + slider('budget', 5000, 150000, 2500, bu, '$');
      h += '<div class="impact"><div><b>' + money(bu / g2) + '</b><small>per guest (' + g2 + ' guests)</small></div><div><b>' + money(bu * profileSplits().catering / 100) + '</b><small>for food & bar</small></div><div><b>' + money(bu * 0.05) + '</b><small>keep as buffer</small></div></div>';
      h += '<div class="q">Spending style</div>' + chips('level', ['Value — DIY & savvy', 'Balanced', 'Premium — splurge'], false, p.level);
      h += '<div class="q">How do we feel about debt?</div>' + chips('debt', ['Cash only', 'Small amount OK', 'Not sure'], false, p.debt);
      h += callout('<b>Script:</b> “What number would feel exciting, and what number would make us anxious?” Start between them.', 'amber');
    } else if (id === 'location') {
      h += '<div class="q">Where?</div>' + chips('loc', ['Where we live now', 'Hometown', 'Destination', 'Family property', 'Not sure yet'], false, p.loc);
      h += '<div class="q">Venue types to explore</div>' + chips('vtypes', WL().vtypes, true, p.vtypes);
      h += '<div class="q">How far would most guests travel?</div>' + slider('travel', 0, 1000, 25, p.travel == null ? 50 : p.travel, 'mi');
      h += '<div class="q">Ceremony & reception</div>' + chips('same', ['Same place', 'Separate ceremony site', 'Religious ceremony first'], false, p.same);
    } else if (id === 'prio') {
      var r = ranked(), skip = p.skip || [];
      h += '<ol class="rank">' + r.map(function (x, i) { var sk = skip.indexOf(x) >= 0; return '<li class="' + (sk ? 'sk' : '') + '"><span class="rn">' + (i + 1) + '</span><span class="rt">' + esc(x) + (i < 3 && !sk ? ' <span class="pill g">splurge</span>' : '') + (sk ? ' <span class="pill n">skip</span>' : '') + '</span><button type="button" class="mv" data-rk="' + i + '" data-d="-1" aria-label="Up">▲</button><button type="button" class="mv" data-rk="' + i + '" data-d="1" aria-label="Down">▼</button><button type="button" class="mv sk" data-skip="' + esc(x) + '">' + (sk ? 'Keep' : 'Skip') + '</button></li>'; }).join('') + '</ol>';
      if (!p.rank) h += '<button class="btn sm alt" data-rkok="1">This order looks right</button>';
      var sp = profileSplits();
      h += '<div class="q">What this does to the budget split</div><div class="splits">' + B.map(function (b) { return '<div class="spl"><span>' + esc(b[1].replace(' (vegetarian-forward)', '')) + '</span><i style="width:' + sp[b[0]] * 3 + '%"></i><b>' + sp[b[0]] + '%</b></div>'; }).join('') + '</div>';
    } else if (id === 'food') {
      h += '<div class="q">How should dinner be served?</div><div class="svc">' + [['Plated', '🍽️', 'Elegant, 2–3 choices on RSVP'], ['Family-style', '🥘', 'Shared platters, warm & generous'], ['Buffet', '🥗', 'Most variety, usually cheapest'], ['Stations', '🍝', 'Pasta, mezze, tacos — interactive'], ['Food trucks', '🚚', 'Casual, fun, budget-friendly']].map(function (x) { return '<button type="button" class="svcc' + (p.service === x[0] ? ' on' : '') + '" data-pf="service" data-v="' + x[0] + '"><span>' + x[1] + '</span><b>' + x[0] + '</b><small>' + x[2] + '</small></button>'; }).join('') + '</div>';
      h += '<div class="q">Cuisines we love</div>' + chips('cuisines', CUISINES, true, p.cuisines);
      h += '<div class="q">How much of the menu should be fully vegan?</div>' + slider('vegan', 0, 100, 10, p.vegan == null ? 30 : p.vegan, '%');
      h += '<div class="q">Must-haves</div>' + chips('must', ['Vegan cake tier', 'GF option every course', 'Nut-free kitchen', 'Local & seasonal', 'Late-night snack', 'Signature mocktails', 'Kids menu', 'Labelled V / VG / GF'], true, p.must);
      h += '<div class="q">Bar</div>' + chips('bar', ['Full bar', 'Beer & wine', 'Signature cocktails only', 'Dry / mocktails', 'Cash bar'], false, p.bar);
    } else if (id === 'summary') {
      var sp2 = profileSplits(), pr2 = profileProgress();
      h += '<div class="profile">' + [
        ['Vibe', [(t.formal ? (t.formal === 'a' ? 'Formal' : 'Relaxed') : ''), (t.inout ? (t.inout === 'a' ? 'indoors' : 'outdoors') : ''), (t.classic ? (t.classic === 'a' ? 'classic' : 'modern') : '')].filter(Boolean).join(', ') + ((p.vibes || []).length ? ' · ' + p.vibes.join(', ') : '')],
        ['Guests', p.guests ? '~' + p.guests + ' guests' + ((p.circles || []).length ? ' · ' + p.circles.join(', ') : '') : ''],
        ['When', [(p.seasons || []).join(' / '), p.year, (p.days || []).join(', ')].filter(Boolean).join(' · ')],
        ['Budget', p.budget ? money(+p.budget) + (p.level ? ' · ' + p.level : '') : ''],
        ['Where', [p.loc, (p.vtypes || []).join(', ')].filter(Boolean).join(' · ')],
        ['Top priorities', ranked().filter(function (x) { return (p.skip || []).indexOf(x) < 0; }).slice(0, 3).join(' › ')],
        ['Food', [p.service, (p.cuisines || []).join(', '), p.vegan != null ? p.vegan + '% vegan' : '', (p.must || []).join(', ')].filter(Boolean).join(' · ')],
        ['In our words', p.vision || '']].map(function (x) { return '<div class="pf"><span>' + x[0] + '</span><b>' + (x[1] ? esc(x[1]) : '<i class="mute">not decided yet</i>') + '</b></div>'; }).join('') + '</div>';
      h += '<div class="impact"><div>' + ring(pr2.n / pr2.of * 100, 70) + '<small>profile complete</small></div><div><b>' + money(+p.budget || 0) + '</b><small>budget</small></div><div><b>' + sp2.catering + '%</b><small>to food & bar</small></div></div>';
      h += '<button class="btn" id="apply-profile" style="width:100%">' + (p.applied ? '✓ Applied — apply again' : 'Apply to planner: budget, splits, guest estimate & season') + '</button>';
      h += '<div class="q">Suggested next steps for us</div><ul class="list sugg">' + suggestions().map(function (s, i) { return '<li class="row"><div class="main"><div class="t">' + esc(s[0]) + '</div><div class="m">' + esc(s[1]) + '</div></div><button class="btn sm alt" data-sugg="' + i + '">+ Task</button>' + (s[2] ? '<a class="btn sm alt" href="#' + s[2] + '">Go ›</a>' : '') + '</li>'; }).join('') + '</ul>';
    }
    return h;
  }
  function applyProfile() {
    var p = P(), s = S(), sp = profileSplits();
    var ns = Object.assign({}, s);
    if (p.budget && !num(s.budget)) ns.budget = String(p.budget); else if (p.budget) ns.budget = String(p.budget);
    if (p.guests) ns.guestEst = String(p.guests);
    if ((p.seasons || []).length) ns.season = p.seasons.join(' / ') + (p.year && p.year !== 'Not sure yet' ? ' ' + p.year : '');
    if ((p.vibes || []).length) ns.style = p.vibes.join(', ');
    if (p.vision) ns.vision = p.vision;
    save('wp-settings', ns);
    save('wp-budget', load('wp-budget', []).map(function (b) { return sp[b.id] != null ? Object.assign({}, b, { pct: sp[b.id] }) : b; }));
    var pri = load('wp-priorities', []), r = ranked();
    save('wp-priorities', pri.map(function (x) { var i = r.indexOf(x.item === 'Food & drink' ? 'Food & drink' : x.item); return i >= 0 ? Object.assign({}, x, { rank: i + 1, level: (p.skip || []).indexOf(x.item) >= 0 ? 'Skip' : i < 3 ? 'Must-have' : i < 6 ? 'Important' : 'Nice to have' }) : x; }));
    setP('applied', Date.now());
  }

  /* ---------- scoring: venues & vendors ---------- */
  var CRIT = {
    venue: [['cost', 'Cost / value'], ['capacity', 'Capacity fit'], ['vibe', 'Vibe & beauty'], ['veg', 'Vegetarian catering ability'], ['travel', 'Location & travel'], ['avail', 'Availability'], ['reviews', 'Reviews'], ['gut', 'Gut feel']],
    vendor: [['cost', 'Cost / value'], ['quality', 'Quality / portfolio'], ['veg', 'Vegetarian ability'], ['reviews', 'Reviews'], ['resp', 'Responsiveness'], ['vibe', 'Vibe fit'], ['avail', 'Availability'], ['gut', 'Gut feel']]
  };
  var cmpMode = 'venue', cmpCat = '';
  function weights(mode) { var w = load('wp-weights', {}); var o = {}; CRIT[mode].forEach(function (c) { var v = w[mode + '.' + c[0]]; o[c[0]] = v == null ? (c[0] === 'veg' ? 5 : c[0] === 'cost' ? 4 : 3) : +v; }); return o; }
  function score(it, mode) {
    var w = weights(mode), sc = it.sc || {}, tot = 0, max = 0, n = 0;
    CRIT[mode].forEach(function (c) { if (!w[c[0]]) return; max += 5 * w[c[0]]; if (sc[c[0]]) { tot += sc[c[0]] * w[c[0]]; n++; } else tot += 0; });
    return { pct: max ? tot / max * 100 : 0, rated: n };
  }
  function stars(key, id, crit, v) { var h = '<span class="stars">'; for (var i = 1; i <= 5; i++) h += '<button type="button" class="st' + (i <= (v || 0) ? ' on' : '') + '" data-star="' + key + '" data-id="' + id + '" data-c="' + crit + '" data-v="' + i + '" aria-label="' + i + ' stars">★</button>'; return h + '</span>'; }
  function pCompare() {
    var mode = cmpMode, key = mode === 'venue' ? 'wp-venues' : 'wp-vendors';
    var items = load(key, []); if (mode === 'vendor') { var cats = VCATS.filter(function (c) { return items.some(function (v) { return v.cat === c; }); }); if (cmpCat && cats.indexOf(cmpCat) < 0) cmpCat = ''; if (!cmpCat && cats.length) cmpCat = cats.indexOf('Catering') >= 0 ? 'Catering' : cats[0]; items = items.filter(function (v) { return v.cat === cmpCat; }); }
    var w = weights(mode);
    var h = heroBand('⚖️', 'Compare & score', 'Rate every ' + (mode === 'venue' ? 'venue' : 'vendor') + ' on the criteria that matter to you. Adjust the weights and the leaderboard re-ranks instantly.', 'sage');
    h += '<div class="seg">' + [['venue', '🏛️ Venues & locations'], ['vendor', '🤝 Vendors']].map(function (x) { return '<button data-cmode="' + x[0] + '" class="' + (mode === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (mode === 'vendor') { var allc = VCATS.filter(function (c) { return load('wp-vendors', []).some(function (v) { return v.cat === c; }); }); h += '<div class="chipset">' + (allc.length ? allc.map(function (c) { return '<button type="button" class="chip' + (c === cmpCat ? ' on' : '') + '" data-ccat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') : '') + '</div>'; }
    h += '<div class="cols2 wide-l"><div class="card"><h3>🎚️ What matters (weights)</h3><p class="sub" style="margin:4px 0 8px">0 = ignore · 5 = crucial</p>' + CRIT[mode].map(function (c) { return '<div class="wrow"><span>' + esc(c[1]) + '</span><input type="range" min="0" max="5" step="1" value="' + w[c[0]] + '" data-wt="' + mode + '.' + c[0] + '"><output>' + w[c[0]] + '</output></div>'; }).join('') + '</div>';
    var rankedItems = items.map(function (it) { return { it: it, s: score(it, mode) }; }).sort(function (a, b) { return b.s.pct - a.s.pct; });
    h += '<div class="card lb"><h3>🏆 Leaderboard</h3>' + (rankedItems.length ? rankedItems.map(function (r, i) { return '<div class="lbr' + (i === 0 && r.s.rated ? ' first' : '') + '"><span class="md">' + (['🥇', '🥈', '🥉'][i] || (i + 1)) + '</span><div class="main"><div class="t">' + esc(r.it.name || r.it.cat || 'Untitled') + '</div>' + bar(r.s.pct) + '<div class="m">' + r.s.rated + '/' + CRIT[mode].length + ' rated' + (r.it.price || r.it.quote ? ' · ' + money(num(r.it.price || r.it.quote)) : '') + (r.it.status ? ' · ' + esc(r.it.status) : '') + '</div></div><b class="sc">' + Math.round(r.s.pct) + '</b></div>'; }).join('') : '<p class="empty">Add ' + (mode === 'venue' ? 'venues' : 'vendors') + ' to start scoring.</p>') + '<button class="btn sm" data-add="' + (mode === 'venue' ? 'venues' : 'vendors') + '" style="margin-top:10px">+ Add ' + (mode === 'venue' ? 'venue' : 'vendor') + '</button></div></div>';
    if (items.length) {
      h += '<div class="grp">Side-by-side</div><div class="card dt-wrap"><table class="dt cmp"><thead><tr><th>Criterion <small>(weight)</small></th>' + rankedItems.map(function (r) { return '<th>' + esc(r.it.name || r.it.cat) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        CRIT[mode].map(function (c) { var vals = rankedItems.map(function (r) { return (r.it.sc || {})[c[0]] || 0; }), mx = Math.max.apply(null, vals); return '<tr><td><b>' + esc(c[1]) + '</b> <span class="pill n">×' + w[c[0]] + '</span></td>' + rankedItems.map(function (r, i) { return '<td class="' + (vals[i] && vals[i] === mx ? 'best' : '') + '">' + stars(key, r.it.id, c[0], vals[i]) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '<tr><td><b>' + (mode === 'venue' ? 'Price / minimum' : 'Quote') + '</b></td>' + rankedItems.map(function (r) { var v = num(r.it.price || r.it.quote); return '<td>' + (v ? money(v) : '—') + '</td>'; }).join('') + '</tr>' +
        (mode === 'venue' ? '<tr><td><b>Capacity</b></td>' + rankedItems.map(function (r) { return '<td>' + esc(r.it.capacity || '—') + '</td>'; }).join('') + '</tr>' : '') +
        '<tr><td><b>👍 Pros</b></td>' + rankedItems.map(function (r) { return '<td><textarea class="pc" data-pc="' + key + '" data-id="' + r.it.id + '" data-f="pros" placeholder="What we loved">' + esc(r.it.pros || '') + '</textarea></td>'; }).join('') + '</tr>' +
        '<tr><td><b>👎 Cons</b></td>' + rankedItems.map(function (r) { return '<td><textarea class="pc" data-pc="' + key + '" data-id="' + r.it.id + '" data-f="cons" placeholder="Concerns">' + esc(r.it.cons || '') + '</textarea></td>'; }).join('') + '</tr>' +
        '</tbody><tfoot><tr><td>Weighted score</td>' + rankedItems.map(function (r) { return '<td>' + ring(r.s.pct, 54) + '</td>'; }).join('') + '</tr></tfoot></table></div>';
      h += '<div class="cards3">' + rankedItems.map(function (r) { return '<div class="card"><div class="t" style="font-weight:600">' + esc(r.it.name || r.it.cat) + '</div><div class="m sub" style="margin:2px 0 6px">' + esc([r.it.location || r.it.contact, r.it.status].filter(Boolean).join(' · ')) + '</div><button class="btn sm alt" data-op="' + (mode === 'venue' ? 'venues' : 'vendors') + '" data-id="' + r.it.id + '">Edit details</button></div>'; }).join('') + '</div>';
    }
    h += '<div class="card"><h3>' + (mode === 'venue' ? '🗒️ Questions to ask every venue' : '🗒️ Questions to ask every vendor') + '</h3><ul class="ql">' + (mode === 'venue' ? ['Capacity seated with a dance floor?', 'Food & beverage minimum and what counts toward it?', 'In-house catering only — or can we bring a vegetarian/vegan specialist?', 'What is included: tables, chairs, linens, staff, setup?'].concat(WL().vq).concat(['Is a permit needed for an outdoor ceremony here?', 'Curfew, noise limits, end time?', 'Nearby hotels and shuttle options?', 'Deposit, payment schedule, cancellation policy?']) : ['Are you available on our date / range?', 'What exactly is included and what costs extra?', 'Can we see 2–3 full weddings you have done?', 'Experience with vegetarian couples / plant-based events?', 'Deposit, payment schedule and cancellation terms?', 'Who will actually be there on the day?', 'Insurance and backup plan if you are sick?', 'Overtime rate?']).map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul></div>';
    return h;
  }

  /* ---------- budget estimator ---------- */
  var RANGE = { lean: 140, real: 275, comf: 450 };
  function pEstimator() {
    var e = load('wp-est', {}), p = P(), g = +e.guests || +p.guests || num(S().guestEst) || 100, L = WL(), lv = e.level && L.est.some(function (x) { return x[0] === e.level; }) ? e.level : L.estDef, f = (L.est.filter(function (x) { return x[0] === lv; })[0] || [0, 1])[1];
    var sp = profileSplits(), tiers = { lean: g * RANGE.lean * f, real: g * RANGE.real * f, comf: g * RANGE.comf * f };
    var h = '<div class="card est"><h3>🧮 Budget estimator</h3><p class="sub" style="margin:4px 0 10px">Planning-range estimates for ' + esc(WL().label) + ' (change it in Settings). Not quotes: check local vendors. Splits follow your priorities from the Wedding Profile.</p>' +
      '<div class="cols2"><div><div class="q">Guests</div><div class="sl"><input type="range" min="10" max="300" step="5" value="' + g + '" data-est="guests"><output>' + g + '</output></div></div><div><div class="q">Where you marry (estimate)</div><div class="chipset">' + WL().est.map(function (y) { var x = y[0]; return '<button type="button" class="chip' + (lv === x ? ' on' : '') + '" data-estl="' + x + '">' + x + '</button>'; }).join('') + '</div></div></div>' +
      '<div class="tiers">' + [['lean', 'Lean', 'DIY, off-peak, buffet'], ['real', 'Realistic', 'Typical full-service'], ['comf', 'Comfortable', 'Premium venue & vendors']].map(function (t) { return '<div class="tier ' + t[0] + '"><small>' + t[1] + '</small><b>' + money(tiers[t[0]]) + '</b><span>' + t[2] + '</span><button class="btn sm alt" data-usebud="' + Math.round(tiers[t[0]] / 500) * 500 + '">Use this</button></div>'; }).join('') + '</div>' +
      '<div class="cols2 wide-r"><div class="donut-wrap">' + donut(B.map(function (b) { return [b[1], sp[b[0]]]; })) + '</div><div class="dt-wrap"><table class="dt"><thead><tr><th>Category</th><th class="r">Split</th><th class="r">Lean</th><th class="r">Realistic</th><th class="r">Comfortable</th></tr></thead><tbody>' + B.map(function (b) { return '<tr><td>' + esc(b[1]) + '</td><td class="r">' + sp[b[0]] + '%</td><td class="r money">' + money(tiers.lean * sp[b[0]] / 100) + '</td><td class="r money">' + money(tiers.real * sp[b[0]] / 100) + '</td><td class="r money">' + money(tiers.comf * sp[b[0]] / 100) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<button class="btn sm alt" id="apply-splits">Apply these splits to my budget categories</button></div>';
    return h;
  }
  var PAL = ['#b5838d', '#8a9a7b', '#c9a86a', '#7a4e3a', '#e5989b', '#6d6875', '#a3b18a', '#d4a373', '#588157', '#bc6c25', '#9d8189', '#cdb4db', '#457b9d', '#e9c46a'];
  function donut(parts) {
    var tot = parts.reduce(function (a, p) { return a + p[1]; }, 0) || 1, a0 = 0, r = 70, c = 2 * Math.PI * r, h = '<svg viewBox="0 0 180 180" class="donut"><g transform="rotate(-90 90 90)">';
    parts.forEach(function (p, i) { var l = p[1] / tot * c; h += '<circle cx="90" cy="90" r="' + r + '" fill="none" stroke="' + PAL[i % PAL.length] + '" stroke-width="26" stroke-dasharray="' + l.toFixed(1) + ' ' + (c - l).toFixed(1) + '" stroke-dashoffset="' + (-a0).toFixed(1) + '"><title>' + esc(p[0]) + ' ' + p[1] + '%</title></circle>'; a0 += l; });
    h += '</g><text x="90" y="86" text-anchor="middle" class="dn1">Budget</text><text x="90" y="104" text-anchor="middle" class="dn2">split</text></svg><div class="legend">' + parts.map(function (p, i) { return '<span><i style="background:' + PAL[i % PAL.length] + '"></i>' + esc(p[0].replace(' (vegetarian-forward)', '')) + '</span>'; }).join('') + '</div>';
    return h;
  }

  /* ---------- vegetarian menu explorer ---------- */
  var CUISINES = ['Italian', 'Mediterranean', 'Indian', 'Mexican', 'Asian fusion', 'Farm-to-table', 'Middle Eastern', 'Southern comfort', 'French'];
  // [course, dish, tags, cuisine, description]
  var LIB = [
    ['Passed appetizers', 'Arancini with smoked mozzarella', 'V', 'Italian', 'Crispy risotto balls, marinara dip'], ['Passed appetizers', 'Burrata & heirloom tomato crostini', 'V', 'Italian', 'Basil oil, flaky salt'], ['Passed appetizers', 'Wild-mushroom vol-au-vents', 'V', 'French', 'Thyme, crème fraîche'],
    ['Passed appetizers', 'Falafel bites with tahini', 'VG', 'Middle Eastern', 'Pickled turnip, herbs'], ['Passed appetizers', 'Vegetable samosas with tamarind chutney', 'VG', 'Indian', 'Spiced potato & pea'], ['Passed appetizers', 'Paneer tikka skewers', 'V, GF', 'Indian', 'Mint-yogurt drizzle'],
    ['Passed appetizers', 'Street-corn (elote) cups', 'V, GF', 'Mexican', 'Cotija, lime, chili'], ['Passed appetizers', 'Mini black-bean tostadas', 'VG, GF', 'Mexican', 'Avocado crema, pickled onion'], ['Passed appetizers', 'Crispy tofu bao', 'VG', 'Asian fusion', 'Hoisin, cucumber, scallion'],
    ['Passed appetizers', 'Vegetable gyoza', 'VG', 'Asian fusion', 'Ponzu dipping sauce'], ['Passed appetizers', 'Fig, goat cheese & honey bites', 'V, GF', 'Farm-to-table', 'Toasted walnut'], ['Passed appetizers', 'Pimento-cheese gougères', 'V', 'Southern comfort', 'Warm cheese puffs'],
    ['Passed appetizers', 'Watermelon, feta & mint cubes', 'V, GF', 'Mediterranean', 'Balsamic pearls'], ['Passed appetizers', 'Stuffed grape leaves (dolmas)', 'VG, GF', 'Mediterranean', 'Rice, dill, lemon'], ['Passed appetizers', 'Beet tartare on rye', 'VG', 'Farm-to-table', 'Capers, mustard aioli'],
    ['Stations', 'Hand-made pasta station', 'V', 'Italian', 'Cacio e pepe, pesto, pomodoro; GF & vegan pasta'], ['Stations', 'Mezze & flatbread bar', 'VG', 'Middle Eastern', 'Hummus trio, baba ganoush, tabbouleh, za’atar flatbreads'], ['Stations', 'Chaat & dosa counter', 'V', 'Indian', 'Masala dosa, pani puri, chutneys'],
    ['Stations', 'Build-your-own taco bar', 'VG, GF', 'Mexican', 'Jackfruit al pastor, rajas, black beans, salsas'], ['Stations', 'Ramen & bao bar', 'VG', 'Asian fusion', 'Miso-shiitake broth, toppings'], ['Stations', 'Raclette & roasted potatoes', 'V, GF', 'French', 'Melted cheese scraped tableside'],
    ['Stations', 'Mac & cheese bar', 'V', 'Southern comfort', 'Truffle, jalapeño, breadcrumb toppings'], ['Stations', 'Grain-bowl garden', 'VG, GF', 'Farm-to-table', 'Farro, quinoa, roasted veg, tahini'], ['Stations', 'Wood-fired pizza', 'V', 'Italian', 'Margherita, mushroom-truffle, vegan options'],
    ['Entrées', 'Wild-mushroom risotto', 'V, GF', 'Italian', 'Parmesan, thyme, truffle oil'], ['Entrées', 'Eggplant parmigiana stack', 'V', 'Italian', 'San Marzano tomato, basil'], ['Entrées', 'Butternut squash ravioli', 'V', 'Italian', 'Brown butter, sage, hazelnut'],
    ['Entrées', 'Roasted cauliflower steak', 'VG, GF', 'Mediterranean', 'Romesco, herb salsa verde'], ['Entrées', 'Moroccan vegetable tagine', 'VG, GF', 'Middle Eastern', 'Apricot, chickpeas, couscous (GF: quinoa)'], ['Entrées', 'Malai kofta', 'V, GF', 'Indian', 'Paneer dumplings, cashew cream sauce'],
    ['Entrées', 'Chana masala & saffron rice', 'VG, GF', 'Indian', 'Slow-cooked chickpeas'], ['Entrées', 'Poblano enchiladas verdes', 'V, GF', 'Mexican', 'Squash, corn, salsa verde'], ['Entrées', 'Thai green curry', 'VG, GF', 'Asian fusion', 'Coconut, tofu, jasmine rice'],
    ['Entrées', 'Miso-glazed eggplant', 'VG, GF', 'Asian fusion', 'Sesame, scallion, sushi rice'], ['Entrées', 'Mushroom Wellington', 'VG', 'French', 'Spinach, chestnut, red-wine jus'], ['Entrées', 'Ratatouille & herbed polenta', 'VG, GF', 'French', 'Provençal vegetables'],
    ['Entrées', 'Stuffed acorn squash', 'VG, GF', 'Farm-to-table', 'Wild rice, cranberry, pecan'], ['Entrées', 'Shrimp-free “shrimp” & grits', 'V, GF', 'Southern comfort', 'Smoked oyster mushrooms, cheddar grits'], ['Entrées', 'Spanakopita pie', 'V', 'Mediterranean', 'Spinach, feta, dill'],
    ['Sides', 'Garlic-herb fingerling potatoes', 'VG, GF', 'Farm-to-table', ''], ['Sides', 'Charred broccolini, lemon & chili', 'VG, GF', 'Italian', ''], ['Sides', 'Honey-roasted carrots, dukkah', 'V, GF', 'Middle Eastern', ''],
    ['Sides', 'Saffron rice pilaf', 'VG, GF', 'Indian', ''], ['Sides', 'Cornbread with honey butter', 'V', 'Southern comfort', ''], ['Sides', 'Mexican street-corn salad', 'V, GF', 'Mexican', ''],
    ['Sides', 'Greek salad', 'V, GF', 'Mediterranean', ''], ['Sides', 'Sesame-cucumber salad', 'VG, GF', 'Asian fusion', ''], ['Sides', 'Gratin dauphinois', 'V, GF', 'French', ''], ['Sides', 'Collard greens with smoked paprika', 'VG, GF', 'Southern comfort', 'No ham hock — smoky without meat'],
    ['Desserts', 'Tiramisu cups', 'V', 'Italian', 'Ask for gelatin-free mascarpone'], ['Desserts', 'Vegan chocolate-raspberry cake', 'VG', 'Farm-to-table', ''], ['Desserts', 'Baklava', 'V', 'Mediterranean', ''], ['Desserts', 'Gulab jamun', 'V', 'Indian', ''],
    ['Desserts', 'Churros with chocolate', 'VG', 'Mexican', ''], ['Desserts', 'Mochi ice cream', 'V, GF', 'Asian fusion', ''], ['Desserts', 'Macarons tower', 'V, GF', 'French', 'Contains almond'], ['Desserts', 'Peach cobbler', 'V', 'Southern comfort', ''], ['Desserts', 'Coconut panna cotta (agar)', 'VG, GF', 'Italian', 'Agar instead of gelatin'],
    ['Late-night snacks', 'Mini grilled cheese & tomato soup', 'V', 'Southern comfort', ''], ['Late-night snacks', 'Loaded veggie nachos', 'V, GF', 'Mexican', ''], ['Late-night snacks', 'Soft pretzels & beer cheese', 'V', 'Farm-to-table', ''], ['Late-night snacks', 'Vada pav sliders', 'VG', 'Indian', ''],
    ['Late-night snacks', 'Truffle fries cones', 'VG, GF', 'French', ''], ['Late-night snacks', 'Donut wall', 'V', 'Farm-to-table', ''],
    ['Drinks', 'Lavender lemonade', 'VG, GF', 'Farm-to-table', ''], ['Drinks', 'Mango lassi shooters', 'V, GF', 'Indian', ''], ['Drinks', 'Spicy margarita & virgin version', 'VG, GF', 'Mexican', ''], ['Drinks', 'Aperol spritz', 'VG, GF', 'Italian', 'Check vegan-fined prosecco'], ['Drinks', 'Hibiscus agua fresca', 'VG, GF', 'Mexican', ''], ['Drinks', 'Yuzu-ginger mocktail', 'VG, GF', 'Asian fusion', '']];
  var mfDiet = '', mfCourse = '', mfCuis = '', mfQ = '';
  function hasTag(t, d) { return d === 'VG' ? /VG/.test(t) : d === 'GF' ? /GF/.test(t) : d === 'NF' ? !/nut|almond|cashew|pecan|walnut|hazelnut|peanut/i.test(t) : true; }
  function pMenuExplorer() {
    var mine = {}; load('wp-menu', []).forEach(function (m) { mine[m.name.toLowerCase()] = m; });
    var list = LIB.filter(function (x) { return (!mfCourse || x[0] === mfCourse) && (!mfCuis || x[3] === mfCuis) && (!mfDiet || hasTag(x[2] + ' ' + x[1] + ' ' + x[4], mfDiet)) && (!mfQ || (x[1] + ' ' + x[4] + ' ' + x[3]).toLowerCase().indexOf(mfQ) >= 0); });
    var h = heroBand('🥗', 'Vegetarian Menu & Catering', LIB.length + ' meat-free dishes to explore. Every one is vegetarian; filter for vegan (VG), gluten-free (GF) or nut-free, and add favorites to your menu with one tap.', 'sage');
    h += '<div class="card"><div class="toolbar"><input id="mfq" placeholder="Search dishes (risotto, curry, tacos…)" value="' + esc(mfQ) + '"></div>' +
      '<div class="chipset">' + [['', 'All diets'], ['VG', 'Vegan'], ['GF', 'Gluten-free'], ['NF', 'Nut-free']].map(function (x) { return '<button type="button" class="chip' + (mfDiet === x[0] ? ' on' : '') + '" data-mf="diet" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="chipset">' + [''].concat(COURSES.slice(0, 7)).map(function (x) { return '<button type="button" class="chip' + (mfCourse === x ? ' on' : '') + '" data-mf="course" data-v="' + esc(x) + '">' + (x || 'All courses') + '</button>'; }).join('') + '</div>' +
      '<div class="chipset">' + [''].concat(CUISINES).map(function (x) { return '<button type="button" class="chip' + (mfCuis === x ? ' on' : '') + '" data-mf="cuis" data-v="' + esc(x) + '">' + (x || 'All cuisines') + '</button>'; }).join('') + '</div></div>';
    h += '<div class="dishes">' + (list.length ? list.map(function (x) { var inm = mine[x[1].toLowerCase()]; return '<div class="dish' + (inm ? ' in' : '') + '"><div class="dish-h"><span class="pill n">' + esc(x[0]) + '</span><span class="cu">' + esc(x[3]) + '</span></div><b>' + esc(x[1]) + '</b>' + (x[4] ? '<small>' + esc(x[4]) + '</small>' : '') + '<div class="tags">' + x[2].split(/,\s*/).map(function (t) { return '<span class="tg tg-' + t + '">' + t + '</span>'; }).join('') + '</div><button type="button" class="btn sm ' + (inm ? '' : 'alt') + '" data-dish="' + esc(x[1]) + '">' + (inm ? '✓ On our menu' : '+ Add to menu') + '</button></div>'; }).join('') : '<p class="empty">No dishes match — clear a filter.</p>') + '</div>';
    // themed menus
    h += '<div class="grp">Complete themed menus<small>add a whole menu in one tap</small></div><div class="cards3">' + CUISINES.slice(0, 6).map(function (cu) { var ds = LIB.filter(function (x) { return x[3] === cu; }); return '<div class="card theme"><h3>' + esc(cu) + '</h3><ul>' + ds.slice(0, 5).map(function (d) { return '<li>' + esc(d[1]) + ' <span class="tg tg-' + d[2].split(',')[0] + '">' + d[2].split(',')[0] + '</span></li>'; }).join('') + '</ul><button class="btn sm alt" data-theme="' + esc(cu) + '">Add ' + ds.length + ' dishes</button></div>'; }).join('') + '</div>';
    // service styles
    h += '<div class="grp">Service styles compared</div><div class="card dt-wrap"><table class="dt"><thead><tr><th>Style</th><th>Feel</th><th>Typical $/guest</th><th>Variety</th><th>Best for</th></tr></thead><tbody>' + [['Plated', 'Formal, calm', '$70–150', '2–3 entrées', 'Formal evening, RSVP meal choice'], ['Family-style', 'Generous, social', '$65–130', 'High', 'Long tables, warm vibe'], ['Buffet', 'Relaxed', '$45–100', 'Highest', 'Big guest lists, budget'], ['Stations', 'Interactive, fun', '$60–140', 'High', 'Mingling, showing off veg cuisine'], ['Food trucks', 'Casual, playful', '$25–60', 'Medium', 'Backyard, late-night, budget']].map(function (r) { return '<tr' + (P().service === r[0] ? ' class="hl"' : '') + '>' + r.map(function (c, i) { return '<td>' + (i ? esc(c) : '<b>' + esc(c) + '</b>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    // catering cost estimator
    var ce = load('wp-cater', {}), g = +ce.guests || +P().guests || num(S().guestEst) || 100, pp = +ce.pp || 85, svc = ce.svc == null ? 22 : +ce.svc, tax = ce.tax == null ? 7 : +ce.tax, vend = ce.vend == null ? 4 : +ce.vend;
    var sub = g * pp + vend * pp * 0.6, total = sub * (1 + svc / 100) * (1 + tax / 100);
    h += '<div class="card est"><h3>🧾 Catering cost estimator</h3><div class="cols2"><div>' + [['guests', 'Guests', 10, 300, 5, g, ''], ['pp', 'Per-person food price', 25, 200, 5, pp, '$'], ['svc', 'Service charge', 0, 30, 1, svc, '%'], ['tax', 'Sales tax', 0, 12, 0.5, tax, '%'], ['vend', 'Vendor / staff meals', 0, 15, 1, vend, '']].map(function (s) { return '<div class="q">' + s[1] + '</div><div class="sl"><input type="range" min="' + s[2] + '" max="' + s[3] + '" step="' + s[4] + '" value="' + s[5] + '" data-cater="' + s[0] + '" data-fmt="' + s[6] + '"><output>' + fmtV(s[5], s[6]) + '</output></div>'; }).join('') + '</div><div class="impact col"><div><b>' + money(total) + '</b><small>estimated catering total</small></div><div><b>' + money(total / g) + '</b><small>true cost per guest</small></div><div><b>' + money(total * 0.3) + '</b><small>typical deposit (30%)</small></div></div></div></div>';
    h += '<div class="cols2"><div class="card"><h3>🏷️ Dietary labels</h3><div class="kv"><span><span class="tg tg-V">V</span> Vegetarian</span><b>everything here</b></div><div class="kv"><span><span class="tg tg-VG">VG</span> Vegan</span><b>no dairy, eggs, honey</b></div><div class="kv"><span><span class="tg tg-GF">GF</span> Gluten-free</span><b>no wheat, barley, rye</b></div>' + callout('Hidden animal ingredients to ask about: chicken/beef stock, gelatin (panna cotta, marshmallows, some mousse), fish sauce, anchovy (Caesar, Worcestershire), lard in pastry, animal rennet in Parmesan, isinglass in some wines and beers.', 'amber') + '</div>' +
      '<div class="card"><h3>🍰 Tasting scorecard</h3><p class="sub" style="margin:4px 0 8px">Bring this to every tasting.</p><ul class="ql">' + ['Flavor & seasoning (are vegetables the star, not an afterthought?)', 'Protein balance — legumes, tofu, paneer, cheese, nuts', 'Presentation on the plate', 'Vegan dishes as good as the vegetarian ones?', 'Temperature & texture after holding', 'Portion size for a full evening', 'Allergen handling explained clearly'].map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul></div></div>';
    return h;
  }

  /* ---------- checklists ---------- */
  var LISTS = [
    ['kit', '🧰 Day-of emergency kit', ['Safety pins & sewing kit', 'Stain remover pen', 'Pain reliever & antacids', 'Band-aids & blister pads', 'Phone chargers', 'Snacks & water (vegan protein bars)', 'Breath mints', 'Tissues & blotting papers', 'Umbrella', 'Copies of vows & timeline', 'Tip envelopes', 'Lint roller', 'Deodorant', 'Hair ties & bobby pins', 'Super glue & tape']],
    ['legal', '📜 Legal & paperwork', ['Check marriage-license rules & waiting period', 'Gather IDs & birth certificates', 'Book officiant & confirm they are licensed', 'Get the marriage license', 'Sign & return the license after the ceremony', 'Order certified copies', 'Name change: Social Security, DMV, passport, banks (if any)']],
    ['honey', '✈️ Honeymoon prep', ['Choose destination & dates', 'Check passports (6+ months validity)', 'Book flights', 'Book stays (mention the honeymoon!)', 'Travel insurance', 'Notify banks of travel', 'Arrange pet/house sitter', 'Out-of-office set']],
    ['pack', '🧳 Honeymoon packing', ['Passports & copies', 'Swimwear & sun protection', 'Comfortable walking shoes', 'One nice outfit each', 'Medications', 'Adapters & chargers', 'Reusable water bottles', 'Camera', 'Reef-safe sunscreen', 'Copy of marriage certificate (for perks)', 'Travel insurance details', 'eSIM / phone plan set up', 'Light rain jacket']],
    ['after', '💌 After the wedding', ['Return rentals & suits', 'Preserve the dress / attire', 'Write thank-you notes (within 3 months)', 'Review vendors online', 'Get the photos & order an album', 'Update beneficiaries & insurance', 'Celebrate the first month!']]];
  function seedLists() {
    if (load('wp-lists', null) !== null) return;
    var a = []; LISTS.forEach(function (l) { l[2].forEach(function (t, i) { a.push({ id: l[0] + (i + 1), list: l[0], title: t, done: false }); }); });
    save('wp-lists', a);
  }
  function listStats(lid) { var it = load('wp-lists', []).filter(function (x) { return x.list === lid; }); return { n: it.filter(function (x) { return x.done; }).length, of: it.length, items: it }; }
  function listCard(l) {
    var st = listStats(l[0]);
    return '<div class="card lst"><div class="lst-h">' + ring(st.of ? st.n / st.of * 100 : 0, 58) + '<div><h3>' + l[1] + '</h3><div class="sub" style="margin:0">' + st.n + ' of ' + st.of + ' done</div></div></div><ul class="list">' + st.items.map(function (x) { return '<li class="row' + (x.done ? ' done' : '') + '"><input type="checkbox" class="chk" data-lt="' + x.id + '"' + (x.done ? ' checked' : '') + '><div class="main"><div class="t">' + esc(x.title) + '</div></div><button type="button" class="x sm" data-ldel="' + x.id + '" aria-label="Remove">×</button></li>'; }).join('') + '</ul><div class="addrow"><input placeholder="Add an item…" data-ladd="' + l[0] + '"><button class="btn sm alt" data-laddb="' + l[0] + '">Add</button></div></div>';
  }
  function pLists() {
    var h = heroBand('✅', 'Checklists', 'Tick things off on your phone or computer — progress rings update everywhere.');
    var all = load('wp-lists', []), d = all.filter(function (x) { return x.done; }).length;
    h += '<div class="ringrow">' + LISTS.map(function (l) { var s = listStats(l[0]); return '<div class="rr">' + ring(s.of ? s.n / s.of * 100 : 0, 74) + '<small>' + l[1].replace(/^\S+\s/, '') + '</small></div>'; }).join('') + '</div>';
    h += '<div class="cols2 masonry">' + LISTS.map(listCard).join('') + '</div>';
    return h;
  }

  /* ---------- honeymoon (v1.4.2 overhaul) ---------- */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var HREG = ['USA', 'Caribbean', 'Mexico & Central America', 'Europe', 'Asia & Pacific', 'South America', 'Africa', 'Canada'];
  var HVIBE = ['Beach', 'Adventure', 'Culture', 'Food & wine', 'Nature', 'Luxury', 'Road trip'];
  // [id, name, flag, region, vibes, climate, best months (1-12), flight hrs from Colorado Springs (via DEN unless noted; 0 = drive), flight label, [lean, realistic, comfortable] per couple for 7 nights incl. flights, highlights, passport/visa, {romance, adventure, relax, culture}, tagline, colours]
  var HDEST = [
    ['comtn', 'Colorado mountain mini-moon', '🏔️', 'USA', ['Nature', 'Adventure', 'Road trip', 'Luxury'], 'Cool', [6, 7, 8, 9, 12, 1, 2], 0, 'Drive ~1.5–4 h from home', [1000, 2000, 4000], ['Mountain-town lodges & hot springs', 'Golden aspens in late September', 'Ski or snowshoe days in winter', 'Alpine lakes and stargazing'], 'No passport needed. Check I-70/US-24 road conditions and chain laws in winter.', { romance: 5, adventure: 4, relax: 4, culture: 2 }, 'Leave the reception, wake up in the mountains.', ['#166534', '#93c5fd']],
    ['santafe', 'Santa Fe & Taos, New Mexico', '🌵', 'USA', ['Culture', 'Food & wine', 'Road trip', 'Nature'], 'Mild', [5, 6, 9, 10], 0, 'Drive ~4.5–5 h', [1400, 2600, 4800], ['Adobe inns & spa days', 'Canyon Road galleries', 'High-desert sunsets', 'Taos Pueblo & hot springs'], 'No passport needed.', { romance: 4, adventure: 3, relax: 4, culture: 5 }, 'Art, adobe and desert light, one road trip away.', ['#c2410c', '#0e7490']],
    ['moab', 'Moab & Utah’s national parks', '🏜️', 'USA', ['Adventure', 'Nature', 'Road trip'], 'Warm', [4, 5, 9, 10], 0, 'Drive ~5.5–6 h', [1300, 2400, 4500], ['Arches & Canyonlands at sunrise', 'Colorado River float', 'Dark-sky stargazing', 'Scenic Byway 128'], 'No passport needed. Check park timed-entry reservations before you go.', { romance: 4, adventure: 5, relax: 2, culture: 2 }, 'Red-rock road trip from your own driveway.', ['#b45309', '#1e3a8a']],
    ['smokies', 'Asheville & the Great Smoky Mountains', '🌲', 'USA', ['Nature', 'Food & wine', 'Road trip', 'Adventure'], 'Mild', [4, 5, 6, 9, 10], 5, '~5 h, usually 1 stop + drive', [1800, 3200, 5800], ['Blue Ridge Parkway drive', 'Cabin with a hot tub and mountain views', 'Waterfall hikes', 'Asheville’s food and craft scene'], 'No passport needed.', { romance: 4, adventure: 4, relax: 4, culture: 3 }, 'Misty mountains and cozy cabins.', ['#14532d', '#a16207']],
    ['maui', 'Maui, Hawaii', '🌺', 'USA', ['Beach', 'Adventure', 'Nature', 'Luxury'], 'Tropical', [4, 5, 9, 10], 8, '~8 h from DEN, nonstop options', [5000, 8000, 13500], ['Road to Hana waterfalls', 'Sunrise above the clouds on Haleakalā', 'Snorkel Molokini crater', 'Whale season Dec–Apr'], 'No passport needed (US state). Bring a REAL ID-compliant license.', { romance: 5, adventure: 4, relax: 5, culture: 3 }, 'Volcanoes, waterfalls and sunsets — no passport.', ['#0e7490', '#f59e0b']],
    ['keys', 'Florida Keys', '🐚', 'USA', ['Beach', 'Road trip', 'Nature'], 'Tropical', [12, 1, 2, 3, 4, 5], 6, '~4.5 h DEN→Miami + scenic drive', [2800, 4600, 7600], ['Overseas Highway road trip', 'Key West sunset at Mallory Square', 'Snorkel Looe Key reef', 'Dry Tortugas day trip'], 'No passport needed.', { romance: 4, adventure: 3, relax: 5, culture: 3 }, 'Island-hopping by car at the bottom of the map.', ['#06b6d4', '#fb923c']],
    ['napa', 'Napa & Sonoma, California', '🍇', 'USA', ['Food & wine', 'Luxury', 'Road trip'], 'Mild', [4, 5, 9, 10], 2.5, '~2.5 h from DEN to SFO/OAK/SMF', [3000, 5200, 9500], ['Vineyard picnics & tastings', 'Hot-air balloon at dawn', 'Calistoga mud baths', 'Drive on to Big Sur'], 'No passport needed.', { romance: 5, adventure: 2, relax: 4, culture: 3 }, 'Long lunches among the vines.', ['#7c2d12', '#a3a35a']],
    ['usvi', 'St. John, US Virgin Islands', '🏝️', 'Caribbean', ['Beach', 'Nature'], 'Tropical', [12, 1, 2, 3, 4], 7, '~7 h, 1 stop + ferry', [4200, 6600, 11000], ['Trunk Bay underwater trail', 'Two-thirds national park', 'Sailing day to the BVI (passport)', 'Quiet villa vibes'], 'US territory — no passport for US citizens (needed for BVI day trips).', { romance: 5, adventure: 3, relax: 5, culture: 2 }, 'Caribbean blue with no passport line.', ['#0284c7', '#10b981']],
    ['pr', 'Puerto Rico', '🇵🇷', 'Caribbean', ['Beach', 'Culture', 'Adventure', 'Nature'], 'Tropical', [12, 1, 2, 3, 4], 6, '~6 h, usually 1 stop', [2900, 4700, 8000], ['Old San Juan streets', 'El Yunque rainforest', 'Bioluminescent bay kayak', 'Culebra’s Flamenco Beach'], 'US territory — no passport needed.', { romance: 4, adventure: 4, relax: 4, culture: 4 }, 'Rainforest, glowing bays and colourful history.', ['#2563eb', '#ef4444']],
    ['turks', 'Turks & Caicos', '🇹🇨', 'Caribbean', ['Beach', 'Luxury'], 'Tropical', [12, 1, 2, 3, 4, 5], 5.5, '~5.5 h, usually 1 stop', [5300, 8800, 15500], ['Grace Bay’s powder sand', 'Private-cay boat trips', 'Overwater-feel suites', 'Calm, clear water for paddleboarding'], 'Valid passport required.', { romance: 5, adventure: 2, relax: 5, culture: 1 }, 'Postcard beach, zero effort.', ['#06b6d4', '#f5d0a9']],
    ['stlucia', 'St. Lucia', '🇱🇨', 'Caribbean', ['Beach', 'Luxury', 'Nature', 'Adventure'], 'Tropical', [12, 1, 2, 3, 4, 5], 7.5, '~7.5 h, 1 stop', [5000, 8300, 15000], ['Views of the Pitons', 'Volcano mud baths', 'Rainforest zipline', 'Private-plunge-pool resorts'], 'Valid passport required.', { romance: 5, adventure: 4, relax: 5, culture: 2 }, 'The Caribbean’s most romantic skyline.', ['#065f46', '#0ea5e9']],
    ['jamaica', 'Jamaica', '🇯🇲', 'Caribbean', ['Beach', 'Adventure', 'Culture'], 'Tropical', [12, 1, 2, 3, 4], 5.5, '~5–6 h, usually 1 stop', [3200, 5700, 9800], ['Negril cliffs at sunset', 'Dunn’s River Falls', 'Blue Mountain coffee farms', 'Reggae nights'], 'Valid passport required.', { romance: 4, adventure: 4, relax: 4, culture: 4 }, 'Warm, musical and great value.', ['#16a34a', '#facc15']],
    ['tulum', 'Tulum & Riviera Maya, Mexico', '🇲🇽', 'Mexico & Central America', ['Beach', 'Culture', 'Adventure'], 'Tropical', [12, 1, 2, 3, 4], 4, '~4 h DEN→Cancún, nonstop options', [2600, 4800, 8800], ['Swim in cenotes', 'Clifftop Mayan ruins', 'Boutique jungle hotels', 'Cozumel snorkelling'], 'Valid passport required; visitor permit issued on arrival.', { romance: 5, adventure: 4, relax: 4, culture: 4 }, 'Jungle, ruins and turquoise sea.', ['#0d9488', '#f97316']],
    ['costarica', 'Costa Rica', '🇨🇷', 'Mexico & Central America', ['Adventure', 'Nature', 'Beach'], 'Tropical', [12, 1, 2, 3, 4], 5.5, '~5.5–7 h, 0–1 stops', [3300, 5600, 9600], ['Arenal volcano hot springs', 'Monteverde hanging bridges', 'Sloths & toucans', 'Pacific surf beaches'], 'Valid passport required (valid for your whole stay).', { romance: 4, adventure: 5, relax: 4, culture: 2 }, 'Pura vida adventure in the wild.', ['#15803d', '#0ea5e9']],
    ['belize', 'Belize', '🇧🇿', 'Mexico & Central America', ['Adventure', 'Beach', 'Nature'], 'Tropical', [12, 1, 2, 3, 4, 5], 6, '~6 h, usually 1 stop', [3700, 6200, 10800], ['Snorkel the Barrier Reef', 'Overwater cabanas on the cayes', 'Jungle lodges & Mayan caves', 'English-speaking'], 'Valid passport required.', { romance: 4, adventure: 5, relax: 4, culture: 3 }, 'Reef + jungle combo in one trip.', ['#0369a1', '#65a30d']],
    ['italy', 'Amalfi Coast & Rome, Italy', '🇮🇹', 'Europe', ['Culture', 'Food & wine', 'Beach', 'Luxury'], 'Warm', [5, 6, 9, 10], 13, '~13 h, 1 stop', [5600, 9100, 16100], ['Positano & Ravello views', 'Boat day to Capri', 'Rome at golden hour', 'Long lunches and limoncello'], 'Passport valid 3+ months beyond departure. Schengen: check the EU entry system and ETIAS status before you go.', { romance: 5, adventure: 2, relax: 4, culture: 5 }, 'La dolce vita — the classic honeymoon.', ['#0ea5e9', '#eab308']],
    ['greece', 'Santorini & Crete, Greece', '🇬🇷', 'Europe', ['Beach', 'Culture', 'Food & wine', 'Luxury'], 'Warm', [5, 6, 9, 10], 14, '~14 h, 1–2 stops', [5100, 8600, 15100], ['Oia sunset from a cave suite', 'Catamaran around the caldera', 'Crete’s gorges and beaches', 'Ancient Knossos'], 'Passport valid 3+ months beyond departure. Schengen: check the EU entry system and ETIAS status.', { romance: 5, adventure: 3, relax: 5, culture: 4 }, 'White villages and blue-domed sunsets.', ['#1d4ed8', '#f8fafc']],
    ['portugal', 'Lisbon & the Algarve, Portugal', '🇵🇹', 'Europe', ['Culture', 'Beach', 'Food & wine', 'Road trip'], 'Warm', [4, 5, 6, 9, 10], 12, '~12 h, 1 stop', [4100, 6600, 11600], ['Tiled hills & trams of Lisbon', 'Sintra palaces', 'Benagil sea caves', 'Douro valley wine detour'], 'Passport valid 3+ months beyond departure. Schengen: check the EU entry system and ETIAS status.', { romance: 4, adventure: 3, relax: 4, culture: 5 }, 'Europe’s best-value sunny honeymoon.', ['#b45309', '#2563eb']],
    ['france', 'Paris & Provence, France', '🇫🇷', 'Europe', ['Culture', 'Food & wine', 'Luxury', 'Road trip'], 'Mild', [4, 5, 6, 9], 10.5, '~10–12 h, 0–1 stops', [5500, 9500, 17000], ['Seine at night', 'Lavender fields (late Jun–Jul)', 'Hill towns of the Luberon', 'Market mornings'], 'Passport valid 3+ months beyond departure. Schengen: check the EU entry system and ETIAS status.', { romance: 5, adventure: 2, relax: 3, culture: 5 }, 'City of love, then the countryside.', ['#7c3aed', '#f472b6']],
    ['iceland', 'Iceland', '🇮🇸', 'Europe', ['Adventure', 'Nature', 'Road trip'], 'Cool', [6, 7, 8, 2, 3], 8, '~8–10 h, 0–1 stops', [4300, 7300, 12300], ['Ring Road waterfalls', 'Blue Lagoon soak', 'Northern lights (Sep–Mar)', 'Glacier hike'], 'Passport valid 3+ months beyond departure (Schengen; check ETIAS status).', { romance: 4, adventure: 5, relax: 3, culture: 2 }, 'Fire, ice and the northern lights.', ['#0f172a', '#22d3ee']],
    ['ireland', 'Ireland', '🇮🇪', 'Europe', ['Culture', 'Road trip', 'Nature'], 'Cool', [5, 6, 7, 8, 9], 11, '~11 h, 0–1 stops', [4000, 6800, 12000], ['Cliffs of Moher', 'Castle hotel stays', 'Ring of Kerry drive', 'Cosy pubs & live music'], 'Valid passport required (Ireland is not in Schengen).', { romance: 4, adventure: 3, relax: 3, culture: 5 }, 'Green cliffs, castles and storytelling.', ['#15803d', '#a16207']],
    ['banff', 'Banff & the Canadian Rockies', '🇨🇦', 'Canada', ['Adventure', 'Nature', 'Road trip', 'Luxury'], 'Cool', [6, 7, 8, 9], 4.5, '~2.5 h DEN→Calgary + 1.5 h drive', [3000, 5500, 10000], ['Lake Louise canoe', 'Icefields Parkway drive', 'Hot springs & spa', 'Wildlife spotting'], 'Valid passport required.', { romance: 5, adventure: 5, relax: 3, culture: 2 }, 'Turquoise lakes and mountain lodges.', ['#0e7490', '#64748b']],
    ['peru', 'Peru — Cusco & Machu Picchu', '🇵🇪', 'South America', ['Adventure', 'Culture', 'Nature'], 'Mild', [5, 6, 7, 8, 9], 11, '~11 h, 1 stop', [3800, 6500, 11500], ['Machu Picchu at sunrise', 'Sacred Valley lodges', 'Rainbow Mountain hike', 'Lima’s food scene'], 'Passport valid 6+ months; timed Machu Picchu tickets sell out — book early.', { romance: 4, adventure: 5, relax: 2, culture: 5 }, 'A bucket-list adventure together.', ['#b91c1c', '#15803d']],
    ['bali', 'Bali, Indonesia', '🇮🇩', 'Asia & Pacific', ['Beach', 'Culture', 'Nature', 'Luxury'], 'Tropical', [4, 5, 6, 7, 8, 9, 10], 24, '~24 h, 2 stops', [4200, 6800, 12500], ['Private pool villas', 'Ubud rice terraces', 'Temple sunsets', 'Nusa Penida cliffs'], 'Passport valid 6+ months; visa on arrival / e-VOA fee plus Bali tourist levy.', { romance: 5, adventure: 4, relax: 5, culture: 5 }, 'Villas, temples and incredible value once there.', ['#15803d', '#f59e0b']],
    ['maldives', 'The Maldives', '🇲🇻', 'Asia & Pacific', ['Beach', 'Luxury'], 'Tropical', [11, 12, 1, 2, 3, 4], 24, '~24 h, 2 stops', [8000, 14000, 26000], ['Overwater villa', 'Snorkel with manta rays', 'Sandbank dinner', 'Seaplane arrival'], 'Passport valid 6+ months; free 30-day visa on arrival with return ticket & booking.', { romance: 5, adventure: 2, relax: 5, culture: 1 }, 'The ultimate overwater splurge.', ['#06b6d4', '#e0f2fe']],
    ['japan', 'Japan — Tokyo & Kyoto', '🇯🇵', 'Asia & Pacific', ['Culture', 'Food & wine', 'Nature'], 'Mild', [3, 4, 5, 10, 11], 13, '~13–15 h, 0–1 stops', [5200, 8700, 15200], ['Cherry blossoms or autumn leaves', 'Ryokan with private onsen', 'Kyoto temples at dawn', 'Bullet trains & neon nights'], 'Passport required; visa-free for US tourists up to 90 days.', { romance: 4, adventure: 3, relax: 3, culture: 5 }, 'Ancient calm meets neon energy.', ['#be123c', '#f9a8d4']],
    ['thailand', 'Thailand — Bangkok & the islands', '🇹🇭', 'Asia & Pacific', ['Beach', 'Culture', 'Adventure', 'Food & wine'], 'Tropical', [11, 12, 1, 2, 3], 22, '~22 h, 1–2 stops', [3600, 6000, 11000], ['Long-tail boats in Krabi', 'Chiang Mai temples', 'Island-hopping', 'Night markets'], 'Passport valid 6+ months; check current visa-exemption length and the online arrival card.', { romance: 4, adventure: 4, relax: 4, culture: 5 }, 'Islands, temples and amazing value.', ['#0891b2', '#eab308']],
    ['bora', 'Bora Bora & Moorea, Tahiti', '🇵🇫', 'Asia & Pacific', ['Beach', 'Luxury', 'Nature'], 'Tropical', [5, 6, 7, 8, 9, 10], 14, '~14 h via LAX/SFO', [8700, 14700, 27700], ['Overwater bungalows', 'Lagoon snorkel with rays', 'Moorea’s jagged peaks', 'Polynesian dance night'], 'Valid passport required; visa-free short stays for US citizens.', { romance: 5, adventure: 3, relax: 5, culture: 3 }, 'The lagoon everyone dreams about.', ['#0ea5e9', '#14b8a6']],
    ['capetown', 'Cape Town & safari, South Africa', '🇿🇦', 'Africa', ['Adventure', 'Nature', 'Food & wine', 'Luxury'], 'Warm', [10, 11, 12, 1, 2, 3, 4], 22, '~22 h, 1–2 stops', [7000, 11500, 21000], ['Big Five safari lodge', 'Table Mountain cable car', 'Cape Winelands', 'Chapman’s Peak drive'], 'Passport valid 30+ days beyond trip with 2 blank pages; visa-free up to 90 days.', { romance: 5, adventure: 5, relax: 3, culture: 4 }, 'Safari sunsets plus a world-class city.', ['#a16207', '#0f766e']]
  ];
  // Flight hours/labels when the couple lives in New Albany / Louisville (SDF). Rough estimates.
  var FROM_SDF = { comtn: [6, '~3.5 h to Denver + mountain drive'], santafe: [6, '~5 h, 1 stop (to ABQ/SAF) + drive'], moab: [8, '~4 h to Denver/SLC + long drive'], smokies: [0, 'Drive ~4.5 h'], maui: [12, '~12 h, 1–2 stops'], keys: [5, '~3 h to Miami + scenic drive'], napa: [6.5, '~6.5 h, 1 stop'], usvi: [5.5, '~5.5 h, 1 stop + ferry'], pr: [4.5, '~4.5 h, usually 1 stop'], turks: [4, '~4 h, usually 1 stop'], stlucia: [6, '~6 h, 1 stop'], jamaica: [4, '~4 h, usually 1 stop'], tulum: [4, '~3.5–4.5 h, 0–1 stops'], costarica: [5, '~5 h, 1 stop'], belize: [5, '~5 h, 1 stop'], italy: [12, '~12 h, 1 stop'], greece: [13, '~13 h, 1–2 stops'], portugal: [11, '~11 h, 1 stop'], france: [10, '~10 h, 1 stop'], iceland: [9, '~9 h, 1 stop'], ireland: [10, '~10 h, 1 stop'], banff: [6.5, '~5 h to Calgary + 1.5 h drive'], peru: [9.5, '~9.5 h, 1 stop'], bali: [26, '~26 h, 2 stops'], maldives: [23, '~23 h, 2 stops'], japan: [15.5, '~15.5 h, 1 stop'], thailand: [23, '~23 h, 1–2 stops'], bora: [15, '~15 h via LAX/SFO'], capetown: [21, '~21 h, 1–2 stops'] };
  function hHrs(d) { return homeKey() === 'nalb' && FROM_SDF[d[0]] ? FROM_SDF[d[0]][0] : d[7]; }
  function hLab(d) { var k = homeKey(); if (k === 'nalb' && FROM_SDF[d[0]]) return FROM_SDF[d[0]][1]; if (k === 'other') return 'Depends on your home airport'; return d[8]; }
  var HD = {}; HDEST.forEach(function (d) { HD[d[0]] = d; });
  var HCRIT = [['value', '💸 Value for money'], ['flight', '✈️ Easy to get to'], ['weather', '☀️ Great in our month'], ['romance', '💞 Romance'], ['adventure', '🧗 Adventure'], ['relax', '🏖️ Relaxation'], ['culture', '🏛️ Culture & sights'], ['docs', '🛂 Hassle-free entry']];
  var HTIERS = [['lean', 'Lean', 0], ['real', 'Realistic', 1], ['comfy', 'Comfortable', 2]];
  var HBCATS = [['flights', '✈️ Flights', 0.25], ['lodging', '🏨 Lodging', 0.40], ['activities', '🤿 Activities', 0.14], ['food', '🍽️ Food & drink', 0.14], ['extras', '🎁 Extras (transfers, insurance, tips)', 0.07]];
  var HQ = [
    ['vibe', '🌴', 'What’s the dream vibe?', 'Pick up to three', true, [['Beach', '🏖️'], ['Adventure', '🧗'], ['Culture', '🏛️'], ['Food & wine', '🍷'], ['Nature', '🌿'], ['Luxury', '🥂'], ['Road trip', '🚗']]],
    ['climate', '☀️', 'Ideal weather?', '', false, [['Tropical', '🌴', 'Hot & sunny'], ['Warm', '🌤️', 'Warm, not sweltering'], ['Mild', '🍃', 'Comfortable layers'], ['Cool', '🧣', 'Crisp & cosy']]],
    ['pace', '🐢', 'Your pace?', '', false, [['Slow', '🛌', 'Sleep in, pool, repeat'], ['Balanced', '⚖️', 'One plan a day'], ['Packed', '⚡', 'See everything']]],
    ['budget', '💰', 'Total trip budget for two?', '', false, [['4000', '💵', 'Under $4k'], ['7000', '💰', '$4k–7k'], ['12000', '💎', '$7k–12k'], ['25000', '👑', '$12k+']]],
    ['length', '🗓️', 'How long can you get away?', '', false, [['4', '🌙', 'Mini-moon · 3–4 nights'], ['7', '🗓️', 'One week'], ['11', '✈️', '10–12 nights'], ['14', '🌍', 'Two weeks+']]],
    ['month', '📅', 'When will you travel?', 'Right after the wedding, or a delayed trip later', false, MON.map(function (m, i) { return [String(i + 1), ['❄️', '❄️', '🌱', '🌷', '🌸', '☀️', '☀️', '🌻', '🍂', '🍁', '🍂', '🎄'][i], m]; })]
  ];
  var HTL = [
    ['9–12 months before', '🗺️', [['tl1', 'Pick destination & rough budget'], ['tl2', 'Check both passports — 6+ months validity after return'], ['tl3', 'Renew/apply for passports (routine processing can take weeks)'], ['tl4', 'Set up a honeymoon fund / registry and add it to the wedding website']]],
    ['6–9 months', '✈️', [['tl5', 'Book flights (watch fares, use points)'], ['tl6', 'Book main hotels — mention you’re honeymooners'], ['tl7', 'Decide: mini-moon now vs. big trip later'], ['tl8', 'Check vaccines or entry requirements']]],
    ['3–6 months', '🤿', [['tl9', 'Book signature excursions & timed tickets'], ['tl10', 'Buy travel insurance (cancellation + medical)'], ['tl11', 'Plan name-change timing: travel on the name on your ticket'], ['tl12', 'Arrange pet/house sitter']]],
    ['1–2 months', '📋', [['tl13', 'Finalize the day-by-day itinerary'], ['tl14', 'Book airport transfers & any rental car'], ['tl15', 'Online check-in / e-visa / arrival forms'], ['tl16', 'Tell banks; order some local currency']]],
    ['Final week', '🧳', [['tl17', 'Print/save confirmations offline'], ['tl18', 'Pack (see the checklist)'], ['tl19', 'Out-of-office on; hand off wedding returns'], ['tl20', 'Share itinerary with a family member']]]
  ];
  var HTIPS = [
    ['🎁', 'Ask for honeymoon perks', 'Mention you’re on your honeymoon when you book and again at check-in. Many hotels add upgrades, champagne, late check-out or a resort credit. Bring a copy of your marriage certificate or wedding invitation for honeymoon promotions.'],
    ['🛡️', 'Travel insurance, simply', 'Buy within ~14 days of your first payment to unlock pre-existing condition and “cancel for any reason” upgrades. Look for trip cancellation, medical with evacuation, and baggage delay. Check what your credit card already covers.'],
    ['🌙', 'Mini-moon vs. delayed honeymoon', 'A mini-moon (3–4 nights nearby) right after the wedding lets you rest while the big trip waits for better weather, more PTO or lower prices. A delayed honeymoon also gives you something to look forward to after the wedding.'],
    ['🪪', 'Names on tickets', 'Book flights in the name on your current passport. Change your name after the trip, or carry the marriage certificate if your documents won’t match.'],
    ['💳', 'Points & registries', 'Put the big trip on a travel card for points and protections. Honeymoon registries let guests gift experiences, like a sunset sail or spa day. Mark the gifts in the booking tracker so thank-you notes are easy.'],
    ['😴', 'Don’t over-schedule', 'Plan one anchor activity a day with plenty of white space. Wedding fatigue is real, so give day one to recovery.'],
    ['📱', 'Stay connected', 'Set up an eSIM before you fly, download offline maps, and keep digital and paper copies of passports and confirmations.']
  ];
  var hTab = 'dream', hFilt = { region: '', season: '', budget: '', vibe: '' }, hQi = 0, hSel = '';
  function HM() { return load('wp-honey', {}); }
  function setHM(k, v) { var o = HM(); o[k] = v; save('wp-honey', o); }
  function hNights() { return num(HM().nights) || 7; }
  function hCost(d, tier) { var base = d[9][tier == null ? 1 : tier], n = hNights(), fl = base * 0.25; return Math.round((fl + (base - fl) * n / 7) / 50) * 50; }
  function hMonthOK(d, m) { return d[6].indexOf(+m) >= 0; }
  function hAuto(d, c) {
    if (c === 'value') return Math.max(1, Math.min(5, Math.round(6 - d[9][1] / 3000)));
    if (c === 'flight') { var fh = hHrs(d); return fh <= 3 ? 5 : fh <= 6 ? 4 : fh <= 11 ? 3 : fh <= 17 ? 2 : 1; }
    if (c === 'weather') { var m = HM().quiz && HM().quiz.month; return !m ? 3 : hMonthOK(d, m) ? 5 : 2; }
    if (c === 'docs') return /No passport/.test(d[11]) || /US territory/.test(d[11]) ? 5 : /visa on arrival|e-VOA|levy|arrival card|6\+ months|Machu/.test(d[11]) ? 2 : /ETIAS/.test(d[11]) ? 3 : 4;
    return d[12][c];
  }
  function hRating(d, c) { var r = (HM().rt || {})[d[0]]; return r && r[c] != null ? r[c] : hAuto(d, c); }
  function hWeights() { var w = HM().w || {}, o = {}; HCRIT.forEach(function (c) { o[c[0]] = w[c[0]] == null ? 3 : w[c[0]]; }); return o; }
  function hScore(d) { var w = hWeights(), t = 0, mx = 0; HCRIT.forEach(function (c) { t += w[c[0]] * hRating(d, c[0]); mx += w[c[0]] * 5; }); return mx ? t / mx * 100 : 0; }
  function hMatch(d, q) {
    var s = 0, mx = 0;
    if (q.vibe && q.vibe.length) { mx += 30; s += 30 * q.vibe.filter(function (v) { return d[4].indexOf(v) >= 0; }).length / q.vibe.length; }
    if (q.climate) { mx += 15; var cl = ['Tropical', 'Warm', 'Mild', 'Cool'], dd = Math.abs(cl.indexOf(q.climate) - cl.indexOf(d[5])); s += 15 * [1, 0.5, 0.15, 0][dd]; }
    if (q.pace) { mx += 10; var r = d[12]; s += 10 * (q.pace === 'Slow' ? r.relax : q.pace === 'Packed' ? r.adventure : (r.relax + r.adventure + r.culture) / 3) / 5; }
    if (q.budget) { mx += 20; var n = +q.length || 7, c = d[9][1] * (0.25 + 0.75 * n / 7); s += 20 * (c <= +q.budget ? 1 : c <= +q.budget * 1.3 ? 0.5 : 0); }
    if (q.length) { mx += 10; var fh2 = hHrs(d); s += 10 * (+q.length <= 4 ? (fh2 <= 3 ? 1 : fh2 <= 6 ? 0.4 : 0) : +q.length <= 7 ? (fh2 <= 12 ? 1 : 0.4) : 1); }
    if (q.month) { mx += 15; s += hMonthOK(d, q.month) ? 15 : 0; }
    return mx ? Math.round(s / mx * 100) : 0;
  }
  function hMatches() { var q = HM().quiz || {}; return HDEST.map(function (d) { return { d: d, m: hMatch(d, q) }; }).sort(function (a, b) { return b.m - a.m || a.d[9][1] - b.d[9][1]; }); }
  function hFavs() { return HM().favs || []; }
  function monthsBar(d) { return '<div class="hmonths">' + MON.map(function (m, i) { return '<i class="' + (d[6].indexOf(i + 1) >= 0 ? 'on' : '') + '" title="' + m + '">' + m[0] + '</i>'; }).join('') + '</div>'; }

  function hDestCard(d, extra) {
    var fav = hFavs().indexOf(d[0]) >= 0;
    return '<div class="hcard' + (fav ? ' fav' : '') + '" style="--c1:' + d[14][0] + ';--c2:' + d[14][1] + '"><div class="hcard-top"><span class="hflag">' + d[2] + '</span><button type="button" class="heart' + (fav ? ' on' : '') + '" data-hfav="' + d[0] + '" aria-label="Shortlist">♥</button>' + (extra || '') + '<div class="hcard-t"><small>' + esc(d[3]) + ' · ' + esc(d[5]) + '</small><h3>' + esc(d[1]) + '</h3></div></div>' +
      '<div class="hcard-b"><p class="htag">' + esc(d[13]) + '</p><div class="hchips">' + d[4].map(function (v) { return '<span>' + esc(v) + '</span>'; }).join('') + '</div>' +
      '<div class="hfacts"><div><span>✈️</span><b>' + esc(hLab(d)) + '</b><small>' + (HL().air ? 'from ' + HL().air : 'flight time') + '</small></div><div><span>💵</span><b>' + money(d[9][1]) + '</b><small>realistic / 7 nights</small></div></div>' + monthsBar(d) +
      '<div class="htiers">' + HTIERS.map(function (t) { return '<div><small>' + t[1] + '</small><b>' + money(d[9][t[2]]) + '</b></div>'; }).join('') + '</div>' +
      '<details class="hmore"><summary>Highlights & entry notes</summary><ul>' + d[10].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><div class="hdoc">🛂 ' + esc(d[11]) + '</div></details>' +
      '<div class="hcard-act"><button class="btn sm alt" data-hpick="' + d[0] + '">' + (HM().dest === d[1] ? '✓ Our destination' : 'Choose this one') + '</button></div></div></div>';
  }

  function hDream() {
    var hm = HM(), q = hm.quiz || {}, h = '';
    if (hQi < HQ.length) {
      var Q = HQ[hQi], cur = q[Q[0]];
      h += '<div class="hquiz"><div class="hq-prog">' + HQ.map(function (x, i) { return '<i class="' + (i < hQi ? 'past' : i === hQi ? 'here' : '') + '">' + x[1] + '</i>'; }).join('') + '</div><div class="hq-in" key="' + hQi + '"><div class="j-kick">Dream honeymoon quiz · ' + (hQi + 1) + ' / ' + HQ.length + '</div><h2 class="j-q">' + Q[2] + '</h2>' + (Q[3] ? '<p class="j-sub">' + Q[3] + '</p>' : '') +
        '<div class="j-opts hq-opts' + (Q[0] === 'month' ? ' months' : '') + '">' + Q[5].map(function (o) { var on = Q[4] ? (cur || []).indexOf(o[0]) >= 0 : cur === o[0]; return '<button type="button" class="j-opt' + (on ? ' on' : '') + '" data-hq="' + Q[0] + '" data-v="' + esc(o[0]) + '"' + (Q[4] ? ' data-multi="1"' : '') + '><span>' + o[1] + '</span>' + esc(o[2] || o[0]) + '</button>'; }).join('') + '</div>' +
        '<div class="j-row">' + (hQi ? '<button class="j-ghost" data-hqn="-1">‹ Back</button>' : '') + (Q[4] ? '<button class="j-go" data-hqn="1">Next ›</button>' : '<button class="j-ghost" data-hqn="1">Skip ›</button>') + '</div></div></div>';
    } else {
      var top = hMatches().slice(0, 3);
      h += '<div class="hreveal"><div class="j-kick">Your dream honeymoon matches</div><h2 class="j-q">' + esc(top[0].d[1]) + ' ' + top[0].d[2] + '</h2><p class="j-sub">' + [q.vibe && q.vibe.join(' · '), q.climate, q.pace && q.pace + ' pace', q.length && q.length + ' nights', q.month && 'in ' + MON[q.month - 1], q.budget && 'up to ' + money(+q.budget)].filter(Boolean).join(' · ') + '</p>' +
        '<div class="hpodium">' + top.map(function (t, i) { return '<div class="hpd hpd' + i + '" style="--c1:' + t.d[14][0] + ';--c2:' + t.d[14][1] + '"><div class="hpd-m">' + ['🥇', '🥈', '🥉'][i] + '</div><div class="hpd-f">' + t.d[2] + '</div><b>' + esc(t.d[1]) + '</b><div class="hpd-pct">' + t.m + '% match</div><small>' + esc(t.d[13]) + '</small><button class="btn sm' + (hFavs().indexOf(t.d[0]) >= 0 ? ' alt' : '') + '" data-hfav="' + t.d[0] + '">' + (hFavs().indexOf(t.d[0]) >= 0 ? '♥ Shortlisted' : '♡ Shortlist') + '</button></div>'; }).join('') + '</div>' +
        '<div class="j-row"><button class="j-ghost" data-hqreset="1">↺ Retake quiz</button><button class="j-go" data-htab="explore">Explore all ' + HDEST.length + ' destinations ›</button><button class="j-go ok" data-hshortall="1">♥ Shortlist all 3 & score them</button></div></div>';
    }
    return h;
  }

  function hExplore() {
    var q = HM().quiz || {}, f = hFilt;
    var list = HDEST.filter(function (d) {
      if (f.region && d[3] !== f.region) return false;
      if (f.vibe && d[4].indexOf(f.vibe) < 0) return false;
      if (f.season) { var sm = { Winter: [12, 1, 2], Spring: [3, 4, 5], Summer: [6, 7, 8], Fall: [9, 10, 11] }[f.season]; if (!sm.some(function (m) { return d[6].indexOf(m) >= 0; })) return false; }
      if (f.budget) { var c = d[9][1]; if (f.budget === 'lt5' && c >= 5000) return false; if (f.budget === '5to9' && (c < 5000 || c > 9000)) return false; if (f.budget === 'gt9' && c <= 9000) return false; }
      return true;
    });
    var sel = function (k, opts, lab) { return '<label class="hsel"><span>' + lab + '</span><select data-hf="' + k + '"><option value="">All</option>' + opts.map(function (o) { o = [].concat(o); return '<option value="' + esc(o[0]) + '"' + (f[k] === o[0] ? ' selected' : '') + '>' + esc(o[1] || o[0]) + '</option>'; }).join('') + '</select></label>'; };
    var h = '<div class="hfilters card">' + sel('region', HREG, '🌍 Region') + sel('season', ['Winter', 'Spring', 'Summer', 'Fall'], '📅 Best season') + sel('budget', [['lt5', 'Under $5k'], ['5to9', '$5k–9k'], ['gt9', '$9k+']], '💵 Budget') + sel('vibe', HVIBE, '✨ Vibe') + '<div class="hcount"><b>' + list.length + '</b> of ' + HDEST.length + '</div>' + (f.region || f.season || f.budget || f.vibe ? '<button class="btn sm alt" data-hfclear="1">Clear</button>' : '') + '</div>';
    h += '<p class="sub hnote">Costs are rough estimates for two people, 7 nights, including flights from ' + esc(HL().note || HL().label) + ' (drive-to trips count gas and lodging only). They are estimates only. Change where you live in Settings. Always check entry rules on travel.state.gov before booking.</p>';
    h += list.length ? '<div class="hgrid">' + list.map(function (d) { var m = q.vibe || q.climate ? hMatch(d, q) : null; return hDestCard(d, m != null ? '<span class="hmatch">' + m + '% match</span>' : ''); }).join('') + '</div>' : '<p class="empty">No destinations match those filters.</p>';
    return h;
  }

  function hScoreTab() {
    var w = hWeights(), favs = hFavs().filter(function (id) { return HD[id]; });
    var pool = (favs.length ? favs : hMatches().slice(0, 5).map(function (x) { return x.d[0]; })).map(function (id) { return HD[id]; });
    var ranked = pool.map(function (d) { return { d: d, s: hScore(d) }; }).sort(function (a, b) { return b.s - a.s; });
    var h = (favs.length ? '' : callout('No shortlist yet, so these are your top 5 quiz matches. Tap ♥ on any destination to add it here.', 'amber'));
    h += '<div class="cols2 wide-l"><div class="card"><h3>🎚️ What matters (weights)</h3><p class="sub" style="margin:4px 0 8px">0 = ignore · 5 = crucial</p>' + HCRIT.map(function (c) { return '<div class="wrow"><span>' + c[1] + '</span><input type="range" min="0" max="5" step="1" value="' + w[c[0]] + '" data-hw="' + c[0] + '"><output>' + w[c[0]] + '</output></div>'; }).join('') + '</div>';
    h += '<div class="card lb"><h3>🏆 Leaderboard</h3>' + ranked.map(function (r, i) { return '<div class="lbr' + (i === 0 ? ' first' : '') + '"><span class="md">' + (['🥇', '🥈', '🥉'][i] || (i + 1)) + '</span><div class="main"><div class="t">' + r.d[2] + ' ' + esc(r.d[1]) + '</div>' + bar(r.s) + '<div class="m">' + money(hCost(r.d)) + ' · ' + hNights() + ' nights · ' + esc(hLab(r.d)) + '</div></div><b class="sc">' + Math.round(r.s) + '</b></div>'; }).join('') + '</div></div>';
    h += '<div class="card"><h3>🔍 Side-by-side</h3><p class="sub" style="margin:4px 0 8px">Ratings start from our travel data. Tap a rating to adjust it to your own opinion.</p><div class="hcmp-wrap"><table class="hcmp"><thead><tr><th></th>' + ranked.map(function (r) { return '<th><span class="hflag sm">' + r.d[2] + '</span>' + esc(r.d[1].split(/[,—&]/)[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      HCRIT.map(function (c) { return '<tr><td>' + c[1] + ' <small>×' + w[c[0]] + '</small></td>' + ranked.map(function (r) { var v = hRating(r.d, c[0]); return '<td><select class="hrate r' + v + '" data-hrt="' + r.d[0] + '.' + c[0] + '">' + [1, 2, 3, 4, 5].map(function (n) { return '<option' + (n === v ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></td>'; }).join('') + '</tr>'; }).join('') +
      '<tr class="tot"><td>Score</td>' + ranked.map(function (r) { return '<td><b>' + Math.round(r.s) + '</b></td>'; }).join('') + '</tr><tr><td>Realistic cost</td>' + ranked.map(function (r) { return '<td>' + money(hCost(r.d)) + '</td>'; }).join('') + '</tr><tr><td>Best months</td>' + ranked.map(function (r) { return '<td><small>' + r.d[6].map(function (m) { return MON[m - 1]; }).join(' ') + '</small></td>'; }).join('') + '</tr><tr><td>Passport</td>' + ranked.map(function (r) { return '<td><small>' + (/No passport|US territory/.test(r.d[11]) ? '✅ Not needed' : '🛂 Required') + '</small></td>'; }).join('') + '</tr></tbody></table></div></div>';
    return h;
  }

  function hBudget() {
    var hm = HM(), tier = hm.tier || 'real', ti = { lean: 0, real: 1, comfy: 2 }[tier], d = HD[hm.destId] || HD[hFavs()[0]] || HD.italy, n = hNights();
    var total0 = hCost(d, ti), b = (hm.bud || {})[tier] || {}, lines = HBCATS.map(function (c) { var v = b[c[0]] != null ? num(b[c[0]]) : Math.round(total0 * c[2] / 10) * 10; return [c, v]; });
    var tot = lines.reduce(function (s, l) { return s + l[1]; }, 0), cap = num(hm.budget);
    var h = '<div class="cols2 wide-l"><div class="card"><h3>🧮 Budget builder</h3><div class="hbsel"><label class="hsel"><span>Destination</span><select data-hbdest="1">' + HDEST.map(function (x) { return '<option value="' + x[0] + '"' + (x === d ? ' selected' : '') + '>' + x[2] + ' ' + esc(x[1]) + '</option>'; }).join('') + '</select></label><label class="hsel"><span>Nights</span><input type="number" min="2" max="30" value="' + n + '" data-hm="nights"></label><label class="hsel"><span>Our cap $</span><input inputmode="numeric" value="' + esc(hm.budget || '') + '" data-hm="budget" placeholder="e.g. 8000"></label></div>' +
      '<div class="seg htier">' + HTIERS.map(function (t) { return '<button data-htier="' + t[0] + '" class="' + (tier === t[0] ? 'on' : '') + '">' + t[1] + '<small>' + money(hCost(d, t[2])) + '</small></button>'; }).join('') + '</div>' +
      lines.map(function (l) { var pct = tot ? l[1] / tot * 100 : 0; return '<div class="hbline"><span>' + l[0][1] + '</span><div class="hbbar"><i style="width:' + pct.toFixed(1) + '%"></i></div><input inputmode="numeric" value="' + l[1] + '" data-hb="' + tier + '.' + l[0][0] + '"></div>'; }).join('') +
      '<div class="hbline tot"><span>Total</span><div></div><b>' + money(tot) + '</b></div><button class="btn sm alt" data-hbreset="' + tier + '">Reset to ' + HTIERS[ti][1].toLowerCase() + ' estimate</button></div>';
    h += '<div class="card hbsum">' + ring(cap ? Math.min(100, tot / cap * 100) : 0, 120, cap ? Math.round(tot / cap * 100) + '%' : '—', cap ? 'of our cap' : 'set a cap') + '<div class="impact"><div><b>' + money(tot) + '</b><small>' + HTIERS[ti][1].toLowerCase() + ' total</small></div><div><b>' + money(tot / n) + '</b><small>per night, all-in</small></div><div><b class="' + (cap && tot > cap ? 'neg' : '') + '">' + (cap ? (tot > cap ? '−' : '+') + money(Math.abs(cap - tot)) : '—') + '</b><small>' + (cap && tot > cap ? 'over cap' : 'left over') + '</small></div></div>' +
      '<div class="htiercmp">' + HTIERS.map(function (t) { var v = hCost(d, t[2]); return '<div><small>' + t[1] + '</small>' + bar(v / hCost(d, 2) * 100) + '<b>' + money(v) + '</b></div>'; }).join('') + '</div><p class="sub">Lean: economy, 3★ stays, a few paid activities. Realistic: good 4★ hotels, one excursion most days. Comfortable: premium seats or upgrades, 5★ or overwater, private tours.</p></div></div>';
    return h;
  }

  function hPlan() {
    var hm = HM(), tl = hm.tl || {}, itin = load('wp-hm-itin', []).slice().sort(function (a, b) { return (+a.day || 0) - (+b.day || 0); });
    var all = [].concat.apply([], HTL.map(function (g) { return g[2]; })), done = all.filter(function (x) { return tl[x[0]]; }).length;
    var h = '<div class="card"><div class="lst-h">' + ring(done / all.length * 100, 64) + '<div><h3>🗓️ Honeymoon timeline</h3><div class="sub" style="margin:0">' + done + ' of ' + all.length + ' done · passports, booking windows, registry</div></div></div><div class="htl">' + HTL.map(function (g) { var gd = g[2].filter(function (x) { return tl[x[0]]; }).length; return '<div class="htl-g' + (gd === g[2].length ? ' done' : '') + '"><div class="htl-h"><span>' + g[1] + '</span><b>' + g[0] + '</b><small>' + gd + '/' + g[2].length + '</small></div>' + g[2].map(function (x) { return '<label class="htl-i' + (tl[x[0]] ? ' done' : '') + '"><input type="checkbox" class="chk" data-htl="' + x[0] + '"' + (tl[x[0]] ? ' checked' : '') + '><span>' + esc(x[1]) + '</span></label>'; }).join('') + '</div>'; }).join('') + '</div></div>';
    h += '<div class="card"><h3>🧭 Day-by-day itinerary</h3><p class="sub" style="margin:4px 0 10px">' + (hm.dest ? esc(hm.dest) + ' · ' : '') + itin.length + ' day' + (itin.length === 1 ? '' : 's') + ' planned</p><div class="hitin">' + itin.map(function (it) { return '<div class="hday"><div class="hday-n"><small>Day</small><input inputmode="numeric" value="' + esc(it.day) + '" data-hit="' + it.id + '.day"></div><div class="hday-b"><input class="hday-t" placeholder="Title (e.g. Arrive & sunset dinner)" value="' + esc(it.title || '') + '" data-hit="' + it.id + '.title"><div class="hday-r"><input placeholder="📍 Where" value="' + esc(it.place || '') + '" data-hit="' + it.id + '.place"><select data-hit="' + it.id + '.mood">' + ['🌅 Easy day', '🤿 Adventure', '🏛️ Sightseeing', '🚗 Travel day', '💆 Spa & rest', '🍷 Food & wine'].map(function (m) { return '<option' + (it.mood === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></div><textarea placeholder="Morning · afternoon · evening plans" data-hit="' + it.id + '.plan">' + esc(it.plan || '') + '</textarea></div><button type="button" class="x sm" data-hitdel="' + it.id + '" aria-label="Remove day">×</button></div>'; }).join('') + '</div><button class="btn sm" data-hitadd="1">+ Add day ' + (itin.length + 1) + '</button>' + (itin.length ? '' : ' <button class="btn sm alt" data-hitseed="1">✨ Sketch ' + hNights() + ' days for me</button>') + '</div>';
    return h;
  }

  function hPack() {
    var bk = load('wp-hm-book', []), st = listStats('pack');
    var h = '<div class="cols2 wide-l">' + listCard(LISTS[3]) + '<div class="card hbsum">' + ring(st.of ? st.n / st.of * 100 : 0, 120, st.of ? Math.round(st.n / st.of * 100) + '%' : '0%', 'packed') + '<p class="sub" style="text-align:center">' + st.n + ' of ' + st.of + ' items packed. Ticks sync between the phone and the computer.</p></div></div>';
    var types = [['flight', '✈️ Flights', 'Airline & flight #'], ['hotel', '🏨 Hotels', 'Hotel'], ['excursion', '🤿 Excursions', 'Activity'], ['other', '🚐 Transfers & other', 'What']];
    var conf = bk.filter(function (b) { return b.status === 'Confirmed'; }).length, spent = bk.reduce(function (s, b) { return s + num(b.cost); }, 0);
    h += '<div class="card"><h3>📑 Booking tracker</h3><div class="impact"><div><b>' + bk.length + '</b><small>bookings</small></div><div><b>' + conf + '</b><small>confirmed</small></div><div><b>' + money(spent) + '</b><small>booked so far</small></div></div>' + types.map(function (t) {
      var rows = bk.filter(function (b) { return b.type === t[0]; });
      return '<div class="grp">' + t[1] + '<small>' + rows.length + '</small></div><div class="hbk-wrap"><table class="hbk"><thead><tr><th>' + t[2] + '</th><th>Date</th><th>Confirmation #</th><th>Cost $</th><th>Status</th><th></th></tr></thead><tbody>' + rows.map(function (b) { return '<tr><td data-l="' + t[2] + '"><input value="' + esc(b.what || '') + '" data-hbk="' + b.id + '.what" placeholder="' + t[2] + '"></td><td data-l="Date"><input type="date" value="' + esc(b.date || '') + '" data-hbk="' + b.id + '.date"></td><td data-l="Confirmation #"><input class="mono" value="' + esc(b.conf || '') + '" data-hbk="' + b.id + '.conf" placeholder="ABC123"></td><td data-l="Cost $"><input inputmode="numeric" value="' + esc(b.cost || '') + '" data-hbk="' + b.id + '.cost"></td><td data-l="Status"><select class="st-' + (b.status || 'Idea').replace(/\W/g, '') + '" data-hbk="' + b.id + '.status">' + ['Idea', 'Holding', 'Booked', 'Confirmed', 'Paid in full'].map(function (s) { return '<option' + (b.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td><td><button type="button" class="x sm" data-hbkdel="' + b.id + '" aria-label="Remove">×</button></td></tr>'; }).join('') + '</tbody></table></div><button class="btn sm alt" data-hbkadd="' + t[0] + '">+ Add ' + t[1].replace(/^\S+\s/, '').toLowerCase().replace(/s$/, '').replace(/ & other$/, '') + '</button>';
    }).join('') + '</div>';
    return h;
  }

  var HAIRTIP = {
    cos: ['✈️', 'COS vs DEN: which airport?', 'Colorado Springs Airport (COS) is close to home and easy, but has fewer nonstop routes, so most honeymoon trips connect. Denver International (DEN) is about 75–90 minutes’ drive north and is a major hub with far more routes and often lower fares. Price both: a COS connection can beat the drive once you add DEN parking. For DEN, compare its on-site and off-airport parking lots, a shuttle service between Colorado Springs and DEN, or a ride from family. Leave extra time for I-25 traffic and winter weather.'],
    nalb: ['✈️', 'Flying from Louisville (SDF)', 'Louisville Muhammad Ali International (SDF) is about 20 minutes from New Albany and easy to use, but most honeymoon routes connect through a hub. Cincinnati (CVG, about 1.5–2 h drive) and Indianapolis (IND, about 2 h) sometimes have more nonstops or lower fares, so price all three and add parking or a ride. Leave extra time for bridge traffic over the Ohio River.'],
    other: ['✈️', 'Pick the right airport', 'Compare your closest airport with the nearest big hub: the hub usually has more nonstops and lower fares, but add the drive, parking or a shuttle before deciding.'] };
  function hTips() {
    return '<div class="htips">' + [HAIRTIP[homeKey()]].concat(HTIPS).map(function (t, i) { return '<details class="htip"' + (i < 3 ? ' open' : '') + '><summary><span>' + t[0] + '</span>' + esc(t[1]) + '</summary><p>' + esc(t[2]) + '</p></details>'; }).join('') + '</div>' + listCard(LISTS[2]);
  }

  function pHoneymoon() {
    var hm = HM(), d = HD[hm.destId], tabs = [['dream', '✨', 'Dream quiz'], ['explore', '🌍', 'Explore'], ['score', '⚖️', 'Score & compare'], ['budget', '🧮', 'Budget'], ['plan', '🗓️', 'Timeline & itinerary'], ['pack', '🧳', 'Pack & bookings'], ['tips', '💡', 'Tips']];
    var tlAll = [].concat.apply([], HTL.map(function (g) { return g[2]; })), tld = tlAll.filter(function (x) { return (hm.tl || {})[x[0]]; }).length, pk = listStats('pack');
    var h = '<div class="hhero" style="' + (d ? '--c1:' + d[14][0] + ';--c2:' + d[14][1] : '') + '"><div class="hhero-art"><span>🌴</span><span>✈️</span><span>🌅</span><span>🐚</span></div><div class="hhero-in"><div class="j-kick">Our honeymoon</div><h2>' + (d ? d[2] + ' ' + esc(d[1]) : 'Where should we go?') + '</h2><p>' + (d ? esc(d[13]) : 'Take the quiz, explore ' + HDEST.length + ' destinations, score your favourites and plan every day.') + '</p>' +
      '<div class="hhero-stats"><div><b>' + hFavs().length + '</b><small>shortlisted</small></div><div><b>' + hNights() + '</b><small>nights</small></div><div><b>' + (d ? money(hCost(d, { lean: 0, real: 1, comfy: 2 }[hm.tier || 'real'])) : '—') + '</b><small>est. cost</small></div><div><b>' + tld + '/' + tlAll.length + '</b><small>timeline</small></div><div><b>' + (pk.of ? Math.round(pk.n / pk.of * 100) : 0) + '%</b><small>packed</small></div></div>' +
      (d ? '<button class="btn sm alt" data-hpick="">Change destination</button>' : '<button class="j-go" data-htab="dream">Find our dream trip ✨</button>') + '</div></div>';
    h += '<div class="htabs">' + tabs.map(function (t) { return '<button data-htab="' + t[0] + '" class="' + (hTab === t[0] ? 'on' : '') + '"><span>' + t[1] + '</span>' + t[2] + '</button>'; }).join('') + '</div>';
    h += '<div class="hpanel hp-' + hTab + '">' + ({ dream: hDream, explore: hExplore, score: hScoreTab, budget: hBudget, plan: hPlan, pack: hPack, tips: hTips }[hTab])() + '</div>';
    return h;
  }

  function honeyBind(el) {
    if (!el.querySelector('.hhero')) return;
    function on(sel, ev, fn) { el.querySelectorAll(sel).forEach(function (b) { b.addEventListener(ev, function (e) { fn(b, e); }); }); }
    var keep = function () { var y = window.scrollY; render(); window.scrollTo(0, y); };
    on('[data-htab]', 'click', function (b) { hTab = b.getAttribute('data-htab'); render(); var t = el.querySelector('.htabs'); if (t && t.scrollIntoView && b.closest('.hpanel,.hhero')) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    on('[data-hq]', 'click', function (b) { var o = HM(), q = Object.assign({}, o.quiz || {}), k = b.getAttribute('data-hq'), v = b.getAttribute('data-v'); if (b.hasAttribute('data-multi')) { var a = (q[k] || []).slice(), i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else if (a.length < 3) a.push(v); q[k] = a; setHM('quiz', q); keep(); return; } q[k] = v; setHM('quiz', q); b.classList.add('on'); setTimeout(function () { hQi++; if (hQi >= HQ.length) { confetti(); setHM('quizDone', Date.now()); } keep(); }, 280); });
    on('[data-hqn]', 'click', function (b) { hQi = Math.max(0, hQi + +b.getAttribute('data-hqn')); if (hQi >= HQ.length) { confetti(); setHM('quizDone', Date.now()); } keep(); });
    on('[data-hqreset]', 'click', function () { hQi = 0; setHM('quiz', {}); keep(); });
    on('[data-hfav]', 'click', function (b) { var a = hFavs().slice(), v = b.getAttribute('data-hfav'), i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); setHM('favs', a); keep(); });
    on('[data-hshortall]', 'click', function () { var a = hFavs().slice(); hMatches().slice(0, 3).forEach(function (x) { if (a.indexOf(x.d[0]) < 0) a.push(x.d[0]); }); setHM('favs', a); hTab = 'score'; render(); });
    on('[data-hpick]', 'click', function (b) { var id = b.getAttribute('data-hpick'); if (!id) { setHM('destId', ''); setHM('dest', ''); hTab = 'explore'; render(); return; } setHM('destId', id); setHM('dest', HD[id][1]); var a = hFavs().slice(); if (a.indexOf(id) < 0) { a.push(id); setHM('favs', a); } confetti(); window.scrollTo(0, 0); render(); });
    on('[data-hf]', 'change', function (b) { hFilt[b.getAttribute('data-hf')] = b.value; keep(); });
    on('[data-hfclear]', 'click', function () { hFilt = { region: '', season: '', budget: '', vibe: '' }; keep(); });
    on('[data-hw]', 'input', function (b) { b.nextElementSibling.textContent = b.value; });
    on('[data-hw]', 'change', function (b) { var w = Object.assign({}, HM().w || {}); w[b.getAttribute('data-hw')] = +b.value; setHM('w', w); keep(); });
    on('[data-hrt]', 'change', function (b) { var p = b.getAttribute('data-hrt').split('.'), rt = JSON.parse(JSON.stringify(HM().rt || {})); rt[p[0]] = rt[p[0]] || {}; rt[p[0]][p[1]] = +b.value; setHM('rt', rt); keep(); });
    on('[data-hm]', 'change', function (b) { setHM(b.getAttribute('data-hm'), b.value); keep(); });
    on('[data-hbdest]', 'change', function (b) { setHM('destId', b.value); setHM('dest', HD[b.value][1]); keep(); });
    on('[data-htier]', 'click', function (b) { setHM('tier', b.getAttribute('data-htier')); keep(); });
    on('[data-hb]', 'change', function (b) { var p = b.getAttribute('data-hb').split('.'), bud = JSON.parse(JSON.stringify(HM().bud || {})); bud[p[0]] = bud[p[0]] || {}; bud[p[0]][p[1]] = num(b.value); setHM('bud', bud); keep(); });
    on('[data-hbreset]', 'click', function (b) { var bud = JSON.parse(JSON.stringify(HM().bud || {})); delete bud[b.getAttribute('data-hbreset')]; setHM('bud', bud); keep(); });
    on('[data-htl]', 'change', function (b) { var tl = Object.assign({}, HM().tl || {}), k = b.getAttribute('data-htl'); if (b.checked) tl[k] = 1; else delete tl[k]; setHM('tl', tl); var g = HTL.filter(function (x) { return x[2].some(function (i) { return i[0] === k; }); })[0]; if (b.checked && g.every(function (i) { return tl[i[0]]; })) confetti(); keep(); });
    function upd(key, id, f, v) { save(key, load(key, []).map(function (x) { if (x.id !== id) return x; var y = Object.assign({}, x); y[f] = v; return y; })); }
    on('[data-hit]', 'change', function (b) { var p = b.getAttribute('data-hit').split('.'); upd('wp-hm-itin', p[0], p[1], b.value); if (p[1] === 'day' || p[1] === 'mood') keep(); });
    on('[data-hitdel]', 'click', function (b) { save('wp-hm-itin', load('wp-hm-itin', []).filter(function (x) { return x.id !== b.getAttribute('data-hitdel'); })); keep(); });
    on('[data-hitadd]', 'click', function () { var a = load('wp-hm-itin', []); a.push({ id: uid(), day: String(a.reduce(function (m, x) { return Math.max(m, +x.day || 0); }, 0) + 1), title: '', place: '', mood: '🌅 Easy day', plan: '' }); save('wp-hm-itin', a); keep(); });
    on('[data-hitseed]', 'click', function () { var n = Math.min(hNights() + 1, 21), a = []; for (var i = 1; i <= n; i++) a.push({ id: uid(), day: String(i), title: i === 1 ? 'Arrive, check in & sunset dinner' : i === n ? 'Slow breakfast & fly home' : i === 2 ? 'Sleep in · recovery day' : i % 3 === 0 ? 'Signature excursion' : 'Explore & something romantic', place: (HD[HM().destId] || [0, ''])[1] || '', mood: i === 1 || i === n ? '🚗 Travel day' : i === 2 ? '💆 Spa & rest' : i % 3 === 0 ? '🤿 Adventure' : '🏛️ Sightseeing', plan: '' }); save('wp-hm-itin', a); keep(); });
    on('[data-hbk]', 'change', function (b) { var p = b.getAttribute('data-hbk').split('.'); upd('wp-hm-book', p[0], p[1], b.value); if (p[1] === 'cost' || p[1] === 'status') keep(); });
    on('[data-hbkdel]', 'click', function (b) { save('wp-hm-book', load('wp-hm-book', []).filter(function (x) { return x.id !== b.getAttribute('data-hbkdel'); })); keep(); });
    on('[data-hbkadd]', 'click', function (b) { var a = load('wp-hm-book', []); a.push({ id: uid(), type: b.getAttribute('data-hbkadd'), what: '', date: '', conf: '', cost: '', status: 'Idea' }); save('wp-hm-book', a); keep(); });
  }

  /* ---------- guides & articles ---------- */
  var GUIDES = [
    ['🗺️', 'The 12-month roadmap at a glance', 'Months 12–10: budget, guest estimate, venue, date, photographer. Months 9–7: caterer (vegetarian specialist!), music, officiant, attire, save-the-dates. Months 6–4: invitations, rentals, cake tasting, honeymoon. Months 3–1: final menu, vows, seating, license, final payments. Week of: relax, delegate, hydrate.'],
    ['🥗', 'Hosting a fully vegetarian wedding (without complaints)', 'Lead with abundance — guests notice scarcity, not the absence of meat. Feature hearty dishes (risotto, lasagna, curries, Wellington) and stations so everyone finds a favorite. Do not announce “no meat”; just call it the menu. Put protein in every course: cheeses, legumes, tofu, paneer, nuts. Label V/VG/GF so vegans and celiacs feel looked after.'],
    ['💰', 'How the money usually splits', 'Venue + catering ≈ 45–50%. Photo & video 10–12%. Attire & beauty 8%. Flowers & décor 8–10%. Music 7%. Keep 5% as a buffer — almost every couple overspends somewhere. Every 10 guests removed saves roughly $2,000–4,000.'],
    ['👥', 'Guest-list etiquette', 'Split by thirds (couple / each family) or by who is paying. Rules that avoid drama: no plus-ones for guests you have not met, adults-only is fine if applied consistently, and “if we have not spoken in 2 years” is a fair cut.'],
    ['🏛️', 'Touring venues like a pro', 'Visit at the same time of day as your wedding. Ask what the room looks like set for your headcount. Score each venue right after the tour in Compare & score — memories blur after three tours.'],
    ['📸', 'Choosing a photographer', 'Ask to see two complete galleries, not highlights. Check how they handle low light. Book 9–12 months out; confirm hours, second shooter, and delivery time.'],
    ['🎶', 'Music & the flow of the night', 'Ceremony (3–4 songs), cocktail hour (background), dinner (lower volume), dancing (build energy). Give the DJ a must-play and do-not-play list of ~15 songs each.'],
    ['✍️', 'Writing vows', 'Aim for 1–2 minutes (150–250 words). Structure: a memory, what you love, promises (one serious, one funny), close with a line about forever. Agree on length & tone together.'],
    ['🥂', 'Toasts that land', 'Keep toasts to 3–4 minutes. Limit to 2–3 speakers. Schedule them between courses so food is not cold.'],
    ['🌧️', 'Rain plan & weather', 'Have a written plan B for every outdoor element. Get a tent quote even if you never use it, and set a decision deadline (usually 48–72 h before).'],
    ['💵', 'Tipping guide', 'Planner/coordinator 10–20% or a gift. Catering staff 15–20% (if not in the service charge). Hair & makeup 15–20%. Photographer/videographer $50–200 each. DJ/band $50–150 per musician. Officiant $50–100 (donation if religious). Drivers 15–20%. Delivery & setup $10–20 per person.'],
    ['😌', 'Staying sane (and together)', 'Pick one planning night per week and keep the rest wedding-free. Divide ownership by interest. Remember the goal: married to each other, surrounded by people you love, and well fed.']];
  function guideList() { var L = WL(), a = GUIDES.map(function (g) { return g[1] === 'Rain plan & weather' ? [g[0], g[1], g[2] + (L.rain || '')] : g; }), k = a.findIndex(function (g) { return g[1] === 'Rain plan & weather'; }) + 1; return a.slice(0, k).concat(L.guides, a.slice(k)); }
  var gOpen = 0;
  function pGuides() {
    var h = heroBand('📚', 'Tips & guides', 'Short, practical reads for every stage — written for a vegetarian couple starting from scratch.');
    h += '<div class="acc">' + guideList().map(function (g, i) { return '<div class="acc-i' + (gOpen === i ? ' open' : '') + '"><button type="button" class="acc-h" data-guide="' + i + '"><span>' + g[0] + '</span><b>' + esc(g[1]) + '</b><i>' + (gOpen === i ? '−' : '+') + '</i></button>' + (gOpen === i ? '<div class="acc-b">' + esc(g[2]).split('. ').join('.<br>') + '</div>' : '') + '</div>'; }).join('') + '</div>';
    return h;
  }

  /* ---------- mood boards ---------- */
  var PALETTES = [['Blush & sage', ['#f3e4e1', '#e8b4b8', '#a8b89a', '#6b7f5e', '#faf6f1']], ['Terracotta sunset', ['#e07a5f', '#f2cc8f', '#81b29a', '#3d405b', '#f4f1de']], ['Classic ivory & gold', ['#fffaf0', '#f0e6d2', '#c9a86a', '#8c6d3f', '#2f2f2f']], ['Moody jewel tones', ['#3a0ca3', '#7209b7', '#b5179e', '#2d6a4f', '#f4d35e']], ['Garden wildflower', ['#ffb5a7', '#fcd5ce', '#f9dcc4', '#d8e2dc', '#9c6644']], ['Dusty blue', ['#dbe7ef', '#a9c2d6', '#5b7c99', '#c7b299', '#f7f5f0']], ['Modern monochrome', ['#ffffff', '#e5e5e5', '#9e9e9e', '#3a3a3a', '#111111']], ['Autumn harvest', ['#7f4f24', '#b08968', '#ddb892', '#e6ccb2', '#606c38']]];
  function pIdeas() {
    var s = S(), xs = load('wp-ideas', []);
    var h = heroBand('🎨', 'Inspiration & mood boards', 'Choose a palette, save links and images by category, and build the look of the day together.');
    h += '<div class="grp">Color palette<small>' + (s.palette ? 'chosen: ' + esc(s.palette) : 'tap one to choose') + '</small></div><div class="pals">' + PALETTES.map(function (p) { return '<button type="button" class="pal' + (s.palette === p[0] ? ' on' : '') + '" data-pal="' + esc(p[0]) + '"><div class="sw">' + p[1].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div><b>' + esc(p[0]) + '</b></button>'; }).join('') + '</div>';
    var cats = ['Overall vibe', 'Venue', 'Décor', 'Flowers', 'Attire', 'Cake', 'Music', 'Food', 'Stationery', 'Photos', 'Other'];
    h += '<div class="toolbar" style="margin-top:14px"><button class="btn" data-add="ideas">+ Save an idea</button><span class="sub" style="margin:0">Paste a Pinterest / Instagram / image link — direct image links show as pictures.</span></div>';
    h += '<div class="boards">' + cats.filter(function (c) { return c === 'Overall vibe' || xs.some(function (x) { return x.cat === c; }); }).map(function (c) {
      var l = xs.filter(function (x) { return (x.cat || 'Other') === c; });
      return '<div class="board"><h3>' + esc(c) + ' <small>' + l.length + '</small></h3>' + (l.length ? l.map(function (x) { var img = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(x.url || ''); return '<div class="pin" data-op="ideas" data-id="' + x.id + '">' + (img ? '<img src="' + esc(x.url) + '" alt="" loading="lazy">' : '<div class="pin-ph">' + esc((x.title || '?').slice(0, 1)) + '</div>') + '<b>' + esc(x.title || 'Idea') + '</b>' + (x.notes ? '<small>' + esc(x.notes) + '</small>' : '') + (x.url && !img ? '<a class="lnk m" href="' + esc(x.url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">open link ↗</a>' : '') + '</div>'; }).join('') : '<p class="empty">Nothing yet — add the first idea.</p>') + '</div>';
    }).join('') + '</div>';
    h += '<div class="card"><h3>💡 Prompts to talk through</h3><ul class="ql">' + ['Three words guests should use to describe the day', 'One wedding you attended that you loved — what made it special?', 'Flowers: lush & romantic, wild & garden, or minimal greenery?', 'Lighting: candles, string lights, chandeliers?', 'What should the invitation feel like when it is opened?'].map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul></div>';
    return h;
  }
  /* ---------- dashboard ---------- */
  var TIPS = ['Score venues right after each tour — memories blur after three visits.', 'Every 10 guests removed saves roughly $2,000–4,000.', 'Ask caterers whether stocks and sauces are meat-free: hidden chicken stock is the #1 vegetarian surprise.', 'Fridays, Sundays and Nov–Mar dates often cost 20–40% less.', 'Keep a 5% budget buffer — almost every couple overspends somewhere.', 'Book your #1 priority right after the venue.', 'Agar replaces gelatin in panna cotta, mousse and gummies — ask your baker.', 'Pick one planning night a week and keep the rest wedding-free.'];
  function phaseNow() {
    var a = anchor().d; if (!a) return null;
    var d = daysBetween(today(), a); if (d < 0) return 'after';
    return d > 300 ? '12' : d > 200 ? '9' : d > 130 ? '6' : d > 65 ? '4' : d > 30 ? '2' : d > 7 ? '1' : d > 0 ? 'w' : 'd';
  }
  function modules() {
    var tasks = load('wp-tasks', []), gc = guestCounts(), vs = load('wp-vendors', []), menu = load('wp-menu', []), tabs = load('wp-tables', []), pr = profileProgress(), all = load('wp-lists', []);
    var seated = load('wp-guests', []).filter(function (x) { return x.table; }).length, hh = load('wp-guests', []).length;
    var cats = load('wp-budget', []), alloc = cats.filter(function (c) { return num(c.actual) > 0; }).length;
    var sc = load('wp-venues', []).filter(function (v) { return v.sc && Object.keys(v.sc).length; }).length;
    return [
      ['start', '💞', 'Wedding journey', pr.n, pr.of], ['timeline', '🗓️', 'Tasks', tasks.filter(function (t) { return t.done; }).length, tasks.length],
      ['budget', '💰', 'Budget booked', alloc, cats.length], ['compare', '⚖️', 'Venues scored', sc, Math.max(3, load('wp-venues', []).length)],
      ['vendors', '🤝', 'Vendors booked', vs.filter(function (v) { return v.status === 'Booked'; }).length, Math.max(8, vs.length)], ['guests', '💌', 'RSVPs in', gc.yes + gc.no, gc.invited],
      ['seating', '🪑', 'Households seated', seated, hh], ['menu', '🥗', 'Menu dishes', menu.filter(function (m) { return m.pick; }).length, Math.max(12, menu.filter(function (m) { return m.pick; }).length)],
      ['lists', '✅', 'Checklists', all.filter(function (x) { return x.done; }).length, all.length], ['honeymoon', '🌴', 'Honeymoon prep', listStats('honey').n, listStats('honey').of]];
  }
  function pOverview() {
    var s = S(), a = anchor(), tot = totalBudget(), cats = load('wp-budget', []), spent = cats.reduce(function (x, c) { return x + num(c.actual); }, 0), gc = guestCounts();
    var tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];
    var h = '<div class="tipbar">💡 <b>Tip of the day:</b> ' + esc(tip) + '</div>';
    var days = a.d ? daysBetween(today(), a.d) : null;
    var when = s.date ? fmtD(s.date) : (s.dateFrom ? 'Tentatively ' + fmtD(s.dateFrom) : (s.season ? 'Dreaming of ' + esc(s.season) : 'Date to be decided'));
    h += '<div class="hero2">' + ART + '<div class="hero2-in"><div class="kick">The wedding of</div><h1 class="names">' + esc(couple()) + '</h1><div class="when">' + when + (s.location ? ' · ' + esc(s.location) : '') + '</div>' +
      (days != null && days >= 0 ? '<div class="cdown" data-cd="' + iso(a.d) + '">' + ['days', 'hours', 'min', 'sec'].map(function (u) { return '<div><b data-u="' + u + '">–</b><small>' + u + '</small></div>'; }).join('') + '</div>' : (days != null ? '<div class="cdown"><div><b>♥</b><small>married!</small></div></div>' : '<div class="nodate"><a class="btn" href="#start">Start our wedding profile</a><a class="btn alt" href="#settings">Set the date</a></div>')) + '</div></div>';
    var ph = phaseNow(), phName = ph && ph !== 'after' ? (GROUPS.filter(function (g) { return g[0] === ph; })[0] || [])[1] : null;
    h += '<div class="grid2 stats4">' + [['Budget', tot ? money(tot) : '—', tot ? money(spent) + ' committed' : 'set in profile', '#budget'], ['Guests', gc.invited || (S().guestEst ? '~' + S().guestEst : '—'), gc.yes + ' attending · ' + gc.pending + ' pending', '#guests'], ['Phase', phName || 'Dreaming', phName ? 'tasks are due now' : 'no date yet — relative timeline', '#timeline'], ['Menu', load('wp-menu', []).filter(function (m) { return m.pick; }).length + ' dishes', '100% vegetarian', '#menu']].map(function (x) { return '<a class="card stat lift" href="' + x[3] + '"><div class="k">' + x[0] + '</div><div class="v">' + x[1] + '</div><div class="m sub" style="margin:2px 0 0">' + x[2] + '</div></a>'; }).join('') + '</div>';
    var ms = modules(), open = ms.reduce(function (x, m) { return x + Math.max(0, m[4] - m[3]); }, 0);
    h += '<div class="card mission"><div class="mission-h"><h3>Wedding Mission Dashboard</h3><span><b>' + open + '</b> open items</span></div><div class="mgrid">' + ms.map(function (m) { var p = m[4] ? m[3] / m[4] * 100 : 0; return '<a class="mcell" href="#' + m[0] + '">' + ring(p, 56, m[1]) + '<div><b>' + esc(m[2]) + '</b><small>' + m[3] + ' / ' + m[4] + '</small>' + bar(p) + '</div></a>'; }).join('') + '</div></div>';
    var sug = suggestions().slice(0, 4), dl = deadlines(6);
    h += '<div class="ov-cols"><div class="card"><h3>🧭 Suggested next steps</h3><ul class="list">' + sug.map(function (x) { return '<li class="row"><div class="main"><div class="t">' + esc(x[0]) + '</div><div class="m">' + esc(x[1]) + '</div></div>' + (x[2] ? '<a class="btn sm alt" href="#' + x[2] + '">Go</a>' : '') + '</li>'; }).join('') + '</ul></div>' +
      '<div class="card"><h3>⏰ Next deadlines</h3><ul class="list">' + (dl.length ? dl.map(function (x) { var late = x.d && x.d < today(); return '<li class="row"><div class="main"><div class="t">' + esc(x.t) + '</div><div class="m">' + esc(x.k) + ' · ' + (x.d ? fmtD(iso(x.d)) : relLabel({ off: x.off })) + '</div></div>' + (late ? '<span class="pill w">Overdue</span>' : '') + '</li>'; }).join('') : '<li class="empty">Nothing due</li>') + '</ul></div>';
    var p = P();
    h += '<div class="card"><h3>💍 Our wedding profile</h3>' + (profileProgress().n ? '<div class="kv"><span>Vibe</span><b>' + esc((p.vibes || []).slice(0, 3).join(', ') || '—') + '</b></div><div class="kv"><span>Guests</span><b>' + esc(p.guests || '—') + '</b></div><div class="kv"><span>Season</span><b>' + esc((p.seasons || []).join(' / ') || '—') + '</b></div><div class="kv"><span>Food</span><b>' + esc(p.service || '—') + (p.vegan != null ? ' · ' + p.vegan + '% vegan' : '') + '</b></div><div class="kv"><span>Top priority</span><b>' + esc(ranked()[0]) + '</b></div>' : '<p class="sub">Not started — it takes about 15 minutes together.</p>') + '<a class="btn sm alt" href="#start" style="margin-top:10px">Open profile</a></div>';
    var picks = load('wp-menu', []).filter(function (m) { return m.pick; });
    h += '<div class="card"><h3>🥗 Menu shortlist</h3>' + (picks.length ? '<div class="chips">' + picks.slice(0, 12).map(function (m) { return '<span>' + esc(m.name) + '</span>'; }).join('') + '</div>' : '<p class="sub">Explore ' + LIB.length + ' vegetarian dishes and add favorites.</p>') + '<a class="btn sm alt" href="#menu" style="margin-top:10px">Explore menu</a></div></div>';
    return '<h1 style="display:none">Overview</h1><div>' + h + '</div>';
  }

  /* ---------- timeline by phase ---------- */
  var PHASEGUIDE = { '12': 'Big decisions: budget, guest count, venue, date. Everything else follows these.', '9': 'Book the people: caterer, music, officiant, florist. Send save-the-dates.', '6': 'Details & paper: invitations, rentals, beauty, honeymoon.', '4': 'Taste & finalize: cake, menu, rings, ceremony plan.', '2': 'Invitations out, vows written, timeline confirmed.', '1': 'Final counts, seating, license, payments.', 'w': 'Delegate, confirm, rest. Hand off the emergency kit.', 'd': 'Eat breakfast. Be present. Enjoy it.' };
  var phOpen = null;
  function pTimeline() {
    var a = anchor(), tasks = load('wp-tasks', []), now = phaseNow(), dn = tasks.filter(function (t) { return t.done; }).length;
    if (phOpen === null) phOpen = now && now !== 'after' ? now : '12';
    var h = heroBand('🗓️', 'Phase-by-phase timeline', a.d ? 'Due dates count back from ' + fmtD(iso(a.d)) + '.' : 'No date yet — each phase shows how far ahead it happens. Set a date and real due dates appear.');
    h += '<div class="phbar">' + GROUPS.map(function (g) { var l = tasks.filter(function (t) { return t.g === g[0]; }), d = l.filter(function (t) { return t.done; }).length; return '<button type="button" class="phb' + (g[0] === phOpen ? ' on' : '') + (g[0] === now ? ' now' : '') + '" data-ph="' + g[0] + '">' + ring(l.length ? d / l.length * 100 : 0, 50) + '<small>' + esc(g[1]) + '</small></button>'; }).join('') + '</div>';
    h += '<div class="sub" style="text-align:center">' + dn + ' of ' + tasks.length + ' tasks done overall</div>';
    h += '<div class="seg">' + [['all', 'All'], ['open', 'To do'], ['done', 'Done']].map(function (x) { return '<button data-tf="' + x[0] + '" class="' + (tFilter === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    GROUPS.forEach(function (g) {
      var all = tasks.filter(function (t) { return t.g === g[0]; }); if (!all.length) return;
      var d = all.filter(function (t) { return t.done; }).length, open = g[0] === phOpen;
      h += '<div class="phase' + (open ? ' open' : '') + '"><button type="button" class="phase-h" data-ph="' + g[0] + '">' + ring(d / all.length * 100, 46) + '<div><b class="phn">' + esc(g[1]) + (g[0] === now ? ' <span class="pill">you are here</span>' : '') + '</b><small>' + esc(PHASEGUIDE[g[0]] || '') + '</small></div><i>' + (open ? '−' : '+') + '</i></button>';
      if (open) {
        var list = all.filter(function (t) { return tFilter === 'all' || (tFilter === 'done') === !!t.done; }).sort(function (x, y) { return y.off - x.off; });
        h += '<ul class="list phase-b">' + (list.length ? list.map(function (t) { var du = taskDue(t), late = du && !t.done && du < today(); return '<li class="row' + (t.done ? ' done' : '') + '"><input type="checkbox" class="chk" data-tg="tasks" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + '><div class="main" data-op="tasks" data-id="' + t.id + '"><div class="t">' + esc(t.title) + '</div><div class="m">' + (du ? fmtD(iso(du)) : relLabel(t)) + ' · ' + esc(t.owner || '') + (t.notes ? ' · ' + esc(t.notes) : '') + '</div></div>' + (late ? '<span class="pill w">Overdue</span>' : '') + '</li>'; }).join('') : '<li class="empty">—</li>') + '</ul>';
      }
      h += '</div>';
    });
    h += '<button class="btn alt" data-add="tasks" style="width:100%;margin-top:6px">+ Add task</button>';
    return h;
  }

  /* ---------- wrappers that enrich existing pages ---------- */
  function pBudget() { return heroBand('💰', 'Budget', 'Estimate, split and track every dollar. Splits follow your priorities.') + pEstimator() + '<div class="grp">Our budget tracker</div>' + pBudgetBase().replace(/^<h2>.*?<\/h2>/, ''); }
  function pMenu() { return pMenuExplorer() + '<div class="grp">Our menu</div>' + pMenuBase().replace(/^<h2>.*?<\/h2>/, ''); }
  function pVendors() { return heroBand('🤝', 'Vendors', 'Contacts, quotes, contracts and deposits — then score them in Compare & score.') + '<a class="btn sm alt" href="#compare" style="margin-bottom:12px" onclick="window.__cmpVendor=1">⚖️ Score & compare vendors</a>' + pVendorsBase().replace(/^<h2>.*?<\/h2>/, ''); }
  function pGuests() {
    var c = guestCounts(), hs = load('wp-guests', []), sides = {}, meals = c.meals;
    hs.forEach(function (x) { var k = x.side || 'Unassigned'; sides[k] = (sides[k] || 0) + (x.members || []).length; });
    var h = heroBand('💌', 'Guests & RSVPs', c.invited + ' invited · ' + c.yes + ' attending · ' + c.pending + ' waiting to reply');
    h += '<div class="cols3"><div class="card center"><h3>RSVP status</h3>' + donut([['Attending', c.yes], ['Pending', c.pending], ['Declined', c.no]].map(function (x) { return [x[0], x[1] || 0.0001]; })) + '</div>' +
      '<div class="card"><h3>Meal choices</h3>' + (Object.keys(meals).length ? Object.keys(meals).map(function (m) { return '<div class="spl"><span>' + esc(m) + '</span><i style="width:' + (meals[m] / Math.max(1, c.yes) * 100) + '%"></i><b>' + meals[m] + '</b></div>'; }).join('') : '<p class="sub">Meal counts appear as RSVPs come in.</p>') + '</div>' +
      '<div class="card"><h3>Sides</h3>' + Object.keys(sides).map(function (k) { return '<div class="spl"><span>' + esc(k) + '</span><i style="width:' + (sides[k] / Math.max(1, c.invited) * 100) + '%"></i><b>' + sides[k] + '</b></div>'; }).join('') + '<div class="kv" style="margin-top:8px"><span>Save-the-dates sent</span><b>' + hs.filter(function (x) { return x.saveDate; }).length + ' / ' + hs.length + '</b></div><div class="kv"><span>Invitations sent</span><b>' + hs.filter(function (x) { return x.invite; }).length + ' / ' + hs.length + '</b></div></div></div>';
    return h + pGuestsBase().replace(/^<h2>.*?<\/h2>/, '');
  }
  function pSeating() {
    var tables = load('wp-tables', []), hs = load('wp-guests', []);
    var h = heroBand('🪑', 'Seating chart', 'Each circle is a table; filled seats show who is sitting there.');
    if (tables.length) h += '<div class="floor">' + tables.map(function (t) {
      var ppl = []; hs.forEach(function (x) { if (x.table === t.name) (x.members || []).forEach(function (m) { if (m.rsvp !== 'Declined') ppl.push(m.name); }); });
      var cap = num(t.cap) || Math.max(8, ppl.length), seats = '';
      for (var i = 0; i < cap; i++) { var an = i / cap * 2 * Math.PI - Math.PI / 2, x = 70 + 54 * Math.cos(an), y = 70 + 54 * Math.sin(an); seats += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" class="' + (i < ppl.length ? 'seat on' : 'seat') + (i >= num(t.cap) && num(t.cap) ? ' over' : '') + '"><title>' + esc(ppl[i] || 'empty') + '</title></circle>'; }
      return '<div class="tview" data-op="tables" data-id="' + t.id + '"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="36" class="tb"/>' + seats + '<text x="70" y="74" text-anchor="middle">' + esc(t.name) + '</text></svg><small>' + ppl.length + ' / ' + (num(t.cap) || '–') + '</small></div>';
    }).join('') + '</div>';
    return h + pSeatingBase().replace(/^<h2>.*?<\/h2>/, '');
  }
  function pDayof() {
    var h = heroBand('⏱️', 'Day-of run sheet', 'The schedule, who to call, and the emergency kit — print it for your coordinator.');
    var rs = load('wp-schedule', []).slice().sort(function (a, b) { return (a.time || '').localeCompare(b.time || ''); });
    h += '<div class="cols2 wide-l"><div class="card"><div class="vt">' + rs.map(function (r) { var t = r.time ? new Date('2000-01-01T' + r.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'; return '<div class="vti" data-op="schedule" data-id="' + r.id + '"><span class="vtt">' + esc(t) + '</span><span class="vtd"></span><div><b>' + esc(r.title) + '</b><small>' + esc([r.where, r.who, r.notes].filter(Boolean).join(' · ')) + '</small></div></div>'; }).join('') + '</div><button class="btn alt" data-add="schedule" style="width:100%;margin-top:8px">+ Add item</button></div>';
    var vs = load('wp-vendors', []).filter(function (v) { return v.status === 'Booked' || v.phone; });
    h += '<div><div class="card"><h3>📞 Who to call</h3>' + (vs.length ? vs.map(function (v) { return '<div class="kv"><span>' + esc(v.cat) + ' — ' + esc(v.name || '') + '</span><b>' + (v.phone ? '<a class="lnk" href="tel:' + esc(v.phone) + '">' + esc(v.phone) + '</a>' : '') + '</b></div>'; }).join('') : '<p class="sub">Booked vendors with phone numbers appear here.</p>') + '</div>' + listCard(LISTS[0]) + '</div></div>';
    return h;
  }
  var MORE = [['start', '💞', 'Wedding journey'], ['compare', '⚖️', 'Compare & score'], ['menu', '🥗', 'Vegetarian menu'], ['vendors', '🤝', 'Vendors'], ['seating', '🪑', 'Seating'], ['dayof', '⏱️', 'Day-of'], ['ideas', '🎨', 'Mood boards'], ['honeymoon', '🌴', 'Honeymoon'], ['lists', '✅', 'Checklists'], ['guides', '📚', 'Tips & guides'], ['decisions', '✍️', 'Decisions'], ['settings', '⚙️', 'Settings & sync']];
  function pMore() { return heroBand('♡', 'Everything', 'All planning tools in one place.') + '<div class="tiles">' + MORE.map(function (m) { return '<a class="tile" href="#' + m[0] + '"><span>' + m[1] + '</span><b>' + m[2] + '</b></a>'; }).join('') + '</div>'; }

  /* ---------- live countdown ---------- */
  setInterval(function () {
    var el = document.querySelector('.cdown[data-cd]'); if (!el) return;
    var t = parseD(el.getAttribute('data-cd')); t.setHours(16, 0, 0, 0); var ms = Math.max(0, t - Date.now());
    var v = { days: Math.floor(ms / 864e5), hours: Math.floor(ms / 36e5) % 24, min: Math.floor(ms / 6e4) % 60, sec: Math.floor(ms / 1e3) % 60 };
    el.querySelectorAll('[data-u]').forEach(function (b) { b.textContent = v[b.getAttribute('data-u')]; });
  }, 1000);

  /* ---------- event binding for rich pages ---------- */
  function richBind(el) {
    function on(sel, ev, fn) { el.querySelectorAll(sel).forEach(function (b) { b.addEventListener(ev, function (e) { fn(b, e); }); }); }
    on('[data-topic]', 'click', function (b) { topicCur = b.getAttribute('data-topic'); render(); var c = document.querySelector('.topic'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    on('[data-pf]', 'click', function (b) { var k = b.getAttribute('data-pf'), v = b.getAttribute('data-v'), p = P(); if (b.hasAttribute('data-multi')) { var a = (p[k] || []).slice(), i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); setP(k, a); } else setP(k, p[k] === v ? '' : v); render(); });
    on('[data-pfr]', 'input', function (b) { b.nextElementSibling.textContent = fmtV(b.value, b.getAttribute('data-fmt')); });
    on('[data-pfr]', 'change', function (b) { setP(b.getAttribute('data-pfr'), +b.value); render(); });
    on('[data-pft]', 'change', function (b) { setP(b.getAttribute('data-pft'), b.value.trim()); });
    on('[data-tot]', 'click', function (b) { var p = P(), t = Object.assign({}, p.tot || {}); t[b.getAttribute('data-tot')] = b.getAttribute('data-v'); setP('tot', t); render(); });
    on('[data-rk]', 'click', function (b) { var r = ranked(), i = +b.getAttribute('data-rk'), j = i + +b.getAttribute('data-d'); if (j < 0 || j >= r.length) return; var x = r[i]; r[i] = r[j]; r[j] = x; setP('rank', r); render(); });
    on('[data-rkok]', 'click', function () { setP('rank', ranked()); render(); });
    on('[data-skip]', 'click', function (b) { var p = P(), a = (p.skip || []).slice(), v = b.getAttribute('data-skip'), i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); setP('skip', a); if (!p.rank) setP('rank', ranked()); render(); });
    on('#apply-profile', 'click', function () { applyProfile(); render(); });
    on('[data-sugg]', 'click', function (b) { var s = suggestions()[+b.getAttribute('data-sugg')]; var ts = load('wp-tasks', []); if (!ts.some(function (t) { return t.title === s[0]; })) { ts.push({ id: uid(), g: '12', off: 360, title: s[0], owner: 'Couple', done: false, notes: s[1], due: '' }); save('wp-tasks', ts); } b.textContent = '✓ Added'; b.disabled = true; });
    on('[data-cmode]', 'click', function (b) { cmpMode = b.getAttribute('data-cmode'); render(); });
    on('[data-ccat]', 'click', function (b) { cmpCat = b.getAttribute('data-ccat'); render(); });
    on('[data-wt]', 'input', function (b) { b.nextElementSibling.textContent = b.value; });
    on('[data-wt]', 'change', function (b) { var w = load('wp-weights', {}); w[b.getAttribute('data-wt')] = +b.value; save('wp-weights', w); render(); });
    on('[data-star]', 'click', function (b) { var key = b.getAttribute('data-star'), id = b.getAttribute('data-id'), c = b.getAttribute('data-c'), v = +b.getAttribute('data-v'); save(key, load(key, []).map(function (x) { if (x.id !== id) return x; x = Object.assign({}, x); x.sc = Object.assign({}, x.sc || {}); x.sc[c] = x.sc[c] === v ? 0 : v; return x; })); render(); });
    on('[data-pc]', 'change', function (b) { var key = b.getAttribute('data-pc'), id = b.getAttribute('data-id'), f = b.getAttribute('data-f'); save(key, load(key, []).map(function (x) { if (x.id !== id) return x; x = Object.assign({}, x); x[f] = b.value; return x; })); });
    on('[data-est]', 'input', function (b) { b.nextElementSibling.textContent = b.value; });
    on('[data-est]', 'change', function (b) { var e = load('wp-est', {}); e.guests = +b.value; save('wp-est', e); render(); });
    on('[data-estl]', 'click', function (b) { var e = load('wp-est', {}); e.level = b.getAttribute('data-estl'); save('wp-est', e); render(); });
    on('[data-usebud]', 'click', function (b) { save('wp-settings', Object.assign({}, S(), { budget: b.getAttribute('data-usebud') })); render(); });
    on('#apply-splits', 'click', function (b) { var sp = profileSplits(); save('wp-budget', load('wp-budget', []).map(function (c) { return sp[c.id] != null ? Object.assign({}, c, { pct: sp[c.id], est: '' }) : c; })); render(); });
    on('[data-mf]', 'click', function (b) { var k = b.getAttribute('data-mf'), v = b.getAttribute('data-v'); if (k === 'diet') mfDiet = v; if (k === 'course') mfCourse = v; if (k === 'cuis') mfCuis = v; render(); });
    var q = $('#mfq', el); if (q) q.oninput = function () { mfQ = q.value.toLowerCase(); var pos = q.selectionStart; render(); var n = $('#mfq'); n.focus(); n.setSelectionRange(pos, pos); };
    function addDish(x) { var m = load('wp-menu', []), ix = m.findIndex(function (y) { return y.name.toLowerCase() === x[1].toLowerCase(); }); if (ix >= 0) { m[ix] = Object.assign({}, m[ix], { pick: !m[ix].pick }); } else m.push({ id: uid(), course: x[0], name: x[1], tags: x[2], notes: x[4] + (x[3] ? ' (' + x[3] + ')' : ''), pick: true }); save('wp-menu', m); }
    on('[data-dish]', 'click', function (b) { var x = LIB.filter(function (d) { return d[1] === b.getAttribute('data-dish'); })[0]; if (x) { addDish(x); render(); } });
    on('[data-theme]', 'click', function (b) { var m = load('wp-menu', []), names = {}; m.forEach(function (y) { names[y.name.toLowerCase()] = 1; }); LIB.filter(function (d) { return d[3] === b.getAttribute('data-theme') && !names[d[1].toLowerCase()]; }).forEach(function (d) { m.push({ id: uid(), course: d[0], name: d[1], tags: d[2], notes: d[4], pick: true }); }); save('wp-menu', m); render(); });
    on('[data-cater]', 'input', function (b) { b.nextElementSibling.textContent = fmtV(b.value, b.getAttribute('data-fmt')); });
    on('[data-cater]', 'change', function (b) { var c = load('wp-cater', {}); c[b.getAttribute('data-cater')] = +b.value; save('wp-cater', c); render(); });
    on('[data-lt]', 'change', function (b) { var id = b.getAttribute('data-lt'); save('wp-lists', load('wp-lists', []).map(function (x) { return x.id === id ? Object.assign({}, x, { done: b.checked }) : x; })); render(); });
    on('[data-ldel]', 'click', function (b) { var id = b.getAttribute('data-ldel'); save('wp-lists', load('wp-lists', []).filter(function (x) { return x.id !== id; })); render(); });
    function ladd(lid) { var i = el.querySelector('[data-ladd="' + lid + '"]'); if (!i || !i.value.trim()) return; var a = load('wp-lists', []); a.push({ id: uid(), list: lid, title: i.value.trim(), done: false }); save('wp-lists', a); render(); }
    on('[data-laddb]', 'click', function (b) { ladd(b.getAttribute('data-laddb')); });
    on('[data-ladd]', 'keydown', function (b, e) { if (e.key === 'Enter') ladd(b.getAttribute('data-ladd')); });
    on('[data-guide]', 'click', function (b) { var i = +b.getAttribute('data-guide'); gOpen = gOpen === i ? -1 : i; render(); });
    on('[data-pal]', 'click', function (b) { var pal = PALETTES.filter(function (p) { return p[0] === b.getAttribute('data-pal'); })[0]; save('wp-settings', Object.assign({}, S(), { palette: pal[0], colors: S().colors || pal[0] })); render(); });
    on('[data-ph]', 'click', function (b) { var v = b.getAttribute('data-ph'); phOpen = phOpen === v ? '' : v; render(); });
    if (window.__cmpVendor && cur() === 'compare') { cmpMode = 'vendor'; window.__cmpVendor = 0; render(); }
  }
  /* ======================= v1.4.1 immersive "Our Wedding Journey" ======================= */
  var JT = { // topic: [emoji, name, gradient, badge]
    hello: ['💞', 'Welcome', 'linear-gradient(160deg,#fff4ef,#f7d9d6)', ''],
    vision: ['✨', 'Vision & vibe', 'linear-gradient(160deg,#fff6f0,#f3d6e0)', ['🌟', 'Visionaries']],
    guests: ['💌', 'Guest count', 'linear-gradient(160deg,#fff8ec,#f6dfc0)', ['🥂', 'Hosts with the most']],
    season: ['🍂', 'Season & date', 'linear-gradient(160deg,#fffaf0,#f1ddc4)', ['📅', 'Date dreamers']],
    budget: ['💰', 'Budget comfort', 'linear-gradient(160deg,#f8fbf2,#dbe8cd)', ['🤝', 'Money-talk champs']],
    location: ['📍', 'Location', 'linear-gradient(160deg,#f2f8fa,#cfe5ea)', ['🗺️', 'Location scouts']],
    prio: ['🏆', 'Priorities', 'linear-gradient(160deg,#fbf7ff,#e1d7f0)', ['🎯', 'Priority pros']],
    food: ['🥗', 'Vegetarian feast', 'linear-gradient(160deg,#f6fbf1,#d3e8c8)', ['👩‍🍳', 'Foodies']],
    reveal: ['💍', 'Our profile', 'linear-gradient(160deg,#fff7ef,#f0d3c8)', '']
  };
  var STYLES = {
    garden: ['🌿', 'Romantic Garden', 'Soft florals, golden-hour light, long tables under string lights. Your day feels like a love letter written outdoors.', ['Garden', 'Cottagecore'], 'Blush & sage'],
    boho: ['🌾', 'Rustic Boho', 'Barns, wildflowers, macramé and bare feet on the dance floor. Warm, relaxed and full of personality.', ['Rustic barn', 'Boho'], 'Autumn harvest'],
    modern: ['🖤', 'Modern Chic', 'Clean lines, a city loft or gallery, bold florals and a killer playlist. Effortlessly cool.', ['Modern minimal', 'City chic', 'Industrial loft'], 'Modern monochrome'],
    classic: ['🕊️', 'Classic Elegance', 'Candlelight, a grand room, white roses and a string quartet. Timeless, the photos will never date.', ['Black-tie', 'Vintage'], 'Classic ivory & gold'],
    mountain: ['🏔️', 'Rocky Mountain Romance', 'Pines, peaks and golden aspens, a lodge fireplace and a sunset over the Front Range. Grounded, cozy and breathtaking.', ['Mountain', 'Rustic barn'], 'Dusty blue']
  };
  STYLES.beach = STYLES.mountain;   // legacy answers from v1.4.1
  var QUIZ = [
    ['Your dream Saturday together is…', [['garden', '🌸', 'Farmers market & picnic'], ['boho', '🏕️', 'Road trip & campfire'], ['modern', '🏙️', 'Gallery & rooftop bar'], ['classic', '🎻', 'Brunch & the symphony'], ['mountain', '🥾', 'Hike & a mountain-town brunch']]],
    ['Pick a centerpiece', [['garden', '💐', 'Overflowing roses & peonies'], ['boho', '🌾', 'Dried grasses & candles'], ['modern', '🪴', 'One sculptural stem'], ['classic', '🕯️', 'Tall candelabra'], ['mountain', '🌲', 'Pine boughs & aspen logs']]],
    ['The first dance song is…', [['garden', '🎶', 'A dreamy acoustic love song'], ['boho', '🪕', 'Indie folk'], ['modern', '🎧', 'Something unexpected & cool'], ['classic', '🎷', 'A jazz standard'], ['mountain', '🎸', 'Bluegrass / Americana']]],
    ['Your vegetarian dinner looks like…', [['garden', '🥗', 'Garden-fresh family-style platters'], ['boho', '🔥', 'Wood-fired pizzas & grain bowls'], ['modern', '🍣', 'Chef’s tasting stations'], ['classic', '🍽️', 'Elegant plated risotto'], ['mountain', '🍲', 'Hearty lodge feast: chili, cornbread & roasted roots']]],
    ['Guests should leave saying…', [['garden', '🥹', '“That was so romantic”'], ['boho', '😂', '“Best party ever”'], ['modern', '😮', '“So stylish”'], ['classic', '🥂', '“Pure class”'], ['mountain', '🏔️', '“That view!”']]]];
  var TALK = {
    hello: ['Before you start', 'Sit together, phones down, something nice to drink. There are no wrong answers — the goal is to hear each other.'],
    vision: ['Talk about it 💬', 'Close your eyes: it is the last song of the night. Where are you, who is around you, what does it smell like? Each describe it.'],
    guests: ['Talk about it 💬', 'Name three people you would be heartbroken not to see there. Then: is there anyone you feel obligated to invite but would not miss?'],
    season: ['Talk about it 💬', 'What is your favorite season memory together? Does a date already mean something to you two?'],
    budget: ['Talk about it 💬', 'What number would feel exciting, and what number would make you anxious? Start somewhere in between. What would you rather spend on after the wedding?'],
    location: ['Talk about it 💬', 'Do you picture friends traveling to you, or the party in your own backyard? How far is too far for grandparents?'],
    food: ['Talk about it 💬', 'What is the best meal you have ever had together? Could a version of it be on the menu?']
  };
  function J() {
    var S2 = [['hello', 'welcome'], ['hello', 'talk']];
    S2.push(['vision', 'intro'], ['vision', 'swipe']);
    QUIZ.forEach(function (q, i) { S2.push(['vision', 'quiz', i]); });
    S2.push(['vision', 'quizres'], ['vision', 'chips', 'vibes'], ['vision', 'talk'], ['vision', 'done']);
    S2.push(['guests', 'intro'], ['guests', 'guests'], ['guests', 'chips', 'circles'], ['guests', 'talk'], ['guests', 'done']);
    S2.push(['season', 'intro'], ['season', 'seasons'], ['season', 'chips', 'days'], ['season', 'talk'], ['season', 'done']);
    S2.push(['budget', 'intro'], ['budget', 'budget'], ['budget', 'cards', 'level'], ['budget', 'talk'], ['budget', 'done']);
    S2.push(['location', 'intro'], ['location', 'cards', 'loc'], ['location', 'chips', 'vtypes'], ['location', 'travel'], ['location', 'talk'], ['location', 'done']);
    S2.push(['prio', 'intro'], ['prio', 'rank'], ['prio', 'done']);
    S2.push(['food', 'intro'], ['food', 'cards', 'service'], ['food', 'chips', 'cuisines'], ['food', 'vegan'], ['food', 'chips', 'must'], ['food', 'talk'], ['food', 'done']);
    S2.push(['reveal', 'reveal']);
    return S2;
  }
  var CARDOPTS = {
    level: ['How do we like to spend?', [['Value — DIY & savvy', '🛠️', 'Clever, crafty, every dollar counts'], ['Balanced', '⚖️', 'Splurge on a few things, save on the rest'], ['Premium — splurge', '💎', 'Once in a lifetime — go for it']]],
    loc: ['Where will we celebrate?', [['Where we live now', '🏡', 'Close to home: local vendors we know'], ['Hometown', '🏫', 'Back where it all started'], ['Destination', '✈️', 'A trip and a wedding in one'], ['Family property', '🌳', 'A backyard or farm with meaning'], ['Not sure yet', '🤔', 'Let’s keep dreaming']]],
    service: ['How should dinner be served?', [['Plated', '🍽️', 'Elegant, 2–3 choices on the RSVP'], ['Family-style', '🥘', 'Shared platters, warm & generous'], ['Buffet', '🥗', 'Most variety, usually cheapest'], ['Stations', '🍝', 'Pasta, mezze, tacos — interactive'], ['Food trucks', '🚚', 'Casual, fun, budget-friendly']]]
  };
  var CHIPQ = { vibes: ['Which words feel like us?', VIBES, 'Pick as many as you like — your quiz result is pre-selected.'], circles: ['Who is definitely invited?', ['Immediate family', 'Extended family', 'Close friends', 'College friends', 'Work friends', 'Family friends', 'Plus-ones for all', 'Kids welcome'], 'Tap everyone who is on the A-list.'], days: ['Which days are we open to?', ['Saturday', 'Friday', 'Sunday', 'Weekday', 'Holiday weekend'], 'Fridays and Sundays often save 20–40%.'], get vtypes() { return ['Venue types to explore', WL().vtypes, 'We will turn these into your venue shortlist.']; }, cuisines: ['Cuisines we love', CUISINES, 'Your menu explorer will open on these.'], must: ['Food must-haves', ['Vegan cake tier', 'GF option every course', 'Nut-free kitchen', 'Local & seasonal', 'Late-night snack', 'Signature mocktails', 'Kids menu', 'Labelled V / VG / GF'], 'Little touches guests remember.'] };
  var jIdx = 0, jDir = 1, jSwipe = 0, jOpen = false;
  function jStyle() { var p = P(), c = {}; Object.keys(p.quiz || {}).forEach(function (i) { var v = p.quiz[i]; c[v] = (c[v] || 0) + 1; }); var best = null; Object.keys(c).forEach(function (k) { if (!best || c[k] > c[best]) best = k; }); return best; }
  function people(n) { var h = ''; var dots = Math.min(150, Math.round(n / 2)); for (var i = 0; i < dots; i++) h += '<i style="animation-delay:' + (i * 6) + 'ms"></i>'; return '<div class="crowd">' + h + '</div>'; }
  function confetti() { var c = document.createElement('div'); c.className = 'confetti'; var cols = ['#e8b4b8', '#c9a86a', '#a8b89a', '#7a4e3a', '#f2cc8f', '#b5838d', '#81b29a']; for (var i = 0; i < 90; i++) { var s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % cols.length]; s.style.animationDelay = Math.random() * 0.6 + 's'; s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's'; s.style.transform = 'rotate(' + Math.random() * 360 + 'deg)'; c.appendChild(s); } document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4000); }
  function jScreen(sc) {
    var p = P(), topic = sc[0], kind = sc[1], T = JT[topic], h = '';
    if (kind === 'welcome') h = '<div class="j-big">💞</div><h1>Our Wedding Journey</h1><p class="j-lead">A guided date night for the two of you. About 15 minutes, one question at a time. Everything you choose saves on both your phone and computer, and builds your budget, checklist and menu.</p><div class="j-map-mini">' + Object.keys(JT).filter(function (k) { return k !== 'hello'; }).map(function (k) { return '<span>' + JT[k][0] + '</span>'; }).join('<b>›</b>') + '</div><button class="j-go" data-jn="1">Let’s begin ✨</button>';
    else if (kind === 'intro') h = '<div class="j-big bounce">' + T[0] + '</div><div class="j-kick">Chapter ' + Object.keys(JT).indexOf(topic) + '</div><h1>' + esc(T[1]) + '</h1><p class="j-lead">' + (TOPICS.filter(function (t) { return t[0] === topic; })[0] || ['', '', '', ''])[3] + '</p><button class="j-go" data-jn="1">Start chapter ›</button>';
    else if (kind === 'talk') { var t = TALK[topic]; var done = (p.talked || {})[topic]; h = '<div class="j-big">💬</div><div class="j-kick">' + esc(t[0]) + '</div><h2 class="j-q">' + esc(t[1]) + '</h2><textarea class="j-note" data-jnote="' + topic + '" placeholder="Jot down what you said (optional)">' + esc((p.notes || {})[topic] || '') + '</textarea><button class="j-go' + (done ? ' ok' : '') + '" data-jtalk="' + topic + '">' + (done ? '✓ We talked about it' : 'We talked about it ✓') + '</button>'; }
    else if (kind === 'swipe') {
      var tot = p.tot || {}, rem = TOT.filter(function (x) { return !tot[x[0]]; }), cur = rem[0];
      h = '<div class="j-kick">This or that · ' + (TOT.length - rem.length) + ' / ' + TOT.length + '</div><h2 class="j-q">' + (cur ? 'Swipe or tap the one that feels more like you' : 'All six decided! 🎉') + '</h2>';
      if (cur) h += '<div class="swipe-wrap"><div class="swipe" id="swipe" data-k="' + cur[0] + '"><div class="sw-a"><span>⬅️</span>' + esc(cur[1]) + '</div><div class="sw-or">or</div><div class="sw-b">' + esc(cur[2]) + '<span>➡️</span></div></div>' + (rem[1] ? '<div class="swipe next"></div>' : '') + '</div><div class="j-row"><button class="j-pick" data-jtot="' + cur[0] + '" data-v="a">' + esc(cur[1]) + '</button><button class="j-pick" data-jtot="' + cur[0] + '" data-v="b">' + esc(cur[2]) + '</button></div>';
      else h += '<div class="j-sum">' + TOT.map(function (x) { return '<span>' + esc(tot[x[0]] === 'a' ? x[1] : x[2]) + '</span>'; }).join('') + '</div><div class="j-row"><button class="j-ghost" data-jreset="tot">Redo</button><button class="j-go" data-jn="1">Next ›</button></div>';
    }
    else if (kind === 'quiz') { var q = QUIZ[sc[2]], a = (p.quiz || {})[sc[2]]; h = '<div class="j-kick">Quiz: what’s our wedding style? · ' + (sc[2] + 1) + ' / ' + QUIZ.length + '</div><h2 class="j-q">' + esc(q[0]) + '</h2><div class="j-opts">' + q[1].map(function (o) { return '<button class="j-opt' + (a === o[0] ? ' on' : '') + '" data-jquiz="' + sc[2] + '" data-v="' + o[0] + '"><span>' + o[1] + '</span>' + esc(o[2]) + '</button>'; }).join('') + '</div>'; }
    else if (kind === 'quizres') { var st = STYLES[jStyle() || 'garden']; h = '<div class="j-kick">Your wedding style is…</div><div class="reveal-card"><div class="j-big pop">' + st[0] + '</div><h1>' + esc(st[1]) + '</h1><p class="j-lead">' + esc(st[2]) + '</p><div class="sw big">' + (PALETTES.filter(function (x) { return x[0] === st[4]; })[0] || PALETTES[0])[1].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div><small>Suggested palette: ' + esc(st[4]) + '</small></div><div class="j-row"><button class="j-ghost" data-jgo="quiz0">Retake quiz</button><button class="j-go" data-jstyle="1">Love it — keep going ›</button></div>'; }
    else if (kind === 'chips') { var cq = CHIPQ[sc[2]]; h = '<div class="j-kick">' + T[0] + ' ' + esc(T[1]) + '</div><h2 class="j-q">' + esc(cq[0]) + '</h2><p class="j-sub">' + esc(cq[2]) + '</p><div class="j-chips">' + cq[1].map(function (o) { var on = (p[sc[2]] || []).indexOf(o) >= 0; return '<button class="j-chip' + (on ? ' on' : '') + '" data-jchip="' + sc[2] + '" data-v="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div><button class="j-go" data-jn="1">Next ›</button>'; }
    else if (kind === 'cards') { var co = CARDOPTS[sc[2]]; h = '<div class="j-kick">' + T[0] + ' ' + esc(T[1]) + '</div><h2 class="j-q">' + esc(co[0]) + '</h2><div class="j-cards">' + co[1].map(function (o) { return '<button class="j-card' + (p[sc[2]] === o[0] ? ' on' : '') + '" data-jcard="' + sc[2] + '" data-v="' + esc(o[0]) + '"><span>' + o[1] + '</span><b>' + esc(o[0]) + '</b><small>' + esc(o[2]) + '</small></button>'; }).join('') + '</div>'; }
    else if (kind === 'guests') { var g = +p.guests || 100; h = '<div class="j-kick">💌 Guest count</div><h2 class="j-q">How many people do we picture?</h2><div class="j-num" id="jnum">' + g + '</div>' + people(g) + '<input class="j-range" type="range" min="10" max="300" step="5" value="' + g + '" data-jr="guests"><div class="j-facts"><span>🍽️ ' + money(g * 150) + '–' + money(g * 400) + ' food & bar</span><span>🪑 ' + Math.ceil(g / 8) + ' tables of 8</span><span>' + (g <= 50 ? '🕯️ Intimate' : g <= 120 ? '💃 Classic party' : g <= 200 ? '🎉 Big celebration' : '🏟️ Grand affair') + '</span></div><button class="j-go" data-jn="1">Next ›</button>'; }
    else if (kind === 'budget') { var bu = +p.budget || 35000, g2 = +p.guests || 100; h = '<div class="j-kick">💰 Budget comfort</div><h2 class="j-q">What total feels comfortable?</h2><div class="j-num">' + money(bu) + '</div><input class="j-range" type="range" min="5000" max="150000" step="2500" value="' + bu + '" data-jr="budget"><div class="j-facts"><span>👥 ' + money(bu / g2) + ' per guest</span><span>🥗 ' + money(bu * 0.27) + ' for the feast</span><span>🛟 ' + money(bu * 0.05) + ' buffer</span></div><p class="j-sub">U.S. average ≈ $33k for ~115 guests. Most couples land between $15k and $60k.</p><button class="j-go" data-jn="1">Next ›</button>'; }
    else if (kind === 'travel') { var tr = p.travel == null ? 50 : +p.travel; h = '<div class="j-kick">📍 Location</div><h2 class="j-q">How far would most guests travel?</h2><div class="j-num">' + fmtV(tr, 'mi') + '</div><div class="j-trip">🏠<i style="width:' + Math.min(100, tr / 10) + '%"></i>' + (tr >= 1000 ? '✈️' : tr > 200 ? '🚗' : '🚶') + '</div><input class="j-range" type="range" min="0" max="1000" step="25" value="' + tr + '" data-jr="travel"><button class="j-go" data-jn="1">Next ›</button>'; }
    else if (kind === 'vegan') { var vg = p.vegan == null ? 30 : +p.vegan; h = '<div class="j-kick">🥗 Vegetarian feast</div><h2 class="j-q">How much of the menu should be fully vegan?</h2><div class="j-num">' + vg + '%</div><div class="plate"><div style="--v:' + vg + '"></div><span>🌱</span></div><input class="j-range" type="range" min="0" max="100" step="10" value="' + vg + '" data-jr="vegan"><p class="j-sub">Everything is vegetarian. Vegan dishes also skip dairy, eggs and honey.</p><button class="j-go" data-jn="1">Next ›</button>'; }
    else if (kind === 'seasons') { h = '<div class="j-kick">🍂 Season & date</div><h2 class="j-q">Which seasons make our hearts sing?</h2><div class="j-cards four">' + [['Spring', '🌸', WL().jseasons.Spring], ['Summer', '☀️', WL().jseasons.Summer], ['Fall', '🍁', WL().jseasons.Fall], ['Winter', '❄️', WL().jseasons.Winter]].map(function (o) { return '<button class="j-card' + ((p.seasons || []).indexOf(o[0]) >= 0 ? ' on' : '') + '" data-jchip="seasons" data-v="' + o[0] + '"><span>' + o[1] + '</span><b>' + o[0] + '</b><small>' + o[2] + '</small></button>'; }).join('') + '</div><div class="j-chips">' + [String(new Date().getFullYear() + 1), String(new Date().getFullYear() + 2), 'Not sure yet'].map(function (y) { return '<button class="j-chip' + (p.year === y ? ' on' : '') + '" data-jone="year" data-v="' + y + '">' + y + '</button>'; }).join('') + '</div><button class="j-go" data-jn="1">Next ›</button>'; }
    else if (kind === 'rank') { var r = ranked(), sk = p.skip || []; h = '<div class="j-kick">🏆 Priorities</div><h2 class="j-q">Put what matters most at the top</h2><p class="j-sub">Top 3 get extra budget. Skip what you do not care about.</p><ol class="j-rank">' + r.map(function (x, i) { var s = sk.indexOf(x) >= 0; return '<li class="' + (s ? 'sk' : '') + (i < 3 && !s ? ' top' : '') + '"><span class="rn">' + (i < 3 && !s ? ['🥇', '🥈', '🥉'][i] : i + 1) + '</span><b>' + esc(x) + '</b><button data-jrk="' + i + '" data-d="-1">▲</button><button data-jrk="' + i + '" data-d="1">▼</button><button class="skb" data-jskip="' + esc(x) + '">' + (s ? 'Keep' : 'Skip') + '</button></li>'; }).join('') + '</ol><button class="j-go" data-jrankok="1">These are our priorities ›</button>'; }
    else if (kind === 'done') { var bd = T[3]; h = '<div class="badge-pop"><div class="medal">' + bd[0] + '</div></div><div class="j-kick">Chapter complete!</div><h1>' + esc(bd[1]) + '</h1><p class="j-lead">You unlocked the <b>' + esc(bd[1]) + '</b> badge. ' + Object.keys(p.badges || {}).length + ' of 7 badges earned.</p><div class="badges">' + Object.keys(JT).filter(function (k) { return JT[k][3]; }).map(function (k) { return '<span class="' + ((p.badges || {})[k] ? 'on' : '') + '" title="' + esc(JT[k][3][1]) + '">' + JT[k][3][0] + '</span>'; }).join('') + '</div><button class="j-go" data-jn="1">Next chapter ›</button>'; }
    else if (kind === 'reveal') h = jReveal(p);
    return h;
  }
  function jReveal(p) {
    var st = STYLES[p.style || jStyle() || 'garden'], t = p.tot || {}, pal = (PALETTES.filter(function (x) { return x[0] === st[4]; })[0] || PALETTES[0])[1], r = ranked().filter(function (x) { return (p.skip || []).indexOf(x) < 0; });
    return '<div class="j-kick">Presenting…</div><div class="reveal-card big"><div class="rv-top" style="background:linear-gradient(120deg,' + pal[0] + ',' + pal[1] + ',' + pal[2] + ')"><div class="j-big pop">' + st[0] + '</div><h1>' + esc(couple()) + '</h1><div class="rv-style">' + esc(st[1]) + ' wedding</div></div>' +
      '<div class="rv-grid"><div><span>👥</span><b>' + (p.guests || '?') + '</b><small>guests</small></div><div><span>💰</span><b>' + (p.budget ? money(+p.budget) : '?') + '</b><small>budget</small></div><div><span>' + ((p.seasons || [])[0] === 'Winter' ? '❄️' : (p.seasons || [])[0] === 'Summer' ? '☀️' : (p.seasons || [])[0] === 'Spring' ? '🌸' : '🍁') + '</span><b>' + esc((p.seasons || []).join(' / ') || '?') + '</b><small>' + esc(p.year || 'season') + '</small></div><div><span>🥗</span><b>' + esc(p.service || '?') + '</b><small>' + (p.vegan != null ? p.vegan + '% vegan' : 'vegetarian') + '</small></div></div>' +
      '<div class="rv-tags">' + [t.formal ? (t.formal === 'a' ? 'Black-tie' : 'Relaxed') : '', t.inout ? (t.inout === 'a' ? 'Indoors' : 'Outdoors') : '', t.time ? (t.time === 'a' ? 'Daytime' : 'Evening') : '', t.dance ? (t.dance === 'a' ? 'Dance all night' : 'Long dinner') : ''].concat(p.vibes || []).filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<div class="podium">' + [1, 0, 2].map(function (i) { return r[i] ? '<div class="pd pd' + i + '"><span>' + ['🥇', '🥈', '🥉'][i] + '</span><b>' + esc(r[i]) + '</b></div>' : ''; }).join('') + '</div>' +
      '<div class="sw big">' + pal.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div>' +
      (p.vision ? '<p class="rv-quote">“' + esc(p.vision) + '”</p>' : '') + '<div class="badges">' + Object.keys(JT).filter(function (k) { return JT[k][3]; }).map(function (k) { return '<span class="' + ((p.badges || {})[k] ? 'on' : '') + '">' + JT[k][3][0] + '</span>'; }).join('') + '</div></div>' +
      '<div class="j-row"><button class="j-go" data-japply="1">' + (p.applied ? '✓ Applied — open our planner' : 'Build our planner from this ›') + '</button></div>';
  }
  function jOpenAt(i) { jIdx = Math.max(0, Math.min(J().length - 1, i)); jOpen = true; renderJ(); }
  function jClose() { jOpen = false; var o = document.getElementById('journey'); if (o) o.remove(); document.body.classList.remove('j-on'); render(); }
  function jNext(d) { var L = J(), old = L[jIdx]; jDir = d || 1; var ni = jIdx + jDir; if (old && old[1] === 'done' && jDir > 0) {} jIdx = Math.max(0, Math.min(L.length - 1, ni)); var ns = L[jIdx]; if (ns[1] === 'done' && jDir > 0) { var b = Object.assign({}, P().badges || {}); b[ns[0]] = Date.now(); setP('badges', b); setTimeout(confetti, 150); } if (ns[1] === 'reveal') setTimeout(confetti, 300); renderJ(); }
  function renderJ() {
    if (!jOpen) return;
    var L = J(), sc = L[jIdx], T = JT[sc[0]], o = document.getElementById('journey');
    if (!o) { o = document.createElement('div'); o.id = 'journey'; document.body.appendChild(o); document.body.classList.add('j-on'); }
    var topics = Object.keys(JT), ti = topics.indexOf(sc[0]);
    o.style.background = T[2];
    o.innerHTML = '<div class="j-top"><button class="j-x" data-jclose="1" aria-label="Close">✕</button><div class="j-prog"><i style="width:' + Math.round(jIdx / (L.length - 1) * 100) + '%"></i></div><span class="j-pct">' + Math.round(jIdx / (L.length - 1) * 100) + '%</span></div>' +
      '<div class="j-map">' + topics.map(function (k, i) { var first = L.findIndex(function (s) { return s[0] === k; }); return '<button class="j-stop' + (i < ti ? ' past' : i === ti ? ' here' : '') + ((P().badges || {})[k] ? ' won' : '') + '" data-jgo="' + first + '" title="' + esc(JT[k][1]) + '"><span>' + JT[k][0] + '</span><em>' + esc(JT[k][1]) + '</em></button>'; }).join('<i class="j-path"></i>') + '</div>' +
      '<div class="j-stage"><div class="j-scr ' + (jDir > 0 ? 'in-r' : 'in-l') + '">' + jScreen(sc) + '</div></div>' +
      '<div class="j-foot">' + (jIdx > 0 ? '<button class="j-ghost" data-jn="-1">‹ Back</button>' : '<span></span>') + '<span class="j-step">' + T[0] + ' ' + esc(T[1]) + '</span>' + (sc[1] !== 'reveal' ? '<button class="j-ghost" data-jn="1">Skip ›</button>' : '<button class="j-ghost" data-jclose="1">Close</button>') + '</div>';
    jBind(o);
    var g = o.querySelector('.j-scr'); if (g && g.scrollIntoView) o.scrollTop = 0;
  }
  function jBind(o) {
    function on(sel, ev, fn) { o.querySelectorAll(sel).forEach(function (b) { b.addEventListener(ev, function (e) { fn(b, e); }); }); }
    on('[data-jn]', 'click', function (b) { jNext(+b.getAttribute('data-jn')); });
    on('[data-jclose]', 'click', jClose);
    on('[data-jgo]', 'click', function (b) { var v = b.getAttribute('data-jgo'); if (v === 'quiz0') v = J().findIndex(function (s) { return s[1] === 'quiz'; }); jDir = +v >= jIdx ? 1 : -1; jIdx = +v; renderJ(); });
    on('[data-jtalk]', 'click', function (b) { var t = Object.assign({}, P().talked || {}); t[b.getAttribute('data-jtalk')] = 1; setP('talked', t); jNext(1); });
    on('[data-jnote]', 'change', function (b) { var n = Object.assign({}, P().notes || {}); n[b.getAttribute('data-jnote')] = b.value; setP('notes', n); if (b.getAttribute('data-jnote') === 'vision') setP('vision', b.value); });
    function pickTot(k, v) { var t = Object.assign({}, P().tot || {}); t[k] = v; setP('tot', t); var sw = o.querySelector('#swipe'); if (sw) { sw.classList.add(v === 'a' ? 'fly-l' : 'fly-r'); setTimeout(function () { jDir = 1; renderJ(); }, 320); } else renderJ(); }
    on('[data-jtot]', 'click', function (b) { pickTot(b.getAttribute('data-jtot'), b.getAttribute('data-v')); });
    on('[data-jreset]', 'click', function () { setP('tot', {}); renderJ(); });
    var sw = o.querySelector('#swipe');
    if (sw) { var x0 = null; sw.addEventListener('pointerdown', function (e) { x0 = e.clientX; sw.setPointerCapture(e.pointerId); sw.style.transition = 'none'; });
      sw.addEventListener('pointermove', function (e) { if (x0 === null) return; var dx = e.clientX - x0; sw.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 20 + 'deg)'; sw.classList.toggle('lean-l', dx < -40); sw.classList.toggle('lean-r', dx > 40); });
      sw.addEventListener('pointerup', function (e) { var dx = e.clientX - x0; x0 = null; sw.style.transition = ''; if (Math.abs(dx) > 80) pickTot(sw.getAttribute('data-k'), dx < 0 ? 'a' : 'b'); else { sw.style.transform = ''; sw.classList.remove('lean-l', 'lean-r'); } }); }
    on('[data-jquiz]', 'click', function (b) { var q = Object.assign({}, P().quiz || {}); q[b.getAttribute('data-jquiz')] = b.getAttribute('data-v'); setP('quiz', q); b.classList.add('on'); setTimeout(function () { jNext(1); }, 260); });
    on('[data-jstyle]', 'click', function () { var k = jStyle() || 'garden', st = STYLES[k], v = (P().vibes || []).slice(); st[3].forEach(function (x) { if (v.indexOf(x) < 0) v.push(x); }); setP('style', k); setP('vibes', v); var s = S(); if (!s.palette) save('wp-settings', Object.assign({}, s, { palette: st[4] })); jNext(1); });
    on('[data-jchip]', 'click', function (b) { var k = b.getAttribute('data-jchip'), v = b.getAttribute('data-v'), a = (P()[k] || []).slice(), i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); setP(k, a); b.classList.toggle('on'); });
    on('[data-jone]', 'click', function (b) { setP(b.getAttribute('data-jone'), b.getAttribute('data-v')); renderJ(); });
    on('[data-jcard]', 'click', function (b) { setP(b.getAttribute('data-jcard'), b.getAttribute('data-v')); o.querySelectorAll('[data-jcard]').forEach(function (x) { x.classList.toggle('on', x === b); }); setTimeout(function () { jNext(1); }, 320); });
    on('[data-jr]', 'input', function (b) { var k = b.getAttribute('data-jr'), v = +b.value, n = o.querySelector('.j-num'); if (n) n.textContent = k === 'budget' ? money(v) : k === 'travel' ? fmtV(v, 'mi') : k === 'vegan' ? v + '%' : v; var pl = o.querySelector('.plate div'); if (pl) pl.style.setProperty('--v', v); });
    on('[data-jr]', 'change', function (b) { setP(b.getAttribute('data-jr'), +b.value); renderJ(); });
    on('[data-jrk]', 'click', function (b) { var r = ranked(), i = +b.getAttribute('data-jrk'), j = i + +b.getAttribute('data-d'); if (j < 0 || j >= r.length) return; var x = r[i]; r[i] = r[j]; r[j] = x; setP('rank', r); renderJ(); });
    on('[data-jskip]', 'click', function (b) { var a = (P().skip || []).slice(), v = b.getAttribute('data-jskip'), i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); setP('skip', a); renderJ(); });
    on('[data-jrankok]', 'click', function () { setP('rank', ranked()); jNext(1); });
    on('[data-japply]', 'click', function () { applyProfile(); setP('applied', Date.now()); confetti(); jClose(); location.hash = 'overview'; });
  }
  document.addEventListener('keydown', function (e) { if (!jOpen) return; if (e.key === 'Escape') jClose(); if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) jNext(1); if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) jNext(-1); });
  var showFine = false;
  function pStart() {
    var p = P(), L = J(), badges = p.badges || {}, nb = Object.keys(badges).length, started = Object.keys(p).length > 0;
    var h = '<div class="j-hero">' + ART + '<div class="j-hero-in"><div class="j-big bounce">💞</div><h2>Our Wedding Journey</h2><p>One question at a time — this-or-that swipes, a style quiz, conversation starters and a big reveal at the end. Everything you choose builds the rest of the planner.</p>' +
      '<button class="j-go" id="j-start">' + (p.applied ? 'Replay our journey ✨' : started ? 'Continue our journey ›' : 'Begin our journey ✨') + '</button><div class="badges">' + Object.keys(JT).filter(function (k) { return JT[k][3]; }).map(function (k) { return '<span class="' + (badges[k] ? 'on' : '') + '" title="' + esc(JT[k][3][1]) + '">' + JT[k][3][0] + '</span>'; }).join('') + '</div><small>' + nb + ' of 7 badges earned</small></div></div>';
    h += '<div class="j-chapters">' + Object.keys(JT).filter(function (k) { return k !== 'hello'; }).map(function (k) { var first = L.findIndex(function (s) { return s[0] === k; }); var won = badges[k] || (k === 'reveal' && p.applied); return '<button class="j-chap' + (won ? ' won' : '') + '" data-jstart="' + first + '" style="background:' + JT[k][2] + '"><span>' + JT[k][0] + '</span><b>' + esc(JT[k][1]) + '</b><small>' + (won ? '✓ ' + (JT[k][3] ? JT[k][3][1] : 'Revealed') : 'Not started') + '</small></button>'; }).join('') + '</div>';
    if (p.applied || nb >= 4) h += '<div class="j-reveal-inline">' + jReveal(p).replace(/<div class="j-row">[\s\S]*$/, '') + '</div>';
    h += '<button class="btn alt" id="j-fine" style="width:100%;margin-top:6px">' + (showFine ? 'Hide' : 'Fine-tune answers (classic view)') + '</button>';
    if (showFine) {
      h += '<div class="stepper" style="margin-top:12px">' + TOPICS.map(function (t, i) { return '<button type="button" class="stp' + (t[0] === topicCur ? ' on' : '') + (topicDone(t[0], p) ? ' ok' : '') + '" data-topic="' + t[0] + '"><span>' + (topicDone(t[0], p) ? '✓' : t[1]) + '</span><em>' + (i + 1) + '. ' + esc(t[2]) + '</em></button>'; }).join('') + '</div>';
      var T0 = TOPICS.filter(function (t) { return t[0] === topicCur; })[0];
      h += '<div class="card topic"><h3>' + T0[1] + ' ' + esc(T0[2]) + '</h3>' + topicBody(topicCur, p) + '</div>';
    }
    return h;
  }
  function startBind(el) {
    var b = $('#j-start', el); if (b) b.onclick = function () { var p = P(); var L = J(); var i = 0; if (!p.applied) { i = L.findIndex(function (s) { return s[1] === 'done' ? !(p.badges || {})[s[0]] : false; }); if (i < 0) i = L.length - 1; else i = L.findIndex(function (s) { return s[0] === L[i][0]; }); if (!Object.keys(p).length) i = 0; } jOpenAt(i); };
    el.querySelectorAll('[data-jstart]').forEach(function (x) { x.onclick = function () { jOpenAt(+x.getAttribute('data-jstart')); }; });
    var f = $('#j-fine', el); if (f) f.onclick = function () { showFine = !showFine; render(); };
  }

  var PAGES = { menu: pMenu, overview: pOverview, start: pStart, timeline: pTimeline, budget: pBudget, vendors: pVendors, guests: pGuests, seating: pSeating, dayof: pDayof, ideas: pIdeas, decisions: pDecisions, settings: pSettings, more: pMore, compare: pCompare, lists: pLists, honeymoon: pHoneymoon, guides: pGuides };
  var TABOF = { compare: 'more', lists: 'more', honeymoon: 'more', guides: 'more', menu: 'more', start: 'more', vendors: 'more', seating: 'more', dayof: 'more', ideas: 'more', decisions: 'more', settings: 'more' };
  function cur() { var h = (location.hash || '#overview').slice(1); return PAGES[h] ? h : 'overview'; }
  var lastPage = '';
  function render() {
    var p = cur(), fresh = p !== lastPage; lastPage = p;
    document.querySelectorAll('.page').forEach(function (el) { el.classList.toggle('on', el.id === p); });
    var el = document.getElementById(p), lu = el.querySelector('[data-sxm-lu]');
    el.classList.toggle('fresh', fresh); el.innerHTML = PAGES[p]();
    if (lu) { var h2 = el.querySelector('h2,h1'); if (h2) h2.parentNode.insertBefore(lu, h2.nextSibling); }
    document.querySelectorAll('#sidebar a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === p); });
    document.querySelectorAll('#tabbar a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === (TABOF[p] || p)); });
    $('#brand-names').textContent = couple() === 'Our Wedding' ? 'Wedding Planner' : couple();
    bind(el); richBind(el); startBind(el); honeyBind(el);
  }
  function bind(el) {
    el.querySelectorAll('[data-tg]').forEach(function (b) { b.addEventListener('change', function () { C[b.getAttribute('data-tg')].toggle(b.getAttribute('data-id'), ({ payments: 'paid', menu: 'pick' })[b.getAttribute('data-tg')] || 'done'); }); });
    el.querySelectorAll('[data-op]').forEach(function (b) { b.addEventListener('click', function () { C[b.getAttribute('data-op')].open(b.getAttribute('data-id')); }); });
    el.querySelectorAll('[data-add]').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-add'); C[k].add(k === 'tasks' ? { g: '12', off: 365, owner: 'Couple', done: false } : k === 'decisions' ? { date: iso(today()), status: 'Decided' } : k === 'priorities' ? { rank: load('wp-priorities', []).length + 1 } : {}); }); });
    el.querySelectorAll('[data-gh]').forEach(function (b) { b.addEventListener('click', function () { editHousehold(b.getAttribute('data-gh')); }); });
    el.querySelectorAll('[data-tf]').forEach(function (b) { b.addEventListener('click', function () { tFilter = b.getAttribute('data-tf'); render(); }); });
    el.querySelectorAll('[data-seat]').forEach(function (s) { s.addEventListener('change', function () { var id = s.getAttribute('data-seat'); save('wp-guests', load('wp-guests', []).map(function (x) { return x.id === id ? Object.assign({}, x, { table: s.value }) : x; })); render(); }); });
    var o;
    if ((o = $('#add-h', el))) o.onclick = function () { editHousehold(null); };
    if ((o = $('#gq', el))) o.oninput = function () { gq = o.value; var pos = o.selectionStart; render(); var n = $('#gq'); n.focus(); n.setSelectionRange(pos, pos); };
    if ((o = $('#gr', el))) o.onchange = function () { gr = o.value; render(); };
    if ((o = $('#vf', el))) o.onchange = function () { vFilter = o.value; render(); };
    ['csv-guests', 'csv-guests2'].forEach(function (i) { var b = $('#' + i, el); if (b) b.onclick = exportGuests; });
    ['csv-budget', 'csv-budget2'].forEach(function (i) { var b = $('#' + i, el); if (b) b.onclick = exportBudget; });
    if ((o = $('#x-json', el))) o.onclick = function () { WPBackup.exportJSON(); };
    if ((o = $('#i-json', el))) { var f = $('#i-file', el); o.onclick = function () { f.value = ''; f.click(); }; f.onchange = function () { if (f.files[0]) WPBackup.importFile(f.files[0]); }; }
    if ((o = $('#edit-vision', el))) o.onclick = function () { edit('Season, guests & vision', VISION, S(), function (n) { save('wp-settings', n); }); };
    el.querySelectorAll('[data-sset]').forEach(function (b) { b.addEventListener('change', function () { var s = Object.assign({}, S()); s[b.getAttribute('data-sset')] = b.value.trim(); save('wp-settings', s); render(); }); });
    el.querySelectorAll('[data-pp]').forEach(function (b) { b.addEventListener('change', function () { var p = b.getAttribute('data-pp').split('.'); save('wp-people', load('wp-people', []).map(function (x) { if (x.id !== p[0]) return x; var y = Object.assign({}, x); y[p[1]] = p[1] === 'email' ? b.value.trim().toLowerCase() : b.value.trim(); return y; })); render(); }); });
    el.querySelectorAll('[data-ppdel]').forEach(function (b) { b.addEventListener('click', function () { if (!confirm('Remove this person from the list? (Their past edits stay.)')) return; save('wp-people', load('wp-people', []).filter(function (x) { return x.id !== b.getAttribute('data-ppdel'); })); render(); }); });
    el.querySelectorAll('[data-ppadd]').forEach(function (b) { b.addEventListener('click', function () { var a = load('wp-people', []); a.push({ id: 'p_' + uid(), name: '', email: '', role: '' }); save('wp-people', a); render(); }); });
    if ((o = $('#save-settings', el))) o.onclick = function () { var s = Object.assign({}, S()); SF.concat(VISION).forEach(function (f) { s[f.k] = readField(f); }); save('wp-settings', s); syncTeam(); render(); o.textContent = 'Saved ✓'; };
  }
  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });
  // desktop launcher heartbeat: lets the local server exit after the window closes, and reloads if a newer build took over
  if (/^http:\/\/localhost:47823/.test(location.href)) {
    var hb = function () { fetch('/__ping', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (v) { if (v && v.trim() !== VERSION && !sessionStorage.getItem('wp-ver-reload')) { sessionStorage.setItem('wp-ver-reload', '1'); location.reload(); } }).catch(function () {}); };
    hb(); setInterval(hb, 20000);
  }
  try { var _l = load('wp-lists', null); if (_l) { var _c = _l.filter(function (x) { return !/vegetarian snack|vegetarian restaurants/i.test(x.title); }).map(function (x) { return /veg-friendly breakfast/i.test(x.title) ? Object.assign({}, x, { title: 'Book stays (mention the honeymoon!)' }) : x; }); if (JSON.stringify(_c) !== JSON.stringify(_l)) save('wp-lists', _c); } } catch (e) {}   // v1.4.2: no vegan/veg travel bits in honeymoon
  try { if (localStorage.getItem('wp-contrib') !== null) localStorage.removeItem('wp-contrib'); } catch (e) {}   // v1.4.1: contributions feature removed
  seed(); seedLists(); syncTeam(); render();
  window.WPApp = { render: render, syncTeam: syncTeam, team: team, version: VERSION };
})();
