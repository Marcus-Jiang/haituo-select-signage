/**
 * 海拓選品 - 状态管理模块
 */

const AppState = {
    data: [],
    currentLang: 'cn',
    currentLevel1: null,
    currentLevel2: null,
    isLoading: false,

    init(data) {
        this.data = data;
        this.currentLevel1 = null;
        this.currentLevel2 = null;
    },

    selectLevel1(level1) {
        this.currentLevel1 = level1;
        this.currentLevel2 = null;
    },

    selectLevel2(level2) {
        this.currentLevel2 = level2;
    },

    goHome() {
        if (this.data && this.data.length > 0) {
            this.currentLevel1 = this.data[0];
        }
        this.currentLevel2 = null;
    },

    getCurrentLevel1() {
        return this.currentLevel1;
    },

    getCurrentLevel2() {
        return this.currentLevel2;
    }
};