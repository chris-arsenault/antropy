/** Presentation only: periodic interpolation, height contours and bounded received-light contrast. */
export const landscapeShader = `
uniform sampler2D terrain;
uniform bool landscape;
uniform bool showLight;
vec2 terrainAt(ivec2 p, ivec2 n) {
  return texelFetch(terrain,(p+n)%n,0).xy;
}
vec3 landscapeGround(vec2 world) {
  ivec2 n=textureSize(terrain,0);
  vec2 p=world/worldSize*vec2(n)-0.5;
  ivec2 b=ivec2(floor(p));
  vec2 f=fract(p);
  vec2 ground=mix(mix(terrainAt(b,n),terrainAt(b+ivec2(1,0),n),f.x),
    mix(terrainAt(b+ivec2(0,1),n),terrainAt(b+ivec2(1,1),n),f.x),f.y);
  vec3 earth=mix(vec3(0.24,0.18,0.13),vec3(0.12,0.32,0.30),clamp(ground.y,0.0,1.0));
  // Four height units per contour. Fade subpixel contours instead of aliasing steep slopes.
  float h=ground.x/4.0;
  float width=fwidth(h);
  float distanceToLine=abs(fract(h+0.5)-0.5);
  float contour=(1.0-smoothstep(width*0.4,width*1.2+0.00001,distanceToLine));
  contour*=smoothstep(0.001,0.01,width)*(1.0-smoothstep(0.2,0.5,width));
  return mix(earth,vec3(0.50,0.55,0.47),contour*0.28);
}
vec3 receivedShade(vec3 ground, float drive) {
  // Continuous optical drive; the floor retains terrain detail without pretending night is bright.
  float light=max(0.0,drive)/(1.0+max(0.0,drive));
  return ground*(0.48+0.80*light);
}
`;
