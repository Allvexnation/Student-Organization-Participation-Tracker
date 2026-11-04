import { AdminStripBar, initStripBarDropdowns, scrollToActiveTab as scrollToRoleTab } from '../Layout/Stripbar/Stripbar.js';

export { AdminStripBar, initStripBarDropdowns };

export function scrollToActiveTab() {
    return scrollToRoleTab('admin');
}
