export function skeletonStatCard(variant = 'primary') {
    if (variant === 'primary') {
        return `
            <div class="min-h-[148px] sm:min-h-[168px] rounded-2xl bg-navy/10 p-5 sm:p-6 flex flex-col justify-between">
                <div class="flex items-start justify-between">
                    <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                    <div class="w-10 h-10 skeleton-shimmer rounded-xl"></div>
                </div>
                <div class="h-9 w-16 skeleton-shimmer rounded-lg"></div>
            </div>
        `;
    }

    return `
        <div class="min-h-[108px] rounded-2xl border border-line bg-white p-4 sm:p-5 flex items-center justify-between gap-4">
            <div class="flex-1">
                <div class="h-3 w-24 skeleton-shimmer rounded mb-3"></div>
                <div class="h-8 w-16 skeleton-shimmer rounded-lg"></div>
            </div>
            <div class="w-12 h-12 skeleton-shimmer rounded-xl shrink-0"></div>
        </div>
    `;
}

export function skeletonTableRow(columns = 5, hasActions = false) {
    let cells = '';
    for (let i = 0; i < columns; i++) {
        const isLastColumn = i === columns - 1;
        const width = i === 0 ? 'w-20' : isLastColumn ? 'w-16' : 'w-full';
        
        if (hasActions && isLastColumn) {
            cells += `
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    <div class="flex justify-center">
                        <div class="inline-flex items-center gap-0.5 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200/70">
                            <div class="w-7 h-7 bg-gray-200 rounded-md skeleton-shimmer"></div>
                            <div class="w-7 h-7 bg-gray-200 rounded-md skeleton-shimmer"></div>
                            <div class="w-7 h-7 bg-gray-200 rounded-md skeleton-shimmer"></div>
                        </div>
                    </div>
                </td>
            `;
        } else {
            cells += `
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <div class="h-4 ${width} skeleton-shimmer rounded"></div>
                </td>
            `;
        }
    }

    return `
        <tr>
            ${cells}
        </tr>
    `;
}

export function skeletonTableRows(rows = 5, columns = 5, hasActions = false) {
    return Array.from({ length: rows }, () => skeletonTableRow(columns, hasActions)).join('');
}

export function skeletonTable(columns = 5, rows = 5) {
    return `
        <tbody>
            ${skeletonTableRows(rows, columns)}
        </tbody>
    `;
}

export function skeletonText(width = 'w-full', height = 'h-4') {
    return `
        <div class="${width} ${height} skeleton-shimmer rounded"></div>
    `;
}

export function skeletonAvatar(size = 'w-8 h-8') {
    return `
        <div class="${size} rounded-full skeleton-shimmer"></div>
    `;
}

export function skeletonButton(width = 'w-24', height = 'h-9') {
    return `
        <div class="${width} ${height} skeleton-shimmer rounded"></div>
    `;
}

export function skeletonAnnouncementCard() {
    return `
        <article class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm p-4 space-y-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full skeleton-shimmer shrink-0"></div>
                    <div class="space-y-1.5">
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                        <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                    </div>
                </div>
                <div class="w-6 h-4 skeleton-shimmer rounded"></div>
            </div>
            <div class="space-y-2 pt-1">
                <div class="h-4 w-full skeleton-shimmer rounded"></div>
                <div class="h-4 w-11/12 skeleton-shimmer rounded"></div>
                <div class="h-4 w-2/3 skeleton-shimmer rounded"></div>
            </div>
            <div class="h-48 w-full skeleton-shimmer rounded-lg"></div>
            <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <div class="h-3.5 w-16 skeleton-shimmer rounded"></div>
                <div class="flex gap-3">
                    <div class="h-3.5 w-20 skeleton-shimmer rounded"></div>
                    <div class="h-3.5 w-14 skeleton-shimmer rounded"></div>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div class="h-8 skeleton-shimmer rounded-md"></div>
                <div class="h-8 skeleton-shimmer rounded-md"></div>
                <div class="h-8 skeleton-shimmer rounded-md"></div>
            </div>
        </article>
    `;
}

export function skeletonAnnouncementCards(count = 3) {
    return Array.from({ length: count }, () => skeletonAnnouncementCard()).join('');
}

export function skeletonAdviserForm() {
    return `
        <form class="space-y-5">
            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-20 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div class="flex-shrink-0 w-20 h-20 rounded-lg skeleton-shimmer"></div>
                        <div class="flex-1 w-full space-y-2">
                            <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                            <div class="h-3 w-32 skeleton-shimmer rounded"></div>
                        </div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <div class="h-4 w-20 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                        </div>
                        <div class="space-y-1">
                            <div class="h-4 w-14 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-24 h-4 rounded"></legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1">
                        <div class="h-4 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-14 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
                <div class="h-9 w-28 skeleton-shimmer rounded"></div>
            </div>
        </form>
    `;
}

