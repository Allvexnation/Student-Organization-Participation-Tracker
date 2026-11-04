import { initReveal, playPageDomino } from './HomepageAnimation.js';

export function initAuditLogsAnimations(root = document) {
    initReveal(root);
}

export function animateDominoList(root) {
    if (!root) return;
    playPageDomino(root);
}
