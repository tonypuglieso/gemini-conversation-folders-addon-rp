import Component from '../core/Component.js';

export default class ManualEmojiPicker extends Component {
    constructor(props = {}) {
        super({ ...props, id: 'manual-emoji-picker' });
        this.state = {
            emojis: [],
            recentEmojis: [],
            filteredEmojis: [],
            categories: [
                { id: 0, name: 'Recientes', icon: '🕒' },
                { id: 1, name: 'Smileys', icon: '😀' },
                { id: 2, name: 'Personas', icon: '👋' },
                { id: 3, name: 'Animales', icon: '🐶' },
                { id: 4, name: 'Comida', icon: '🍎' },
                { id: 5, name: 'Viajes', icon: '🚗' },
                { id: 6, name: 'Actividades', icon: '⚽' },
                { id: 7, name: 'Objetos', icon: '💡' },
                { id: 8, name: 'Símbolos', icon: '❤️' },
                { id: 9, name: 'Banderas', icon: '🚩' }
            ],
            activeCategory: 0,
            searchTerm: '',
            isLoading: true
        };
        this.init();
    }

    async init() {
        this.state.isLoading = true;
        this.update();

        // Load recent emojis from storage
        try {
            const data = await chrome.storage.local.get('recent_emojis');
            this.state.recentEmojis = data.recent_emojis || [];
        } catch (e) {
            console.error('Error loading recents:', e);
            this.state.recentEmojis = [];
        }

        try {
            const response = await fetch(chrome.runtime.getURL('src/assets/emojis.json'));
            const allEmojis = await response.json();
            
            // Filter: only base yellow emojis (no skin tones)
            this.state.emojis = allEmojis.filter(emoji => !emoji.emoji.includes('\ud83c[\udffb-\udfff]'));
            
            // Set initial category to Recents if we have any, otherwise Smileys
            this.state.activeCategory = this.state.recentEmojis.length > 0 ? 0 : 1;
            this.state.filteredEmojis = this.getFilteredForCategory(this.state.activeCategory);
        } catch (e) {
            console.error('Error loading emojis.json:', e);
        }
        
        this.state.isLoading = false;
        this.update();
    }

    getFilteredForCategory(catId) {
        if (catId === 0) return this.state.recentEmojis;
        return this.state.emojis.filter(e => e.group === catId);
    }

    async saveRecentEmoji(emojiStr) {
        // Find in full list or recents
        const fullEmojiData = this.state.emojis.find(e => e.emoji === emojiStr) || 
                              this.state.recentEmojis.find(e => e.emoji === emojiStr);
        
        if (!fullEmojiData) return;

        let recents = [...this.state.recentEmojis];
        const index = recents.findIndex(e => e.emoji === emojiStr);
        
        if (index > -1) {
            recents.splice(index, 1);
        }
        
        recents.unshift(fullEmojiData);
        
        // Limit to 21 emojis (3 rows of 7)
        recents = recents.slice(0, 21);
        
        this.state.recentEmojis = recents;
        await chrome.storage.local.set({ recent_emojis: recents });
    }

    handleSearch(e) {
        const spanDict = {
            'corazon': 'heart', 'amor': 'love', 'fuego': 'fire', 'cara': 'face',
            'sonrisa': 'smile', 'mano': 'hand', 'ok': 'ok', 'check': 'check',
            'alerta': 'alert', 'peligro': 'warning', 'ojo': 'eye', 'estuche': 'case',
            'carpeta': 'folder', 'estrella': 'star', 'sol': 'sun', 'luna': 'moon',
            'agua': 'water', 'rayo': 'bolt', 'beso': 'kiss', 'risa': 'laugh',
            'llanto': 'cry', 'triste': 'sad', 'feliz': 'happy', 'perro': 'dog',
            'gato': 'cat', 'casa': 'house', 'auto': 'car', 'avion': 'plane'
        };

        const term = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        this.state.searchTerm = term;
        
        // Translate common span terms
        const searchTerms = [term];
        if (spanDict[term]) searchTerms.push(spanDict[term]);

        const filtered = this.state.emojis.filter(emoji => 
            searchTerms.some(t => 
                emoji.annotation.toLowerCase().includes(t) || 
                (emoji.tags && emoji.tags.some(tag => tag.toLowerCase().includes(t)))
            )
        );
        
        this.state.filteredEmojis = term ? filtered : this.getFilteredForCategory(this.state.activeCategory);
        this.updateGrid();
    }

    handleCategoryClick(catId) {
        this.state.activeCategory = catId;
        this.state.searchTerm = '';
        
        const input = this.element.querySelector('#emoji-search-input');
        if (input) input.value = '';

        this.state.filteredEmojis = this.getFilteredForCategory(catId);
        
        // Update active tab UI
        this.element.querySelectorAll('.cat-tab').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.id) === catId);
        });

        this.updateGrid();
    }

    updateGrid() {
        const grid = this.element.querySelector('.emoji-grid');
        if (!grid) return;

        if (this.state.activeCategory === 0 && this.state.filteredEmojis.length === 0 && !this.state.searchTerm) {
            this.setSafeHTML(grid, '<div class="empty-recents">No hay emojis recientes</div>');
            return;
        }

        this.setSafeHTML(grid, this.state.filteredEmojis.map(emoji => `
            <button class="emoji-item" title="${emoji.annotation}" data-emoji="${emoji.emoji}">
                ${emoji.emoji}
            </button>
        `).join(''));

        // Re-attach selection listeners
        grid.querySelectorAll('.emoji-item').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const emoji = btn.dataset.emoji;
                await this.saveRecentEmoji(emoji);
                if (this.props.onSelect) {
                    this.props.onSelect(emoji);
                }
            };
        });
    }

    render() {
        if (this.state.isLoading) {
            return '<div class="emoji-picker-container loading">Cargando emojis...</div>';
        }

        return `
            <div class="manual-emoji-picker-container" id="manual-emoji-picker">
                <div class="emoji-picker-header">
                    <div class="category-tabs">
                        ${this.state.categories.map(cat => `
                            <button class="cat-tab ${this.state.activeCategory === cat.id ? 'active' : ''}" 
                                    data-id="${cat.id}" title="${cat.name}">
                                ${cat.icon}
                            </button>
                        `).join('')}
                    </div>
                    <div class="emoji-search-wrapper">
                        <input type="text" id="emoji-search-input" placeholder="Buscar emoji..." value="${this.state.searchTerm}">
                    </div>
                </div>
                <div class="emoji-grid-viewport">
                    <div class="emoji-grid">
                        ${this.state.filteredEmojis.map(emoji => `
                            <button class="emoji-item" title="${emoji.annotation}" data-emoji="${emoji.emoji}">
                                ${emoji.emoji}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    afterRender() {
        const input = this.element.querySelector('#emoji-search-input');
        if (input) {
            input.oninput = (e) => this.handleSearch(e);
        }

        this.element.querySelectorAll('.cat-tab').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleCategoryClick(parseInt(btn.dataset.id));
            }
        });

        this.updateGrid();
    }
}
