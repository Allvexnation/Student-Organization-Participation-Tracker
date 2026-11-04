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
        this.renderSeq = 0;
        this.renderPending = null;

        window.addEventListener('popstate', () => this.render());

        window.appNavigate = (path) => this.navigate(path);
    }

    navigate(path) {
        navigate(path);
        return this.render();
    }

    async render() {
        const seq = ++this.renderSeq;
        const run = async () => {
            if (seq !== this.renderSeq) return;
            await render(this.root, routes, initFunctions);
        };

        this.renderPending = (this.renderPending || Promise.resolve()).catch(() => {}).then(run);
        return this.renderPending;
    }
}
