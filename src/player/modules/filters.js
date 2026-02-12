/**
 * Filters module (Svgator-like “data-driven” filter stacks).
 *
 * Supports: blur, hue-rotate, drop-shadow, inner-shadow
 * Includes a generic fallback for primitives that use a "values" attribute.
 */
"use strict";

function filtersModule() {
  return `
/* ---------------- Filters ---------------- */
function interpFilterValue(type,a,b,t){
  if(a==null) return b;
  if(b==null) return a;
  if(type==="blur") return {x:lerp(a.x,b.x,t), y:lerp(a.y,b.y,t)};
  if(type==="hue-rotate") return lerp(a,b,t);
  if(type==="drop-shadow"||type==="inner-shadow"){
    return {
      blur: {x:lerp(a.blur.x,b.blur.x,t), y:lerp(a.blur.y,b.blur.y,t)},
      offset: {x:lerp(a.offset.x,b.offset.x,t), y:lerp(a.offset.y,b.offset.y,t)},
      color: interpColor(a.color,b.color,t),
    };
  }
  if(typeof a==="number" && typeof b==="number") return lerp(a,b,t);
  return (t<0.5?a:b);
}

function interpFilterStack(v){
  if(Array.isArray(v)) return v;
  if(v && typeof v==="object" && "a" in v && "b" in v && "t" in v){
    const A=Array.isArray(v.a)?v.a:[], B=Array.isArray(v.b)?v.b:[];
    const len=Math.min(A.length,B.length);
    const out=new Array(len);
    for(let i=0;i<len;i++){
      if(A[i].type!==B[i].type){ out[i]=(v.t<0.5?A[i]:B[i]); continue; }
      out[i]={type:A[i].type, value: interpFilterValue(A[i].type, A[i].value, B[i].value, v.t)};
    }
    return out;
  }
  return null;
}

function applyFilterItems(svg, filterData, stack){
  if(!filterData || !Array.isArray(filterData.items) || !Array.isArray(stack)) return;
  const items=filterData.items;

  for(let i=0;i<items.length && i<stack.length;i++){
    const type=items[i][0];
    const base=items[i][1];
    const val=stack[i].value;

    if(type==="blur"){
      const node=getById(svg, base);
      if(node) node.setAttribute("stdDeviation", (val.x)+","+(val.y));
      continue;
    }

    if(type==="hue-rotate"){
      const node=getById(svg, base);
      if(node) node.setAttribute("values", String(val));
      continue;
    }

    if(type==="drop-shadow"){
      const blur=getById(svg, base+"-blur");
      const off=getById(svg, base+"-offset");
      const flood=getById(svg, base+"-flood");
      if(blur) blur.setAttribute("stdDeviation", (val.blur.x)+","+(val.blur.y));
      if(off){ off.setAttribute("dx", String(val.offset.x)); off.setAttribute("dy", String(val.offset.y)); }
      if(flood) flood.setAttribute("flood-color", colorToString(val.color));
      continue;
    }

    if(type==="inner-shadow"){
      const blur=getById(svg, base+"-blur");
      const off=getById(svg, base+"-offset");
      const cm=getById(svg, base+"-color-matrix");
      if(blur) blur.setAttribute("stdDeviation", (val.blur.x)+","+(val.blur.y));
      if(off){ off.setAttribute("dx", String(val.offset.x)); off.setAttribute("dy", String(val.offset.y)); }
      if(cm){
        // 4x5 matrix values
        const c=val.color;
        const m=[0,0,0,0,c.r/255, 0,0,0,0,c.g/255, 0,0,0,0,c.b/255, 0,0,0,c.a,0];
        cm.setAttribute("values", m.join(" "));
      }
      continue;
    }

    // Generic fallback: set "values" for primitives that use it.
    const node=getById(svg, base);
    if(node) node.setAttribute("values", String(val));
  }
}
`;
}

module.exports = { filtersModule };
