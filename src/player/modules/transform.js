/**
 * Transform module (matrix composition).
 */
"use strict";

function transformModule() {
  return `
/* ---------------- Transform (matrix) ---------------- */
function round6(x){const r=1e6;return Math.round((x+Number.EPSILON)*r)/r;}
function matMul(m1,m2){
  const[a1,b1,c1,d1,e1,f1]=m1, [a2,b2,c2,d2,e2,f2]=m2;
  return [a1*a2+c1*b2,b1*a2+d1*b2,a1*c2+c1*d2,b1*c2+d1*d2,a1*e2+c1*f2+e1,b1*e2+d1*f2+f1];
}
const mt=(tx,ty)=>[1,0,0,1,tx,ty];
const ms=(sx,sy)=>[sx,0,0,sy,0,0];
function mr(deg){
  const rad=deg*Math.PI/180, sn=Math.sin(rad), cs=Math.cos(rad);
  return [cs,sn,-sn,cs,0,0];
}
function mToString(m){return "matrix("+round6(m[0])+" "+round6(m[1])+" "+round6(m[2])+" "+round6(m[3])+" "+round6(m[4])+" "+round6(m[5])+")";}
function composeTransform(origin,rotate,scale,translate){
  let m=[1,0,0,1,0,0];
  if(origin) m=matMul(m,mt(origin.x,origin.y));
  if(rotate) m=matMul(m,mr(rotate));
  if(scale) m=matMul(m,ms(scale.x,scale.y));
  if(translate) m=matMul(m,mt(translate.x,translate.y));
  return m;
}
`;
}

module.exports = { transformModule };
