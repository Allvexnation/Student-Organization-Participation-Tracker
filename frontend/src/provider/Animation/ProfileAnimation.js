import { initReveal, playPageDomino } from './HomepageAnimation.js';

export function initProfileAnimations(root = document) {
    initReveal(root);
}

export function animateProfileDomino(root) {
    if (!root) return;
    playPageDomino(root);
}
