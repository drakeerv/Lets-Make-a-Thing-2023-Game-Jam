function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}

function isInside(pos, rect) {
    return pos.x >= rect.x && pos.x <= rect.x + rect.width &&
        pos.y >= rect.y && pos.y <= rect.y + rect.height;
}

export { lerp, isInside };