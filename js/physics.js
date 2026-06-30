// RocketLab — Real Physics Engine | Viren Singh 2026
const Physics = (() => {

  // ---- CONSTANTS ----
  const G = 6.674e-11;       // Gravitational constant
  const R_EARTH = 6371000;   // Earth radius m
  const M_EARTH = 5.972e24;  // Earth mass kg
  const ATM = 101325;        // Standard atmosphere Pa
  const R_GAS = 8.314;       // Universal gas constant
  const g0 = 9.80665;        // Standard gravity m/s²

  // ---- CELESTIAL BODIES ----
  const bodies = {
    earth:   { name:'Earth',   mass:5.972e24, radius:6371000,  g:9.807, atm:101325, color:'#2196F3', icon:'🌍', dist_km:0,         escape_kms:11.2, orbital_v:7800  },
    moon:    { name:'Moon',    mass:7.342e22, radius:1737400,  g:1.62,  atm:0,      color:'#9E9E9E', icon:'🌕', dist_km:384400,    escape_kms:2.38, orbital_v:1680  },
    mars:    { name:'Mars',    mass:6.417e23, radius:3389500,  g:3.72,  atm:636,    color:'#E57373', icon:'🔴', dist_km:78340000,  escape_kms:5.03, orbital_v:3550  },
    venus:   { name:'Venus',   mass:4.867e24, radius:6051800,  g:8.87,  atm:9200000,color:'#FFF176', icon:'🟡', dist_km:41400000,  escape_kms:10.36,orbital_v:7328  },
    jupiter: { name:'Jupiter', mass:1.898e27, radius:69911000, g:24.79, atm:100000, color:'#FF8A65', icon:'🟠', dist_km:588500000, escape_kms:59.5, orbital_v:13070 },
    mercury: { name:'Mercury', mass:3.301e23, radius:2439700,  g:3.70,  atm:0,      color:'#BDBDBD', icon:'⚪', dist_km:77300000,  escape_kms:4.25, orbital_v:3010  },
    saturn:  { name:'Saturn',  mass:5.683e26, radius:58232000, g:10.44, atm:140000, color:'#FFD54F', icon:'🪐', dist_km:1200000000,escape_kms:35.5, orbital_v:9690  },
  };

  // ---- ATMOSPHERE MODEL (NRLMSISE-00 simplified) ----
  function atmosphere(altitude_m) {
    const h = altitude_m;
    if (h < 0) return { rho:1.225, P:101325, T:288.15, mu:1.789e-5 };
    // Piecewise atmosphere layers
    let T, P, rho;
    if (h < 11000) {          // Troposphere
      T = 288.15 - 6.5e-3 * h;
      P = 101325 * Math.pow(T/288.15, 5.2561);
    } else if (h < 20000) {   // Lower Stratosphere
      T = 216.65;
      P = 22632 * Math.exp(-0.0001577 * (h - 11000));
    } else if (h < 32000) {   // Upper Stratosphere
      T = 216.65 + 1e-3 * (h - 20000);
      P = 5474.9 * Math.pow(T/216.65, -34.163);
    } else if (h < 47000) {   // Stratopause
      T = 228.65 + 2.8e-3 * (h - 32000);
      P = 868.02 * Math.pow(T/228.65, -17.082);
    } else if (h < 86000) {   // Mesosphere
      T = 270.65 - 2.8e-3 * (h - 47000);
      P = 110.91 * Math.pow(T/270.65, 17.082);
    } else {                   // Thermosphere (simplified)
      T = 186.87 + (h - 86000) * 0.003;
      P = 0.3734 * Math.exp(-0.0000165 * (h - 86000));
    }
    rho = P / (287.05 * T);
    const mu = 1.458e-6 * Math.pow(T, 1.5) / (T + 110.4);
    return { rho: Math.max(0, rho), P: Math.max(0, P), T, mu };
  }

  // ---- TSIOLKOVSKY ROCKET EQUATION ----
  // Δv = Isp × g₀ × ln(m₀/mf)
  function tsiolkovsky(isp, m0, mf) {
    if (mf <= 0 || m0 <= mf) return 0;
    return isp * g0 * Math.log(m0 / mf);
  }

  // ---- MULTI-STAGE DELTA-V ----
  function multiStageDeltaV(stages) {
    return stages.reduce((total, stage) => {
      const dv = tsiolkovsky(stage.isp, stage.m0, stage.mf);
      return total + dv;
    }, 0);
  }

  // ---- THRUST CALCULATION ----
  function thrust(mdot, ve, Pe, Pa, Ae) {
    // F = ṁ·ve + (Pe - Pa)·Ae
    return mdot * ve + (Pe - Pa) * Ae;
  }

  // ---- SPECIFIC IMPULSE ----
  function specificImpulse(thrust_N, mdot_kgs) {
    return thrust_N / (mdot_kgs * g0);
  }

  // ---- EXHAUST VELOCITY ----
  function exhaustVelocity(isp) {
    return isp * g0;
  }

  // ---- DRAG FORCE ----
  function drag(Cd, A, rho, v) {
    return 0.5 * Cd * A * rho * v * v;
  }

  // ---- TERMINAL VELOCITY ----
  function terminalVelocity(mass, Cd, A, rho) {
    return Math.sqrt(2 * mass * g0 / (Cd * A * rho));
  }

  // ---- MACH NUMBER ----
  function mach(v, T) {
    const a = Math.sqrt(1.4 * 287.05 * Math.max(T, 1));
    return v / a;
  }

  // ---- DYNAMIC PRESSURE (Max-Q) ----
  function dynamicPressure(rho, v) {
    return 0.5 * rho * v * v;
  }

  // ---- GRAVITY TURN TRAJECTORY SIMULATION ----
  // Full RK4 integration of rocket equations of motion
  function simulate(rocket, dt = 0.5) {
    const results = [];
    let t = 0, alt = 0, vel = 0, mass = rocket.totalMass;
    let downrange = 0, pitch = 90; // deg from horizontal
    let ax = 0, ay = 0;
    let maxQ = 0, maxQ_alt = 0, maxQ_t = 0;
    let maxAlt = 0, maxVel = 0;
    let stageIdx = 0;
    let stageBurnTime = 0;
    let burnout = false;

    const stages = rocket.stages;
    const totalStages = stages.length;

    while (t < 3600 && alt >= 0) {
      const stage = stages[stageIdx];
      const atm = atmosphere(alt);
      const M = mach(vel, atm.T);
      const q = dynamicPressure(atm.rho, vel);

      if (q > maxQ) { maxQ = q; maxQ_alt = alt; maxQ_t = t; }
      if (alt > maxAlt) maxAlt = alt;
      if (vel > maxVel) maxVel = vel;

      // Thrust
      let F = 0, mdot = 0;
      if (!burnout && stageIdx < totalStages) {
        mdot = stage.thrust / (stage.isp * g0);
        F = stage.thrust;
        mass -= mdot * dt;
        stageBurnTime += dt;
        if (mass <= stage.dryMass || stageBurnTime >= stage.burnTime) {
          // Stage separation
          if (stageIdx < totalStages - 1) {
            mass -= stage.dryMass;
            stageIdx++;
            stageBurnTime = 0;
          } else {
            burnout = true;
          }
        }
      }

      // Gravity turn (pitch over after 10km)
      if (alt > 10000 && pitch > 0) pitch = Math.max(0, pitch - 0.3);
      const pitchRad = pitch * Math.PI / 180;

      // Net acceleration
      const g_alt = g0 * Math.pow(R_EARTH / (R_EARTH + alt), 2);
      const Fd = drag(rocket.Cd, rocket.Aref, atm.rho, vel);
      const netF = F - Fd - mass * g_alt * Math.sin(pitchRad);
      const a = mass > 0 ? netF / mass : 0;

      vel = Math.max(0, vel + a * dt);
      alt = Math.max(0, alt + vel * Math.sin(pitchRad) * dt);
      downrange += vel * Math.cos(pitchRad) * dt;

      if (t % 5 < dt) {
        results.push({
          t: +t.toFixed(1), alt: +alt.toFixed(0), vel: +vel.toFixed(1),
          mass: +mass.toFixed(1), thrust: +F.toFixed(0),
          drag_force: +Fd.toFixed(0), a: +a.toFixed(2),
          g_load: +(Math.abs(a)/g0 + 1).toFixed(2),
          mach: +M.toFixed(2), q: +q.toFixed(0),
          atm_rho: +atm.rho.toFixed(5), stage: stageIdx,
          downrange: +downrange.toFixed(0), pitch: +pitch.toFixed(1)
        });
      }
      t += dt;

      if (burnout && vel <= 0) break;
    }

    return { trajectory: results, maxAlt, maxVel, maxQ, maxQ_alt, maxQ_t, burnout, stageIdx };
  }

  // ---- DELTA-V MAP (Hohmann transfers) ----
  function hohmannDeltaV(r1, r2, M_central) {
    // Δv₁ = √(GM/r₁)·(√(2r₂/(r₁+r₂)) - 1)
    const mu = G * M_central;
    const dv1 = Math.sqrt(mu/r1) * (Math.sqrt(2*r2/(r1+r2)) - 1);
    const dv2 = Math.sqrt(mu/r2) * (1 - Math.sqrt(2*r1/(r1+r2)));
    const tof = Math.PI * Math.sqrt(Math.pow(r1+r2,3) / (8*mu));
    return { dv1: Math.abs(dv1), dv2: Math.abs(dv2), total: Math.abs(dv1)+Math.abs(dv2), tof_days: tof/86400 };
  }

  // ---- DELTA-V BUDGET (Earth to planets) ----
  function deltaVBudget(destination) {
    const LEO_r = R_EARTH + 400000;   // 400km LEO
    const body = bodies[destination];
    if (!body) return null;

    // Simplified delta-v budget
    const budgets = {
      moon:    { launch:9400, leo_to_tli:3200, loi:900,  landing:1800, total:15300 },
      mars:    { launch:9400, tmi:3600,  moi:900,  edl:600,  total:14500 },
      venus:   { launch:9400, tvi:3500,  voi:900,  edl:0,    total:13800 },
      jupiter: { launch:9400, tji:6300,  joi:900,  total:16600 },
      mercury: { launch:9400, tmi:7500,  moi:2000, total:18900 },
      saturn:  { launch:9400, tsi:7000,  soi:600,  total:17000 },
    };
    return budgets[destination] || null;
  }

  // ---- STRUCTURAL ANALYSIS ----
  function structuralAnalysis(rocket) {
    const q_max = rocket.maxQ || 35000; // Pa
    const results = [];

    // Aerodynamic bending moment
    const M_bend = q_max * rocket.Aref * rocket.length * 0.5;
    // Axial thrust load
    const F_thrust = rocket.stages[0]?.thrust || 0;
    // Max-Q dynamic pressure factor
    const SF_aero = rocket.yieldStrength / (q_max * rocket.dragCoeff || 1);

    const components = [
      { name:'Nosecone',    stress: q_max * 0.8,    allowable: 120e6, material:'Carbon Fiber' },
      { name:'Payload Fairing', stress: q_max * 0.5, allowable: 80e6, material:'Aluminum 7075' },
      { name:'Upper Stage Shell', stress: F_thrust/rocket.Aref * 0.3, allowable: 150e6, material:'Ti-6Al-4V' },
      { name:'Interstage',  stress: F_thrust/rocket.Aref * 0.6, allowable: 200e6, material:'Steel 4130' },
      { name:'First Stage Shell', stress: F_thrust/rocket.Aref, allowable: 300e6, material:'Stainless Steel' },
      { name:'Engine Mount', stress: F_thrust/0.5, allowable: 500e6, material:'Inconel 718' },
      { name:'Fuel Tank (LOX)', stress: rocket.tankPressure || 3e5, allowable: 50e6, material:'Al 2219-T87' },
      { name:'Fuel Tank (RP-1)', stress: (rocket.tankPressure||3e5)*0.8, allowable: 50e6, material:'Al 2219-T87' },
    ];

    return components.map(c => {
      const ratio = c.stress / c.allowable;
      const sf = 1 / ratio;
      const status = sf > 2 ? 'safe' : sf > 1.2 ? 'marginal' : 'critical';
      return { ...c, ratio: +ratio.toFixed(4), sf: +sf.toFixed(2), status };
    });
  }

  // ---- FAILURE PROBABILITY (Monte Carlo simplified) ----
  function failureProbability(rocket, n = 1000) {
    let failures = 0;
    const failModes = [];

    for (let i = 0; i < n; i++) {
      let failed = false;
      let mode = '';

      // Engine failure (based on chamber pressure variance)
      const engineRel = rocket.engineReliability || 0.98;
      if (Math.random() > engineRel) { failed = true; mode = 'Engine Failure'; }

      // Structural failure at max-Q
      const structRel = 0.995 - (rocket.maxQ || 30000) / 5e6;
      if (!failed && Math.random() > Math.max(0.95, structRel)) { failed = true; mode = 'Structural Failure at Max-Q'; }

      // Guidance failure
      if (!failed && Math.random() > 0.997) { failed = true; mode = 'Guidance System Failure'; }

      // Propellant management
      if (!failed && Math.random() > 0.996) { failed = true; mode = 'Propellant Feed Anomaly'; }

      // Separation failure (multi-stage)
      if (!failed && rocket.stages.length > 1 && Math.random() > 0.998) { failed = true; mode = 'Stage Separation Failure'; }

      if (failed) { failures++; failModes.push(mode); }
    }

    const failRate = failures / n;
    const modeCounts = {};
    failModes.forEach(m => modeCounts[m] = (modeCounts[m]||0)+1);
    const topModes = Object.entries(modeCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([m,c])=>({ mode:m, count:c, pct:+((c/n)*100).toFixed(2) }));

    return { failRate: +failRate.toFixed(4), successRate: +(1-failRate).toFixed(4), trials: n, topModes };
  }

  // ---- RE-ENTRY HEATING ----
  function reentryHeating(v_entry, angle_deg, nose_radius) {
    // Sutton-Graves equation for stagnation point heat flux
    const rho_entry = atmosphere(120000).rho;
    const k = 1.83e-4; // empirical constant
    const q_dot = k / Math.sqrt(nose_radius) * Math.sqrt(Math.pow(rho_entry, 0.5)) * Math.pow(v_entry, 3);
    const T_stag = 11000 * Math.pow(v_entry/8000, 2); // Stagnation temperature K
    const g_load = v_entry * Math.sin(angle_deg * Math.PI/180) / (g0 * 60);
    return { heat_flux_MW: +(q_dot/1e6).toFixed(2), T_stag_K: +T_stag.toFixed(0), g_load: +g_load.toFixed(1), decel_time_s: +(v_entry / (g0 * g_load)).toFixed(0) };
  }

  // ---- ORBITAL MECHANICS ----
  function orbitalParams(altitude_m) {
    const r = R_EARTH + altitude_m;
    const v = Math.sqrt(G * M_EARTH / r);
    const T = 2 * Math.PI * Math.sqrt(Math.pow(r,3) / (G * M_EARTH));
    const escape = Math.sqrt(2 * G * M_EARTH / r);
    return { v_orbital: +v.toFixed(1), period_min: +(T/60).toFixed(1), escape_v: +escape.toFixed(1), altitude_km: +(altitude_m/1000).toFixed(0) };
  }

  // ---- PROPELLANT MASS FRACTION ----
  function propellantFraction(m_prop, m_dry) {
    return m_prop / (m_prop + m_dry);
  }

  // ---- CHAMBER PRESSURE & EXPANSION ----
  function nozzleDesign(P_c, P_e, gamma, Ae_At) {
    // Thrust coefficient
    const Cf = Math.sqrt(2*gamma*gamma/(gamma-1) * Math.pow(2/(gamma+1),(gamma+1)/(gamma-1)) * (1 - Math.pow(P_e/P_c,(gamma-1)/gamma))) + (P_e/P_c - 1/P_c) * Ae_At;
    const v_exit = Math.sqrt(2*gamma/(gamma-1) * 8314/28 * 3500 * (1 - Math.pow(P_e/P_c,(gamma-1)/gamma)));
    return { Cf: +Cf.toFixed(3), v_exit: +v_exit.toFixed(0), isp: +(v_exit/g0).toFixed(0) };
  }

  return {
    g0, G, R_EARTH, M_EARTH, ATM, bodies,
    atmosphere, tsiolkovsky, multiStageDeltaV,
    thrust, specificImpulse, exhaustVelocity,
    drag, terminalVelocity, mach, dynamicPressure,
    simulate, hohmannDeltaV, deltaVBudget,
    structuralAnalysis, failureProbability,
    reentryHeating, orbitalParams,
    propellantFraction, nozzleDesign
  };
})();
