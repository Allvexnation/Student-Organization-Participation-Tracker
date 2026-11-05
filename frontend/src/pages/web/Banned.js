import { getBanInfo, checkBan, cleanupExpiredBans } from '../../api/web/Banned.js';
import { getActiveSessionUser, getUserData } from '../../utils/jwt.js';
import { showBannedContactsModal } from '../../components/Modal/Contacts/BannedContactsModal.js';
import { BannedHero } from '../../components/Layout/Hero.js';
import { LockedFooter } from '../../components/Layout/Footer.js';
import { Navbar, initNavbar } from '../../components/Layout/Navbar/Navbar.js';
import { initReveal, playPageDomino } from '../../provider/Animation/HomepageAnimation.js';

export function Banned() {
    return `
    <div data-domino-page>
    <a class="skip" href="#main">Skip to content</a>

    ${Navbar('banned')}

    <main id="main">
      ${BannedHero()}
    </main>

    ${LockedFooter()}
    </div>
    `;
}

export function initBanned() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    initNavbar('banned');
    initReveal();

    let checkInterval = null;
    let timerInterval = null;
    let isRedirecting = false;

    function handleUnbanSuccess() {
        if (isRedirecting) return;
        isRedirecting = true;
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        try {
            localStorage.removeItem('banInfo');
            sessionStorage.removeItem('soptBanCheck');
            sessionStorage.setItem('soptBanCheck', JSON.stringify({ at: Date.now(), banned: false, ban_info: null }));
        } catch (e) {}

        window.location.href = '/';
    }

    function buildCurrentCheckData() {
        const checkData = {};

        const cachedIp = sessionStorage.getItem('clientIpAddress');
        if (cachedIp) {
            checkData.ip_address = cachedIp;
        }

        const active = getActiveSessionUser();
        if (active) {
            checkData.target_type = active.role;
            checkData.target_id = active.id;
            checkData.token = active.token;
        }

        return checkData;
    }

    async function checkBanStatus() {
        if (isRedirecting) return false;
        try {
            const checkData = buildCurrentCheckData();
            const banCheck = await checkBan(checkData);
            
            if (!banCheck || !banCheck.banned) {
                handleUnbanSuccess();
                return false;
            }
            
            if (banCheck.ban_info) {
                localStorage.setItem('banInfo', JSON.stringify(banCheck.ban_info));
            }
            return true;
        } catch (error) {
            console.error('Error checking ban status:', error);
            return true;
        }
    }

    function escapeAttr(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function censorIp(ip) {
        const value = String(ip || '').trim();
        if (!value) return '••••••••';

        if (value.includes(':')) {
            const groups = value.split(':').filter(Boolean);
            const first = groups[0] || '•';
            return `${first}:••••:••••:••••`;
        }

        const parts = value.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.•••.•••.•••`;
        }

        return '•'.repeat(Math.min(Math.max(value.length, 8), 16));
    }

    function renderIpRow(label, ip, { last = false } = {}) {
        if (!ip) return '';

        return `
            <div class="ban-details-row${last ? ' ban-details-row-last' : ''}">
                <span class="ban-details-label">${label}</span>
                <span class="ban-details-value ban-details-ip">
                    <span class="ban-details-mono ban-ip-text" data-ip="${escapeAttr(ip)}" data-visible="false">${censorIp(ip)}</span>
                    <button type="button" class="ban-ip-toggle" aria-label="Show ${label}" title="Show ${label}">
                        <i data-lucide="eye"></i>
                    </button>
                </span>
            </div>
        `;
    }

    function bindIpToggles(root) {
        if (!root) return;

        root.querySelectorAll('.ban-ip-toggle').forEach((button) => {
            button.addEventListener('click', () => {
                const wrap = button.closest('.ban-details-ip');
                const text = wrap?.querySelector('.ban-ip-text');
                if (!text) return;

                const visible = text.dataset.visible === 'true';
                const ip = text.dataset.ip || '';

                if (visible) {
                    text.textContent = censorIp(ip);
                    text.dataset.visible = 'false';
                    button.setAttribute('aria-label', 'Show IP address');
                    button.setAttribute('title', 'Show IP address');
                    button.innerHTML = '<i data-lucide="eye"></i>';
                } else {
                    text.textContent = ip;
                    text.dataset.visible = 'true';
                    button.setAttribute('aria-label', 'Hide IP address');
                    button.setAttribute('title', 'Hide IP address');
                    button.innerHTML = '<i data-lucide="eye-off"></i>';
                }

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });
    }

    function updateTimer(expiresAt) {
        const timerEl = document.getElementById('banTimer');
        if (!timerEl || !expiresAt) return;

        const now = Date.now();
        const expiry = new Date(expiresAt).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }

            timerEl.innerHTML = '<span class="text-green-600 font-semibold">Ban expired! Unbanning and redirecting...</span>';

            cleanupExpiredBans().catch(() => {});

            try {
                localStorage.removeItem('banInfo');
                sessionStorage.removeItem('soptBanCheck');
            } catch (e) {}

            setTimeout(async () => {
                const isStillBanned = await checkBanStatus();
                if (!isStillBanned) {
                    handleUnbanSuccess();
                }
            }, 600);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        timeString += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        timerEl.textContent = timeString;
    }

    async function loadBanDetails() {
        const container = document.getElementById('banDetails');
        const titleEl = document.getElementById('banTitle');
        const subtitleEl = document.getElementById('banSubtitle');

        let banInfo = null;
        try {
            const raw = localStorage.getItem('banInfo');
            if (raw) banInfo = JSON.parse(raw);
        } catch (e) {}

        if (!banInfo) {
            try {
                const checkData = buildCurrentCheckData();
                const banCheck = await checkBan(checkData);
                if (!banCheck || !banCheck.banned) {
                    handleUnbanSuccess();
                    return;
                }
                banInfo = banCheck.ban_info;
                if (banInfo) {
                    localStorage.setItem('banInfo', JSON.stringify(banInfo));
                }
            } catch (err) {
                console.error('Failed to load ban check on load:', err);
            }
        }
        
        if (banInfo) {
            try {
                const ban = banInfo;
                const banTypeLabel = ban.ban_type === 'session' ? 'Session Ban' : 
                                     ban.ban_type === 'overall' ? 'Overall Ban' : 'IP Ban';

                const isIpOnlyBan = ban.ban_type === 'ip' || (!ban.target_type && !ban.target_id);

                if (isIpOnlyBan) {
                    if (titleEl) titleEl.textContent = 'IP Address Restricted';
                    if (subtitleEl) subtitleEl.textContent = 'Your IP address has been restricted from accessing this system';
                } else {
                    if (titleEl) titleEl.textContent = 'Account Banned';
                    if (subtitleEl) subtitleEl.textContent = 'Your account has been banned from accessing this system';
                }
                
                const isTemporary = ban.ban_duration_type === 'temporary' && ban.expires_at;
                
                if (container) {
                    container.innerHTML = `
                        <div class="ban-details-card">
                            <div class="ban-details-head">
                                <div class="ban-details-icon">
                                    <i data-lucide="ban"></i>
                                </div>
                                <div class="ban-details-head-text">
                                    <h3>${banTypeLabel}</h3>
                                    <p>Review your ban details below</p>
                                </div>
                            </div>

                            <div class="ban-details-list">
                                <div class="ban-details-row">
                                    <span class="ban-details-label">Reason</span>
                                    <span class="ban-details-value">${escapeAttr(ban.reason || 'No reason provided')}</span>
                                </div>
                                ${ban.admin_name ? `
                                <div class="ban-details-row">
                                    <span class="ban-details-label">Banned by</span>
                                    <span class="ban-details-value">${escapeAttr(ban.admin_name)}</span>
                                </div>
                                ` : ''}
                                <div class="ban-details-row">
                                    <span class="ban-details-label">Duration</span>
                                    <span class="ban-details-value">${ban.ban_duration_type === 'temporary' ? 'Temporary' : 'Permanent'}</span>
                                </div>
                                ${ban.expires_at ? `
                                <div class="ban-details-row">
                                    <span class="ban-details-label">Expires</span>
                                    <span class="ban-details-value">${new Date(ban.expires_at).toLocaleString()}</span>
                                </div>
                                ` : ''}
                                ${isTemporary ? `
                                <div class="ban-details-row">
                                    <span class="ban-details-label">Time remaining</span>
                                    <span id="banTimer" class="ban-details-value ban-details-timer">Loading...</span>
                                </div>
                                ` : ''}
                                ${ban.target_name ? `
                                <div class="ban-details-row">
                                    <span class="ban-details-label">User</span>
                                    <span class="ban-details-value">${escapeAttr(ban.target_name)}</span>
                                </div>
                                ` : ''}
                                ${renderIpRow('IP Address', ban.ip_address)}
                                ${renderIpRow('Session IP', ban.session_ip)}
                                <div class="ban-details-row ban-details-row-last">
                                    <span class="ban-details-label">Banned on</span>
                                    <span class="ban-details-value">${ban.created_at ? new Date(ban.created_at).toLocaleString() : '—'}</span>
                                </div>
                            </div>

                            ${ban.session_ip ? `
                            <div class="ban-details-session">
                                <h4>Session Information</h4>
                                <div class="ban-details-list">
                                    <div class="ban-details-row">
                                        <span class="ban-details-label">Device Type</span>
                                        <span class="ban-details-value">${escapeAttr(ban.device_type || 'Unknown')}</span>
                                    </div>
                                    <div class="ban-details-row">
                                        <span class="ban-details-label">Browser</span>
                                        <span class="ban-details-value">${escapeAttr(ban.browser || 'Unknown')}</span>
                                    </div>
                                    <div class="ban-details-row ban-details-row-last">
                                        <span class="ban-details-label">OS</span>
                                        <span class="ban-details-value">${escapeAttr(ban.os || 'Unknown')}</span>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    `;
                }

                if (isTemporary && ban.expires_at) {
                    updateTimer(ban.expires_at);
                    if (timerInterval) clearInterval(timerInterval);
                    timerInterval = setInterval(() => updateTimer(ban.expires_at), 1000);
                }

                if (checkInterval) clearInterval(checkInterval);
                checkInterval = setInterval(checkBanStatus, 3000);
            } catch (error) {
                console.error('Error rendering ban info:', error);
                if (container) {
                    container.innerHTML = `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p class="text-sm text-yellow-700">Unable to load ban details. Please contact the administrator.</p>
                        </div>
                    `;
                }
            }
        } else {
            if (container) {
                container.innerHTML = `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p class="text-sm text-yellow-700">No active ban information found. If you are seeing this page, please try refreshing or returning home.</p>
                    </div>
                `;
            }
            if (checkInterval) clearInterval(checkInterval);
            checkInterval = setInterval(checkBanStatus, 3000);
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindIpToggles(container);

        const detailsCard = container?.firstElementChild;
        if (detailsCard) playPageDomino(detailsCard);
    }

    loadBanDetails();

    const contactSupportBtn = document.getElementById('contact-support-btn');
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', () => {
            showBannedContactsModal();
        });
    }
}
