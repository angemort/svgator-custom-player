/**
 * Points module for polygon/polyline "points" attribute interpolation.
 */
"use strict";

function pointsModule() {
  return `
/* ---------------- Points interpolation ---------------- */
function parsePointsString(s){
  if(typeof s!=="string") return null;
  const parts=s.trim().split(/[\\s,]+/).filter(Boolean).map(Number);
  return parts.length%2===0?parts:null;
}
function pointsToString(arr){
  if(!arr||arr.length<2) return "";
  let out="";
  for(let i=0;i<arr.length;i+=2){
    const x=Math.round((arr[i]+Number.EPSILON)*1e6)/1e6;
    const y=Math.round((arr[i+1]+Number.EPSILON)*1e6)/1e6;
    out += (i? " " : "") + x + "," + y;
  }
  return out;
}
function interpPoints(v){
  if(typeof v==="string") return v;
  if(Array.isArray(v)) return pointsToString(v);
  if(v && typeof v==="object" && "a" in v && "b" in v && "t" in v){
    const a = typeof v.a==="string" ? parsePointsString(v.a) : v.a;
    const b = typeof v.b==="string" ? parsePointsString(v.b) : v.b;
    if(!Array.isArray(a) || !Array.isArray(b)) return null;

    let A=a, B=b;
    if(A.length!==B.length){
      const target=lcm(A.length,B.length);
      A=repeatTo(A,target/A.length);
      B=repeatTo(B,target/B.length);
    }

    const out=new Array(A.length);
    for(let i=0;i<A.length;i++) out[i]=lerp(+A[i]||0,+B[i]||0,v.t);
    return pointsToString(out);
  }
  return null;
}
`;
}

module.exports = { pointsModule };
