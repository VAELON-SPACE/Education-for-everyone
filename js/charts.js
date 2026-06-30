// RocketLab — Charts | Viren Singh 2026
const RocketCharts = (() => {
  const C = { orange:'#e05c1a',cyan:'#00d4ff',green:'#00e676',amber:'#ffa726',red:'#ff4444',violet:'#9c6fe8',text:'#eef0f8',text2:'#8892aa',text3:'#4a5168',text4:'#2d3245',border:'rgba(255,255,255,0.07)',bg:'#0a0c10',bg2:'#0d1018',surface:'#13161f',surface2:'#1a1e2a',surface3:'#222736' };
  const P = [C.orange,C.cyan,C.green,C.amber,C.violet,C.red];

  function setup(id) {
    const c = document.getElementById(id); if (!c) return null;
    c.width = c.offsetWidth||400; c.height = c.offsetHeight||200;
    const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
    return { ctx, w:c.width, h:c.height };
  }

  function grid(ctx,w,h,px,py) {
    ctx.strokeStyle=C.border; ctx.lineWidth=1;
    for(let i=1;i<=4;i++){ctx.beginPath();ctx.moveTo(px,py+(h-py-28)*i/4);ctx.lineTo(w-12,py+(h-py-28)*i/4);ctx.stroke();}
  }
  function axes(ctx,w,h,px,py) {
    ctx.strokeStyle=C.text4; ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(px,py-8);ctx.lineTo(px,h-28);ctx.lineTo(w-12,h-28);ctx.stroke();
  }

  function lineChart(id, datasets, opts={}) {
    const r=setup(id); if(!r)return;
    const {ctx,w,h}=r, px=opts.px||52, py=opts.py||18;
    const all=datasets.flatMap(d=>d.data);
    const minY=opts.minY!==undefined?opts.minY:Math.min(...all)*.95;
    const maxY=opts.maxY!==undefined?opts.maxY:Math.max(...all)*1.05;
    const ry=maxY-minY||1;
    const labels=opts.labels||datasets[0].data.map((_,i)=>i+1);
    grid(ctx,w,h,px,py); axes(ctx,w,h,px,py);
    ctx.fillStyle=C.text3; ctx.font='10px JetBrains Mono'; ctx.textAlign='right';
    for(let i=0;i<=4;i++){const val=minY+ry*(4-i)/4,y=py+(h-py-28)*i/4;ctx.fillText(opts.fmt?opts.fmt(val):val.toFixed(opts.dec||1),px-5,y+3);}
    ctx.textAlign='center'; const step=Math.max(1,Math.floor(labels.length/6));
    labels.forEach((l,i)=>{if(i%step===0){ctx.fillStyle=C.text3;ctx.font='10px JetBrains Mono';ctx.fillText(l,px+(w-px-12)*i/(labels.length-1),h-10);}});
    datasets.forEach((d,di)=>{
      const color=d.color||P[di%P.length];
      const pts=d.data.map((v,i)=>({x:px+(w-px-12)*i/(d.data.length-1),y:py+(h-py-28)*(1-(v-minY)/ry)}));
      if(d.fill){const g=ctx.createLinearGradient(0,py,0,h-28);g.addColorStop(0,color+'28');g.addColorStop(1,color+'04');ctx.beginPath();ctx.moveTo(pts[0].x,h-28);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,h-28);ctx.closePath();ctx.fillStyle=g;ctx.fill();}
      ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=d.w||2;ctx.lineJoin='round';
      if(d.dash)ctx.setLineDash(d.dash);
      pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);
    });
    if(opts.legend){let lx=px+8;datasets.forEach((d,di)=>{const color=d.color||P[di%P.length];ctx.fillStyle=color;ctx.fillRect(lx,py,12,3);ctx.fillStyle=C.text2;ctx.font='10px JetBrains Mono';ctx.textAlign='left';ctx.fillText(d.label||`S${di}`,lx+15,py+4);lx+=ctx.measureText(d.label||`S${di}`).width+32;});}
  }

  function barChart(id,labels,values,opts={}) {
    const r=setup(id); if(!r)return;
    const {ctx,w,h}=r, px=opts.px||52, py=opts.py||18;
    const maxV=Math.max(...values.map(Math.abs))*1.1||1;
    grid(ctx,w,h,px,py); axes(ctx,w,h,px,py);
    ctx.fillStyle=C.text3;ctx.font='10px JetBrains Mono';ctx.textAlign='right';
    for(let i=0;i<=4;i++){const val=maxV*(4-i)/4,y=py+(h-py-28)*i/4;ctx.fillText(val.toFixed(opts.dec||0),px-5,y+3);}
    const bw=Math.max(6,(w-px-12)/values.length*.65);
    const gap=(w-px-12-bw*values.length)/(values.length+1);
    values.forEach((v,i)=>{
      const bh=(h-py-28)*(Math.abs(v)/maxV), x=px+gap+i*(bw+gap), y=h-28-bh;
      const color=Array.isArray(opts.colors)?opts.colors[i]:opts.color||C.orange;
      const g=ctx.createLinearGradient(x,y,x,h-28);g.addColorStop(0,color);g.addColorStop(1,color+'44');
      ctx.fillStyle=g;
      if(ctx.roundRect)ctx.roundRect(x,y,bw,bh,[2,2,0,0]);else ctx.rect(x,y,bw,bh);ctx.fill();
      ctx.textAlign='center';ctx.fillStyle=C.text3;ctx.font='9px JetBrains Mono';
      if(bw>24)ctx.fillText(String(labels[i]).substring(0,8),x+bw/2,h-12);
    });
  }

  function hBar(id,labels,values,opts={}) {
    const r=setup(id); if(!r)return;
    const {ctx,w,h}=r, px=opts.px||130;
    const maxV=Math.max(...values.map(Math.abs))*1.05||1;
    const rowH=h/labels.length;
    labels.forEach((lbl,i)=>{
      const y=i*rowH, bw=(w-px-16)*Math.abs(values[i])/maxV;
      const color=Array.isArray(opts.colors)?opts.colors[i]:opts.color||C.orange;
      ctx.fillStyle=C.text2;ctx.font='11px JetBrains Mono';ctx.textAlign='right';ctx.fillText(String(lbl).substring(0,16),px-7,y+rowH/2+4);
      const g=ctx.createLinearGradient(px,0,px+bw,0);g.addColorStop(0,color);g.addColorStop(1,color+'44');
      ctx.fillStyle=g;if(ctx.roundRect)ctx.roundRect(px,y+rowH*.2,Math.max(2,bw),rowH*.6,2);else ctx.rect(px,y+rowH*.2,Math.max(2,bw),rowH*.6);ctx.fill();
      ctx.fillStyle=color;ctx.textAlign='left';ctx.font='10px JetBrains Mono';ctx.fillText(typeof values[i]==='number'?values[i].toLocaleString():values[i],px+bw+6,y+rowH/2+4);
    });
  }

  function trajectoryChart(id, trajectory) {
    const r=setup(id); if(!r)return;
    const {ctx,w,h}=r;
    if(!trajectory||!trajectory.length)return;
    const maxAlt=Math.max(...trajectory.map(t=>t.alt));
    const maxDR=Math.max(...trajectory.map(t=>t.downrange))||1;
    const px=52,py=18;
    // bg gradient
    const skyGrad=ctx.createLinearGradient(0,0,0,h);
    skyGrad.addColorStop(0,'#000005');skyGrad.addColorStop(0.3,'#0a1628');skyGrad.addColorStop(0.7,'#0d2040');skyGrad.addColorStop(1,'#1a1a2e');
    ctx.fillStyle=skyGrad;ctx.fillRect(0,0,w,h);
    // atmosphere layers
    const layers=[{alt:11000,color:'rgba(0,100,200,.04)',label:'Troposphere'},{alt:50000,color:'rgba(0,150,100,.03)',label:'Stratosphere'},{alt:86000,color:'rgba(100,0,200,.03)',label:'Mesosphere'},{alt:120000,color:'rgba(200,100,0,.02)',label:'Thermosphere'}];
    layers.forEach(l=>{const y=h-28-(h-py-28)*(l.alt/Math.max(maxAlt,200000));ctx.fillStyle=l.color;ctx.fillRect(px,y,w-px-12,(h-28)-y);ctx.fillStyle='rgba(255,255,255,.06)';ctx.font='9px JetBrains Mono';ctx.textAlign='right';ctx.fillText(l.label,w-14,y+10);});
    grid(ctx,w,h,px,py);axes(ctx,w,h,px,py);
    // Y axis labels (altitude)
    ctx.fillStyle=C.text3;ctx.font='10px JetBrains Mono';ctx.textAlign='right';
    for(let i=0;i<=4;i++){const val=(maxAlt*(4-i)/4/1000).toFixed(0);ctx.fillText(val+'km',px-5,py+(h-py-28)*i/4+3);}
    // trajectory path
    ctx.beginPath();ctx.strokeStyle=C.orange;ctx.lineWidth=2.5;ctx.lineJoin='round';
    trajectory.forEach((pt,i)=>{
      const x=px+(w-px-12)*(pt.downrange/maxDR);
      const y=py+(h-py-28)*(1-pt.alt/Math.max(maxAlt,1));
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });ctx.stroke();
    // MaxQ marker
    const mqPt=trajectory.reduce((a,b)=>b.q>a.q?b:a,trajectory[0]);
    const mqX=px+(w-px-12)*(mqPt.downrange/maxDR);
    const mqY=py+(h-py-28)*(1-mqPt.alt/Math.max(maxAlt,1));
    ctx.beginPath();ctx.arc(mqX,mqY,5,0,Math.PI*2);ctx.fillStyle=C.red;ctx.fill();
    ctx.fillStyle=C.red;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='center';ctx.fillText('MAX-Q',mqX,mqY-10);
    // Launch pad
    ctx.beginPath();ctx.arc(px,h-28,4,0,Math.PI*2);ctx.fillStyle=C.green;ctx.fill();
    ctx.fillStyle=C.green;ctx.font='10px JetBrains Mono';ctx.textAlign='left';ctx.fillText('T-0',px+8,h-22);
    // Apogee
    const apex=trajectory.reduce((a,b)=>b.alt>a.alt?b:a,trajectory[0]);
    const apX=px+(w-px-12)*(apex.downrange/maxDR);
    const apY=py+(h-py-28)*(1-apex.alt/Math.max(maxAlt,1));
    ctx.beginPath();ctx.arc(apX,apY,4,0,Math.PI*2);ctx.fillStyle=C.amber;ctx.fill();
    ctx.fillStyle=C.amber;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='center';ctx.fillText('APOGEE',apX,apY-10);
  }

  function gaugeChart(id, value, max, color=C.orange, label='') {
    const r=setup(id); if(!r)return;
    const {ctx,w,h}=r;
    const cx=w/2,cy=h*.65,radius=Math.min(w,h)*.4;
    const startAngle=Math.PI*.8,endAngle=Math.PI*2.2;
    const pct=Math.min(1,value/max);
    // Track
    ctx.beginPath();ctx.arc(cx,cy,radius,startAngle,endAngle);ctx.strokeStyle=C.surface3;ctx.lineWidth=14;ctx.lineCap='round';ctx.stroke();
    // Fill
    const fillEnd=startAngle+(endAngle-startAngle)*pct;
    const g=ctx.createLinearGradient(cx-radius,cy,cx+radius,cy);
    g.addColorStop(0,C.green);g.addColorStop(0.6,C.amber);g.addColorStop(1,C.red);
    ctx.beginPath();ctx.arc(cx,cy,radius,startAngle,fillEnd);ctx.strokeStyle=g;ctx.lineWidth=14;ctx.lineCap='round';ctx.stroke();
    // Value
    ctx.fillStyle=C.text;ctx.font=`bold ${Math.floor(h*.2)}px Space Grotesk`;ctx.textAlign='center';
    ctx.fillText(typeof value==='number'?value.toFixed(1):value,cx,cy+6);
    ctx.fillStyle=C.text3;ctx.font='11px JetBrains Mono';ctx.fillText(label,cx,cy+26);
    // Min/Max
    ctx.fillStyle=C.text4;ctx.font='9px JetBrains Mono';
    ctx.textAlign='left';ctx.fillText('0',cx-radius*.8,cy+radius*.5);
    ctx.textAlign='right';ctx.fillText(max,cx+radius*.8,cy+radius*.5);
  }

  function solarSystemMap(id, rocket, destination) {
    const r=setup(id); if(!r)return;
    const {ctx,w,h}=r;
    ctx.fillStyle='#020408';ctx.fillRect(0,0,w,h);
    // Stars
    for(let i=0;i<80;i++){ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*.8,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${Math.random()*.5})`;ctx.fill();}
    const cx=w*.15,cy=h/2;
    // Sun
    const sunGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,28);
    sunGrad.addColorStop(0,'#fffde7');sunGrad.addColorStop(.4,'#ffab00');sunGrad.addColorStop(1,'rgba(255,171,0,0)');
    ctx.beginPath();ctx.arc(cx,cy,28,0,Math.PI*2);ctx.fillStyle=sunGrad;ctx.fill();
    ctx.fillStyle='#fff9c4';ctx.font='bold 11px JetBrains Mono';ctx.textAlign='center';ctx.fillText('SUN',cx,cy+44);
    // Planets
    const planets=[
      {name:'Mercury',dist:.25,color:'#9E9E9E',r:4},
      {name:'Venus',dist:.38,color:'#FFF176',r:6},
      {name:'Earth',dist:.5,color:'#2196F3',r:7},
      {name:'Mars',dist:.62,color:'#E57373',r:5},
      {name:'Jupiter',dist:.75,color:'#FF8A65',r:14},
      {name:'Saturn',dist:.87,color:'#FFD54F',r:11},
    ];
    planets.forEach(p=>{
      const px2=cx+(w-cx-20)*p.dist;
      // Orbit ring
      ctx.beginPath();ctx.arc(cx,cy,(px2-cx),0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;ctx.stroke();
      // Planet
      const py2=cy+(Math.random()-.5)*30;
      const grad=ctx.createRadialGradient(px2-p.r*.3,py2-p.r*.3,0,px2,py2,p.r);
      grad.addColorStop(0,'rgba(255,255,255,.3)');grad.addColorStop(1,p.color);
      ctx.beginPath();ctx.arc(px2,py2,p.r,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
      ctx.fillStyle=C.text3;ctx.font='9px JetBrains Mono';ctx.textAlign='center';ctx.fillText(p.name,px2,py2+p.r+14);
    });
    // Trajectory arrow to destination
    if(destination){
      const destPlanet=planets.find(p=>p.name.toLowerCase()===destination);
      if(destPlanet){
        const dx=cx+(w-cx-20)*destPlanet.dist, dy=cy;
        ctx.beginPath();ctx.moveTo(cx+40,cy-20);
        ctx.bezierCurveTo(cx+(dx-cx)*.3,cy-60,cx+(dx-cx)*.7,cy-40,dx-20,dy);
        ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
        // Arrowhead
        ctx.beginPath();ctx.moveTo(dx-20,dy);ctx.lineTo(dx-32,dy-8);ctx.lineTo(dx-32,dy+8);ctx.closePath();ctx.fillStyle=C.orange;ctx.fill();
        ctx.fillStyle=C.orange;ctx.font='bold 11px JetBrains Mono';ctx.textAlign='center';ctx.fillText('TARGET',dx,dy-20);
      }
    }
  }

  function stressChart(id, components) {
    if(!components||!components.length)return;
    const labels=components.map(c=>c.name.substring(0,12));
    const values=components.map(c=>Math.min(2,c.ratio)*100);
    const colors=components.map(c=>c.status==='safe'?C.green:c.status==='marginal'?C.amber:C.red);
    barChart(id,labels,values,{colors,dec:0});
  }

  function realtimeTelemetry(id, data) {
    const r=setup(id); if(!r)return;
    const {ctx,w,h}=r;
    ctx.fillStyle=C.bg2;ctx.fillRect(0,0,w,h);
    const metrics=[
      {label:'ALTITUDE',value:data.alt?.toFixed(0)||'0',unit:'m',color:C.cyan},
      {label:'VELOCITY',value:data.vel?.toFixed(1)||'0',unit:'m/s',color:C.orange},
      {label:'MACH',value:data.mach?.toFixed(2)||'0.00',unit:'',color:C.amber},
      {label:'G-LOAD',value:data.g_load?.toFixed(2)||'1.00',unit:'g',color:C.red},
      {label:'DYN PRES',value:((data.q||0)/1000).toFixed(1),unit:'kPa',color:C.violet},
      {label:'THRUST',value:((data.thrust||0)/1000).toFixed(0),unit:'kN',color:C.green},
    ];
    const cols=3, rows=2, cw=w/cols, ch=h/rows;
    metrics.forEach((m,i)=>{
      const col=i%cols, row=Math.floor(i/cols);
      const x=col*cw, y=row*ch;
      ctx.strokeStyle=C.border;ctx.lineWidth=1;ctx.strokeRect(x,y,cw,ch);
      ctx.fillStyle=m.color+'20';ctx.fillRect(x,y,cw,ch);
      ctx.fillStyle=C.text4;ctx.font='9px JetBrains Mono';ctx.textAlign='center';ctx.fillText(m.label,x+cw/2,y+18);
      ctx.fillStyle=m.color;ctx.font=`bold ${Math.floor(cw*.12)}px Space Grotesk`;ctx.textAlign='center';ctx.fillText(m.value,x+cw/2,y+ch*.65);
      ctx.fillStyle=C.text3;ctx.font='10px JetBrains Mono';ctx.fillText(m.unit,x+cw/2,y+ch*.85);
    });
  }

  return { lineChart, barChart, hBar, trajectoryChart, gaugeChart, solarSystemMap, stressChart, realtimeTelemetry };
})();
