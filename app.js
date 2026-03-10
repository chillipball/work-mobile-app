/* ============================================================
   GM HARTSHORNE FLEET APP — Core Application
   ============================================================ */

const App = {
  // --- State Management ---
  state: {
    currentScreen: 'login',
    loginMode: 'driver',
    user: null,
    timerRunning: false,
    timerStart: null,
    timerElapsed: 0,
    timerInterval: null,
  },

  // --- Demo Data ---
  data: {
    drivers: [
      { id: 1, name: 'John Carter', pin: '1234', vehicle: 'DX73 HRT', role: 'driver' },
      { id: 2, name: 'Sarah Mitchell', pin: '5678', vehicle: 'FN21 GMH', role: 'driver' },
      { id: 3, name: 'Mike Thompson', pin: '9012', vehicle: null, role: 'driver' },
    ],
    admins: [
      { id: 100, name: 'Office Admin', email: 'traffic@gmhartshorne.co.uk', password: 'admin123', role: 'admin' },
    ],
    vehicles: [
      { reg: 'DX73 HRT', type: '44T Tractor Unit', status: 'active' },
      { reg: 'FN21 GMH', type: '26T Rigid Curtainsider', status: 'active' },
      { reg: 'BV22 KLM', type: '18T Rigid Curtainsider', status: 'active' },
      { reg: 'CE70 NRP', type: '7.5T Flatbed', status: 'maintenance' },
      { reg: 'HJ69 XYZ', type: '80T Crane-Mounted Unit', status: 'active' },
    ],
    timesheets: [
      { id: 1, driverId: 1, date: '2026-03-10', start: '06:00', end: '14:30', breaks: 45, mileage: 187, status: 'submitted' },
      { id: 2, driverId: 1, date: '2026-03-09', start: '05:30', end: '15:00', breaks: 60, mileage: 234, status: 'approved' },
      { id: 3, driverId: 2, date: '2026-03-10', start: '07:00', end: null, breaks: 30, mileage: 0, status: 'active' },
    ],
    defects: [
      { id: 1, driverId: 1, vehicle: 'DX73 HRT', date: '2026-03-09', category: 'Tyres', severity: 'medium', description: 'Nearside front tyre worn close to limit', status: 'reported' },
      { id: 2, driverId: 2, vehicle: 'FN21 GMH', date: '2026-03-08', category: 'Lights', severity: 'low', description: 'Offside marker light flickering', status: 'resolved' },
    ],
    pods: [
      { id: 1, driverId: 1, date: '2026-03-10', recipient: 'B&Q Distribution', location: 'Worksop', notes: 'Left at loading bay 3', status: 'confirmed' },
      { id: 2, driverId: 1, date: '2026-03-09', recipient: 'Travis Perkins', location: 'Mansfield', notes: 'Signed by warehouse manager', status: 'confirmed' },
    ],
    instructions: [
      { id: 1, driverId: 1, from: 'Office', date: '2026-03-10', time: '05:45', type: 'job', title: 'Collection - Celsa Steel', message: 'Collect 24T steel beams from Celsa Steel, Cardiff. Deliver to B&Q Distribution, Worksop. Use bay 3.', read: true },
      { id: 2, driverId: 1, from: 'Office', date: '2026-03-10', time: '12:30', type: 'message', title: 'Schedule Change', message: 'No afternoon run today. Return to depot after B&Q delivery.', read: false },
      { id: 3, driverId: 2, from: 'Office', date: '2026-03-10', time: '06:30', type: 'job', title: 'Delivery - Travis Perkins', message: 'Deliver building supplies to Travis Perkins, Mansfield. Customer expecting before 10am.', read: true },
    ],
  },

  // --- Init ---
  init() {
    this.loadState();
    this.render();
  },

  loadState() {
    const saved = localStorage.getItem('gmh_user');
    if (saved) {
      this.state.user = JSON.parse(saved);
      this.state.currentScreen = this.state.user.role === 'admin' ? 'admin-dashboard' : 'dashboard';
    }
    ['drivers','timesheets','defects','pods','instructions'].forEach(key => {
      const d = localStorage.getItem('gmh_' + key);
      if (d) this.data[key] = JSON.parse(d);
    });
  },

  saveData(key) {
    localStorage.setItem('gmh_' + key, JSON.stringify(this.data[key]));
  },

  // --- Navigation ---
  navigate(screen) {
    this.state.currentScreen = screen;
    this.render();
    window.scrollTo(0, 0);
  },

  // --- Auth ---
  login(user) {
    this.state.user = user;
    localStorage.setItem('gmh_user', JSON.stringify(user));
    this.navigate(user.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    this.toast('Welcome back, ' + user.name.split(' ')[0] + '!', 'success');
  },

  logout() {
    this.state.user = null;
    localStorage.removeItem('gmh_user');
    if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    this.state.timerRunning = false;
    this.navigate('login');
  },

  // --- Toast ---
  toast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || (() => {
      const c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
      return c;
    })();
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="material-icons-round toast-icon">${icons[type] || 'info'}</span><span class="toast-message">${message}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.classList.add('hiding'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  // --- Render ---
  render() {
    const app = document.getElementById('app');
    const s = this.state.currentScreen;
    if (s === 'login') { app.innerHTML = this.renderLogin(); this.bindLogin(); return; }
    if (s.startsWith('admin')) { app.innerHTML = this.renderAdminShell(); this.bindAdmin(); return; }
    app.innerHTML = this.renderDriverShell();
    this.bindDriver();
  },

  // --- Helpers ---
  getDriverData(key) {
    if (!this.state.user) return [];
    return this.data[key].filter(d => d.driverId === this.state.user.id);
  },

  getDriver(id) { return this.data.drivers.find(d => d.id === id); },

  formatTime(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${h}h ${m}m`;
  },

  todayStr() { return new Date().toISOString().split('T')[0]; },

  // ============================================================
  // LOGIN SCREEN
  // ============================================================
  renderLogin() {
    const isDriver = this.state.loginMode === 'driver';
    return `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-logo">
          <div class="logo-icon"><span class="material-icons-round">local_shipping</span></div>
          <h1>G. & M. Hartshorne</h1>
          <p>Fleet Management System</p>
        </div>
        <div class="login-tabs">
          <button class="login-tab ${isDriver ? 'active' : ''}" id="tab-driver">Driver</button>
          <button class="login-tab ${!isDriver ? 'active' : ''}" id="tab-admin">Office</button>
        </div>
        <form id="login-form">
          ${isDriver ? `
            <div class="form-group">
              <label>Select Driver</label>
              <select class="form-select" id="login-driver" required>
                <option value="">Choose your name...</option>
                ${this.data.drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>PIN</label>
              <input type="password" class="form-input" id="login-pin" placeholder="Enter your 4-digit PIN" maxlength="4" inputmode="numeric" required />
            </div>
          ` : `
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-input" id="login-email" placeholder="Enter your email" required />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" class="form-input" id="login-password" placeholder="Enter your password" required />
            </div>
          `}
          <div id="login-error" class="form-error hidden"></div>
          <button type="submit" class="btn btn-primary mt-md">
            <span class="material-icons-round">login</span> Sign In
          </button>
        </form>
      </div>
    </div>`;
  },

  bindLogin() {
    document.getElementById('tab-driver')?.addEventListener('click', () => { this.state.loginMode = 'driver'; this.render(); });
    document.getElementById('tab-admin')?.addEventListener('click', () => { this.state.loginMode = 'admin'; this.render(); });
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const err = document.getElementById('login-error');
      if (this.state.loginMode === 'driver') {
        const id = parseInt(document.getElementById('login-driver').value);
        const pin = document.getElementById('login-pin').value;
        const driver = this.data.drivers.find(d => d.id === id && d.pin === pin);
        if (driver) this.login(driver);
        else { err.textContent = 'Invalid driver or PIN.'; err.classList.remove('hidden'); }
      } else {
        const email = document.getElementById('login-email').value;
        const pw = document.getElementById('login-password').value;
        const admin = this.data.admins.find(a => a.email === email && a.password === pw);
        if (admin) this.login(admin);
        else { err.textContent = 'Invalid email or password.'; err.classList.remove('hidden'); }
      }
    });
  },

  // ============================================================
  // DRIVER SHELL
  // ============================================================
  renderDriverShell() {
    const u = this.state.user;
    const s = this.state.currentScreen;
    const screens = { dashboard: this.renderDashboard(), profile: this.renderProfile(), timesheets: this.renderTimesheets(), defects: this.renderDefects(), pods: this.renderPods(), instructions: this.renderInstructions(), 'vehicle-link': this.renderVehicleLink() };
    const titles = { dashboard: 'Dashboard', profile: 'Profile', timesheets: 'Timesheets', defects: 'Defect Reports', pods: 'PODs', instructions: 'Instructions', 'vehicle-link': 'Vehicle' };
    const unread = this.getDriverData('instructions').filter(i => !i.read).length;
    return `
    <header class="app-header">
      <div class="header-left">
        <span class="material-icons-round" style="color:var(--accent);font-size:28px">local_shipping</span>
        <span class="header-brand">GM<span>H</span></span>
      </div>
      <div class="header-center"><span class="header-title">${titles[s] || ''}</span></div>
      <div class="header-right">
        <div class="header-avatar" id="btn-profile">${u.name.charAt(0)}</div>
      </div>
    </header>
    <main class="main-content"><div class="screen">${screens[s] || ''}</div></main>
    <nav class="bottom-nav">
      <button class="nav-item ${s === 'dashboard' ? 'active' : ''}" data-screen="dashboard"><span class="material-icons-round">dashboard</span>Home</button>
      <button class="nav-item ${s === 'timesheets' ? 'active' : ''}" data-screen="timesheets"><span class="material-icons-round">schedule</span>Time</button>
      <button class="nav-item ${s === 'defects' ? 'active' : ''}" data-screen="defects"><span class="material-icons-round">report_problem</span>Defects</button>
      <button class="nav-item ${s === 'pods' ? 'active' : ''}" data-screen="pods"><span class="material-icons-round">inventory</span>PODs</button>
      <button class="nav-item ${s === 'instructions' ? 'active' : ''}" data-screen="instructions">
        <span class="material-icons-round">mail</span>${unread > 0 ? `<span class="nav-badge">${unread}</span>` : ''}Instructions
      </button>
    </nav>`;
  },

  bindDriver() {
    document.querySelectorAll('.nav-item[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.screen));
    });
    document.getElementById('btn-profile')?.addEventListener('click', () => this.navigate('profile'));
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => this.handleAction(btn.dataset.action, btn.dataset));
    });
    this.bindScreenActions();
  },

  // ============================================================
  // DRIVER DASHBOARD
  // ============================================================
  renderDashboard() {
    const u = this.state.user;
    const vehicle = this.data.vehicles.find(v => v.reg === u.vehicle);
    const todayTS = this.getDriverData('timesheets').filter(t => t.date === this.todayStr());
    const unread = this.getDriverData('instructions').filter(i => !i.read).length;
    const totalDefects = this.getDriverData('defects').filter(d => d.status === 'reported').length;
    return `
      <h1 class="screen-title">Hello, ${u.name.split(' ')[0]} 👋</h1>
      <p class="screen-subtitle">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      ${(vehicle || u.vehicle) ? `
        <div class="vehicle-card" style="cursor:pointer" data-action="nav" data-target="vehicle-link">
          <div class="reg-plate">${vehicle ? vehicle.reg : u.vehicle}</div>
          <div class="vehicle-info">${vehicle ? vehicle.type : 'Unknown Type'} · <span class="status-dot active"></span> Active</div>
          ${u.trailer ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);font-size:var(--text-sm);color:var(--text-secondary)"><span class="material-icons-round" style="font-size:16px;vertical-align:middle;margin-right:4px">rv_hookup</span>Trailer: <strong style="color:var(--text-main)">${u.trailer}</strong></div>` : ''}
        </div>
      ` : `
        <div class="card" style="cursor:pointer;border-left:3px solid var(--warning)" data-action="nav" data-target="vehicle-link">
          <div class="flex gap-md" style="align-items:center">
            <span class="material-icons-round text-warning">warning</span>
            <div><strong>No Vehicle Linked</strong><p class="text-muted" style="font-size:var(--text-sm)">Tap to link your vehicle & trailer</p></div>
          </div>
        </div>
      `}
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value text-accent">${todayTS.length}</div><div class="stat-label">Today's Shifts</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--info)">${unread}</div><div class="stat-label">New Messages</div></div>
        <div class="stat-card"><div class="stat-value text-success">${this.getDriverData('pods').length}</div><div class="stat-label">Total PODs</div></div>
        <div class="stat-card"><div class="stat-value text-warning">${totalDefects}</div><div class="stat-label">Open Defects</div></div>
      </div>
      <div class="section-header"><span class="section-title">Quick Actions</span></div>
      <div class="quick-actions">
        <div class="quick-action" data-action="nav" data-target="timesheets"><span class="material-icons-round text-accent">play_circle</span><span>Start Shift</span></div>
        <div class="quick-action" data-action="nav" data-target="defects"><span class="material-icons-round text-warning">report_problem</span><span>Report Defect</span></div>
        <div class="quick-action" data-action="nav" data-target="pods"><span class="material-icons-round text-success">add_task</span><span>Log POD</span></div>
        <div class="quick-action" data-action="nav" data-target="instructions"><span class="material-icons-round" style="color:var(--info)">mail</span><span>Messages</span></div>
      </div>`;
  },

  // ============================================================
  // PROFILE
  // ============================================================
  renderProfile() {
    const u = this.state.user;
    const ts = this.getDriverData('timesheets');
    const totalHrs = ts.reduce((sum, t) => { if (t.start && t.end) { const [sh,sm]=t.start.split(':').map(Number),[eh,em]=t.end.split(':').map(Number); sum+=(eh*60+em)-(sh*60+sm)-t.breaks; } return sum; }, 0);
    return `
      <div class="profile-header">
        <div class="profile-avatar">${u.name.split(' ').map(n=>n[0]).join('')}</div>
        <div class="profile-name">${u.name}</div>
        <div class="profile-role">Driver · G. & M. Hartshorne Ltd</div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Details</span></div>
        <div class="list-item" style="padding:var(--space-sm) 0"><div class="list-item-content"><div class="list-item-subtitle">Linked Tractor</div><div class="list-item-title">${u.vehicle || 'Not linked'}</div></div></div>
        <div class="list-item" style="padding:var(--space-sm) 0"><div class="list-item-content"><div class="list-item-subtitle">Linked Trailer</div><div class="list-item-title">${u.trailer || 'Not linked'}</div></div></div>
        <div class="list-item" style="padding:var(--space-sm) 0"><div class="list-item-content"><div class="list-item-subtitle">Total Shifts</div><div class="list-item-title">${ts.length}</div></div></div>
        <div class="list-item" style="padding:var(--space-sm) 0"><div class="list-item-content"><div class="list-item-subtitle">Total Hours</div><div class="list-item-title">${this.formatTime(totalHrs)}</div></div></div>
        <div class="list-item" style="padding:var(--space-sm) 0"><div class="list-item-content"><div class="list-item-subtitle">Defect Reports</div><div class="list-item-title">${this.getDriverData('defects').length}</div></div></div>
        <div class="list-item" style="padding:var(--space-sm) 0"><div class="list-item-content"><div class="list-item-subtitle">PODs Logged</div><div class="list-item-title">${this.getDriverData('pods').length}</div></div></div>
      </div>
      <div class="section-header mt-lg"><span class="section-title">Recent Activity</span></div>
      <div class="list-card">
        ${this.getDriverData('timesheets').slice(0,3).map(t => `
          <div class="list-item">
            <div class="list-item-icon" style="background:var(--info-bg);color:var(--info)"><span class="material-icons-round">schedule</span></div>
            <div class="list-item-content"><div class="list-item-title">Shift — ${t.date}</div><div class="list-item-subtitle">${t.start}–${t.end || 'ongoing'} · ${t.mileage}mi</div></div>
            <div class="list-item-meta"><span class="badge badge-${t.status==='approved'?'success':t.status==='active'?'warning':'info'}">${t.status}</span></div>
          </div>`).join('')}
      </div>
      <button class="btn btn-danger btn-full mt-xl" id="btn-logout"><span class="material-icons-round">logout</span>Sign Out</button>`;
  },

  // ============================================================
  // VEHICLE LINK
  // ============================================================
  renderVehicleLink() {
    const u = this.state.user;
    return `
      <h1 class="screen-title">Vehicle & Trailer</h1>
      <p class="screen-subtitle">Select your tractor unit and trailer for today</p>
      
      <div class="card mb-lg">
        <label style="display:block;margin-bottom:8px;font-size:var(--text-sm);font-weight:500;color:var(--text-secondary)">Linked Trailer ID</label>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-input" id="link-trailer-input" placeholder="e.g. TR-240" value="${u.trailer || ''}" style="margin-bottom:0;" />
          <button class="btn btn-primary" id="btn-save-trailer" style="white-space:nowrap">Save Trailer</button>
        </div>
      </div>
      
      <div class="section-header"><span class="section-title">Select Tractor Unit</span></div>
      ${u.vehicle ? `<div class="vehicle-card mb-md"><div class="reg-plate">${u.vehicle}</div><div class="vehicle-info">${this.data.vehicles.find(v=>v.reg===u.vehicle)?.type || ''}</div></div>` : ''}
      <div class="list-card">
        ${this.data.vehicles.filter(v=>v.status==='active').map(v => `
          <div class="list-item" data-action="link-vehicle" data-reg="${v.reg}">
            <div class="list-item-icon" style="background:${u.vehicle===v.reg?'var(--success-bg)':'var(--info-bg)'};color:${u.vehicle===v.reg?'var(--success)':'var(--info)'}">
              <span class="material-icons-round">${u.vehicle===v.reg?'check_circle':'local_shipping'}</span>
            </div>
            <div class="list-item-content"><div class="list-item-title">${v.reg}</div><div class="list-item-subtitle">${v.type}</div></div>
            ${u.vehicle===v.reg?'<span class="badge badge-success">Current</span>':'<span class="material-icons-round text-muted">chevron_right</span>'}
          </div>`).join('')}
      </div>`;
  },

  // ============================================================
  // TIMESHEETS
  // ============================================================
  renderTimesheets() {
    const ts = this.getDriverData('timesheets');
    const active = ts.find(t => t.status === 'active');
    const elapsed = this.state.timerRunning ? this.state.timerElapsed : (active ? this.state.timerElapsed : 0);
    const h = String(Math.floor(elapsed/3600)).padStart(2,'0'), m = String(Math.floor((elapsed%3600)/60)).padStart(2,'0'), sec = String(elapsed%60).padStart(2,'0');
    return `
      <h1 class="screen-title">Timesheets</h1>
      <p class="screen-subtitle">Track your shifts and hours</p>
      <div class="card">
        <div class="timer-display">
          <div class="timer-value" id="timer-display">${h}:${m}:${sec}</div>
          <div class="timer-label">${this.state.timerRunning ? 'Shift in progress' : active ? 'Shift paused' : 'Ready to start'}</div>
        </div>
        <div class="timer-controls">
          ${!this.state.timerRunning && !active ? `<button class="btn btn-success" id="btn-start-shift"><span class="material-icons-round">play_arrow</span>Start Shift</button>` : ''}
          ${this.state.timerRunning ? `<button class="btn btn-accent" id="btn-break"><span class="material-icons-round">pause</span>Break</button><button class="btn btn-danger" id="btn-end-shift"><span class="material-icons-round">stop</span>End Shift</button>` : ''}
          ${!this.state.timerRunning && active ? `<button class="btn btn-success" id="btn-resume"><span class="material-icons-round">play_arrow</span>Resume</button><button class="btn btn-danger" id="btn-end-shift"><span class="material-icons-round">stop</span>End Shift</button>` : ''}
        </div>
      </div>
      <div class="form-group mt-lg"><label>Mileage</label><input type="number" class="form-input" id="ts-mileage" placeholder="Enter today's mileage" /></div>
      <div class="section-header mt-lg"><span class="section-title">History</span></div>
      <div class="list-card">
        ${ts.length === 0 ? '<div class="empty-state"><span class="material-icons-round">schedule</span><h3>No timesheets yet</h3><p>Start your first shift above</p></div>' : ''}
        ${ts.map(t => `
          <div class="list-item">
            <div class="list-item-icon" style="background:var(--info-bg);color:var(--info)"><span class="material-icons-round">schedule</span></div>
            <div class="list-item-content"><div class="list-item-title">${t.date}</div><div class="list-item-subtitle">${t.start}–${t.end||'ongoing'} · Breaks: ${t.breaks}min · ${t.mileage}mi</div></div>
            <span class="badge badge-${t.status==='approved'?'success':t.status==='active'?'warning':'info'}">${t.status}</span>
          </div>`).join('')}
      </div>`;
  },

  // ============================================================
  // DEFECT REPORTS
  // ============================================================
  renderDefects() {
    const checks = this.getDriverData('defects');
    const todayCheck = checks.find(c => c.date === this.todayStr() && c.type === 'walkaround');
    const items = [
      { id: 1, label: 'Fuel/Oil/Water Leaks' },
      { id: 2, label: 'Tyres & Wheel Nuts' },
      { id: 3, label: 'Mirrors/Indicators/Horn' },
      { id: 4, label: 'Wipers/Washers/Windscreen' },
      { id: 5, label: 'Saloon Lighting' },
      { id: 6, label: 'Saloon Floor Covering' },
      { id: 7, label: 'Steering/Brakes' },
      { id: 8, label: 'Heating & Ventilation' },
      { id: 9, label: 'Doors & Exits' },
      { id: 10, label: 'Brakes & Hoses' },
      { id: 11, label: 'Body Interior & Exterior' },
      { id: 12, label: 'Lights/Reflectors/Battery' },
      { id: 13, label: 'First Aid Kit' },
      { id: 14, label: 'Passenger Seat Belts' },
      { id: 15, label: 'Glass' },
      { id: 16, label: 'Fire Extinguisher' },
      { id: 17, label: 'Emergency Exit Hammer' },
      { id: 18, label: 'Excessive Engine Exhaust Smoke' },
      { id: 19, label: 'Tachograph Unit' },
      { id: 20, label: 'Speed Limiter' },
      { id: 21, label: 'Speedometer' },
    ];
    if (todayCheck && !this.state.showNewWalkaround) {
      const defectItems = todayCheck.items.filter(i => i.status === 'fail');
      return `
        <h1 class="screen-title">Daily Walkaround</h1>
        <p class="screen-subtitle">Latest check completed at ${todayCheck.time}</p>
        <button class="btn btn-accent btn-full mb-lg" id="btn-show-new-walkaround"><span class="material-icons-round">add_circle</span>New Walkaround Check</button>
        <div class="card" style="border-left:3px solid ${todayCheck.nilDefect?'var(--success)':'var(--warning)'}">
          <div class="flex-between">
            <div>
              <div class="card-title">${todayCheck.nilDefect ? '✅ Nil Defect' : `⚠️ ${defectItems.length} Defect${defectItems.length!==1?'s':''} Reported`}</div>
              <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:4px">Unit: ${todayCheck.vehicle || 'N/A'} ${todayCheck.trailer ? ' · Trailer: '+todayCheck.trailer : ''} · Odo: ${todayCheck.odometer || '—'}</div>
            </div>
            <span class="badge badge-${todayCheck.nilDefect?'success':'warning'}">${todayCheck.nilDefect?'passed':'defects'}</span>
          </div>
          ${defectItems.length > 0 ? `<div class="divider"></div>${defectItems.map(di => `
            <div style="padding:var(--space-sm) 0"><strong>${di.label}</strong><p style="color:var(--text-secondary);font-size:var(--text-sm)">${di.notes||'No details'}</p></div>
          `).join('')}` : ''}
          ${todayCheck.additionalNotes ? `<div class="divider"></div><p style="font-size:var(--text-sm);color:var(--text-secondary)"><strong>Notes:</strong> ${todayCheck.additionalNotes}</p>` : ''}
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-md)">Signed: ${todayCheck.signature} · Reported to: ${todayCheck.reportedTo||'N/A'}</div>
        </div>
        ${this.renderCheckHistory(checks)}`;
    }
    return `
      <h1 class="screen-title">Daily Walkaround</h1>
      <p class="screen-subtitle">15-minute pre-departure vehicle inspection</p>
      <div class="card mb-lg" style="border-left:3px solid var(--accent)">
        <div class="flex gap-md" style="align-items:center">
          <span class="material-icons-round text-accent">info</span>
          <p style="font-size:var(--text-sm);color:var(--text-secondary)">Complete all 22 checks before setting off. Tick items that <strong>have a defect</strong>. Leave unchecked if OK.</p>
        </div>
      </div>
      <div class="card mb-lg">
        <div class="form-row">
          <div class="form-group"><label>Tractor Unit</label><input type="text" class="form-input" id="wa-vehicle" value="${this.state.user?.vehicle||''}" readonly /></div>
          <div class="form-group"><label>Trailer ID</label><input type="text" class="form-input" id="wa-trailer" value="${this.state.user?.trailer||''}" readonly /></div>
        </div>
        <div class="form-group"><label>Odometer Reading</label><input type="number" class="form-input" id="wa-odometer" placeholder="e.g. 245891" inputmode="numeric" /></div>
      </div>
      <div class="section-header"><span class="section-title">Daily Check</span><span class="section-title" style="font-size:var(--text-xs)">✓ Tick if applicable</span></div>
      <div class="list-card mb-lg">
        ${items.map(item => `
          <div class="list-item walkaround-item" id="wa-row-${item.id}" style="flex-wrap:wrap">
            <span style="font-size:var(--text-sm);font-weight:600;color:var(--text-muted);width:28px;flex-shrink:0">${item.id}.</span>
            <div class="list-item-content" style="flex:1;min-width:150px"><div class="list-item-title" style="font-size:var(--text-sm)">${item.label}</div></div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0">
              <input type="checkbox" class="wa-check" data-id="${item.id}" style="width:22px;height:22px;accent-color:var(--danger);cursor:pointer" />
              <span style="font-size:var(--text-xs);color:var(--text-muted)">Defect</span>
            </label>
            <div class="wa-notes-wrap hidden" data-notes-for="${item.id}" style="width:100%;margin-top:var(--space-sm);padding-left:36px">
              <input type="text" class="form-input wa-notes" data-notes-id="${item.id}" placeholder="Describe the defect..." style="font-size:var(--text-sm)" />
            </div>
          </div>
        `).join('')}
        <div class="list-item" style="background:var(--success-bg)">
          <span style="font-size:var(--text-sm);font-weight:600;color:var(--text-muted);width:28px">22.</span>
          <div class="list-item-content"><div class="list-item-title" style="font-size:var(--text-sm);color:var(--success)">NIL DEFECT</div></div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="wa-nil-defect" style="width:22px;height:22px;accent-color:var(--success);cursor:pointer" />
            <span style="font-size:var(--text-xs);color:var(--success)">All OK</span>
          </label>
        </div>
      </div>
      <div class="card mb-lg">
        <div class="card-header"><span class="card-title">Additional Information</span></div>
        <div class="form-group"><label>Record any defects or irregular circumstances</label><textarea class="form-input" id="wa-additional" placeholder="Write 'None' if no defects..."></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Reported To</label><input type="text" class="form-input" id="wa-reported-to" placeholder="e.g. Office / Workshop" /></div>
          <div class="form-group"><label>Driver's Signature</label><input type="text" class="form-input" id="wa-signature" placeholder="Type your full name" /></div>
        </div>
      </div>
      <button class="btn btn-primary btn-full mb-lg" id="btn-submit-walkaround"><span class="material-icons-round">check_circle</span>Submit Walkaround Check</button>
      ${this.renderCheckHistory(checks)}`;
  },

  renderCheckHistory(checks) {
    const past = checks.filter(c => c.type === 'walkaround').sort((a,b) => b.id - a.id);
    if (past.length === 0) return '';
    return `
      <div class="section-header mt-lg"><span class="section-title">History</span></div>
      <div class="list-card">
        ${past.map(c => {
          const defCount = c.items ? c.items.filter(i => i.status === 'fail').length : 0;
          return `<div class="list-item">
            <div class="list-item-icon" style="background:${c.nilDefect?'var(--success-bg)':'var(--warning-bg)'};color:${c.nilDefect?'var(--success)':'var(--warning)'}">
              <span class="material-icons-round">${c.nilDefect?'check_circle':'report_problem'}</span>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${c.date} — Unit: ${c.vehicle||'N/A'} ${c.trailer ? '· Trl: '+c.trailer:''}</div>
              <div class="list-item-subtitle">${c.nilDefect ? 'Nil defect' : defCount + ' defect' + (defCount!==1?'s':'')} · Odo: ${c.odometer||'—'} · ${c.time}</div>
            </div>
            <span class="badge badge-${c.nilDefect?'success':'warning'}">${c.nilDefect?'pass':'defects'}</span>
          </div>`;
        }).join('')}
      </div>`;
  },

  // ============================================================
  // PODs
  // ============================================================
  renderPods() {
    const pods = this.getDriverData('pods');
    return `
      <h1 class="screen-title">Proof of Delivery</h1>
      <p class="screen-subtitle">Log delivery confirmations</p>
      <button class="btn btn-accent btn-full mb-lg" id="btn-new-pod"><span class="material-icons-round">add_circle</span>Log New POD</button>
      <div id="pod-form" class="card hidden mb-lg">
        <div class="card-header"><span class="card-title">New POD</span></div>
        <div class="form-group"><label>Recipient / Company</label><input type="text" class="form-input" id="pod-recipient" placeholder="e.g. Travis Perkins" required /></div>
        <div class="form-group"><label>Location</label><input type="text" class="form-input" id="pod-location" placeholder="e.g. Mansfield" required /></div>
        <div class="form-group"><label>Notes</label><textarea class="form-input" id="pod-notes" placeholder="Signed by, left at bay #, etc."></textarea></div>
        <div class="form-group mb-lg">
          <label>Capture Signed Document (optional)</label>
          <div style="display:flex; gap:8px; align-items:flex-end;">
            <label class="btn btn-outline" style="cursor:pointer; flex: 1; text-align:center;">
              <span class="material-icons-round">camera_alt</span> Take Photo
              <input type="file" id="pod-photo" accept="image/*" capture="environment" style="display:none;" />
            </label>
          </div>
          <img id="pod-photo-preview" class="hidden mt-md" style="width:100%; border-radius:8px; border:1px solid rgba(255,255,255,0.1);" />
        </div>
        <button class="btn btn-primary mt-md btn-full" id="btn-submit-pod"><span class="material-icons-round">send</span>Submit POD</button>
      </div>
      <div class="list-card">
        ${pods.length === 0 ? '<div class="empty-state"><span class="material-icons-round">inventory</span><h3>No PODs logged</h3><p>Log your first delivery above</p></div>' : ''}
        ${pods.map(p => `
          <div class="list-item">
            <div class="list-item-icon" style="background:var(--success-bg);color:var(--success)"><span class="material-icons-round">inventory</span></div>
            <div class="list-item-content"><div class="list-item-title">${p.recipient}</div><div class="list-item-subtitle">${p.date} · ${p.location} · ${p.notes}</div>
            ${p.photo ? `<div style="margin-top:8px;font-size:var(--text-xs);color:var(--info);display:flex;align-items:center;gap:4px;"><span class="material-icons-round" style="font-size:14px">image</span>Photo Attached</div>` : ''}</div>
            <span class="badge badge-success">${p.status}</span>
          </div>`).join('')}
      </div>`;
  },

  // ============================================================
  // INSTRUCTIONS
  // ============================================================
  renderInstructions() {
    const instr = this.getDriverData('instructions').sort((a,b) => b.id - a.id);
    return `
      <h1 class="screen-title">Instructions</h1>
      <p class="screen-subtitle">Jobs & messages from the office</p>
      <div class="list-card">
        ${instr.length === 0 ? '<div class="empty-state"><span class="material-icons-round">mail</span><h3>No instructions</h3><p>You\'re all caught up!</p></div>' : ''}
        ${instr.map(i => `
          <div class="list-item" data-action="read-instruction" data-id="${i.id}" style="${!i.read?'border-left:3px solid var(--accent)':''}">
            <div class="list-item-icon" style="background:${i.type==='job'?'var(--accent)':'var(--info)'};color:white;background:${i.type==='job'?'rgba(245,124,0,0.15)':'var(--info-bg)'};color:${i.type==='job'?'var(--accent)':'var(--info)'}">
              <span class="material-icons-round">${i.type==='job'?'work':'chat'}</span>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${!i.read?'<strong>':''}${i.title}${!i.read?'</strong>':''}</div>
              <div class="list-item-subtitle">${i.message.substring(0,60)}...</div>
            </div>
            <div class="list-item-meta"><span class="time">${i.time}</span></div>
          </div>`).join('')}
      </div>`;
  },

  // ============================================================
  // ACTION HANDLERS
  // ============================================================
  handleAction(action, dataset) {
    if (action === 'nav') this.navigate(dataset.target);
    if (action === 'link-vehicle') {
      this.state.user.vehicle = dataset.reg;
      localStorage.setItem('gmh_user', JSON.stringify(this.state.user));
      const di = this.data.drivers.findIndex(d => d.id === this.state.user.id);
      if (di > -1) this.data.drivers[di].vehicle = dataset.reg;
      this.toast('Vehicle ' + dataset.reg + ' linked!', 'success');
      this.render();
    }
    if (action === 'read-instruction') {
      const i = this.data.instructions.find(x => x.id === parseInt(dataset.id));
      if (i) { i.read = true; this.saveData('instructions'); this.showInstructionModal(i); }
    }
  },

  showInstructionModal(instr) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${instr.title}</span>
          <button class="modal-close" id="close-modal"><span class="material-icons-round">close</span></button>
        </div>
        <div class="badge badge-${instr.type==='job'?'accent':'info'} mb-md">${instr.type}</div>
        <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-md)">From: ${instr.from} · ${instr.date} at ${instr.time}</p>
        <p style="line-height:1.7">${instr.message}</p>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-modal').addEventListener('click', () => { overlay.remove(); this.render(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); this.render(); } });
  },

  bindScreenActions() {
    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => this.logout());
    
    // Trailer Linking
    document.getElementById('btn-save-trailer')?.addEventListener('click', () => {
      const tr = document.getElementById('link-trailer-input').value.trim();
      this.state.user.trailer = tr;
      this.saveLocalUserAndDriver();
      this.toast(tr ? 'Trailer ' + tr + ' linked!' : 'Trailer unlinked', 'success');
      this.render();
    });

    // Walkaround Defect Logic
    document.getElementById('btn-show-new-walkaround')?.addEventListener('click', () => {
      this.state.showNewWalkaround = true;
      this.render();
    });

    document.querySelectorAll('.wa-check').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const notesWrap = document.querySelector(`[data-notes-for="${id}"]`);
        if (e.target.checked) {
          notesWrap.classList.remove('hidden');
          document.getElementById('wa-nil-defect').checked = false;
        } else {
          notesWrap.classList.add('hidden');
          notesWrap.querySelector('input').value = '';
        }
      });
    });
    document.getElementById('wa-nil-defect')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.querySelectorAll('.wa-check').forEach(cb => { cb.checked = false; });
        document.querySelectorAll('.wa-notes-wrap').forEach(w => { w.classList.add('hidden'); w.querySelector('input').value = ''; });
      }
    });
    document.getElementById('btn-submit-walkaround')?.addEventListener('click', () => {
      const isNil = document.getElementById('wa-nil-defect').checked;
      const vehicle = document.getElementById('wa-vehicle').value;
      const trailer = document.getElementById('wa-trailer').value;
      const odometer = document.getElementById('wa-odometer').value;
      const additional = document.getElementById('wa-additional').value;
      const reportedTo = document.getElementById('wa-reported-to').value;
      const signature = document.getElementById('wa-signature').value;

      if (!vehicle || !signature) { this.toast('Tractor Unit and Signature are required', 'error'); return; }

      const failedItems = [];
      let missingNotes = false;
      document.querySelectorAll('.wa-check:checked').forEach(cb => {
        const id = parseInt(cb.dataset.id);
        const label = document.querySelector(`#wa-row-${id} .list-item-title`).textContent;
        const notes = document.querySelector(`input[data-notes-id="${id}"]`).value.trim();
        if (!notes) missingNotes = true;
        failedItems.push({ id, label, status: 'fail', notes });
      });

      if (!isNil && failedItems.length === 0) { this.toast('Select defects or tick NIL DEFECT', 'error'); return; }
      if (missingNotes) { this.toast('Please describe all selected defects', 'error'); return; }

      const check = {
        id: Date.now(), driverId: this.state.user.id, type: 'walkaround', vehicle, trailer,
        date: this.todayStr(), time: new Date().toTimeString().slice(0,5),
        odometer, nilDefect: isNil, items: failedItems,
        additionalNotes: additional, reportedTo, signature,
        status: isNil ? 'resolved' : 'reported' // For admin panel compatibility
      };

      // Auto update linked vehicles
      this.state.user.vehicle = vehicle;
      this.state.user.trailer = trailer;
      this.saveLocalUserAndDriver();

      this.data.defects.unshift(check);
      this.saveData('defects');
      this.state.showNewWalkaround = false;
      this.toast('Walkaround check submitted!', 'success');
      this.render();
    });
    
    // POD form
    let currentPodPhoto = null;
    document.getElementById('pod-photo')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.compressImage(file, (dataUrl) => {
          currentPodPhoto = dataUrl;
          const preview = document.getElementById('pod-photo-preview');
          preview.src = dataUrl;
          preview.classList.remove('hidden');
        });
      }
    });

    document.getElementById('btn-new-pod')?.addEventListener('click', () => document.getElementById('pod-form').classList.toggle('hidden'));
    document.getElementById('btn-submit-pod')?.addEventListener('click', () => {
      const rec = document.getElementById('pod-recipient').value;
      const loc = document.getElementById('pod-location').value;
      const notes = document.getElementById('pod-notes').value;
      if (!rec || !loc) { this.toast('Recipient and Location are required', 'error'); return; }
      
      const p = { 
        id: Date.now(), driverId: this.state.user.id, date: this.todayStr(), 
        recipient: rec, location: loc, notes: notes, 
        photo: currentPodPhoto, status: 'confirmed' 
      };
      this.data.pods.unshift(p); 
      this.saveData('pods'); 
      currentPodPhoto = null; // Reset
      document.getElementById('pod-photo-preview').classList.add('hidden');
      document.getElementById('pod-recipient').value = '';
      document.getElementById('pod-location').value = '';
      document.getElementById('pod-notes').value = '';
      document.getElementById('pod-form').classList.add('hidden');
      this.toast('POD logged successfully!', 'success'); 
      this.render();
    });
    // Timesheet controls
    document.getElementById('btn-start-shift')?.addEventListener('click', () => this.startShift());
    document.getElementById('btn-end-shift')?.addEventListener('click', () => this.endShift());
    document.getElementById('btn-break')?.addEventListener('click', () => this.pauseShift());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeShift());
  },

  // --- Timer Logic ---
  startShift() {
    const todayCheck = this.getDriverData('defects').find(c => c.date === this.todayStr() && c.type === 'walkaround');
    if (!todayCheck) {
      this.toast('Please complete your daily walkaround check first', 'warning');
      this.navigate('defects');
      return;
    }
    const ts = { id: Date.now(), driverId: this.state.user.id, date: this.todayStr(), start: new Date().toTimeString().slice(0,5), end: null, breaks: 0, mileage: 0, status: 'active' };
    this.data.timesheets.unshift(ts); this.saveData('timesheets');
    this.state.timerRunning = true; this.state.timerElapsed = 0; this.state.timerStart = Date.now();
    this.state.timerInterval = setInterval(() => this.tickTimer(), 1000);
    this.toast('Shift started!', 'success'); this.render();
  },

  pauseShift() {
    this.state.timerRunning = false;
    clearInterval(this.state.timerInterval);
    this.toast('Break started', 'info'); this.render();
  },

  resumeShift() {
    this.state.timerRunning = true; this.state.timerStart = Date.now() - (this.state.timerElapsed * 1000);
    this.state.timerInterval = setInterval(() => this.tickTimer(), 1000);
    this.toast('Shift resumed', 'success'); this.render();
  },

  endShift() {
    clearInterval(this.state.timerInterval); this.state.timerRunning = false;
    const active = this.data.timesheets.find(t => t.driverId === this.state.user.id && t.status === 'active');
    if (active) {
      active.end = new Date().toTimeString().slice(0,5); active.status = 'submitted';
      const mileage = document.getElementById('ts-mileage')?.value;
      if (mileage) active.mileage = parseInt(mileage);
      this.saveData('timesheets');
    }
    this.state.timerElapsed = 0;
    this.toast('Shift ended and submitted!', 'success'); this.render();
  },

  tickTimer() {
    this.state.timerElapsed = Math.floor((Date.now() - this.state.timerStart) / 1000);
    const el = document.getElementById('timer-display');
    if (el) {
      const h = String(Math.floor(this.state.timerElapsed/3600)).padStart(2,'0');
      const m = String(Math.floor((this.state.timerElapsed%3600)/60)).padStart(2,'0');
      const s = String(this.state.timerElapsed%60).padStart(2,'0');
      el.textContent = `${h}:${m}:${s}`;
    }
  },

  // ============================================================
  // ADMIN SHELL & SCREENS (loaded from admin.js)
  // ============================================================
  renderAdminShell() { return typeof AdminScreens !== 'undefined' ? AdminScreens.renderShell() : '<p>Loading admin...</p>'; },
  bindAdmin() { if (typeof AdminScreens !== 'undefined') AdminScreens.bind(); },

  saveLocalUserAndDriver() {
    localStorage.setItem('gmh_user', JSON.stringify(this.state.user));
    const di = this.data.drivers.findIndex(d => d.id === this.state.user.id);
    if (di > -1) {
      this.data.drivers[di].vehicle = this.state.user.vehicle;
      this.data.drivers[di].trailer = this.state.user.trailer;
      this.saveData('drivers');
    }
  },

  compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => App.init());
