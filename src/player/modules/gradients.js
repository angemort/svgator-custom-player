/**
 * Gradient module:
 * - interpolates gradient stops + transforms
 * - applies changes to the existing <linearGradient>/<radialGradient> DOM node
 */
"use strict";

function gradientsModule() {
  return `
/* ---------------- Gradients (t:"g") ---------------- */
const gradCache=new Map();

function normalizeStops(stops, targetLen){
  const out=[];
  for(let i=0;i<targetLen;i++){
    const src=stops[Math.min(i,stops.length-1)];
    out.push({o:src.o, c:src.c});
  }
  return out;
}
function interpStops(aStops,bStops,t){
  const len=Math.max(aStops.length,bStops.length);
  const A=normalizeStops(aStops,len);
  const B=normalizeStops(bStops,len);
  const out=new Array(len);
  for(let i=0;i<len;i++){
    out[i]={o:lerp(A[i].o,B[i].o,t), c: interpColor(A[i].c,B[i].c,t)};
  }
  return out;
}
function interpArray6(a,b,t){
  const out=new Array(6);
  for(let i=0;i<6;i++) out[i]=lerp(a[i],b[i],t);
  return out;
}
function interpGradient(A,B,t){
  const g={t:"g", r:A.r};
  g.s = interpStops(A.s||[], B.s||[], t);
  if(A.gt && B.gt) g.gt = interpArray6(A.gt,B.gt,t);
  if(A.c && B.c) g.c = {x:lerp(A.c.x,B.c.x,t), y:lerp(A.c.y,B.c.y,t)};
  if(A.rd!=null && B.rd!=null) g.rd = lerp(A.rd,B.rd,t);
  if(A.f && B.f) g.f = {x:lerp(A.f.x,B.f.x,t), y:lerp(A.f.y,B.f.y,t)};
  if(A.to && B.to) g.to = {x:lerp(A.to.x,B.to.x,t), y:lerp(A.to.y,B.to.y,t)};
  return g;
}

function applyGradient(svg, g){
  if(!g || g.t!=="g" || !g.r) return;

  let entry=gradCache.get(g.r);
  if(!entry){
    const ge=getById(svg, g.r);
    if(!ge) return;
    entry={ el: ge, stops: ge.querySelectorAll("stop") };
    gradCache.set(g.r, entry);
  }

  let stops=entry.stops;

  // Ensure stop count matches (clone last stop)
  if(g.s && g.s.length){
    const want=g.s.length;
    if(stops.length < want){
      const last = stops.length ? stops[stops.length-1] : null;
      for(let i=stops.length;i<want;i++){
        const clone = last ? last.cloneNode(true) : document.createElementNS(entry.el.namespaceURI,"stop");
        clone.setAttribute("offset","1");
        entry.el.appendChild(clone);
      }
      stops=entry.el.querySelectorAll("stop");
      entry.stops=stops;
    }

    for(let i=0;i<want;i++){
      const st=g.s[Math.min(i,want-1)];
      stops[i].setAttribute("stop-color", colorToString(st.c));
      stops[i].setAttribute("offset", String(st.o));
    }
  }

  // Transform
  if(g.gt && Array.isArray(g.gt) && g.gt.length===6){
    entry.el.setAttribute("gradientTransform","matrix("+g.gt.join(" ")+")");
  }

  // Linear vs radial attributes (Svgator exports use these keys)
  if(g.c && (g.c.x!=null && g.c.y!=null)) { entry.el.setAttribute("cx", String(g.c.x)); entry.el.setAttribute("cy", String(g.c.y)); }
  if(g.rd!=null) entry.el.setAttribute("r", String(g.rd));
  if(g.f && (g.f.x!=null && g.f.y!=null)) { entry.el.setAttribute("x1", String(g.f.x)); entry.el.setAttribute("y1", String(g.f.y)); }
  if(g.to && (g.to.x!=null && g.to.y!=null)) { entry.el.setAttribute("x2", String(g.to.x)); entry.el.setAttribute("y2", String(g.to.y)); }
}
`;
}

module.exports = { gradientsModule };
