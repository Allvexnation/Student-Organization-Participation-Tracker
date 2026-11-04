import { getBanInfo, checkBan, cleanupExpiredBans } from '../../api/web/Banned.js';
import { getUserRole, getUserData } from '../../utils/jwt.js';
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

    async function checkBanStatus() {
        try {
            const checkData = {};

            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                checkData.ip_address = ipData.ip;
            } catch (ipError) {
                console.error('Failed to detect IP:', ipError);
            }

            try {
                const userRole = getUserRole();
                const userData = getUserData(userRole);
                
                if (userData && userData.id) {
                    checkData.target_type = userRole;
                    checkData.target_id = userData.id;
                }
            } catch (e) {

                console.log('User data not available, checking by IP only');
            }
            
            const banCheck = await checkBan(checkData);
            
            if (!banCheck.banned) {

                localStorage.removeItem('banInfo');
                if (checkInterval) clearInterval(checkInterval);
                if (timerInterval) clearInterval(timerInterval);
                window.location.href = '/';
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

        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
            timerEl.innerHTML = '<span class="text-green-600 font-semibold">Ban expired! Cleaning up and redirecting...</span>';

            cleanupExpiredBans().catch(err => console.error('Failed to cleanup expired bans:', err));

            localStorage.removeItem('banInfo');

            checkBanStatus();
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

        let banInfo = localStorage.getItem('banInfo');

        if (!banInfo) {
            const isStillBanned = await checkBanStatus();
            if (!isStillBanned) return;
            banInfo = localStorage.getItem('banInfo');
        }
        
        if (banInfo) {
            try {
                const ban = JSON.parse(banInfo);
                const banTypeLabel = ban.ban_type === 'session' ? 'Session Ban' : 
                                     ban.ban_type === 'overall' ? 'Overall Ban' : 'IP Ban';

                const isIpOnlyBan = !ban.target_type || !ban.target_id;

                if (isIpOnlyBan) {
                    titleEl.textContent = 'IP Address Restricted';
                    subtitleEl.textContent = 'Your IP address has been restricted from accessing this system';
                } else {
                    titleEl.textContent = 'Account Banned';
                    subtitleEl.textContent = 'Your account has been banned from accessing this system';
                }
                
                const isTemporary = ban.ban_duration_type !== 'permanent' && ban.expires_at;
                
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
                                <span class="ban-details-value">${ban.reason}</span>
                            </div>
                            ${ban.admin_name ? `
                            <div class="ban-details-row">
                                <span class="ban-details-label">Banned by</span>
                                <span class="ban-details-value">${ban.admin_name}</span>
                            </div>
                            ` : ''}
                            <div class="ban-details-row">
                                <span class="ban-details-label">Duration</span>
                                <span class="ban-details-value">${ban.ban_duration_type === 'permanent' ? 'Permanent' : 'Temporary'}</span>
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
                                <span class="ban-details-value">${ban.target_name}</span>
                            </div>
                            ` : ''}
                            ${renderIpRow('IP Address', ban.ip_address)}
                            ${renderIpRow('Session IP', ban.session_ip)}
                            <div class="ban-details-row ban-details-row-last">
                                <span class="ban-details-label">Banned on</span>
                                <span class="ban-details-value">${new Date(ban.created_at).toLocaleString()}</span>
                            </div>
                        </div>

                        ${ban.session_ip ? `
                        <div class="ban-details-session">
                            <h4>Session Information</h4>
                            <div class="ban-details-list">
                                <div class="ban-details-row">
                                    <span class="ban-details-label">Device Type</span>
                                    <span class="ban-details-value">${ban.device_type || 'Unknown'}</span>
                                </div>
                                <div class="ban-details-row">
                                    <span class="ban-details-label">Browser</span>
                                    <span class="ban-details-value">${ban.browser || 'Unknown'}</span>
                                </div>
                                <div class="ban-details-row ban-details-row-last">
                                    <span class="ban-details-label">OS</span>
                                    <span class="ban-details-value">${ban.os || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;

                if (isTemporary && ban.expires_at) {
                    updateTimer(ban.expires_at);
                    if (timerInterval) clearInterval(timerInterval);
                    timerInterval = setInterval(() => updateTimer(ban.expires_at), 1000);
                }

                if (checkInterval) clearInterval(checkInterval);
                checkInterval = setInterval(checkBanStatus, 5000);
            } catch (error) {
                console.error('Error parsing ban info:', error);
                container.innerHTML = `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p class="text-sm text-yellow-700">Unable to load ban details. Please contact the administrator.</p>
                    </div>
                `;
            }
        } else {
            container.innerHTML = `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p class="text-sm text-yellow-700">No active ban information found. If you are seeing this page, please try refreshing or contact support.</p>
                </div>
            `;
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