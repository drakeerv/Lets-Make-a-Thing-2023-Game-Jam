#version 100

precision lowp float;

uniform vec2 u_resolution;
uniform float u_time;

varying vec2 v_texCoord;

#define SCANLINE_STRENGTH 0.1
#define SCANLINE_WIDTH 3.0
#define SNOW_STRENGTH 0.3
#define FLICKER_STRENGTH 0.02
#define MOVEMENT_STRENGTH 0.05
#define MOVEMENT_SPEED 10.0
#define VIGNETTE_STRENGTH 0.3
#define VIGNETTE_SIZE 3.0

float flicker = -1.0;

float rand(vec2 co){
    return fract(sin(dot(co + mod(u_time, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    if (flicker == -1.0) {
        flicker = rand(vec2(0)) * FLICKER_STRENGTH;
    }

    // flicker
    vec4 color = vec4(flicker);

    // setup
    vec2 pos = v_texCoord * u_resolution;

    // scanlines
    if (mod(pos.x, 10.0) <= SCANLINE_WIDTH) {
        color.a = SCANLINE_STRENGTH;
    }

    // snow
    color.a += rand(v_texCoord) * SNOW_STRENGTH;

    // movement
    color.a += sin(pos.x / MOVEMENT_SPEED + u_time) * MOVEMENT_STRENGTH;

    // vignette
    vec2 center = u_resolution / 2.0;
    float distance = length((pos - center) / center);
    color.a += pow(distance, VIGNETTE_SIZE) * VIGNETTE_STRENGTH;
    
    // color
    gl_FragColor = color;
}