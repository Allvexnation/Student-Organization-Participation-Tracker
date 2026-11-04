import { initReveal, playPageDomino } from './HomepageAnimation.js';

export function initManageUsersAnimations(root = document) {
    initReveal(root);
}

export function animateDominoList(root) {
    if (!root) return;
    playPageDomino(root);
}
