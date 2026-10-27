export function navigate(path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export function getCurrentPath() {
    return window.location.pathname;
}
