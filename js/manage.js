var ManageApp = (function () {
    let data = [];
    let selectedCatIdx = -1;
    let selectedSubIdx = -1;
    let confirmCallback = null;
    let scenesData = [];
    let selectedSceneCatIdx = -1;
    let _productScenes = [];
    let currentModule = 'product';

    async function api(method, url, body) {
        const opts = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body !== undefined) {
            opts.body = JSON.stringify(body);
        }
        const resp = await fetch(url, opts);
        const result = await resp.json();
        if (!result.success) {
            throw new Error(result.error || '操作失败');
        }
        return result;
    }

    async function uploadDetailImage(file, category, subcategory, product) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', category);
        fd.append('subcategory', subcategory);
        fd.append('product', product);
        const resp = await fetch('/api/admin/upload-detail-image', { method: 'POST', body: fd });
        const result = await resp.json();
        if (!result.success) {
            throw new Error(result.error || '上传失败');
        }
        return result.path;
    }

    async function uploadListImage(file, category, subcategory, product) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', category);
        fd.append('subcategory', subcategory);
        const ext = file.name.split('.').pop().toLowerCase();
        fd.append('filename', product + '.' + ext);
        const resp = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const result = await resp.json();
        if (!result.success) {
            throw new Error(result.error || '上传失败');
        }
        return result.path;
    }

    async function loadData() {
        try {
            const result = await api('GET', '/api/admin/data');
            data = result.data || [];
            renderSidebar();
            renderMain();
        } catch (e) {
            showToast('加载数据失败: ' + e.message, 'error');
        }
    }

    function renderSidebar() {
        const tree = document.getElementById('category-tree');
        const footer = document.getElementById('sidebar-footer');
        if (!tree) return;

        let html = '';

        html += '<div class="sidebar-module-tabs">';
        html += '<button class="sidebar-module-tab' + (currentModule === 'product' ? ' active' : '') + '" data-action="switch-module" data-module="product">';
        html += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>';
        html += '<span>选品管理</span>';
        html += '</button>';
        html += '<button class="sidebar-module-tab' + (currentModule === 'scene' ? ' active' : '') + '" data-action="switch-module" data-module="scene">';
        html += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
        html += '<span>场景管理</span>';
        html += '</button>';
        html += '</div>';

        if (currentModule === 'product') {
            data.forEach(function (cat, ci) {
                const isActive = ci === selectedCatIdx;
                html += '<div class="cat-group">';
                html += '<div class="cat-item' + (isActive ? ' active' : '') + '" data-cat="' + ci + '">';
                html += '<div class="cat-item-left" data-action="select-cat" data-cat="' + ci + '">';
                html += '<svg class="w-3.5 h-3.5 shrink-0 transition-transform duration-200' + (isActive ? ' rotate-90' : '') + '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
                html += '<span class="cat-name">' + escapeHtml(cat.name_cn) + '</span>';
                html += '</div>';
                html += '<div class="cat-item-actions">';
                html += '<button class="cat-action-btn" data-action="edit-cat" data-cat="' + ci + '" title="编辑"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
                html += '<button class="cat-action-btn cat-action-btn-danger" data-action="delete-cat" data-cat="' + ci + '" title="删除"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
                html += '</div>';
                html += '</div>';

                if (isActive && cat.children) {
                    html += '<div class="sub-list">';
                    cat.children.forEach(function (sub, si) {
                        const isSubActive = si === selectedSubIdx;
                        html += '<div class="sub-item' + (isSubActive ? ' active' : '') + '" data-action="select-sub" data-cat="' + ci + '" data-sub="' + si + '">';
                        html += '<span class="sub-name">' + escapeHtml(sub.name_cn) + '</span>';
                        html += '<div class="sub-item-actions">';
                        html += '<button class="cat-action-btn" data-action="edit-sub" data-cat="' + ci + '" data-sub="' + si + '" title="编辑"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
                        html += '<button class="cat-action-btn cat-action-btn-danger" data-action="delete-sub" data-cat="' + ci + '" data-sub="' + si + '" title="删除"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>';
                        html += '</div>';
                        html += '</div>';
                    });
                    html += '<button class="btn-add-sub" data-action="add-sub" data-cat="' + ci + '">';
                    html += '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>';
                    html += '添加子分类</button>';
                    html += '</div>';
                }
                html += '</div>';
            });
        } else {
            scenesData.forEach(function (cat, idx) {
                const isActive = idx === selectedSceneCatIdx;
                html += '<div class="cat-item' + (isActive ? ' active' : '') + '">';
                html += '<div class="cat-item-left" data-action="select-scene-category" data-idx="' + idx + '">';
                html += '<svg class="w-3.5 h-3.5 shrink-0 transition-transform duration-200' + (isActive ? ' rotate-90' : '') + '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
                html += '<span class="cat-name">' + escapeHtml(cat.name_cn) + '</span>';
                html += '</div>';
                html += '<div class="cat-item-actions">';
                html += '<button class="cat-action-btn" data-action="edit-scene-category" data-idx="' + idx + '" title="编辑"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
                html += '<button class="cat-action-btn cat-action-btn-danger" data-action="delete-scene-category" data-idx="' + idx + '" title="删除"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
                html += '</div>';
                html += '</div>';
            });
        }

        tree.innerHTML = html;

        if (footer) {
            if (currentModule === 'product') {
                footer.innerHTML = '<button class="btn-add-cat" onclick="ManageApp.addCategory()"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>添加一级分类</button>';
            } else {
                footer.innerHTML = '<button class="btn-add-cat" onclick="ManageApp.addSceneCategory()"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>添加场景分类</button>';
            }
        }
    }

    function renderMain() {
        const mainBody = document.getElementById('main-body');
        const breadcrumb = document.getElementById('breadcrumb');
        const headerActions = document.getElementById('header-actions');
        if (!mainBody) return;

        if (currentModule === 'scene') {
            renderSceneMain();
            return;
        }

        if (selectedCatIdx < 0) {
            breadcrumb.innerHTML = '<span style="color: var(--text-muted)">管理后台</span>';
            headerActions.innerHTML = '';
            mainBody.innerHTML = '<div class="empty-state"><svg class="w-16 h-16 mx-auto mb-4" style="color: var(--border-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg><p class="text-base font-medium" style="color: var(--text-muted)">请从左侧选择分类</p><p class="text-sm mt-1" style="color: var(--text-muted)">选择一级分类管理子分类，选择子分类管理品类</p></div>';
            return;
        }

        const cat = data[selectedCatIdx];
        if (!cat) { selectedCatIdx = -1; renderMain(); return; }

        breadcrumb.innerHTML = '<span class="breadcrumb-link" data-action="home">管理后台</span><span class="breadcrumb-sep">/</span><span>' + escapeHtml(cat.name_cn) + '</span>';

        if (selectedSubIdx < 0) {
            headerActions.innerHTML = '<button class="btn btn-primary btn-sm" data-action="sort-cat" data-cat="' + selectedCatIdx + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>排序子分类</button>';
            renderSubcategoryList(cat);
        } else {
            const sub = cat.children[selectedSubIdx];
            if (!sub) { selectedSubIdx = -1; renderMain(); return; }
            breadcrumb.innerHTML += '<span class="breadcrumb-sep">/</span><span>' + escapeHtml(sub.name_cn) + '</span>';
            headerActions.innerHTML = '<button class="btn btn-primary btn-sm" data-action="add-product" data-cat="' + selectedCatIdx + '" data-sub="' + selectedSubIdx + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>添加品类</button><button class="btn btn-secondary btn-sm" data-action="sort-products" data-cat="' + selectedCatIdx + '" data-sub="' + selectedSubIdx + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>排序品类</button>';
            renderProductList(cat, sub);
        }
    }

    function renderSubcategoryList(cat) {
        const mainBody = document.getElementById('main-body');
        const children = cat.children || [];
        if (children.length === 0) {
            mainBody.innerHTML = '<div class="empty-state"><svg class="w-16 h-16 mx-auto mb-4" style="color: var(--border-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg><p class="text-base font-medium" style="color: var(--text-muted)">暂无子分类</p><p class="text-sm mt-1" style="color: var(--text-muted)">点击左侧"添加子分类"按钮创建</p></div>';
            return;
        }

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
        children.forEach(function (sub, si) {
            const prodCount = (sub.products || []).length;
            html += '<div class="card" data-action="select-sub" data-cat="' + selectedCatIdx + '" data-sub="' + si + '">';
            html += '<div class="card-body">';
            html += '<h3 class="card-title">' + escapeHtml(sub.name_cn) + '</h3>';
            html += '<p class="card-subtitle">' + escapeHtml(sub.name_jp) + '</p>';
            html += '<p class="card-meta">' + prodCount + ' 个品类</p>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        mainBody.innerHTML = html;
    }

    function renderProductList(cat, sub) {
        const mainBody = document.getElementById('main-body');
        const products = sub.products || [];
        if (products.length === 0) {
            mainBody.innerHTML = '<div class="empty-state"><svg class="w-16 h-16 mx-auto mb-4" style="color: var(--border-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg><p class="text-base font-medium" style="color: var(--text-muted)">暂无品类</p><p class="text-sm mt-1" style="color: var(--text-muted)">点击上方"添加品类"按钮创建</p></div>';
            return;
        }

        let html = '<div class="product-list">';
        products.forEach(function (prod, pi) {
            const coverImg = (prod.images && prod.images.length > 0) ? prod.images[0].path : '';
            html += '<div class="product-row">';
            html += '<div class="product-img">';
            if (coverImg) {
                html += '<img src="' + coverImg + '?t=' + Date.now() + '" alt="" onerror="this.style.display=\'none\'" />';
            } else {
                html += '<div class="product-img-placeholder"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>';
            }
            html += '</div>';
            html += '<div class="product-info">';
            html += '<h4 class="product-name">' + escapeHtml(prod.name_cn) + '</h4>';
            html += '<p class="product-name-jp">' + escapeHtml(prod.name_jp) + '</p>';
            html += '<div class="product-badges">';
            html += '<span class="badge badge-neutral">图片</span>';
            html += '<span class="badge badge-neutral">描述</span>';
            html += '<span class="badge badge-neutral">场景</span>';
            html += '</div>';
            html += '</div>';
            html += '<div class="product-actions">';
            html += '<button class="btn btn-secondary btn-xs" data-action="edit-product" data-cat="' + selectedCatIdx + '" data-sub="' + selectedSubIdx + '" data-prod="' + pi + '">编辑</button>';
            html += '<button class="btn btn-danger btn-xs" data-action="delete-product" data-cat="' + selectedCatIdx + '" data-sub="' + selectedSubIdx + '" data-prod="' + pi + '">删除</button>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        mainBody.innerHTML = html;

        loadProductBadges(cat, sub, products);
    }

    function loadProductBadges(cat, sub, products) {
        products.forEach(function (prod, pi) {
            const badgeContainer = document.querySelector('.product-row:nth-child(' + (pi + 1) + ') .product-badges');
            if (!badgeContainer) return;

            const catName = cat.name_cn;
            const subName = sub.name_cn;
            const prodName = prod.name_cn;

            fetch('/api/admin/detail?category=' + encodeURIComponent(catName) + '&subcategory=' + encodeURIComponent(subName) + '&product=' + encodeURIComponent(prodName) + '&lang=cn')
                .then(function (r) { return r.json(); })
                .then(function (result) {
                    if (!result.success) return;
                    const badges = badgeContainer.querySelectorAll('.badge');
                    if (badges.length >= 1) {
                        if (result.detail_image) {
                            badges[0].className = 'badge badge-success';
                            badges[0].textContent = '详情图';
                        } else if (prod.images && prod.images.length > 0) {
                            badges[0].className = 'badge badge-info';
                            badges[0].textContent = '原图';
                        } else {
                            badges[0].className = 'badge badge-warning';
                            badges[0].textContent = '无图';
                        }
                    }
                    if (badges.length >= 2) {
                        if (result.content && result.content.trim()) {
                            badges[1].className = 'badge badge-success';
                            badges[1].textContent = '有描述';
                        } else {
                            badges[1].className = 'badge badge-warning';
                            badges[1].textContent = '无描述';
                        }
                    }
                })
                .catch(function () {});

            fetch('/api/admin/product-scenes?product=' + encodeURIComponent(prodName))
                .then(function (r) { return r.json(); })
                .then(function (result) {
                    if (!result.success) return;
                    const badges = badgeContainer.querySelectorAll('.badge');
                    if (badges.length >= 3) {
                        if (result.scenes && result.scenes.length > 0) {
                            badges[2].className = 'badge badge-info';
                            badges[2].textContent = result.scenes.length + '场景';
                        } else {
                            badges[2].className = 'badge badge-warning';
                            badges[2].textContent = '无场景';
                        }
                    }
                })
                .catch(function () {});
        });
    }

    function openModal(title, bodyHtml, footerHtml) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-footer').innerHTML = footerHtml;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    function closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    function showConfirm(message, callback) {
        document.getElementById('confirm-message').textContent = message;
        confirmCallback = callback;
        document.getElementById('confirm-overlay').classList.remove('hidden');
    }

    function closeConfirm() {
        document.getElementById('confirm-overlay').classList.add('hidden');
        confirmCallback = null;
    }

    async function doConfirm() {
        if (confirmCallback) {
            await confirmCallback();
        }
        closeConfirm();
    }

    function addCategory() {
        const bodyHtml = '<div class="form-group"><label class="form-label">中文名称</label><input type="text" class="form-input" id="f-name-cn" placeholder="请输入中文分类名称" /></div><div class="form-group"><label class="form-label">日文名称</label><input type="text" class="form-input" id="f-name-jp" placeholder="请输入日文分类名称" /></div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveAddCategory()">保存</button>';
        openModal('添加一级分类', bodyHtml, footerHtml);
        setTimeout(function () { document.getElementById('f-name-cn').focus(); }, 100);
    }

    async function saveAddCategory() {
        const nameCn = document.getElementById('f-name-cn').value.trim();
        const nameJp = document.getElementById('f-name-jp').value.trim();
        if (!nameCn) { showToast('中文名称不能为空', 'error'); return; }
        try {
            const result = await api('POST', '/api/admin/category', { name_cn: nameCn, name_jp: nameJp });
            data = result.data;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('添加成功', 'success');
        } catch (e) {
            showToast('添加失败: ' + e.message, 'error');
        }
    }

    function editCategory(ci) {
        const cat = data[ci];
        if (!cat) return;
        const bodyHtml = '<div class="form-group"><label class="form-label">中文名称</label><input type="text" class="form-input" id="f-name-cn" value="' + escapeHtml(cat.name_cn) + '" /></div><div class="form-group"><label class="form-label">日文名称</label><input type="text" class="form-input" id="f-name-jp" value="' + escapeHtml(cat.name_jp) + '" /></div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveEditCategory(' + ci + ')">保存</button>';
        openModal('编辑一级分类', bodyHtml, footerHtml);
    }

    async function saveEditCategory(ci) {
        const nameCn = document.getElementById('f-name-cn').value.trim();
        const nameJp = document.getElementById('f-name-jp').value.trim();
        if (!nameCn) { showToast('中文名称不能为空', 'error'); return; }
        try {
            const result = await api('PUT', '/api/admin/category/' + ci, { name_cn: nameCn, name_jp: nameJp });
            data = result.data;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('修改成功', 'success');
        } catch (e) {
            showToast('修改失败: ' + e.message, 'error');
        }
    }

    function deleteCategory(ci) {
        const cat = data[ci];
        if (!cat) return;
        showConfirm('确定要删除一级分类"' + cat.name_cn + '"吗？该分类下的所有子分类和品类都将被删除，且不可恢复！', async function () {
            try {
                const result = await api('DELETE', '/api/admin/category/' + ci);
                data = result.data;
                if (selectedCatIdx === ci) { selectedCatIdx = -1; selectedSubIdx = -1; }
                else if (selectedCatIdx > ci) { selectedCatIdx--; }
                renderSidebar();
                renderMain();
                showToast('删除成功', 'success');
            } catch (e) {
                showToast('删除失败: ' + e.message, 'error');
            }
        });
    }

    function addSubcategory(ci) {
        const bodyHtml = '<div class="form-group"><label class="form-label">中文名称</label><input type="text" class="form-input" id="f-name-cn" placeholder="请输入中文子分类名称" /></div><div class="form-group"><label class="form-label">日文名称</label><input type="text" class="form-input" id="f-name-jp" placeholder="请输入日文子分类名称" /></div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveAddSubcategory(' + ci + ')">保存</button>';
        openModal('添加子分类', bodyHtml, footerHtml);
        setTimeout(function () { document.getElementById('f-name-cn').focus(); }, 100);
    }

    async function saveAddSubcategory(ci) {
        const nameCn = document.getElementById('f-name-cn').value.trim();
        const nameJp = document.getElementById('f-name-jp').value.trim();
        if (!nameCn) { showToast('中文名称不能为空', 'error'); return; }
        try {
            const result = await api('POST', '/api/admin/category/' + ci + '/subcategory', { name_cn: nameCn, name_jp: nameJp });
            data = result.data;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('添加成功', 'success');
        } catch (e) {
            showToast('添加失败: ' + e.message, 'error');
        }
    }

    function editSubcategory(ci, si) {
        const sub = data[ci].children[si];
        if (!sub) return;
        const bodyHtml = '<div class="form-group"><label class="form-label">中文名称</label><input type="text" class="form-input" id="f-name-cn" value="' + escapeHtml(sub.name_cn) + '" /></div><div class="form-group"><label class="form-label">日文名称</label><input type="text" class="form-input" id="f-name-jp" value="' + escapeHtml(sub.name_jp) + '" /></div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveEditSubcategory(' + ci + ',' + si + ')">保存</button>';
        openModal('编辑子分类', bodyHtml, footerHtml);
    }

    async function saveEditSubcategory(ci, si) {
        const nameCn = document.getElementById('f-name-cn').value.trim();
        const nameJp = document.getElementById('f-name-jp').value.trim();
        if (!nameCn) { showToast('中文名称不能为空', 'error'); return; }
        try {
            const result = await api('PUT', '/api/admin/subcategory/' + ci + '/' + si, { name_cn: nameCn, name_jp: nameJp });
            data = result.data;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('修改成功', 'success');
        } catch (e) {
            showToast('修改失败: ' + e.message, 'error');
        }
    }

    function deleteSubcategory(ci, si) {
        const sub = data[ci].children[si];
        if (!sub) return;
        showConfirm('确定要删除子分类"' + sub.name_cn + '"吗？该分类下的所有品类都将被删除，且不可恢复！', async function () {
            try {
                const result = await api('DELETE', '/api/admin/subcategory/' + ci + '/' + si);
                data = result.data;
                if (selectedSubIdx === si) { selectedSubIdx = -1; }
                else if (selectedSubIdx > si) { selectedSubIdx--; }
                renderSidebar();
                renderMain();
                showToast('删除成功', 'success');
            } catch (e) {
                showToast('删除失败: ' + e.message, 'error');
            }
        });
    }

    function sortSubcategories(ci) {
        const cat = data[ci];
        if (!cat || !cat.children || cat.children.length < 2) { showToast('至少需要2个子分类才能排序', 'info'); return; }
        const items = cat.children.map(function (sub, si) { return { idx: si, name: sub.name_cn }; });
        let bodyHtml = '<p class="text-sm mb-3" style="color: var(--text-muted)">拖拽调整子分类顺序</p><div class="sort-list" id="sort-list">';
        items.forEach(function (item) {
            bodyHtml += '<div class="sort-item" draggable="true" data-idx="' + item.idx + '"><svg class="w-4 h-4 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg><span>' + escapeHtml(item.name) + '</span></div>';
        });
        bodyHtml += '</div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveSortSubcategories(' + ci + ')">保存排序</button>';
        openModal('排序子分类', bodyHtml, footerHtml);
        initSortList();
    }

    async function saveSortSubcategories(ci) {
        const list = document.getElementById('sort-list');
        const items = list.querySelectorAll('.sort-item');
        const order = [];
        items.forEach(function (item) { order.push(parseInt(item.dataset.idx)); });
        try {
            const result = await api('PUT', '/api/admin/category/' + ci + '/subcategories/sort', { order: order });
            data = result.data;
            selectedSubIdx = -1;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('排序成功', 'success');
        } catch (e) {
            showToast('排序失败: ' + e.message, 'error');
        }
    }

    function addProduct(ci, si) {
        const cat = data[ci];
        const sub = cat.children[si];
        const autoName = sub.name_cn + '_' + ((sub.products || []).length + 1);
        let bodyHtml = '<div class="form-group"><label class="form-label">中文品名</label><input type="text" class="form-input" id="f-prod-cn" value="' + escapeHtml(autoName) + '" /></div><div class="form-group"><label class="form-label">日文品名</label><input type="text" class="form-input" id="f-prod-jp" /></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">列表图片（images目录，最多1张）</label><div class="upload-area" id="upload-area-list"><input type="file" id="f-prod-image-list" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none" /><p class="upload-hint">点击或拖拽1张图片到此处上传</p><div id="upload-preview-list" class="upload-preview"></div></div></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">详情图片（details目录，最多1张）</label><div class="upload-area" id="upload-area-detail"><input type="file" id="f-prod-image-detail" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none" /><p class="upload-hint">点击或拖拽1张图片到此处上传</p><div id="upload-preview-detail" class="upload-preview"></div></div></div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveAddProduct(' + ci + ',' + si + ')">保存</button>';
        openModal('添加品类', bodyHtml, footerHtml);
        initListImageUpload(ci, si, null);
        initDetailImageUpload(ci, si, null);
        setTimeout(function () { document.getElementById('f-prod-cn').focus(); }, 100);
    }

    async function saveAddProduct(ci, si) {
        const nameCn = document.getElementById('f-prod-cn').value.trim();
        const nameJp = document.getElementById('f-prod-jp').value.trim();
        if (!nameCn) { showToast('中文品名不能为空', 'error'); return; }

        const images = [];
        const listPreview = document.getElementById('upload-preview-list');
        if (listPreview) {
            const imgs = listPreview.querySelectorAll('[data-path]');
            imgs.forEach(function (el) { images.push({ path: el.dataset.path }); });
        }

        try {
            const result = await api('POST', '/api/admin/subcategory/' + ci + '/' + si + '/product', { name_cn: nameCn, name_jp: nameJp, images: images });
            data = result.data;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('添加成功', 'success');
        } catch (e) {
            showToast('添加失败: ' + e.message, 'error');
        }
    }

    function editProduct(ci, si, pi) {
        const cat = data[ci];
        const sub = cat.children[si];
        const prod = sub.products[pi];
        if (!prod) return;

        let bodyHtml = '<div class="form-tabs"><button class="form-tab active" data-tab="basic" onclick="ManageApp.switchTab(this, \'basic\')">基本信息</button><button class="form-tab" data-tab="desc" onclick="ManageApp.switchTab(this, \'desc\')">描述编辑</button><button class="form-tab" data-tab="scenes" onclick="ManageApp.switchTab(this, \'scenes\')">场景图</button></div>';

        bodyHtml += '<div class="form-tab-content" id="tab-basic">';
        bodyHtml += '<div class="form-group"><label class="form-label">中文品名</label><input type="text" class="form-input" id="f-prod-cn" value="' + escapeHtml(prod.name_cn) + '" /></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">日文品名</label><input type="text" class="form-input" id="f-prod-jp" value="' + escapeHtml(prod.name_jp) + '" /></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">列表图片（images目录，最多1张）</label><div class="upload-area" id="upload-area-list"><input type="file" id="f-prod-image-list" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none" /><p class="upload-hint">点击或拖拽1张图片到此处上传</p><div id="upload-preview-list" class="upload-preview"></div></div></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">详情图片（details目录，最多1张）</label><div class="upload-area" id="upload-area-detail"><input type="file" id="f-prod-image-detail" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none" /><p class="upload-hint">点击或拖拽1张图片到此处上传</p><div id="upload-preview-detail" class="upload-preview"></div></div></div>';
        bodyHtml += '</div>';

        bodyHtml += '<div class="form-tab-content hidden" id="tab-desc">';
        bodyHtml += '<div class="form-group"><div class="desc-lang-tabs"><button class="desc-lang-tab active" data-lang="cn" onclick="ManageApp.switchDescLang(this, \'cn\')">中文</button><button class="desc-lang-tab" data-lang="jp" onclick="ManageApp.switchDescLang(this, \'jp\')">日文</button></div></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">描述内容（Markdown）</label><textarea class="form-textarea" id="f-desc-content" rows="12" placeholder="请输入产品描述，支持 Markdown 格式"></textarea></div>';
        bodyHtml += '<div class="form-group"><button class="btn btn-secondary btn-sm" onclick="ManageApp.saveDescription(' + ci + ',' + si + ',' + pi + ')">保存描述</button></div>';
        bodyHtml += '</div>';

        bodyHtml += '<div class="form-tab-content hidden" id="tab-scenes">';
        bodyHtml += '<div id="scenes-content"><p class="text-sm" style="color: var(--text-muted)">加载中...</p></div>';
        bodyHtml += '</div>';

        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveEditProduct(' + ci + ',' + si + ',' + pi + ')">保存基本信息</button>';
        openModal('编辑品类 - ' + prod.name_cn, bodyHtml, footerHtml);

        initListImageUpload(ci, si, prod);
        initDetailImageUpload(ci, si, prod);
        loadProductDetail(cat.name_cn, sub.name_cn, prod.name_cn, ci, si, prod);
        loadProductScenes(prod.name_cn);
    }

    let _descData = { cn: '', jp: '' };
    let _currentDescLang = 'cn';
    let _descLoading = false;

    async function loadProductDetail(catName, subName, prodName, ci, si, prod) {
        _descData = { cn: '', jp: '' };
        _currentDescLang = 'cn';
        _descLoading = true;
        try {
            const cnResult = await api('GET', '/api/admin/detail?category=' + encodeURIComponent(catName) + '&subcategory=' + encodeURIComponent(subName) + '&product=' + encodeURIComponent(prodName) + '&lang=cn');
            _descData.cn = cnResult.content || '';

            if (cnResult.detail_image) {
                const detailPreview = document.getElementById('upload-preview-detail');
                if (detailPreview && !detailPreview.querySelector('[data-path]')) {
                    const thumb = document.createElement('div');
                    thumb.className = 'upload-thumb';
                    thumb.dataset.path = cnResult.detail_image;
                    thumb.innerHTML = '<img src="' + cnResult.detail_image + '?t=' + Date.now() + '" alt="" /><button class="upload-thumb-remove">&times;</button>';
                    thumb.querySelector('.upload-thumb-remove').addEventListener('click', function (ev) {
                        ev.stopPropagation();
                        removeDetailImage(ci, si, prod);
                    });
                    detailPreview.appendChild(thumb);
                }
            }

            const textarea = document.getElementById('f-desc-content');
            if (textarea && _currentDescLang === 'cn') {
                textarea.value = _descData.cn;
            }

            const jpResult = await api('GET', '/api/admin/detail?category=' + encodeURIComponent(catName) + '&subcategory=' + encodeURIComponent(subName) + '&product=' + encodeURIComponent(prodName) + '&lang=jp');
            _descData.jp = jpResult.content || '';

            if (textarea && _currentDescLang === 'jp') {
                textarea.value = _descData.jp;
            }
            _descLoading = false;
        } catch (e) {
            _descLoading = false;
        }
    }

    async function loadProductScenes(prodName) {
        const container = document.getElementById('scenes-content');
        if (!container) return;
        try {
            const result = await api('GET', '/api/admin/product-scenes?product=' + encodeURIComponent(prodName));
            _productScenes = result.scenes || [];
            const scenesResult = await api('GET', '/api/admin/scenes');
            scenesData = scenesResult.data || [];
            renderProductScenesEditor(prodName);
        } catch (e) {
            container.innerHTML = '<p class="text-sm" style="color: var(--error-color)">加载场景图失败</p>';
        }
    }

    function renderProductScenesEditor(prodName) {
        const container = document.getElementById('scenes-content');
        if (!container) return;

        let html = '<div class="form-group"><label class="form-label">已关联场景</label>';
        if (_productScenes.length === 0) {
            html += '<p class="text-sm" style="color: var(--text-muted)">暂无关联场景</p>';
        } else {
            html += '<div class="sort-list" id="product-scenes-list">';
            _productScenes.forEach(function (sceneName, idx) {
                html += '<div class="sort-item product-scene-item" data-scene-idx="' + idx + '">';
                html += '<svg class="w-4 h-4 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>';
                html += '<span class="product-scene-name">' + escapeHtml(sceneName) + '</span>';
                html += '<div class="product-scene-actions">';
                html += '<button class="btn btn-xs btn-secondary" data-action="move-product-scene-up" data-scene-idx="' + idx + '"' + (idx === 0 ? ' disabled' : '') + '>↑</button>';
                html += '<button class="btn btn-xs btn-secondary" data-action="move-product-scene-down" data-scene-idx="' + idx + '"' + (idx === _productScenes.length - 1 ? ' disabled' : '') + '>↓</button>';
                html += '<button class="btn btn-xs btn-danger" data-action="remove-product-scene" data-scene-idx="' + idx + '">删除</button>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div>';

        html += '<div class="form-group"><label class="form-label">添加场景</label>';
        html += '<div style="display:flex;gap:8px;align-items:center;">';
        html += '<select class="form-input" id="f-scene-select" style="flex:1;">';
        html += '<option value="">-- 请选择场景 --</option>';
        scenesData.forEach(function (cat) {
            const availableScenes = (cat.scenes || []).filter(function (s) {
                return _productScenes.indexOf(s.name_cn) < 0;
            });
            if (availableScenes.length > 0) {
                html += '<optgroup label="' + escapeHtml(cat.name_cn) + '">';
                availableScenes.forEach(function (s) {
                    html += '<option value="' + escapeHtml(s.name_cn) + '">' + escapeHtml(s.name_cn) + ' / ' + escapeHtml(s.name_jp) + '</option>';
                });
                html += '</optgroup>';
            }
        });
        html += '</select>';
        html += '<button class="btn btn-primary btn-sm" data-action="add-product-scene">添加</button>';
        html += '</div></div>';

        html += '<div class="form-group" style="margin-top:16px;">';
        html += '<button class="btn btn-primary" data-action="save-product-scenes" data-product="' + escapeHtml(prodName) + '">保存场景关联</button>';
        html += '</div>';

        container.innerHTML = html;
        initProductScenesDragSort();
    }

    function initProductScenesDragSort() {
        const list = document.getElementById('product-scenes-list');
        if (!list) return;
        let dragItem = null;

        list.addEventListener('dragstart', function (e) {
            dragItem = e.target.closest('.product-scene-item');
            if (dragItem) {
                dragItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        list.addEventListener('dragend', function () {
            if (dragItem) {
                dragItem.classList.remove('dragging');
                const items = Array.from(list.querySelectorAll('.product-scene-item'));
                const newOrder = [];
                items.forEach(function (item) {
                    const idx = parseInt(item.dataset.sceneIdx);
                    if (!isNaN(idx) && idx >= 0 && idx < _productScenes.length) {
                        newOrder.push(_productScenes[idx]);
                    }
                });
                if (newOrder.length === _productScenes.length) {
                    _productScenes = newOrder;
                }
                dragItem = null;
                renderProductScenesEditor(list.closest('#scenes-content') ? document.querySelector('#scenes-content').querySelector('[data-product]')?.dataset.product : '');
            }
        });

        list.addEventListener('dragover', function (e) {
            e.preventDefault();
            const target = e.target.closest('.product-scene-item');
            if (!target || target === dragItem) return;
            const items = Array.from(list.querySelectorAll('.product-scene-item'));
            const dragIdx = items.indexOf(dragItem);
            const targetIdx = items.indexOf(target);
            if (dragIdx < targetIdx) {
                target.parentNode.insertBefore(dragItem, target.nextSibling);
            } else {
                target.parentNode.insertBefore(dragItem, target);
            }
        });
    }

    function addProductScene() {
        const select = document.getElementById('f-scene-select');
        if (!select) return;
        const sceneName = select.value;
        if (!sceneName) { showToast('请选择一个场景', 'error'); return; }
        if (_productScenes.indexOf(sceneName) >= 0) { showToast('该场景已关联', 'error'); return; }
        _productScenes.push(sceneName);
        let prodName = document.querySelector('#scenes-content [data-product]');
        prodName = prodName ? prodName.dataset.product : '';
        renderProductScenesEditor(prodName);
        showToast('已添加场景', 'success');
    }

    function removeProductScene(idx) {
        if (idx < 0 || idx >= _productScenes.length) return;
        _productScenes.splice(idx, 1);
        let prodName = document.querySelector('#scenes-content [data-product]');
        prodName = prodName ? prodName.dataset.product : '';
        renderProductScenesEditor(prodName);
    }

    function moveProductSceneUp(idx) {
        if (idx <= 0 || idx >= _productScenes.length) return;
        const temp = _productScenes[idx];
        _productScenes[idx] = _productScenes[idx - 1];
        _productScenes[idx - 1] = temp;
        let prodName = document.querySelector('#scenes-content [data-product]');
        prodName = prodName ? prodName.dataset.product : '';
        renderProductScenesEditor(prodName);
    }

    function moveProductSceneDown(idx) {
        if (idx < 0 || idx >= _productScenes.length - 1) return;
        const temp = _productScenes[idx];
        _productScenes[idx] = _productScenes[idx + 1];
        _productScenes[idx + 1] = temp;
        let prodName = document.querySelector('#scenes-content [data-product]');
        prodName = prodName ? prodName.dataset.product : '';
        renderProductScenesEditor(prodName);
    }

    async function saveProductScenes(prodName) {
        if (!prodName) { showToast('产品名称无效', 'error'); return; }
        try {
            await api('PUT', '/api/admin/product-scenes', { product: prodName, scenes: _productScenes });
            showToast('场景关联保存成功', 'success');
            renderMain();
        } catch (e) {
            showToast('保存失败: ' + e.message, 'error');
        }
    }

    function switchTab(tabEl, tabId) {
        const tabs = tabEl.parentElement.querySelectorAll('.form-tab');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tabEl.classList.add('active');

        const contents = document.querySelectorAll('.form-tab-content');
        contents.forEach(function (c) { c.classList.add('hidden'); });
        const target = document.getElementById('tab-' + tabId);
        if (target) target.classList.remove('hidden');
    }

    function switchDescLang(tabEl, lang) {
        if (lang === _currentDescLang) return;
        const textarea = document.getElementById('f-desc-content');
        if (textarea) {
            _descData[_currentDescLang] = textarea.value;
        }
        _currentDescLang = lang;

        const tabs = tabEl.parentElement.querySelectorAll('.desc-lang-tab');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tabEl.classList.add('active');

        if (textarea) {
            textarea.value = _descData[lang] || '';
        }
    }

    async function saveDescription(ci, si, pi) {
        const cat = data[ci];
        const sub = cat.children[si];
        const prod = sub.products[pi];
        const textarea = document.getElementById('f-desc-content');
        if (!textarea) return;

        _descData[_currentDescLang] = textarea.value;

        try {
            await api('PUT', '/api/admin/detail', {
                category: cat.name_cn,
                subcategory: sub.name_cn,
                product: prod.name_cn,
                lang: 'cn',
                content: _descData.cn
            });
            await api('PUT', '/api/admin/detail', {
                category: cat.name_cn,
                subcategory: sub.name_cn,
                product: prod.name_cn,
                lang: 'jp',
                content: _descData.jp
            });
            showToast('描述保存成功', 'success');
            renderMain();
        } catch (e) {
            showToast('保存描述失败: ' + e.message, 'error');
        }
    }

    async function saveEditProduct(ci, si, pi) {
        const nameCn = document.getElementById('f-prod-cn').value.trim();
        const nameJp = document.getElementById('f-prod-jp').value.trim();
        if (!nameCn) { showToast('中文品名不能为空', 'error'); return; }

        const images = [];
        const listPreview = document.getElementById('upload-preview-list');
        if (listPreview) {
            const imgs = listPreview.querySelectorAll('[data-path]');
            imgs.forEach(function (el) { images.push({ path: el.dataset.path }); });
        }

        try {
            const result = await api('PUT', '/api/admin/product/' + ci + '/' + si + '/' + pi, { name_cn: nameCn, name_jp: nameJp, images: images });
            data = result.data;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('修改成功', 'success');
        } catch (e) {
            showToast('修改失败: ' + e.message, 'error');
        }
    }

    function deleteProduct(ci, si, pi) {
        const prod = data[ci].children[si].products[pi];
        if (!prod) return;
        showConfirm('确定要删除品类"' + prod.name_cn + '"吗？相关图片也将被删除，且不可恢复！', async function () {
            try {
                const result = await api('DELETE', '/api/admin/product/' + ci + '/' + si + '/' + pi);
                data = result.data;
                renderSidebar();
                renderMain();
                showToast('删除成功', 'success');
            } catch (e) {
                showToast('删除失败: ' + e.message, 'error');
            }
        });
    }

    function sortProducts(ci, si) {
        const sub = data[ci].children[si];
        if (!sub || !sub.products || sub.products.length < 2) { showToast('至少需要2个品类才能排序', 'info'); return; }
        const items = sub.products.map(function (prod, pi) { return { idx: pi, name: prod.name_cn }; });
        let bodyHtml = '<p class="text-sm mb-3" style="color: var(--text-muted)">拖拽调整品类顺序</p><div class="sort-list" id="sort-list">';
        items.forEach(function (item) {
            bodyHtml += '<div class="sort-item" draggable="true" data-idx="' + item.idx + '"><svg class="w-4 h-4 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg><span>' + escapeHtml(item.name) + '</span></div>';
        });
        bodyHtml += '</div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveSortProducts(' + ci + ',' + si + ')">保存排序</button>';
        openModal('排序品类', bodyHtml, footerHtml);
        initSortList();
    }

    async function saveSortProducts(ci, si) {
        const list = document.getElementById('sort-list');
        const items = list.querySelectorAll('.sort-item');
        const order = [];
        items.forEach(function (item) { order.push(parseInt(item.dataset.idx)); });
        try {
            const result = await api('PUT', '/api/admin/subcategory/' + ci + '/' + si + '/products/sort', { order: order });
            data = result.data;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('排序成功', 'success');
        } catch (e) {
            showToast('排序失败: ' + e.message, 'error');
        }
    }

    function initListImageUpload(ci, si, prod) {
        const area = document.getElementById('upload-area-list');
        const input = document.getElementById('f-prod-image-list');
        const preview = document.getElementById('upload-preview-list');
        if (!area || !input) return;

        if (prod && prod.images && prod.images.length > 0) {
            const img = prod.images[0];
            const thumb = document.createElement('div');
            thumb.className = 'upload-thumb';
            thumb.dataset.path = img.path;
            thumb.innerHTML = '<img src="' + img.path + '?t=' + Date.now() + '" alt="" /><button class="upload-thumb-remove" onclick="this.parentElement.remove()">&times;</button>';
            preview.appendChild(thumb);
        }

        area.addEventListener('click', function (e) {
            if (e.target.closest('.upload-thumb-remove')) return;
            input.click();
        });

        area.addEventListener('dragover', function (e) {
            e.preventDefault();
            area.classList.add('dragover');
        });
        area.addEventListener('dragleave', function () {
            area.classList.remove('dragover');
        });
        area.addEventListener('drop', function (e) {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        input.addEventListener('change', function () {
            if (input.files.length > 0) {
                handleFile(input.files[0]);
            }
            input.value = '';
        });

        async function handleFile(file) {
            const cat = data[ci];
            const sub = cat.children[si];
            const prodName = prod ? prod.name_cn : document.getElementById('f-prod-cn').value.trim();
            if (!prodName) {
                showToast('请先填写中文品名再上传图片', 'error');
                return;
            }
            try {
                const path = await uploadListImage(file, cat.name_cn, sub.name_cn, prodName);
                preview.innerHTML = '';
                const thumb = document.createElement('div');
                thumb.className = 'upload-thumb';
                thumb.dataset.path = path;
                thumb.innerHTML = '<img src="' + path + '?t=' + Date.now() + '" alt="" /><button class="upload-thumb-remove" onclick="this.parentElement.remove()">&times;</button>';
                preview.appendChild(thumb);
                showToast('列表图片上传成功', 'success');
            } catch (e) {
                showToast('上传失败: ' + e.message, 'error');
            }
        }
    }

    function initDetailImageUpload(ci, si, prod) {
        const area = document.getElementById('upload-area-detail');
        const input = document.getElementById('f-prod-image-detail');
        const preview = document.getElementById('upload-preview-detail');
        if (!area || !input) return;

        area.addEventListener('click', function (e) {
            if (e.target.closest('.upload-thumb-remove')) return;
            input.click();
        });

        area.addEventListener('dragover', function (e) {
            e.preventDefault();
            area.classList.add('dragover');
        });
        area.addEventListener('dragleave', function () {
            area.classList.remove('dragover');
        });
        area.addEventListener('drop', function (e) {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        input.addEventListener('change', function () {
            if (input.files.length > 0) {
                handleFile(input.files[0]);
            }
            input.value = '';
        });

        async function handleFile(file) {
            const cat = data[ci];
            const sub = cat.children[si];
            const prodName = prod ? prod.name_cn : document.getElementById('f-prod-cn').value.trim();
            if (!prodName) {
                showToast('请先填写中文品名再上传图片', 'error');
                return;
            }
            try {
                const path = await uploadDetailImage(file, cat.name_cn, sub.name_cn, prodName);
                preview.innerHTML = '';
                const thumb = document.createElement('div');
                thumb.className = 'upload-thumb';
                thumb.dataset.path = path;
                thumb.innerHTML = '<img src="' + path + '?t=' + Date.now() + '" alt="" /><button class="upload-thumb-remove">&times;</button>';
                thumb.querySelector('.upload-thumb-remove').addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    removeDetailImage(ci, si, prod);
                });
                preview.appendChild(thumb);
                showToast('详情图片上传成功', 'success');
            } catch (e) {
                showToast('上传失败: ' + e.message, 'error');
            }
        }
    }

    async function removeDetailImage(ci, si, prod) {
        const cat = data[ci];
        const sub = cat.children[si];
        const prodName = prod ? prod.name_cn : document.getElementById('f-prod-cn').value.trim();
        if (!prodName) return;
        try {
            await api('DELETE', '/api/admin/detail-image', {
                category: cat.name_cn,
                subcategory: sub.name_cn,
                product: prodName
            });
            const preview = document.getElementById('upload-preview-detail');
            if (preview) preview.innerHTML = '';
            showToast('详情图片已删除', 'success');
        } catch (e) {
            showToast('删除失败: ' + e.message, 'error');
        }
    }

    function initSortList() {
        const list = document.getElementById('sort-list');
        if (!list) return;
        let dragItem = null;

        list.addEventListener('dragstart', function (e) {
            dragItem = e.target.closest('.sort-item');
            if (dragItem) {
                dragItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        list.addEventListener('dragend', function () {
            if (dragItem) {
                dragItem.classList.remove('dragging');
                dragItem = null;
            }
        });

        list.addEventListener('dragover', function (e) {
            e.preventDefault();
            const target = e.target.closest('.sort-item');
            if (!target || target === dragItem) return;
            const items = Array.from(list.querySelectorAll('.sort-item'));
            const dragIdx = items.indexOf(dragItem);
            const targetIdx = items.indexOf(target);
            if (dragIdx < targetIdx) {
                target.parentNode.insertBefore(dragItem, target.nextSibling);
            } else {
                target.parentNode.insertBefore(dragItem, target);
            }
        });
    }

    async function switchModule(mod) {
        currentModule = mod;
        if (mod === 'scene') {
            selectedCatIdx = -1;
            selectedSubIdx = -1;
            selectedSceneCatIdx = -1;
            try {
                const result = await api('GET', '/api/admin/scenes');
                scenesData = result.data || [];
            } catch (e) {
                scenesData = [];
            }
        } else {
            selectedSceneCatIdx = -1;
        }
        renderSidebar();
        renderMain();
    }

    function renderSceneMain() {
        const mainBody = document.getElementById('main-body');
        const breadcrumb = document.getElementById('breadcrumb');
        const headerActions = document.getElementById('header-actions');
        if (!mainBody) return;

        breadcrumb.innerHTML = '<span class="breadcrumb-link" data-action="switch-module" data-module="product">管理后台</span><span class="breadcrumb-sep">/</span><span>场景管理</span>';

        if (selectedSceneCatIdx < 0) {
            headerActions.innerHTML = '';
            renderSceneCategoriesDirect(mainBody);
        } else {
            const cat = scenesData[selectedSceneCatIdx];
            if (!cat) { selectedSceneCatIdx = -1; renderSceneMain(); return; }
            breadcrumb.innerHTML += '<span class="breadcrumb-sep">/</span><span>' + escapeHtml(cat.name_cn) + '</span>';
            headerActions.innerHTML = '<button class="btn btn-primary btn-sm" data-action="add-scene" data-cat-idx="' + selectedSceneCatIdx + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>添加场景</button><button class="btn btn-secondary btn-sm" data-action="sort-scenes" data-cat-idx="' + selectedSceneCatIdx + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>排序场景</button>';
            renderSceneListDirect(mainBody, cat);
        }
    }

    function renderSceneCategoriesDirect(container) {
        if (scenesData.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg class="w-16 h-16 mx-auto mb-4" style="color: var(--border-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><p class="text-base font-medium" style="color: var(--text-muted)">暂无场景分类</p><p class="text-sm mt-1" style="color: var(--text-muted)">点击左下角"添加场景分类"按钮创建</p></div>';
            return;
        }
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
        scenesData.forEach(function (cat, idx) {
            const sceneCount = (cat.scenes || []).length;
            html += '<div class="card" data-action="select-scene-category" data-idx="' + idx + '">';
            html += '<div class="card-body">';
            html += '<h3 class="card-title">' + escapeHtml(cat.name_cn) + '</h3>';
            html += '<p class="card-subtitle">' + escapeHtml(cat.name_jp) + '</p>';
            html += '<p class="card-meta">' + sceneCount + ' 个场景</p>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderSceneListDirect(container, cat) {
        const scenes = cat.scenes || [];
        if (scenes.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg class="w-16 h-16 mx-auto mb-4" style="color: var(--border-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><p class="text-base font-medium" style="color: var(--text-muted)">暂无场景</p><p class="text-sm mt-1" style="color: var(--text-muted)">点击上方"添加场景"按钮创建</p></div>';
            return;
        }
        let html = '<div class="scene-list">';
        scenes.forEach(function (scene, si) {
            const imgPath = (scene.images && scene.images.length > 0) ? scene.images[0].path : '';
            html += '<div class="scene-item">';
            html += '<div class="scene-item-img">';
            if (imgPath) {
                html += '<img src="' + imgPath + '?t=' + Date.now() + '" alt="" onerror="this.style.display=\'none\'" />';
            } else {
                html += '<div class="scene-item-img-placeholder"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>';
            }
            html += '</div>';
            html += '<div class="scene-item-body">';
            html += '<div class="scene-item-info">';
            html += '<p class="scene-item-name">' + escapeHtml(scene.name_cn) + '</p>';
            html += '<p class="scene-item-name-jp">' + escapeHtml(scene.name_jp) + '</p>';
            html += '<div class="scene-product-tags" data-scene-name="' + escapeHtml(scene.name_cn) + '"><span class="scene-product-tags-loading">加载中...</span></div>';
            html += '</div>';
            html += '<div class="scene-item-actions">';
            html += '<button class="btn btn-secondary btn-xs" data-action="edit-scene" data-cat-idx="' + selectedSceneCatIdx + '" data-scene-idx="' + si + '">编辑</button>';
            html += '<button class="btn btn-danger btn-xs" data-action="delete-scene" data-cat-idx="' + selectedSceneCatIdx + '" data-scene-idx="' + si + '">删除</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;

        loadSceneProductTags(scenes);
    }

    function loadSceneProductTags(scenes) {
        scenes.forEach(function (scene, si) {
            const sceneName = scene.name_cn;
            const tagContainer = document.querySelector('.scene-product-tags[data-scene-name="' + CSS.escape(sceneName) + '"]');
            if (!tagContainer) return;

            fetch('/api/admin/scene-products?scene=' + encodeURIComponent(sceneName))
                .then(function (r) { return r.json(); })
                .then(function (result) {
                    if (!result.success) return;
                    const products = result.products || [];
                    if (products.length === 0) {
                        tagContainer.innerHTML = '<span class="scene-product-tag scene-product-tag-empty">暂无关联产品</span>';
                    } else {
                        let tagsHtml = '';
                        products.forEach(function (prodName) {
                            tagsHtml += '<span class="scene-product-tag">' + escapeHtml(prodName) + '</span>';
                        });
                        tagContainer.innerHTML = tagsHtml;
                    }
                })
                .catch(function () {
                    tagContainer.innerHTML = '<span class="scene-product-tag scene-product-tag-empty">加载失败</span>';
                });
        });
    }

    async function manageScenes() {
        currentModule = 'scene';
        selectedCatIdx = -1;
        selectedSubIdx = -1;
        selectedSceneCatIdx = -1;
        try {
            const result = await api('GET', '/api/admin/scenes');
            scenesData = result.data || [];
        } catch (e) {
            scenesData = [];
        }
        renderSidebar();
        renderMain();
    }

    function addSceneCategory() {
        const bodyHtml = '<div class="form-group"><label class="form-label">中文名称</label><input type="text" class="form-input" id="f-scene-cat-cn" placeholder="请输入场景分类中文名称" /></div><div class="form-group"><label class="form-label">日文名称</label><input type="text" class="form-input" id="f-scene-cat-jp" placeholder="请输入场景分类日文名称" /></div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveAddSceneCategory()">保存</button>';
        openModal('添加场景分类', bodyHtml, footerHtml);
        setTimeout(function () { document.getElementById('f-scene-cat-cn').focus(); }, 100);
    }

    async function saveAddSceneCategory() {
        const nameCn = document.getElementById('f-scene-cat-cn').value.trim();
        const nameJp = document.getElementById('f-scene-cat-jp').value.trim();
        if (!nameCn) { showToast('中文名称不能为空', 'error'); return; }
        try {
            const result = await api('POST', '/api/admin/scene-category', { name_cn: nameCn, name_jp: nameJp });
            scenesData = result.data || scenesData;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('添加成功', 'success');
        } catch (e) {
            showToast('添加失败: ' + e.message, 'error');
        }
    }

    function editSceneCategory(idx) {
        const cat = scenesData[idx];
        if (!cat) return;
        const bodyHtml = '<div class="form-group"><label class="form-label">中文名称</label><input type="text" class="form-input" id="f-scene-cat-cn" value="' + escapeHtml(cat.name_cn) + '" /></div><div class="form-group"><label class="form-label">日文名称</label><input type="text" class="form-input" id="f-scene-cat-jp" value="' + escapeHtml(cat.name_jp) + '" /></div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveEditSceneCategory(' + idx + ')">保存</button>';
        openModal('编辑场景分类', bodyHtml, footerHtml);
    }

    async function saveEditSceneCategory(idx) {
        const nameCn = document.getElementById('f-scene-cat-cn').value.trim();
        const nameJp = document.getElementById('f-scene-cat-jp').value.trim();
        if (!nameCn) { showToast('中文名称不能为空', 'error'); return; }
        try {
            const result = await api('PUT', '/api/admin/scene-category/' + idx, { name_cn: nameCn, name_jp: nameJp });
            scenesData = result.data || scenesData;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('修改成功', 'success');
        } catch (e) {
            showToast('修改失败: ' + e.message, 'error');
        }
    }

    function deleteSceneCategory(idx) {
        const cat = scenesData[idx];
        if (!cat) return;
        showConfirm('确定要删除场景分类"' + cat.name_cn + '"吗？该分类下的所有场景也将被删除，且不可恢复！', async function () {
            try {
                const result = await api('DELETE', '/api/admin/scene-category/' + idx);
                scenesData = result.data || scenesData;
                if (selectedSceneCatIdx === idx) { selectedSceneCatIdx = -1; }
                else if (selectedSceneCatIdx > idx) { selectedSceneCatIdx--; }
                renderSidebar();
                renderMain();
                showToast('删除成功', 'success');
            } catch (e) {
                showToast('删除失败: ' + e.message, 'error');
            }
        });
    }

    let _sceneAddedInUpload = false;

    function addScene(catIdx) {
        _sceneAddedInUpload = false;
        let bodyHtml = '<div class="form-group"><label class="form-label">中文名称</label><input type="text" class="form-input" id="f-scene-cn" placeholder="请输入场景中文名称" /></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">日文名称</label><input type="text" class="form-input" id="f-scene-jp" placeholder="请输入场景日文名称" /></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">场景图片（最多1张）</label><div class="upload-area" id="upload-area-scene"><input type="file" id="f-scene-image" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none" /><p class="upload-hint">点击或拖拽1张图片到此处上传</p><div id="upload-preview-scene" class="upload-preview"></div></div></div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveAddScene(' + catIdx + ')">保存</button>';
        openModal('添加场景', bodyHtml, footerHtml);
        initSceneImageUploadForAdd(catIdx);
        setTimeout(function () { document.getElementById('f-scene-cn').focus(); }, 100);
    }

    async function saveAddScene(catIdx) {
        const nameCn = document.getElementById('f-scene-cn').value.trim();
        const nameJp = document.getElementById('f-scene-jp').value.trim();
        if (!nameCn) { showToast('中文名称不能为空', 'error'); return; }
        try {
            if (!_sceneAddedInUpload) {
                const result = await api('POST', '/api/admin/scene-category/' + catIdx + '/scene', { name_cn: nameCn, name_jp: nameJp });
                scenesData = result.data || scenesData;
            }
            closeModal();
            renderSidebar();
            renderMain();
            showToast('添加成功', 'success');
        } catch (e) {
            showToast('添加失败: ' + e.message, 'error');
        }
    }

    function initSceneImageUploadForAdd(catIdx) {
        const area = document.getElementById('upload-area-scene');
        const input = document.getElementById('f-scene-image');
        const preview = document.getElementById('upload-preview-scene');
        if (!area || !input) return;

        const cat = scenesData[catIdx];

        area.addEventListener('click', function (e) {
            if (e.target.closest('.upload-thumb-remove')) return;
            input.click();
        });

        area.addEventListener('dragover', function (e) {
            e.preventDefault();
            area.classList.add('dragover');
        });
        area.addEventListener('dragleave', function () {
            area.classList.remove('dragover');
        });
        area.addEventListener('drop', function (e) {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        input.addEventListener('change', function () {
            if (input.files.length > 0) {
                handleFile(input.files[0]);
            }
            input.value = '';
        });

        async function handleFile(file) {
            const nameCn = document.getElementById('f-scene-cn').value.trim();
            if (!nameCn) {
                showToast('请先填写中文名称再上传图片', 'error');
                return;
            }
            try {
                const addResult = await api('POST', '/api/admin/scene-category/' + catIdx + '/scene', { name_cn: nameCn, name_jp: document.getElementById('f-scene-jp').value.trim() });
                scenesData = addResult.data || scenesData;
                _sceneAddedInUpload = true;

                const fd = new FormData();
                fd.append('file', file);
                fd.append('category_cn', cat.name_cn);
                fd.append('scene_cn', nameCn);
                const resp = await fetch('/api/admin/upload-scene-image', { method: 'POST', body: fd });
                const result = await resp.json();
                if (!result.success) throw new Error(result.error || '上传失败');

                preview.innerHTML = '';
                const thumb = document.createElement('div');
                thumb.className = 'upload-thumb';
                thumb.dataset.path = result.path;
                thumb.innerHTML = '<img src="' + result.path + '?t=' + Date.now() + '" alt="" /><button class="upload-thumb-remove" onclick="this.parentElement.remove()">&times;</button>';
                preview.appendChild(thumb);

                const refreshResult = await api('GET', '/api/admin/scenes');
                scenesData = refreshResult.data || scenesData;

                showToast('场景图片上传成功', 'success');
            } catch (e) {
                showToast('上传失败: ' + e.message, 'error');
            }
        }
    }

    let _sceneProducts = [];

    function editScene(catIdx, sceneIdx) {
        const cat = scenesData[catIdx];
        if (!cat) return;
        const scene = (cat.scenes || [])[sceneIdx];
        if (!scene) return;

        let bodyHtml = '<div class="form-tabs">';
        bodyHtml += '<button class="form-tab active" data-tab="scene-basic" onclick="ManageApp.switchTab(this, \'scene-basic\')">基本信息</button>';
        bodyHtml += '<button class="form-tab" data-tab="scene-products" onclick="ManageApp.switchTab(this, \'scene-products\')">关联产品</button>';
        bodyHtml += '</div>';

        bodyHtml += '<div class="form-tab-content" id="tab-scene-basic">';
        bodyHtml += '<div class="form-group"><label class="form-label">中文名称</label><input type="text" class="form-input" id="f-scene-cn" value="' + escapeHtml(scene.name_cn) + '" /></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">日文名称</label><input type="text" class="form-input" id="f-scene-jp" value="' + escapeHtml(scene.name_jp) + '" /></div>';
        bodyHtml += '<div class="form-group"><label class="form-label">场景图片（最多1张）</label><div class="upload-area" id="upload-area-scene"><input type="file" id="f-scene-image" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none" /><p class="upload-hint">点击或拖拽1张图片到此处上传</p><div id="upload-preview-scene" class="upload-preview"></div></div></div>';
        bodyHtml += '</div>';

        bodyHtml += '<div class="form-tab-content hidden" id="tab-scene-products">';
        bodyHtml += '<div id="scene-products-content"><p class="text-sm" style="color: var(--text-muted)">加载中...</p></div>';
        bodyHtml += '</div>';

        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveEditScene(' + catIdx + ',' + sceneIdx + ')">保存基本信息</button>';
        openModal('编辑场景 - ' + scene.name_cn, bodyHtml, footerHtml);
        initSceneImageUpload(catIdx, sceneIdx);
        loadSceneProducts(scene.name_cn);
    }

    async function saveEditScene(catIdx, sceneIdx) {
        const nameCn = document.getElementById('f-scene-cn').value.trim();
        const nameJp = document.getElementById('f-scene-jp').value.trim();
        if (!nameCn) { showToast('中文名称不能为空', 'error'); return; }
        try {
            const result = await api('PUT', '/api/admin/scene/' + catIdx + '/' + sceneIdx, { name_cn: nameCn, name_jp: nameJp });
            scenesData = result.data || scenesData;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('修改成功', 'success');
        } catch (e) {
            showToast('修改失败: ' + e.message, 'error');
        }
    }

    function initSceneImageUpload(catIdx, sceneIdx) {
        const area = document.getElementById('upload-area-scene');
        const input = document.getElementById('f-scene-image');
        const preview = document.getElementById('upload-preview-scene');
        if (!area || !input) return;

        const cat = scenesData[catIdx];
        const scene = (cat.scenes || [])[sceneIdx];

        if (scene && scene.images && scene.images.length > 0) {
            const img = scene.images[0];
            const thumb = document.createElement('div');
            thumb.className = 'upload-thumb';
            thumb.dataset.path = img.path;
            thumb.innerHTML = '<img src="' + img.path + '?t=' + Date.now() + '" alt="" /><button class="upload-thumb-remove" onclick="this.parentElement.remove()">&times;</button>';
            preview.appendChild(thumb);
        }

        area.addEventListener('click', function (e) {
            if (e.target.closest('.upload-thumb-remove')) return;
            input.click();
        });

        area.addEventListener('dragover', function (e) {
            e.preventDefault();
            area.classList.add('dragover');
        });
        area.addEventListener('dragleave', function () {
            area.classList.remove('dragover');
        });
        area.addEventListener('drop', function (e) {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        input.addEventListener('change', function () {
            if (input.files.length > 0) {
                handleFile(input.files[0]);
            }
            input.value = '';
        });

        async function handleFile(file) {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('category_cn', cat.name_cn);
            fd.append('scene_cn', scene.name_cn);
            try {
                const resp = await fetch('/api/admin/upload-scene-image', { method: 'POST', body: fd });
                const result = await resp.json();
                if (!result.success) throw new Error(result.error || '上传失败');

                preview.innerHTML = '';
                const thumb = document.createElement('div');
                thumb.className = 'upload-thumb';
                thumb.dataset.path = result.path;
                thumb.innerHTML = '<img src="' + result.path + '?t=' + Date.now() + '" alt="" /><button class="upload-thumb-remove" onclick="this.parentElement.remove()">&times;</button>';
                preview.appendChild(thumb);

                const refreshResult = await api('GET', '/api/admin/scenes');
                scenesData = refreshResult.data || scenesData;

                showToast('场景图片上传成功', 'success');
            } catch (e) {
                showToast('上传失败: ' + e.message, 'error');
            }
        }
    }

    function deleteScene(catIdx, sceneIdx) {
        const cat = scenesData[catIdx];
        if (!cat) return;
        const scene = (cat.scenes || [])[sceneIdx];
        if (!scene) return;
        showConfirm('确定要删除场景"' + scene.name_cn + '"吗？相关图片也将被删除，且不可恢复！', async function () {
            try {
                const result = await api('DELETE', '/api/admin/scene/' + catIdx + '/' + sceneIdx);
                scenesData = result.data || scenesData;
                renderSidebar();
                renderMain();
                showToast('删除成功', 'success');
            } catch (e) {
                showToast('删除失败: ' + e.message, 'error');
            }
        });
    }

    function sortScenes(catIdx) {
        const cat = scenesData[catIdx];
        if (!cat || !cat.scenes || cat.scenes.length < 2) { showToast('至少需要2个场景才能排序', 'info'); return; }
        const items = cat.scenes.map(function (scene, si) { return { idx: si, name: scene.name_cn }; });
        let bodyHtml = '<p class="text-sm mb-3" style="color: var(--text-muted)">拖拽调整场景顺序</p><div class="sort-list" id="sort-list">';
        items.forEach(function (item) {
            bodyHtml += '<div class="sort-item" draggable="true" data-idx="' + item.idx + '"><svg class="w-4 h-4 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg><span>' + escapeHtml(item.name) + '</span></div>';
        });
        bodyHtml += '</div>';
        const footerHtml = '<button class="btn btn-secondary" onclick="ManageApp.closeModal()">取消</button><button class="btn btn-primary" onclick="ManageApp.saveSortScenes(' + catIdx + ')">保存排序</button>';
        openModal('排序场景', bodyHtml, footerHtml);
        initSortList();
    }

    async function saveSortScenes(catIdx) {
        const list = document.getElementById('sort-list');
        const items = list.querySelectorAll('.sort-item');
        const order = [];
        items.forEach(function (item) { order.push(parseInt(item.dataset.idx)); });
        try {
            const result = await api('PUT', '/api/admin/scene-category/' + catIdx + '/scenes/sort', { order: order });
            scenesData = result.data || scenesData;
            closeModal();
            renderSidebar();
            renderMain();
            showToast('排序成功', 'success');
        } catch (e) {
            showToast('排序失败: ' + e.message, 'error');
        }
    }

    async function loadSceneProducts(sceneName) {
        const container = document.getElementById('scene-products-content');
        if (!container) return;
        try {
            const result = await api('GET', '/api/admin/scene-products?scene=' + encodeURIComponent(sceneName));
            _sceneProducts = result.products || [];
            renderSceneProductsEditor(sceneName);
        } catch (e) {
            console.error('loadSceneProducts error:', e);
            container.innerHTML = '<p class="text-sm" style="color: var(--error-color)">加载关联产品失败: ' + escapeHtml(e.message) + '</p>';
        }
    }

    function renderSceneProductsEditor(sceneName) {
        const container = document.getElementById('scene-products-content');
        if (!container) return;

        let html = '<div class="form-group"><label class="form-label">已关联产品</label>';
        if (_sceneProducts.length === 0) {
            html += '<p class="text-sm" style="color: var(--text-muted)">暂无关联产品</p>';
        } else {
            html += '<div class="sort-list" id="scene-products-list">';
            _sceneProducts.forEach(function (prodName, idx) {
                html += '<div class="sort-item scene-product-item" data-prod-idx="' + idx + '">';
                html += '<svg class="w-4 h-4 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>';
                html += '<span class="product-scene-name">' + escapeHtml(prodName) + '</span>';
                html += '<div class="product-scene-actions">';
                html += '<button class="btn btn-xs btn-secondary" data-action="move-scene-product-up" data-prod-idx="' + idx + '"' + (idx === 0 ? ' disabled' : '') + '>↑</button>';
                html += '<button class="btn btn-xs btn-secondary" data-action="move-scene-product-down" data-prod-idx="' + idx + '"' + (idx === _sceneProducts.length - 1 ? ' disabled' : '') + '>↓</button>';
                html += '<button class="btn btn-xs btn-danger" data-action="remove-scene-product" data-prod-idx="' + idx + '">删除</button>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div>';

        html += '<div class="form-group"><label class="form-label">添加产品</label>';
        html += '<div style="display:flex;gap:8px;align-items:center;">';
        html += '<select class="form-input" id="f-scene-product-select" style="flex:1;">';
        html += '<option value="">-- 请选择产品 --</option>';
        data.forEach(function (cat) {
            const availableProducts = [];
            (cat.children || []).forEach(function (sub) {
                (sub.products || []).forEach(function (p) {
                    if (_sceneProducts.indexOf(p.name_cn) < 0) {
                        availableProducts.push({ name: p.name_cn, sub: sub.name_cn });
                    }
                });
            });
            if (availableProducts.length > 0) {
                html += '<optgroup label="' + escapeHtml(cat.name_cn) + '">';
                availableProducts.forEach(function (p) {
                    html += '<option value="' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + '（' + escapeHtml(p.sub) + '）</option>';
                });
                html += '</optgroup>';
            }
        });
        html += '</select>';
        html += '<button class="btn btn-primary btn-sm" data-action="add-scene-product">添加</button>';
        html += '</div></div>';

        html += '<div class="form-group" style="margin-top:16px;">';
        html += '<button class="btn btn-primary" data-action="save-scene-products" data-scene="' + escapeHtml(sceneName) + '">保存产品关联</button>';
        html += '</div>';

        container.innerHTML = html;
        initSceneProductsDragSort();
    }

    function initSceneProductsDragSort() {
        const list = document.getElementById('scene-products-list');
        if (!list) return;
        let dragItem = null;

        list.addEventListener('dragstart', function (e) {
            dragItem = e.target.closest('.scene-product-item');
            if (dragItem) {
                dragItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        list.addEventListener('dragend', function () {
            if (dragItem) {
                dragItem.classList.remove('dragging');
                const items = Array.from(list.querySelectorAll('.scene-product-item'));
                const newOrder = [];
                items.forEach(function (item) {
                    const idx = parseInt(item.dataset.prodIdx);
                    if (!isNaN(idx) && idx >= 0 && idx < _sceneProducts.length) {
                        newOrder.push(_sceneProducts[idx]);
                    }
                });
                if (newOrder.length === _sceneProducts.length) {
                    _sceneProducts = newOrder;
                }
                dragItem = null;
                const sceneEl = document.querySelector('#scene-products-content [data-scene]');
                const sceneName = sceneEl ? sceneEl.dataset.scene : '';
                renderSceneProductsEditor(sceneName);
            }
        });

        list.addEventListener('dragover', function (e) {
            e.preventDefault();
            const target = e.target.closest('.scene-product-item');
            if (!target || target === dragItem) return;
            const items = Array.from(list.querySelectorAll('.scene-product-item'));
            const dragIdx = items.indexOf(dragItem);
            const targetIdx = items.indexOf(target);
            if (dragIdx < targetIdx) {
                target.parentNode.insertBefore(dragItem, target.nextSibling);
            } else {
                target.parentNode.insertBefore(dragItem, target);
            }
        });
    }

    function addSceneProduct() {
        const select = document.getElementById('f-scene-product-select');
        if (!select) return;
        const prodName = select.value;
        if (!prodName) { showToast('请选择一个产品', 'error'); return; }
        if (_sceneProducts.indexOf(prodName) >= 0) { showToast('该产品已关联', 'error'); return; }
        _sceneProducts.push(prodName);
        const sceneEl = document.querySelector('#scene-products-content [data-scene]');
        const sceneName = sceneEl ? sceneEl.dataset.scene : '';
        renderSceneProductsEditor(sceneName);
        showToast('已添加产品', 'success');
    }

    function removeSceneProduct(idx) {
        if (idx < 0 || idx >= _sceneProducts.length) return;
        _sceneProducts.splice(idx, 1);
        const sceneEl = document.querySelector('#scene-products-content [data-scene]');
        const sceneName = sceneEl ? sceneEl.dataset.scene : '';
        renderSceneProductsEditor(sceneName);
    }

    function moveSceneProductUp(idx) {
        if (idx <= 0 || idx >= _sceneProducts.length) return;
        const temp = _sceneProducts[idx];
        _sceneProducts[idx] = _sceneProducts[idx - 1];
        _sceneProducts[idx - 1] = temp;
        const sceneEl = document.querySelector('#scene-products-content [data-scene]');
        const sceneName = sceneEl ? sceneEl.dataset.scene : '';
        renderSceneProductsEditor(sceneName);
    }

    function moveSceneProductDown(idx) {
        if (idx < 0 || idx >= _sceneProducts.length - 1) return;
        const temp = _sceneProducts[idx];
        _sceneProducts[idx] = _sceneProducts[idx + 1];
        _sceneProducts[idx + 1] = temp;
        const sceneEl = document.querySelector('#scene-products-content [data-scene]');
        const sceneName = sceneEl ? sceneEl.dataset.scene : '';
        renderSceneProductsEditor(sceneName);
    }

    async function saveSceneProducts(sceneName) {
        if (!sceneName) { showToast('场景名称无效', 'error'); return; }
        try {
            await api('PUT', '/api/admin/scene-products', { scene: sceneName, products: _sceneProducts });
            showToast('产品关联保存成功', 'success');
            renderMain();
        } catch (e) {
            showToast('保存失败: ' + e.message, 'error');
        }
    }

    function uploadSceneImage(catIdx, sceneIdx) {
        const cat = scenesData[catIdx];
        if (!cat) return;
        const scene = (cat.scenes || [])[sceneIdx];
        if (!scene) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/gif,image/webp';
        input.addEventListener('change', async function () {
            if (input.files.length === 0) return;
            const file = input.files[0];
            const fd = new FormData();
            fd.append('file', file);
            fd.append('category_cn', cat.name_cn);
            fd.append('scene_cn', scene.name_cn);
            try {
                const resp = await fetch('/api/admin/upload-scene-image', { method: 'POST', body: fd });
                const result = await resp.json();
                if (!result.success) {
                    throw new Error(result.error || '上传失败');
                }
                showToast('场景图片上传成功', 'success');
                const refreshResult = await api('GET', '/api/admin/scenes');
                scenesData = refreshResult.data || scenesData;
                renderSidebar();
                renderMain();
            } catch (e) {
                showToast('上传失败: ' + e.message, 'error');
            }
        });
        input.click();
    }

    function handleGlobalClick(e) {
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;

        const action = actionEl.dataset.action;
        const cat = parseInt(actionEl.dataset.cat);
        const sub = parseInt(actionEl.dataset.sub);
        const prod = parseInt(actionEl.dataset.prod);
        const idx = parseInt(actionEl.dataset.idx);
        const catIdx = parseInt(actionEl.dataset.catIdx);
        const sceneIdx = parseInt(actionEl.dataset.sceneIdx);
        const sceneIdxAttr = parseInt(actionEl.dataset.sceneIdx);

        switch (action) {
            case 'select-cat':
                if (selectedCatIdx === cat) {
                    selectedCatIdx = -1;
                    selectedSubIdx = -1;
                } else {
                    selectedCatIdx = cat;
                    selectedSubIdx = -1;
                }
                renderSidebar();
                renderMain();
                break;
            case 'select-sub':
                selectedCatIdx = cat;
                selectedSubIdx = sub;
                renderSidebar();
                renderMain();
                break;
            case 'edit-cat':
                e.stopPropagation();
                editCategory(cat);
                break;
            case 'delete-cat':
                e.stopPropagation();
                deleteCategory(cat);
                break;
            case 'add-sub':
                addSubcategory(cat);
                break;
            case 'edit-sub':
                e.stopPropagation();
                editSubcategory(cat, sub);
                break;
            case 'delete-sub':
                e.stopPropagation();
                deleteSubcategory(cat, sub);
                break;
            case 'add-product':
                addProduct(cat, sub);
                break;
            case 'edit-product':
                editProduct(cat, sub, prod);
                break;
            case 'delete-product':
                deleteProduct(cat, sub, prod);
                break;
            case 'sort-cat':
                sortSubcategories(cat);
                break;
            case 'sort-products':
                sortProducts(cat, sub);
                break;
            case 'home':
                selectedCatIdx = -1;
                selectedSubIdx = -1;
                selectedSceneCatIdx = -1;
                renderSidebar();
                renderMain();
                break;
            case 'manage-scenes':
                manageScenes();
                break;
            case 'switch-module':
                const mod = actionEl.dataset.module || 'product';
                switchModule(mod);
                break;
            case 'select-scene-category':
                selectedSceneCatIdx = parseInt(actionEl.dataset.idx);
                renderSidebar();
                renderMain();
                break;
            case 'add-scene-category':
                addSceneCategory();
                break;
            case 'edit-scene-category':
                editSceneCategory(idx);
                break;
            case 'delete-scene-category':
                deleteSceneCategory(idx);
                break;
            case 'add-scene':
                addScene(catIdx);
                break;
            case 'edit-scene':
                editScene(catIdx, sceneIdx);
                break;
            case 'delete-scene':
                deleteScene(catIdx, sceneIdx);
                break;
            case 'sort-scenes':
                sortScenes(catIdx);
                break;
            case 'upload-scene-image':
                uploadSceneImage(catIdx, sceneIdx);
                break;
            case 'add-scene-product':
                addSceneProduct();
                break;
            case 'remove-scene-product':
                removeSceneProduct(parseInt(actionEl.dataset.prodIdx));
                break;
            case 'move-scene-product-up':
                moveSceneProductUp(parseInt(actionEl.dataset.prodIdx));
                break;
            case 'move-scene-product-down':
                moveSceneProductDown(parseInt(actionEl.dataset.prodIdx));
                break;
            case 'save-scene-products':
                saveSceneProducts(actionEl.dataset.scene);
                break;
            case 'add-product-scene':
                addProductScene();
                break;
            case 'remove-product-scene':
                removeProductScene(sceneIdxAttr);
                break;
            case 'save-product-scenes':
                const prodName = actionEl.dataset.product;
                saveProductScenes(prodName);
                break;
            case 'move-product-scene-up':
                moveProductSceneUp(sceneIdxAttr);
                break;
            case 'move-product-scene-down':
                moveProductSceneDown(sceneIdxAttr);
                break;
        }
    }

    function init() {
        document.addEventListener('click', handleGlobalClick);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeModal();
                closeConfirm();
            }
        });

        loadData();
    }

    return {
        init: init,
        addCategory: addCategory,
        saveAddCategory: saveAddCategory,
        saveEditCategory: saveEditCategory,
        saveAddSubcategory: saveAddSubcategory,
        saveEditSubcategory: saveEditSubcategory,
        saveAddProduct: saveAddProduct,
        saveEditProduct: saveEditProduct,
        saveSortSubcategories: saveSortSubcategories,
        saveSortProducts: saveSortProducts,
        saveDescription: saveDescription,
        switchTab: switchTab,
        switchDescLang: switchDescLang,
        closeModal: closeModal,
        closeConfirm: closeConfirm,
        doConfirm: doConfirm,
        manageScenes: manageScenes,
        switchModule: switchModule,
        addSceneCategory: addSceneCategory,
        saveAddSceneCategory: saveAddSceneCategory,
        saveEditSceneCategory: saveEditSceneCategory,
        addScene: addScene,
        saveAddScene: saveAddScene,
        saveEditScene: saveEditScene,
        sortScenes: sortScenes,
        saveSortScenes: saveSortScenes,
        uploadSceneImage: uploadSceneImage,
        addProductScene: addProductScene,
        removeProductScene: removeProductScene,
        moveProductSceneUp: moveProductSceneUp,
        moveProductSceneDown: moveProductSceneDown,
        saveProductScenes: saveProductScenes,
        addSceneProduct: addSceneProduct,
        removeSceneProduct: removeSceneProduct,
        moveSceneProductUp: moveSceneProductUp,
        moveSceneProductDown: moveSceneProductDown,
        saveSceneProducts: saveSceneProducts
    };
})();

document.addEventListener('DOMContentLoaded', function () {
    ManageApp.init();
});
