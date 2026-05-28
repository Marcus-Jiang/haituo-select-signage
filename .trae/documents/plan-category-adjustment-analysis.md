# 分析：管理后台调整产品分类时的同步行为

> 分析时间：2026-05-12

## 问题

在管理页面调整产品分类时，是否会同步修改 `data.json`，并修改 `images/`、`details/` 等目录？

## 分析方法

阅读后端 `app.py` 中与"调整分类"相关的所有 API 端点，以及前端 `manage.js` 的交互逻辑。

---

## 一、"调整分类"包含哪些操作？

在管理后台中，"调整产品分类"可以指以下几种不同操作：

| 操作 | 前端入口 | 后端 API |
|------|---------|---------|
| **重命名一级分类** | 侧边栏分类树 → 编辑按钮 | `PUT /api/admin/category/<idx>` |
| **重命名子分类** | 侧边栏分类树 → 编辑按钮 | `PUT /api/admin/subcategory/<idx>/<sub_idx>` |
| **重命名产品** | 产品列表 → 编辑按钮 → 基本信息标签页 | `PUT /api/admin/product/<idx>/<sub_idx>/<prod_idx>` |
| **排序一级分类** | 暂未提供前端入口（API 存在） | `PUT /api/admin/categories/sort` |
| **排序子分类** | 子分类列表 → 排序按钮 | `PUT /api/admin/category/<idx>/subcategories/sort` |
| **排序产品** | 产品列表 → 排序按钮 | `PUT /api/admin/subcategory/<idx>/<sub_idx>/products/sort` |
| **将产品移动到其他分类** | **不存在该功能** | **无对应 API** |
| **将子分类移动到其他一级分类** | **不存在该功能** | **无对应 API** |

---

## 二、各操作的同步行为详细分析

### 2.1 重命名一级分类 ✅ 同步

**API**: [`admin_update_category`](file:///e:/Haituo/haituo_select_signage/app.py#L241) (`PUT /api/admin/category/<idx>`)

当一级分类名称变更时，自动执行：

1. **更新 `data.json`** — 修改一级分类的 `name_cn`/`name_jp`
2. **重命名 `images/` 目录** — 将 `images/{旧名}/` 整个目录重命名为 `images/{新名}/`
   - 若目标目录已存在，则逐个移动文件
3. **重命名 `details/` 目录** — 将 `details/{旧名}/` 整个目录重命名为 `details/{新名}/`
   - 若目标目录已存在，则逐个移动文件
4. **更新 `data.json` 中的图片路径** — 遍历该分类下所有产品的图片路径，将 `images/{旧名}/` 替换为 `images/{新名}/`

> **注意**：不更新 `scenes_mapping.json`（因为 scenes_mapping 只关联产品名，不关联分类名）

### 2.2 重命名子分类 ✅ 同步

**API**: [`admin_update_subcategory`](file:///e:/Haituo/haituo_select_signage/app.py#L429) (`PUT /api/admin/subcategory/<idx>/<sub_idx>`)

当子分类名称变更时，自动执行：

1. **更新 `data.json`** — 修改子分类的 `name_cn`/`name_jp`
2. **重命名 `images/` 子目录** — 将 `images/{一级分类}/{旧名}/` 整个目录重命名为 `images/{一级分类}/{新名}/`
3. **重命名 `details/` 子目录** — 将 `details/{一级分类}/{旧名}/` 整个目录重命名为 `details/{一级分类}/{新名}/`
4. **更新 `data.json` 中的图片路径** — 遍历该子分类下所有产品的图片路径，将 `images/{分类}/{旧名}/` 替换为 `images/{分类}/{新名}/`

### 2.3 重命名产品 ✅ 同步

**API**: [`admin_update_product`](file:///e:/Haituo/haituo_select_signage/app.py#L565) (`PUT /api/admin/product/<idx>/<sub_idx>/<prod_idx>`)

当产品名称变更时，自动执行：

1. **更新 `data.json`** — 修改产品的 `name_cn`/`name_jp` 和 `images` 数组
2. **重命名 `details/` 文件** — 遍历 `details/{分类}/{子分类}/` 目录，重命名所有以旧产品名开头的文件（如 `{旧名}.webp`、`{旧名}_cn.md`、`{旧名}_jp.md`）
3. **重命名 `images/` 文件** — 遍历 `images/{分类}/{子分类}/` 目录，重命名以旧产品名开头的图片文件
4. **更新 `data.json` 中的图片路径** — 将图片路径中的旧产品名替换为新名
5. **更新 `scenes_mapping.json`** — 调用 `rename_product_in_mapping` 将 `productname` 从旧名更新为新名
6. **清除 `_detail_cache`** — 移除旧文件名的缓存条目

### 2.4 排序操作 ❌ 仅更新 data.json

三种排序 API 的同步行为**完全一致**：

```python
# 以子分类排序为例
new_data = [data[i] for i in order]
save_data(new_data)
# → 仅保存 data.json，不涉及任何文件操作
```

| 排序 API | 同步 data.json | 重命名目录/文件 |
|---------|:---:|:---:|
| `categories/sort` | ✅ | ❌ |
| `subcategories/sort` | ✅ | ❌ |
| `products/sort` | ✅ | ❌ |

> 排序只是改变数组元素的顺序，分类/产品的名称没有变化，因此文件名和路径都保持不变，不需要同步文件。

### 2.5 跨分类移动 ❌ 不支持

目前**没有任何 API** 支持以下操作：

- 将一个产品从子分类 A 移动到子分类 B
- 将一个子分类从一级分类 A 移动到一级分类 B
- 在拖拽排序中跨分类/跨层级拖拽

前端 `manage.js` 的拖拽排序逻辑中也明确做了**同级限制**（`DragSort.canDrop()` 检查是否同级），不允许跨分类拖拽。

---

## 三、结论汇总

| 操作类型 | 更新 data.json | 更新 images/ 目录 | 更新 details/ 目录 | 更新 scenes_mapping.json |
|---------|:---:|:---:|:---:|:---:|
| 重命名一级分类 | ✅ | ✅ 重命名目录 | ✅ 重命名目录 | ❌（不涉及） |
| 重命名子分类 | ✅ | ✅ 重命名子目录 | ✅ 重命名子目录 | ❌（不涉及） |
| 重命名产品 | ✅ | ✅ 重命名文件 | ✅ 重命名文件 | ✅ 更新 productname |
| 排序一级分类 | ✅ | ❌ | ❌ | ❌ |
| 排序子分类 | ✅ | ❌ | ❌ | ❌ |
| 排序产品 | ✅ | ❌ | ❌ | ❌ |
| **跨分类移动产品** | **❌ 不支持** | **❌ 不支持** | **❌ 不支持** | **❌ 不支持** |

### 关键结论

1. **重命名操作（编辑名称）**：✅ 会同步修改 `data.json`、`images/` 目录和 `details/` 目录，产品重命名还会同步 `scenes_mapping.json`
2. **排序操作（调整顺序）**：✅ 会修改 `data.json`，但**不需要**修改目录文件（因为名称不变，路径不变）
3. **跨分类移动产品/子分类**：❌ **当前不支持**，没有对应的 API 和前端功能