export function skeletonAdviserView() {
    return `
        <div class="space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg skeleton-shimmer mx-auto sm:mx-0"></div>
                <div class="text-center sm:text-left space-y-2 flex-1">
                    <div class="h-6 w-48 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-6 w-24 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                </div>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-48 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-6 w-20 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
            </div>
        </div>
    `;
}

export function skeletonAdminForm() {
    return `
        <form class="space-y-5">
            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-20 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div class="flex-shrink-0 w-20 h-20 rounded-lg skeleton-shimmer"></div>
                        <div class="flex-1 w-full space-y-2">
                            <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                            <div class="h-3 w-32 skeleton-shimmer rounded"></div>
                        </div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-24 h-4 rounded"></legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1">
                        <div class="h-4 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-14 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
                <div class="h-9 w-28 skeleton-shimmer rounded"></div>
            </div>
        </form>
    `;
}

export function skeletonAdminView() {
    return `
        <div class="space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg skeleton-shimmer mx-auto sm:mx-0"></div>
                <div class="text-center sm:text-left space-y-2 flex-1">
                    <div class="h-6 w-48 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-6 w-24 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                </div>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-48 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-6 w-20 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
            </div>
        </div>
    `;
}

export function skeletonRoleForm() {
    return `
        <form class="space-y-5">
            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
                <div class="h-9 w-24 skeleton-shimmer rounded"></div>
            </div>
        </form>
    `;
}

export function skeletonRoleView() {
    return `
        <div class="space-y-5">
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="space-y-2">
                    <div class="h-6 w-32 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                </div>
                <div class="h-6 w-20 skeleton-shimmer rounded"></div>
            </div>

            <hr class="border-gray-200">

            <div>
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <hr class="border-gray-200">

            <div>
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-24 h-4 rounded"></h4>
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2">
                    <div class="h-6 w-20 skeleton-shimmer rounded"></div>
                    <div class="h-6 w-24 skeleton-shimmer rounded"></div>
                    <div class="h-6 w-28 skeleton-shimmer rounded"></div>
                </div>
            </div>

            <div class="flex justify-end pt-3 border-t border-gray-100">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
            </div>
        </div>
    `;
}

export function skeletonStudentForm() {
    return `
        <form class="space-y-5">
            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-12 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div class="flex-shrink-0 w-20 h-20 rounded-lg skeleton-shimmer"></div>
                        <div class="flex-1 w-full space-y-2">
                            <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                            <div class="h-3 w-32 skeleton-shimmer rounded"></div>
                        </div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-48 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <div class="h-4 w-20 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                        </div>
                        <div class="space-y-1">
                            <div class="h-4 w-20 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                        </div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-52 h-4 rounded"></legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-48 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <div class="h-4 w-20 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                        </div>
                        <div class="space-y-1">
                            <div class="h-4 w-12 skeleton-shimmer rounded"></div>
                            <div class="h-10 w-full skeleton-shimmer rounded"></div>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
                <div class="h-9 w-28 skeleton-shimmer rounded"></div>
            </div>
        </form>
    `;
}

export function skeletonStudentView() {
    return `
        <div class="space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg skeleton-shimmer mx-auto sm:mx-0"></div>
                <div class="text-center sm:text-left space-y-2 flex-1">
                    <div class="h-6 w-48 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-4 w-32 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-6 w-20 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                </div>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-48 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-52 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
            </div>
        </div>
    `;
}

export function skeletonOrgForm() {
    return `
        <form class="manage-modal-form space-y-4">
            <section class="manage-modal-section rounded-2xl border border-line bg-white p-4 sm:p-5">
                <div class="h-3 w-40 skeleton-shimmer rounded mb-3"></div>
                <div class="space-y-3">
                    <div class="space-y-1.5">
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded-xl"></div>
                    </div>
                    <div class="space-y-1.5">
                        <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded-xl"></div>
                    </div>
                    <div class="space-y-1.5">
                        <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                        <div class="h-20 w-full skeleton-shimmer rounded-xl"></div>
                    </div>
                </div>
            </section>
            <section class="manage-modal-section rounded-2xl border border-line bg-white p-4 sm:p-5">
                <div class="h-3 w-36 skeleton-shimmer rounded mb-3"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded-xl"></div>
                    </div>
                    <div class="space-y-1.5">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded-xl"></div>
                    </div>
                </div>
            </section>
            <div class="manage-modal-actions flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <div class="h-10 w-full sm:w-24 skeleton-shimmer rounded-xl"></div>
                <div class="h-10 w-full sm:w-36 skeleton-shimmer rounded-xl"></div>
            </div>
        </form>
    `;
}

