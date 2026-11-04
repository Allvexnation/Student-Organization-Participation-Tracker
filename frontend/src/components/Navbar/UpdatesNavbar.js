import { Navbar, initNavbar } from '../Layout/Navbar/Navbar.js';
import { UpdatesStripContent } from '../Stripbar/UpdatesStripbar.js';

export function UpdatesNavbar() {
    return Navbar('updates', { stripContent: UpdatesStripContent() });
}

export function initUpdatesNavbar() {
    return initNavbar('updates');
}
