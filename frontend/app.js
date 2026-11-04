import { routes, initFunctions, getCurrentRoute, navigate, render } from './src/utils/Routes.js';
import { loadGoogleOAuth } from './src/api/auth/GoogleAuth.js';

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/index.css';
document.head.appendChild(link);

loadGoogleOAuth();

export class App {
    constructor(root) {
        this.root = root;

        window.addEventListener('popstate', () => this.render());

        window.appNavigate = (path) => this.navigate(path);
    }

    navigate(path) {
        navigate(path);
        this.render();
    }

    async render() {
        await render(this.root, routes, initFunctions);
    }
}
