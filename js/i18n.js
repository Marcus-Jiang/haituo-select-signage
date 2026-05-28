/**
 * 海拓選品 - 国际化模块
 */

const I18n = {
    currentLang: 'jp',

    texts: {
        siteTitle: {
            cn: '海拓选品 - 数字标牌',
            jp: 'カイタク選品 - デジタルサイネージ'
        },
        home: {
            cn: '全部',
            jp: 'すべて'
        },
        all: {
            cn: '全部',
            jp: 'すべて'
        },
        sceneBtn: {
            cn: '使用场景',
            jp: '使用シーン'
        },
        sceneHint: {
            cn: '场景图片存放于 scenes/ 文件夹，可在 scenes.json 和 scenes_mapping.json 中配置',
            jp: 'シーン画像は scenes/ フォルダに保存し、scenes.json と scenes_mapping.json で設定してください'
        },
        sceneEmpty: {
            cn: '暂无场景图片',
            jp: 'シーン画像はありません'
        },
        sceneLabel: {
            cn: '场景',
            jp: 'シーン'
        },
        noProducts: {
            cn: '暂无产品',
            jp: '製品がありません'
        },
        selectLevel2Hint: {
            cn: '请选择一个分类',
            jp: 'カテゴリを選択してください'
        },
        loadError: {
            cn: '数据加载失败',
            jp: 'データの読み込みに失敗しました'
        },
        scenePageTitle: {
            cn: '使用场景',
            jp: '使用シーン'
        },
        sceneBackText: {
            cn: '返回',
            jp: '戻る'
        },
        sceneEmptyTitle: {
            cn: '暂无场景图片',
            jp: 'シーン画像はありません'
        },
        sceneEmptyDesc: {
            cn: '该产品尚未配置使用场景图片，请在管理后台中添加。',
            jp: 'この製品にはまだ使用シーンの画像が設定されていません。'
        },
        sceneEmptyBackText: {
            cn: '返回产品列表',
            jp: '製品リストに戻る'
        },
        detailLoading: {
            cn: '加载中...',
            jp: '読み込み中...'
        },
        detailNoDesc: {
            cn: '暂无详细描述',
            jp: '詳細説明はありません'
        },
        detailLoadError: {
            cn: '加载失败',
            jp: '読み込みに失敗しました'
        }
    },

    init(lang) {
        this.currentLang = lang || 'jp';
    },

    setLang(lang) {
        this.currentLang = lang;
    },

    t(category) {
        if (!category) return '';
        return this.currentLang === 'cn' ? category.name_cn : category.name_jp;
    },

    getSiteTitle() {
        return this.texts.siteTitle[this.currentLang];
    },

    getHomeText() {
        return this.texts.home[this.currentLang];
    },

    getAllText() {
        return this.texts.all[this.currentLang];
    },

    getSceneBtnText() {
        return this.texts.sceneBtn[this.currentLang];
    },

    getSceneHintText() {
        return this.texts.sceneHint[this.currentLang];
    },

    getSceneEmptyText() {
        return this.texts.sceneEmpty[this.currentLang];
    },

    getSceneLabel() {
        return this.texts.sceneLabel[this.currentLang];
    },

    getNoProductsText() {
        return this.texts.noProducts[this.currentLang];
    },

    getSelectLevel2Hint() {
        return this.texts.selectLevel2Hint[this.currentLang];
    },

    getLoadErrorText() {
        return this.texts.loadError[this.currentLang];
    },

    getScenePageTitle() {
        return this.texts.scenePageTitle[this.currentLang];
    },

    getSceneBackText() {
        return this.texts.sceneBackText[this.currentLang];
    },

    getSceneEmptyTitle() {
        return this.texts.sceneEmptyTitle[this.currentLang];
    },

    getSceneEmptyDesc() {
        return this.texts.sceneEmptyDesc[this.currentLang];
    },

    getSceneEmptyBackText() {
        return this.texts.sceneEmptyBackText[this.currentLang];
    },

    getDetailLoadingText() {
        return this.texts.detailLoading[this.currentLang];
    },

    getDetailNoDescText() {
        return this.texts.detailNoDesc[this.currentLang];
    },

    getDetailLoadErrorText() {
        return this.texts.detailLoadError[this.currentLang];
    },

    updateLangButtons(btnCnId, btnJpId) {
        const btnCn = document.getElementById(btnCnId);
        const btnJp = document.getElementById(btnJpId);
        if (!btnCn || !btnJp) return;

        if (this.currentLang === 'cn') {
            this._setActiveButtonStyle(btnCn);
            this._setInactiveButtonStyle(btnJp);
        } else {
            this._setActiveButtonStyle(btnJp);
            this._setInactiveButtonStyle(btnCn);
        }
    },

    _setActiveButtonStyle(btn) {
        btn.style.backgroundColor = 'var(--primary-color)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--primary-color)';
    },

    _setInactiveButtonStyle(btn) {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = 'rgba(255,255,255,0.5)';
        btn.style.borderColor = 'rgba(255,255,255,0.15)';
    }
};