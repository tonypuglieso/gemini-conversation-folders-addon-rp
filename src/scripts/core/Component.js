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

        if (this.useShadow) {
            if (!this.element) {
                this.element = document.createElement('div');
                this.element.id = this.props.id || `gemini-component-${Math.random().toString(36).substr(2, 9)}`;
                this.shadowRoot = this.element.attachShadow({ mode: 'open' });
            }

            this.shadowRoot.innerHTML = `
                <style>${styles}</style>
                ${html.trim()}
            `;
        } else {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html.trim();
            this.element = tempDiv.firstElementChild;
        }

        this.afterRender();
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
     * Mounts the component to a parent container.
     * @param {HTMLElement} container 
     */
    mount(container) {
        const el = this.create();
        container.appendChild(el);
    }
}
