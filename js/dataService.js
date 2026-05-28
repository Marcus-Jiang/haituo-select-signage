/**
 * 海拓選品 - 数据服务模块
 */

const DataService = {

    async loadData() {
        try {
            const result = await API.getData();
            const data = Array.isArray(result) ? result : (result && result.data ? result.data : result);
            AppState.init(data);
            return data;
        } catch (error) {
            console.error('API error:', error);
            try {
                const response = await fetch('data.json');
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const data = await response.json();
                AppState.init(data);
                return data;
            } catch (localError) {
                console.error('local fallback error:', localError);
                throw new Error('data_not_found');
            }
        }
    },

    collectAllLevel2Items() {
        if (!AppState.currentLevel1) return [];
        const items = [];
        if (AppState.currentLevel1.children) {
            AppState.currentLevel1.children.forEach(function(l2) { items.push(l2); });
        }
        return items;
    },

    collectDisplayProducts() {
        if (!AppState.currentLevel1) return [];

        let sourceCategories;
        if (!AppState.currentLevel2) {
            sourceCategories = AppState.currentLevel1.children || [];
        } else {
            sourceCategories = [AppState.currentLevel2];
        }

        const products = [];
        sourceCategories.forEach(function(cat) {
            if (cat.products) {
                cat.products.forEach(function(p) {
                    products.push(Object.assign({}, p, {
                        level1: AppState.currentLevel1,
                        level2: cat
                    }));
                });
            }
        });
        return products;
    }
};
