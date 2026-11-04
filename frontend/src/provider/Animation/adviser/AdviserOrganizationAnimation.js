import { initReveal, playPageDomino } from '../HomepageAnimation.js';

export function initAdviserOrganizationAnimations(root = document) {
    initReveal(root);
}

export function animateDominoList(root) {
    if (!root) return;
    playPageDomino(root);
}
