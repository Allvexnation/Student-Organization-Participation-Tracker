import { openModal, closeModal } from '../../../utils/modal.js';
import { getAssetDownloadUrl } from '../../../api/web/Updates.js';

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

    const modalContent = `
        <div class="px-6 py-4 bg-[#f6f8fa] border-b border-[#d0d7de] flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shadow-sm">
                    <i data-lucide="tag" class="w-4 h-4"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-[#dafbe1] text-[#1a7f37] border border-[#2da44e]/30">
                            v${escapeHtml(update.version)}
                        </span>
                        <span class="text-xs font-semibold text-gray-500">Latest Release</span>
                        ${isUpdated ? `
                            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                                Updated
                            </span>
                        ` : ''}
                    </div>
                    <h3 class="text-sm sm:text-base font-bold text-[#1f2328] mt-0.5 truncate max-w-md">
                        ${escapeHtml(update.name)}
                    </h3>
                </div>
            </div>
        </div>

        <div class="p-6 overflow-y-auto flex-1 github-markdown-body bg-white text-sm">
            <div class="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span class="inline-flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                    Released ${formatDate(update.created_at)} (${timeAgo(update.created_at)})
                </span>
                <span class="inline-flex items-center gap-1 font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    <i data-lucide="git-branch" class="w-3 h-3 text-gray-500"></i> ${escapeHtml(branchName)}
                </span>
            </div>

            <div id="modal-markdown-content">
                ${parseMarkdown(update.readme_content)}
            </div>

            ${assets.length > 0 ? `
                <div class="mt-6 pt-4 border-t border-[#d0d7de]">
                    <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <i data-lucide="package" class="w-3.5 h-3.5"></i> Attached Downloads (${assets.length})
                    </h4>
                    <div class="space-y-1.5">
                        ${assets.map(asset => {
                            const isZip = asset.type === 'zip' || asset.name.endsWith('.zip');
                            return `
                                <div class="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs">
                                    <div class="flex items-center gap-2 font-mono truncate">
                                        <i data-lucide="${isZip ? 'archive' : 'file-text'}" class="w-3.5 h-3.5 ${isZip ? 'text-[#0969da]' : 'text-emerald-600'}"></i>
                                        <span class="truncate">${escapeHtml(asset.name)}</span>
                                        ${asset.size ? `<span class="text-gray-400 font-sans text-[11px]">(${asset.size})</span>` : ''}
                                    </div>
                                    <a 
                                        href="${asset.download_url}" 
                                        download="${escapeHtml(asset.name)}" 
                                        class="px-2.5 py-1 text-xs font-semibold text-[#0969da] hover:bg-white rounded border border-transparent hover:border-gray-200 transition flex items-center gap-1"
                                    >
                                        <i data-lucide="download" class="w-3 h-3"></i> Download
                                    </a>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : `
                <div class="mt-6 pt-4 border-t border-[#d0d7de]">
                    <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <i data-lucide="package" class="w-3.5 h-3.5"></i> Attached Downloads
                    </h4>
                    <div class="p-3 rounded bg-gray-50 border border-gray-200 text-xs text-gray-500 italic flex items-center gap-2">
                        <i data-lucide="info" class="w-3.5 h-3.5"></i>
                        <span>No assets available for this release</span>
                    </div>
                </div>
            `}
        </div>

        <div class="px-6 py-3.5 bg-[#f6f8fa] border-t border-[#d0d7de] flex items-center justify-between gap-3">
            <button id="modal-view-all-link" class="text-xs sm:text-sm font-medium text-[#0969da] hover:underline flex items-center gap-1.5 transition">
                <i data-lucide="external-link" class="w-4 h-4"></i>
                <span>View all releases</span>
            </button>

            <button id="modal-dismiss-btn" class="px-4 py-2 bg-[#2da44e] hover:bg-[#2c974b] text-white text-xs sm:text-sm font-semibold rounded-md shadow-sm transition flex items-center gap-1.5">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Got it</span>
            </button>
        </div>
    `;

    openModal('New Release Available', modalContent, 'large', 'z-[9999]', 'scale');

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
