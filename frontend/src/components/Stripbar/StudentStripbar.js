import { StudentStripBar, initStudentStripBarDropdowns, scrollToActiveTab as scrollToRoleTab } from '../Layout/Stripbar/Stripbar.js';

export { StudentStripBar, initStudentStripBarDropdowns };

export function scrollToActiveTab() {
    return scrollToRoleTab('student');
}
