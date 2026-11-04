import { initReveal, playPageDomino } from './HomepageAnimation.js';

export function initManageContactsAnimations(root = document) {
    initReveal(root);
}

export function animateDominoList(root) {
    if (!root) return;
    playPageDomino(root);
}
