/**
 * Paint module: solid colors + raw strings + paint interpolation helpers.
 */
"use strict";

function paintsModule() {
  return `
/* ---------------- Paints (solid + strings) ---------------- */
function colorToString(c){
  const r=Math.max(0,Math.min(255,Math.round(c.r)));
  const g=Math.max(0,Math.min(255,Math.round(c.g)));
  const b=Math.max(0,Math.min(255,Math.round(c.b)));
  const a=c.a==null?1:c.a;
  if(a>=1-EPS) return "rgb("+r+", "+g+", "+b+")";
  return "rgba("+r+", "+g+", "+b+", "+a+")";
}
function interpColor(a,b,t){
  return { r:lerp(a.r,b.r,t), g:lerp(a.g,b.g,t), b:lerp(a.b,b.b,t), a:lerp(a.a??1,b.a??1,t) };
}
function interpPaintValue(v){
  if(v && typeof v==="object" && "a" in v && "b" in v && "t" in v){
    const A=v.a, B=v.b, t=v.t;
    if(typeof A==="string" || typeof B==="string") return (t<0.5?A:B);
    if(A && B && A.t==="c" && B.t==="c") return {t:"c", v: interpColor(A.v,B.v,t)};
    if(A && B && A.t==="g" && B.t==="g" && A.r===B.r && typeof interpGradient==="function"){
      return interpGradient(A,B,t);
    }
    // c <-> g: keep gradient id and tint stops with solid color (best-effort)
    if(A && B){
      const solid = (A.t==="c") ? A : (B.t==="c" ? B : null);
      const grad  = (A.t==="g") ? A : (B.t==="g" ? B : null);
      if(solid && grad){
        const stops = (grad.s||[]).map((st)=>({o:st.o, c: interpColor(solid.v, st.c, t)}));
        return {t:"g", r:grad.r, s:stops, gt:grad.gt, c:grad.c, rd:grad.rd, f:grad.f, to:grad.to};
      }
    }
    return (t<0.5?A:B);
  }
  return v;
}
function paintToAttr(p){
  if(!p) return null;
  if(typeof p==="string") return p;
  if(p.t==="c" && p.v) return colorToString(p.v);
  if(p.t==="g" && p.r) return "url(#"+p.r+")";
  return null;
}
`;
}

module.exports = { paintsModule };
