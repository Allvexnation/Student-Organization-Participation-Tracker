export function skeletonStatCard(variant = 'primary') {
    const bgColor = variant === 'primary' ? 'bg-gray-200' : 'bg-white border border-gray-200';
    const textColor = 'skeleton-shimmer';
    const iconColor = 'skeleton-shimmer';

    return `
        <div class="${bgColor} rounded-lg p-5">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="h-3 w-24 ${textColor} rounded mb-2"></div>
                    <div class="h-8 w-16 ${textColor} rounded"></div>
                </div>
                <div class="w-8 h-8 ${iconColor} rounded opacity-60"></div>
            </div>
        </div>
    `;
}

export function skeletonTableRow(columns = 5) {
    let cells = '';
    for (let i = 0; i < columns; i++) {
        const width = i === 0 ? 'w-20' : i === columns - 1 ? 'w-16' : 'w-full';
        cells += `
            <td class="px-5 py-3">
                <div class="h-4 ${width} skeleton-shimmer rounded"></div>
            </td>
        `;
    }

    return `
        <tr>
            ${cells}
        </tr>
    `;
}

export function skeletonTableRows(rows = 5, columns = 5) {
    return Array.from({ length: rows }, () => skeletonTableRow(columns)).join('');
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
