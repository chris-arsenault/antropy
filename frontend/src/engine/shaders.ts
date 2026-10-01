import { landscapeShader } from "./landscapeShader";

export const fieldVertex = `#version 300 es
precision highp float;
out vec2 pixel;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  pixel = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const fieldFragment = `#version 300 es
precision highp float;
uniform sampler2D chemistry;
uniform vec2 viewport;
uniform vec2 worldSize;
uniform vec4 fieldExtent;
uniform vec3 camera;
uniform vec4 layers;
uniform float selectedLayer;
uniform float weatheringLayer;
uniform int illuminationMode;
uniform bool shadowPass;
uniform float exposure;
in vec2 pixel;
out vec4 color;
${landscapeShader}
vec4 sampleField(ivec2 p, ivec2 n) {
  ivec2 node=(p+n)%n;
  return texelFetch(chemistry,ivec2(node.x*2,node.y),0);
}
vec4 sampleSelected(ivec2 p, ivec2 n) {
  ivec2 node=(p+n)%n;
  return texelFetch(chemistry,ivec2(node.x*2+1,node.y),0);
}
float daylight(float drive) {
  // A visible soft terminator around the uniform reference, not a new physical night rule.
  return smoothstep(0.8,1.2,drive);
}
vec3 solarGround(float day) {
  return mix(vec3(0.008,0.01,0.016),vec3(0.72,0.70,0.62),day);
}
void main() {
  vec2 world = (vec2(pixel.x, 1.0-pixel.y)-0.5)*viewport/camera.z+camera.xy;
  if(any(lessThan(world,vec2(0.0))) || any(greaterThanEqual(world,worldSize))) {
    if(shadowPass) discard;
    color=vec4(0.015,0.022,0.03,1.0); return;
  }
  vec2 size = vec2(textureSize(chemistry, 0))/vec2(2.0,1.0);
  vec2 position = (world-fieldExtent.xy)/fieldExtent.zw*size-0.5;
  ivec2 base = ivec2(floor(position));
  ivec2 n = ivec2(size);
  vec2 f = fract(position);
  vec4 amount=max(vec4(0.0),mix(mix(sampleField(base,n),sampleField(base+ivec2(1,0),n),f.x),mix(sampleField(base+ivec2(0,1),n),sampleField(base+ivec2(1,1),n),f.x),f.y));
  if(shadowPass) {
    // A translucent night layer shades the finished map, including organisms and markers.
    float night=1.0-daylight(amount.z);
    // Keep terrain texture and chemical color legible beneath the integrated shadow.
    color=vec4(0.008,0.015,0.028,(landscape ? 0.50 : 0.72)*night);
    return;
  }
  vec4 detail=mix(mix(sampleSelected(base,n),sampleSelected(base+ivec2(1,0),n),f.x),mix(sampleSelected(base+ivec2(0,1),n),sampleSelected(base+ivec2(1,1),n),f.x),f.y);
  float presence=1.0-exp(-exposure*amount.x);
  vec3 background=landscape ? landscapeGround(world) : vec3(0.09,0.17,0.21);
  vec3 light=mix(background,vec3(0.36,0.68,0.65),presence*layers.x);
  float quality=clamp((amount.y/max(amount.x,1e-20)-0.5)/7.5,0.0,1.0);
  vec3 energy=mix(vec3(0.22,0.4,0.8),vec3(0.93,0.69,0.3),quality);
  if(landscape) energy=mix(vec3(0.16,0.39,1.0),vec3(1.0,0.66,0.10),quality);
  light=mix(light,energy,presence*layers.y*(landscape ? 0.72 : 1.0));
  light=mix(light,mix(vec3(0.035,0.12,0.23),vec3(0.72,0.4,0.12),clamp(detail.w,0.0,1.0)),weatheringLayer);
  light=mix(light,vec3(0.83,0.64,0.93),selectedLayer*(1.0-exp(-exposure*max(0.0,detail.x))));
  if(illuminationMode>0) {
    light=solarGround(daylight(amount.x));
    if(illuminationMode==2) light=solarGround(clamp(amount.x,0.0,1.0));
    if(illuminationMode==3) light=mix(vec3(0.008,0.01,0.016),vec3(0.2,0.8,0.7),clamp(amount.x,0.0,1.0));
    if(illuminationMode==4) light=mix(vec3(0.008,0.01,0.016),vec3(1.0,0.8,0.3),presence);
    if(illuminationMode==5) light=mix(vec3(0.08,0.2,0.4),vec3(0.9,0.8,0.5),clamp(amount.x,0.0,1.0));
    if(illuminationMode==6) light=mix(vec3(0.3,0.16,0.08),vec3(0.12,0.8,0.7),clamp(amount.x,0.0,1.0));
    if(illuminationMode==7) light=mix(vec3(0.04,0.07,0.1),vec3(1.0,0.65,0.2),clamp(amount.x,0.0,1.0));
    if(illuminationMode==8) light=amount.x<0.5 ? mix(vec3(0.35,0.12,0.06),vec3(0.8,0.8,0.65),amount.x*2.0) : mix(vec3(0.8,0.8,0.65),vec3(0.1,0.8,0.65),amount.x*2.0-1.0);
    if(illuminationMode==9) light=mix(vec3(0.04,0.07,0.1),vec3(0.1,0.8,0.65),clamp(amount.x,0.0,1.0));
    if(illuminationMode==10) light=mix(vec3(0.25),0.5+0.5*cos(6.2831853*(amount.x+vec3(0.0,0.3333333,0.6666667))),clamp(amount.y,0.0,1.0));
    if(illuminationMode==11) light=solarGround(clamp(amount.x,0.0,1.0));
  }
  // Optional diagnostic patterns remain available outside the default composition.
  float band=1.0-smoothstep(0.025,0.075,abs(fract((gl_FragCoord.x+gl_FragCoord.y)/12.0)-0.5));
  float dotMark=1.0-smoothstep(0.13,0.23,length(fract(gl_FragCoord.xy/8.0)-0.5));
  light=mix(light,vec3(0.95,0.75,0.42),layers.z*detail.y*band*0.38);
  light=mix(light,vec3(1.0,0.35,0.5),layers.w*detail.z*dotMark*0.65);
  color=vec4(light,1.0);
}`;

export const cellVertex = `#version 300 es
precision highp float;
uniform sampler2D records;
uniform vec2 viewport;
uniform vec3 camera;
uniform vec2 offset;
uniform float halo;
uniform bool landscape;
out vec2 local;
out vec4 shade;
out vec4 details;
out float membership;
out vec2 worldPoint;
void main() {
  vec2 corners[6] = vec2[6](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(-1,1),vec2(1,-1),vec2(1,1));
  int record = gl_VertexID / 6;
  ivec2 address = ivec2((record % 256)*3,record/256);
  vec4 geometry = texelFetch(records,address,0);
  vec4 appearance = texelFetch(records,address+ivec2(1,0),0);
  vec4 detail = texelFetch(records,address+ivec2(2,0),0);
  local = corners[gl_VertexID % 6];
  float r = halo > 0.5 && halo < 1.5 ? max(geometry.z*3.5,2.0) : max(geometry.z,1.2/camera.z);
  if(landscape && halo>1.5 && detail.x<0.5) r*=1.25;
  vec2 point = geometry.xy + offset + local*r;
  worldPoint = point;
  vec2 clip = (point-camera.xy)*camera.z/viewport*2.0;
  gl_Position = vec4(clip.x,-clip.y,0.0,1.0);
  shade = appearance;
  details = vec4(detail.x,detail.y,geometry.w,detail.z);
  membership = detail.w;
}`;

export const cellFragment = `#version 300 es
precision highp float;
uniform float halo;
uniform float opacity;
uniform float selected;
uniform float showSources;
uniform float showDeaths;
uniform bool landscape;
uniform vec2 worldSize;
in vec2 local;
in vec4 shade;
in vec4 details;
in float membership;
in vec2 worldPoint;
out vec4 color;
void main() {
  float d = length(local);
  if(any(lessThan(worldPoint,vec2(0.0))) || any(greaterThanEqual(worldPoint,worldSize))) discard;
  if(d>1.0) discard;
  if(halo>1.5) {
    if(details.x>1.5) {
      color=vec4(shade.rgb,shade.a*0.5*(1.0-smoothstep(0.0,1.0,d)));
      return;
    }
    float stroke;
    if(details.x<0.5) {
      if(showSources<0.5) discard;
      if(landscape && membership>0.5 && d>0.85) {
        vec3 season=details.z<1.0 ? mix(vec3(0.72,0.36,0.18),vec3(0.72,0.70,0.55),details.z)
          : mix(vec3(0.72,0.70,0.55),vec3(0.12,0.80,0.68),details.z-1.0);
        color=vec4(season,0.78*smoothstep(0.85,0.89,d)*(1.0-smoothstep(0.96,1.0,d)));
        return;
      }
      float sourceD=d*(landscape ? 1.25 : 1.0);
      if(sourceD>1.0) discard;
      stroke=max(step(0.92,sourceD),step(min(abs(local.x),abs(local.y)),0.035)*step(sourceD,0.25));
      if(sourceD>0.68 && sourceD<0.82 && details.w>0.0) {
        color=vec4(0.90,0.55,0.95,details.w*0.85); return;
      }
      if(sourceD<0.12 && details.y < -1.0) {
        color=vec4(0.70,0.98,0.86,clamp(-1.0-details.y,0.0,1.0)*0.9); return;
      }
      if(shade.a<0.5) {
        float dash=step(0.45,fract(atan(local.y,local.x)*3.82));
        stroke=step(0.92,sourceD)*dash*0.38;
      }
    } else {
      if(showDeaths<0.5) discard;
      stroke=1.0-smoothstep(0.05,0.12,min(abs(local.x-local.y),abs(local.x+local.y)));
    }
    color=vec4(shade.rgb,stroke*0.65);
  } else if(halo>0.5) {
    color = vec4(shade.rgb,(1.0-smoothstep(0.2,1.0,d))*opacity);
  } else {
    float edge = smoothstep(0.80,0.96,d);
    vec3 fill = shade.rgb*(0.60+0.40*shade.a)*(1.0-0.45*details.x);
    vec2 direction=vec2(cos(details.z),sin(details.z));
    float front=step(0.62,dot(local,direction));
    fill=mix(fill,vec3(0.95),front*0.65);
    if(abs(details.y-selected)<0.25 || details.w>0.5 || membership>0.5) fill=mix(fill,vec3(1.0),edge);
    else fill*=1.0-edge*0.55;
    color = vec4(fill,opacity*(1.0-smoothstep(0.96,1.0,d)));
  }
  if(halo<1.5 && membership>=0.0 && membership<0.5) color*=vec4(0.32,0.32,0.32,0.35);
}`;
