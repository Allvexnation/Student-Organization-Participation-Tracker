export function UpdatesStripbar() {
    const stripBarState = localStorage.getItem('updatesStripBarState') || 'collapsed';
    const initialMaxHeight = stripBarState === 'expanded' ? '1000px' : '0';

    return `
    <div id="updates-tab-strip" class="relative bg-white border-b border-gray-200 w-full left-0 shadow-sm sticky top-16 z-40">
        <div id="updates-tab-strip-inner" class="overflow-hidden transition-all duration-300 ease-in-out" style="max-height: ${initialMaxHeight};">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div class="flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm">
                        <i data-lucide="tag" class="w-4 h-4"></i>
                    </div>
                    <div class="flex items-center gap-2">
                        <h1 class="text-lg font-bold text-[#1f2328] tracking-tight">Releases</h1>
                        <span id="releases-count-badge" class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                            ...
                        </span>
                    </div>
                </div>

                <div class="relative w-36 sm:w-48 md:w-64">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                        type="text"
                        id="release-search-input"
                        placeholder="Find a release..."
                        class="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[#f6f8fa] border border-[#d0d7de] rounded-md focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none transition"
                    />
                </div>

                <div class="relative">
                    <select id="release-branch-filter" class="pl-8 pr-8 py-1.5 text-xs sm:text-sm bg-[#f6f8fa] border border-[#d0d7de] rounded-md focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none transition appearance-none cursor-pointer">
                        <option value="">All branches</option>
                    </select>
                    <i data-lucide="git-branch" class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                </div>

                <div class="relative">
                    <select id="release-status-filter" class="pl-8 pr-8 py-1.5 text-xs sm:text-sm bg-[#f6f8fa] border border-[#d0d7de] rounded-md focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none transition appearance-none cursor-pointer">
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="mandatory">Mandatory</option>
                    </select>
                    <i data-lucide="filter" class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                </div>

                <div class="relative">
                    <select id="release-version-dropdown" class="pl-8 pr-8 py-1.5 text-xs sm:text-sm bg-[#f6f8fa] border border-[#d0d7de] rounded-md focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none transition appearance-none cursor-pointer min-w-[120px] sm:min-w-[140px]">
                        <option value="">Jump to version...</option>
                    </select>
                    <i data-lucide="tag" class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                </div>

                <button id="release-show-all-btn" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-[#d0d7de] rounded-md hover:bg-gray-50 transition shadow-sm">
                    <i data-lucide="list" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">Show all</span>
                </button>

                <button id="release-latest-btn" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#0969da] bg-white border border-[#d0d7de] rounded-md hover:bg-blue-50 transition shadow-sm">
                    <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">Latest</span>
                </button>

                <div id="updates-back-button-container"></div>
            </div>
            </div>
        </div>
    </div>
    `;
}
