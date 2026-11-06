export const PROTECT_MEDIA_ATTRS =
    'draggable="false" ondragstart="return false" oncontextmenu="return false" data-protect-media';

function blockMediaEvent(event) {
    event.preventDefault();
}

export function protectMediaElement(el) {
    if (!el || el.dataset.protectMediaBound === 'true') return;

    el.draggable = false;
    el.setAttribute('draggable', 'false');
    el.setAttribute('data-protect-media', '');
    el.dataset.protectMediaBound = 'true';
    el.addEventListener('dragstart', blockMediaEvent);
    el.addEventListener('contextmenu', blockMediaEvent);
}

export function protectPageMedia(root = document) {
    root.querySelectorAll('img').forEach(protectMediaElement);
}
