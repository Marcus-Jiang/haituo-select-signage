# 海拓選品 - 项目架构文档

> 文档版本: 6.0
> 最后更新: 2026-05-27
> 项目类型: 中日贸易选品展示网站 + 选品管理后台

***

## 目录

1. [技术栈概览](#1-技术栈概览)
2. [目录结构说明](#2-目录结构说明)
3. [页面与路由](#3-页面与路由)
4. [模块化架构](#4-模块化架构)
5. [核心模块说明](#5-核心模块说明)
6. [后端 API 接口](#6-后端-api-接口)
7. [数据请求与状态管理](#7-数据请求与状态管理)
8. [数据存储架构](#8-数据存储架构)
9. [场景幻灯片 — 交互说明](#9-场景幻灯片--交互说明)
10. [管理后台功能详情](#10-管理后台功能详情)
11. [开发规范](#11-开发规范)
12. [打包发布](#12-打包发布)

***

## 1. 技术栈概览

### 前端技术栈

| 技术                       | 说明   | 使用方式                                  |
| ------------------------ | ---- | ------------------------------------- |
| **HTML5**                | 页面结构 | index.html + manage.html + scene.html |
| **Tailwind CSS 3.x**     | 样式框架 | CDN引入 (`https://cdn.tailwindcss.com`) |
| **原生 JavaScript (ES6+)** | 交互逻辑 | 模块化结构（js/ 目录）                     |
| **marked.js**            | Markdown 渲染 | CDN引入 (`https://cdn.jsdelivr.net/npm/marked/marked.min.js`)，用于详情弹窗渲染 MD 描述 |
| **CSS**                  | 样式表 | css/styles.css + css/manage.css          |
| **JSON**                 | 数据格式 | data.json + scenes.json + scenes_mapping.json |

### 后端/构建工具

| 技术              | 说明     | 用途                  |
| --------------- | ------ | ------------------- |
| **Python 3.9**  | 服务器运行时  | app.py 提供 HTTP 服务（Docker 容器内运行） |
| **Flask**       | Web 框架 | 提供 REST API 接口      |
| **Pillow**      | 图像处理库 | 上传图片自动转换为 WebP 格式 |

### 部署工具

| 技术              | 说明     | 用途                  |
| --------------- | ------ | ------------------- |
| **Docker**      | 容器化部署 | Dockerfile + docker-compose.yml |
| **docker-compose** | 编排工具 | 定义服务、端口映射、卷挂载 |

### 设计特点

* ✅ **Docker 容器化部署**: 通过 Docker 容器运行，无需本地 Python 环境
* ✅ **单页应用 (SPA)**: 无刷新切换
* ✅ **模块化架构**: 代码清晰易维护
* ✅ **日语优先**: 默认语言为日语，符合目标用户
* ✅ **管理后台**: 可视化管理产品和分类（独立入口 /manage.html）
* ✅ **描述外置**: 产品图片描述存储在独立 MD 文件中，data.json 仅存结构数据
* ✅ **详情图片**: 产品图片可上传至 details/ 目录，优先于 images/ 目录显示
* ✅ **WebP 自动转换**: 上传图片自动转换为 WebP 格式（Pillow 实现）
* ✅ **安全防护**: 路径遍历攻击防护、XSS 防护、静态文件访问控制
* ✅ **场景幻灯片**: 产品使用场景在新标签页中独立展示
* ✅ **无障碍回退**: 无场景产品提供返回按钮，确保不会困在空白页面

***

## 2. 目录结构说明

```
haituo_select_signage/
├── .trae/                              # IDE 配置目录
│   ├── documents/
│   │   └── PROJECT_ARCHITECTURE.md     # 本文档
│   └── specs/                          # 功能规格说明
│
├── css/                                # 样式目录
│   ├── styles.css                      # 主页样式 + 场景页样式
│   └── manage.css                      # 管理后台样式
│
├── js/                                 # JavaScript 模块目录
│   ├── utils.js                        # 工具函数模块（展示页 + 管理页共享）
│   ├── i18n.js                         # 国际化模块（展示页 + 场景页使用）
│   ├── state.js                        # 展示页状态管理模块
│   ├── api.js                          # 展示页 + 场景页 API 调用模块
│   ├── dataService.js                  # 展示页数据服务模块
│   ├── index.js                        # 主页渲染与交互逻辑
│   ├── scene.js                        # 场景页幻灯片逻辑（依赖 api.js + i18n.js）
│   └── manage.js                       # 管理后台逻辑（自包含闭包模块，仅依赖 utils.js）
│
├── images/                             # 产品原始图片目录
│   └── {一级分类}/{子分类}/             # 按分类层级存储
│       └── {产品名}.webp               # 产品图片文件（WebP 格式）
│
├── details/                            # 产品详情目录（描述文档 + 详情图片）
│   └── {一级分类}/{子分类}/             # 与 images 目录结构镜像
│       ├── {产品名}_cn.md              # 中文描述
│       ├── {产品名}_jp.md              # 日文描述
│       └── {产品名}.webp               # 详情图片（优先于 images/ 显示）
│
├── scenes/                            # 场景图目录
│   └── {场景分类}/                     # 按场景类型分目录
│       └── {场景名}.webp               # 场景图片文件
│
├── index.html                          # 【核心】主页面文件（展示页）
├── scene.html                          # 【核心】场景展示页（新标签页打开）
├── manage.html                         # 【核心】管理后台页面（隐式入口）
├── data.json                           # 【核心】产品数据文件（不含描述）
├── scenes_mapping.json                 # 产品-场景映射关系
├── scenes.json                         # 场景数据
├── logo1.png                           # 【核心】公司 Logo
│
├── app.py                              # Python Flask 服务器
├── requirements.txt                    # Python 依赖（Flask, Pillow）
├── Dockerfile                          # Docker 镜像构建文件
├── docker-compose.yml                  # Docker Compose 编排配置
└── start_server.bat                    # Windows 本地启动脚本（备用）
```

### 文件重要性说明

| 文件                        | 重要性   | 说明                       |
| ------------------------- | ----- | ------------------------ |
| `index.html`              | ⭐⭐⭐⭐⭐ | **前端展示页**                 |
| `scene.html`              | ⭐⭐⭐⭐  | **场景独立展示页**（新标签页打开）    |
| `manage.html`             | ⭐⭐⭐⭐⭐ | **管理后台页**（独立入口）          |
| `data.json`               | ⭐⭐⭐⭐⭐ | **数据源**（不含描述字段）           |
| `details/`                | ⭐⭐⭐⭐⭐ | **描述文件目录**（与 images 镜像结构） |
| `js/manage.js`            | ⭐⭐⭐⭐⭐ | **管理页核心逻辑** - 自包含闭包，含全部 CRUD、渲染、拖拽排序 |
| `js/index.js`             | ⭐⭐⭐⭐  | **主页主逻辑** - UI 渲染和交互   |
| `js/scene.js`             | ⭐⭐⭐⭐  | **场景页逻辑** - 幻灯片和导航    |
| `css/styles.css`          | ⭐⭐⭐⭐  | **主页+场景页样式** - CSS 变量和动画 |
| `css/manage.css`          | ⭐⭐⭐⭐  | **管理后台样式** - 管理页专用样式   |
| `js/dataService.js`       | ⭐⭐⭐   | **展示页数据服务层** - 数据加载和产品收集 |
| `js/state.js`             | ⭐⭐⭐   | **展示页状态管理** - 管理主页导航状态 |
| `js/api.js`               | ⭐⭐⭐   | **展示页+场景页 API 调用层** - 封装 HTTP 请求 |
| `js/utils.js`             | ⭐⭐⭐   | **工具函数** - Toast、HTML转义、分类路径、占位图 |
| `js/i18n.js`              | ⭐⭐⭐   | **国际化** - 中日双语支持         |
| `app.py`                  | ⭐⭐⭐⭐  | Flask 服务器（含主页 API + 管理 API） |
| `Dockerfile`              | ⭐⭐⭐⭐  | Docker 镜像构建配置            |
| `docker-compose.yml`      | ⭐⭐⭐⭐  | Docker Compose 编排配置       |
| `requirements.txt`        | ⭐⭐⭐   | Python 依赖声明              |

***

## 3. 页面与路由

### 3.1 前端页面

| 路由 | 文件 | 说明 |
|------|------|------|
| `/` | `index.html` | 产品列表主页 |
| `/scene.html?key=&name_cn=&name_jp=&lang=` | `scene.html` | 场景幻灯片展示页（新标签页打开） |
| `/manage.html` | `manage.html` | 管理后台 |

### 3.2 静态文件路由

| 路由 | 目录 | 说明 |
|------|------|------|
| `/` | `.` | 返回 index.html |
| `/scene.html` | `.` | 返回场景展示页 |
| `/manage.html` | `.` | 返回管理页面 |
| `/css/<filename>` | `css/` | CSS 文件 |
| `/js/<filename>` | `js/` | JS 文件 |
| `/images/<filename>` | `images/` | 产品图片 |
| `/details/<filename>` | `details/` | 详情图片和描述文件（全部可访问） |
| `/scenes/<filename>` | `scenes/` | 场景图 |
| `/<filename>` | `.` | 根目录文件（允许图片、html、json 扩展名） |
| `/favicon.ico` | `.` | 使用 logo1.png 作为 favicon |

> **注意**: `details/` 目录中的所有文件（包括 MD 描述文件和图片文件）均可通过 HTTP 直接访问。MD 描述文件也可通过 `/api/detail` 接口读取（带缓存）。

### 3.3 场景页 URL 格式

```
scene.html?key={产品key}&name_cn={中文名}&name_jp={日文名}&lang={jp/cn}
```

参数通过 `window.open(url, '_blank')` 传递，在新标签页中打开。

***

## 4. 模块化架构

### 4.1 架构特点

项目采用**展示页/管理页双轨架构**：

- **展示页**（index.html）：使用轻量级模块化结构，`utils.js → i18n.js → state.js → api.js → dataService.js → index.js` 逐层依赖，职责清晰
- **场景页**（scene.html）：使用 `api.js → i18n.js → scene.js` 依赖链，通过 URL 参数接收产品信息，不依赖 `state.js` 或 `dataService.js`
- **管理页**（manage.html）：使用自包含闭包模块 `ManageApp`，内部封装全部 API 调用、状态管理、渲染逻辑和拖拽排序，仅依赖 `utils.js` 中的全局函数

### 4.2 模块依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│           index.html / manage.html / scene.html              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     css/styles.css / manage.css              │
│              (CSS 变量、动画、通用样式、拖拽样式)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        JS 模块                                │
│                                                              │
│  ┌─── index.html 加载 ───────────────────────────────────┐  │
│  │  utils.js → i18n.js → state.js → api.js               │  │
│  │           → dataService.js → index.js                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── scene.html 加载 ───────────────────────────────────┐  │
│  │  api.js → i18n.js → scene.js                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── manage.html 加载 ──────────────────────────────────┐  │
│  │  utils.js → manage.js                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               manage.js (ManageApp)                   │   │
│  │  自包含闭包模块，内部封装：                              │   │
│  │  - 局部 api() 函数（直接调用 fetch）                    │   │
│  │  - 局部状态变量（data, selectedCatIdx 等）              │   │
│  │  - 全部 CRUD、渲染、拖拽排序逻辑                        │   │
│  │  仅依赖 utils.js (showToast, escapeHtml)              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        app.py                                │
│         (Flask 服务器 - 主页 API + 管理 API)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│       data.json          │  │        details/               │
│   (产品结构数据)           │  │   (MD描述文件 + 详情图片)       │
└──────────────────────────┘  └──────────────────────────────┘
```

### 4.3 模块职责划分

| 模块 | 职责 | 主要功能 |
|------|------|----------|
| **utils.js** | 展示页+管理页工具函数 | showToast, escapeHtml, buildCategoryPath, getImagePlaceholderSvg |
| **i18n.js** | 国际化 | t(), 语言切换, 翻译文本管理, 语言按钮样式更新 |
| **state.js** | 展示页状态管理 | AppState 对象, 管理主页导航状态（当前分类、语言） |
| **api.js** | 展示页+场景页 API 调用 | getData, getScenes, getMapping, getDetail |
| **dataService.js** | 展示页数据服务 | loadData, collectAllLevel2Items, collectDisplayProducts |
| **index.js** | 主页逻辑 | IndexRenderer（渲染）+ IndexController（控制） |
| **scene.js** | 场景页逻辑 | ScenePage 独立模块（幻灯片切换、导航、语言切换、返回逻辑） |
| **manage.js** | 管理页逻辑 | ManageApp 闭包模块（含全部 CRUD、侧边栏/主内容渲染、模态框管理、拖拽排序、场景管理） |
| **app.py** | 后端服务 | Flask 服务器, 主页 REST API, 管理后台 API, 静态文件服务, WebP 自动转换, 安全防护 |

### 4.4 设计模式

**展示页（列表页）** — **MVC-like**，分离渲染（Renderer）与控制（Controller）：

- **IndexRenderer** — 负责 DOM 渲染（renderBreadcrumb, renderCategoryNav, renderProductGrid, openDetailModal, _openScenePage）
- **IndexController** — 负责业务逻辑（init, selectLevel1, selectLevel2, goHome, switchLang）
- **AppState** — 展示页状态（data, currentLevel1, currentLevel2, currentLang）
- **DataService** — 数据层（加载和收集展示产品）

**场景页** — **独立模块模式**，通过 URL 参数接收数据：

- **ScenePage** — 自包含模块，依赖 `api.js`（API 调用）和 `i18n.js`（国际化）
- 不依赖 `state.js` 或 `dataService.js`

**管理页** — **闭包模块模式**，全部逻辑封装在 `ManageApp` IIFE 中：

- 内部维护局部状态变量（`data`, `selectedCatIdx`, `selectedSubIdx`, `scenesData` 等）
- 内部 `api()` 函数直接调用 `fetch`，不依赖 `api.js` 模块
- 内部 `initSortList()` 实现拖拽排序，不依赖 `utils.js` 的 DragSort
- 通过 `return` 暴露需要从 HTML `onclick` 调用的方法

***

## 5. 核心模块说明

### 5.1 utils.js - 工具函数模块

包含展示页和管理页所需的通用工具函数，管理页的拖拽排序等功能在 `manage.js` 内部实现。

```javascript
showToast(message, type, duration)     // 显示提示消息（duration 默认 3000ms）
escapeHtml(text)                       // HTML 转义（防 XSS）
buildCategoryPath(level1, level2, level3) // 构建分类路径
getImagePlaceholderSvg(text)           // 获取图片占位符 SVG（支持自定义文字，根据当前语言显示默认文字）
```

### 5.2 i18n.js - 国际化模块

```javascript
I18n.currentLang                       // 当前语言：'jp' 或 'cn'
I18n.texts                             // 翻译文本对象（含所有中日文文本对）

I18n.init(lang)                        // 初始化
I18n.setLang(lang)                     // 设置语言
I18n.t(obj)                            // 获取翻译后的名称（根据 name_cn/name_jp）

I18n.getSiteTitle()                    // 获取网站标题
I18n.getHomeText()                     // 获取"首页"文本
I18n.getAllText()                      // 获取"全部"文本
I18n.getNoProductsText()               // 获取"暂无产品"文本
I18n.getSelectLevel2Hint()             // 获取"请选择分类"提示
I18n.getLoadErrorText()                // 获取"加载失败"文本

I18n.getSceneBtnText()                 // 获取"使用场景"按钮文本
I18n.getSceneLabel()                   // 获取"场景"文本
I18n.getSceneHintText()                // 获取场景提示文本
I18n.getSceneEmptyText()               // 获取"暂无场景图片"文本
I18n.getScenePageTitle()               // 获取场景页标题
I18n.getSceneBackText()                // 获取"返回"文本
I18n.getSceneEmptyTitle()              // 获取场景空白状态标题
I18n.getSceneEmptyDesc()               // 获取场景空白状态描述
I18n.getSceneEmptyBackText()           // 获取"返回产品列表"文本

I18n.getDetailLoadingText()            // 获取"加载中"文本
I18n.getDetailNoDescText()             // 获取"暂无详细描述"文本
I18n.getDetailLoadErrorText()          // 获取详情加载失败文本

I18n.updateLangButtons(btnCnId, btnJpId) // 更新语言按钮样式
I18n._setActiveButtonStyle(btn)        // 设置激活按钮样式（私有）
I18n._setInactiveButtonStyle(btn)      // 设置非激活按钮样式（私有）
```

### 5.3 state.js - 展示页状态管理模块

仅管理展示页（主页）的导航状态，管理页的状态在 `manage.js` 闭包内部维护。

```javascript
AppState = {
    data: [],                   // 完整的分类和产品数据
    currentLang: 'cn',          // 当前语言
    currentLevel1: null,        // 当前选中的一级分类
    currentLevel2: null,        // 当前选中的二级分类
    isLoading: false,           // 加载状态

    init(data),                 // 初始化数据
    selectLevel1(level1),       // 选择一级分类（重置 currentLevel2）
    selectLevel2(level2),       // 选择二级分类
    goHome(),                   // 返回首页（选择第一个一级分类）
    getCurrentLevel1(),         // 获取当前一级分类
    getCurrentLevel2(),         // 获取当前二级分类,
}
```

### 5.4 api.js - 展示页+场景页 API 调用模块

封装展示页和场景页所需的 API 调用。管理页的写操作通过 `manage.js` 内部的 `api()` 函数直接调用 `fetch` 实现。

```javascript
API = {
    baseUrl: '',                // API 基础路径
    timeout: 30000,             // 请求超时时间

    init(baseUrl),              // 初始化
    get(endpoint),              // GET 请求
    post(endpoint, body),       // POST 请求
    put(endpoint, body),        // PUT 请求
    delete(endpoint),           // DELETE 请求
    request(endpoint, options), // 通用请求方法（含超时控制、AbortController）

    getData(),                  // 获取完整数据（GET /api/data）
    getScenes(),                // 获取场景数据（GET /api/scenes）
    getMapping(),               // 获取产品-场景映射（GET /api/mapping）
    getDetail(imagePath, lang), // 读取MD描述文件（GET /api/detail?path=&lang=）
}
```

### 5.5 dataService.js - 展示页数据服务模块

仅封装展示页所需的数据加载和产品收集逻辑。管理页的 CRUD 操作通过 `manage.js` 直接调用后端 API 实现。

```javascript
DataService = {
    loadData(),                        // 加载数据（API 优先，data.json 回退）
    collectAllLevel2Items(),            // 收集当前一级分类下的所有二级分类
    collectDisplayProducts(),           // 收集当前分类下的展示产品（含 level1/level2 信息）
}
```

### 5.6 index.js - 主页渲染与交互

```javascript
IndexRenderer = {
    _displayProducts: [],        // 当前展示的产品列表
    _sceneMappingCache: null,    // 场景映射缓存
    _modalJustOpened: false,     // 防止弹窗打开时立即关闭

    renderAll(),                 // 渲染全部
    renderSiteTitle(),           // 渲染网站标题
    renderBreadcrumb(),          // 渲染面包屑
    renderCategoryNav(),         // 渲染分类导航
    renderProductGrid(),         // 渲染产品网格
    _renderLevel1Tags(),         // 渲染一级分类标签（私有）
    _renderLevel2Tags(),         // 渲染二级分类标签（私有）
    _bindNavEvents(nav),         // 绑定导航事件（私有）
    _renderProductGroup(category, products), // 渲染产品分组（私有）
    openDetailModal(product),    // 打开详情弹窗
    closeDetailModal(),          // 关闭详情弹窗
    _openScenePage(product),     // 新标签页打开场景页（私有）
    _getProductKey(product),     // 获取产品 key（私有）
    _productHasScenes(productKey), // 检查产品是否有场景配置（私有）
    loadSceneMapping(),          // 预加载场景映射缓存（直接 fetch scenes_mapping.json）
}

IndexController = {
    init(),                      // 初始化
    selectLevel1(level1),        // 选择一级分类
    selectLevel2(level2),        // 选择二级分类
    goHome(),                    // 返回首页
    switchLang(lang),            // 切换语言
    _updateLangButtons(lang),    // 更新语言按钮状态（私有）
}
```

### 5.7 scene.js - 场景页面模块

场景页通过 URL 参数接收产品信息，依赖 `api.js` 和 `i18n.js`，不依赖 `state.js` 或 `dataService.js`。

```javascript
ScenePage = {
    productKey: '',              // 产品标识 key
    productNameCn: '',           // 产品中文名
    productNameJp: '',           // 产品日文名
    images: [],                  // 场景图片路径列表
    currentIndex: 0,             // 当前图片索引

    init(),                      // 解析 URL 参数，初始化页面
    _getProductName(),           // 根据当前语言获取产品名（私有）
    _updateLangButtons(),        // 更新语言按钮状态（私有）
    _updateProductTitle(),       // 更新产品标题（私有）
    _updateTexts(),              // 更新页面文本（私有）
    _bindEvents(),               // 绑定事件（点击、键盘、触屏）（私有）
    _switchLang(lang),           // 切换语言（私有）
    _goBack(),                   // 返回上一页（私有）
    _loadScenes(),               // 加载场景数据（私有，调用 API.getMapping() + API.getScenes()）
    _resolveImagePaths(sceneNames, scenesData), // 解析场景名→图片路径（私有）
    _showEmpty(),                // 显示空白状态（含返回按钮）（私有）
    _showSlideshow(imagePaths),  // 显示幻灯片（私有）
    _updateSlide(),              // 更新当前图片和计数器（私有）
    prev(),                      // 上一张（循环）
    next(),                      // 下一张（循环）
}
```

### 5.8 manage.js - 管理后台模块

管理后台采用 IIFE（立即执行函数表达式）闭包模式，将全部逻辑封装在 `ManageApp` 对象中。

#### 内部状态变量

```javascript
let data = [];                  // 产品分类数据
let selectedCatIdx = -1;        // 当前选中的一级分类索引
let selectedSubIdx = -1;        // 当前选中的子分类索引
let confirmCallback = null;     // 确认框回调函数
let scenesData = [];            // 场景数据
let selectedSceneCatIdx = -1;   // 当前选中的场景分类索引
let _productScenes = [];        // 当前编辑产品的场景列表
let currentModule = 'product';  // 当前模块（'product' | 'scene'）
let _descData = { cn: '', jp: '' }; // 描述编辑数据
let _currentDescLang = 'cn';    // 当前描述编辑语言
let _descLoading = false;       // 描述加载状态
```

#### 内部函数（闭包私有）

| 函数 | 说明 |
|------|------|
| `api(method, url, body)` | 内部 API 调用封装（直接使用 fetch） |
| `uploadDetailImage(file, category, subcategory, product)` | 上传详情图片 |
| `uploadListImage(file, category, subcategory, product)` | 上传列表图片 |
| `loadData()` | 加载数据 |
| `renderSidebar()` | 渲染侧边栏（含模块切换标签） |
| `renderMain()` | 渲染主内容区 |
| `renderSubcategoryList(cat)` | 渲染子分类卡片列表 |
| `renderProductList(cat, sub)` | 渲染产品列表 |
| `loadProductBadges(cat, sub, products)` | 异步加载状态徽章 |
| `openModal(title, bodyHtml, footerHtml)` | 打开模态框 |
| `showConfirm(message, callback)` | 显示确认框 |
| `editCategory(ci)` | 编辑一级分类 |
| `deleteCategory(ci)` | 删除一级分类 |
| `addSubcategory(ci)` | 添加子分类 |
| `editSubcategory(ci, si)` | 编辑子分类 |
| `deleteSubcategory(ci, si)` | 删除子分类 |
| `sortSubcategories(ci)` | 排序子分类 |
| `addProduct(ci, si)` | 添加产品 |
| `editProduct(ci, si, pi)` | 编辑产品 |
| `deleteProduct(ci, si, pi)` | 删除产品 |
| `sortProducts(ci, si)` | 排序产品 |
| `initListImageUpload(ci, si, prod)` | 初始化列表图片上传 |
| `initDetailImageUpload(ci, si, prod)` | 初始化详情图片上传 |
| `removeDetailImage(ci, si, prod)` | 删除详情图片 |
| `initSortList()` | 初始化拖拽排序（HTML5 Drag API） |
| `loadProductDetail(...)` | 加载产品描述和详情图 |
| `loadProductScenes(prodName)` | 加载产品场景 |
| `renderProductScenesEditor(prodName)` | 渲染场景编辑器 |
| `initProductScenesDragSort()` | 初始化场景拖拽排序 |
| `renderSceneMain()` | 渲染场景管理主内容 |
| `renderSceneCategoriesDirect(container)` | 渲染场景分类卡片 |
| `renderSceneListDirect(container, cat)` | 渲染场景列表 |
| `loadSceneProductTags(scenes)` | 异步加载场景关联的产品标签 |
| `editSceneCategory(idx)` | 编辑场景分类 |
| `deleteSceneCategory(idx)` | 删除场景分类 |
| `editScene(catIdx, sceneIdx)` | 编辑场景 |
| `deleteScene(catIdx, sceneIdx)` | 删除场景 |
| `initSceneImageUpload(catIdx, sceneIdx)` | 初始化场景图片上传 |
| `uploadSceneImage(catIdx, sceneIdx)` | 上传场景图片 |
| `handleGlobalClick(e)` | 全局点击事件处理（事件委托） |

#### 导出方法（供 HTML onclick 调用）

```javascript
ManageApp = {
    init(),                          // 初始化（绑定全局事件、加载数据）
    addCategory(),                   // 打开添加一级分类弹窗
    saveAddCategory(),               // 保存新增一级分类
    saveEditCategory(),              // 保存编辑一级分类
    saveAddSubcategory(),            // 保存新增子分类
    saveEditSubcategory(),           // 保存编辑子分类
    saveAddProduct(),                // 保存新增产品
    saveEditProduct(),               // 保存编辑产品
    saveSortSubcategories(),         // 保存子分类排序
    saveSortProducts(),              // 保存产品排序
    saveDescription(),               // 保存产品描述
    switchTab(tabEl, tabId),         // 切换编辑弹窗标签页
    switchDescLang(tabEl, lang),     // 切换描述编辑语言
    closeModal(),                    // 关闭模态框
    closeConfirm(),                  // 关闭确认框
    doConfirm(),                     // 执行确认操作
    manageScenes(),                  // 切换到场景管理模块
    switchModule(mod),               // 切换模块（'product' | 'scene'）
    addSceneCategory(),              // 打开添加场景分类弹窗
    saveAddSceneCategory(),          // 保存新增场景分类
    saveEditSceneCategory(),         // 保存编辑场景分类
    addScene(catIdx),                // 打开添加场景弹窗
    saveAddScene(catIdx),            // 保存新增场景
    saveEditScene(catIdx, sceneIdx), // 保存编辑场景
    uploadSceneImage(catIdx, sceneIdx), // 上传场景图片
    addProductScene(),               // 添加产品-场景关联
    removeProductScene(idx),         // 删除产品-场景关联
    moveProductSceneUp(idx),         // 上移场景排序
    moveProductSceneDown(idx),       // 下移场景排序
    saveProductScenes(prodName),     // 保存产品场景关联
}
```

***

## 6. 后端 API 接口

### 6.1 API 接口总览

#### 主页 API（只读）

| 方法   | 路径                          | 说明               | 安全检查           |
| ------ | ----------------------------- | ------------------ | ------------------ |
| GET    | `/api/data`                   | 获取完整数据（原始 data.json，不含 MD 描述注入） | -                  |
| GET    | `/api/detail?path=&lang=`     | 读取MD描述文件     | normpath 路径检查    |
| GET    | `/api/scenes`                 | 获取场景数据       | -                  |
| GET    | `/api/mapping`                | 获取产品-场景映射  | -                  |

#### 管理后台 API — 产品分类管理

| 方法   | 路径                                        | 说明                           |
| ------ | ------------------------------------------- | ------------------------------ |
| GET    | `/api/admin/data`                           | 获取全部数据                     |
| POST   | `/api/admin/category`                       | 添加一级分类                     |
| PUT    | `/api/admin/category/<cat_idx>`             | 编辑一级分类（含重命名时自动迁移文件） |
| DELETE | `/api/admin/category/<cat_idx>`             | 删除一级分类（含关联文件清理）     |
| PUT    | `/api/admin/categories/sort`                | 排序一级分类                     |
| POST   | `/api/admin/category/<cat_idx>/subcategory`  | 添加子分类                       |
| PUT    | `/api/admin/subcategory/<cat_idx>/<sub_idx>` | 编辑子分类（含重命名时自动迁移文件） |
| DELETE | `/api/admin/subcategory/<cat_idx>/<sub_idx>` | 删除子分类（含关联文件清理）       |
| PUT    | `/api/admin/category/<cat_idx>/subcategories/sort` | 排序子分类                     |

#### 管理后台 API — 品类管理

| 方法   | 路径                                        | 说明                           |
| ------ | ------------------------------------------- | ------------------------------ |
| POST   | `/api/admin/subcategory/<cat_idx>/<sub_idx>/product` | 添加品类                   |
| PUT    | `/api/admin/product/<cat_idx>/<sub_idx>/<prod_idx>` | 编辑品类（含重命名时自动同步文件和映射） |
| DELETE | `/api/admin/product/<cat_idx>/<sub_idx>/<prod_idx>` | 删除品类                   |
| PUT    | `/api/admin/subcategory/<cat_idx>/<sub_idx>/products/sort` | 排序品类             |

#### 管理后台 API — 图片和描述管理

| 方法   | 路径                                        | 说明                           |
| ------ | ------------------------------------------- | ------------------------------ |
| GET    | `/api/admin/detail?category=&subcategory=&product=&lang=` | 获取产品描述和详情图信息 |
| PUT    | `/api/admin/detail`                         | 保存产品描述（Markdown）          |
| POST   | `/api/admin/upload`                         | 上传图片到 images 目录（自动转 WebP） |
| POST   | `/api/admin/upload-detail-image`            | 上传产品图片到 details 目录（自动转 WebP，单图） |
| DELETE | `/api/admin/detail-image`                   | 删除详情图片                     |

#### 管理后台 API — 场景管理

| 方法   | 路径                                        | 说明                           |
| ------ | ------------------------------------------- | ------------------------------ |
| GET    | `/api/admin/scenes`                         | 获取场景数据                     |
| PUT    | `/api/admin/scenes`                         | 更新场景数据                     |
| GET    | `/api/admin/mapping`                        | 获取产品-场景映射                |
| PUT    | `/api/admin/mapping`                        | 更新产品-场景映射                |
| GET    | `/api/admin/product-scenes?product=`        | 获取产品关联的场景列表            |
| PUT    | `/api/admin/product-scenes`                 | 更新产品-场景关联（替换式）       |
| GET    | `/api/admin/scene-products?scene=`          | 获取场景关联的产品列表            |
| POST   | `/api/admin/scene-category`                 | 添加场景分类                     |
| PUT    | `/api/admin/scene-category/<idx>`           | 编辑场景分类（含重命名时自动迁移目录） |
| DELETE | `/api/admin/scene-category/<idx>`           | 删除场景分类（含关联文件清理）     |
| POST   | `/api/admin/scene-category/<idx>/scene`     | 添加场景                         |
| PUT    | `/api/admin/scene/<cat_idx>/<scene_idx>`    | 编辑场景（含重命名时自动迁移文件和映射） |
| DELETE | `/api/admin/scene/<cat_idx>/<scene_idx>`    | 删除场景（含关联文件清理）         |
| POST   | `/api/admin/upload-scene-image`             | 上传场景图片（自动转 WebP）       |

### 6.2 主页数据读取流程

**读取数据 (GET /api/data)**：
1. 读取 `data.json`
2. 返回原始数据（**不注入** MD 描述字段）

> **注意**: 与旧版不同，`GET /api/data` 不再在服务端注入 MD 描述内容。描述内容通过 `GET /api/detail` 接口按需读取，前端在打开详情弹窗时单独请求。

### 6.3 路径推导规则

图片路径与 MD 描述文件路径的映射关系：

```
图片路径:     images/一级分类/子分类/产品名.webp
中文描述:     details/一级分类/子分类/产品名_cn.md
日文描述:     details/一级分类/子分类/产品名_jp.md
```

详情图片路径：

```
详情图片:     details/一级分类/子分类/产品名.webp
```

### 6.4 图片加载逻辑

产品图片加载遵循以下规则：

**列表页（主页产品网格）**：
1. **原始图**（`images/{分类}/{子分类}/{产品名}.webp`）— 直接显示
2. **占位图** — 图片不存在时显示

**详情弹窗**：
1. **详情图**（`details/{分类}/{子分类}/{产品名}.webp`）— HEAD 探测，存在则显示
2. **原始图**（`images/{分类}/{子分类}/{产品名}.webp`）— 详情图不存在时回退
3. **占位图** — 以上均不存在时显示

**场景页（scene.html）**：
1. 根据 `scenes_mapping.json` 查找产品关联的场景名
2. 根据 `scenes.json` 解析场景名对应的图片路径
3. 显示 `scenes/` 目录下的场景图片

### 6.5 图片上传自动转换

所有图片上传接口（`/api/admin/upload`、`/api/admin/upload-detail-image`、`/api/admin/upload-scene-image`）均使用 `convert_to_webp()` 函数自动将上传的图片转换为 WebP 格式：

- 使用 Pillow (PIL) 库进行转换
- 默认质量参数: 90
- 支持 ICC 色彩配置文件保留
- 处理各种图片模式（P/PA/LA/L/RGB/RGBA）
- 动图仅取第一帧

### 6.6 安全防护机制

| 安全措施 | 说明 | 实现位置 |
|----------|------|----------|
| **路径遍历防护** | normpath 检查确保路径在 base_dir 下 | `/api/detail` 接口 |
| **静态文件访问控制** | `static_folder=None`，仅暴露特定目录 | Flask 应用初始化 |
| **根目录文件过滤** | 仅允许图片、html、json 扩展名访问 | `serve_root_file()` |
| **XSS 防护** | 前端使用 `escapeHtml()` 转义 | `utils.js` |
| **网络监听** | 监听 0.0.0.0（Docker 容器内，外部通过端口映射访问） | `app.run(host='0.0.0.0')` |

> **注意**: 当前版本未设置 `MAX_CONTENT_LENGTH` 上传大小限制，未实现 `allowed_file()` 文件类型检查函数，前端通过 `accept` 属性限制上传文件类型。

***

## 7. 数据请求与状态管理

### 7.1 列表页加载流程

```
用户访问 index.html
    │
    ▼
DOMContentLoaded → I18n.init('jp')
    │
    ▼
index.js::IndexController.init()
    │
    ▼
DataService.loadData() → API.getData()
    │
    ▼
GET /api/data → 读取 data.json（不含 MD 描述）
    │
    ▼
IndexRenderer.loadSceneMapping() → 直接 fetch scenes_mapping.json 缓存
    │
    ▼
AppState.data = data
AppState.currentLevel1 = data[0]
    │
    ▼
IndexRenderer.renderAll()
    │
    ├── IndexRenderer.renderSiteTitle()
    ├── IndexRenderer.renderBreadcrumb()
    ├── IndexRenderer.renderCategoryNav()
    └── IndexRenderer.renderProductGrid()
         └── 场景按钮根据 _productHasScenes() 判断启用/禁用
```

### 7.2 场景页加载流程

```
用户点击"使用场景"按钮（启用的按钮）
    │
    ▼
IndexRenderer._openScenePage(product)
    │
    ▼
window.open('scene.html?key=...&name_cn=...&name_jp=...&lang=...', '_blank')
    │  → 新标签页打开
    ▼
DOMContentLoaded → ScenePage.init()
    │
    ├── 解析 URL 参数（key, name_cn, name_jp, lang）
    ├── I18n.init(lang)
    ├── 更新语言按钮和产品标题
    │
    ▼
Promise.all([API.getMapping(), API.getScenes()])
    │
    ├── 筛选 productname 匹配的映射记录 → 获取 scene 名称列表
    ├── 遍历 scenes.json 查找匹配的场景
    └── 提取场景图片路径列表
    │
    ▼
有图片？
  ├── YES → _showSlideshow(paths)
  │          ├── 设置 images 和 currentIndex
  │          ├── 渲染第一张图片
  │          ├── 显示页码 "1 / N"
  │          └── N > 1 显示箭头，N = 1 隐藏箭头
  │
  └── NO  → _showEmpty()
             ├── 显示图标 + 提示文字
             └── 提供"返回产品列表"按钮
```

### 7.3 详情弹窗流程

```
用户点击产品图片
    │
    ▼
IndexRenderer.openDetailModal(product)
    │
    ├── 显示弹窗（图片 + 加载中文字）
    │
    ▼
API.getDetail(coverPath, lang) → GET /api/detail
    │
    ├── 成功 → marked.parse() → 渲染 MD 为 HTML
    └── 失败 → 显示"暂无详细描述"
```

### 7.4 管理页数据流

```
用户访问 manage.html
    │
    ▼
manage.js::ManageApp.init()
    │
    ▼
内部 loadData() → api('GET', '/api/admin/data')
    │
    ▼
闭包内 data = result.data
    │
    ▼
renderSidebar() + renderMain()
    │
    ├── 渲染分类树（左侧边栏，含模块切换标签）
    ├── 渲染子分类卡片列表 或 渲染品类列表（主内容区）
    └── 品类列表加载后：异步加载状态徽章（详情图/描述/场景状态）

用户操作（新增/编辑/删除/排序）
    │
    ▼
调用内部 api() 函数（直接 fetch）
    │
    ▼
API 返回新数据 → 更新闭包内 data → renderSidebar() + renderMain()
```

### 7.5 状态管理特点

* ✅ **展示页/管理页独立状态**: 展示页使用 `AppState`，管理页使用 `ManageApp` 闭包内局部变量
* ✅ **可预测性**: 状态变更后立即调用渲染函数
* ✅ **模块化**: 展示页各模块管理自己的状态子集
* ✅ **调试友好**: 可以在控制台直接检查 `AppState` 和 `ManageApp`
* ✅ **场景页半独立**: `ScenePage` 依赖 `api.js` 和 `i18n.js`，不依赖 `state.js` 或 `dataService.js`
* ✅ **管理页自包含**: `ManageApp` 闭包内封装全部 API 调用和状态，不依赖 `api.js`、`dataService.js` 或 `i18n.js`

***

## 8. 数据存储架构

### 8.1 data.json 结构

```json
[
  {
    "name_cn": "一级分类中文名",
    "name_jp": "一级分类日文名",
    "children": [
      {
        "name_cn": "子分类中文名",
        "name_jp": "子分类日文名",
        "products": [
          {
            "name_cn": "品类中文名",
            "name_jp": "品类日文名",
            "images": [
              {
                "path": "images/一级分类/子分类/产品名.webp"
              }
            ]
          }
        ]
      }
    ]
  }
]
```

> **重要**: `data.json` 中的图片对象 **不包含** `description_cn` 和 `description_jp` 字段。
> 这些描述内容存储在 `details/` 目录下的独立 MD 文件中。
> 前端通过 `GET /api/detail` 接口按需读取，不在 `/api/data` 中注入。

### 8.2 scenes.json 结构

场景数据按 `scenes/` 文件夹的目录结构组织：

```json
[
  {
    "name_cn": "便利店场景",
    "name_jp": "コンビニシーン",
    "scenes": [
      {
        "name_cn": "便利店场景1",
        "name_jp": "コンビニシーン1",
        "images": [
          { "path": "scenes/便利店场景/便利店场景1.webp" }
        ]
      }
    ]
  }
]
```

> **说明**: `scenes.json` 的顶层数组对应 `scenes/` 目录下的场景分类文件夹，每个分类下通过 `scenes[]` 组织场景图片。场景分类为扁平结构（无 `children` 层级），与产品分类的两级结构不同。

### 8.3 scenes_mapping.json 结构

产品与场景的映射关系采用扁平数组格式，支持多对多关系：

```json
[
  { "productname": "商用壁挂液晶显示器", "scene": "便利店场景1" },
  { "productname": "商用壁挂液晶显示器", "scene": "便利店场景2" },
  { "productname": "可移动广告机", "scene": "便利店场景1" }
]
```

> **说明**: `productname` 对应 `data.json` 中产品的 `name_cn`；`scene` 对应 `scenes.json` 中场景的 `name_cn`。一个产品可以映射多个场景，一个场景也可以映射给多个产品。

### 8.4 三文件耦合关系

```
data.json                    scenes.json               scenes_mapping.json
┌─────────────────┐          ┌─────────────────┐       ┌─────────────────────┐
│ 产品 name_cn    │◄─────────┤ 场景 name_cn    │◄──────┤ productname → scene │
│ (产品数据)      │          │ (场景数据)      │       │ (映射关系)          │
└─────────────────┘          └─────────────────┘       └─────────────────────┘
```

**场景图片解析流程**：
1. 从 `scenes_mapping.json` 中筛选 `productname` 匹配的记录，获取 `scene` 名称列表
2. 遍历 `scenes.json`，在场景分类的 `scenes[]` 数组中查找 `name_cn` 匹配的场景
3. 返回匹配场景的 `images[].path` 图片路径列表

### 8.5 两级目录结构

项目使用两级分类体系：

```
一级分类 (data[])
  └── children[] → 子分类
        └── products[] → 产品
```

### 8.6 文件存储镜像结构

`images/` 和 `details/` 目录结构完全镜像：

```
images/专业视觉显示类/商用壁挂液晶显示器/商用壁挂液晶显示器_1.webp
details/专业视觉显示类/商用壁挂液晶显示器/商用壁挂液晶显示器_1_cn.md
details/专业视觉显示类/商用壁挂液晶显示器/商用壁挂液晶显示器_1_jp.md
details/专业视觉显示类/商用壁挂液晶显示器/商用壁挂液晶显示器_1.webp   ← 详情图片（优先显示）
```

***

## 9. 场景幻灯片 — 交互说明

### 9.1 触发方式

在产品列表页，每个产品卡片下方有"使用场景"按钮：
- **已配置场景**：蓝色可点击状态
- **未配置场景**：灰色禁用状态
- 点击后使用 `window.open(url, '_blank')` 在新标签页中打开场景展示页
- URL 格式：`scene.html?key={产品key}&name_cn={中文名}&name_jp={日文名}&lang={jp/cn}`

### 9.2 页面布局

| 区域 | 说明 |
|------|------|
| 顶部导航栏 | 返回按钮（← 返回/戻る）、产品名称标题、中日语言切换按钮 |
| 幻灯片主体区 | 深色背景（`var(--dark-deep)`），中央展示大图 |
| 底部计数栏 | 显示当前页码（如 "1 / 5"） |
| 左右箭头 | 固定在屏幕左右两侧，多图时显示，单图时隐藏 |

### 9.3 导航方式

| 操作 | 方式 |
|------|------|
| 上一张 | 左侧箭头 / 键盘 ← / 触屏右滑 |
| 下一张 | 右侧箭头 / 键盘 → / 触屏左滑 |
| 返回列表 | 顶部返回按钮 / 键盘 Esc |
| 循环 | 首尾自动循环 |

### 9.4 空白状态

当产品未配置场景图片时：
- 显示图标 + "暂无场景图片" 提示文字
- 显示说明文字："该产品尚未配置使用场景图片，请在管理后台中添加。"
- **提供"返回产品列表"按钮**，点击跳转到首页 `/`
- 顶部返回按钮始终可用

### 9.5 返回逻辑

```
_goBack():
  window.close()                    // 尝试关闭当前标签页
  setTimeout(200ms):
    if (!window.closed):
      window.history.back()         // 关闭失败则后退
```

### 9.6 响应式设计

- **桌面端**：图片区域 padding 40px 100px，箭头按钮 48px
- **平板/手机端（≤768px）**：图片区域 padding 20px 16px，箭头按钮 40px，箭头距离边缘 8px
- 图片始终 `object-fit: contain` 保持完整显示

***

## 10. 管理后台功能详情

### 10.1 页面结构

管理后台（`manage.html`）采用左右布局：

- **左侧边栏**：深色背景，顶部含模块切换标签（"选品管理"/"场景管理"），下方显示分类树，底部含添加按钮
- **右侧主内容区**：根据选中项显示子分类卡片列表或品类列表

### 10.2 模块切换

侧边栏顶部提供"选品管理"和"场景管理"两个模块切换标签：
- **选品管理**：显示产品分类树，管理一级分类/子分类/品类
- **场景管理**：显示场景分类列表，管理场景分类/场景/场景图片

### 10.3 分类管理

- **一级分类**：增删改查 + 拖拽排序
- **子分类**：增删改查 + 拖拽排序
- **重命名同步**：修改分类名称时，自动迁移 `images/` 和 `details/` 目录结构，并更新 `data.json` 中的图片路径引用

### 10.4 品类管理

编辑品类时提供三个标签页：

1. **基本信息**：中文品名、日文品名、列表图片（`images/` 目录，最多1张）、详情图片（`details/` 目录，最多1张）
2. **描述编辑**：中文/日文 Markdown 描述，支持语言切换，独立保存按钮
3. **场景图**：可编辑产品与场景的关联关系，支持添加/删除/排序场景，去重检查

**图片编辑说明**：
- **列表图片**（`images/` 目录）：存储在 `images/{分类}/{子分类}/{产品名}.webp`，路径记录在 `data.json` 的 `images` 数组中，用于产品列表展示
- **详情图片**（`details/` 目录）：存储在 `details/{分类}/{子分类}/{产品名}.webp`，按命名约定自动发现，优先于列表图片在主页详情弹窗中显示
- 两种图片各限1张，上传时自动以产品名命名，覆盖已有同名文件
- 编辑页面打开时，列表图片从 `data.json` 读取显示，详情图片通过 `admin_get_detail` API 异步加载显示
- 上传图片自动转换为 WebP 格式

**品类重命名同步**：修改品类名称时，自动同步以下内容：
- 重命名 `details/` 目录中的 MD 描述文件（`{旧名}_cn.md` → `{新名}_cn.md`）和详情图片
- 重命名 `images/` 目录中的产品图片文件
- 更新 `data.json` 中的图片路径引用
- 更新 `scenes_mapping.json` 中的 `productname` 字段
- 清除 `_detail_cache` 中的旧缓存条目

### 10.5 品类列表状态徽章

每个品类在列表中显示三个状态徽章：

| 徽章 | 含义 |
|------|------|
| 详情图（绿色）/ 原图（蓝色）/ 无图（橙色） | 图片来源状态 |
| 有描述（绿色）/ 无描述（橙色） | 描述文档状态 |
| N场景（蓝色）/ 无场景（橙色） | 场景图关联状态 |

> 状态徽章通过异步 API 调用加载，不阻塞主内容渲染。

### 10.6 拖拽排序功能说明

#### 功能特点
- **原生实现**：使用 HTML5 拖拽 API，无需外部库
- **同级限制**：只能在同一级别内排序
  - 子分类：可在同级子分类间拖拽排序
  - 产品：可在同级产品间拖拽排序
  - 产品场景：可在同一产品的场景间拖拽排序
- **自动保存**：拖拽完成后自动调用排序 API 并刷新视图

#### 使用方式
1. 点击展开一级分类（左侧边栏）
2. 点击分类右侧的"排序"按钮打开排序弹窗
3. 拖动项目调整顺序
4. 点击"保存排序"

#### 相关文件
- `js/manage.js` - 排序逻辑（sortSubcategories, sortProducts, initSortList）
- `css/manage.css` - 拖拽样式（.sort-item, .dragging, .drag-handle）

### 10.7 场景管理

管理后台侧边栏顶部提供"场景管理"模块切换标签，点击后进入场景管理视图。

#### 场景分类管理

- 场景分类以卡片形式展示，显示分类名称和场景数量
- 支持增删改操作
- 删除分类时自动清理 `scenes/` 目录和 `scenes_mapping.json` 中的关联条目
- 重命名分类时自动重命名 `scenes/` 目录并更新图片路径

#### 场景管理

- 点击场景分类卡片进入场景列表
- 每个场景以缩略图卡片形式展示，显示关联产品标签
- 支持增删改和图片上传操作
- 删除场景时自动清理图片文件和 `scenes_mapping.json` 中的关联条目
- 重命名场景时自动重命名图片文件并更新 mapping
- 上传图片自动转换为 WebP 格式

#### 场景关联产品标签

场景列表中每个场景卡片下方显示关联的产品标签：
- 通过 `GET /api/admin/scene-products?scene=` 异步加载
- 无关联产品时显示"暂无关联产品"

#### 产品-场景关联编辑

在品类编辑弹窗的"场景图"标签页中：

1. **已关联场景**：显示当前产品关联的场景列表，支持上下移动排序和删除
2. **添加场景**：下拉选择框（按场景分类分组），自动排除已关联场景，点击添加
3. **去重检查**：添加时自动检查是否已存在相同场景
4. **保存**：调用 `PUT /api/admin/product-scenes` 替换式更新，保持场景顺序

#### scenes_mapping.json 格式

每条记录表示一个产品-场景关联（一对多）：

```json
[
  { "productname": "产品A", "scene": "场景1" },
  { "productname": "产品A", "scene": "场景2" },
  { "productname": "产品B", "scene": "场景1" }
]
```

> **注意**：同一产品的场景顺序由数组中的出现顺序决定。删除产品时自动清理所有关联条目。

***

## 11. 开发规范

### 11.1 模块加载顺序

在 HTML 文件中，JS 模块必须按以下顺序加载：

**列表页（index.html）**：
```html
<!-- CDN 依赖 -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<!-- 1. 工具函数 -->
<script src="js/utils.js"></script>
<!-- 2. 国际化 -->
<script src="js/i18n.js"></script>
<!-- 3. 状态管理 -->
<script src="js/state.js"></script>
<!-- 4. API 调用 -->
<script src="js/api.js"></script>
<!-- 5. 数据服务 -->
<script src="js/dataService.js"></script>
<!-- 6. 页面主逻辑 -->
<script src="js/index.js"></script>
```

**场景页（scene.html）**：
```html
<!-- CDN 依赖 -->
<script src="https://cdn.tailwindcss.com"></script>
<!-- 1. API 调用 -->
<script src="js/api.js"></script>
<!-- 2. 国际化 -->
<script src="js/i18n.js"></script>
<!-- 3. 场景页主逻辑 -->
<script src="js/scene.js"></script>
```

**管理页（manage.html）**：
```html
<!-- CDN 依赖 -->
<script src="https://cdn.tailwindcss.com"></script>
<!-- 1. 工具函数 -->
<script src="js/utils.js"></script>
<!-- 2. 管理页主逻辑（自包含，不依赖 i18n.js） -->
<script src="js/manage.js"></script>
```

### 11.2 添加新产品/分类

**通过管理页操作**（推荐）：
1. 确保 Docker 容器运行中
2. 访问管理页：`http://192.168.124.99:65001/manage.html`
3. 点击"添加"按钮
4. 填写信息、上传图片
5. 保存

### 11.3 配置场景映射

1. 在管理后台切换到"场景管理"模块
2. 确保场景分类和场景已创建，场景图片已上传
3. 在品类编辑弹窗的"场景图"标签页中配置产品与场景的关联关系
4. `scenes_mapping.json` 中的映射关系控制列表页按钮的启用/禁用状态

### 11.4 代码风格规范

* 使用中文注释（符合项目要求）
* 函数长度尽量控制在 50 行以内
* 变量命名清晰，有意义
* 使用 `const` 和 `let`，避免使用 `var`
* 使用模板字符串进行 HTML 拼接
* 使用事件委托（`data-action` 属性）代替内联 `onclick`（防止 XSS）
* 使用 `data-*` 属性传递数据

### 11.5 删除操作安全流程

删除操作时，系统会自动清理以下关联资源：

| 删除对象 | 清理 images/ | 清理 details/ | 清理 scenes_mapping.json |
|----------|:---:|:---:|:---:|
| 一级分类 | 整个分类目录 | 整个分类目录 | 遍历所有子产品逐条删除 |
| 子分类 | 子分类目录 | 子分类目录 | 遍历所有子产品逐条删除 |
| 品类 | 产品图片文件 | 产品 MD 描述 + 详情图片 | 按 productname 删除对应条目 |

**details/ 目录清理逻辑**（`delete_product_details` 函数）：
- 删除匹配产品名的 MD 描述文件（`{产品名}_cn.md`、`{产品名}_jp.md`）
- 删除匹配产品名的详情图片（`{产品名}.webp` 等）
- 同步清除 `_detail_cache` 中的缓存条目

**scenes_mapping.json 清理逻辑**（`remove_product_from_mapping` 函数）：
- 按 `productname` 字段精确匹配删除
- 删除后自动保存文件

### 11.6 重命名操作同步流程

重命名操作时，系统会自动同步以下关联资源：

| 重命名对象 | 同步 images/ | 同步 details/ | 同步 data.json 路径 | 同步 scenes_mapping.json |
|----------|:---:|:---:|:---:|:---:|
| 一级分类 | 重命名分类目录 | 重命名分类目录 | 更新所有子产品图片路径 | - |
| 子分类 | 重命名子分类目录 | 重命名子分类目录 | 更新子分类下产品图片路径 | - |
| 品类 | 重命名产品图片文件 | 重命名 MD 文件 + 详情图片 | 更新产品图片路径 | 更新 productname 字段 |
| 场景分类 | 重命名分类目录 | - | - | - |
| 场景 | 重命名图片文件 | - | 更新场景图片路径 | 更新 scene 字段 |

**品类重命名同步逻辑**（`admin_update_product` 端点内）：
1. 遍历 `details/{分类}/{子分类}/` 目录，重命名匹配旧产品名的文件（MD 描述 + 详情图片）
2. 遍历 `images/{分类}/{子分类}/` 目录，重命名匹配旧产品名的图片文件
3. 更新 `data.json` 中该产品的图片路径引用
4. 调用 `rename_product_in_mapping` 更新 `scenes_mapping.json` 中的 `productname`
5. 清除 `_detail_cache` 中旧文件名的缓存条目

**scenes_mapping.json 重命名逻辑**（`rename_product_in_mapping` 函数）：
- 按 `productname` 字段精确匹配旧名称，替换为新名称
- 仅在有变更时保存文件

***

## 12. 打包发布

### 12.1 Docker 部署（主要方式）

```bash
# 构建并启动容器
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down

# 重新构建（代码变更后）
docker-compose up -d --build
```

### 12.2 Docker 配置说明

**Dockerfile**:
- 基础镜像: `python:3.9-slim`
- 工作目录: `/app`
- 依赖安装: `pip install --no-cache-dir -r requirements.txt`
- 启动命令: `python app.py`
- 暴露端口: 5000（容器内部，实际通过 docker-compose 映射到 65001）

**docker-compose.yml**:
- 服务名: `app`
- 端口映射: `65001:65001`
- 卷挂载: `.:/app`（项目目录映射到容器内，支持热更新）
- 容器名: `haituo_select_signage`
- 重启策略: `unless-stopped`

### 12.3 本地启动（备用方式）

```powershell
# 安装依赖
pip install -r requirements.txt

# 启动服务器
python app.py

# 或使用批处理文件（Windows）
双击运行 start_server.bat
```

### 12.4 启动后使用

1. 服务器启动后，访问展示页：`http://192.168.124.99:65001/`
2. 访问管理页：`http://192.168.124.99:65001/manage.html`

### 12.5 服务器配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 端口 | 65001 | 固定端口 |
| 绑定地址 | 0.0.0.0 | 监听所有网络接口（Docker 容器内） |
| 调试模式 | True | 开发模式（debug=True, use_reloader=False） |
| 自动重载 | False | 避免打包后问题 |
| 上传大小限制 | 无 | 未设置 MAX_CONTENT_LENGTH |

### 12.6 Python 依赖

| 依赖 | 版本要求 | 用途 |
|------|----------|------|
| Flask | >=2.0.0 | Web 框架 |
| Pillow | >=10.0.0 | 图片处理（WebP 自动转换） |

### 12.7 CDN 依赖说明

页面使用了以下 CDN 资源：

| CDN | 用途 | 使用页面 | 离线影响 |
|-----|------|----------|------|
| `cdn.tailwindcss.com` | Tailwind CSS 样式框架 | 全部页面 | 页面失去所有 Tailwind 样式，布局错乱 |
| `fonts.googleapis.com` | Noto Sans SC / JP 字体 | 全部页面 | 回退到系统字体，功能不受影响 |
| `cdn.jsdelivr.net/npm/marked` | Markdown 渲染库 | index.html | 详情弹窗无法渲染 MD 描述，显示原始文本 |

**说明**：Tailwind 通过 CDN 的 JIT 模式在运行时按需生成样式。当前采用 CDN 方案以保持零构建工具的简洁性。

***

## 附录

### A. 核心功能清单 (展示页)

* ✅ 两级分类导航
* ✅ 中日双语切换
* ✅ 产品卡片展示
* ✅ 产品详情模态框
* ✅ 多图展示
* ✅ 图片描述（Markdown 渲染，marked.js）
* ✅ 返回顶部按钮
* ✅ 面包屑导航
* ✅ 事件委托（防 XSS）
* ✅ **场景页面**：新标签页打开，幻灯片轮播展示
* ✅ **场景按钮状态**：无场景映射的产品，场景按钮置灰不可点击
* ✅ **无障碍回退**：无场景页面提供返回按钮，按 Esc 可返回
* ✅ 触屏滑动支持（场景页）
* ✅ 键盘导航（场景页：← → Esc）

### B. 核心功能清单 (管理后台)

* ✅ 产品列表展示（含状态徽章）
* ✅ 产品新增（含列表图片上传至 images/ 目录、详情图片上传至 details/ 目录）
* ✅ 产品编辑（含基本信息/描述编辑/场景图三个标签页，列表图片和详情图片分别编辑）
* ✅ 产品删除（带二次确认，先保存数据后删文件）
* ✅ 分类管理（一级分类/子分类）
* ✅ 分类新增/编辑/删除
* ✅ 图片文件夹自动管理
* ✅ MD 描述文件自动管理
* ✅ 数据实时保存
* ✅ Toast 提示
* ✅ **拖拽排序功能**（子分类、品类、产品场景）
* ✅ **图片描述编辑**（点击图片编辑描述）
* ✅ **分类重命名自动迁移**（images/ 和 details/ 目录同步）
* ✅ **品类重命名自动同步**（details/ 文件、images/ 文件、data.json 路径、scenes_mapping.json 映射）
* ✅ **模块切换**（选品管理/场景管理）
* ✅ **场景分类管理**（增删改查，含目录重命名和图片路径自动更新）
* ✅ **场景管理**（增删改查、图片上传，含文件重命名和 mapping 自动更新）
* ✅ **场景关联产品标签**（场景列表显示关联的产品标签）
* ✅ **产品-场景关联编辑**（添加/删除/排序场景，去重检查）
* ✅ **详情图片删除**（独立删除详情图片）
* ✅ **图片自动转 WebP**（上传时自动转换格式）

### C. 配色参考

```
主色调: #0F172A (深海军蓝)
主色调浅: #1E293B
主色调深: #020617
强调色: #0369A1 (专业蓝)
背景色: #F8FAFC (浅灰白)
卡片背景: #FFFFFF (纯白)
文字色: #020617 (深蓝黑)
次文字色: #475569 (石板灰)
边框色: #E2E8F0 (浅灰)
错误色: #DC2626 (红色)
成功色: #16A34A (绿色)
```

### D. 字体配置

```
优先级:
1. "Noto Sans JP"     - Google 日文字体（优先，适应日语为主的网站内容）
2. "Noto Sans SC"     - Google 中文字体（简体中文）
3. "Hiragino Sans GB" - Mac 中文字体
4. "Microsoft YaHei"  - Windows 中文字体（微软雅黑）
5. "SimHei"           - Windows 中文字体（黑体）
6. "Hiragino Sans"    - Mac 日文字体
7. "Yu Gothic"         - Windows 日文字体
8. "Meiryo"           - Windows 日文字体（明细）
9. sans-serif          - 兜底
```

### E. 更新日志

**v6.0 (2026-05-27)**
- 新增 Docker 部署架构说明（Dockerfile、docker-compose.yml）
- 修正 Python 版本：文档写 3.11，实际 Dockerfile 使用 3.9-slim
- 修正服务器端口：文档写 8888，实际代码为 65001
- 修正绑定地址：文档写 127.0.0.1，实际代码为 0.0.0.0（Docker 容器需要）
- 修正调试模式：文档写 False，实际代码为 True
- 修正 API /api/data 行为：文档说注入 MD 描述，实际不注入（描述通过 /api/detail 按需读取）
- 修正场景页模块加载顺序：文档说仅加载 scene.js，实际加载 api.js → i18n.js → scene.js
- 修正管理页模块加载顺序：文档说加载 utils.js + i18n.js + manage.js，实际仅加载 utils.js + manage.js
- 修正 details/ 目录访问说明：MD 文件实际可直接通过 HTTP 访问，非仅通过 API
- 修正根目录文件过滤：实际允许图片、html、json 扩展名，非仅图片
- 新增 Pillow 依赖说明（requirements.txt 中 Flask + Pillow）
- 新增 WebP 自动转换功能说明（convert_to_webp 函数）
- 新增 marked.js CDN 依赖说明（index.html 详情弹窗 Markdown 渲染）
- 新增 /api/admin/scene-products API 端点记录
- 新增场景关联产品标签功能记录（loadSceneProductTags 函数）
- 新增 initSceneImageUpload、uploadSceneImage 内部函数记录
- 移除不存在的安全措施记录：is_safe_detail_path()、allowed_file()、MAX_CONTENT_LENGTH、双重路径验证
- 更新目录结构：新增 Dockerfile、docker-compose.yml、requirements.txt
- 更新设计特点：移除"零依赖部署"和"本地化部署"，新增"Docker 容器化部署"和"WebP 自动转换"
- 更新模块依赖关系图：反映三个页面各自的实际加载链
- 更新列表页图片加载逻辑：列表页直接显示 images/ 图片，非优先 details/
- 更新打包发布章节：Docker 部署为主要方式，本地启动为备用

**v5.0 (2026-05-17)**
- 全面重写架构文档，使其与实际代码完全一致
- 修正 utils.js 模块说明：文档中原有约 22 个函数/对象（含 DragSort），实际仅 4 个函数，移除不存在的函数列表
- 修正 i18n.js 模块说明：新增 12 个实际存在但未记录的方法（场景页/详情弹窗相关国际化方法），移除 3 个不存在的属性/方法
- 重写 state.js 模块说明：文档中原有约 30+ 属性/方法（含管理页模态框/编辑/删除状态），实际仅 5 属性 + 5 方法 + 2 getter，管理页状态在 manage.js 闭包内维护
- 重写 api.js 模块说明：文档中原有完整 CRUD + 文件操作，实际仅含展示页只读 API（getData, getScenes, getMapping, getDetail），新增 put/delete 方法记录
- 重写 dataService.js 模块说明：文档中原有完整 CRUD 操作，实际仅 3 个只读方法（loadData, collectAllLevel2Items, collectDisplayProducts）
- 新增 manage.js 详细模块说明（5.8 节）：记录闭包内部状态变量、约 35 个内部函数、30 个导出方法
- 更新模块依赖关系图（4.2 节）：反映展示页/管理页双轨架构
- 更新模块职责划分（4.3 节）：明确各模块实际职责
- 更新设计模式说明（4.4 节）：新增管理页闭包模块模式说明
- 更新后端 API 接口表（6.1 节）：新增 11 个未记录的 API 端点
- 更新目录结构（2 节）：新增 start_server.bat
- 更新文件重要性表：调整 manage.js 重要性为 ⭐⭐⭐⭐⭐
- 更新场景页返回逻辑（9.5 节）：实际使用 window.close() + setTimeout 回退
- 更新场景页加载流程（7.2 节）：使用 API.getMapping()/getScenes()
- 更新管理页模块加载顺序（11.1 节）：新增 manage.html 的加载顺序
- 更新打包发布章节（12 节）：移除不存在的 build_all.bat/build_all.py 引用
- 更新 scenes.json 结构（8.2 节）：场景分类为扁平结构
- 新增管理页数据流说明（7.4 节）
- 新增模块切换功能说明（10.2 节）
- 新增详情图片删除功能记录

**v4.4 (2026-05-12)**
- 产品编辑页面图片区域拆分
- 新增 uploadListImage、initListImageUpload 函数
- 两种图片各限1张，上传时自动以产品名命名覆盖

**v4.3 (2026-05-12)**
- 修复产品重命名时不同步关联数据的 Bug
- 新增 rename_product_in_mapping 辅助函数
- 新增重命名操作同步流程章节

**v4.2 (2026-05-09)**
- 合并架构文档
- 新增页面与路由章节
- 新增场景幻灯片交互说明章节

**v4.1 (2026-05-09)**
- 重构 scenes_mapping.json 为扁平数组格式
- 新增场景独立页面 scene.html + js/scene.js
- 新增场景分类管理和场景管理功能

**v4.0 (2026-05-09)**
- 新增管理后台 API 和 manage.html 页面
- 新增详情图片上传、描述编辑、场景图展示功能

**v3.5 (2026-05-08)**
- 图片格式统一从 .png 迁移为 .webp

**v3.0 (2026-04-01)**
- 代码架构全面重构，模块化结构

**v2.1 (2026-03-26)**
- 管理后台功能新增，升级到 Flask 框架

**v2.0 (2026-03-20)**
- 初始版本，中日语言选品展示

***

**文档结束**
