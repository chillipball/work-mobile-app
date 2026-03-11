import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the renderVehicleLink method
old_method_start = '  renderVehicleLink() {'
old_method_end = "  },\n\n  // ============================================================\n  // TIMESHEETS"

start_idx = content.find(old_method_start)
end_marker = "  },\n\n  // ============================================================\n  // TIMESHEETS"
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("ERROR: Could not find renderVehicleLink method")
    exit(1)

# The text to replace is from start_idx to end_idx + len("  },\n") 
old_section = content[start_idx:end_idx + len('  },')]
print(f"Found method at chars {start_idx}-{end_idx}, length={len(old_section)}")

new_method = r"""  renderVehicleLink() {
    const u = this.state.user;
    const trailerItems = [
      { id: 1, label: 'Trailer Lights (markers, rear, indicators)' },
      { id: 2, label: 'Coupling / King Pin / Turntable' },
      { id: 3, label: 'Landing Legs / Stands' },
      { id: 4, label: 'Tyres & Wheel Nuts' },
      { id: 5, label: 'Body / Curtains / Sheeting' },
      { id: 6, label: 'Straps, Ratchets & Lashing Points' },
      { id: 7, label: 'Rear Doors, Pins & Locking Bars' },
      { id: 8, label: 'Mud Flaps & Spray Suppressants' },
      { id: 9, label: 'Reflectors & Marker Boards' },
      { id: 10, label: 'Air Lines / Brake Lines / Electrical Lines' },
      { id: 11, label: 'Underrun Bars (front & rear)' },
      { id: 12, label: 'Load Restraint Equipment' },
    ];
    return `
      <h1 class="screen-title">Vehicle & Trailer</h1>
      <p class="screen-subtitle">Select your tractor unit and trailer for today</p>
      
      <div class="card mb-lg">
        <label style="display:block;margin-bottom:8px;font-size:var(--text-sm);font-weight:500;color:var(--text-secondary)">Linked Trailer ID</label>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-input" id="link-trailer-input" placeholder="e.g. TR-240" value="${u.trailer || ''}" style="margin-bottom:0;" />
          <button class="btn btn-primary" id="btn-save-trailer" style="white-space:nowrap">Save Trailer</button>
        </div>
        <div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid rgba(255,255,255,0.08)">
          <label style="display:flex;align-items:center;gap:12px;cursor:pointer">
            <input type="checkbox" id="chk-trailer-changed" style="width:24px;height:24px;accent-color:var(--accent);flex-shrink:0" />
            <div>
              <div style="font-weight:600;font-size:var(--text-sm)">Trailer Changed</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted)">Tick to complete a trailer defect inspection</div>
            </div>
          </label>
        </div>
      </div>

      <div id="trailer-defect-section" class="hidden">
        <div class="card mb-lg" style="border-left:3px solid var(--accent)">
          <div class="flex gap-md" style="align-items:center">
            <span class="material-icons-round text-accent">rv_hookup</span>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">Check all trailer items. <strong>Tick only if a defect is found.</strong> Leave unchecked if OK.</p>
          </div>
        </div>
        <div class="section-header"><span class="section-title">Trailer Check</span><span class="section-title" style="font-size:var(--text-xs)">&#10003; Tick if defect</span></div>
        <div class="list-card mb-lg">
          ${trailerItems.map(item => `
            <div class="list-item walkaround-item" id="trl-row-${item.id}" style="flex-wrap:wrap">
              <span style="font-size:var(--text-sm);font-weight:600;color:var(--text-muted);width:28px;flex-shrink:0">${item.id}.</span>
              <div class="list-item-content" style="flex:1;min-width:150px"><div class="list-item-title" style="font-size:var(--text-sm)">${item.label}</div></div>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0">
                <input type="checkbox" class="trl-check" data-id="${item.id}" style="width:22px;height:22px;accent-color:var(--danger);cursor:pointer" />
                <span style="font-size:var(--text-xs);color:var(--text-muted)">Defect</span>
              </label>
              <div class="wa-notes-wrap hidden" data-trl-notes-for="${item.id}" style="width:100%;margin-top:var(--space-sm);padding-left:36px">
                <input type="text" class="form-input trl-notes" data-trl-notes-id="${item.id}" placeholder="Describe the defect..." style="font-size:var(--text-sm)" />
              </div>
            </div>
          `).join('')}
          <div class="list-item" style="background:var(--success-bg)">
            <span style="font-size:var(--text-sm);font-weight:600;color:var(--text-muted);width:28px">&#10003;</span>
            <div class="list-item-content"><div class="list-item-title" style="font-size:var(--text-sm);color:var(--success)">NIL DEFECT &#8212; Trailer OK</div></div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="trl-nil-defect" style="width:22px;height:22px;accent-color:var(--success);cursor:pointer" />
              <span style="font-size:var(--text-xs);color:var(--success)">All OK</span>
            </label>
          </div>
        </div>
        <div class="card mb-lg">
          <div class="card-header"><span class="card-title">Trailer Inspection Sign-Off</span></div>
          <div class="form-group"><label>Additional Notes</label><textarea class="form-input" id="trl-additional" placeholder="Any other trailer issues or comments..."></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Reported To</label><input type="text" class="form-input" id="trl-reported-to" placeholder="e.g. Office / Workshop" /></div>
            <div class="form-group"><label>Driver's Signature</label><input type="text" class="form-input" id="trl-signature" placeholder="Type your full name" /></div>
          </div>
        </div>
        <button class="btn btn-primary btn-full mb-lg" id="btn-submit-trailer-check">
          <span class="material-icons-round">rv_hookup</span>Submit Trailer Inspection
        </button>
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
  },"""

new_content = content[:start_idx] + new_method + content[end_idx + len('  },'):]

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"SUCCESS: Replaced renderVehicleLink. New file length: {len(new_content)}")
