/**
 * Cubic-bezier easing module.
 * Installs __applyBezier(x1,y1,x2,y2,t)
 */
"use strict";

function bezierModule() {
  return `
/* ---------------- Bezier easing ---------------- */
function __cubicBezier(x1,y1,x2,y2){
  function B(p0,p1,p2,p3,t){const u=1-t;return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3;}
  return (t)=>{
    t=clamp01(t);
    let lo=0,hi=1,mid=0;
    for(let i=0;i<32;i++){
      mid=(lo+hi)/2;
      const x=B(0,x1,x2,1,mid);
      if(Math.abs(x-t)<1e-5) break;
      if(x<t) lo=mid; else hi=mid;
    }
    return B(0,y1,y2,1,mid);
  };
}
function __applyBezier(x1,y1,x2,y2,t){
  return __cubicBezier(x1,y1,x2,y2)(t);
}
`;
}

module.exports = { bezierModule };
