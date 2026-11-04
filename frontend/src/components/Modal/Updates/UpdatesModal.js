import { openModal, closeModal } from '../../../utils/modal.js';
import { getAssetDownloadUrl } from '../../../api/web/Updates.js';
import { modalSection, modalHero, modalBadge, applyModalDomino } from '../modalUi.js';

function basename(url) {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        return pathname.substring(pathname.lastIndexOf('/') + 1);
    } catch (e) {
        const parts = url.split('/');
        return parts[parts.length - 1] || url;
    }
}

function parseUpdateAssets(update) {
    const list = [];
    const seen = new Set();

    const cloudinaryUrlMap = new Map();
    if (update.assets_file) {
        const cloudinaryUrls = update.assets_file.split(',').map(url => url.trim()).filter(url => url);
        
        cloudinaryUrls.forEach(url => {
            const name = basename(url) || 'uploaded_file';
            cloudinaryUrlMap.set(name, url);
            
            const match = name.match(/^(.+?)_\d+\.(.+)$/);
            if (match) {
                const baseName = match[1] + '.' + match[2];
                cloudinaryUrlMap.set(baseName, url);
            }
        });
    }

    if (update.assets) {
        let raw = update.assets;
        if (typeof raw === 'string') {
            try {
                raw = JSON.parse(raw);
            } catch (e) {
                raw = [raw];
            }
        }

        if (Array.isArray(raw)) {
            raw.forEach(item => {
                if (!item) return;
                const name = typeof item === 'object' ? item.name : String(item);
                if (!name || seen.has(name)) return;
                seen.add(name);

                const ext = name.split('.').pop().toLowerCase();
                const isZip = ext === 'zip';
                const size = typeof item === 'object' && item.size ? item.size : '';
                
                let downloadUrl = (typeof item === 'object' && item.download_url) 
                    ? item.download_url 
                    : getAssetDownloadUrl(name);
                
                if (cloudinaryUrlMap.has(name)) {
                    downloadUrl = cloudinaryUrlMap.get(name);
                }

                list.push({
                    name: name,
                    type: isZip ? 'zip' : 'documentation',
                    size: size,
                    download_url: downloadUrl
                });
            });
        }
    }

    if (update.readme_filename && !seen.has(update.readme_filename)) {
        seen.add(update.readme_filename);
        list.push({
            name: update.readme_filename,
            type: 'documentation',
            size: '',
            download_url: getAssetDownloadUrl(update.readme_filename)
        });
    }

    return list;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

function parseMarkdown(content) {
    if (!content) return '<p class="text-gray-500 italic">No description provided.</p>';
    if (typeof marked !== 'undefined' && marked.parse) {
        return marked.parse(content);
    }
    return escapeHtml(content).replace(/\n/g, '<br>');
}

function navigateTo(path) {
    if (window.appNavigate) {
        window.appNavigate(path);
    } else {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

export function createUpdatesModal(update) {
    if (!update) {
        return;
    }

    const isShowOnce = update.closable_type === 'show_once';
    const isUpdated = Boolean(Number(update.is_updated) === 1);
    const branchName = update.branch || 'main';
    const assets = parseUpdateAssets(update);

    const badges = [
        modalBadge(`v${escapeHtml(update.version)}`, 'green'),
        modalBadge('Latest Release', 'navy')
    ];
    if (isUpdated) badges.push(modalBadge('Updated', 'purple'));

    const assetsHtml = assets.length > 0
        ? `<div class="space-y-2">${assets.map(asset => {
            const isZip = asset.type === 'zip' || asset.name.endsWith('.zip');
            return `
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-surface border border-line text-xs">
                    <div class="flex items-center gap-2 font-mono min-w-0">
                        <i data-lucide="${isZip ? 'archive' : 'file-text'}" class="w-4 h-4 shrink-0 ${isZip ? 'text-navy' : 'text-success'}"></i>
                        <span class="truncate">${escapeHtml(asset.name)}</span>
                        ${asset.size ? `<span class="text-muted font-sans">(${asset.size})</span>` : ''}
                    </div>
                    <a href="${asset.download_url}" download="${escapeHtml(asset.name)}" class="w-full sm:w-auto px-3 py-2 text-xs font-semibold text-navy bg-white hover:bg-blue-50 rounded-xl border border-line transition inline-flex items-center justify-center gap-1.5">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i> Download
                    </a>
                </div>
            `;
        }).join('')}</div>`
        : `
            <div class="p-3 rounded-xl bg-surface border border-line text-xs text-muted italic flex items-center gap-2">
                <i data-lucide="info" class="w-3.5 h-3.5"></i>
                <span>No assets available for this release</span>
            </div>
        `;

    const modalContent = `
        <div class="space-y-4">
            ${modalHero({
                photo: '',
                fallback: '<i data-lucide="tag" class="w-8 h-8"></i>',
                name: escapeHtml(update.name),
                subtitle: `Released ${formatDate(update.created_at)} · ${timeAgo(update.created_at)}`,
                badges
            })}
            ${modalSection('Release Notes', `
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 text-xs text-muted">
                    <span class="inline-flex items-center gap-1.5">
                        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                        ${formatDate(update.created_at)}
                    </span>
                    <span class="inline-flex items-center gap-1.5 font-mono text-[11px] bg-surface px-2 py-1 rounded-lg border border-line self-start">
                        <i data-lucide="git-branch" class="w-3 h-3"></i> ${escapeHtml(branchName)}
                    </span>
                </div>
                <div id="modal-markdown-content" class="github-markdown-body text-sm">
                    ${parseMarkdown(update.readme_content)}
                </div>
            `)}
            ${modalSection(`Attached Downloads${assets.length ? ` (${assets.length})` : ''}`, assetsHtml)}
            <div class="manage-modal-actions reveal flex flex-col-reverse sm:flex-row sm:justify-between gap-2" data-domino-enter>
                <button type="button" id="modal-view-all-link" class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-navy bg-surface hover:bg-line rounded-xl transition inline-flex items-center justify-center gap-1.5">
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                    <span>View all releases</span>
                </button>
                <button type="button" id="modal-dismiss-btn" class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-navy hover:bg-navy-700 rounded-xl transition inline-flex items-center justify-center gap-1.5">
                    <i data-lucide="check" class="w-4 h-4"></i>
                    <span>Got it</span>
                </button>
            </div>
        </div>
    `;

    openModal('New Release Available', modalContent, 'large', 'z-[9999]', 'scale');
    applyModalDomino();

    setTimeout(() => {
        const dismissBtn = document.getElementById('modal-dismiss-btn');
        const viewAllLink = document.getElementById('modal-view-all-link');

        const handleClose = () => {
            if (isShowOnce) {
                const viewed = JSON.parse(localStorage.getItem('viewedUpdates') || '[]');
                if (!viewed.includes(update.id)) {
                    viewed.push(update.id);
                    localStorage.setItem('viewedUpdates', JSON.stringify(viewed));
                }
            }
            closeModal();
        };

        if (dismissBtn) {
            dismissBtn.onclick = handleClose;
        }

        if (viewAllLink) {
            viewAllLink.onclick = () => {
                closeModal();
                navigateTo('/updates');
            };
        }

        refreshIcons();
    }, 100);
}

export function closeUpdatesModal() {
    closeModal();
}
