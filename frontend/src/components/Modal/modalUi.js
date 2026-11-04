import { playImmediateDomino } from '../../provider/Animation/HomepageAnimation.js';

export const FIELD_CLASS = 'w-full px-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy transition';
export const LABEL_CLASS = 'block text-sm font-medium text-ink mb-1.5';
export const FILE_CLASS = 'w-full text-sm text-muted file:mr-3 file:py-2.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-navy hover:file:bg-blue-100 transition';

export function modalSection(title, innerHtml, extraClass = '') {
    return `
        <section class="manage-modal-section reveal rounded-2xl border border-line bg-white p-4 sm:p-5 ${extraClass}" data-domino-enter>
            <p class="text-[11px] uppercase tracking-[0.16em] text-muted mb-3">${title}</p>
            ${innerHtml}
        </section>
    `;
}

export function modalActions({ cancelOnclick, submitText, submitId = 'submitBtn', danger = false }) {
    const submitBg = danger ? 'bg-danger hover:bg-red-800' : 'bg-navy hover:bg-navy-700';
    return `
        <div class="manage-modal-actions reveal flex flex-col-reverse sm:flex-row sm:justify-end gap-2" data-domino-enter>
            <button type="button" onclick="${cancelOnclick}" class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-ink bg-surface hover:bg-line rounded-xl transition">Cancel</button>
            <button type="submit" id="${submitId}" class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white ${submitBg} rounded-xl transition">${submitText}</button>
        </div>
    `;
}

export function modalViewClose(onclick = 'closeModal()') {
    return `
        <div class="manage-modal-actions reveal flex flex-col-reverse sm:flex-row sm:justify-end gap-2" data-domino-enter>
            <button type="button" onclick="${onclick}" class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-ink bg-surface hover:bg-line rounded-xl transition">Close</button>
        </div>
    `;
}

export function modalDetailTile(label, value) {
    return `
        <div class="rounded-xl border border-line bg-surface px-3.5 py-3 min-w-0">
            <dt class="text-[10px] uppercase tracking-[0.12em] text-muted">${label}</dt>
            <dd class="text-sm font-semibold text-ink mt-1 break-words">${value}</dd>
        </div>
    `;
}

export function modalBadge(text, tone = 'navy') {
    const tones = {
        navy: 'bg-blue-50 text-navy border-blue-100',
        purple: 'bg-purple-50 text-purple-900 border-purple-200',
        green: 'bg-green-50 text-success border-green-200',
        red: 'bg-red-50 text-danger border-red-200',
        gray: 'bg-surface text-muted border-line'
    };
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tones[tone] || tones.navy}">${text}</span>`;
}

export function modalHero({ photo, fallback, name, subtitle = '', badges = [] }) {
    return `
        <div class="manage-modal-hero reveal rounded-2xl border border-line overflow-hidden bg-white" data-domino-enter>
            <div class="manage-modal-hero-band"></div>
            <div class="manage-modal-hero-inner flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 sm:p-5">
                <div class="manage-modal-avatar mx-auto md:mx-0 flex-shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-navy text-white flex items-center justify-center text-2xl font-bold overflow-hidden shadow-lift">
                    ${photo ? `<img src="${photo}" alt="${name}" class="w-full h-full object-cover">` : fallback}
                </div>
                <div class="text-center md:text-left min-w-0">
                    <p class="text-[11px] uppercase tracking-[0.16em] text-muted">Details</p>
                    <h3 class="text-lg font-semibold text-ink truncate">${name}</h3>
                    ${subtitle ? `<p class="text-sm text-muted mt-0.5">${subtitle}</p>` : ''}
                    <div class="mt-2 flex flex-wrap justify-center md:justify-start gap-1.5">${badges.join('')}</div>
                </div>
            </div>
        </div>
    `;
}

export function modalPhotoField(existingImageUrl) {
    return `
        <div class="flex flex-col md:flex-row md:items-center gap-4">
            <div id="imagePreviewContainer" class="manage-modal-avatar mx-auto md:mx-0 flex-shrink-0 w-24 h-24 rounded-2xl bg-surface border-2 border-dashed border-line flex items-center justify-center overflow-hidden">
                ${existingImageUrl
                    ? `<img src="${existingImageUrl}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`
                    : `<i data-lucide="user" class="w-8 h-8 text-muted" id="imagePreviewIcon"></i>`
                }
            </div>
            <div class="flex-1 w-full text-center md:text-left">
                <label for="imageUpload" class="${LABEL_CLASS}">Upload Photo</label>
                <input type="file" id="imageUpload" name="imageUpload" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" class="${FILE_CLASS}">
                <p class="text-xs text-muted mt-1.5">JPG, PNG, GIF, or WebP (max 5MB)</p>
            </div>
        </div>
        <input type="hidden" id="imageUrl" name="imageUrl" value="${existingImageUrl}">
    `;
}

function pinActionsInParent(parent) {
    if (!parent) return;

    const actions = Array.from(parent.children).find((el) => el.classList?.contains('manage-modal-actions'));
    if (!actions) return;
    if (actions.previousElementSibling?.classList.contains('manage-modal-form-body')) {
        parent.classList.add(
            'manage-modal-scroll-parent',
            'flex',
            'flex-col',
            'flex-1',
            'min-h-0',
            'overflow-hidden',
            'h-full'
        );
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'manage-modal-form-body space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain';

    const nodes = [];
    for (const child of Array.from(parent.childNodes)) {
        if (child === actions) break;
        nodes.push(child);
    }
    nodes.forEach((node) => wrapper.appendChild(node));
    parent.insertBefore(wrapper, actions);
    actions.classList.add('shrink-0');
    parent.classList.add(
        'manage-modal-scroll-parent',
        'flex',
        'flex-col',
        'flex-1',
        'min-h-0',
        'overflow-hidden',
        'h-full'
    );
}

export function pinManageModalActions(root) {
    const body = (root && root.querySelector ? root.querySelector('#modal-body') : null)
        || document.getElementById('modal-body');
    if (!body) return;

    const forms = body.querySelectorAll('.manage-modal-form');
    if (forms.length) {
        forms.forEach((form) => {
            // Skip hidden forms — Tailwind `flex` would override `hidden` (same specificity).
            if (form.classList.contains('hidden') || form.hasAttribute('hidden')) return;
            pinActionsInParent(form);
        });

        if (body.querySelector('.manage-modal-form-body')) {
            body.classList.remove('overflow-y-auto');
            body.classList.add('overflow-hidden');
        }
        return;
    }

    pinActionsInParent(body);
    if (body.querySelector('.manage-modal-form-body')) {
        body.classList.remove('overflow-y-auto');
        body.classList.add('overflow-hidden');
    }
}

export function applyModalDomino(root) {
    const panel = root || document.getElementById('modal-content');
    if (!panel) return;
    pinManageModalActions(panel);
    playImmediateDomino(panel);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
