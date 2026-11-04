import { AdviserStripBar, initAdviserStripBarDropdowns, scrollToActiveTab as scrollToRoleTab } from '../Layout/Stripbar/Stripbar.js';

export { AdviserStripBar, initAdviserStripBarDropdowns };

export function scrollToActiveTab() {
    return scrollToRoleTab('adviser');
}
