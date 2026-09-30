/** Presentation only: periodic interpolation, height contours and bounded received-light contrast. */
export const landscapeShader = `
uniform sampler2D terrain;
uniform bool landscape;
uniform bool showLight;
vec2 terrainAt(ivec2 p, ivec2 n) {
  return texelFetch(terrain,(p+n)%n,0).xy;
}
vec2 landscapeAt(vec2 world) {
  ivec2 n=textureSize(terrain,0);
  vec2 p=world/worldSize*vec2(n)-0.5;
  ivec2 b=ivec2(floor(p));
  vec2 f=fract(p);
  return mix(mix(terrainAt(b,n),terrainAt(b+ivec2(1,0),n),f.x),
    mix(terrainAt(b+ivec2(0,1),n),terrainAt(b+ivec2(1,1),n),f.x),f.y);
}
vec2 grainHash(vec2 p) {
  vec3 h=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  h+=dot(h,h.yzx+33.33);
  return fract((h.xx+h.yz)*h.zy);
}
float substrateMarks(vec2 world, float resistance) {
  // Jittered short strokes identify substrate without a screen-fixed hatch or regular grid.
  vec2 tile=world/7.0;
  vec2 id=floor(tile);
  vec2 random=grainHash(id);
  vec2 p=(fract(tile)-(0.25+0.5*random))*7.0;
  vec2 axes=vec2(p.x+p.y,p.y-p.x)*0.7071068;
  // Differentiate continuous coordinates; tile boundaries must not widen the strokes.
  float aa=max(fwidth((world.y-world.x)*0.7071068),0.025);
  float stroke=(1.0-smoothstep(0.13,0.13+aa,abs(axes.y)))
    *(1.0-smoothstep(0.8,0.8+aa,abs(axes.x)));
  // A continuous fade recruits more strokes as resistance rises, avoiding categorical regions.
  float density=smoothstep(random.x*0.8,random.x*0.8+0.2,resistance);
  return stroke*density*resistance;
}
vec3 landscapeGround(vec2 world, float drive) {
  vec2 ground=landscapeAt(world);
  float q=clamp(ground.y,0.0,1.0);
  vec3 earth=mix(vec3(0.36,0.20,0.12),vec3(0.075,0.36,0.32),q);
  if(showLight) {
    float light=max(0.0,drive)/(1.0+max(0.0,drive));
    earth*=0.40+0.95*light;
  }
  // Four height units per contour. Fade subpixel contours instead of aliasing steep slopes.
  float h=ground.x/4.0;
  float width=fwidth(h);
  float distanceToLine=abs(fract(h+0.5)-0.5);
  float contour=(1.0-smoothstep(width*0.4,width*1.2+0.00001,distanceToLine));
  contour*=smoothstep(0.001,0.01,width)*(1.0-smoothstep(0.2,0.5,width));
  earth=mix(earth,vec3(0.50,0.55,0.47),contour*0.23);
  return mix(earth,vec3(0.76,0.68,0.51),substrateMarks(world,1.0-q)*0.45);
}
`;
