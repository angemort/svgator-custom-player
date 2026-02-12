/**
 * Core runtime utilities shared by modules.
 *
 * This module is always included.
 */
"use strict";

function coreModule(opts) {
  const scrollThreshold = Number.isFinite(opts.scrollThreshold) ? opts.scrollThreshold : 25;

  return `
/* ---------------- Core utilities ---------------- */
const EPS=1e-6;
const clamp01=(x)=>x<0?0:x>1?1:x;
const lerp=(a,b,t)=>a+(b-a)*t;

// Safe CSS.escape fallback (works for typical SVG ids)
const esc=(s)=>(typeof CSS!=="undefined"&&CSS&&CSS.escape?CSS.escape(s):String(s).replace(/[^a-zA-Z0-9_\\-]/g,(c)=>"\\\\"
  +c.charCodeAt(0).toString(16)+" "));

// Parse keyframe tracks
function segment(track,timeMs){
  if(!Array.isArray(track)||track.length===0) return null;
  if(timeMs<=track[0].t) return track[0].v;
  const last=track[track.length-1];
  if(timeMs>=last.t) return last.v;
  for(let i=1;i<track.length;i++){
    const a=track[i-1], b=track[i];
    if(timeMs<=b.t){
      const span=b.t-a.t;
      let t=span<=0?1:(timeMs-a.t)/span;
      // easing hook: bezier module installs __applyBezier
      if(a.e && Array.isArray(a.e) && a.e.length===4 && typeof __applyBezier==="function"){
        t=__applyBezier(a.e[0],a.e[1],a.e[2],a.e[3],t);
      }
      return {a:a.v,b:b.v,t};
    }
  }
  return last.v;
}

function interpNumber(v){
  if(v && typeof v==="object" && "a" in v && "b" in v && "t" in v) return lerp(+v.a||0,+v.b||0,v.t);
  return v;
}
function interpPoint(v,fallback){
  if(v && typeof v==="object" && "a" in v && "b" in v && "t" in v){
    return {x:lerp(v.a.x,v.b.x,v.t),y:lerp(v.a.y,v.b.y,v.t)};
  }
  return v??fallback;
}
function interpSize(v,fallback){
  if(v && typeof v==="object" && "a" in v && "b" in v && "t" in v){
    return {width:lerp(v.a.width,v.b.width,v.t),height:lerp(v.a.height,v.b.height,v.t)};
  }
  return v??fallback;
}

// Array helpers (dasharray, etc.)
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b);}
function repeatTo(arr,times){const out=[];for(let i=0;i<times;i++) for(let j=0;j<arr.length;j++) out.push(arr[j]); return out;}
function interpArray(v){
  if(Array.isArray(v)) return v;
  if(v && typeof v==="object" && "a" in v && "b" in v && "t" in v){
    let A=Array.isArray(v.a)?v.a:[], B=Array.isArray(v.b)?v.b:[];
    if(A.length===0 && B.length===0) return [];
    if(A.length===0) return B.slice();
    if(B.length===0) return A.slice();
    if(A.length!==B.length){
      const target=lcm(A.length,B.length);
      A=repeatTo(A,target/A.length);
      B=repeatTo(B,target/B.length);
    }
    const out=new Array(A.length);
    for(let i=0;i<A.length;i++) out[i]=lerp(+A[i]||0,+B[i]||0,v.t);
    return out;
  }
  return null;
}
function arrayToString(arr){
  if(!arr||!arr.length) return "";
  let s="";
  for(let i=0;i<arr.length;i++){
    const n=Math.round((arr[i]+Number.EPSILON)*1e6)/1e6;
    s += (i?" ":"")+n;
  }
  return s;
}

// DOM helpers
function getById(svg,id){
  return svg.getElementById ? svg.getElementById(id) : document.getElementById(id);
}
function unwrapPathFn(s){
  if(typeof s!=="string") return s;
  const m=s.match(/^\\s*path\\((['"])([\\s\\S]*)\\1\\)\\s*$/);
  return m ? m[2] : s;
}

// Visibility watcher for scroll triggers (IntersectionObserver + fallback)
function createVisibilityWatcher(el, thresholdPercent, cb){
  const thr = Math.max(1, Math.min(100, thresholdPercent||${scrollThreshold}));
  if("IntersectionObserver" in window){
    const obs = new IntersectionObserver((entries)=>{
      for(const e of entries){
        if(e.target!==el) continue;
        const p = e.intersectionRatio*100;
        cb(p>=thr);
      }
    }, { threshold: [thr/100] });
    obs.observe(el);
    return ()=>obs.disconnect();
  }
  const handler=()=>{
    const r=el.getBoundingClientRect();
    const vw=window.innerWidth, vh=window.innerHeight;
    const ix=Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const iy=Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    const area = Math.max(0, r.width*r.height);
    const vis = area>0 ? (ix*iy)/area*100 : 0;
    cb(vis>=thr);
  };
  window.addEventListener("scroll", handler, {passive:true});
  window.addEventListener("resize", handler);
  handler();
  return ()=>{ window.removeEventListener("scroll", handler); window.removeEventListener("resize", handler); };
}
`;
}

module.exports = { coreModule };
