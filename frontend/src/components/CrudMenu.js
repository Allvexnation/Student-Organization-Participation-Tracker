function disabledActionButton(title, svg) {
    return `
        <span class="crud-action-disabled-wrap inline-flex" title="${title}">
            <button 
                type="button"
                disabled
                tabindex="-1"
                class="crud-action-disabled p-1.5 rounded-md"
                aria-label="${title}"
                aria-disabled="true">
                ${svg}
            </button>
        </span>
    `;
}

export function CrudMenu({
    id,
    onView,
    onEdit,
    onDelete,
    deleteLabel,
    showView = true,
    showEdit = true,
    showDelete = true,
    viewDisabled = false,
    editDisabled = false,
    alwaysShowThree = false,
    customActions = []
}) {
    const escapedLabel = deleteLabel ? deleteLabel.replace(/'/g, "\\'") : '';
    const menuId = `crud-menu-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;

    const viewHandler = onView ? `window.${onView}('${id}')` : `window.viewItem('${id}')`;
    const editHandler = onEdit ? `window.${onEdit}('${id}')` : `window.editItem('${id}')`;
    const deleteHandler = onDelete
        ? `${onDelete}('${id}'${escapedLabel ? `, '${escapedLabel}'` : ''})`
        : `window.deleteItem('${id}'${escapedLabel ? `, '${escapedLabel}'` : ''})`;

    const viewIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>`;
    const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                </svg>`;
    const moreIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                </svg>`;

    let buttons = '';

    if (showView || alwaysShowThree) {
        if (viewDisabled || !showView) {
            buttons += disabledActionButton('View is not available', viewIcon);
        } else {
            buttons += `
            <button 
                type="button"
                onclick="${viewHandler}" 
                class="group p-1.5 text-gray-500 hover:bg-blue-100/70 hover:text-blue-900 dark:hover:bg-white dark:hover:text-black rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400" 
                title="View Details"
                aria-label="View Details">
                <svg class="group-hover:stroke-current dark:group-hover:stroke-black" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </button>
            `;
        }
    }

    if (showEdit || alwaysShowThree) {
        if (editDisabled || !showEdit) {
            buttons += disabledActionButton('Edit is not available', editIcon);
        } else {
            buttons += `
            <button 
                type="button"
                onclick="${editHandler}" 
                class="group p-1.5 text-gray-500 hover:bg-amber-100/70 hover:text-amber-800 dark:hover:bg-white dark:hover:text-black rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400" 
                title="Edit Record"
                aria-label="Edit Record">
                <svg class="group-hover:stroke-current dark:group-hover:stroke-black" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                </svg>
            </button>
            `;
        }
    }

    let dropdownItems = '';
    const hasDropdownItems = customActions && customActions.length > 0;

    if (customActions && customActions.length > 0) {
        customActions.forEach(action => {
            const handler = action.handler ? `${action.handler}('${id}'); toggleCrudMenu('${menuId}')` : '';
            dropdownItems += `
                <button 
                    type="button"
                    onclick="${handler}" 
                    class="w-full text-left px-3 py-2 text-sm ${action.colorClass || 'text-gray-700 hover:bg-gray-50'} flex items-center gap-2 transition-colors">
                    <span class="text-current">${action.icon}</span>
                    ${action.title || 'Action'}
                </button>
            `;
        });
    }

    if (showDelete && onDelete) {
        buttons += `
            <button 
                type="button"
                onclick="${deleteHandler}" 
                class="group p-1.5 text-gray-500 hover:bg-red-100/70 hover:text-red-700 dark:hover:bg-white dark:hover:text-black rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-red-400" 
                title="Delete"
                aria-label="Delete">
                <svg class="group-hover:stroke-current dark:group-hover:stroke-black" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" x2="10" y1="11" y2="17"/>
                    <line x1="14" x2="14" y1="11" y2="17"/>
                </svg>
            </button>
        `;
    }

    if (hasDropdownItems) {
        buttons += `
            <div class="relative">
                <button 
                    type="button"
                    onclick="event.stopPropagation(); toggleCrudMenu('${menuId}')"
                    class="group p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white dark:hover:text-black rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400"
                    title="More Actions"
                    aria-label="More Actions">
                    <svg class="group-hover:stroke-current dark:group-hover:stroke-black" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                    </svg>
                </button>
                <div id="${menuId}" class="crud-menu-dropdown hidden absolute right-0 bottom-full mb-1 w-40 rounded-lg shadow-lg py-1 z-50">
                    ${dropdownItems}
                </div>
            </div>
        `;
    } else if (alwaysShowThree) {
        buttons += disabledActionButton('More actions are not available', moreIcon);
    }

    return `<div class="inline-flex items-center gap-0.5 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200/70 shadow-xs">${buttons}</div>`;
}

window.toggleCrudMenu = function (menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    document.querySelectorAll('[id^="crud-menu-"]').forEach(el => {
        if (el.id !== menuId) {
            el.classList.add('hidden');
        }
    });

    menu.classList.toggle('hidden');
};

document.addEventListener('click', function (e) {
    document.querySelectorAll('[id^="crud-menu-"]').forEach(menu => {
        if (!menu.classList.contains('hidden')) {
            const button = menu.previousElementSibling;
            if (button && !button.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
            }
        }
    });
});
