/**
 * Base class for UI components using a lightweight state-based rendering approach.
 * Replaces direct DOM manipulation with a cleaner render() cycle.
 */
export default class Component {
    constructor(props = {}) {
        this.props = props;
        this.state = {};
        this.element = null;
        this.useShadow = props.useShadow || false;
        this.shadowRoot = null;
    }

    /**
     * Updates the component state and triggers a re-render.
     * @param {Object} newState - Partial state update.
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.update();
    }

    /**
     * Generates the HTML string or DOM structure for the component.
     * Must be implemented by subclasses.
     * @returns {string} HTML string
     */
    render() {
        throw new Error('Component.render() must be implemented');
    }

    /**
     * Creates the DOM element from the render output.
     * Handles event listener binding if needed (subclasses can override).
     */
    create() {
        const html = this.render();
        const styles = this.getStyles();
        
        // --- Trusted Types Support (Chrome Dev / Gemini Security) ---
        let policy = { createHTML: (h) => h };
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
            try {
                // Try to use or create a policy to bypass TrustedHTML restrictions
                policy = window.trustedTypes.createPolicy('gemini-organizer-policy', {
                    createHTML: (string) => string
                }) || policy;
            } catch (e) {
                // Policy might already exist or be restricted
            }
        }

        if (this.useShadow) {
            if (!this.element) {
                this.element = document.createElement('div');
                this.element.id = this.props.id || `gemini-component-${Math.random().toString(36).substr(2, 9)}`;
                this.shadowRoot = this.element.attachShadow({ mode: 'open' });
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div><style>${styles}</style>${html.trim()}</div>`, 'text/html');
            const container = doc.body.firstElementChild;
            
            // Limpiar shadowRoot de forma segura
            while (this.shadowRoot.firstChild) {
                this.shadowRoot.removeChild(this.shadowRoot.firstChild);
            }

            if (container) {
                const fragment = document.createDocumentFragment();
                for (const child of container.childNodes) {
                    fragment.appendChild(this._cloneNodeSafe(child));
                }
                this.shadowRoot.appendChild(fragment);
            }
        } else {
            const template = document.createElement('template');
            template.innerHTML = html.trim();
            this.element = template.content.firstElementChild;
        }

        if (this.element) {
            try {
                this.afterRender();
            } catch (e) {
                console.error(`Gemini Organizer: Error en afterRender de ${this.constructor.name}:`, e);
            }
        }
        return this.element;
    }

    /**
     * Optional method to return CSS strings for the component (Shadow DOM only).
     * @returns {string} CSS styles
     */
    getStyles() {
        return '';
    }

    /**
     * Called after the DOM element is created.
     * Use this to attach event listeners or manipulate the DOM node directly.
     */
    afterRender() {
        // Optional hook for subclasses
    }

    /**
     * Re-renders the component and replaces the old element in the DOM.
     * This is a simple implementation; a virtual DOM would be overkill here.
     */
    update() {
        if (!this.element || !this.element.parentNode) {
            // If not mounted, just recreate the element for future mounting
            this.create();
            return;
        }

        const oldElement = this.element;

        // Si usa Shadow DOM, create() ya actualizó el innerHTML del shadowRoot internamente.
        // No necesitamos (ni podemos) reemplazar el nodo raíz.
        if (this.useShadow) {
            this.create();
            return;
        }

        const newElement = this.create();

        oldElement.parentNode.replaceChild(newElement, oldElement);
        this.element = newElement;
    }

    /**
     * Safely sets innerHTML using Trusted Types if available.
     * @param {HTMLElement} el 
     * @param {string} html 
     */
    setSafeHTML(el, html) {
        if (!el || html == null) return;
        
        let policy = { createHTML: (h) => h };
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
            try {
                policy = window.trustedTypes.getPolicies().find(p => p.name === 'gemini-organizer-policy') ||
                         window.trustedTypes.createPolicy('gemini-organizer-policy', {
                            createHTML: (string) => string
                         });
            } catch (e) {}
        }

        try {
            el.innerHTML = policy.createHTML(html);
        } catch (e) {
            // Fallback for strict CSP/Trusted Types: direct DOM move
            // We use removeChild to clear the element to avoid another Trusted Types trigger
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            while (doc.body.firstChild) {
                el.appendChild(doc.body.firstChild);
            }
        }
    }

    /**
     * Mounts the component to a parent container.
     * @param {HTMLElement} container 
     */
    mount(container) {
        const el = this.create();
        if (el) container.appendChild(el);
    }
}
