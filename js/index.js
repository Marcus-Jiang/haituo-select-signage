const IndexRenderer = {
    _displayProducts: [],
    _sceneMappingCache: null,
    _modalJustOpened: false,

    renderAll() {
        this.renderSiteTitle();
        this.renderBreadcrumb();
        this.renderCategoryNav();
        this.renderProductGrid();
    },

    renderSiteTitle() {
        const title = document.getElementById('site-title');
        if (title) {
            title.textContent = I18n.getSiteTitle();
        }
    },

    renderBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;

        let html = '';
        const homeText = escapeHtml(I18n.getHomeText());
        html += `<span class="cursor-pointer hover:opacity-70 transition-opacity duration-200" data-action="go-home" style="color: var(--primary-color)">${homeText}</span>`;

        if (AppState.currentLevel1) {
            html += `<span style="color: var(--text-muted); margin: 0 8px;">/</span>`;
            const level1Idx = AppState.data.findIndex(c => c.name_cn === AppState.currentLevel1.name_cn);
            html += `<span class="cursor-pointer hover:opacity-70 transition-opacity duration-200" data-level1-idx="${level1Idx}" style="color: var(--primary-color)">${escapeHtml(I18n.t(AppState.currentLevel1))}</span>`;

            if (AppState.currentLevel2) {
                html += `<span style="color: var(--text-muted); margin: 0 8px;">/</span>`;
                html += `<span style="color: var(--text-secondary)">${escapeHtml(I18n.t(AppState.currentLevel2))}</span>`;
            }
        }

        breadcrumb.innerHTML = html;

        breadcrumb.onclick = function(e) {
            const homeEl = e.target.closest('[data-action="go-home"]');
            if (homeEl) {
                IndexController.goHome();
                return;
            }
            const level1El = e.target.closest('[data-level1-idx]');
            if (level1El) {
                const idx = parseInt(level1El.dataset.level1Idx);
                if (!isNaN(idx) && AppState.data[idx]) {
                    IndexController.selectLevel1(AppState.data[idx]);
                }
            }
        };
    },

    renderCategoryNav() {
        const nav = document.getElementById('category-nav');
        if (!nav) return;

        let html = '';
        html += this._renderLevel1Tags();

        if (AppState.currentLevel1 && AppState.currentLevel1.children && AppState.currentLevel1.children.length > 0) {
            html += this._renderLevel2Tags();
        }

        nav.innerHTML = html;
        this._bindNavEvents(nav);
    },

    _renderLevel1Tags() {
        let html = '<div class="level1-tags">';
        AppState.data.forEach((level1, idx) => {
            const isActive = AppState.currentLevel1 && AppState.currentLevel1.name_cn === level1.name_cn;
            html += `<span class="level1-tag${isActive ? ' active' : ''}" data-level1-idx="${idx}">${escapeHtml(I18n.t(level1))}</span>`;
        });
        html += '</div>';
        return html;
    },

    _renderLevel2Tags() {
        let html = '<div class="level2-tags">';
        html += `<span class="level2-tag${!AppState.currentLevel2 ? ' active' : ''}" data-action="all-level2">${escapeHtml(I18n.getAllText())}</span>`;

        const children = AppState.currentLevel1.children || [];
        children.forEach((level2, idx) => {
            const isActive = AppState.currentLevel2 && AppState.currentLevel2.name_cn === level2.name_cn;
            html += `<span class="level2-tag${isActive ? ' active' : ''}" data-level2-idx="${idx}">${escapeHtml(I18n.t(level2))}</span>`;
        });
        html += '</div>';
        return html;
    },

    _bindNavEvents(nav) {
        nav.onclick = function(e) {
            const level1Btn = e.target.closest('[data-level1-idx]');
            if (level1Btn) {
                const idx = parseInt(level1Btn.dataset.level1Idx);
                if (!isNaN(idx) && AppState.data[idx]) {
                    IndexController.selectLevel1(AppState.data[idx]);
                }
                return;
            }
            const level2Btn = e.target.closest('[data-level2-idx]');
            if (level2Btn) {
                const idx = parseInt(level2Btn.dataset.level2Idx);
                const l1Children = AppState.currentLevel1 ? (AppState.currentLevel1.children || []) : [];
                if (!isNaN(idx) && l1Children[idx]) {
                    IndexController.selectLevel2(l1Children[idx]);
                }
                return;
            }
            if (e.target.closest('[data-action="all-level2"]')) {
                IndexController.selectLevel2(null);
                return;
            }
        };
    },

    renderProductGrid() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        let html = '';
        this._displayProducts = [];

        if (!AppState.currentLevel1) {
            grid.innerHTML = '';
            return;
        }

        const products = DataService.collectDisplayProducts();

        if (products.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-20" style="color: var(--text-muted)">
                <svg class="w-12 h-12 mx-auto mb-4" style="color: var(--border-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                <p class="text-sm">${escapeHtml(I18n.getNoProductsText())}</p>
            </div>`;
            return;
        }

        if (!AppState.currentLevel2) {
            AppState.currentLevel1.children.forEach(level2 => {
                const l2Products = products.filter(p =>
                    p.level2 && p.level2.name_cn === level2.name_cn
                );
                if (l2Products.length > 0) {
                    html += this._renderProductGroup(level2, l2Products);
                }
            });
        } else {
            html += this._renderProductGroup(null, products);
        }

        if (!html) {
            html = `<div class="col-span-full text-center py-20" style="color: var(--text-muted)">
                <p class="text-sm">${escapeHtml(I18n.getNoProductsText())}</p>
            </div>`;
        }

        grid.innerHTML = html;

        grid.querySelectorAll('.fade-in').forEach(el => {
            el.addEventListener('animationend', function handler() {
                el.classList.remove('fade-in');
                el.removeEventListener('animationend', handler);
            });
        });

        grid.onclick = (e) => {
            const sceneBtn = e.target.closest('.btn-scene');
            if (sceneBtn && !sceneBtn.disabled) {
                const idx = parseInt(sceneBtn.dataset.productIdx);
                if (!isNaN(idx) && this._displayProducts[idx]) {
                    this._openScenePage(this._displayProducts[idx]);
                }
                return;
            }
            const cardImg = e.target.closest('.product-card-img');
            if (cardImg) {
                const idx = parseInt(cardImg.dataset.productIdx);
                if (!isNaN(idx) && this._displayProducts[idx]) {
                    this.openDetailModal(this._displayProducts[idx]);
                }
            }
        };
    },

    _renderProductGroup(category, products) {
        let html = '';
        if (category) {
            html += `<div class="col-span-full mt-12 mb-6 first:mt-0">
                <h2 class="product-group-title font-semibold" style="color: var(--text-primary)">
                    ${escapeHtml(I18n.t(category))}
                </h2>
                <div class="product-group-divider"></div>
            </div>`;
        }

        products.forEach((product) => {
            const productIdx = this._displayProducts.length;
            this._displayProducts.push(product);

            const coverImg = product.images && product.images.length > 0 ? product.images[0] : null;
            const coverPath = coverImg ? resolveMediaPath(coverImg.path) : '';
            const escapedName = escapeHtml(I18n.t(product));
            const sceneBtnText = escapeHtml(I18n.getSceneBtnText());
            const productKey = product.name_cn || '';
            const hasScenes = this._productHasScenes(productKey);

            const btnClass = hasScenes
                ? 'product-card-btn btn-scene w-full'
                : 'product-card-btn btn-scene btn-scene-disabled w-full';
            const btnAttr = hasScenes
                ? `data-product-idx="${productIdx}"`
                : `disabled data-product-idx="${productIdx}"`;

            html += `
                <div class="product-card card-hover fade-in" style="animation-delay: ${productIdx * 50}ms">
                    <div class="product-card-img aspect-[3/4] overflow-hidden flex items-center justify-center" data-product-idx="${productIdx}" style="background-color: var(--bg-subtle)">
                        <img src="${coverPath}" alt="${escapedName}" class="w-full h-full object-contain p-5" onerror="this.src='${getImagePlaceholderSvg()}'" loading="lazy" />
                    </div>
                    <div class="p-5 pt-4">
                        <h3 class="text-sm font-medium line-clamp-2 mb-3" style="color: var(--text-primary); line-height: 1.6">${escapedName}</h3>
                        <button class="${btnClass}" ${btnAttr}>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            ${sceneBtnText}
                        </button>
                    </div>
                </div>`;
        });

        return html;
    },

    async openDetailModal(product) {
        const modal = document.getElementById('detail-modal');
        const imageArea = document.getElementById('detail-image-area');
        const textArea = document.getElementById('detail-text-area');
        if (!modal || !imageArea || !textArea) return;

        const productName = escapeHtml(I18n.t(product));
        const coverImg = product.images && product.images.length > 0 ? product.images[0] : null;
        const rawCoverPath = coverImg ? coverImg.path : '';
        const coverPath = resolveMediaPath(rawCoverPath);
        const detailImagePath = resolveMediaPath(rawCoverPath.replace(/^images\//, 'details/'));

        let imgSrc = coverPath;
        try {
            const probe = await fetch(detailImagePath, { method: 'HEAD' });
            if (probe.ok) imgSrc = detailImagePath;
        } catch (e) {}

        imageArea.innerHTML = imgSrc
            ? `<img src="${imgSrc}" alt="${productName}" class="max-w-full max-h-[80vh] object-contain rounded-lg" onerror="this.onerror=null;this.src='${getImagePlaceholderSvg()}'" />`
            : '';

        textArea.innerHTML = `<div class="detail-loading">${I18n.getDetailLoadingText()}</div>`;

        this._modalJustOpened = true;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setTimeout(() => { this._modalJustOpened = false; }, 150);

        try {
            const lang = I18n.currentLang === 'cn' ? 'cn' : 'jp';
            let content = '';

            if (DataService._isStaticMode) {
                const mdRawPath = rawCoverPath.replace(/^images\//, 'details/').replace(/\.[^.]+$/, '_' + lang + '.md');
                const mdPath = resolveMediaPath(mdRawPath);
                const resp = await fetch(mdPath);
                if (resp.ok) {
                    content = await resp.text();
                }
            } else {
                const result = await API.getDetail(rawCoverPath, lang);
                if (result.success && result.content) {
                    content = result.content;
                }
            }

            if (content) {
                const renderedHtml = marked.parse(content);
                textArea.innerHTML = `<div class="detail-text-content"><h2 class="detail-product-title">${productName}</h2><div class="detail-md-body">${renderedHtml}</div></div>`;
            } else {
                textArea.innerHTML = `<div class="detail-text-content"><h2 class="detail-product-title">${productName}</h2><p style="color: var(--text-muted)">${I18n.getDetailNoDescText()}</p></div>`;
            }
        } catch (error) {
            console.error('Detail load error:', error);
            textArea.innerHTML = `<div class="detail-text-content"><h2 class="detail-product-title">${productName}</h2><p style="color: var(--text-muted)">${I18n.getDetailLoadErrorText()}</p></div>`;
        }
    },

    closeDetailModal() {
        const modal = document.getElementById('detail-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    _openScenePage(product) {
        const productKey = this._getProductKey(product);
        const nameCn = encodeURIComponent(product.name_cn || productKey);
        const nameJp = encodeURIComponent(product.name_jp || productKey);
        const key = encodeURIComponent(productKey);
        const lang = I18n.currentLang;
        const url = 'scene.html?key=' + key + '&name_cn=' + nameCn + '&name_jp=' + nameJp + '&lang=' + lang;
        window.open(url, '_blank');
    },

    _getProductKey(product) {
        return product.name_cn || '';
    },

    _productHasScenes(productKey) {
        if (!this._sceneMappingCache) return false;
        return this._sceneMappingCache.some(function(m) { return m.productname === productKey && m.scene && m.scene.trim() !== ''; });
    },

    async loadSceneMapping() {
        if (this._sceneMappingCache !== null) return;
        try {
            const resp = await fetch('scenes_mapping.json');
            if (resp.ok) {
                this._sceneMappingCache = await resp.json();
            }
        } catch (e) {
            this._sceneMappingCache = [];
        }
    },
};


const IndexController = {
    async init() {
        try {
            await DataService.loadData();
            await IndexRenderer.loadSceneMapping();
            if (AppState.data && AppState.data.length > 0) {
                AppState.selectLevel1(AppState.data[0]);
            }
            IndexRenderer.renderAll();
        } catch (error) {
            console.error(I18n.getLoadErrorText(), error);
            showToast(I18n.getLoadErrorText(), 'error');
        }
    },

    selectLevel1(level1) {
        AppState.selectLevel1(level1);
        IndexRenderer.renderAll();
    },

    selectLevel2(level2) {
        AppState.selectLevel2(level2);
        IndexRenderer.renderAll();
    },

    goHome() {
        AppState.goHome();
        IndexRenderer.renderAll();
    },

    switchLang(lang) {
        I18n.setLang(lang);
        AppState.currentLang = lang;
        this._updateLangButtons(lang);
        IndexRenderer.renderAll();
    },

    _updateLangButtons(lang) {
        I18n.updateLangButtons('btn-cn', 'btn-jp');
    }
};


document.addEventListener('DOMContentLoaded', () => {
    I18n.init('jp');

    setTimeout(() => {
        IndexController.init();
    }, 0);

    const btnCn = document.getElementById('btn-cn');
    const btnJp = document.getElementById('btn-jp');
    if (btnCn) btnCn.addEventListener('click', () => IndexController.switchLang('cn'));
    if (btnJp) btnJp.addEventListener('click', () => IndexController.switchLang('jp'));

    const detailModal = document.getElementById('detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (IndexRenderer._modalJustOpened) return;
            if (e.target === detailModal) IndexRenderer.closeDetailModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            IndexRenderer.closeDetailModal();
        }
    });
});
