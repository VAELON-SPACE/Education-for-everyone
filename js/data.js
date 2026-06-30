// RocketLab — Data Module | Viren Singh 2026
const RocketData = (() => {

  const state = {
    rocket: null,
    simResult: null,
    selectedDestination: 'moon',
    logs: [],
    launchRunning: false,
  };

  // ---- REAL ENGINE DATABASE ----
  const engines = [
    { id:'merlin1d',  name:'Merlin 1D',     vehicle:'Falcon 9',      thrust_kN:845,   isp_vac:311, isp_sl:282, mass_kg:470,   propellant:'RP-1/LOX',  cycles:'Gas Generator',  Pc_bar:97,  status:'active' },
    { id:'raptor2',   name:'Raptor 2',       vehicle:'Starship',      thrust_kN:2300,  isp_vac:380, isp_sl:350, mass_kg:1500,  propellant:'CH4/LOX',   cycles:'Full-Flow SCSC', Pc_bar:300, status:'active' },
    { id:'rd180',     name:'RD-180',         vehicle:'Atlas V',       thrust_kN:4152,  isp_vac:338, isp_sl:311, mass_kg:5480,  propellant:'RP-1/LOX',  cycles:'Staged Combustion',Pc_bar:257,status:'active' },
    { id:'rs25',      name:'RS-25 (SSME)',   vehicle:'SLS/Shuttle',   thrust_kN:2090,  isp_vac:453, isp_sl:366, mass_kg:3526,  propellant:'LH2/LOX',   cycles:'Staged Combustion',Pc_bar:207,status:'active' },
    { id:'f1',        name:'F-1',            vehicle:'Saturn V',      thrust_kN:6770,  isp_vac:304, isp_sl:263, mass_kg:8391,  propellant:'RP-1/LOX',  cycles:'Gas Generator',  Pc_bar:70,  status:'retired' },
    { id:'j2',        name:'J-2',            vehicle:'Saturn V S-II', thrust_kN:1033,  isp_vac:421, isp_sl:200, mass_kg:1788,  propellant:'LH2/LOX',   cycles:'Gas Generator',  Pc_bar:52,  status:'retired' },
    { id:'vulcain2',  name:'Vulcain 2',      vehicle:'Ariane 5',      thrust_kN:1340,  isp_vac:432, isp_sl:318, mass_kg:1800,  propellant:'LH2/LOX',   cycles:'Gas Generator',  Pc_bar:116, status:'active' },
    { id:'rocketdyne',name:'RL-10B-2',       vehicle:'Delta IV Upper',thrust_kN:110,   isp_vac:465, isp_sl:0,   mass_kg:277,   propellant:'LH2/LOX',   cycles:'Expander',       Pc_bar:44,  status:'active' },
    { id:'be4',       name:'BE-4',           vehicle:'New Glenn/Vulcan',thrust_kN:2400,isp_vac:339, isp_sl:310, mass_kg:2500,  propellant:'CH4/LOX',   cycles:'Ox-Rich SCSC',   Pc_bar:134, status:'active' },
    { id:'vikas',     name:'Vikas',          vehicle:'GSLV/PSLV',     thrust_kN:800,   isp_vac:295, isp_sl:281, mass_kg:706,   propellant:'UDMH/N2O4', cycles:'Gas Generator',  Pc_bar:58,  status:'active' },
    { id:'ce20',      name:'CE-20',          vehicle:'GSLV Mk III',   thrust_kN:200,   isp_vac:443, isp_sl:0,   mass_kg:588,   propellant:'LH2/LOX',   cycles:'Gas Generator',  Pc_bar:60,  status:'active' },
    { id:'rocketdyne2',name:'Aerojet AJ10', vehicle:'Delta II Upper', thrust_kN:43,    isp_vac:320, isp_sl:0,   mass_kg:118,   propellant:'UDMH/N2O4', cycles:'Pressure Fed',   Pc_bar:9,   status:'active' },
  ];

  // ---- ROCKET PRESETS ----
  const rockets = {
    falcon9: {
      name:'Falcon 9 Block 5', manufacturer:'SpaceX', country:'USA',
      height_m:70, diameter_m:3.7, liftoff_mass_kg:549054,
      payload_leo_kg:22800, payload_gto_kg:8300, payload_moon_kg:4000,
      stages:[
        { name:'First Stage', engines:9, engineId:'merlin1d', thrust:7607000, isp:282, burnTime:162, propMass:395700, dryMass:25600, m0:421300, mf:25600 },
        { name:'Second Stage', engines:1, engineId:'merlin1d', thrust:934000, isp:348, burnTime:397, propMass:107500, dryMass:4000, m0:111500, mf:4000 },
      ],
      totalMass:549054, Cd:0.3, Aref:10.75, length:70,
      engineReliability:0.992, tankPressure:3.4e5, yieldStrength:500e6, dragCoeff:0.3,
      description:'Two-stage partially reusable orbital launch vehicle',
      firstFlight:'2010', successRate:0.975, cost_M:67,
    },
    saturnv: {
      name:'Saturn V', manufacturer:'NASA/Boeing', country:'USA',
      height_m:111, diameter_m:10.1, liftoff_mass_kg:2970000,
      payload_leo_kg:140000, payload_gto_kg:48600, payload_moon_kg:48600,
      stages:[
        { name:'S-IC (First Stage)', engines:5, engineId:'f1', thrust:34020000, isp:263, burnTime:168, propMass:2160000, dryMass:131000, m0:2291000, mf:131000 },
        { name:'S-II (Second Stage)', engines:5, engineId:'j2', thrust:5165000, isp:421, burnTime:360, propMass:427000, dryMass:36000, m0:463000, mf:36000 },
        { name:'S-IVB (Third Stage)', engines:1, engineId:'j2', thrust:1033000, isp:421, burnTime:500, propMass:106500, dryMass:11000, m0:117500, mf:11000 },
      ],
      totalMass:2970000, Cd:0.35, Aref:80.1, length:111,
      engineReliability:0.97, tankPressure:2.8e5, yieldStrength:400e6, dragCoeff:0.35,
      description:'Three-stage super heavy-lift vehicle. Took humans to the Moon.',
      firstFlight:'1967', successRate:0.923, cost_M:1230,
    },
    starship: {
      name:'Starship (Full Stack)', manufacturer:'SpaceX', country:'USA',
      height_m:122, diameter_m:9.0, liftoff_mass_kg:5000000,
      payload_leo_kg:150000, payload_gto_kg:21000, payload_moon_kg:100000,
      stages:[
        { name:'Super Heavy Booster', engines:33, engineId:'raptor2', thrust:75900000, isp:350, burnTime:170, propMass:3400000, dryMass:200000, m0:3600000, mf:200000 },
        { name:'Starship Upper Stage', engines:6, engineId:'raptor2', thrust:13800000, isp:380, burnTime:330, propMass:1200000, dryMass:100000, m0:1300000, mf:100000 },
      ],
      totalMass:5000000, Cd:0.28, Aref:63.6, length:122,
      engineReliability:0.985, tankPressure:6e5, yieldStrength:600e6, dragCoeff:0.28,
      description:'Fully reusable super-heavy-lift vehicle designed for Mars colonization',
      firstFlight:'2023', successRate:0.72, cost_M:10,
    },
    sls: {
      name:'Space Launch System Block 1', manufacturer:'NASA/Boeing', country:'USA',
      height_m:98, diameter_m:8.4, liftoff_mass_kg:2608000,
      payload_leo_kg:95000, payload_gto_kg:27000, payload_moon_kg:27000,
      stages:[
        { name:'Core Stage', engines:4, engineId:'rs25', thrust:8376000, isp:366, burnTime:500, propMass:979452, dryMass:85275, m0:1064727, mf:85275 },
        { name:'Interim Cryogenic Propulsion Stage', engines:1, engineId:'rocketdyne', thrust:110000, isp:465, burnTime:1100, propMass:27200, dryMass:3000, m0:30200, mf:3000 },
      ],
      totalMass:2608000, Cd:0.32, Aref:55.4, length:98,
      engineReliability:0.998, tankPressure:2.5e5, yieldStrength:450e6, dragCoeff:0.32,
      description:'NASA\'s super heavy-lift for Artemis Moon missions',
      firstFlight:'2022', successRate:1.0, cost_M:4100,
    },
    pslv: {
      name:'PSLV-XL', manufacturer:'ISRO', country:'India',
      height_m:44, diameter_m:2.8, liftoff_mass_kg:320000,
      payload_leo_kg:3800, payload_gto_kg:1750, payload_moon_kg:500,
      stages:[
        { name:'PS1 (First Stage)', engines:1, engineId:'vikas', thrust:4800000, isp:269, burnTime:105, propMass:138200, dryMass:15000, m0:153200, mf:15000 },
        { name:'PS2 (Second Stage)', engines:1, engineId:'vikas', thrust:800000, isp:281, burnTime:158, propMass:41500, dryMass:4000, m0:45500, mf:4000 },
        { name:'PS3 (Third Stage)', engines:1, engineId:'ce20', thrust:240000, isp:295, burnTime:112, propMass:7600, dryMass:1100, m0:8700, mf:1100 },
        { name:'PS4 (Fourth Stage)', engines:2, engineId:'rocketdyne2', thrust:73600, isp:308, burnTime:525, propMass:2500, dryMass:450, m0:2950, mf:450 },
      ],
      totalMass:320000, Cd:0.34, Aref:6.16, length:44,
      engineReliability:0.982, tankPressure:2e5, yieldStrength:350e6, dragCoeff:0.34,
      description:'ISRO\'s workhorse 4-stage launch vehicle. Mars Orbiter Mission.',
      firstFlight:'1993', successRate:0.957, cost_M:15,
    },
  };

  // ---- MATERIALS DATABASE ----
  const materials = [
    { name:'Carbon Fiber (CFRP)', density:1600, yield_MPa:600, UTS_MPa:700, use:'Nosecone, Fairing', temp_max_C:300, cost:'$$$$' },
    { name:'Aluminum 7075-T6', density:2810, yield_MPa:503, UTS_MPa:572, use:'Tanks, Structures', temp_max_C:175, cost:'$$' },
    { name:'Aluminum 2219-T87', density:2840, yield_MPa:393, UTS_MPa:476, use:'Cryogenic Tanks', temp_max_C:175, cost:'$$$' },
    { name:'Ti-6Al-4V', density:4430, yield_MPa:880, UTS_MPa:950, use:'High-temp Structures', temp_max_C:315, cost:'$$$$' },
    { name:'Inconel 718', density:8190, yield_MPa:1034,UTS_MPa:1241,use:'Engine Components', temp_max_C:700, cost:'$$$$$' },
    { name:'304 Stainless Steel',density:8000, yield_MPa:215, UTS_MPa:505, use:'Propellant Lines', temp_max_C:870, cost:'$' },
    { name:'17-4 PH Steel', density:7780, yield_MPa:1170,UTS_MPa:1310,use:'Fasteners, Fittings', temp_max_C:315, cost:'$$$' },
    { name:'Ablative PICA-X', density:270,  yield_MPa:2,   UTS_MPa:5,   use:'Heat Shield', temp_max_C:3000, cost:'$$$$$' },
    { name:'Beryllium', density:1850, yield_MPa:270, UTS_MPa:370, use:'Lightweight Structures', temp_max_C:1285, cost:'$$$$$' },
    { name:'304L SS (Cryo)', density:7900, yield_MPa:270, UTS_MPa:485, use:'Starship Tanks', temp_max_C:800, cost:'$' },
  ];

  // ---- MISSION PRESETS ----
  const missions = {
    leo:    { name:'Low Earth Orbit',     alt_km:400,   dv_needed:9400,  duration_days:0,    description:'International Space Station orbit' },
    geo:    { name:'Geostationary Orbit', alt_km:35786, dv_needed:11600, duration_days:0,    description:'Communications satellite orbit' },
    moon:   { name:'Lunar Mission',       alt_km:384400,dv_needed:15300, duration_days:3,    description:'Translunar injection + lunar orbit' },
    mars:   { name:'Mars Mission',        alt_km:0,     dv_needed:17500, duration_days:259,  description:'Hohmann transfer to Mars' },
    venus:  { name:'Venus Mission',       alt_km:0,     dv_needed:13800, duration_days:145,  description:'Hohmann transfer to Venus' },
    jupiter:{ name:'Jupiter Mission',     alt_km:0,     dv_needed:23000, duration_days:2730, description:'Direct trajectory to Jupiter' },
  };

  // ---- LAUNCH SITES ----
  const launchSites = [
    { name:'Kennedy Space Center LC-39A', lat:28.6, lon:-80.6, country:'USA', org:'SpaceX/NASA', vehicles:'Falcon 9, Falcon Heavy, SLS' },
    { name:'Baikonur Cosmodrome',         lat:45.9, lon:63.3,  country:'Kazakhstan', org:'Roscosmos', vehicles:'Soyuz, Proton' },
    { name:'Satish Dhawan Space Centre',  lat:13.7, lon:80.2,  country:'India', org:'ISRO', vehicles:'PSLV, GSLV, LVM3' },
    { name:'Wenchang Space Center',       lat:19.6, lon:110.9, country:'China', org:'CNSA', vehicles:'Long March 5, 7' },
    { name:'Kourou (ELA-4)',              lat:5.2,  lon:-52.8, country:'French Guiana', org:'ESA/Arianespace', vehicles:'Ariane 6, Vega-C' },
    { name:'Vandenberg SFB SLC-4E',       lat:34.6, lon:-120.6,country:'USA', org:'SpaceX', vehicles:'Falcon 9 (polar)' },
    { name:'Mahia Peninsula LC-1',        lat:-39.3,lon:177.9, country:'New Zealand', org:'RocketLab', vehicles:'Electron' },
  ];

  // ---- HELPERS ----
  const rnd = (a,b) => a + Math.random()*(b-a);
  const rndInt = (a,b) => Math.floor(rnd(a,b+1));

  function addLog(msg, level='info') {
    const ts = new Date().toLocaleTimeString('en-US',{hour12:false});
    state.logs.unshift({ ts, msg, level });
    if (state.logs.length > 200) state.logs.pop();
  }

  function getRocket(id) { return rockets[id] || rockets.falcon9; }

  let _cpu=30;
  function sysMetrics(){
    _cpu = Math.max(10,Math.min(90,_cpu+(Math.random()-.5)*12));
    return { cpu:Math.round(_cpu) };
  }

  return { state, engines, rockets, materials, missions, launchSites, getRocket, addLog, sysMetrics, rnd, rndInt };
})();
