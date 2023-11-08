#version 300 es

precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 v_texCoord;

const float SCANLINE_STRENGTH = 0.1;
const float SCANLINE_WIDTH = 3.0;
const float SNOW_STRENGTH = 0.3;
const float FLICKER_STRENGTH = 0.02;
const float MOVEMENT_STRENGTH = 0.05;
const float MOVEMENT_SPEED = 10.0;
const float VIGNETTE_STRENGTH = 0.3;
const float VIGNETTE_SIZE = 3.0;

float randomizer = 0.0;

float rand(vec2 co){
    float r = fract(sin(dot(co + mod(u_time, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    return r;
}

void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    // setup
    float x = v_texCoord.x * u_resolution.x;
    float y = v_texCoord.y * u_resolution.y;
    color.a = 0.0;

    // scanlines
    if (mod(x, 10.0) <= SCANLINE_WIDTH) {
        color.a = SCANLINE_STRENGTH;
    }

    // snow
    color.a += rand(v_texCoord) * SNOW_STRENGTH;

    // flicker
    color.a += rand(vec2(0)) * FLICKER_STRENGTH;

    // movement
    color.a += sin(x / MOVEMENT_SPEED + u_time) * MOVEMENT_STRENGTH;

    // vignette
    vec2 center = u_resolution / 2.0;
    vec2 pos = vec2(x, y);
    vec2 halfSize = u_resolution.xy / 2.0;
    float distance = length((pos - center) / halfSize);
    float alpha = pow(distance, VIGNETTE_SIZE);
    color.a += alpha * VIGNETTE_STRENGTH;

    // clamp
    color.a = clamp(color.a, 0.0, 1.0);
    
    // color
    gl_FragColor = color;
}
