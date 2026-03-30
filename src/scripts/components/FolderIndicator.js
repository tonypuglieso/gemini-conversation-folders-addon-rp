import Component from '../core/Component.js';
import { waitForElement } from '../utils.js';

export default class FolderIndicator extends Component {
    constructor(props = {}) {
        super(props);
    }

    async display(folderName) {
        const existingIndicator = document.getElementById('gemini-organizer-folder-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (!folderName) {
            return;
        }

        // 1. Selector Robusto: Pillbox es el botón de "Gemini Advanced/Pro"
        const pillar = await waitForElement('div[data-test-id="pillbox"]');
        
        // El contenedor real suele ser el padre o abuelo del pillbox
        let targetContainer = pillar ? pillar.parentElement : null;
        
        // Caso alternativo: Si Gemini cambia el DOM, buscamos el contenedor de herramientas
        if (!targetContainer) {
            targetContainer = document.querySelector('.header-tools-container') || 
                              document.querySelector('header .buttons-container') ||
                              document.querySelector('div[class*="buttons-container"]');
        }

        if (!targetContainer) {
            // Silenciamos el error para no ensuciar la consola, pero lo logueamos como advertencia interna
            console.warn('Gemini Organizer: No se pudo inyectar el indicador en el contenedor estándar.');
            return;
        }

        const indicator = document.createElement('div');
        indicator.id = 'gemini-organizer-folder-indicator';
        indicator.title = `Guardado en la carpeta: ${folderName}`;
        
        // SVG Icon (Material Folder Shape, Stable)
        const folderSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="#fcc934" style="margin-right: 6px;"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>`;

        this.setSafeHTML(indicator, `
            ${folderSvg}
            <span style="font-size: 13px; font-weight: 500; color: var(--rp-text-primary);">${folderName}</span>
        `);

        // 3. Insertamos nuestro indicador al principio de ese contenedor.
        targetContainer.prepend(indicator);
    }

    render() {
        return ''; // Custom display logic instead of standard mount
    }
}

