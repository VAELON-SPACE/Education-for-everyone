// RocketLab — Pages | Viren Singh 2026
const Pages = (() => {

  function dashboard() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Mission <span>Control</span></div><div class="ps">Real-time launch operations center — RocketLab v1.0 · Viren Singh 2026</div></div>
      <div class="pa"><button class="btn btn-o" onclick="App.go('architecture')">⬡ Design Rocket</button><button class="btn btn-p" onclick="App.go('launch-sim')">▶ Launch Now</button></div></div>

      <div class="card sec" style="background:linear-gradient(135deg,rgba(224,92,26,.08),rgba(0,212,255,.04))">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div>
            <div style="font-family:var(--fm);font-size:10px;letter-spacing:3px;color:var(--text3);margin-bottom:8px">ACTIVE VEHICLE</div>
            <div style="font-size:28px;font-weight:700;color:var(--text)" id="active-vehicle-name">Falcon 9 Block 5</div>
            <div style="font-family:var(--fm);font-size:11px;color:var(--text2);margin-top:4px" id="active-vehicle-desc">Two-stage partially reusable orbital launch vehicle</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap" id="vehicle-quick-stats"></div>
          <button class="btn btn-o" onclick="App.go('architecture')">Change Vehicle</button>
        </div>
      </div>

      <div class="g4 sec" id="dash-kpis"></div>

      <div class="g2 sec">
        <div class="card"><div class="ct">Trajectory <b>Preview</b></div><div class="cw" style="height:220px"><canvas id="dash-traj"></canvas></div></div>
        <div class="card"><div class="ct">Delta-V <b>Budget</b> — Moon Mission</div><div class="cw" style="height:220px"><canvas id="dash-dv"></canvas></div></div>
      </div>

      <div class="g3 sec">
        <div class="card"><div class="ct">Mission <b>Log</b></div><div class="logc" id="dash-log"></div></div>
        <div class="card"><div class="ct">Propulsion <b>Status</b></div><div id="prop-status"></div></div>
        <div class="card"><div class="ct">Structural <b>Health</b></div><div id="struct-health"></div></div>
      </div>

      <div class="card sec"><div class="ct">Solar System <b>Destinations</b></div>
        <div class="cw" style="height:200px"><canvas id="dash-solar"></canvas></div>
      </div>
    </div>`;
  }

  function architecture() {
    const rockets = RocketData.rockets;
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Rocket <span>Architecture</span></div><div class="ps">Select and configure your launch vehicle — all specifications from real engineering data</div></div></div>

      <div class="sec-lbl" style="font-family:var(--fm);font-size:9px;letter-spacing:3px;color:var(--text3);margin-bottom:12px">SELECT VEHICLE</div>
      <div class="g3 sec" id="rocket-selector">
        ${Object.entries(rockets).map(([id,r])=>`
        <div class="card" style="cursor:pointer;transition:all .2s" onclick="App.selectRocket('${id}')" id="rcard-${id}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div><div style="font-size:15px;font-weight:700;color:var(--text)">${r.name}</div>
            <div style="font-family:var(--fm);font-size:9px;color:var(--text3);margin-top:2px">${r.manufacturer} · ${r.country}</div></div>
            <span class="badge ${r.firstFlight>='2020'?'bg':'bo'}">${r.firstFlight>='2020'?'Modern':'Classic'}</span>
          </div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:12px">${r.description}</div>
          <div class="g2" style="gap:8px">
            <div><div style="font-family:var(--fm);font-size:9px;color:var(--text3)">LEO PAYLOAD</div><div style="font-family:var(--fm);font-size:13px;color:var(--orange)">${(r.payload_leo_kg/1000).toFixed(0)}t</div></div>
            <div><div style="font-family:var(--fm);font-size:9px;color:var(--text3)">LIFTOFF MASS</div><div style="font-family:var(--fm);font-size:13px;color:var(--cyan)">${(r.liftoff_mass_kg/1000).toFixed(0)}t</div></div>
            <div><div style="font-family:var(--fm);font-size:9px;color:var(--text3)">HEIGHT</div><div style="font-family:var(--fm);font-size:13px;color:var(--amber)">${r.height_m}m</div></div>
            <div><div style="font-family:var(--fm);font-size:9px;color:var(--text3)">SUCCESS</div><div style="font-family:var(--fm);font-size:13px;color:var(--green)">${(r.successRate*100).toFixed(1)}%</div></div>
          </div>
        </div>`).join('')}
      </div>

      <div class="card sec" id="rocket-detail" style="display:none">
        <div class="ct">Vehicle <b>Architecture</b></div>
        <div class="g2">
          <div id="stage-breakdown"></div>
          <div>
            <div class="ct">Stage <b>Specifications</b></div>
            <div style="overflow-x:auto"><table class="tbl" id="stage-specs-tbl"></table></div>
          </div>
        </div>
      </div>

      <div class="card sec" id="rocket-perf" style="display:none">
        <div class="ct">Performance <b>Envelope</b></div>
        <div class="g2"><div class="cw" style="height:200px"><canvas id="perf-chart"></canvas></div>
        <div id="perf-params"></div></div>
      </div>
    </div>`;
  }

  function propulsion() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Propulsion <span>Systems</span></div><div class="ps">Real engine database with thermodynamic performance analysis</div></div></div>
      <div class="tabs">
        <div class="tab active" onclick="App.tab(this,'prop-db')">Engine Database</div>
        <div class="tab" onclick="App.tab(this,'prop-nozzle')">Nozzle Design</div>
        <div class="tab" onclick="App.tab(this,'prop-compare')">Comparison</div>
        <div class="tab" onclick="App.tab(this,'prop-calc')">Isp Calculator</div>
      </div>
      <div class="tp active" id="tab-prop-db">
        <div style="overflow-x:auto"><table class="tbl" id="engine-tbl">
          <thead><tr><th>Engine</th><th>Vehicle</th><th>Thrust (kN)</th><th>Isp Vac (s)</th><th>Isp SL (s)</th><th>Propellant</th><th>Cycle</th><th>Pc (bar)</th><th>Mass (kg)</th><th>Status</th></tr></thead>
          <tbody>${RocketData.engines.map(e=>`<tr>
            <td style="color:var(--orange);font-weight:600">${e.name}</td>
            <td style="color:var(--text2)">${e.vehicle}</td>
            <td style="font-family:var(--fm);color:var(--cyan)">${e.thrust_kN.toLocaleString()}</td>
            <td style="font-family:var(--fm);color:var(--green)">${e.isp_vac}</td>
            <td style="font-family:var(--fm);color:var(--amber)">${e.isp_sl||'—'}</td>
            <td><span class="badge b-">${e.propellant}</span></td>
            <td style="font-size:11px;color:var(--text3)">${e.cycles}</td>
            <td style="font-family:var(--fm)">${e.Pc_bar}</td>
            <td style="font-family:var(--fm)">${e.mass_kg.toLocaleString()}</td>
            <td><span class="badge ${e.status==='active'?'bg':'b-'}">${e.status}</span></td>
          </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="tp" id="tab-prop-nozzle">
        <div class="g2">
          <div class="card"><div class="ct">Nozzle <b>Parameters</b></div>
            <div class="fg"><label>Chamber Pressure (bar)</label><input type="range" min="20" max="350" value="100" id="pc-range" oninput="document.getElementById('pc-lbl').textContent=this.value;App.calcNozzle()"/><span style="font-family:var(--fm);font-size:11px;color:var(--orange)" id="pc-lbl">100</span> bar</div>
            <div class="fg"><label>Exit Pressure (Pa)</label><select class="sel" id="pe-sel" onchange="App.calcNozzle()"><option value="0">Vacuum (0 Pa)</option><option value="101325">Sea Level (101325 Pa)</option><option value="10000">10 km altitude</option></select></div>
            <div class="fg"><label>Area Ratio (Ae/At)</label><input type="range" min="5" max="200" value="40" id="ar-range" oninput="document.getElementById('ar-lbl').textContent=this.value;App.calcNozzle()"/><span style="font-family:var(--fm);font-size:11px;color:var(--orange)" id="ar-lbl">40</span></div>
            <div class="fg"><label>Propellant</label><select class="sel" id="prop-sel" onchange="App.calcNozzle()"><option value="1.2">LH2/LOX (γ=1.2)</option><option value="1.24">RP-1/LOX (γ=1.24)</option><option value="1.19">CH4/LOX (γ=1.19)</option><option value="1.26">UDMH/N2O4 (γ=1.26)</option></select></div>
            <button class="btn btn-p" onclick="App.calcNozzle()" style="width:100%">Calculate Nozzle</button>
          </div>
          <div class="card" id="nozzle-results"><div class="ct">Nozzle <b>Results</b></div><div style="color:var(--text3);font-size:12px;font-family:var(--fm)">Configure parameters and calculate...</div></div>
        </div>
      </div>
      <div class="tp" id="tab-prop-compare">
        <div class="card"><div class="ct">Isp <b>Comparison</b></div><div class="cw" style="height:250px"><canvas id="isp-compare-c"></canvas></div></div>
      </div>
      <div class="tp" id="tab-prop-calc">
        <div class="g2">
          <div class="card"><div class="ct">Tsiolkovsky <b>Calculator</b></div>
            <div class="fg"><label>Specific Impulse (s)</label><input class="inp" type="number" id="tc-isp" value="311" placeholder="311"/></div>
            <div class="fg"><label>Initial Mass (kg)</label><input class="inp" type="number" id="tc-m0" value="549054" placeholder="549054"/></div>
            <div class="fg"><label>Final Mass (kg)</label><input class="inp" type="number" id="tc-mf" value="25600" placeholder="25600"/></div>
            <button class="btn btn-p" onclick="App.calcTsiolkovsky()" style="width:100%;margin-top:4px">▶ Calculate Δv</button>
            <div id="tc-result" style="margin-top:16px"></div>
          </div>
          <div class="card"><div class="ct">Multi-Stage <b>Δv</b></div>
            <div id="ms-stages">
              ${[{isp:282,m0:421300,mf:25600,n:'Stage 1'},{isp:348,m0:111500,mf:4000,n:'Stage 2'}].map((s,i)=>`
              <div style="padding:12px;background:var(--surface2);border-radius:6px;border:1px solid var(--border);margin-bottom:8px">
                <div style="font-family:var(--fm);font-size:10px;color:var(--orange);margin-bottom:8px">${s.n}</div>
                <div class="g3" style="gap:8px">
                  <div class="fg" style="margin:0"><label>Isp (s)</label><input class="inp" type="number" value="${s.isp}" id="ms-isp-${i}" style="padding:6px 8px"/></div>
                  <div class="fg" style="margin:0"><label>m₀ (kg)</label><input class="inp" type="number" value="${s.m0}" id="ms-m0-${i}" style="padding:6px 8px"/></div>
                  <div class="fg" style="margin:0"><label>mf (kg)</label><input class="inp" type="number" value="${s.mf}" id="ms-mf-${i}" style="padding:6px 8px"/></div>
                </div>
              </div>`).join('')}
            </div>
            <button class="btn btn-o" onclick="App.calcMultiStage()" style="width:100%">Calculate Total Δv</button>
            <div id="ms-result" style="margin-top:14px"></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function structures() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Structural <span>Analysis</span></div><div class="ps">FEM-based stress analysis, load cases, and safety factors</div></div>
      <div class="pa"><button class="btn btn-p" onclick="App.runStructural()">▶ Run Analysis</button></div></div>
      <div class="g2 sec">
        <div class="card"><div class="ct">Load <b>Parameters</b></div>
          <div class="fg"><label>Max-Q Dynamic Pressure (Pa)</label><input class="inp" type="number" id="str-maxq" value="35000"/></div>
          <div class="fg"><label>Max Thrust Load (kN)</label><input class="inp" type="number" id="str-thrust" value="7607"/></div>
          <div class="fg"><label>Safety Factor</label><select class="sel" id="str-sf"><option value="1.25">1.25 (Flight)</option><option value="1.4">1.4 (Standard)</option><option value="2.0">2.0 (Conservative)</option></select></div>
          <div class="fg"><label>Temperature (°C)</label><input class="inp" type="number" id="str-temp" value="120"/></div>
          <button class="btn btn-p" onclick="App.runStructural()" style="width:100%;margin-top:4px">Run FEM Analysis</button>
        </div>
        <div class="card"><div class="ct">Stress <b>Summary</b></div><div id="stress-summary"></div></div>
      </div>
      <div class="card sec"><div class="ct">Component <b>Stress Ratios</b> (σ/σ_allowable × 100%)</div><div class="cw" style="height:220px"><canvas id="stress-chart-c"></canvas></div></div>
      <div class="card sec"><div class="ct">Materials <b>Database</b></div>
        <div style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>Material</th><th>Density (kg/m³)</th><th>Yield (MPa)</th><th>UTS (MPa)</th><th>Max Temp (°C)</th><th>Application</th><th>Cost</th></tr></thead>
          <tbody>${RocketData.materials.map(m=>`<tr>
            <td style="color:var(--orange);font-weight:600">${m.name}</td>
            <td style="font-family:var(--fm)">${m.density}</td>
            <td style="font-family:var(--fm);color:var(--cyan)">${m.yield_MPa}</td>
            <td style="font-family:var(--fm);color:var(--green)">${m.UTS_MPa}</td>
            <td style="font-family:var(--fm);color:${m.temp_max_C>500?'var(--amber)':'var(--text2)'}">${m.temp_max_C}</td>
            <td style="font-size:11px;color:var(--text2)">${m.use}</td>
            <td>${m.cost}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>
    </div>`;
  }

  function aerodynamics() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Aero<span>dynamics</span></div><div class="ps">Drag, lift, stability analysis across Mach regimes</div></div></div>
      <div class="g3 sec">
        <div class="kpi co"><div class="kl">Cd (Subsonic)</div><div class="kv" id="cd-sub">0.30</div></div>
        <div class="kpi cc"><div class="kl">Cd (Transonic)</div><div class="kv" id="cd-trans">0.45</div></div>
        <div class="kpi ca"><div class="kl">Cd (Supersonic)</div><div class="kv" id="cd-sup">0.22</div></div>
      </div>
      <div class="g2 sec">
        <div class="card"><div class="ct">Drag <b>vs Mach</b></div><div class="cw" style="height:220px"><canvas id="drag-mach-c"></canvas></div></div>
        <div class="card"><div class="ct">Dynamic Pressure <b>vs Altitude</b></div><div class="cw" style="height:220px"><canvas id="q-alt-c"></canvas></div></div>
      </div>
      <div class="g2 sec">
        <div class="card"><div class="ct">Atmosphere <b>Profile</b></div>
          <div style="overflow-x:auto"><table class="tbl" id="atm-tbl">
            <thead><tr><th>Alt (km)</th><th>T (K)</th><th>P (Pa)</th><th>Density (kg/m³)</th><th>Sound Speed (m/s)</th></tr></thead>
            <tbody id="atm-tbody"></tbody>
          </table></div>
        </div>
        <div class="card"><div class="ct">Stability <b>Analysis</b></div>
          <div id="stability-info"></div>
          <div class="fg" style="margin-top:14px"><label>Caliber (body diameters)</label><input type="range" min="0.5" max="5" step="0.1" value="2" id="cal-range" oninput="App.updateStability()"/><span style="font-family:var(--fm);font-size:11px;color:var(--orange)" id="cal-lbl">2.0</span> cal</div>
          <div class="fg"><label>Fin Span (m)</label><input class="inp" type="number" value="1.5" id="fin-span" onchange="App.updateStability()"/></div>
          <button class="btn btn-o" onclick="App.updateStability()">Recalculate</button>
        </div>
      </div>
    </div>`;
  }

  function trajectory() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Trajectory <span>Simulation</span></div><div class="ps">Real RK4 integration of equations of motion with atmospheric model</div></div>
      <div class="pa"><button class="btn btn-p" onclick="App.runTrajectory()" id="traj-btn">▶ Simulate</button></div></div>
      <div class="g3 sec">
        <div class="card"><div class="ct">Sim <b>Parameters</b></div>
          <div class="fg"><label>Launch Angle (deg from vertical)</label><input type="range" min="0" max="20" value="0" id="la-range" oninput="document.getElementById('la-lbl').textContent=this.value"/><span style="font-family:var(--fm);font-size:11px;color:var(--orange)" id="la-lbl">0</span>°</div>
          <div class="fg"><label>Target Orbit (km)</label><input class="inp" type="number" value="400" id="tgt-orbit"/></div>
          <div class="fg"><label>Payload Mass (kg)</label><input class="inp" type="number" value="10000" id="payload-mass"/></div>
          <div class="fg"><label>Integration Step (s)</label><select class="sel" id="dt-sel"><option value="0.1">0.1s (High accuracy)</option><option value="0.5" selected>0.5s (Standard)</option><option value="1">1.0s (Fast)</option></select></div>
          <button class="btn btn-p" onclick="App.runTrajectory()" style="width:100%;margin-top:4px">▶ Run Simulation</button>
        </div>
        <div class="card"><div class="ct">Results <b>Summary</b></div><div id="traj-summary"></div></div>
        <div class="card"><div class="ct">Stage <b>Events</b></div><div class="tl" id="traj-events"></div></div>
      </div>
      <div class="card sec"><div class="ct">Trajectory <b>Plot</b> — Altitude vs Downrange</div><div class="cw" style="height:300px"><canvas id="traj-main-c"></canvas></div></div>
      <div class="g2 sec">
        <div class="card"><div class="ct">Velocity <b>Profile</b></div><div class="cw" style="height:190px"><canvas id="vel-prof-c"></canvas></div></div>
        <div class="card"><div class="ct">G-Load & <b>Dynamic Pressure</b></div><div class="cw" style="height:190px"><canvas id="gload-c"></canvas></div></div>
      </div>
    </div>`;
  }

  function missionPlanner() {
    const planets=Physics.bodies;
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Mission <span>Planner</span></div><div class="ps">Select destination, plan delta-v budget, and calculate transit times</div></div></div>
      <div class="sec-lbl" style="font-family:var(--fm);font-size:9px;letter-spacing:3px;color:var(--text3);margin-bottom:12px">SELECT DESTINATION</div>
      <div class="g4 sec" id="planet-grid">
        ${Object.entries(planets).map(([id,p])=>`<div class="planet-card" onclick="App.selectPlanet('${id}')" id="pcard-${id}">
          <div class="planet-icon">${p.icon}</div>
          <div class="planet-name">${p.name}</div>
          <div class="planet-dist">g=${p.g}m/s²</div>
          <div style="font-family:var(--fm);font-size:9px;color:var(--text3);margin-top:3px">${p.dist_km>0?(p.dist_km/1e6).toFixed(1)+'M km away':' Home'}</div>
        </div>`).join('')}
      </div>
      <div class="card sec" id="mission-plan-card" style="display:none">
        <div class="ct">Mission <b>Plan</b></div>
        <div class="g2" id="mission-plan-content"></div>
      </div>
      <div class="card sec" id="dv-card" style="display:none">
        <div class="ct">Delta-V <b>Budget</b></div>
        <div class="cw" style="height:220px"><canvas id="dv-budget-c"></canvas></div>
      </div>
      <div class="card sec" id="orbital-card" style="display:none">
        <div class="ct">Orbital <b>Mechanics</b></div>
        <div class="g3" id="orbital-params"></div>
      </div>
    </div>`;
  }

  function launchSim() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Launch <span>Simulator</span></div><div class="ps">Real-time launch simulation with telemetry, abort detection, and stage events</div></div></div>
      <div class="g2 sec">
        <div>
          <div class="card sec"><div class="ct">Pre-launch <b>Checklist</b></div><div id="checklist" style="font-family:var(--fm);font-size:12px;line-height:2.2"></div></div>
          <div class="card">
            <div style="text-align:center;margin-bottom:14px">
              <div style="font-family:var(--fm);font-size:10px;color:var(--text3);letter-spacing:3px;margin-bottom:8px">T-MINUS COUNTDOWN</div>
              <div style="font-size:48px;font-weight:700;color:var(--orange);font-family:var(--fm)" id="countdown">T-10:00</div>
            </div>
            <div style="display:flex;gap:8px;justify-content:center">
              <button class="btn btn-p" onclick="App.startLaunch()" id="launch-btn" style="padding:12px 28px;font-size:15px">🚀 LAUNCH</button>
              <button class="btn btn-r" onclick="App.abortLaunch()" id="abort-btn" disabled>⚠ ABORT</button>
            </div>
          </div>
        </div>
        <div>
          <canvas id="launch-canvas" height="380"></canvas>
          <div class="card" style="margin-top:14px"><div class="ct">Live <b>Telemetry</b></div><div class="cw" style="height:120px"><canvas id="telem-canvas"></canvas></div></div>
        </div>
      </div>
      <div class="g3 sec">
        <div class="card"><div class="ct">Mission <b>Events</b></div><div class="tl" id="launch-events"></div></div>
        <div class="card"><div class="ct">Engine <b>Performance</b></div><div class="cw" style="height:180px"><canvas id="eng-perf-c"></canvas></div></div>
        <div class="card"><div class="ct">Launch <b>Log</b></div><div class="logc" id="launch-log"></div></div>
      </div>
    </div>`;
  }

  function stressAnalysis() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Stress & <span>Failure Analysis</span></div><div class="ps">Monte Carlo failure probability, fatigue analysis, and FMEA</div></div>
      <div class="pa"><button class="btn btn-p" onclick="App.runFailureAnalysis()">▶ Run Analysis</button></div></div>
      <div class="g4 sec" id="fail-kpis"></div>
      <div class="g2 sec">
        <div class="card"><div class="ct">Failure <b>Probability</b> — Monte Carlo (n=1000)</div>
          <div id="fail-meter-wrap" style="margin-bottom:16px"></div>
          <div id="fail-modes"></div>
        </div>
        <div class="card"><div class="ct">Failure Mode <b>Distribution</b></div><div class="cw" style="height:220px"><canvas id="fail-dist-c"></canvas></div></div>
      </div>
      <div class="card sec"><div class="ct">FMEA — Failure Mode & <b>Effects Analysis</b></div>
        <div style="overflow-x:auto"><table class="tbl" id="fmea-tbl">
          <thead><tr><th>Subsystem</th><th>Failure Mode</th><th>Effect</th><th>Severity</th><th>Probability</th><th>Detection</th><th>RPN</th></tr></thead>
          <tbody id="fmea-tbody"></tbody>
        </table></div>
      </div>
      <div class="card sec"><div class="ct">Reliability <b>Block Diagram</b></div><div id="rbd"></div></div>
    </div>`;
  }

  function solarSystem() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Solar System <span>Map</span></div><div class="ps">Interactive solar system with Hohmann transfer calculations</div></div></div>
      <div class="card sec"><div class="ct">Solar System <b>Navigation</b></div><div class="cw" style="height:280px"><canvas id="solar-main-c"></canvas></div></div>
      <div class="g4 sec" id="planet-stats"></div>
      <div class="card sec"><div class="ct">Hohmann Transfer <b>Calculator</b></div>
        <div class="g3">
          <div class="fg"><label>Origin Orbit (km from Sun)</label><select class="sel" id="ho-origin"><option value="149600000">Earth (1 AU)</option><option value="228000000">Mars</option><option value="108200000">Venus</option></select></div>
          <div class="fg"><label>Destination Orbit (km from Sun)</label><select class="sel" id="ho-dest"><option value="228000000">Mars</option><option value="778500000">Jupiter</option><option value="57900000">Mercury</option><option value="1432000000">Saturn</option></select></div>
          <button class="btn btn-p" onclick="App.calcHohmann()" style="align-self:flex-end;margin-bottom:14px">Calculate Transfer</button>
        </div>
        <div id="hohmann-result"></div>
      </div>
    </div>`;
  }

  function deltaV() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Delta-V <span>Budget</span></div><div class="ps">Complete Δv map from Earth to any destination in the solar system</div></div></div>
      <div class="card sec"><div class="ct">Δv <b>Map</b> — Earth to Destinations</div><div class="cw" style="height:250px"><canvas id="dv-map-c"></canvas></div></div>
      <div class="g2 sec">
        <div class="card"><div class="ct">Destination <b>Requirements</b></div>
          <div style="overflow-x:auto"><table class="tbl">
            <thead><tr><th>Destination</th><th>Launch Δv</th><th>Transfer Δv</th><th>Insertion Δv</th><th>Total</th><th>Transit</th></tr></thead>
            <tbody>${[
              {d:'LEO (400km)',l:9400,tr:0,ins:0,tot:9400,t:'—'},
              {d:'GEO (35786km)',l:9400,tr:2440,ins:1500,tot:13340,t:'~9h'},
              {d:'Moon',l:9400,tr:3150,ins:900,tot:13450,t:'3 days'},
              {d:'Mars',l:9400,tr:3600,ins:900,tot:13900,t:'259 days'},
              {d:'Venus',l:9400,tr:3500,ins:350,tot:13250,t:'145 days'},
              {d:'Jupiter',l:9400,tr:6300,ins:900,tot:16600,t:'~2.7 yrs'},
              {d:'Saturn',l:9400,tr:7000,ins:600,tot:17000,t:'~6 yrs'},
              {d:'Mercury',l:9400,tr:7500,ins:2000,tot:18900,t:'~3.5 yrs'},
            ].map(r=>`<tr>
              <td style="color:var(--orange);font-weight:600">${r.d}</td>
              <td style="font-family:var(--fm);color:var(--cyan)">${r.l.toLocaleString()}</td>
              <td style="font-family:var(--fm);color:var(--green)">${r.tr.toLocaleString()}</td>
              <td style="font-family:var(--fm);color:var(--amber)">${r.ins.toLocaleString()}</td>
              <td style="font-family:var(--fm);color:var(--text);font-weight:700">${r.tot.toLocaleString()} m/s</td>
              <td style="color:var(--text3)">${r.t}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="card"><div class="ct">Rocket <b>Capability</b> vs Requirement</div><div id="rocket-capability"></div></div>
      </div>
    </div>`;
  }

  function reentry() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Re-entry <span>Physics</span></div><div class="ps">Thermal analysis, deceleration loads, and heat shield sizing</div></div>
      <div class="pa"><button class="btn btn-p" onclick="App.calcReentry()">▶ Calculate</button></div></div>
      <div class="g2 sec">
        <div class="card"><div class="ct">Re-entry <b>Parameters</b></div>
          <div class="fg"><label>Entry Velocity (m/s)</label><input class="inp" type="number" id="re-vel" value="7800" placeholder="7800"/></div>
          <div class="fg"><label>Entry Angle (deg)</label><input type="range" min="1" max="20" value="6" id="re-angle" oninput="document.getElementById('re-angle-lbl').textContent=this.value"/><span style="font-family:var(--fm);font-size:11px;color:var(--orange)" id="re-angle-lbl">6</span>°</div>
          <div class="fg"><label>Nose Radius (m)</label><input class="inp" type="number" id="re-nose" value="0.5" step="0.1"/></div>
          <div class="fg"><label>Vehicle Type</label><select class="sel" id="re-type"><option>Capsule (blunt body)</option><option>Lifting body</option><option>Winged (Space Shuttle)</option><option>Slender body</option></select></div>
          <button class="btn btn-p" onclick="App.calcReentry()" style="width:100%;margin-top:4px">Calculate Heating</button>
        </div>
        <div class="card" id="reentry-results"><div class="ct">Heating <b>Results</b></div><div style="color:var(--text3);font-size:12px;font-family:var(--fm)">Configure parameters above...</div></div>
      </div>
      <div class="g2 sec">
        <div class="card"><div class="ct">Heating <b>Profile</b></div><div class="cw" style="height:200px"><canvas id="heat-profile-c"></canvas></div></div>
        <div class="card"><div class="ct">Deceleration <b>G-Load</b></div><div class="cw" style="height:200px"><canvas id="decel-c"></canvas></div></div>
      </div>
    </div>`;
  }

  function enginesDb() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Engine <span>Database</span></div><div class="ps">Comprehensive database of real rocket engines with thermodynamic analysis</div></div></div>
      <div class="g4 sec">
        ${[{l:'Total Engines',v:RocketData.engines.length,c:'co'},{l:'Active Engines',v:RocketData.engines.filter(e=>e.status==='active').length,c:'cg'},{l:'Max Thrust (kN)',v:RocketData.engines.reduce((a,e)=>Math.max(a,e.thrust_kN),0).toLocaleString(),c:'cc'},{l:'Max Isp (s)',v:RocketData.engines.reduce((a,e)=>Math.max(a,e.isp_vac),0),c:'ca'}]
          .map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv">${k.v}</div></div>`).join('')}
      </div>
      <div class="card sec"><div class="ct">Thrust <b>vs Isp</b> — All Engines</div><div class="cw" style="height:240px"><canvas id="eng-db-c"></canvas></div></div>
      <div class="card sec"><div class="ct">Top Engines by <b>Isp (Vacuum)</b></div>
        <div class="cw" style="height:220px"><canvas id="top-isp-c"></canvas></div>
      </div>
    </div>`;
  }

  function materials() {
    return `<div class="page-in">
      <div class="ph"><div><div class="pt">Materials <span>Lab</span></div><div class="ps">Aerospace materials database with mechanical and thermal properties</div></div></div>
      <div class="card sec"><div class="ct">Specific Strength <b>Comparison</b> (Yield MPa / Density)</div><div class="cw" style="height:220px"><canvas id="mat-str-c"></canvas></div></div>
      <div class="card sec"><div class="ct">Materials <b>Database</b></div>
        <div style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>Material</th><th>Density</th><th>Yield (MPa)</th><th>UTS (MPa)</th><th>Spec Strength</th><th>Max Temp (°C)</th><th>Application</th></tr></thead>
          <tbody>${RocketData.materials.map(m=>`<tr>
            <td style="color:var(--orange);font-weight:600">${m.name}</td>
            <td style="font-family:var(--fm)">${m.density}</td>
            <td style="font-family:var(--fm);color:var(--cyan)">${m.yield_MPa}</td>
            <td style="font-family:var(--fm);color:var(--green)">${m.UTS_MPa}</td>
            <td style="font-family:var(--fm);color:var(--amber)">${(m.yield_MPa/m.density*1000).toFixed(0)}</td>
            <td style="color:${m.temp_max_C>500?'var(--orange)':'var(--text2)'}">${m.temp_max_C}°C</td>
            <td style="font-size:11px;color:var(--text2)">${m.use}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>
    </div>`;
  }

  function about() {
    return `<div class="page-in">
      <div class="about-hero">
        <div class="about-title">ROCKET<span>LAB</span></div>
        <div class="about-tag">Advanced Aerospace Engineering Platform · Viren Singh · 2026</div>
        <div class="g3" style="max-width:600px;margin:0 auto 28px;gap:14px">
          ${[{v:'v1.0',l:'Release'},{v:'2026',l:'Founded'},{v:'14',l:'Modules'},{v:'100%',l:'Physics'}].slice(0,3)
            .map(s=>`<div class="kpi co" style="text-align:center"><div class="kv" style="font-size:20px">${s.v}</div><div class="kl">${s.l}</div></div>`).join('')}
        </div>
      </div>
      <div class="creator-card">
        <div class="creator-name">Viren Singh</div>
        <div class="creator-role">Creator & Lead Engineer · RocketLab Platform · 2026</div>
        <div class="creator-bio">Viren Singh is an aerospace engineer and software developer who built RocketLab as a comprehensive platform for rocket design, simulation, and mission planning. The platform implements real physics — from the Tsiolkovsky rocket equation and RK4 trajectory integration to the NRLMSISE-00 atmospheric model and Newton-Raphson nozzle design — all running in the browser with zero backend dependencies.<br><br>RocketLab was designed to bridge the gap between academic aerospace engineering and practical mission planning, making real rocket science accessible to engineers, students, and space enthusiasts worldwide.</div>
      </div>
      <div class="g3 sec" style="max-width:780px;margin:0 auto 26px">
        ${[{n:'Physics Engine',v:'RK4, Tsiolkovsky, NRLMSISE-00 atm'},{n:'Trajectory Sim',v:'Full gravity-turn integration'},{n:'Structural FEM',v:'Stress ratios & safety factors'},{n:'Failure Analysis',v:'Monte Carlo, FMEA, RBD'},{n:'Mission Planning',v:'Hohmann transfers, Δv budget'},{n:'Engine Database',v:'12 real engines with thermodynamics'}]
          .map(c=>`<div class="card" style="text-align:center"><div style="font-size:13px;font-weight:600;color:var(--text)">${c.n}</div><div style="font-family:var(--fm);font-size:10px;color:var(--text3);margin-top:4px">${c.v}</div></div>`).join('')}
      </div>
      <div class="dev-notes">
        <div class="dn-t">// Developer Notes — Viren Singh</div>
        <p><span class="hi">v1.0.0</span> — <span class="mu">2026</span></p>
        <p>The trajectory simulation uses a 4th-order Runge-Kutta integrator with a piecewise atmosphere model based on the ISA (International Standard Atmosphere) up to 86km and a simplified thermosphere above. The gravity model accounts for altitude-dependent g variation.</p>
        <p><span class="hi">Nozzle design</span> uses the compressible flow relations with isentropic expansion. The thrust coefficient Cf accounts for both momentum and pressure thrust terms. Real engine data is sourced from publicly available specifications.</p>
        <p><span class="hi">Failure probability</span> uses Monte Carlo simulation with independent failure modes. Real-world engine reliability figures are based on published flight histories.</p>
        <p><span class="hi">Delta-v values</span> are computed using Hohmann transfer orbit mechanics with patched-conic approximations for interplanetary missions. Atmospheric entry/exit Δv penalties are included.</p>
        <p><span class="hi">Known limitations:</span> The trajectory sim assumes a non-rotating spherical Earth. Real missions require accounting for Earth's rotation (launch azimuth), J2 perturbations, and solar radiation pressure for long missions.</p>
        <p><span class="hi">Re-entry heating</span> uses the Sutton-Graves correlation for stagnation point heat flux — appropriate for engineering estimates but not CFD-level accuracy.</p>
        <p class="mu">— Viren Singh, Creator, RocketLab · 2026</p>
        <p class="mu">// "Space is hard. But understanding it shouldn't be." — VS</p>
      </div>
    </div>`;
  }

  const secLbl = `<div style="font-family:var(--fm);font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--text3);margin-bottom:8px">`;

  return { dashboard, architecture, propulsion, structures, aerodynamics, trajectory, missionPlanner, launchSim, stressAnalysis, solarSystem, deltaV, reentry, enginesDb, materials, about };
})();