export function skeletonOrgView() {
    return `
        <div class="space-y-4">
            <div class="manage-modal-hero rounded-2xl border border-line overflow-hidden bg-white">
                <div class="manage-modal-hero-band"></div>
                <div class="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 sm:p-5">
                    <div class="flex-shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-2xl skeleton-shimmer mx-auto md:mx-0"></div>
                    <div class="text-center md:text-left space-y-2 flex-1">
                        <div class="h-6 w-48 skeleton-shimmer rounded mx-auto md:mx-0"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded mx-auto md:mx-0"></div>
                        <div class="h-6 w-20 skeleton-shimmer rounded mx-auto md:mx-0"></div>
                    </div>
                </div>
            </div>

            <section class="manage-modal-section rounded-2xl border border-line bg-white p-4 sm:p-5">
                <div class="h-3 w-40 skeleton-shimmer rounded mb-3"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div class="h-16 skeleton-shimmer rounded-xl"></div>
                    <div class="h-16 skeleton-shimmer rounded-xl"></div>
                    <div class="md:col-span-2 h-16 skeleton-shimmer rounded-xl"></div>
                </div>
            </section>
            <section class="manage-modal-section rounded-2xl border border-line bg-white p-4 sm:p-5">
                <div class="h-3 w-36 skeleton-shimmer rounded mb-3"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div class="h-16 skeleton-shimmer rounded-xl"></div>
                    <div class="h-16 skeleton-shimmer rounded-xl"></div>
                </div>
            </section>
            <div class="manage-modal-actions flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <div class="h-10 w-full sm:w-24 skeleton-shimmer rounded-xl"></div>
            </div>
        </div>
    `;
}

export function skeletonEventForm() {
    return `
        <form class="space-y-5">
            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-32 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-20 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
                <div class="h-9 w-28 skeleton-shimmer rounded"></div>
            </div>
        </form>
    `;
}

export function skeletonEventView() {
    return `
        <div class="space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg skeleton-shimmer mx-auto sm:mx-0"></div>
                <div class="text-center sm:text-left space-y-2 flex-1">
                    <div class="h-6 w-48 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-4 w-32 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-6 w-24 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                </div>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-32 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-48 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="sm:col-span-2 space-y-1">
                        <div class="h-3 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-64 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-40 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-32 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
            </div>
        </div>
    `;
}

export function skeletonEventRegistForm() {
    return `
        <form class="space-y-5">
            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-56 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
                <div class="h-9 w-36 skeleton-shimmer rounded"></div>
            </div>
        </form>
    `;
}

export function skeletonEventRegistView() {
    return `
        <div class="space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg skeleton-shimmer mx-auto sm:mx-0"></div>
                <div class="text-center sm:text-left space-y-2 flex-1">
                    <div class="h-6 w-48 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-4 w-32 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-6 w-24 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                </div>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-56 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-12 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-32 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-32 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
            </div>
        </div>
    `;
}

export function skeletonOrgMemForm() {
    return `
        <form class="space-y-5">
            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-56 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-48 h-4 rounded"></legend>
                <div class="space-y-3">
                    <div class="space-y-1">
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 w-48 skeleton-shimmer rounded"></div>
                        <div class="h-10 w-full skeleton-shimmer rounded"></div>
                    </div>
                </div>
            </fieldset>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
                <div class="h-9 w-36 skeleton-shimmer rounded"></div>
            </div>
        </form>
    `;
}

export function skeletonOrgMemView() {
    return `
        <div class="space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg skeleton-shimmer mx-auto sm:mx-0"></div>
                <div class="text-center sm:text-left space-y-2 flex-1">
                    <div class="h-6 w-48 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-4 w-40 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                    <div class="h-6 w-24 skeleton-shimmer rounded mx-auto sm:mx-0"></div>
                </div>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-56 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-48 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="border-b border-gray-200 pb-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 skeleton-shimmer w-48 h-4 rounded"></h4>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div class="space-y-1">
                        <div class="h-3 w-48 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                </dl>
            </div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2">
                <div class="h-9 w-20 skeleton-shimmer rounded"></div>
            </div>
        </div>
    `;
}
