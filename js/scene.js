var ScenePage = {
    productKey: '',
    productNameCn: '',
    productNameJp: '',
    images: [],
    currentIndex: 0,

    init: function() {
        const params = new URLSearchParams(window.location.search);
        this.productKey = params.get('key') || '';
        this.productNameCn = params.get('name_cn') || this.productKey;
        this.productNameJp = params.get('name_jp') || this.productKey;
        I18n.init(params.get('lang') || 'jp');

        this._updateLangButtons();
        this._updateProductTitle();
        this._updateTexts();
        this._bindEvents();
        this._loadScenes();

        document.title = I18n.getScenePageTitle() + ' - ' + this._getProductName();
    },

    _getProductName: function() {
        return I18n.currentLang === 'cn' ? this.productNameCn : this.productNameJp;
    },

    _updateLangButtons: function() {
        I18n.updateLangButtons('scene-btn-cn', 'scene-btn-jp');
    },

    _updateProductTitle: function() {
        const title = document.getElementById('scene-product-title');
        if (title) {
            title.textContent = this._getProductName();
        }
    },

    _updateTexts: function() {
        const backText = document.getElementById('scene-back-text');
        if (backText) {
            backText.textContent = I18n.getSceneBackText();
        }

        const emptyTitle = document.getElementById('scene-empty-title');
        if (emptyTitle) {
            emptyTitle.textContent = I18n.getSceneEmptyTitle();
        }

        const emptyDesc = document.getElementById('scene-empty-desc');
        if (emptyDesc) {
            emptyDesc.textContent = I18n.getSceneEmptyDesc();
        }

        const emptyBackText = document.getElementById('scene-empty-back-text');
        if (emptyBackText) {
            emptyBackText.textContent = I18n.getSceneEmptyBackText();
        }
    },

    _bindEvents: function() {
        const self = this;

        document.getElementById('scene-back-btn').onclick = function() {
            self._goBack();
        };

        document.getElementById('scene-empty-back-btn').onclick = function() {
            self._goBack();
        };

        document.getElementById('scene-btn-cn').onclick = function() {
            self._switchLang('cn');
        };

        document.getElementById('scene-btn-jp').onclick = function() {
            self._switchLang('jp');
        };

        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                self.prev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                self.next();
            } else if (e.key === 'Escape') {
                self._goBack();
            }
        });

        const slideshow = document.getElementById('scene-slideshow');
        if (slideshow) {
            let startX = 0;
            let startY = 0;

            slideshow.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });

            slideshow.addEventListener('touchend', function(e) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;

                const diffX = endX - startX;
                const diffY = endY - startY;

                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        self.prev();
                    } else {
                        self.next();
                    }
                }
            });
        }
    },

    _switchLang: function(lang) {
        I18n.setLang(lang);
        this._updateLangButtons();
        this._updateProductTitle();
        this._updateTexts();
        document.title = I18n.getScenePageTitle() + ' - ' + this._getProductName();
    },

    _goBack: function() {
        window.close();
        setTimeout(function() {
            if (!window.closed) {
                window.history.back();
            }
        }, 200);
    },

    _loadScenes: function() {
        const self = this;

        Promise.all([
            API.getMapping(),
            API.getScenes()
        ]).then(function(results) {
            const mapping = results[0] || [];
            const scenesData = results[1] || [];

            const matchedSceneNames = [];
            for (let i = 0; i < mapping.length; i++) {
                const m = mapping[i];
                if (m.productname === self.productKey && m.scene) {
                    matchedSceneNames.push(m.scene);
                }
            }

            const imagePaths = self._resolveImagePaths(matchedSceneNames, scenesData);

            if (imagePaths.length === 0) {
                self._showEmpty();
            } else {
                self._showSlideshow(imagePaths);
            }
        }).catch(function() {
            self._showEmpty();
        });
    },

    _resolveImagePaths: function(sceneNames, scenesData) {
        const imagePaths = [];
        for (let i = 0; i < sceneNames.length; i++) {
            const sceneName = sceneNames[i];
            for (let j = 0; j < scenesData.length; j++) {
                const cat = scenesData[j];
                const scenes = cat.scenes || [];
                for (let k = 0; k < scenes.length; k++) {
                    const scene = scenes[k];
                    if (scene.name_cn === sceneName || scene.name_jp === sceneName) {
                        if (scene.images && scene.images.length > 0) {
                            for (let m = 0; m < scene.images.length; m++) {
                                if (scene.images[m].path) {
                                    imagePaths.push(scene.images[m].path);
                                }
                            }
                        }
                    }
                }
            }
        }
        return imagePaths;
    },

    _showEmpty: function() {
        document.getElementById('scene-slideshow').classList.add('hidden');
        document.getElementById('scene-prev-btn').classList.add('hidden');
        document.getElementById('scene-next-btn').classList.add('hidden');
        document.getElementById('scene-empty-state').classList.remove('hidden');
    },

    _showSlideshow: function(imagePaths) {
        this.images = imagePaths;
        this.currentIndex = 0;

        document.getElementById('scene-empty-state').classList.add('hidden');
        document.getElementById('scene-slideshow').classList.remove('hidden');

        if (imagePaths.length > 1) {
            document.getElementById('scene-prev-btn').classList.remove('hidden');
            document.getElementById('scene-next-btn').classList.remove('hidden');
        } else {
            document.getElementById('scene-prev-btn').classList.add('hidden');
            document.getElementById('scene-next-btn').classList.add('hidden');
        }

        this._updateSlide();
    },

    _updateSlide: function() {
        const img = document.getElementById('scene-main-image');
        const counter = document.getElementById('scene-counter');
        if (!img || !counter) return;

        img.src = this.images[this.currentIndex];
        img.alt = this._getProductName() + ' ' + (this.currentIndex + 1);
        counter.textContent = (this.currentIndex + 1) + ' / ' + this.images.length;
    },

    prev: function() {
        if (this.images.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this._updateSlide();
    },

    next: function() {
        if (this.images.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this._updateSlide();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    ScenePage.init();
});
