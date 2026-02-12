/**
 * Path morph module (approximation).
 *
 * This is NOT a segment-structure morph. It samples both paths by length and
 * rebuilds an interpolated polyline path. It is visually good in many cases
 * but it is not guaranteed to match Svgator perfectly.
 */
"use strict";

function pathMorphModule(opts) {
  const samples = Number.isFinite(opts.morphSamples) ? opts.morphSamples : 80;

  return `
/* ---------------- Path morph (approx) ---------------- */
const __PATH_MORPH_SAMPLES=${samples};
const __pathCache=new Map();

function getTmpPath(svg){
  let p=__pathCache.get("__tmp_el");
  if(p && p.ownerSVGElement) return p;
  const ns=svg.namespaceURI || "http://www.w3.org/2000/svg";
  p=document.createElementNS(ns,"path");
  p.setAttribute("fill","none");
  p.setAttribute("stroke","none");
  p.setAttribute("opacity","0");
  p.setAttribute("pointer-events","none");
  const defs = svg.querySelector("defs") || svg;
  defs.appendChild(p);
  __pathCache.set("__tmp_el", p);
  return p;
}

function isClosed(arr){
  if(!arr || arr.length<4) return false;
  const dx=arr[0]-arr[arr.length-2];
  const dy=arr[1]-arr[arr.length-1];
  return (dx*dx+dy*dy) < 1e-2;
}

function samplePath(svg, d, samples){
  d=unwrapPathFn(d);
  const key=d+"::"+samples;
  const cached=__pathCache.get(key);
  if(cached) return cached;

  const p=getTmpPath(svg);
  try{
    p.setAttribute("d", d);
    const len=p.getTotalLength();
    const pts=new Array(samples*2);
    for(let i=0;i<samples;i++){
      const t = (samples===1)?0:(i/(samples-1));
      const pt=p.getPointAtLength(len*t);
      pts[i*2]=pt.x; pts[i*2+1]=pt.y;
    }
    const out={pts, closed:isClosed(pts)};
    __pathCache.set(key,out);
    return out;
  }catch{
    const fallback={pts:[0,0],closed:false};
    __pathCache.set(key,fallback);
    return fallback;
  }
}

function morphPath(svg, a, b, t){
  a=unwrapPathFn(a);
  b=unwrapPathFn(b);
  if(a===b) return a;

  const S=__PATH_MORPH_SAMPLES;
  const A=samplePath(svg,a,S);
  const B=samplePath(svg,b,S);

  const out=new Array(A.pts.length);
  for(let i=0;i<out.length;i++) out[i]=lerp(A.pts[i],B.pts[i],t);

  let d="M "+out[0]+" "+out[1];
  for(let i=2;i<out.length;i+=2) d+=" L "+out[i]+" "+out[i+1];
  if(A.closed && B.closed) d+=" Z";
  return d;
}
`;
}

module.exports = { pathMorphModule };
