/**
 * 海拓選品 - 工具函数模块
 *
 * 提供展示页面所需的通用工具函数
 */

/**
 * ==========================================
 * Toast 提示消息
 * ==========================================
 */

function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    var toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast 元素不存在，跳过显示');
        return;
    }

    var icon = document.getElementById('toast-icon');
    var msg = document.getElementById('toast-message');

    msg.textContent = message;

    if (type === 'success') {
        icon.innerHTML = '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    } else if (type === 'error') {
        icon.innerHTML = '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
    } else {
        icon.innerHTML = '<svg class="w-5 h-5" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }

    toast.className = 'toast';
    toast.classList.remove('hidden');

    setTimeout(function() {
        toast.classList.add('hidden');
    }, duration);
}


/**
 * ==========================================
 * HTML 转义（防止 XSS 攻击）
 * ==========================================
 */

function escapeHtml(text) {
    if (!text) return '';

    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


/**
 * ==========================================
 * 分类路径构建
 * ==========================================
 */

function buildCategoryPath(level1, level2, level3) {
    var path = '';

    if (level1) {
        path += level1.name_cn;
    }
    if (level2) {
        path += '/' + level2.name_cn;
    }
    if (level3) {
        path += '/' + level3.name_cn;
    }

    return path;
}


/**
 * ==========================================
 * 图片处理
 * ==========================================
 */

function getImagePlaceholderSvg(text) {
    var lang = window.I18n ? I18n.currentLang : 'jp';
    var defaultText = lang === 'cn' ? '暂无图片' : '画像なし';
    var displayText = text || defaultText;

    return 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 200\'><rect fill=\'%23FFFFFF\' width=\'200\' height=\'200\'/><text x=\'100\' y=\'110\' text-anchor=\'middle\' fill=\'%239A9A95\' font-size=\'14\'>' + encodeURIComponent(displayText) + '</text></svg>';
}