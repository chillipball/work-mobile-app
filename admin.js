/* ============================================================
   GM HARTSHORNE FLEET APP — Admin Portal Screens
   ============================================================ */

const AdminScreens = {
  getNotifications() {
    let notifs = [];
    const today = App.todayStr();

    // 1. Unresolved defects from any day (High priority)
    const unresolvedDefects = (App.data.defects || []).filter(d => d.status === 'reported' && !d.nilDefect);
    unresolvedDefects.forEach(d => {
      const driverName = App.getDriver(d.driverId)?.name || 'Unknown';
      notifs.push({
        type: d.severity==='high'?'danger':d.severity==='medium'?'warning':'info',
        icon: 'report_problem',
        text: `<strong>${driverName}</strong> reported a defect on <strong>${d.vehicle}</strong> (Needs Sign-Off)`,
        time: `${d.date} ${d.time}`,
        link: 'admin-defects',
        ts: new Date(`${d.date}T${d.time||'00:00'}`).getTime() || 0
      });
    });

    // 2. Today's Walkarounds
    const todaysWalkarounds = (App.data.defects || []).filter(d => (d.type === 'walkaround' || d.type === 'trailer-check') && d.date === today && d.status !== 'reported');
    todaysWalkarounds.forEach(d => {
      const driverName = App.getDriver(d.driverId)?.name || 'Unknown';
      notifs.push({
        type: 'success',
        icon: d.nilDefect ? 'check_circle' : 'done_all',
        text: `<strong>${driverName}</strong> submitted a check for <strong>${d.vehicle || d.trailer}</strong> (${d.nilDefect ? 'Nil Defect' : 'Walkaround'})`,
        time: `${d.time || 'Today'}`,
        link: 'admin-defects',
        ts: new Date(`${d.date}T${d.time||'00:00'}`).getTime() || 0
      });
    });

    // 3. Today's Timesheets
    const todaysTimesheets = (App.data.timesheets || []).filter(t => t.date === today);
    todaysTimesheets.forEach(t => {
      const driverName = App.getDriver(t.driverId)?.name || 'Unknown';
      notifs.push({
        type: 'primary',
        icon: 'schedule',
        text: `<strong>${driverName}</strong> signed off their timesheet`,
        time: `${t.startTime || ''} - ${t.endTime || ''}`,
        link: 'admin-timesheets',
        ts: new Date(`${t.date}T${t.endTime||'23:59'}`).getTime() || 0
      });
    });

    // 4. Today's PODs
    const todaysPods = (App.data.pods || []).filter(p => p.date === today);
    todaysPods.forEach(p => {
      const driverName = App.getDriver(p.driverId)?.name || 'Unknown';
      notifs.push({
        type: 'info',
        icon: 'inventory',
        text: `<strong>${driverName}</strong> uploaded a POD for <strong>${p.recipient}</strong>`,
        time: `${p.time || 'Today'}`,
        link: 'admin-pods',
        ts: new Date(`${p.date}T${p.time||'23:59'}`).getTime() || 0
      });
    });

    // Sort by timestamp descending
    return notifs.sort((a, b) => b.ts - a.ts);
  },

  renderShell() {
    const s = App.state.currentScreen;
    const u = App.state.user;
    const navMap = [
      { id: 'admin-dashboard', icon: 'dashboard', label: 'Dashboard' },
      { id: 'admin-drivers', icon: 'people', label: 'Drivers' },
      { id: 'admin-vehicles', icon: 'local_shipping', label: 'Vehicles' },
      { id: 'admin-timesheets', icon: 'schedule', label: 'Timesheets' },
      { id: 'admin-summary', icon: 'assignment', label: 'Weekly Summary' },
      { id: 'admin-defects', icon: 'report_problem', label: 'Defects' },
      { id: 'admin-pods', icon: 'inventory', label: 'PODs' },
      { id: 'admin-instructions', icon: 'send', label: 'Send Instructions' },
      { id: 'admin-export', icon: 'download', label: 'Export Data' },
    ];
    let screenContent = '';
    const notifs = this.getNotifications();
    
    if (s === 'admin-dashboard') screenContent = this.renderDashboard();
    else if (s === 'admin-drivers') screenContent = this.renderDrivers();
    else if (s === 'admin-vehicles') screenContent = this.renderVehicles();
    else if (s === 'admin-timesheets') screenContent = this.renderTimesheets();
    else if (s === 'admin-summary') screenContent = this.renderWeeklySummary();
    else if (s === 'admin-defects') screenContent = this.renderDefects();
    else if (s === 'admin-pods') screenContent = this.renderPods();
    else if (s === 'admin-instructions') screenContent = this.renderInstructions();
    else if (s === 'admin-export') screenContent = this.renderExport();

    return `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <h2>GM<span>H</span> Fleet</h2>
          <p>Office Portal</p>
        </div>
        <nav class="sidebar-nav">
          ${navMap.map(i => `
            <button class="sidebar-item ${s === i.id ? 'active' : ''}" data-screen="${i.id}">
              <span class="material-icons-round">${i.icon}</span>${i.label}
            </button>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <button class="sidebar-item" id="admin-logout">
            <span class="material-icons-round">logout</span>Sign Out
          </button>
        </div>
      </aside>
      <div class="admin-main">
        <header class="app-header">
          <div class="header-left">
            <span class="material-icons-round" style="color:var(--accent);font-size:28px">local_shipping</span>
            <span class="header-brand">G. & M. Hartshorne <span>Office</span></span>
          </div>
          <div class="header-center"></div>
          <div class="header-right" style="position:relative;display:flex;align-items:center;gap:12px">
            <button class="btn btn-icon" id="admin-notifications-btn" style="position:relative;background:rgba(255,255,255,0.05);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:var(--text-main);border:none;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
              <span class="material-icons-round">notifications</span>
              ${notifs.length > 0 ? `<span style="position:absolute;top:-2px;right:-2px;background:var(--danger);color:#fff;font-size:10px;font-weight:700;padding:2px 5px;border-radius:10px;line-height:1">${notifs.length}</span>` : ''}
            </button>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="color:var(--text-secondary);font-size:var(--text-sm);display:none;@media(min-width:768px){display:block}">${u.name}</span>
              <div class="header-avatar" style="width:36px;height:36px;font-size:14px;background:var(--accent);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700">${u.name.charAt(0)}</div>
            </div>
            
            <div id="admin-notifications-dropdown" class="hidden" style="position:absolute;top:48px;right:0;width:340px;background:var(--card-bg);border:1px solid rgba(255,255,255,0.08);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);z-index:100;overflow:hidden;text-align:left">
              <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,0.08);font-weight:600;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:var(--text-base)">Activity & Notifications</span>
                ${notifs.length > 0 ? `<span class="badge badge-info" style="font-size:var(--text-xs)">${notifs.length} New</span>` : ''}
              </div>
              <div style="max-height:400px;overflow-y:auto">
                ${notifs.length === 0 ? '<div style="padding:32px;text-align:center;color:var(--text-muted)"><span class="material-icons-round" style="font-size:32px;opacity:0.5;margin-bottom:8px">inbox</span><br>No new activity today</div>' : ''}
                ${notifs.map(n => `
                  <div class="list-item" data-action="admin-navigate" data-screen="${n.link}" style="cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04);padding:12px 16px;background:transparent;transition:background 0.2s;align-items:start" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <div class="list-item-icon" style="background:var(--${n.type}-bg);color:var(--${n.type});width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;margin-top:2px">
                      <span class="material-icons-round" style="font-size:18px">${n.icon}</span>
                    </div>
                    <div class="list-item-content" style="flex:1">
                      <div class="list-item-title" style="font-size:13px;white-space:normal;line-height:1.4;margin-bottom:4px;color:var(--text-main)">${n.text}</div>
                      <div class="list-item-subtitle" style="font-size:11px;color:var(--text-muted)">${n.time}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </header>
        <main class="main-content">
          <div class="screen">${screenContent}</div>
        </main>
        <nav class="bottom-nav">
          ${navMap.slice(0, 5).map(i => `
            <button class="nav-item ${s === i.id ? 'active' : ''}" data-screen="${i.id}">
              <span class="material-icons-round">${i.icon}</span>${i.label.substring(0, 6)}
            </button>`).join('')}
        </nav>
      </div>
    </div>`;
  },

  bind() {
    document.querySelectorAll('[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => App.navigate(btn.dataset.screen));
    });
    
    // Notifications dropdown logic
    document.getElementById('admin-notifications-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('admin-notifications-dropdown')?.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      const btn = document.getElementById('admin-notifications-btn');
      const dropdown = document.getElementById('admin-notifications-dropdown');
      if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
    document.querySelectorAll('[data-action="admin-navigate"]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('admin-notifications-dropdown')?.classList.add('hidden');
        App.navigate(btn.dataset.screen);
      });
    });

    document.getElementById('admin-logout')?.addEventListener('click', () => App.logout());
    document.getElementById('btn-send-instruction')?.addEventListener('click', () => this.sendInstruction());
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCSV());
    // Driver management
    document.getElementById('btn-show-add-driver')?.addEventListener('click', () => document.getElementById('add-driver-form').classList.toggle('hidden'));
    document.getElementById('btn-add-driver')?.addEventListener('click', () => this.addDriver());
    document.querySelectorAll('[data-remove-driver]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.removeDriver(parseInt(btn.dataset.removeDriver)); });
    });
    document.querySelectorAll('[data-reset-pin]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.resetPin(parseInt(btn.dataset.resetPin)); });
    });
    document.querySelectorAll('[data-action="view-pod-photo"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const podId = parseInt(btn.dataset.id);
        const pod = App.data.pods.find(p => p.id === podId);
        if (pod && pod.photo) {
          App.showInstructionModal({ title: 'POD: ' + pod.recipient, type: 'info', message: `<img src="${pod.photo}" style="width:100%; border-radius:8px;">` });
        }
      });
    });
    // Defect report detail viewer — click any row to open full detail
    document.querySelectorAll('[data-action="open-defect"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openDefectDetail(parseInt(btn.dataset.defectId));
      });
    });
    // Vehicle management
    document.getElementById('btn-show-add-vehicle')?.addEventListener('click', () => { document.getElementById('add-vehicle-form').classList.toggle('hidden'); });
    document.getElementById('btn-add-vehicle')?.addEventListener('click', () => this.addVehicle());
    document.querySelectorAll('[data-remove-vehicle]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.removeVehicle(btn.dataset.removeVehicle); });
    });
  },

  // --- Admin Dashboard ---
  renderDashboard() {
    const drivers = App.data.drivers;
    const today = App.todayStr();
    const activeShifts = App.data.timesheets.filter(t => t.status === 'active').length;
    const openDefects = App.data.defects.filter(d => d.status === 'reported').length;
    const todayPods = App.data.pods.filter(p => p.date === today).length;
    const pendingTS = App.data.timesheets.filter(t => t.status === 'submitted').length;
    return `
      <h1 class="screen-title">Office Dashboard</h1>
      <p class="screen-subtitle">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value text-success">${activeShifts}</div><div class="stat-label">Active Shifts</div></div>
        <div class="stat-card"><div class="stat-value text-accent">${drivers.length}</div><div class="stat-label">Total Drivers</div></div>
        <div class="stat-card"><div class="stat-value text-warning">${openDefects}</div><div class="stat-label">Open Defects</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--info)">${pendingTS}</div><div class="stat-label">Pending Timesheets</div></div>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value text-success">${todayPods}</div><div class="stat-label">Today's PODs</div></div>
        <div class="stat-card"><div class="stat-value">${App.data.vehicles.filter(v=>v.status==='active').length}</div><div class="stat-label">Active Vehicles</div></div>
      </div>
      <div class="section-header"><span class="section-title">Driver Status</span></div>
      <div class="list-card">
        ${drivers.map(d => {
          const active = App.data.timesheets.find(t => t.driverId === d.id && t.status === 'active');
          return `<div class="list-item">
            <div class="list-item-icon" style="background:${active?'var(--success-bg)':'rgba(255,255,255,0.04)'};color:${active?'var(--success)':'var(--text-muted)'}">
              <span class="material-icons-round">person</span>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${d.name}</div>
              <div class="list-item-subtitle">Unit: ${d.vehicle || 'None'} ${d.trailer ? '· Trl: '+d.trailer : ''} · ${active ? 'On shift since ' + active.start : 'Off duty'}</div>
            </div>
            <span class="status-dot ${active ? 'active' : 'inactive'}"></span>
          </div>`;
        }).join('')}
      </div>
      <div class="section-header mt-lg"><span class="section-title">Recent Defects</span></div>
      <div class="list-card">
        ${App.data.defects.filter(d=>d.status==='reported').slice(0,3).map(d => {
          const driver = App.getDriver(d.driverId);
          return `<div class="list-item">
            <div class="list-item-icon" style="background:var(--${d.severity==='high'?'danger':d.severity==='medium'?'warning':'info'}-bg);color:var(--${d.severity==='high'?'danger':d.severity==='medium'?'warning':'info'})">
              <span class="material-icons-round">report_problem</span>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${d.category} — ${d.vehicle} ${d.trailer ? '('+d.trailer+')' : ''}</div>
              <div class="list-item-subtitle">${driver?.name || 'Unknown'} · ${d.date}</div>
            </div>
            <span class="badge badge-${d.severity==='high'?'danger':'warning'}">${d.severity}</span>
          </div>`;
        }).join('') || '<div class="empty-state"><span class="material-icons-round">verified</span><h3>No open defects</h3></div>'}
      </div>`;
  },

  // --- Drivers List ---
  renderDrivers() {
    return `
      <h1 class="screen-title">Driver Management</h1>
      <p class="screen-subtitle">Add, manage, and view driver profiles</p>
      <button class="btn btn-accent btn-full mb-lg" id="btn-show-add-driver"><span class="material-icons-round">person_add</span>Add New Driver</button>
      <div id="add-driver-form" class="card hidden mb-lg">
        <div class="card-header"><span class="card-title">New Driver</span></div>
        <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="new-driver-name" placeholder="e.g. Dave Williams" required /></div>
        <div class="form-group"><label>PIN (4 digits)</label><input type="text" class="form-input" id="new-driver-pin" placeholder="e.g. 3456" maxlength="4" inputmode="numeric" value="${String(Math.floor(1000+Math.random()*9000))}"/></div>
        <button class="btn btn-primary mt-md" id="btn-add-driver"><span class="material-icons-round">person_add</span>Create Driver Account</button>
      </div>
      <div class="list-card">
        ${App.data.drivers.map(d => {
          const ts = App.data.timesheets.filter(t => t.driverId === d.id);
          const defs = App.data.defects.filter(x => x.driverId === d.id);
          const pods = App.data.pods.filter(p => p.driverId === d.id);
          const totalHrs = ts.reduce((sum, t) => { if (t.start && t.end) { const [sh,sm]=t.start.split(':').map(Number),[eh,em]=t.end.split(':').map(Number); sum+=(eh*60+em)-(sh*60+sm)-t.breaks; } return sum; }, 0);
          return `<div class="list-item">
            <div class="list-item-icon" style="background:var(--primary-glow);color:var(--primary)">
              <span class="material-icons-round">person</span>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${d.name}</div>
              <div class="list-item-subtitle">PIN: ${d.pin} · Unit: ${d.vehicle||'None'} ${d.trailer ? '· Trl: '+d.trailer : ''} · Shifts: ${ts.length} · Hrs: ${App.formatTime(totalHrs)} · Defects: ${defs.length} · PODs: ${pods.length}</div>
            </div>
            <div style="display:flex;gap:4px">
              <button class="btn btn-outline btn-sm" data-reset-pin="${d.id}" title="Reset PIN"><span class="material-icons-round" style="font-size:16px">lock_reset</span></button>
              <button class="btn btn-outline btn-sm" data-remove-driver="${d.id}" title="Remove Driver" style="color:var(--danger);border-color:rgba(255,23,68,0.2)"><span class="material-icons-round" style="font-size:16px">delete</span></button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  },

  // --- Vehicle Management ---
  renderVehicles() {
    return `
      <h1 class="screen-title">Vehicle Management</h1>
      <p class="screen-subtitle">Manage company fleet available to drivers</p>
      <button class="btn btn-accent btn-full mb-lg" id="btn-show-add-vehicle"><span class="material-icons-round">add</span>Add New Vehicle</button>
      <div id="add-vehicle-form" class="card hidden mb-lg">
        <div class="card-header"><span class="card-title">New Vehicle</span></div>
        <div class="form-row">
          <div class="form-group"><label>Registration Plate</label><input type="text" class="form-input" id="new-vehicle-reg" placeholder="e.g. AB12 CDE" required /></div>
          <div class="form-group"><label>Vehicle Type</label><input type="text" class="form-input" id="new-vehicle-type" placeholder="e.g. 44T Tractor Unit" required /></div>
        </div>
        <button class="btn btn-primary mt-md" id="btn-add-vehicle"><span class="material-icons-round">local_shipping</span>Add to Fleet</button>
      </div>
      <div class="list-card">
        ${App.data.vehicles.filter(v => v.status !== 'removed').map(v => {
          return `<div class="list-item">
            <div class="list-item-icon" style="background:var(--primary-glow);color:var(--primary)">
              <span class="material-icons-round">local_shipping</span>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${v.reg}</div>
              <div class="list-item-subtitle">${v.type}</div>
            </div>
            <div style="display:flex;gap:4px">
              <span class="badge badge-${v.status==='active'?'success':'warning'}">${v.status}</span>
              <button class="btn btn-outline btn-sm ml-sm" data-remove-vehicle="${v.reg}" title="Remove Vehicle" style="color:var(--danger);border-color:rgba(255,23,68,0.2)"><span class="material-icons-round" style="font-size:16px">delete</span></button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  },

  addDriver() {
    const nameStr = document.getElementById('new-driver-name').value.trim();
    const pin = document.getElementById('new-driver-pin').value.trim();
    if (!nameStr || pin.length !== 4) { App.toast('Enter a name and 4-digit PIN', 'error'); return; }
    const driver = { id: Date.now(), name: nameStr, pin, vehicle: null, role: 'driver' };
    App.data.drivers.push(driver);
    this.saveDrivers();
    App.toast(`${name} added as a driver!`, 'success');
    App.render();
  },

  removeDriver(id) {
    const driver = App.getDriver(id);
    if (!driver) return;
    App.confirm(`Remove ${driver.name}? Their history will be kept.`, () => {
      App.data.drivers = App.data.drivers.filter(d => d.id !== id);
      this.saveDrivers();
      App.toast(`${driver.name} removed`, 'info');
      App.render();
    });
  },

  resetPin(id) {
    const driver = App.getDriver(id);
    if (!driver) return;
    const newPin = prompt(`Enter new 4-digit PIN for ${driver.name}:`, driver.pin);
    if (newPin && newPin.length === 4) {
      driver.pin = newPin;
      this.saveDrivers();
      App.toast(`PIN updated for ${driver.name}`, 'success');
      App.render();
    }
  },

  addVehicle() {
    const reg = document.getElementById('new-vehicle-reg').value.trim().toUpperCase();
    const type = document.getElementById('new-vehicle-type').value.trim();
    if (!reg || !type) { App.toast('Registration and Type are required', 'error'); return; }
    if (App.data.vehicles.find(v => v.reg === reg)) { App.toast('Vehicle already exists!', 'error'); return; }
    
    App.data.vehicles.push({ reg, type, status: 'active' });
    this.saveVehicles();
    App.toast(`Vehicle ${reg} added to fleet!`, 'success');
    App.render();
  },

  removeVehicle(reg) {
    App.confirm(`Remove ${reg} from the active fleet? Defect history will be kept for 2 years.`, () => {
      const v = App.data.vehicles.find(x => x.reg === reg);
      if (v) {
        v.status = 'removed';
        v.removedDate = App.todayStr();
      }
      this.saveVehicles();
      App.toast(`Vehicle ${reg} removed from active fleet. History preserved.`, 'success');
      App.render();
    });
  },

  saveDrivers() {
    App.saveData('drivers');
  },

  saveVehicles() {
    App.saveData('vehicles');
  },

  // --- Timesheets View ---
  renderTimesheets() {
    return `
      <h1 class="screen-title">All Timesheets</h1>
      <p class="screen-subtitle">Review and approve driver timesheets</p>
      <div class="card" style="overflow-x:auto">
        <table class="data-table" style="min-width: 800px">
          <thead><tr><th>Driver</th><th>Date</th><th>Start</th><th>End</th><th>Duration / Breaks</th><th>Mileage</th><th>Fuel / AdBlue</th><th>Night Out</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${App.data.timesheets.map(t => {
              const d = App.getDriver(t.driverId);
              let durationStr = '—';
              if (t.start && t.end) {
                const [sh,sm] = t.start.split(':').map(Number);
                const [eh,em] = t.end.split(':').map(Number);
                let mins = (eh*60+em) - (sh*60+sm);
                if (mins < 0) mins += 24*60;
                durationStr = `${Math.floor(mins/60)}h ${mins%60}m`;
              }
              const fuelStr = t.dieselAdded ? `${t.dieselAdded}L Diesel<br><span style="font-size:10px;color:var(--text-muted)">Odo: ${t.dieselMileage}</span>` : '—';
              const adbStr = t.adBlueAdded ? `${t.adBlueAdded}L AdBlue<br><span style="font-size:10px;color:var(--text-muted)">Odo: ${t.adBlueMileage}</span>` : '—';
              const noStr = t.nightOut ? `Yes<br><span style="font-size:10px;color:var(--accent)">${t.nightOutLocation}</span>` : 'No';

              return `<tr>
                <td><strong>${d?.name || 'Unknown'}</strong></td>
                <td>${t.date}</td>
                <td>${t.start}</td>
                <td>${t.end || '—'}</td>
                <td>${durationStr}<br><span style="font-size:10px;color:var(--text-muted)">Breaks: ${t.breaks}m</span></td>
                <td>${t.mileage || '—'}${t.mileage ? 'mi' : ''}</td>
                <td><div style="line-height:1.2">${fuelStr}<br>${adbStr !== '—' ? adbStr : ''}</div></td>
                <td><div style="line-height:1.2">${noStr}</div></td>
                <td><span class="badge badge-${t.status==='approved'?'success':t.status==='active'?'warning':'info'}">${t.status}</span></td>
                <td>
                  ${t.status === 'submitted' ? `<button class="btn btn-sm btn-success" onclick="AdminScreens.approveTimesheet(${t.id})" style="padding:4px 8px"><span class="material-icons-round" style="font-size:14px;margin-right:4px">check</span>Approve</button>` : '—'}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  approveTimesheet(id) {
    const ts = App.data.timesheets.find(t => t.id === id);
    if (!ts) return;
    ts.status = 'approved';
    App.saveData('timesheets');
    App.toast('Timesheet approved!', 'success');
    App.render();
  },

  // --- Weekly Summary View ---
  renderWeeklySummary() {
    return `
      <h1 class="screen-title">Driver Weekly Summary</h1>
      <p class="screen-subtitle">View daily breakdown for payroll and tracking</p>
      
      <div class="card mb-lg">
        <div class="form-row">
          <div class="form-group">
            <label>Select Driver</label>
            <select class="form-select" id="summary-driver" onchange="AdminScreens.updateSummaryView()">
              <option value="">-- Choose a driver --</option>
              ${App.data.drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Week Commencing (Monday)</label>
            <select class="form-select" id="summary-week" onchange="AdminScreens.updateSummaryView()">
              ${this.getRecentWeeksOptions()}
            </select>
          </div>
        </div>
      </div>
      
      <div id="summary-results">
        <div class="empty-state"><span class="material-icons-round">assignment</span><h3>Select a driver</h3><p>Choose a driver and week to view the summary.</p></div>
      </div>
    `;
  },

  getRecentWeeksOptions() {
    let html = '';
    const now = new Date();
    for(let i=0; i<6; i++) {
        let n = new Date();
        n.setDate(n.getDate() - (n.getDay()||7) + 1 - (i*7));
        const dateStr = n.toISOString().split('T')[0];
        const displayStr = n.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
        html += '<option value="' + dateStr + '">W/C ' + displayStr + '</option>';
    }
    return html;
  },

  updateSummaryView() {
    const dSelect = document.getElementById('summary-driver');
    const wSelect = document.getElementById('summary-week');
    if(!dSelect || !wSelect) return;
    
    const driverId = parseInt(dSelect.value);
    const wcDateStr = wSelect.value;
    const resDiv = document.getElementById('summary-results');
    
    if(!driverId || isNaN(driverId)) {
      resDiv.innerHTML = '<div class="empty-state"><span class="material-icons-round">assignment</span><h3>Select a driver</h3><p>Choose a driver and week to view the summary.</p></div>';
      return;
    }
    
    let totalHrs = 0; let totalMins = 0; let totalMiles = 0; let totalPods = 0; let totalNightOuts = 0;
    const daysHtml = [];
    const wcDate = new Date(wcDateStr);
    
    for(let i=0; i<7; i++) {
        const d = new Date(wcDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const ts = App.data.timesheets.find(t => t.driverId === driverId && t.date === dateStr);
        const pods = App.data.pods.filter(p => p.driverId === driverId && p.date === dateStr);
        
        let tsHtml = '<div class="text-muted" style="font-size:var(--text-sm)">No shift logged</div>';
        if (ts) {
            let durationStr = 'Ongoing';
            if (ts.start && ts.end) {
                const [sh,sm] = ts.start.split(':').map(Number);
                const [eh,em] = ts.end.split(':').map(Number);
                let mins = (eh*60+em) - (sh*60+sm);
                if (mins < 0) mins += 24*60;
                totalHrs += Math.floor(mins/60); totalMins += mins%60;
                durationStr = Math.floor(mins/60) + 'h ' + (mins%60) + 'm (Breaks: ' + ts.breaks + 'm)';
            }
            if(ts.mileage) totalMiles += ts.mileage;
            if(ts.nightOut) totalNightOuts++;
            
            tsHtml = '<div style="font-size:var(--text-sm); line-height:1.4;">' +
                     '<strong>' + ts.start + ' - ' + (ts.end||'—') + '</strong> &nbsp;&bull;&nbsp; ' + durationStr + '<br>' +
                     'Distance: ' + ts.mileage + 'mi<br>' +
                     (ts.dieselAdded ? '<span class="text-muted">Fuel: ' + ts.dieselAdded + 'L Diesel (Odo: ' + ts.dieselMileage + ')</span><br>' : '') +
                     (ts.adBlueAdded ? '<span class="text-muted">AdBlue: ' + ts.adBlueAdded + 'L (Odo: ' + ts.adBlueMileage + ')</span><br>' : '') +
                     (ts.nightOut ? '<strong style="color:var(--accent)">Night Out: ' + ts.nightOutLocation + '</strong>' : '') +
                     '</div>';
        }
        
        let podsHtml = '';
        if (pods.length > 0) {
            totalPods += pods.length;
            podsHtml = '<div style="font-size:var(--text-sm); line-height:1.4; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.1)">' +
                       '<strong>' + pods.length + ' Deliveries:</strong><br>' +
                       pods.map(p => '&bull; ' + p.recipient + ' (' + p.location + ')').join('<br>') +
                       '</div>';
        }
        
        daysHtml.push('<div class="list-item" style="align-items:flex-start;">' +
            '<div class="list-item-icon" style="background:var(--primary-glow);color:var(--primary);flex-shrink:0;">' +
                '<div style="font-size:12px;font-weight:700;line-height:1;text-align:center;">' +
                    d.toLocaleDateString('en-GB',{weekday:'short'}).toUpperCase() + '<br>' +
                    '<span style="font-size:18px">' + d.getDate() + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="list-item-content" style="width:100%">' + tsHtml + podsHtml + '</div>' +
        '</div>');
    }
    
    totalHrs += Math.floor(totalMins / 60);
    totalMins = totalMins % 60;
    
    resDiv.innerHTML = '<div class="stats-row" style="grid-template-columns: repeat(4, 1fr); gap: 12px; overflow-x: auto;">' +
        '<div class="stat-card" style="padding:12px;"><div class="stat-value text-accent" style="font-size:18px;">' + totalHrs + 'h ' + totalMins + 'm</div><div class="stat-label">Total Time</div></div>' +
        '<div class="stat-card" style="padding:12px;"><div class="stat-value text-info" style="font-size:18px;">' + totalMiles + '</div><div class="stat-label">Total Miles</div></div>' +
        '<div class="stat-card" style="padding:12px;"><div class="stat-value text-success" style="font-size:18px;">' + totalPods + '</div><div class="stat-label">Deliveries</div></div>' +
        '<div class="stat-card" style="padding:12px;"><div class="stat-value text-warning" style="font-size:18px;">' + totalNightOuts + '</div><div class="stat-label">Night Outs</div></div>' +
        '</div>' +
        '<div class="list-card mt-md">' + daysHtml.join('') + '</div>';
  },

  // --- Get all known vehicle regs (active fleet + historical defects) ---
  getAllKnownVehicles() {
    const vehicleMap = {};
    // From fleet data (includes soft-deleted)
    App.data.vehicles.forEach(v => {
      vehicleMap[v.reg] = { reg: v.reg, type: v.type, status: v.status, removedDate: v.removedDate || null };
    });
    // From historical defect data (in case vehicle was hard-deleted in older data)
    App.data.defects.forEach(d => {
      if (d.vehicle && !vehicleMap[d.vehicle]) {
        vehicleMap[d.vehicle] = { reg: d.vehicle, type: 'Unknown Type', status: 'removed', removedDate: null };
      }
    });
    return Object.values(vehicleMap).sort((a, b) => {
      // Active first, then removed, then alphabetical
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return a.reg.localeCompare(b.reg);
    });
  },

  // --- Defects View ---
  renderDefects() {
    const allVehicles = this.getAllKnownVehicles();
    return `
      <h1 class="screen-title">Defect Reports</h1>
      <p class="screen-subtitle">Vehicle weekly history and all walkaround checks</p>

      <div class="card mb-lg" style="border-left:3px solid var(--accent)">
        <div class="card-header"><span class="card-title"><span class="material-icons-round" style="font-size:20px;vertical-align:middle;margin-right:6px">local_shipping</span>Vehicle Weekly Defect History</span></div>
        <div class="form-row">
          <div class="form-group">
            <label>Select Vehicle</label>
            <select class="form-select" id="defect-vehicle" onchange="AdminScreens.updateDefectHistoryView()">
              <option value="">-- Choose a vehicle --</option>
              ${allVehicles.map(v => '<option value="' + v.reg + '">' + v.reg + ' — ' + v.type + (v.status === 'removed' ? ' (Removed)' : v.status === 'maintenance' ? ' (Maintenance)' : '') + '</option>').join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Week Commencing (Monday)</label>
            <select class="form-select" id="defect-week" onchange="AdminScreens.updateDefectHistoryView()">
              ${this.getRecentWeeksOptions()}
            </select>
          </div>
        </div>
        <div id="defect-history-results">
          <div class="empty-state" style="padding:var(--space-lg) 0"><span class="material-icons-round">search</span><h3>Select a vehicle</h3><p>Choose a vehicle and week to view its defect history</p></div>
        </div>
      </div>

      <div class="section-header"><span class="section-title">All Reports</span><span style="font-size:var(--text-xs);color:var(--text-muted)">${App.data.defects.length} total</span></div>
      <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-md)">Click any report to view full details and photos</p>
      <div class="list-card">
        ${App.data.defects.length === 0 ? '<div class="empty-state"><span class="material-icons-round">verified</span><h3>No defect reports</h3><p>Reports appear here when drivers submit walkaround checks</p></div>' : ''}
        ${App.data.defects.map(d => this.renderDefectRow(d)).join('')}
      </div>`;
  },

  renderDefectRow(d) {
    const driver = App.getDriver(d.driverId);
    const isWalkaround = d.type === 'walkaround';
    const isTrailerCheck = d.type === 'trailer-check';
    const hasPhotos = d.cornerPhotos && Object.keys(d.cornerPhotos).length > 0;
    const defectCount = d.items ? d.items.filter(i => i.status === 'fail').length : 0;
    const typeLabel = isTrailerCheck ? 'Trailer Check' : isWalkaround ? 'Walkaround Check' : (d.category || 'Defect');

    return `<div class="list-item" data-action="open-defect" data-defect-id="${d.id}" style="cursor:pointer;padding:var(--space-md);transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background=''">
      <div class="list-item-icon" style="background:${d.nilDefect?'var(--success-bg)':isWalkaround||isTrailerCheck?'var(--warning-bg)':'var(--'+((d.severity||'')===('high')?'danger':(d.severity||'')===('medium')?'warning':'info')+'-bg)'};color:${d.nilDefect?'var(--success)':isWalkaround||isTrailerCheck?'var(--warning)':'var(--'+((d.severity||'')===('high')?'danger':(d.severity||'')===('medium')?'warning':'info')+')'};flex-shrink:0">
        <span class="material-icons-round">${isTrailerCheck?'rv_hookup':d.nilDefect?'check_circle':'report_problem'}</span>
      </div>
      <div class="list-item-content" style="flex:1;min-width:150px">
        <div class="list-item-title">${typeLabel} — ${d.vehicle || 'N/A'} ${d.trailer ? '· Trl: '+d.trailer : ''}</div>
        <div class="list-item-subtitle">${driver?.name || 'Unknown'} · ${d.date}${d.time ? ' at '+d.time : ''}${d.odometer ? ' · ' + d.odometer + ' mi' : ''}</div>
        <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
          <span class="badge badge-${d.nilDefect?'success':d.status==='resolved'?'success':'warning'}" style="font-size:11px">${d.nilDefect ? 'Nil Defect' : (isWalkaround||isTrailerCheck) ? defectCount + ' defect' + (defectCount!==1?'s':'') : d.status}</span>
          ${hasPhotos ? '<span class="badge badge-info" style="font-size:11px"><span class="material-icons-round" style="font-size:12px;vertical-align:middle;margin-right:2px">photo_camera</span>4 Photos</span>' : ''}
        </div>
      </div>
      <span class="material-icons-round" style="color:var(--text-muted);font-size:20px;flex-shrink:0">chevron_right</span>
    </div>`;
  },

  updateDefectHistoryView() {
    const vSelect = document.getElementById('defect-vehicle');
    const wSelect = document.getElementById('defect-week');
    const resDiv = document.getElementById('defect-history-results');
    if (!vSelect || !wSelect || !resDiv) return;

    const vehicleReg = vSelect.value;
    const wcDateStr = wSelect.value;

    if (!vehicleReg) {
      resDiv.innerHTML = '<div class="empty-state" style="padding:var(--space-lg) 0"><span class="material-icons-round">search</span><h3>Select a vehicle</h3><p>Choose a vehicle and week to view its defect history</p></div>';
      return;
    }

    // Calculate date range (Mon–Sun)
    const wcDate = new Date(wcDateStr);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(wcDate);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Filter defects for this vehicle in this week
    const weekDefects = App.data.defects.filter(d => d.vehicle === vehicleReg && dates.includes(d.date));

    // Stats
    const totalChecks = weekDefects.filter(d => d.type === 'walkaround').length;
    const totalDefects = weekDefects.reduce((sum, d) => sum + (d.items ? d.items.filter(i => i.status === 'fail').length : (d.status === 'reported' ? 1 : 0)), 0);
    const photosCount = weekDefects.filter(d => d.cornerPhotos && Object.keys(d.cornerPhotos).length > 0).length;
    const nilCount = weekDefects.filter(d => d.nilDefect).length;

    // Day by day breakdown
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let daysHtml = '';
    dates.forEach((dateStr, idx) => {
      const dayDefects = weekDefects.filter(d => d.date === dateStr);
      const dayDate = new Date(dateStr);
      const dayDisplay = dayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      if (dayDefects.length === 0) {
        daysHtml += '<div class="list-item" style="opacity:0.5">' +
          '<div class="list-item-icon" style="background:rgba(255,255,255,0.04);color:var(--text-muted);flex-shrink:0">' +
            '<div style="font-size:12px;font-weight:700;line-height:1;text-align:center">' + dayNames[idx] + '<br><span style="font-size:16px">' + dayDate.getDate() + '</span></div>' +
          '</div>' +
          '<div class="list-item-content"><div class="list-item-subtitle">No checks recorded</div></div>' +
        '</div>';
      } else {
        dayDefects.forEach(d => {
          daysHtml += '<div class="list-item" data-action="open-defect" data-defect-id="' + d.id + '" style="cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'rgba(255,255,255,0.04)\'" onmouseout="this.style.background=\'\'">' +
            '<div class="list-item-icon" style="background:rgba(255,255,255,0.04);color:var(--text-muted);flex-shrink:0">' +
              '<div style="font-size:12px;font-weight:700;line-height:1;text-align:center">' + dayNames[idx] + '<br><span style="font-size:16px">' + dayDate.getDate() + '</span></div>' +
            '</div>' +
            '<div class="list-item-icon" style="background:' + (d.nilDefect ? 'var(--success-bg)' : 'var(--warning-bg)') + ';color:' + (d.nilDefect ? 'var(--success)' : 'var(--warning)') + ';flex-shrink:0">' +
              '<span class="material-icons-round">' + (d.type === 'trailer-check' ? 'rv_hookup' : d.nilDefect ? 'check_circle' : 'report_problem') + '</span>' +
            '</div>' +
            '<div class="list-item-content" style="flex:1">' +
              '<div class="list-item-title">' + (d.type === 'trailer-check' ? 'Trailer Check' : d.type === 'walkaround' ? 'Walkaround' : (d.category || 'Defect')) + (d.time ? ' at ' + d.time : '') + '</div>' +
              '<div class="list-item-subtitle">' + (App.getDriver(d.driverId)?.name || 'Unknown') + ' · ' + (d.nilDefect ? 'Nil Defect' : (d.items ? d.items.filter(i => i.status === 'fail').length : 0) + ' defect(s)') +
              (d.odometer ? ' · ' + d.odometer + ' mi' : '') +
              (d.cornerPhotos && Object.keys(d.cornerPhotos).length > 0 ? ' · 📸 Photos' : '') + '</div>' +
            '</div>' +
            '<span class="material-icons-round" style="color:var(--text-muted);font-size:20px;flex-shrink:0">chevron_right</span>' +
          '</div>';
        });
      }
    });

    resDiv.innerHTML =
      '<div class="stats-row" style="grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: var(--space-md)">' +
        '<div class="stat-card" style="padding:12px"><div class="stat-value text-accent" style="font-size:18px">' + totalChecks + '</div><div class="stat-label">Walkarounds</div></div>' +
        '<div class="stat-card" style="padding:12px"><div class="stat-value text-success" style="font-size:18px">' + nilCount + '</div><div class="stat-label">Nil Defect</div></div>' +
        '<div class="stat-card" style="padding:12px"><div class="stat-value text-warning" style="font-size:18px">' + totalDefects + '</div><div class="stat-label">Defects</div></div>' +
        '<div class="stat-card" style="padding:12px"><div class="stat-value text-info" style="font-size:18px">' + photosCount + '</div><div class="stat-label">With Photos</div></div>' +
      '</div>' +
      '<div class="list-card mt-md">' +
        (weekDefects.length === 0 ? '<div class="empty-state" style="padding:var(--space-lg) 0"><span class="material-icons-round">event_busy</span><h3>No records this week</h3><p>No walkaround checks or defects for ' + vehicleReg + ' in this period</p></div>' : daysHtml) +
      '</div>';

    // Bind click handlers for the new rows
    resDiv.querySelectorAll('[data-action="open-defect"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openDefectDetail(parseInt(btn.dataset.defectId));
      });
    });
  },

  openDefectDetail(defectId) {
    const d = App.data.defects.find(x => x.id === defectId);
    if (!d) return;
    const driver = App.getDriver(d.driverId);
    const isWalkaround = d.type === 'walkaround';
    const isTrailerCheck = d.type === 'trailer-check';
    const hasPhotos = d.cornerPhotos && Object.keys(d.cornerPhotos).length > 0;
    const defectCount = d.items ? d.items.filter(i => i.status === 'fail').length : 0;
    const typeLabel = isTrailerCheck ? 'Trailer Inspection' : isWalkaround ? 'Walkaround Check' : 'Defect Report';

    let defectItemsHtml = '';
    if (d.items && d.items.length > 0) {
      const failed = d.items.filter(i => i.status === 'fail');
      if (failed.length > 0) {
        defectItemsHtml = `
          <div style="margin-top:var(--space-md);padding:var(--space-md);background:var(--warning-bg);border-radius:8px">
            <div style="font-weight:600;color:var(--warning);margin-bottom:8px;display:flex;align-items:center;gap:6px">
              <span class="material-icons-round" style="font-size:18px">warning</span>${failed.length} Defect${failed.length!==1?'s':''} Found
            </div>
            ${failed.map(i => `
              <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
                <div style="font-weight:600;font-size:var(--text-sm);color:var(--text-main)">${i.label}</div>
                ${i.notes ? '<div style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:2px">' + i.notes + '</div>' : '<div style="font-size:var(--text-sm);color:var(--text-muted);margin-top:2px">No description</div>'}
              </div>
            `).join('')}
          </div>`;
      }
    }

    // For legacy single-defect types
    if (!isWalkaround && !isTrailerCheck && d.description) {
      defectItemsHtml = `
        <div style="margin-top:var(--space-md);padding:var(--space-md);background:var(--warning-bg);border-radius:8px">
          <div style="font-weight:600;color:var(--warning);margin-bottom:8px">Defect Details</div>
          <div style="font-size:var(--text-sm);color:var(--text-secondary)">${d.description}</div>
        </div>`;
    }

    let photosHtml = '';
    if (hasPhotos) {
      const corners = [
        { key: 'front', label: 'Front' },
        { key: 'nearside', label: 'Nearside (Driver)' },
        { key: 'offside', label: 'Offside (Passenger)' },
        { key: 'rear', label: 'Rear' },
      ];
      photosHtml = `
        <div style="margin-top:var(--space-lg)">
          <div style="font-weight:700;font-size:var(--text-sm);color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:6px">
            <span class="material-icons-round" style="font-size:18px;color:var(--info)">photo_camera</span>Vehicle Corner Photos
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${corners.map(c => `
              <div style="text-align:center">
                ${d.cornerPhotos[c.key]
                  ? '<img src="' + d.cornerPhotos[c.key] + '" alt="' + c.label + '" style="width:100%;border-radius:8px;border:1px solid rgba(255,255,255,0.1);aspect-ratio:4/3;object-fit:cover;cursor:pointer" onclick="window.open(this.src)" />'
                  : '<div style="padding:40px;background:rgba(255,255,255,0.04);border-radius:8px;color:var(--text-muted)"><span class="material-icons-round">no_photography</span></div>'}
                <div style="font-size:var(--text-sm);font-weight:600;margin-top:6px;color:var(--text-secondary)">${c.label}</div>
              </div>
            `).join('')}
          </div>
        </div>`;
    }

    // Has actual defects to resolve (not nil defect)?
    const needsResolution = !d.nilDefect && d.status === 'reported';
    const isResolved = d.status === 'resolved' && !d.nilDefect;

    // Workshop sign-off section
    let workshopHtml = '';
    if (needsResolution) {
      workshopHtml = `
        <div style="margin-top:var(--space-lg);padding:var(--space-md);border:2px solid var(--warning);border-radius:12px;background:rgba(245,124,0,0.05)">
          <div style="font-weight:700;color:var(--warning);margin-bottom:12px;display:flex;align-items:center;gap:8px;font-size:var(--text-base)">
            <span class="material-icons-round" style="font-size:22px">build</span>Workshop Sign-Off Required
          </div>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-md)">A workshop technician must confirm this defect has been inspected and resolved before sign-off.</p>
          <div class="form-group">
            <label style="font-weight:600;font-size:var(--text-sm)">Workshop Staff Name (Print)</label>
            <input type="text" class="form-input" id="ws-print-name" placeholder="e.g. Dave Williams" />
          </div>
          <div class="form-group">
            <label style="font-weight:600;font-size:var(--text-sm)">Workshop Signature</label>
            <input type="text" class="form-input" id="ws-signature" placeholder="Type full name as signature" />
          </div>
          <div class="form-group">
            <label style="font-weight:600;font-size:var(--text-sm)">Work Carried Out / Notes</label>
            <textarea class="form-input" id="ws-notes" placeholder="Describe what was done to resolve the defect(s)..."></textarea>
          </div>
          <button class="btn btn-success btn-full" id="btn-ws-resolve" style="margin-top:var(--space-sm)">
            <span class="material-icons-round">check_circle</span>Confirm Defect Resolved
          </button>
        </div>`;
    } else if (isResolved && d.workshopSignOff) {
      workshopHtml = `
        <div style="margin-top:var(--space-lg);padding:var(--space-md);border:2px solid var(--success);border-radius:12px;background:rgba(0,200,83,0.05)">
          <div style="font-weight:700;color:var(--success);margin-bottom:12px;display:flex;align-items:center;gap:8px;font-size:var(--text-base)">
            <span class="material-icons-round" style="font-size:22px">verified</span>Workshop Sign-Off Complete
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Technician Name</div>
              <div style="font-weight:600;margin-top:4px">${d.workshopSignOff.printName}</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Signature</div>
              <div style="font-weight:600;margin-top:4px">${d.workshopSignOff.signature}</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Resolved Date</div>
              <div style="font-weight:600;margin-top:4px">${d.workshopSignOff.date}${d.workshopSignOff.time ? ' at '+d.workshopSignOff.time : ''}</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Reported To</div>
              <div style="font-weight:600;margin-top:4px">${d.reportedTo || '—'}</div>
            </div>
          </div>
          ${d.workshopSignOff.notes ? '<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px"><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Work Carried Out</div><div style="font-size:var(--text-sm);color:var(--text-secondary)">' + d.workshopSignOff.notes + '</div></div>' : ''}
        </div>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:640px;max-height:90vh;overflow-y:auto">
        <div class="modal-header">
          <span class="modal-title">${typeLabel}</span>
          <button class="modal-close" id="close-modal"><span class="material-icons-round">close</span></button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:var(--space-md)">
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Driver</div>
            <div style="font-weight:600;margin-top:4px">${driver?.name || 'Unknown'}</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Date / Time</div>
            <div style="font-weight:600;margin-top:4px">${d.date}${d.time ? ' at '+d.time : ''}</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Vehicle</div>
            <div style="font-weight:600;margin-top:4px">${d.vehicle || 'N/A'}</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">${isTrailerCheck ? 'Trailer' : 'Trailer / Odo'}</div>
            <div style="font-weight:600;margin-top:4px">${d.trailer || '—'}${d.odometer ? ' · Odo: '+d.odometer : ''}</div>
          </div>
          <div style="background:rgba(0,176,255,0.08);border-radius:8px;padding:12px;border:1px solid rgba(0,176,255,0.15)">
            <div style="font-size:11px;color:var(--info);text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Odometer (Miles)</div>
            <div style="font-weight:700;margin-top:4px;font-size:16px;color:var(--info)">${d.odometer || '—'}</div>
          </div>
          <div style="background:rgba(0,200,83,0.08);border-radius:8px;padding:12px;border:1px solid rgba(0,200,83,0.15)">
            <div style="font-size:11px;color:var(--success);text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Vehicle Height</div>
            <div style="font-weight:700;margin-top:4px;font-size:16px;color:var(--success)">${d.vehicleHeight || '—'}</div>
          </div>
        </div>

        <div style="display:flex;gap:6px;margin-bottom:var(--space-md);flex-wrap:wrap">
          <span class="badge badge-${d.nilDefect?'success':d.status==='resolved'?'success':'warning'}" style="font-size:12px;padding:6px 12px">${d.nilDefect ? '✅ Nil Defect — All Clear' : d.status === 'resolved' ? '✅ Resolved' : (isWalkaround||isTrailerCheck) ? '⚠️ '+defectCount+' Defect'+(defectCount!==1?'s':'')+' — Awaiting Workshop' : d.status}</span>
          ${d.severity ? '<span class="badge badge-' + (d.severity==='high'?'danger':d.severity==='medium'?'warning':'info') + '" style="font-size:12px;padding:6px 12px">' + d.severity + ' severity</span>' : ''}
          ${hasPhotos ? '<span class="badge badge-info" style="font-size:12px;padding:6px 12px"><span class="material-icons-round" style="font-size:14px;vertical-align:middle;margin-right:4px">photo_camera</span>4 Corner Photos</span>' : ''}
        </div>

        ${defectItemsHtml}

        ${d.additionalNotes ? '<div style="margin-top:var(--space-md);padding:var(--space-md);background:rgba(255,255,255,0.04);border-radius:8px"><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Additional Notes</div><div style="font-size:var(--text-sm);color:var(--text-secondary)">' + d.additionalNotes + '</div></div>' : ''}

        ${(d.signature || d.reportedTo) ? '<div style="margin-top:var(--space-md);display:flex;gap:12px"><div style="flex:1;background:rgba(255,255,255,0.04);border-radius:8px;padding:12px"><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Driver Signed</div><div style="font-weight:600;margin-top:4px">' + (d.signature||'—') + '</div></div><div style="flex:1;background:' + (needsResolution ? 'rgba(245,124,0,0.1);border:1px solid var(--warning)' : 'rgba(255,255,255,0.04)') + ';border-radius:8px;padding:12px"><div style="font-size:11px;color:' + (needsResolution ? 'var(--warning)' : 'var(--text-muted)') + ';text-transform:uppercase;letter-spacing:0.5px;font-weight:' + (needsResolution ? '700' : '400') + '">Reported To</div><div style="font-weight:600;margin-top:4px">' + (d.reportedTo||'—') + '</div></div></div>' : ''}

        ${workshopHtml}

        ${photosHtml}
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-modal').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Bind workshop resolve button
    overlay.querySelector('#btn-ws-resolve')?.addEventListener('click', () => {
      const printName = overlay.querySelector('#ws-print-name').value.trim();
      const signature = overlay.querySelector('#ws-signature').value.trim();
      const notes = overlay.querySelector('#ws-notes').value.trim();

      if (!printName) { App.toast('Please enter the technician\'s printed name', 'error'); return; }
      if (!signature) { App.toast('Please enter the technician\'s signature', 'error'); return; }
      if (!notes) { App.toast('Please describe the work carried out', 'error'); return; }

      d.status = 'resolved';
      d.workshopSignOff = {
        printName,
        signature,
        notes,
        date: App.todayStr(),
        time: new Date().toTimeString().slice(0, 5),
      };
      App.saveData('defects');
      overlay.remove();
      App.toast('Defect marked as resolved with workshop sign-off!', 'success');
      App.render();
    });
  },

  // --- PODs View ---
  renderPods() {
    return `
      <h1 class="screen-title">Proof of Delivery</h1>
      <p class="screen-subtitle">All POD records</p>
      <div class="card" style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Driver</th><th>Date</th><th>Recipient</th><th>Location</th><th>Notes</th><th>Photo</th><th>Status</th></tr></thead>
          <tbody>
            ${App.data.pods.map(p => {
              const driver = App.getDriver(p.driverId);
              return `<tr>
                <td>${driver?.name || 'Unknown'}</td><td>${p.date}</td><td>${p.recipient}</td>
                <td>${p.location}</td><td>${p.notes}</td>
                <td>${p.photo ? `<button class="btn btn-outline btn-sm" data-action="view-pod-photo" data-id="${p.id}"><span class="material-icons-round" style="font-size:16px; margin-right:4px;">image</span>View</button>` : '<span class="text-muted" style="font-size:var(--text-sm)">No photo</span>'}</td>
                <td><span class="badge badge-success">${p.status}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // --- Send Instructions ---
  renderInstructions() {
    return `
      <h1 class="screen-title">Send Instructions</h1>
      <p class="screen-subtitle">Send jobs and messages to drivers</p>
      <div class="card">
        <div class="card-header"><span class="card-title">New Instruction</span></div>
        <div class="form-group">
          <label>Send To</label>
          <select class="form-select" id="instr-driver">
            <option value="">Select driver...</option>
            ${App.data.drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select class="form-select" id="instr-type">
            <option value="job">Job / Collection / Delivery</option>
            <option value="message">Message</option>
          </select>
        </div>
        <div class="form-group">
          <label>Title</label>
          <input type="text" class="form-input" id="instr-title" placeholder="e.g. Collection — Celsa Steel, Cardiff" />
        </div>
        <div class="form-group">
          <label>Message / Details</label>
          <textarea class="form-input" id="instr-message" placeholder="Full instructions, addresses, notes..."></textarea>
        </div>
        <button class="btn btn-primary" id="btn-send-instruction">
          <span class="material-icons-round">send</span>Send Instruction
        </button>
      </div>
      <div class="section-header mt-lg"><span class="section-title">Sent Instructions</span></div>
      <div class="list-card">
        ${App.data.instructions.sort((a,b) => b.id - a.id).map(i => {
          const driver = App.getDriver(i.driverId);
          return `<div class="list-item">
            <div class="list-item-icon" style="background:${i.type==='job'?'rgba(245,124,0,0.15)':'var(--info-bg)'};color:${i.type==='job'?'var(--accent)':'var(--info)'}">
              <span class="material-icons-round">${i.type==='job'?'work':'chat'}</span>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${i.title}</div>
              <div class="list-item-subtitle">To: ${driver?.name || 'Unknown'} · ${i.date} ${i.time} · ${i.read ? 'Read' : 'Unread'}</div>
            </div>
            <span class="badge badge-${i.read?'success':'warning'}">${i.read?'read':'unread'}</span>
          </div>`;
        }).join('')}
      </div>`;
  },

  sendInstruction() {
    const driverId = parseInt(document.getElementById('instr-driver').value);
    const type = document.getElementById('instr-type').value;
    const title = document.getElementById('instr-title').value;
    const message = document.getElementById('instr-message').value;
    if (!driverId || !title || !message) { App.toast('Please fill in all fields', 'error'); return; }
    const instr = {
      id: Date.now(), driverId, from: 'Office', date: App.todayStr(),
      time: new Date().toTimeString().slice(0, 5), type, title, message, read: false,
    };
    App.data.instructions.push(instr);
    App.saveData('instructions');
    const driver = App.getDriver(driverId);
    App.toast(`Instruction sent to ${driver?.name}!`, 'success');
    App.render();
  },

  // --- Export ---
  renderExport() {
    return `
      <h1 class="screen-title">Export Data</h1>
      <p class="screen-subtitle">Download reports as CSV</p>
      <div class="quick-actions" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
        <div class="quick-action" data-export="timesheets">
          <span class="material-icons-round" style="color:var(--info)">schedule</span>
          <span>Timesheets</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted)">${App.data.timesheets.length} records</span>
        </div>
        <div class="quick-action" data-export="defects">
          <span class="material-icons-round text-warning">report_problem</span>
          <span>Defect Reports</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted)">${App.data.defects.length} records</span>
        </div>
        <div class="quick-action" data-export="pods">
          <span class="material-icons-round text-success">inventory</span>
          <span>PODs</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted)">${App.data.pods.length} records</span>
        </div>
      </div>
      <div class="card mt-lg">
        <div class="card-header"><span class="card-title">Quick Export</span></div>
        <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-md)">Click a card above or use the button below to export all data.</p>
        <button class="btn btn-primary" id="btn-export-csv"><span class="material-icons-round">download</span>Export All as CSV</button>
      </div>`;
  },

  exportCSV(type) {
    let csv = '';
    if (type === 'timesheets') {
      csv = 'ID,Driver,Date,StartTime,EndTime,Breaks(min),Mileage,Diesel(L),Diesel_Odo,AdBlue(L),AdBlue_Odo,NightOut,NightOutLocation,Status\n';
      App.data.timesheets.forEach(t => {
        const d = App.getDriver(t.driverId);
        csv += `${t.id},"${d?.name||'Unknown'}",${t.date},${t.start},${t.end||''},${t.breaks},${t.mileage},${t.dieselAdded||0},${t.dieselMileage||0},${t.adBlueAdded||0},${t.adBlueMileage||0},${t.nightOut?'Yes':'No'},"${t.nightOutLocation||''}",${t.status}\n`;
      });
    } else if (type === 'defects') {
      csv = 'ID,Driver,Vehicle,Date,Category,Severity,Description,Status\n';
      App.data.defects.forEach(d => {
        const dr = App.getDriver(d.driverId);
        csv += `${d.id},"${dr?.name||'Unknown'}",${d.vehicle},${d.date},${d.category},${d.severity},"${d.description}",${d.status}\n`;
      });
    } else if (type === 'pods') {
      csv = 'ID,Driver,Date,Recipient,Location,Notes,Status\n';
      App.data.pods.forEach(p => {
        const d = App.getDriver(p.driverId);
        csv += `${p.id},"${d?.name||'Unknown'}",${p.date},"${p.recipient}","${p.location}","${p.notes}",${p.status}\n`;
      });
    } else {
      const sections = [
        { name: 'TIMESHEETS', headers: ['ID','Driver','Date','StartTime','EndTime','Breaks(min)','Mileage','Diesel(L)','Diesel_Odo','AdBlue(L)','AdBlue_Odo','NightOut','NightOutLocation','Status'],
          rows: App.data.timesheets.map(t => [t.id||'',App.getDriver(t.driverId)?.name||'',t.date||'',t.start||'',t.end||'',t.breaks||0,t.mileage||0,t.dieselAdded||0,t.dieselMileage||0,t.adBlueAdded||0,t.adBlueMileage||0,t.nightOut?'Yes':'No',t.nightOutLocation||'',t.status||'']) },
        { name: 'DEFECTS', headers: ['ID','Driver','Vehicle','Date','Category','Severity','Description','Status'],
          rows: App.data.defects.map(d => [d.id||'',App.getDriver(d.driverId)?.name||'',d.vehicle||'',d.date||'',d.category||'',d.severity||'',d.description||'',d.status||'']) },
        { name: 'PODS', headers: ['ID','Driver','Date','Recipient','Location','Notes','Status'],
          rows: App.data.pods.map(p => [p.id||'',App.getDriver(p.driverId)?.name||'',p.date||'',p.recipient||'',p.location||'',p.notes||'',p.status||'']) },
      ];
      csv = 'G. & M. Hartshorne Ltd — Fleet Data Export\n\n';
      sections.forEach(s => {
        csv += `--- ${s.name} ---\n${s.headers.join(',')}\n`;
        s.rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
        csv += '\n';
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gmh_export_${type||'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('Export downloaded', 'success');
  },
};
