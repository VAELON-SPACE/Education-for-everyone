// RocketLab — App Orchestrator | Viren Singh 2026
const App = (() => {

  const routes = {
    'dashboard':      { title:'Mission Control',       render:Pages.dashboard },
    'architecture':   { title:'Rocket Architecture',   render:Pages.architecture },
    'propulsion':     { title:'Propulsion Systems',    render:Pages.propulsion },
    'structures':     { title:'Structural Analysis',   render:Pages.structures },
    'aerodynamics':   { title:'Aerodynamics',          render:Pages.aerodynamics },
    'trajectory':     { title:'Trajectory Simulation', render:Pages.trajectory },
    'mission-planner':{ title:'Mission Planner',       render:Pages.missionPlanner },
    'launch-sim':     { title:'Launch Simulator',      render:Pages.launchSim },
    'stress-analysis':{ title:'Stress & Failure',      render:Pages.stressAnalysis },
    'solar-system':   { title:'Solar System Map',      render:Pages.solarSystem },
    'delta-v':        { title:'Delta-V Budget',        render:Pages.deltaV },
    'reentry':        { title:'Re-entry Physics',      render:Pages.reentry },
    'engines-db':     { title:'Engine Database',       render:Pages.enginesDb },
    'materials':      { title:'Materials Lab',         render:Pages.materials },
    'about':          { title:'About',                 render:Pages.about },
  };

  let currentPage = 'dashboard';
  let launchInterval = null;
  let launchT = 0;
  let activeRocketId = 'falcon9';

  // ============ BOOT ============
  function boot() {
    const canvas = document.getElementById('boot-canvas');
    if (canvas) drawStars(canvas);
    const steps = [
      'Initializing guidance systems...','Loading atmospheric model...',
      'Compiling physics engine...','Mounting trajectory integrator...',
      'Loading engine database...','Calibrating stress solver...',
      'Spinning up mission planner...','All systems nominal. Ready for launch.'
    ];
    let i = 0;
    const bar = document.getElementById('boot-bar');
    const status = document.getElementById('boot-status');
    const iv = setInterval(() => {
      i++;
      if (bar) bar.style.width = (i / steps.length * 100) + '%';
      if (status) status.textContent = steps[i-1] || 'Ready.';
      if (i >= steps.length) {
        clearInterval(iv);
        setTimeout(() => {
          document.getElementById('boot').classList.add('out');
          setTimeout(() => {
            document.getElementById('boot').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
            addStarsBg();
            initApp();
          }, 600);
        }, 400);
      }
    }, 280);
  }

  function drawStars(canvas) {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050608'; ctx.fillRect(0,0,canvas.width,canvas.height);
    for (let i = 0; i < 200; i++) {
      const x = Math.random()*canvas.width, y = Math.random()*canvas.height;
      const r = Math.random()*1.2;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${Math.random()*.7})`; ctx.fill();
    }
  }

  function addStarsBg() {
    const div = document.createElement('div'); div.className = 'stars';
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('div'); s.className = 'star';
      const size = Math.random()*1.5+0.3;
      s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--op:${Math.random()*.4+0.1};--dur:${Math.random()*3+2}s`;
      div.appendChild(s);
    }
    document.body.appendChild(div);
  }

  function initApp() {
    RocketData.state.rocket = RocketData.getRocket(activeRocketId);
    setupNav();
    startMetrics();
    go('dashboard');
    RocketData.addLog('RocketLab Platform v1.0 initialized', 'success');
    RocketData.addLog('Physics engine: RK4 + NRLMSISE-00 atmosphere', 'info');
    RocketData.addLog(`Active vehicle: ${RocketData.state.rocket.name}`, 'info');
  }

  // ============ NAV ============
  function setupNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => go(el.dataset.page));
    });
    const tog = document.getElementById('menu-tog');
    if (tog) tog.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  }

  function go(pageId) {
    if (!routes[pageId]) return;
    currentPage = pageId;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === pageId));
    const bc = document.getElementById('bc'); if (bc) bc.textContent = routes[pageId].title;
    document.getElementById('page-root').innerHTML = routes[pageId].render();
    if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('open');
    setTimeout(() => afterRender(pageId), 60);
  }

  function afterRender(pageId) {
    switch(pageId) {
      case 'dashboard':    renderDashboard(); break;
      case 'propulsion':   renderPropulsion(); break;
      case 'structures':   runStructural(); break;
      case 'aerodynamics': renderAerodynamics(); break;
      case 'trajectory':   break;
      case 'launch-sim':   setupLaunchSim(); break;
      case 'stress-analysis': runFailureAnalysis(); break;
      case 'solar-system': renderSolarSystem(); break;
      case 'delta-v':      renderDeltaVPage(); break;
      case 'engines-db':   renderEnginesDB(); break;
      case 'materials':    renderMaterials(); break;
    }
  }

  function tab(el, id) {
    const page = el.closest('.page-in')||document;
    page.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    page.querySelectorAll('.tp').forEach(p=>p.classList.remove('active'));
    el.classList.add('active');
    const pane = document.getElementById('tab-'+id);
    if (pane) { pane.classList.add('active'); setTimeout(()=>afterTab(id),50); }
  }

  function afterTab(id) {
    if (id==='prop-compare') renderIspCompare();
    if (id==='prop-nozzle') calcNozzle();
  }

  // ============ METRICS ============
  function startMetrics() {
    setInterval(() => {
      const m = RocketData.sysMetrics();
      const simRes = RocketData.state.simResult;
      const altEl = document.getElementById('alt-val');
      const velEl = document.getElementById('vel-val');
      if (altEl && simRes) altEl.textContent = (simRes.maxAlt/1000).toFixed(0);
      if (velEl && simRes) velEl.textContent = simRes.maxVel.toFixed(0);
    }, 2000);
  }

  // ============ TOAST ============
  function toast(msg, type='info', dur=3200) {
    const wrap = document.getElementById('toast-wrap'); if (!wrap) return;
    const icons = {success:'✓',error:'✕',info:'ℹ',warn:'⚠'};
    const t = document.createElement('div'); t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type]}</span> ${msg}`;
    wrap.appendChild(t);
    setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(16px)';t.style.transition='all .3s';setTimeout(()=>t.remove(),300);},dur);
  }

  function renderLog(id) {
    const el = document.getElementById(id); if (!el) return;
    const logs = RocketData.state.logs.slice(0,20);
    el.innerHTML = logs.length
      ? logs.map(l=>`<div class="ll"><span class="lt">${l.ts}</span><span class="${l.level==='success'?'lg':l.level==='warn'?'la':l.level==='error'?'lr':'lc'}">${l.msg}</span></div>`).join('')
      : '<div class="ll"><span class="lt">--:--:--</span><span class="lc">Awaiting telemetry...</span></div>';
  }

  // ============ DASHBOARD ============
  function renderDashboard() {
    const rocket = RocketData.state.rocket || RocketData.getRocket('falcon9');
    const nameEl = document.getElementById('active-vehicle-name');
    const descEl = document.getElementById('active-vehicle-desc');
    if (nameEl) nameEl.textContent = rocket.name;
    if (descEl) descEl.textContent = rocket.description;

    const statsEl = document.getElementById('vehicle-quick-stats');
    if (statsEl) statsEl.innerHTML = [
      {l:'Height',v:rocket.height_m+'m',c:'var(--orange)'},
      {l:'Mass',v:(rocket.liftoff_mass_kg/1000).toFixed(0)+'t',c:'var(--cyan)'},
      {l:'Stages',v:rocket.stages.length,c:'var(--green)'},
      {l:'Cost',v:'$'+rocket.cost_M+'M',c:'var(--amber)'},
    ].map(s=>`<div style="padding:10px 14px;background:var(--surface2);border-radius:6px;border:1px solid var(--border);text-align:center"><div style="font-family:var(--fm);font-size:9px;color:var(--text3);letter-spacing:1.5px">${s.l}</div><div style="font-size:18px;font-weight:700;color:${s.c};font-family:var(--fm)">${s.v}</div></div>`).join('');

    const kpis = document.getElementById('dash-kpis');
    if (kpis) kpis.innerHTML = [
      {l:'LEO Payload',v:(rocket.payload_leo_kg/1000).toFixed(1)+'t',c:'co',d:'Low Earth Orbit'},
      {l:'Moon Payload',v:(rocket.payload_moon_kg/1000).toFixed(1)+'t',c:'cc',d:'Trans-Lunar'},
      {l:'First Flight',v:rocket.firstFlight,c:'ca',d:rocket.manufacturer},
      {l:'Success Rate',v:(rocket.successRate*100).toFixed(1)+'%',c:'cg',d:'Flight history'},
    ].map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv">${k.v}</div><div class="kd">${k.d}</div></div>`).join('');

    // Run quick simulation for preview
    const sim = Physics.simulate(rocket, 1.0);
    RocketData.state.simResult = sim;
    setTimeout(() => RocketCharts.trajectoryChart('dash-traj', sim.trajectory), 80);

    // DV Budget chart
    setTimeout(() => {
      const dvLabels = ['Launch to LEO','TLI','LOI','Landing'];
      const dvVals = [9400, 3150, 900, 1800];
      RocketCharts.barChart('dash-dv', dvLabels, dvVals, {color:'#e05c1a', dec:0});
    }, 100);

    // Solar system
    setTimeout(() => RocketCharts.solarSystemMap('dash-solar', rocket, 'moon'), 120);

    // Propulsion status
    const propEl = document.getElementById('prop-status');
    if (propEl) propEl.innerHTML = rocket.stages.map(s=>{
      const eng = RocketData.engines.find(e=>e.id===s.engineId)||{};
      return `<div class="gauge-row"><span class="gauge-lbl">${s.name}</span><div class="gauge-track"><div class="gauge-fill safe" style="width:${(rocket.engineReliability*100).toFixed(0)}%"></div></div><span class="gauge-val">${(rocket.engineReliability*100).toFixed(1)}%</span></div>`;
    }).join('') + `<div style="font-family:var(--fm);font-size:10px;color:var(--text3);margin-top:8px">Engine reliability based on flight history</div>`;

    // Structural health
    const struct = Physics.structuralAnalysis(rocket);
    const strEl = document.getElementById('struct-health');
    if (strEl) strEl.innerHTML = struct.slice(0,5).map(c=>`<div class="gauge-row"><span class="gauge-lbl">${c.name.substring(0,14)}</span><div class="gauge-track"><div class="gauge-fill ${c.status==='safe'?'safe':c.status==='marginal'?'warn':'crit'}" style="width:${Math.min(100,c.ratio*100).toFixed(0)}%"></div></div><span class="gauge-val badge ${c.status==='safe'?'bg':c.status==='marginal'?'ba':'br'}">${c.status}</span></div>`).join('');

    renderLog('dash-log');
    updateTopBar(sim);
  }

  function updateTopBar(sim) {
    const altEl=document.getElementById('alt-val'),velEl=document.getElementById('vel-val'),gEl=document.getElementById('g-val'),stEl=document.getElementById('status-val');
    if (altEl) altEl.textContent=(sim.maxAlt/1000).toFixed(0);
    if (velEl) velEl.textContent=sim.maxVel.toFixed(0);
    if (gEl) gEl.textContent=(sim.trajectory.reduce((a,b)=>Math.max(a,b.g_load||1),1)).toFixed(1);
    if (stEl) stEl.textContent=sim.burnout?'BURNOUT':'NOMINAL';
  }

  // ============ ROCKET SELECTION ============
  function selectRocket(id) {
    activeRocketId = id;
    RocketData.state.rocket = RocketData.getRocket(id);
    const rocket = RocketData.state.rocket;

    document.querySelectorAll('[id^="rcard-"]').forEach(el => {
      el.style.borderColor = 'var(--border)';
      el.style.background = 'var(--surface)';
    });
    const sel = document.getElementById('rcard-'+id);
    if (sel) { sel.style.borderColor='var(--orange)'; sel.style.background='var(--orange-l)'; }

    const detail = document.getElementById('rocket-detail');
    const perf = document.getElementById('rocket-perf');
    if (detail) detail.style.display='block';
    if (perf) perf.style.display='block';

    // Stage breakdown diagram
    const sbEl = document.getElementById('stage-breakdown');
    if (sbEl) sbEl.innerHTML = `<div class="rocket-diagram">` +
      ['🔭 Payload Fairing','📡 Avionics Bay',...rocket.stages.map((s,i)=>`${'🔵🟡🔴'[i]||'⚙️'} ${s.name}`),'🔥 Engine Section'].map((name,i)=>`
        ${i>0?'<div class="stage-sep"></div>':''}
        <div class="stage-block ${i>=2&&i<2+rocket.stages.length?'sel':''}" style="width:${Math.max(60,100-i*8)}%">
          <div class="stage-icon">${name.split(' ')[0]}</div>
          <div class="stage-info"><div class="stage-name">${name.replace(/^.\s/,'')}</div>
          ${i>=2&&i<2+rocket.stages.length?`<div class="stage-spec">Thrust: ${(rocket.stages[i-2]?.thrust/1000).toFixed(0)} kN · Isp: ${rocket.stages[i-2]?.isp} s</div>`:''}
          </div></div>`).join('') + `</div>`;

    // Stage specs table
    const tblEl = document.getElementById('stage-specs-tbl');
    if (tblEl) tblEl.innerHTML = `<thead><tr><th>Stage</th><th>Engines</th><th>Thrust (kN)</th><th>Isp (s)</th><th>Burn (s)</th><th>Prop Mass (t)</th><th>Dry Mass (t)</th><th>Mass Frac</th></tr></thead>
      <tbody>${rocket.stages.map(s=>`<tr>
        <td style="color:var(--orange);font-weight:600">${s.name}</td>
        <td style="font-family:var(--fm)">${s.engines}×</td>
        <td style="font-family:var(--fm);color:var(--cyan)">${(s.thrust/1000).toFixed(0)}</td>
        <td style="font-family:var(--fm);color:var(--green)">${s.isp}</td>
        <td style="font-family:var(--fm)">${s.burnTime}</td>
        <td style="font-family:var(--fm);color:var(--amber)">${(s.propMass/1000).toFixed(1)}</td>
        <td style="font-family:var(--fm)">${(s.dryMass/1000).toFixed(1)}</td>
        <td style="font-family:var(--fm);color:${Physics.propellantFraction(s.propMass,s.dryMass)>.85?'var(--green)':'var(--amber)'}">
          ${(Physics.propellantFraction(s.propMass,s.dryMass)*100).toFixed(1)}%</td>
      </tr>`).join('')}</tbody>`;

    // Performance chart
    setTimeout(()=>{
      const payloads=[0,2000,5000,10000,15000,rocket.payload_leo_kg];
      const dvs=payloads.map(pl=>{
        const stages=rocket.stages.map((s,i)=>({...s,mf:s.dryMass+(i===rocket.stages.length-1?pl:0)}));
        return Physics.multiStageDeltaV(stages)/1000;
      });
      RocketCharts.lineChart('perf-chart',[{label:'Δv (km/s)',data:dvs,color:'#e05c1a',fill:true}],{labels:payloads.map(p=>(p/1000).toFixed(0)+'t'),legend:true,dec:2});
    },80);

    // Perf params
    const totalDv = Physics.multiStageDeltaV(rocket.stages);
    const perfEl = document.getElementById('perf-params');
    if (perfEl) perfEl.innerHTML = [
      {l:'Total Δv',v:(totalDv/1000).toFixed(2)+' km/s',c:'var(--orange)'},
      {l:'TWR (liftoff)',v:(rocket.stages[0].thrust/(rocket.liftoff_mass_kg*Physics.g0)).toFixed(2),c:'var(--cyan)'},
      {l:'Propellant Frac',v:(Physics.propellantFraction(rocket.stages[0].propMass,rocket.stages[0].dryMass)*100).toFixed(1)+'%',c:'var(--green)'},
      {l:'Specific Cost',v:'$'+(rocket.cost_M*1e6/rocket.payload_leo_kg).toFixed(0)+'/kg',c:'var(--amber)'},
    ].map(p=>`<div style="margin-bottom:12px"><div style="font-family:var(--fm);font-size:9px;color:var(--text3);letter-spacing:1.5px;margin-bottom:4px">${p.l}</div><div style="font-family:var(--fm);font-size:18px;font-weight:700;color:${p.c}">${p.v}</div></div>`).join('');

    RocketData.addLog(`Vehicle selected: ${rocket.name}`, 'success');
    toast(`${rocket.name} selected`, 'success');
  }

  // ============ PROPULSION ============
  function renderPropulsion() {
    setTimeout(()=>{
      renderIspCompare();
      calcNozzle();
    },80);
  }

  function renderIspCompare() {
    const engines = RocketData.engines.slice(0,8);
    setTimeout(()=>RocketCharts.hBar('isp-compare-c',engines.map(e=>e.name),engines.map(e=>e.isp_vac),{color:'#00e676',px:120}),50);
  }

  function calcNozzle() {
    const Pc = (parseFloat(document.getElementById('pc-range')?.value)||100)*1e5;
    const Pe = parseFloat(document.getElementById('pe-sel')?.value)||0;
    const Ae_At = parseFloat(document.getElementById('ar-range')?.value)||40;
    const gamma = parseFloat(document.getElementById('prop-sel')?.value)||1.2;
    const res = Physics.nozzleDesign(Pc, Pe||1, gamma, Ae_At);
    const el = document.getElementById('nozzle-results'); if (!el) return;
    el.innerHTML = `<div class="ct">Nozzle <b>Results</b></div>
      ${[{l:'Thrust Coefficient (Cf)',v:res.Cf,c:'var(--orange)'},{l:'Exit Velocity (m/s)',v:res.v_exit.toLocaleString(),c:'var(--cyan)'},{l:'Specific Impulse (s)',v:res.isp,c:'var(--green)'},
         {l:'Chamber Pressure',v:(Pc/1e5).toFixed(0)+' bar',c:'var(--amber)'},{l:'Area Ratio',v:Ae_At,c:'var(--violet)'},{l:'Exit Pressure',v:Pe+' Pa',c:'var(--text2)'}]
        .map(r=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)"><span style="font-family:var(--fm);font-size:11px;color:var(--text2)">${r.l}</span><span style="font-family:var(--fm);font-size:13px;font-weight:700;color:${r.c}">${r.v}</span></div>`).join('')}`;
  }

  function calcTsiolkovsky() {
    const isp=parseFloat(document.getElementById('tc-isp')?.value||311);
    const m0=parseFloat(document.getElementById('tc-m0')?.value||549054);
    const mf=parseFloat(document.getElementById('tc-mf')?.value||25600);
    const dv=Physics.tsiolkovsky(isp,m0,mf);
    const el=document.getElementById('tc-result'); if (!el) return;
    el.innerHTML = `<div style="padding:16px;background:var(--surface2);border-radius:8px;border:1px solid var(--border2)">
      <div style="font-family:var(--fm);font-size:10px;color:var(--text3);margin-bottom:6px">DELTA-V RESULT</div>
      <div style="font-size:32px;font-weight:700;color:var(--orange);font-family:var(--fm)">${dv.toFixed(0)} m/s</div>
      <div style="font-size:12px;color:var(--text2);margin-top:6px">${(dv/1000).toFixed(2)} km/s · Mass ratio: ${(m0/mf).toFixed(2)}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px">Propellant fraction: ${((m0-mf)/m0*100).toFixed(1)}%</div>
    </div>`;
  }

  function calcMultiStage() {
    const stages=[];
    for(let i=0;i<2;i++){
      const isp=parseFloat(document.getElementById(`ms-isp-${i}`)?.value||311);
      const m0=parseFloat(document.getElementById(`ms-m0-${i}`)?.value||100000);
      const mf=parseFloat(document.getElementById(`ms-mf-${i}`)?.value||10000);
      stages.push({isp,m0,mf});
    }
    const total=Physics.multiStageDeltaV(stages);
    const el=document.getElementById('ms-result'); if (!el) return;
    el.innerHTML=`<div style="padding:14px;background:var(--surface2);border-radius:8px;border:1px solid var(--border2)">
      <div style="font-family:var(--fm);font-size:10px;color:var(--text3);margin-bottom:6px">TOTAL DELTA-V</div>
      <div style="font-size:28px;font-weight:700;color:var(--orange);font-family:var(--fm)">${total.toFixed(0)} m/s</div>
      ${stages.map((s,i)=>`<div style="font-family:var(--fm);font-size:11px;color:var(--text2);margin-top:6px">Stage ${i+1}: ${Physics.tsiolkovsky(s.isp,s.m0,s.mf).toFixed(0)} m/s</div>`).join('')}
    </div>`;
  }

  // ============ STRUCTURAL ============
  function runStructural() {
    const rocket = RocketData.state.rocket || RocketData.getRocket('falcon9');
    const struct = Physics.structuralAnalysis(rocket);
    const sumEl = document.getElementById('stress-summary');
    if (sumEl) sumEl.innerHTML = struct.map(c=>`<div class="gauge-row">
      <span class="gauge-lbl">${c.name.substring(0,14)}</span>
      <div class="gauge-track"><div class="gauge-fill ${c.status==='safe'?'safe':c.status==='marginal'?'warn':'crit'}" style="width:${Math.min(100,c.ratio*100).toFixed(0)}%"></div></div>
      <span class="gauge-val" style="width:60px">${c.sf}×SF</span>
      <span class="badge ${c.status==='safe'?'bg':c.status==='marginal'?'ba':'br'}" style="font-size:8px">${c.status}</span>
    </div>`).join('');
    setTimeout(()=>RocketCharts.stressChart('stress-chart-c',struct),80);
    toast('Structural analysis complete','success');
  }

  // ============ AERODYNAMICS ============
  function renderAerodynamics() {
    // Drag vs Mach
    const machs=[0.1,0.3,0.5,0.7,0.8,0.9,0.95,1.0,1.05,1.1,1.2,1.5,2.0,3.0,4.0,5.0];
    const cds=[0.28,0.29,0.30,0.31,0.33,0.37,0.42,0.48,0.44,0.40,0.36,0.28,0.24,0.21,0.20,0.19];
    setTimeout(()=>RocketCharts.lineChart('drag-mach-c',[{label:'Cd',data:cds,color:'#e05c1a',fill:true}],{labels:machs.map(m=>m.toFixed(1)),legend:true,dec:2}),80);

    // Q vs altitude
    const alts=[0,5,10,15,20,25,30,40,50,60];
    const qs=alts.map(a=>{const atm=Physics.atmosphere(a*1000);return Physics.dynamicPressure(atm.rho,500+(a>10?-a*8:a*30));});
    setTimeout(()=>RocketCharts.lineChart('q-alt-c',[{label:'q (Pa)',data:qs,color:'#00d4ff',fill:true}],{labels:alts.map(a=>a+'km'),legend:true,dec:0}),100);

    // Atmosphere table
    const tbody=document.getElementById('atm-tbody');
    if(tbody)tbody.innerHTML=[0,5,10,20,30,50,80,120,200].map(alt=>{
      const atm=Physics.atmosphere(alt*1000);
      const vs=Math.sqrt(1.4*287.05*atm.T);
      return `<tr><td style="font-family:var(--fm);color:var(--orange)">${alt}</td><td style="font-family:var(--fm)">${atm.T.toFixed(1)}</td><td style="font-family:var(--fm)">${atm.P.toFixed(1)}</td><td style="font-family:var(--fm)">${atm.rho.toFixed(5)}</td><td style="font-family:var(--fm)">${vs.toFixed(0)}</td></tr>`;
    }).join('');
    updateStability();
  }

  function updateStability() {
    const cal=parseFloat(document.getElementById('cal-range')?.value||2);
    const finSpan=parseFloat(document.getElementById('fin-span')?.value||1.5);
    const el=document.getElementById('stability-info'); if(!el)return;
    const stable=cal>=1.5;
    el.innerHTML=`<div style="text-align:center;margin-bottom:16px">
      <div style="font-size:36px;font-weight:700;color:${stable?'var(--green)':'var(--red)'}">${cal.toFixed(1)} cal</div>
      <div style="font-family:var(--fm);font-size:10px;color:var(--text3)">STATIC STABILITY MARGIN</div>
      <span class="badge ${stable?'bg':'br'}" style="margin-top:8px;font-size:11px">${stable?'STABLE':'UNSTABLE'}</span>
    </div>
    <div style="font-size:12px;color:var(--text2);line-height:1.8">
      ${cal<1?'⚠ Rocket is aerodynamically unstable. Center of pressure is ahead of center of mass.':
        cal<1.5?'⚡ Marginally stable. Minimum recommended is 1.5 calibers.':
        cal<3?'✓ Stable flight. Good margin for typical weather conditions.':
        '✓ Highly stable. May be over-stable for maneuvering missions.'}<br/>
      Fin span: ${finSpan}m · Provides ${(finSpan*0.3).toFixed(2)} cal stability contribution
    </div>`;
  }

  // ============ TRAJECTORY ============
  function runTrajectory() {
    const btn=document.getElementById('traj-btn');
    if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span> Simulating...';}
    const rocket=RocketData.state.rocket||RocketData.getRocket('falcon9');
    const dt=parseFloat(document.getElementById('dt-sel')?.value||0.5);
    setTimeout(()=>{
      const sim=Physics.simulate(rocket,dt);
      RocketData.state.simResult=sim;
      updateTopBar(sim);
      setTimeout(()=>RocketCharts.trajectoryChart('traj-main-c',sim.trajectory),80);
      setTimeout(()=>RocketCharts.lineChart('vel-prof-c',[{label:'Velocity (m/s)',data:sim.trajectory.map(t=>t.vel),color:'#e05c1a',fill:true}],{labels:sim.trajectory.map(t=>t.t+'s'),legend:true,dec:0}),100);
      setTimeout(()=>RocketCharts.lineChart('gload-c',[{label:'G-Load',data:sim.trajectory.map(t=>t.g_load||1),color:'#ff4444',fill:false},{label:'Mach',data:sim.trajectory.map(t=>t.mach||0),color:'#ffa726',dash:[4,3]}],{labels:sim.trajectory.map(t=>t.t+'s'),legend:true,dec:1}),120);

      const sumEl=document.getElementById('traj-summary');
      if(sumEl)sumEl.innerHTML=[
        {l:'Max Altitude',v:(sim.maxAlt/1000).toFixed(1)+' km',c:'var(--cyan)'},
        {l:'Max Velocity',v:sim.maxVel.toFixed(0)+' m/s',c:'var(--orange)'},
        {l:'Max-Q',v:(sim.maxQ/1000).toFixed(1)+' kPa @ '+(sim.maxQ_alt/1000).toFixed(1)+'km',c:'var(--red)'},
        {l:'Total Δv',v:(Physics.multiStageDeltaV(rocket.stages)/1000).toFixed(2)+' km/s',c:'var(--green)'},
        {l:'Sim Points',v:sim.trajectory.length,c:'var(--text2)'},
      ].map(p=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--text2)">${p.l}</span><span style="font-family:var(--fm);font-size:12px;font-weight:700;color:${p.c}">${p.v}</span></div>`).join('');

      const evtEl=document.getElementById('traj-events');
      if(evtEl)evtEl.innerHTML=[
        {t:'T+0s',n:'Liftoff',d:'All engines nominal. TWR='+(rocket.stages[0].thrust/(rocket.liftoff_mass_kg*Physics.g0)).toFixed(2),cls:'done'},
        {t:`T+${Math.round(sim.maxQ_t)}s`,n:'Max-Q',d:`Peak dynamic pressure: ${(sim.maxQ/1000).toFixed(1)} kPa at ${(sim.maxQ_alt/1000).toFixed(1)}km`,cls:'done'},
        {t:`T+${rocket.stages[0]?.burnTime||162}s`,n:'MECO',d:'Main Engine Cutoff — Stage 1 burnout',cls:'done'},
        {t:`T+${(rocket.stages[0]?.burnTime||162)+8}s`,n:'Stage Sep',d:'Stage separation and second engine ignition',cls:'ok'},
        {t:`T+${(rocket.stages[0]?.burnTime||162)+(rocket.stages[1]?.burnTime||397)}s`,n:'SECO',d:'Second Engine Cutoff — Payload deployed',cls:'ok'},
      ].map(e=>`<div class="tli ${e.cls}"><div class="tlt">${e.t}</div><div class="tln">${e.n}</div><div class="tld">${e.d}</div></div>`).join('');

      if(btn){btn.disabled=false;btn.innerHTML='▶ Simulate';}
      RocketData.addLog(`Trajectory sim complete. MaxAlt: ${(sim.maxAlt/1000).toFixed(0)}km, MaxV: ${sim.maxVel.toFixed(0)}m/s`,'success');
      toast('Trajectory simulation complete','success');
    },800);
  }

  // ============ MISSION PLANNER ============
  function selectPlanet(id) {
    document.querySelectorAll('.planet-card').forEach(el=>el.classList.remove('sel'));
    const el=document.getElementById('pcard-'+id);
    if(el)el.classList.add('sel');
    RocketData.state.selectedDestination=id;
    const body=Physics.bodies[id];
    const rocket=RocketData.state.rocket||RocketData.getRocket('falcon9');
    const budget=Physics.deltaVBudget(id);
    const rocketDv=Physics.multiStageDeltaV(rocket.stages);
    const planCard=document.getElementById('mission-plan-card');
    const dvCard=document.getElementById('dv-card');
    const orbCard=document.getElementById('orbital-card');
    if(planCard)planCard.style.display='block';
    if(dvCard)dvCard.style.display='block';
    if(orbCard)orbCard.style.display='block';
    const planEl=document.getElementById('mission-plan-content');
    if(planEl)planEl.innerHTML=`
      <div>${[
        {l:'Destination',v:body.name+' '+body.icon},
        {l:'Surface Gravity',v:body.g+' m/s²'},
        {l:'Escape Velocity',v:body.escape_kms+' km/s'},
        {l:'Distance',v:body.dist_km>0?(body.dist_km/1e6).toFixed(1)+'M km':'0 (home)'},
        {l:'Atmosphere',v:body.atm>0?(body.atm/1000).toFixed(1)+' kPa':'None'},
        {l:'Orbital Velocity',v:body.orbital_v+' m/s'},
      ].map(p=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--text2)">${p.l}</span><span style="font-family:var(--fm);font-size:12px;color:var(--text)">${p.v}</span></div>`).join('')}</div>
      <div>${budget?[
        {l:'Required Total Δv',v:(budget.total||0).toLocaleString()+' m/s',c:rocketDv>=(budget.total||0)?'var(--green)':'var(--red)'},
        {l:'Rocket Δv Capacity',v:rocketDv.toFixed(0)+' m/s',c:'var(--cyan)'},
        {l:'Margin',v:((rocketDv-(budget.total||0))/1000).toFixed(2)+' km/s',c:rocketDv>=(budget.total||0)?'var(--green)':'var(--red)'},
        {l:'Mission Feasible',v:rocketDv>=(budget.total||0)?'✓ YES':'✗ NO (need larger rocket)',c:rocketDv>=(budget.total||0)?'var(--green)':'var(--red)'},
      ].map(p=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--text2)">${p.l}</span><span style="font-family:var(--fm);font-size:13px;font-weight:700;color:${p.c}">${p.v}</span></div>`).join(''):'<div style="color:var(--text3);font-size:12px">Earth — home base</div>'}</div>`;
    if(budget){
      const dvEntries=Object.entries(budget).filter(([k])=>k!=='total');
      setTimeout(()=>RocketCharts.barChart('dv-budget-c',dvEntries.map(([k])=>k),dvEntries.map(([,v])=>v),{color:'#e05c1a',dec:0}),80);
    }
    const orb=Physics.orbitalParams(body.radius*0.1);
    const orbEl=document.getElementById('orbital-params');
    if(orbEl)orbEl.innerHTML=[
      {l:'Low Orbit Velocity',v:body.orbital_v+' m/s',c:'co'},
      {l:'Escape Velocity',v:body.escape_kms+' km/s',c:'cc'},
      {l:'Surface g',v:body.g+' m/s²',c:'ca'},
    ].map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv" style="font-size:18px">${k.v}</div></div>`).join('');
    setTimeout(()=>RocketCharts.solarSystemMap('dash-solar',rocket,body.name.toLowerCase()),150);
    toast(`Mission to ${body.name} planned`,'success');
  }

  // ============ LAUNCH SIMULATOR ============
  function setupLaunchSim() {
    const checklist=[
      {item:'Propellant loading complete',ok:true},{item:'Engine gimbal check',ok:true},
      {item:'Flight computer nominal',ok:true},{item:'Range safety armed',ok:true},
      {item:'Weather: GO',ok:true},{item:'Pad clear',ok:true},
      {item:'Downrange stations ready',ok:true},{item:'Launch director: GO',ok:true},
    ];
    const clEl=document.getElementById('checklist');
    if(clEl)clEl.innerHTML=checklist.map(c=>`<div style="display:flex;align-items:center;gap:10px;padding:5px 0"><span style="color:${c.ok?'var(--green)':'var(--red)'};">${c.ok?'✓':'✗'}</span><span style="color:var(--text2)">${c.item}</span></div>`).join('');
    drawLaunchPad();
    const evtEl=document.getElementById('launch-events');
    if(evtEl)evtEl.innerHTML='<div style="color:var(--text3);font-family:var(--fm);font-size:11px">Awaiting launch...</div>';
    renderLog('launch-log');
  }

  function drawLaunchPad() {
    const canvas=document.getElementById('launch-canvas'); if(!canvas)return;
    canvas.width=canvas.offsetWidth||400; canvas.height=380;
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    const skyGrad=ctx.createLinearGradient(0,0,0,h);
    skyGrad.addColorStop(0,'#000510');skyGrad.addColorStop(0.6,'#0a1628');skyGrad.addColorStop(1,'#1a1a2e');
    ctx.fillStyle=skyGrad;ctx.fillRect(0,0,w,h);
    for(let i=0;i<60;i++){ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*(h*.7),Math.random()*.8,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${Math.random()*.6})`;ctx.fill();}
    // Moon
    ctx.beginPath();ctx.arc(w*.8,h*.15,18,0,Math.PI*2);
    const moonGrad=ctx.createRadialGradient(w*.78,h*.13,0,w*.8,h*.15,18);
    moonGrad.addColorStop(0,'#fffde7');moonGrad.addColorStop(1,'#bdbdbd');
    ctx.fillStyle=moonGrad;ctx.fill();
    // Ground
    const groundGrad=ctx.createLinearGradient(0,h*.78,0,h);
    groundGrad.addColorStop(0,'#1b2838');groundGrad.addColorStop(1,'#0d1320');
    ctx.fillStyle=groundGrad;ctx.fillRect(0,h*.78,w,h*.22);
    // Launch tower
    ctx.fillStyle='#2d3a4a';ctx.fillRect(w*.35,h*.3,8,h*.48);
    for(let y=h*.32;y<h*.76;y+=30){ctx.fillStyle='#3d4a5a';ctx.fillRect(w*.35,y,28,3);}
    // Rocket
    drawRocketSVG(ctx,w*.55,h*.78,activeRocketId,0);
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='11px JetBrains Mono';ctx.textAlign='center';ctx.fillText('LAUNCH PAD',w*.5,h*.95);
  }

  function drawRocketSVG(ctx,x,y,rocketId,animOffset=0) {
    const rocket=RocketData.rockets[rocketId]||RocketData.rockets.falcon9;
    const scale=Math.max(0.4,Math.min(1.2,200/rocket.height_m));
    const rh=rocket.height_m*scale,rw=rocket.diameter_m*scale*8;
    const rx=x-rw/2,ry=y-rh+animOffset;
    // Body gradient
    const bodyGrad=ctx.createLinearGradient(rx,0,rx+rw,0);
    bodyGrad.addColorStop(0,'#263040');bodyGrad.addColorStop(.4,'#e0e8f0');bodyGrad.addColorStop(.6,'#c0c8d0');bodyGrad.addColorStop(1,'#263040');
    ctx.fillStyle=bodyGrad;ctx.fillRect(rx,ry+rh*.15,rw,rh*.8);
    // Nose cone
    ctx.beginPath();ctx.moveTo(rx,ry+rh*.15);ctx.lineTo(rx+rw/2,ry);ctx.lineTo(rx+rw,ry+rh*.15);ctx.closePath();
    ctx.fillStyle='#e05c1a';ctx.fill();
    // Engine nozzles
    const nEng=Math.min(rocket.stages[0].engines,9);
    const engW=rw/(nEng+1);
    for(let i=0;i<nEng;i++){
      ctx.beginPath();ctx.moveTo(rx+engW*(i+.6),ry+rh*.95);ctx.lineTo(rx+engW*(i+.4),ry+rh*.95);ctx.lineTo(rx+engW*(i+.3),ry+rh);ctx.lineTo(rx+engW*(i+.7),ry+rh);ctx.closePath();
      ctx.fillStyle='#37474f';ctx.fill();
    }
    // Stage rings
    ctx.fillStyle='var(--orange)';ctx.fillRect(rx-2,ry+rh*.45,rw+4,3);
    // Fins
    ctx.beginPath();ctx.moveTo(rx-rw*.3,ry+rh);ctx.lineTo(rx,ry+rh*.82);ctx.lineTo(rx,ry+rh);ctx.closePath();ctx.fillStyle='#37474f';ctx.fill();
    ctx.beginPath();ctx.moveTo(rx+rw+rw*.3,ry+rh);ctx.lineTo(rx+rw,ry+rh*.82);ctx.lineTo(rx+rw,ry+rh);ctx.closePath();ctx.fill();
  }

  function startLaunch() {
    const btn=document.getElementById('launch-btn'),abortBtn=document.getElementById('abort-btn');
    if(btn)btn.disabled=true;
    if(abortBtn)abortBtn.disabled=false;
    RocketData.state.launchRunning=true;
    const rocket=RocketData.state.rocket||RocketData.getRocket('falcon9');
    const sim=Physics.simulate(rocket,0.5);
    RocketData.state.simResult=sim;
    let countdown=10,phase='countdown';
    launchT=0;

    const cdEl=document.getElementById('countdown');
    const cdIv=setInterval(()=>{
      countdown--;
      if(cdEl)cdEl.textContent=countdown>0?`T-${countdown.toString().padStart(2,'0')}:00`:'T+00:00';
      if(countdown<=0){clearInterval(cdIv);startAscent(sim,rocket,btn,abortBtn);}
    },500);
  }

  function startAscent(sim,rocket,launchBtn,abortBtn) {
    const canvas=document.getElementById('launch-canvas'); if(!canvas)return;
    canvas.width=canvas.offsetWidth||400; canvas.height=380;
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    let frame=0,crashed=false;
    const events=[
      {t:5,msg:'Ignition sequence start',level:'info'},
      {t:10,msg:'All engines running — LIFTOFF',level:'success'},
      {t:60,msg:'Max aerodynamic pressure (Max-Q)',level:'warn'},
      {t:(rocket.stages[0]?.burnTime||162),msg:'MECO — Main Engine Cutoff',level:'info'},
      {t:(rocket.stages[0]?.burnTime||162)+5,msg:'Stage separation',level:'success'},
      {t:(rocket.stages[0]?.burnTime||162)+10,msg:'Second stage ignition',level:'info'},
    ];
    const firedEvents=new Set();
    const logEl=document.getElementById('launch-log');
    const evtEl=document.getElementById('launch-events');
    const cdEl=document.getElementById('countdown');
    const thrustData=[],velData=[],timeData=[];

    const animIv=setInterval(()=>{
      if(!RocketData.state.launchRunning){clearInterval(animIv);return;}
      frame++;
      const simIdx=Math.min(frame*2,sim.trajectory.length-1);
      const pt=sim.trajectory[simIdx]||sim.trajectory[sim.trajectory.length-1];
      launchT=pt.t;
      if(cdEl)cdEl.textContent=`T+${Math.floor(launchT).toString().padStart(5,'0')}s`;

      // Update telemetry canvas
      thrustData.push((pt.thrust||0)/1000);velData.push(pt.vel||0);timeData.push(pt.t);
      if(thrustData.length>30){thrustData.shift();velData.shift();timeData.shift();}
      setTimeout(()=>RocketCharts.realtimeTelemetry('telem-canvas',pt),0);

      // Draw scene
      const skyGrad=ctx.createLinearGradient(0,0,0,h);
      const altPct=Math.min(1,pt.alt/150000);
      const r=Math.floor(10-altPct*10),g2=Math.floor(22-altPct*22),b=Math.floor(45-altPct*45);
      skyGrad.addColorStop(0,`rgb(${r},${g2},${b})`);skyGrad.addColorStop(1,`rgb(${r+10},${g2+15},${b+25})`);
      ctx.fillStyle=skyGrad;ctx.fillRect(0,0,w,h);
      // Stars (more visible at higher altitude)
      if(pt.alt>30000){for(let i=0;i<40;i++){ctx.beginPath();ctx.arc(Math.sin(i*37.9)*w/2+w/2,Math.sin(i*53.1)*h/2+h/2,Math.random()*.7,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${altPct*.8})`;ctx.fill();}}
      // Atmosphere glow at horizon
      if(pt.alt>50000){ctx.fillStyle=`rgba(0,150,255,${Math.min(.15,altPct*.3)})`;ctx.fillRect(0,h*.7,w,h*.1);}
      // Ground (only visible low)
      if(pt.alt<80000){const groundY=h*.78+(pt.alt/80000)*h*.78;ctx.fillStyle='#1b2838';ctx.fillRect(0,groundY,w,h);}
      // Flame/exhaust
      if(pt.thrust>0){
        const flameGrad=ctx.createRadialGradient(w*.5,h*.55,0,w*.5,h*.7,40);
        flameGrad.addColorStop(0,'rgba(255,255,255,.9)');flameGrad.addColorStop(.2,'rgba(255,200,50,.8)');
        flameGrad.addColorStop(.5,'rgba(255,100,0,.5)');flameGrad.addColorStop(1,'rgba(255,50,0,0)');
        ctx.fillStyle=flameGrad;ctx.beginPath();ctx.ellipse(w*.5,h*.62+Math.random()*4,12,28+Math.random()*8,0,0,Math.PI*2);ctx.fill();
      }
      // Rocket body (moves up as altitude increases)
      const rocketY=h*.5-Math.min(h*.2,(pt.alt/50000)*h*.1);
      drawRocketSVG(ctx,w*.5,rocketY,activeRocketId,0);
      // Altitude text
      ctx.fillStyle='rgba(255,255,255,.7)';ctx.font='11px JetBrains Mono';ctx.textAlign='left';
      ctx.fillText(`ALT: ${(pt.alt/1000).toFixed(1)}km`,10,20);
      ctx.fillText(`VEL: ${pt.vel.toFixed(0)}m/s`,10,34);
      ctx.fillText(`MACH: ${pt.mach.toFixed(2)}`,10,48);
      ctx.fillText(`G: ${(pt.g_load||1).toFixed(1)}g`,10,62);

      // Event triggers
      events.forEach(ev=>{if(!firedEvents.has(ev.t)&&launchT>=ev.t){firedEvents.add(ev.t);RocketData.addLog(ev.msg,ev.level);renderLog('launch-log');
        if(evtEl){const d=document.createElement('div');d.className=`tli ${ev.level==='success'?'ok':ev.level==='warn'?'done':'done'}`;d.innerHTML=`<div class="tlt">T+${ev.t}s</div><div class="tln">${ev.msg}</div>`;evtEl.insertBefore(d,evtEl.firstChild);}
      }});

      // Update top bar
      const altEl=document.getElementById('alt-val'),velEl=document.getElementById('vel-val');
      if(altEl)altEl.textContent=(pt.alt/1000).toFixed(0);if(velEl)velEl.textContent=pt.vel.toFixed(0);

      if(simIdx>=sim.trajectory.length-1){
        clearInterval(animIv);
        RocketData.state.launchRunning=false;
        if(launchBtn)launchBtn.disabled=false;if(abortBtn)abortBtn.disabled=true;
        RocketData.addLog(`Mission complete. MaxAlt=${(sim.maxAlt/1000).toFixed(0)}km`,'success');
        renderLog('launch-log');
        toast('Mission complete! 🚀','success',5000);
        // Draw final orbit arc
        ctx.beginPath();ctx.ellipse(w*.5,h*.8,w*.3,h*.5,0,Math.PI,2*Math.PI);
        ctx.strokeStyle='rgba(0,212,255,.3)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='rgba(0,230,118,.8)';ctx.font='bold 13px JetBrains Mono';ctx.textAlign='center';ctx.fillText('ORBIT ACHIEVED',w*.5,h*.25);
      }
    },50);
  }

  function abortLaunch() {
    RocketData.state.launchRunning=false;
    const launchBtn=document.getElementById('launch-btn'),abortBtn=document.getElementById('abort-btn');
    if(launchBtn)launchBtn.disabled=false;if(abortBtn)abortBtn.disabled=true;
    RocketData.addLog('⚠ LAUNCH ABORT COMMANDED','error');
    toast('Launch aborted','error');
    const cdEl=document.getElementById('countdown');if(cdEl)cdEl.style.color='var(--red)';
  }

  // ============ FAILURE ANALYSIS ============
  function runFailureAnalysis() {
    const rocket=RocketData.state.rocket||RocketData.getRocket('falcon9');
    const result=Physics.failureProbability(rocket);
    const kpisEl=document.getElementById('fail-kpis');
    if(kpisEl)kpisEl.innerHTML=[
      {l:'Success Rate',v:(result.successRate*100).toFixed(2)+'%',c:'cg'},
      {l:'Failure Rate',v:(result.failRate*100).toFixed(2)+'%',c:'cr'},
      {l:'Monte Carlo Trials',v:result.trials.toLocaleString(),c:'cc'},
      {l:'Historical Rate',v:(rocket.successRate*100).toFixed(1)+'%',c:'co'},
    ].map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv">${k.v}</div></div>`).join('');

    const meterEl=document.getElementById('fail-meter-wrap');
    if(meterEl)meterEl.innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-family:var(--fm);font-size:10px;color:var(--text3)">FAILURE PROBABILITY</span><span style="font-family:var(--fm);font-size:12px;color:var(--orange)">${(result.failRate*100).toFixed(2)}%</span></div>
      <div class="fail-meter"><div class="fail-fill" style="width:100%"></div><div class="fail-needle" style="left:${result.failRate*100}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-family:var(--fm);font-size:9px;color:var(--text4)"><span>0% (Perfect)</span><span>100% (Certain Fail)</span></div>`;

    const modesEl=document.getElementById('fail-modes');
    if(modesEl)modesEl.innerHTML=`<div style="font-family:var(--fm);font-size:10px;color:var(--text3);margin-bottom:10px;letter-spacing:1.5px">TOP FAILURE MODES</div>`+
      result.topModes.map(m=>`<div class="gauge-row"><span class="gauge-lbl" style="width:160px">${m.mode.substring(0,20)}</span><div class="gauge-track"><div class="gauge-fill ${m.pct>2?'crit':m.pct>1?'warn':'safe'}" style="width:${Math.min(100,m.pct*10)}%"></div></div><span class="gauge-val">${m.pct}%</span></div>`).join('');

    setTimeout(()=>RocketCharts.barChart('fail-dist-c',result.topModes.map(m=>m.mode.split(' ').slice(0,2).join(' ')),result.topModes.map(m=>m.pct),{color:'#ff4444',dec:2}),80);

    // FMEA table
    const fmea=[
      {sub:'Main Engines',mode:'Combustion instability',effect:'Engine shutdown',sev:9,prob:2,det:7},
      {sub:'Propellant Feed',mode:'Turbopump cavitation',effect:'Thrust loss',sev:8,prob:3,det:6},
      {sub:'Guidance',mode:'IMU drift',effect:'Off-trajectory',sev:7,prob:2,det:8},
      {sub:'Structure',mode:'Max-Q overstress',effect:'Vehicle breakup',sev:10,prob:1,det:9},
      {sub:'Stage Sep',mode:'Pyro misfire',effect:'Stage not released',sev:8,prob:2,det:7},
      {sub:'Avionics',mode:'Processor fault',effect:'Loss of control',sev:9,prob:1,det:8},
      {sub:'Nozzle',mode:'Throat erosion',effect:'Isp degradation',sev:6,prob:3,det:5},
    ];
    const fbody=document.getElementById('fmea-tbody');
    if(fbody)fbody.innerHTML=fmea.map(f=>{const rpn=f.sev*f.prob*f.det;return`<tr>
      <td style="color:var(--orange);font-weight:600">${f.sub}</td><td>${f.mode}</td><td style="color:var(--text2)">${f.effect}</td>
      <td><span class="badge ${f.sev>=8?'br':f.sev>=6?'ba':'bg'}">${f.sev}</span></td>
      <td><span class="badge b-">${f.prob}</span></td>
      <td><span class="badge bc">${f.det}</span></td>
      <td style="font-family:var(--fm);font-weight:700;color:${rpn>100?'var(--red)':rpn>50?'var(--amber)':'var(--green)'}">${rpn}</td>
    </tr>`;}).join('');

    const rbdEl=document.getElementById('rbd');
    if(rbdEl)rbdEl.innerHTML=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:14px;background:var(--bg2);border-radius:8px;font-family:var(--fm);font-size:11px">
      ${['Propulsion','Guidance','Structure','Avionics','Range Safety'].map(s=>`<div style="padding:8px 12px;border:1px solid var(--border2);border-radius:6px;color:var(--orange);background:var(--orange-l)">${s}</div><span style="color:var(--text3)">→</span>`).join('')}
      <div style="padding:8px 12px;border:1px solid var(--green);border-radius:6px;color:var(--green);background:var(--green-l)">MISSION SUCCESS</div>
    </div>`;
    toast('Failure analysis complete','success');
  }

  // ============ SOLAR SYSTEM ============
  function renderSolarSystem() {
    const rocket=RocketData.state.rocket||RocketData.getRocket('falcon9');
    setTimeout(()=>RocketCharts.solarSystemMap('solar-main-c',rocket,'mars'),80);
    const statsEl=document.getElementById('planet-stats');
    if(statsEl)statsEl.innerHTML=Object.entries(Physics.bodies).slice(0,4).map(([id,b])=>`<div class="kpi co"><div class="kl">${b.name} ${b.icon}</div><div class="kv" style="font-size:16px">${b.g} m/s²</div><div class="kd">${b.dist_km>0?(b.dist_km/1e6).toFixed(0)+'M km':'Home'}</div></div>`).join('');
  }

  function calcHohmann() {
    const r1_km=parseFloat(document.getElementById('ho-origin')?.value||149600000);
    const r2_km=parseFloat(document.getElementById('ho-dest')?.value||228000000);
    const M_sun=1.989e30;
    const r1=r1_km*1000,r2=r2_km*1000;
    const res=Physics.hohmannDeltaV(r1,r2,M_sun);
    const el=document.getElementById('hohmann-result');if(!el)return;
    el.innerHTML=`<div class="g3" style="margin-top:14px">${[
      {l:'Δv₁ (Departure)',v:res.dv1.toFixed(0)+' m/s',c:'co'},
      {l:'Δv₂ (Insertion)',v:res.dv2.toFixed(0)+' m/s',c:'cc'},
      {l:'Total Δv',v:res.total.toFixed(0)+' m/s',c:'cg'},
      {l:'Transfer Time',v:res.tof_days.toFixed(0)+' days',c:'ca'},
    ].map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv" style="font-size:18px">${k.v}</div></div>`).join('')}</div>`;
    toast('Hohmann transfer calculated','success');
  }

  // ============ DELTA-V PAGE ============
  function renderDeltaVPage() {
    const destinations=['LEO','GEO','Moon','Mars','Venus','Jupiter','Saturn','Mercury'];
    const dvs=[9400,13340,13450,13900,13250,16600,17000,18900];
    const rocket=RocketData.state.rocket||RocketData.getRocket('falcon9');
    const rocketDv=Physics.multiStageDeltaV(rocket.stages);
    setTimeout(()=>RocketCharts.barChart('dv-map-c',destinations,dvs,{colors:dvs.map(d=>d<=rocketDv?'#00e676':'#ff4444'),dec:0}),80);
    const capEl=document.getElementById('rocket-capability');
    if(capEl)capEl.innerHTML=`<div style="font-family:var(--fm);font-size:11px;margin-bottom:14px;color:var(--text2)">Rocket: <span style="color:var(--orange)">${rocket.name}</span><br/>Δv capacity: <span style="color:var(--cyan)">${rocketDv.toFixed(0)} m/s</span></div>`+
      destinations.map((d,i)=>`<div class="gauge-row"><span class="gauge-lbl">${d}</span><div class="gauge-track"><div class="gauge-fill ${dvs[i]<=rocketDv?'safe':'crit'}" style="width:${Math.min(100,rocketDv/dvs[i]*100).toFixed(0)}%"></div></div><span class="badge ${dvs[i]<=rocketDv?'bg':'br'}" style="font-size:9px">${dvs[i]<=rocketDv?'GO':'NO GO'}</span></div>`).join('');
  }

  // ============ RE-ENTRY ============
  function calcReentry() {
    const vel=parseFloat(document.getElementById('re-vel')?.value||7800);
    const angle=parseFloat(document.getElementById('re-angle')?.value||6);
    const nose=parseFloat(document.getElementById('re-nose')?.value||0.5);
    const res=Physics.reentryHeating(vel,angle,nose);
    const el=document.getElementById('reentry-results');if(!el)return;
    el.innerHTML=`<div class="ct">Heating <b>Results</b></div>`+[
      {l:'Stagnation Heat Flux',v:res.heat_flux_MW+' MW/m²',c:'var(--red)'},
      {l:'Stagnation Temperature',v:res.T_stag_K.toLocaleString()+' K',c:'var(--orange)'},
      {l:'Peak G-Load',v:res.g_load+' g',c:'var(--amber)'},
      {l:'Deceleration Time',v:res.decel_time_s+' s',c:'var(--cyan)'},
      {l:'Entry Velocity',v:vel.toLocaleString()+' m/s',c:'var(--text)'},
      {l:'Entry Angle',v:angle+'°',c:'var(--text)'},
    ].map(r=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--text2)">${r.l}</span><span style="font-family:var(--fm);font-size:13px;font-weight:700;color:${r.c}">${r.v}</span></div>`).join('');

    // Heat profile
    const alts=Array.from({length:20},(_,i)=>120000-i*6000);
    const heats=alts.map(a=>{const v=vel*(1-((120000-a)/120000)*.3);const atm=Physics.atmosphere(a);return Physics.dynamicPressure(atm.rho,v)/1000;});
    setTimeout(()=>RocketCharts.lineChart('heat-profile-c',[{label:'Heat Rate (kW/m²)',data:heats,color:'#ff4444',fill:true}],{labels:alts.map(a=>(a/1000).toFixed(0)+'km'),dec:0,legend:true}),80);
    const decels=alts.map((a,i)=>res.g_load*(i/alts.length));
    setTimeout(()=>RocketCharts.lineChart('decel-c',[{label:'G-Load',data:decels,color:'#ffa726',fill:true}],{labels:alts.map(a=>(a/1000).toFixed(0)+'km'),dec:1,legend:true}),100);
    toast('Re-entry analysis complete','success');
  }

  // ============ ENGINE DB ============
  function renderEnginesDB() {
    const engines=RocketData.engines.sort((a,b)=>b.thrust_kN-a.thrust_kN);
    setTimeout(()=>{
      // Scatter-like: thrust vs isp using bar
      RocketCharts.barChart('eng-db-c',engines.slice(0,8).map(e=>e.name.split(' ')[0]),engines.slice(0,8).map(e=>e.thrust_kN),{color:'#e05c1a',dec:0});
    },80);
    const topByIsp=[...engines].sort((a,b)=>b.isp_vac-a.isp_vac).slice(0,8);
    setTimeout(()=>RocketCharts.hBar('top-isp-c',topByIsp.map(e=>e.name),topByIsp.map(e=>e.isp_vac),{color:'#00e676',px:120}),100);
  }

  // ============ MATERIALS ============
  function renderMaterials() {
    const mats=RocketData.materials;
    const specStr=mats.map(m=>+(m.yield_MPa/m.density*1000).toFixed(0));
    setTimeout(()=>RocketCharts.hBar('mat-str-c',mats.map(m=>m.name.substring(0,16)),specStr,{colors:specStr.map(s=>s>200?'#00e676':s>100?'#ffa726':'#e05c1a'),px:150}),80);
  }

  return {
    boot, go, tab,
    selectRocket, selectPlanet,
    calcNozzle, calcTsiolkovsky, calcMultiStage,
    runStructural, renderAerodynamics, updateStability,
    runTrajectory, startLaunch, abortLaunch,
    runFailureAnalysis, calcHohmann, calcReentry,
    toast
  };
})();

document.addEventListener('DOMContentLoaded', () => App.boot());
