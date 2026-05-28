/**
 * 海拓選品 - API 调用层
 */

const API = {
    baseUrl: '',
    timeout: 30000,

    init(baseUrl) {
        if (baseUrl !== undefined) {
            this.baseUrl = baseUrl;
        }
    },

    async get(endpoint) {
        return this.request(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    },

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    },

    async request(endpoint, options) {
        const url = this.baseUrl + endpoint;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => { controller.abort(); }, this.timeout);

            const response = await fetch(url, Object.assign({}, options, { signal: controller.signal }));

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }

            return await response.json();

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络连接');
            }
            throw error;
        }
    },

    async getData() {
        const result = await this.get('/api/data');
        return result.data || result;
    },

    async getScenes() {
        const result = await this.get('/api/scenes');
        return result.data || result;
    },

    async getMapping() {
        const result = await this.get('/api/mapping');
        return result.data || result;
    },

    async getDetail(imagePath, lang) {
        const params = 'path=' + encodeURIComponent(imagePath) + '&lang=' + (lang || 'jp');
        return this.get('/api/detail?' + params);
    }
};
