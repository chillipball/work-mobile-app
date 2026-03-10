/* ============================================================
   GM HARTSHORNE FLEET APP — Admin Portal Screens
   ============================================================ */

const AdminScreens = {
  renderShell() {
    const s = App.state.currentScreen;
    const u = App.state.user;
    const items = [
      { id: 'admin-dashboard', icon: 'dashboard', label: 'Dashboard' },
      { id: 'admin-drivers', icon: 'people', label: 'Drivers' },
      { id: 'admin-timesheets', icon: 'schedule', label: 'Timesheets' },
      { id: 'admin-defects', icon: 'report_problem', label: 'Defects' },
      { id: 'admin-pods', icon: 'inventory', label: 'PODs' },
      { id: 'admin-instructions', icon: 'send', label: 'Send Instructions' },
      { id: 'admin-export', icon: 'download', label: 'Export Data' },
    ];
    const screens = {
      'admin-dashboard': this.renderDashboard(),
      'admin-drivers': this.renderDrivers(),
      'admin-timesheets': this.renderTimesheets(),
      'admin-defects': this.renderDefects(),
      'admin-pods': this.renderPods(),
      'admin-instructions': this.renderInstructions(),
      'admin-export': this.renderExport(),
    };
    return `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <h2>GM<span>H</span> Fleet</h2>
          <p>Office Portal</p>
        </div>
        <nav class="sidebar-nav">
          ${items.map(i => `
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
          <div class="header-right">
            <span style="color:var(--text-secondary);font-size:var(--text-sm)">${u.name}</span>
            <div class="header-avatar">${u.name.charAt(0)}</div>
          </div>
        </header>
        <main class="main-content">
          <div class="screen">${screens[s] || ''}</div>
        </main>
        <nav class="bottom-nav">
          ${items.slice(0, 5).map(i => `
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
              <button class="btn btn-danger btn-sm" data-remove-driver="${d.id}" title="Remove Driver"><span class="material-icons-round" style="font-size:16px">delete</span></button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  },

  addDriver() {
    const name = document.getElementById('new-driver-name').value.trim();
    const pin = document.getElementById('new-driver-pin').value.trim();
    if (!name || pin.length !== 4) { App.toast('Enter a name and 4-digit PIN', 'error'); return; }
    const driver = { id: Date.now(), name, pin, vehicle: null, role: 'driver' };
    App.data.drivers.push(driver);
    this.saveDrivers();
    App.toast(`${name} added as a driver!`, 'success');
    App.render();
  },

  removeDriver(id) {
    const driver = App.getDriver(id);
    if (!driver) return;
    if (!confirm(`Remove ${driver.name}? Their history will be kept.`)) return;
    App.data.drivers = App.data.drivers.filter(d => d.id !== id);
    this.saveDrivers();
    App.toast(`${driver.name} removed`, 'info');
    App.render();
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

  saveDrivers() {
    localStorage.setItem('gmh_drivers', JSON.stringify(App.data.drivers));
  },

  // --- Timesheets View ---
  renderTimesheets() {
    return `
      <h1 class="screen-title">All Timesheets</h1>
      <p class="screen-subtitle">Review and approve driver timesheets</p>
      <div class="card" style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Driver</th><th>Date</th><th>Start</th><th>End</th><th>Breaks</th><th>Mileage</th><th>Status</th></tr></thead>
          <tbody>
            ${App.data.timesheets.map(t => {
              const d = App.getDriver(t.driverId);
              return `<tr>
                <td>${d?.name || 'Unknown'}</td><td>${t.date}</td><td>${t.start}</td><td>${t.end || '—'}</td>
                <td>${t.breaks}min</td><td>${t.mileage}mi</td>
                <td><span class="badge badge-${t.status==='approved'?'success':t.status==='active'?'warning':'info'}">${t.status}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // --- Defects View ---
  renderDefects() {
    return `
      <h1 class="screen-title">Defect Reports</h1>
      <p class="screen-subtitle">All vehicle defect reports</p>
      <div class="card" style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Driver</th><th>Vehicle</th><th>Date</th><th>Category</th><th>Severity</th><th>Description</th><th>Status</th></tr></thead>
          <tbody>
            ${App.data.defects.map(d => {
              const driver = App.getDriver(d.driverId);
              return `<tr>
                <td>${driver?.name || 'Unknown'}</td><td>${d.vehicle}</td><td>${d.date}</td><td>${d.category}</td>
                <td><span class="badge badge-${d.severity==='high'?'danger':d.severity==='medium'?'warning':'info'}">${d.severity}</span></td>
                <td>${d.description}</td>
                <td><span class="badge badge-${d.status==='resolved'?'success':'warning'}">${d.status}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
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

  exportCSV() {
    const sections = [
      { name: 'TIMESHEETS', headers: ['Driver','Date','Start','End','Breaks(min)','Mileage','Status'],
        rows: App.data.timesheets.map(t => [App.getDriver(t.driverId)?.name,t.date,t.start,t.end||'',t.breaks,t.mileage,t.status]) },
      { name: 'DEFECTS', headers: ['Driver','Vehicle','Date','Category','Severity','Description','Status'],
        rows: App.data.defects.map(d => [App.getDriver(d.driverId)?.name,d.vehicle,d.date,d.category,d.severity,d.description,d.status]) },
      { name: 'PODS', headers: ['Driver','Date','Recipient','Location','Notes','Status'],
        rows: App.data.pods.map(p => [App.getDriver(p.driverId)?.name,p.date,p.recipient,p.location,p.notes,p.status]) },
    ];
    let csv = 'G. & M. Hartshorne Ltd — Fleet Data Export\n\n';
    sections.forEach(s => {
      csv += `--- ${s.name} ---\n${s.headers.join(',')}\n`;
      s.rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
      csv += '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gmh-fleet-export-${App.todayStr()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    App.toast('Data exported successfully!', 'success');
  },
};
