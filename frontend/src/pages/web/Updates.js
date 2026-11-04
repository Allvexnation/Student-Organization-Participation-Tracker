import { getActiveUpdates, getAllUpdates, getAssetDownloadUrl } from '../../api/web/Updates.js';
import { Navbar, initNavbar } from '../../components/Layout/Navbar/Navbar.js';
import { UpdatesStripContent } from '../../components/Stripbar/UpdatesStripbar.js';
import { createUpdatesModal, closeUpdatesModal } from '../../components/Modal/Updates/UpdatesModal.js';
import { initReveal, playPageDomino } from '../../provider/Animation/HomepageAnimation.js';

let markedLoadedPromise = null;
function ensureMarked() {
    if (typeof marked !== 'undefined') {
        if (marked.setOptions) {
            marked.setOptions({ gfm: true, breaks: true });
        }
        return Promise.resolve(window.marked);
    }
    if (markedLoadedPromise) {
        return markedLoadedPromise;
    }
    markedLoadedPromise = new Promise((resolve) => {
        const existing = document.querySelector('script[src*="marked"]');
        if (existing) {
            if (typeof marked !== 'undefined') {
                return resolve(window.marked);
            }
            existing.addEventListener('load', () => resolve(window.marked));
            existing.addEventListener('error', () => resolve(null));
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = () => {
            if (window.marked && window.marked.setOptions) {
                window.marked.setOptions({ gfm: true, breaks: true });
            }
            resolve(window.marked);
        };
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
    });
    return markedLoadedPromise;
}
ensureMarked();

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parseMarkdown(content) {
    if (!content) return '<p class="text-gray-500 italic">No description provided.</p>';
    if (typeof marked !== 'undefined' && marked.parse) {
        return marked.parse(content);
    }
    return escapeHtml(content).replace(/\n/g, '<br>');
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

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function navigateTo(path) {
    if (window.appNavigate) {
        window.appNavigate(path);
    } else {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
}

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

export function UpdatesPage() {
    return `
        <div id="updates-page-root" data-domino-page class="min-h-screen bg-[#f6f8fa] text-[#1f2328]">
            ${Navbar('updates', { stripContent: UpdatesStripContent() })}

            <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div id="mandatory-update-banner" class="hidden mb-8"></div>

                <div id="updates-container">
                    <div class="space-y-6">
                        <div class="h-32 bg-white rounded-lg border border-[#d0d7de] p-6 animate-pulse"></div>
                        <div class="h-48 bg-white rounded-lg border border-[#d0d7de] p-6 animate-pulse"></div>
                    </div>
                </div>
            </main>

            <button id="scroll-nav-button" class="scroll-nav-button hidden" title="Scroll to top">
                <i data-lucide="arrow-up" class="w-6 h-6"></i>
            </button>
        </div>
    `;
}

export async function initUpdatesPage() {
    closeUpdatesModal();
    await ensureMarked();

    initNavbar('updates');
    initReveal();

    const container = document.getElementById('updates-container');
    const bannerContainer = document.getElementById('mandatory-update-banner');
    const backBtnContainer = document.getElementById('updates-back-button-container');
    const countBadge = document.getElementById('releases-count-badge');
    const searchInput = document.getElementById('release-search-input');
    const branchFilter = document.getElementById('release-branch-filter');
    const statusFilter = document.getElementById('release-status-filter');
    const versionDropdown = document.getElementById('release-version-dropdown');
    const showAllBtn = document.getElementById('release-show-all-btn');
    const latestBtn = document.getElementById('release-latest-btn');

    if (!container) return;

    try {
        const [activeUpdates, allUpdatesData] = await Promise.all([
            getActiveUpdates().catch(() => []),
            getAllUpdates().catch(() => [])
        ]);

        const map = new Map();
        (allUpdatesData || []).forEach(u => map.set(u.id, u));
        (activeUpdates || []).forEach(u => map.set(u.id, { ...map.get(u.id), ...u }));

        let updatesList = Array.from(map.values());
        updatesList.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        const latestActive = activeUpdates && activeUpdates.length > 0 ? activeUpdates[0] : null;
        const isNotClosable = latestActive && latestActive.closable_type === 'not_closable';
        const isNotOpenable = latestActive && latestActive.closable_type === 'not_openable';

        const uniqueBranches = [...new Set(updatesList.map(u => u.branch || 'main').filter(Boolean))];
        uniqueBranches.sort();

        if (branchFilter) {
            branchFilter.innerHTML = '<option value="">All branches</option>' +
                uniqueBranches.map(branch => `<option value="${escapeHtml(branch)}">${escapeHtml(branch)}</option>`).join('');
        }

        if (versionDropdown) {
            versionDropdown.innerHTML = '<option value="">Jump to version...</option>' +
                updatesList.map(update => `<option value="${update.id}">v${escapeHtml(update.version)} - ${escapeHtml(update.name)}</option>`).join('');
        }

        if (countBadge) {
            countBadge.textContent = `${updatesList.length} release${updatesList.length === 1 ? '' : 's'}`;
        }

        if (isNotClosable) {
            if (bannerContainer) {
                bannerContainer.classList.remove('hidden');
                bannerContainer.innerHTML = `
                    <div class="p-4 rounded-lg bg-[#fff8c5] border border-[#d4a72c] text-[#7d4e00] flex items-start gap-3 shadow-sm">
                        <div class="p-1 rounded bg-[#eac54f]/30 text-[#9a6700] mt-0.5">
                            <i data-lucide="alert-triangle" class="w-5 h-5 flex-shrink-0"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-sm text-[#5f3b00] flex items-center gap-2">
                                System Maintenance & Mandatory Update in Progress
                                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ffebe9] text-[#cf222e] border border-[#ff8182]">
                                    Lockout Active
                                </span>
                            </h3>
                            <p class="text-xs sm:text-sm mt-1 text-[#7d4e00] leading-relaxed">
                                The system is currently applying critical updates. All navigation and application pages have been temporarily restricted to guarantee data integrity. Please review the release notes below.
                            </p>
                        </div>
                    </div>
                `;
            }
            if (backBtnContainer) {
                backBtnContainer.innerHTML = `
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                        Navigation Locked
                    </span>
                `;
            }
        } else if (isNotOpenable) {
            if (bannerContainer) {
                bannerContainer.classList.add('hidden');
                bannerContainer.innerHTML = '';
            }
            if (backBtnContainer) {
                backBtnContainer.innerHTML = `
                    <button id="btn-return-portal" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-white text-gray-900 border border-[#d0d7de] hover:bg-[#f3f4f6] transition shadow-sm">
                        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                        <span>Return to App</span>
                    </button>
                `;
                const returnBtn = document.getElementById('btn-return-portal');
                if (returnBtn) {
                    returnBtn.onclick = () => {
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            navigateTo('/');
                        }
                    };
                }
            }
        } else {
            if (bannerContainer) {
                bannerContainer.classList.add('hidden');
                bannerContainer.innerHTML = '';
            }
            if (backBtnContainer) {
                backBtnContainer.innerHTML = `
                    <button id="btn-return-portal" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-white text-gray-900 border border-[#d0d7de] hover:bg-[#f3f4f6] transition shadow-sm">
                        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                        <span>Return to App</span>
                    </button>
                `;
                const returnBtn = document.getElementById('btn-return-portal');
                if (returnBtn) {
                    returnBtn.onclick = () => {
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            navigateTo('/');
                        }
                    };
                }
            }
        }

        const renderList = (items) => {
            if (items.length === 0) {
                container.innerHTML = `
                    <div class="bg-white rounded-lg border border-[#d0d7de] p-12 text-center max-w-lg mx-auto shadow-sm my-8">
                        <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                            <i data-lucide="tag" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-base font-semibold text-[#1f2328]">There aren’t any releases matching your search</h3>
                        <p class="text-xs text-gray-500 mt-1">Try searching for another version number or release title.</p>
                    </div>
                `;
                refreshIcons();
                playPageDomino(container);
                return;
            }

            const latestUpdateId = updatesList.length > 0 ? updatesList[0].id : null;

            container.innerHTML = `
                <div class="relative">
                    ${items.map((update) => {
                        const isLatest = update.id === latestUpdateId;
                        const isActive = Number(update.is_active) === 1;
                        const isMandatory = update.closable_type === 'not_closable';
                        const isUpdated = Boolean(Number(update.is_updated) === 1);
                        const branchName = update.branch || 'main';
                        const assets = parseUpdateAssets(update);

                        return `
                            <article class="relative pl-0 md:pl-10 pb-12 border-l-0 md:border-l-2 md:border-[#d0d7de] last:border-l-0 last:pb-0" id="release-${update.id}">
                                <div class="hidden md:flex absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#0969da] items-center justify-center">
                                    <div class="w-1.5 h-1.5 rounded-full bg-[#0969da]"></div>
                                </div>

                                <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-mono font-semibold bg-blue-50 text-[#1f2328] border border-blue-200 shadow-sm">
                                            <i data-lucide="tag" class="w-3.5 h-3.5 text-blue-600"></i>
                                            v${escapeHtml(update.version)}
                                        </span>

                                        ${isLatest ? `
                                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#dafbe1] text-[#1a7f37] border border-[#2da44e]/30 shadow-sm">
                                                <i data-lucide="check-circle-2" class="w-3 h-3"></i> Latest
                                            </span>
                                        ` : ''}

                                        ${isActive && !isLatest ? `
                                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                Active
                                            </span>
                                        ` : ''}

                                        ${isMandatory ? `
                                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff8c5] text-[#9a6700] border border-[#d4a72c]/40">
                                                <i data-lucide="alert-circle" class="w-3 h-3"></i> Mandatory
                                            </span>
                                        ` : ''}

                                        ${isUpdated ? `
                                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 shadow-sm" title="This release information and files have been updated">
                                                <i data-lucide="check-check" class="w-3 h-3 text-purple-600"></i> Updated
                                            </span>
                                        ` : ''}
                                    </div>

                                    <div class="flex items-center gap-2 sm:gap-3 text-xs text-gray-500">
                                        <span class="inline-flex items-center gap-1 font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded border border-gray-200" title="Configured Branch">
                                            <i data-lucide="git-branch" class="w-3 h-3 text-gray-500"></i>
                                            ${escapeHtml(branchName)}
                                        </span>
                                        ${update.github_branch_link ? `
                                            <span>•</span>
                                            <a href="${escapeHtml(update.github_branch_link)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[#0969da] hover:underline" title="GitHub Branch Link">
                                                <i data-lucide="github" class="w-3 h-3"></i>
                                                <span class="truncate max-w-[150px]">GitHub</span>
                                            </a>
                                        ` : ''}
                                        <span>•</span>
                                        <time datetime="${update.created_at}" class="inline-flex items-center gap-1">
                                            <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                                            ${formatDate(update.created_at)} (${timeAgo(update.created_at)})
                                        </time>
                                    </div>
                                </div>

                                <div class="bg-white rounded-lg border border-[#d0d7de] shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                                    <div class="p-4 sm:p-5 border-b border-[#d0d7de] bg-[#f6f8fa] flex flex-wrap items-center justify-between gap-3">
                                        <div class="flex items-center gap-3">
                                            <img src="/public/crtlogo.png" alt="CRT Logo" class="w-9 h-9 rounded-full object-cover shadow">
                                            <div>
                                                <h2 class="text-base sm:text-lg font-bold text-[#1f2328] hover:text-[#0969da] transition-colors cursor-pointer" onclick="window.location.hash = '#release-${update.id}'">
                                                    ${escapeHtml(update.name)}
                                                </h2>
                                                <p class="text-xs text-gray-500 mt-0.5">
                                                    Released by <span class="font-medium text-gray-700">Administrator</span> ${timeAgo(update.created_at)}
                                                    ${isUpdated ? ` • <span class="text-purple-700 font-semibold">Updated ${timeAgo(update.updated_at || update.created_at)}</span>` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <button 
                                                class="collapse-toggle-button inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-[#d0d7de] rounded hover:bg-gray-50 transition shadow-sm"
                                                data-id="${update.id}"
                                                title="Collapse/Expand"
                                            >
                                                <i data-lucide="chevron-up" class="w-3.5 h-3.5 text-gray-500"></i>
                                            </button>
                                            <button 
                                                class="copy-tag-button inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-[#d0d7de] rounded hover:bg-gray-50 transition shadow-sm"
                                                data-tag="v${escapeHtml(update.version)}"
                                            >
                                                <i data-lucide="copy" class="w-3.5 h-3.5 text-gray-500"></i>
                                                <span>Copy tag</span>
                                            </button>
                                            <button 
                                                class="permalink-button inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-[#d0d7de] rounded hover:bg-gray-50 transition shadow-sm"
                                                data-id="${update.id}"
                                                title="Copy permalink"
                                            >
                                                <i data-lucide="link" class="w-3.5 h-3.5 text-gray-500"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="release-card-content" id="release-content-${update.id}">
                                        <div class="p-5 sm:p-6 github-markdown-body">
                                            ${parseMarkdown(update.readme_content)}
                                        </div>

                                        <div class="px-5 py-3.5 bg-[#f6f8fa] border-t border-[#d0d7de]">
                                            <details class="group" ${assets.length > 0 ? 'open' : ''}>
                                                <summary class="flex items-center justify-between cursor-pointer list-none font-semibold text-xs sm:text-sm text-[#1f2328]">
                                                    <span class="flex items-center gap-2">
                                                        <i data-lucide="package" class="w-4 h-4 text-gray-500"></i>
                                                        Assets (${assets.length} item${assets.length === 1 ? '' : 's'})
                                                    </span>
                                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180"></i>
                                                </summary>

                                                <div class="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs sm:text-sm">
                                                    ${assets.length > 0 ? assets.map(asset => {
                                                        const isZip = asset.type === 'zip' || asset.name.endsWith('.zip');
                                                        return `
                                                            <div class="flex flex-wrap items-center justify-between p-2.5 rounded bg-white border border-[#d0d7de] hover:border-[#0969da] transition shadow-xs gap-2">
                                                                <div class="flex items-center gap-2.5 min-w-0">
                                                                    <div class="p-1.5 rounded ${isZip ? 'bg-blue-50 text-[#0969da]' : 'bg-emerald-50 text-emerald-700'}">
                                                                        <i data-lucide="${isZip ? 'archive' : 'file-text'}" class="w-4 h-4"></i>
                                                                    </div>
                                                                    <div class="truncate">
                                                                        <a
                                                                            href="${asset.download_url}"
                                                                            download="${escapeHtml(asset.name)}"
                                                                            class="font-mono text-xs font-semibold text-[#0969da] hover:underline flex items-center gap-1.5"
                                                                        >
                                                                            ${escapeHtml(asset.name)}
                                                                            ${isZip ? '<span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-sans font-bold">ZIP</span>' : ''}
                                                                        </a>
                                                                        ${asset.size ? `<span class="text-[11px] text-gray-400 block">${asset.size}</span>` : ''}
                                                                    </div>
                                                                </div>

                                                                <a
                                                                    href="${asset.download_url}"
                                                                    download="${escapeHtml(asset.name)}"
                                                                    class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-[#f6f8fa] hover:bg-[#eef1f4] text-[#1f2328] border border-[#d0d7de] transition shadow-xs"
                                                                    title="Download ${escapeHtml(asset.name)}"
                                                                >
                                                                    <i data-lucide="download" class="w-3.5 h-3.5 text-gray-600"></i>
                                                                    <span>Download</span>
                                                                </a>
                                                            </div>
                                                        `;
                                                    }).join('') : ''}

                                                    ${(assets.length === 0) ? `
                                                        <div class="p-3 rounded bg-white border border-gray-200 text-xs text-gray-500 italic flex items-center gap-2">
                                                            <i data-lucide="info" class="w-3.5 h-3.5"></i>
                                                            <span>No assets available for this release</span>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        `;
                    }).join('')}
                </div>
            `;

            container.querySelectorAll('.copy-tag-button').forEach(btn => {
                btn.onclick = () => {
                    const tag = btn.getAttribute('data-tag');
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(tag).then(() => {
                            btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-green-600"></i><span class="text-green-600">Copied!</span>`;
                            refreshIcons();
                            setTimeout(() => {
                                btn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5 text-gray-500"></i><span>Copy tag</span>`;
                                refreshIcons();
                            }, 2000);
                        });
                    }
                };
            });

            container.querySelectorAll('.permalink-button').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.getAttribute('data-id');
                    const permalink = `${window.location.origin}${window.location.pathname}#release-${id}`;
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(permalink).then(() => {
                            btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-green-600"></i>`;
                            refreshIcons();
                            setTimeout(() => {
                                btn.innerHTML = `<i data-lucide="link" class="w-3.5 h-3.5 text-gray-500"></i>`;
                                refreshIcons();
                            }, 2000);
                        });
                    }
                };
            });

            container.querySelectorAll('.collapse-toggle-button').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.getAttribute('data-id');
                    const content = document.getElementById('release-content-' + id);
                    if (content) {
                        const isHidden = content.style.display === 'none';
                        content.style.display = isHidden ? 'block' : 'none';
                        btn.innerHTML = isHidden 
                            ? `<i data-lucide="chevron-up" class="w-3.5 h-3.5 text-gray-500"></i>`
                            : `<i data-lucide="chevron-down" class="w-3.5 h-3.5 text-gray-500"></i>`;
                        refreshIcons();
                    }
                };
            });

            if (window.location.hash) {
                const hash = window.location.hash.substring(1);
                if (hash.startsWith('release-')) {
                    const releaseId = hash.replace('release-', '');
                    setTimeout(() => {
                        const releaseElement = document.getElementById('release-' + releaseId);
                        if (releaseElement) {
                            releaseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            releaseElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
                            setTimeout(() => {
                                releaseElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
                            }, 2000);
                        }
                    }, 100);
                }
            }

            refreshIcons();
            playPageDomino(container);
            if (bannerContainer && !bannerContainer.classList.contains('hidden')) {
                const banner = bannerContainer.firstElementChild;
                if (banner) playPageDomino(banner);
            }
        };

        renderList(updatesList);

        const applyFilters = () => {
            const query = (searchInput?.value || '').trim().toLowerCase();
            const selectedBranch = (branchFilter?.value || '').trim();
            const selectedStatus = (statusFilter?.value || '').trim();

            const filtered = updatesList.filter(u => {
                if (query) {
                    const matchesSearch = 
                        (u.version && u.version.toLowerCase().includes(query)) ||
                        (u.name && u.name.toLowerCase().includes(query)) ||
                        (u.branch && u.branch.toLowerCase().includes(query)) ||
                        (u.readme_content && u.readme_content.toLowerCase().includes(query));
                    if (!matchesSearch) return false;
                }

                if (selectedBranch) {
                    const branch = u.branch || 'main';
                    if (branch !== selectedBranch) return false;
                }

                if (selectedStatus) {
                    const isActive = Number(u.is_active) === 1;
                    const isMandatory = u.closable_type === 'not_closable';

                    if (selectedStatus === 'active' && !isActive) return false;
                    if (selectedStatus === 'inactive' && isActive) return false;
                    if (selectedStatus === 'mandatory' && !isMandatory) return false;
                }

                return true;
            });

            renderList(filtered);
        };

        if (searchInput) {
            searchInput.oninput = applyFilters;
        }

        if (branchFilter) {
            branchFilter.onchange = applyFilters;
        }

        if (statusFilter) {
            statusFilter.onchange = applyFilters;
        }

        if (versionDropdown) {
            versionDropdown.onchange = () => {
                const selectedId = versionDropdown.value;
                if (selectedId) {
                    const selectedRelease = updatesList.find(u => u.id == selectedId);
                    if (selectedRelease) {
                        renderList([selectedRelease]);
                        versionDropdown.value = '';
                    }
                } else {
                    renderList(updatesList);
                }
            };
        }

        if (showAllBtn) {
            showAllBtn.onclick = () => {
                renderList(updatesList);
            };
        }

        if (latestBtn) {
            latestBtn.onclick = () => {
                if (updatesList.length > 0) {
                    renderList([updatesList[0]]);
                }
            };
        }

        const scrollButton = document.getElementById('scroll-nav-button');
        if (scrollButton) {
            const handleScroll = () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight;
                const clientHeight = document.documentElement.clientHeight;
                const isNearTop = scrollTop < 100;
                const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

                if (!isNearTop) {
                    scrollButton.classList.remove('hidden');
                } else {
                    scrollButton.classList.add('hidden');
                }

                if (isNearBottom) {
                    scrollButton.innerHTML = '<i data-lucide="arrow-up" class="w-6 h-6"></i>';
                    scrollButton.title = 'Scroll to top';
                } else {
                    scrollButton.innerHTML = '<i data-lucide="arrow-down" class="w-6 h-6"></i>';
                    scrollButton.title = 'Scroll to bottom';
                }
                refreshIcons();
            };

            scrollButton.onclick = () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight;
                const clientHeight = document.documentElement.clientHeight;
                const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

                if (isNearBottom) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: scrollHeight, behavior: 'smooth' });
                }
            };

            window.addEventListener('scroll', handleScroll);
            handleScroll();
        }

    } catch (err) {
        console.error('Failed to load updates page:', err);
        container.innerHTML = `
            <div class="p-6 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                Failed to fetch releases. Please verify backend connection.
            </div>
        `;
        playPageDomino(container);
    }
}

export function initUpdates() {
    getActiveUpdates().then(updates => {
        if (!updates || updates.length === 0) {
            return;
        }

        const latestUpdate = updates[0];
        const closableType = latestUpdate.closable_type;
        const currentPath = window.location.pathname;

        if (closableType === 'not_openable') {
            return;
        }

        if (closableType === 'not_closable') {
            if (currentPath !== '/updates') {
                closeUpdatesModal();
                navigateTo('/updates');
                return;
            }
            return;
        }

        if (currentPath === '/updates') {
            return;
        }

        if (closableType === 'show_once') {
            const viewedUpdates = JSON.parse(localStorage.getItem('viewedUpdates') || '[]');
            if (viewedUpdates.includes(latestUpdate.id)) {
                return;
            }
        }

        createUpdatesModal(latestUpdate);
    }).catch(err => {
        console.error('Error in initUpdates:', err);
    });
}

export function showUpdatesModal() {
    initUpdates();
}
