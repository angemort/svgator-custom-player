/**
 * Triggers + main player module.
 *
 * Includes:
 * - timeline math (iterations/alternate/direction/fill)
 * - runtime player (RAF loop, fps throttling)
 * - triggers: click/hover/scroll/load
 * - public API: play/pause/stop/toggle/restart/reverse/seek/seekRatio
 */
"use strict";

function triggersModule(opts, features) {
  const defaultScroll = Number.isFinite(opts.scrollThreshold) ? opts.scrollThreshold : 25;

  // We only generate the transform block if the transform module exists.
  const transformBlock = features.transform
    ? `
      if(def.transform && typeof composeTransform==="function"){
        const data=def.transform.data||{};
        const keys=def.transform.keys||{};
        const origin = keys.o ? interpPoint(segment(keys.o,timeMs), data.o) : data.o;
        const rotate = keys.r ? interpNumber(segment(keys.r,timeMs)) : (data.r||0);
        const scale  = keys.s ? interpPoint(segment(keys.s,timeMs), data.s||{x:1,y:1}) : (data.s||{x:1,y:1});
        const trans  = keys.t ? interpPoint(segment(keys.t,timeMs), data.t||{x:0,y:0}) : (data.t||{x:0,y:0});

        const m=composeTransform(
          origin ? {x:origin.x||0,y:origin.y||0} : null,
          rotate||0,
          scale ? {x:scale.x??1,y:scale.y??1} : {x:1,y:1},
          trans ? {x:trans.x||0,y:trans.y||0} : null
        );
        node.setAttribute("transform", mToString(m));
      }
`
    : "";

  return `
/* ---------------- Timeline + player + triggers ---------------- */
function maxKeyTime(elements){
  let maxT=0;
  const scan=(track)=>{
    if(!Array.isArray(track)) return;
    for(const k of track) if(k && typeof k.t==="number") maxT=Math.max(maxT,k.t);
  };
  for(const id of Object.keys(elements||{})){
    const el=elements[id]; if(!el) continue;
    scan(el.opacity);
    scan(el["fill-opacity"]);
    scan(el["stroke-opacity"]);
    scan(el["stroke-width"]);
    scan(el["stroke-dashoffset"]);
    scan(el["stroke-dasharray"]);
    scan(el["#size"]);
    scan(el.fill);
    scan(el.stroke);
    scan(el.mask);
    scan(el["clip-path"]);
    scan(el.points);
    scan(el.d);
    if(el["#filter"] && el["#filter"].keys) scan(el["#filter"].keys);
    scan(el.filter);

    const tr=el.transform;
    if(tr && tr.keys){
      scan(tr.keys.o); scan(tr.keys.r); scan(tr.keys.s); scan(tr.keys.t);
    }
  }
  return maxT;
}

function computePlayback(globalMs, duration, s, reverseFlag){
  const speed = typeof s.speed==="number" ? s.speed : 1;
  globalMs *= speed;

  const dir0 = (s.direction === -1) ? -1 : 1;
  const dir = reverseFlag ? -dir0 : dir0;
  const alt = !!s.alternate;
  const itRaw = (typeof s.iterations==="number") ? s.iterations : 1;
  const it = (itRaw === 0) ? Infinity : (itRaw > 0 ? itRaw : 1);
  const fill = (typeof s.fill==="number") ? s.fill : 1;

  if(duration<=0) return {t:0, done:true};

  const total = (it===Infinity) ? Infinity : it*duration;
  const done = (it!==Infinity) && (globalMs>=total);

  if(done){
    const even = (it % 2 === 0);
    const holdEnd = ((dir > 0) !== (alt && even)) ? duration : 0;
    if(fill===-1) return {t:(dir>0?0:duration), done:true};
    return {t:holdEnd, done:true};
  }

  let iter = Math.floor(globalMs / duration);
  let t = globalMs - iter*duration; // 0..duration
  if(dir<0) t = duration - t;
  if(alt && (iter%2===1)) t = duration - t;
  return {t, done:false};
}

function createPlayer(svg, anim){
  const elements=anim.elements||{};
  const s=anim.s||{};
  const fps = typeof s.fps==="number" ? s.fps : 0;
  const duration=Math.max(Number(s.duration||0), maxKeyTime(elements));

  const refs={};
  for(const id of Object.keys(elements)){
    const el=svg.querySelector("#"+esc(id));
    if(el) refs[id]=el;
  }

  let running=false;
  let raf=0;
  let start=0;
  let offset=0;
  let lastDraw=-Infinity;
  let reverseFlag=false;

  const draw=(timeMs)=>{
    for(const id of Object.keys(elements)){
      const node=refs[id]; if(!node) continue;
      const def=elements[id];

      // numeric props
      if(def.opacity){ const v=segment(def.opacity,timeMs); const x=interpNumber(v); if(x!=null) node.setAttribute("opacity", String(x)); }
      if(def["fill-opacity"]){ const v=segment(def["fill-opacity"],timeMs); const x=interpNumber(v); if(x!=null) node.setAttribute("fill-opacity", String(x)); }
      if(def["stroke-opacity"]){ const v=segment(def["stroke-opacity"],timeMs); const x=interpNumber(v); if(x!=null) node.setAttribute("stroke-opacity", String(x)); }
      if(def["stroke-width"]){ const v=segment(def["stroke-width"],timeMs); const x=interpNumber(v); if(x!=null) node.setAttribute("stroke-width", String(x)); }
      if(def["stroke-dashoffset"]){ const v=segment(def["stroke-dashoffset"],timeMs); const x=interpNumber(v); if(x!=null) node.setAttribute("stroke-dashoffset", String(x)); }
      if(def["stroke-dasharray"]){ const v=segment(def["stroke-dasharray"],timeMs); const arr=interpArray(v); if(arr!=null) node.setAttribute("stroke-dasharray", arrayToString(arr)); }
      if(def["#size"]){ const v=segment(def["#size"],timeMs); const sz=interpSize(v,null); if(sz){ node.setAttribute("width", String(sz.width)); node.setAttribute("height", String(sz.height)); } }

      // paints
      if(def.fill){
        const v=segment(def.fill,timeMs);
        const pv=interpPaintValue(v);
        const attr=paintToAttr(pv);
        if(attr!=null) node.setAttribute("fill", String(attr));
        if(pv && typeof pv==="object" && pv.t==="g" && typeof applyGradient==="function") applyGradient(svg, pv);
      }
      if(def.stroke){
        const v=segment(def.stroke,timeMs);
        const pv=interpPaintValue(v);
        const attr=paintToAttr(pv);
        if(attr!=null) node.setAttribute("stroke", String(attr));
        if(pv && typeof pv==="object" && pv.t==="g" && typeof applyGradient==="function") applyGradient(svg, pv);
      }

      // mask / clip-path / filter attribute switching
      if(def.mask){ const v=segment(def.mask,timeMs); if(v!=null) node.setAttribute("mask", String(v)); }
      if(def["clip-path"]){ const v=segment(def["clip-path"],timeMs); if(v!=null) node.setAttribute("clip-path", String(v)); }
      if(def.filter){ const v=segment(def.filter,timeMs); if(v!=null) node.setAttribute("filter", String(v)); }

      // Svgator-like animated filter internals:
      // "#filter": {data:{items:...}, keys:[...]}
      if(def["#filter"] && def["#filter"].data && def["#filter"].keys && typeof interpFilterStack==="function" && typeof applyFilterItems==="function"){
        const fv=segment(def["#filter"].keys,timeMs);
        const stack=interpFilterStack(fv);
        if(stack) applyFilterItems(svg, def["#filter"].data, stack);
      }

      // points
      if(def.points && typeof interpPoints==="function"){
        const v=segment(def.points,timeMs);
        const pv=interpPoints(v);
        if(pv!=null) node.setAttribute("points", pv);
      }

      // path d morph
      if(def.d){
        const v=segment(def.d,timeMs);
        if(typeof v==="string"){
          node.setAttribute("d", unwrapPathFn(v));
        }else if(v && typeof v==="object" && "a" in v && "b" in v && "t" in v && typeof morphPath==="function"){
          node.setAttribute("d", morphPath(svg, v.a, v.b, v.t));
        }
      }

${transformBlock}
    }
  };

  const frame=(now)=>{
    if(!running) return;

    const raw=(now-start)+offset;

    if(fps>0){
      const step=1000/fps;
      if(raw-lastDraw<step){ raf=requestAnimationFrame(frame); return; }
      lastDraw=raw;
    }

    const pb=computePlayback(raw, duration, s, reverseFlag);
    draw(pb.t);

    if(pb.done){ running=false; return; }
    raf=requestAnimationFrame(frame);
  };

  return {
    play(){
      if(running) return;
      running=true;
      start=performance.now();
      raf=requestAnimationFrame(frame);
    },
    pause(){
      if(!running) return;
      running=false;
      cancelAnimationFrame(raf);
      offset += performance.now()-start;
    },
    stop(){
      running=false;
      cancelAnimationFrame(raf);
      offset=0;
      lastDraw=-Infinity;
      const pb=computePlayback(0, duration, s, reverseFlag);
      draw(pb.t);
    },
    seek(ms){
      ms = Math.max(0, +ms || 0);
      offset = ms;
      start = performance.now();
      const pb=computePlayback(0, duration, s, reverseFlag);
      draw(pb.t);
    },
    seekRatio(r){
      r=clamp01(+r||0);
      const itRaw=(typeof s.iterations==="number")?s.iterations:1;
      const it=(itRaw===0)?Infinity:(itRaw>0?itRaw:1);
      const total=(it===Infinity)?duration:(it*duration);
      this.seek(total*r);
    },
    reverse(){
      reverseFlag=!reverseFlag;
      const pb=computePlayback(0, duration, s, reverseFlag);
      draw(pb.t);
    },
    toggle(){
      if(running) this.pause(); else this.play();
    },
    restart(){
      this.stop();
      this.play();
    },
    get state(){
      return { running, offset, reverse: reverseFlag, duration };
    }
  };
}

// Boot + trigger wiring
function boot(){
  const rootId=payload.root;
  const svg=document.getElementById(rootId) ||
    (document.documentElement && document.documentElement.tagName.toLowerCase()==="svg" ? document.documentElement : null);
  if(!svg) return;

  const anims=Array.isArray(payload.animations)?payload.animations:[];
  const players=anims.map((a)=>createPlayer(svg,a));

  const options = payload.options || {};
  const startMode = options.start || "load";

  if(startMode==="click"){
    svg.addEventListener("click", ()=>players.forEach((p)=>p.play()));
  }else if(startMode==="hover"){
    svg.addEventListener("mouseenter", ()=>players.forEach((p)=>p.play()));
    svg.addEventListener("mouseleave", ()=>{
      const mode = options.hover || "freeze";
      if(mode==="reset") players.forEach((p)=>p.stop());
      else if(mode==="reverse"){ players.forEach((p)=>p.reverse()); players.forEach((p)=>p.play()); }
      else if(mode==="freeze") players.forEach((p)=>p.pause());
    });
  }else if(startMode==="scroll"){
    const thr = options.scroll || ${defaultScroll};
    const unwatch = createVisibilityWatcher(svg, thr, (visible)=>{
      if(visible) players.forEach((p)=>p.play());
      else players.forEach((p)=>p.pause());
    });
    svg.__customUnwatch = unwatch;
  }else{
    players.forEach((p)=>p.play());
  }

  // Expose API
  svg.__customPlayers = players;
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded", boot, {once:true});
  window.addEventListener("load", boot, {once:true});
}else{
  boot();
}
`;
}

module.exports = { triggersModule };
