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
    color=vec4(0.008,0.015,0.028,0.72*night);
    return;
  }
  vec4 detail=mix(mix(sampleSelected(base,n),sampleSelected(base+ivec2(1,0),n),f.x),mix(sampleSelected(base+ivec2(0,1),n),sampleSelected(base+ivec2(1,1),n),f.x),f.y);
  float presence=1.0-exp(-exposure*amount.x);
  // A constant slate surface leaves room for shadow without inventing field detail.
  vec3 background=vec3(0.09,0.17,0.21);
  vec3 light=mix(background,vec3(0.36,0.68,0.65),presence*layers.x);
  float quality=clamp((amount.y/max(amount.x,1e-20)-0.5)/7.5,0.0,1.0);
  vec3 energy=mix(vec3(0.22,0.4,0.8),vec3(0.93,0.69,0.3),quality);
  light=mix(light,energy,presence*layers.y);
  light=mix(light,mix(vec3(0.035,0.12,0.23),vec3(0.72,0.4,0.12),clamp(detail.w,0.0,1.0)),weatheringLayer);
  light=mix(light,vec3(0.83,0.64,0.93),selectedLayer*(1.0-exp(-exposure*max(0.0,detail.x))));
  if(illuminationMode>0) {
    light=solarGround(daylight(amount.x));
    if(illuminationMode==2) light=solarGround(clamp(amount.x,0.0,1.0));
    if(illuminationMode==3) light=mix(vec3(0.008,0.01,0.016),vec3(0.2,0.8,0.7),clamp(amount.x,0.0,1.0));
    if(illuminationMode==4) light=mix(vec3(0.008,0.01,0.016),vec3(1.0,0.8,0.3),presence);
  }
  // Screen-space patterns keep hazards distinguishable at every zoom.
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
      stroke=max(step(0.92,d),step(min(abs(local.x),abs(local.y)),0.035)*step(d,0.25));
      if(shade.a<0.5) {
        float dash=step(0.45,fract(atan(local.y,local.x)*3.82));
        stroke=step(0.92,d)*dash*0.38;
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
