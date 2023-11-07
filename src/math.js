function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}

function isInside(pos, rect) {
    return pos.x >= rect.x && pos.x <= rect.x + rect.width &&
        pos.y >= rect.y && pos.y <= rect.y + rect.height;
}

function isTouchInside(touches, rect) {
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        if (isInside(touch, rect)) return true;
    }
    return false;
}

export { lerp, isInside, isTouchInside };