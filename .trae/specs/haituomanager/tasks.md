# 海拓选品管理 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 扩展 app.py 后端 API
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 添加获取完整数据的 API（GET /api/data）
  - 添加保存完整数据的 API（POST /api/data）
  - 添加图片上传 API（POST /api/upload-image）
  - 添加删除图片 API（POST /api/delete-image）
- **Acceptance Criteria Addressed**: [AC-3, AC-4, AC-5, AC-7, AC-8]
- **Test Requirements**:
  - `programmatic` TR-1.1: GET /api/data 返回完整的 data.json 内容
  - `programmatic` TR-1.2: POST /api/data 能正确保存 JSON 数据到 data.json
  - `programmatic` TR-1.3: POST /api/upload-image 能保存图片到正确路径
  - `programmatic` TR-1.4: POST /api/delete-image 能删除指定路径的图片
- **Notes**: 使用 Python 的 http.server 或 Flask（简单起见用 http.server）

## [x] Task 2: 创建 manage.html 基础页面
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建 manage.html，使用中文界面
  - 使用 Tailwind CSS CDN，保持与主页类似的设计风格
  - 页面布局：顶部导航 + 主内容区
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `human-judgement` TR-2.1: 页面能正常打开，显示中文标题和导航
  - `human-judgement` TR-2.2: 页面设计风格简洁美观

## [x] Task 3: 实现产品列表展示
- **Priority**: P0
- **Depends On**: [Task 1, Task 2]
- **Description**: 
  - 从后端 API 获取数据
  - 遍历所有分类，收集所有产品
  - 竖向列表渲染，左图右文
  - 显示完整产品信息（三级分类、中日双语品名、描述）
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `human-judgement` TR-3.1: 列表能正确展示所有产品
  - `human-judgement` TR-3.2: 每个产品条目显示完整信息
  - `human-judgement` TR-3.3: 图片正确显示在左侧

## [x] Task 4: 实现产品编辑功能（模态框）
- **Priority**: P0
- **Depends On**: [Task 3]
- **Description**: 
  - 点击产品条目弹出编辑模态框
  - 表单包含：选择分类、输入中日品名、编辑图片描述
  - 图片预览和替换功能
  - 保存按钮调用后端 API
- **Acceptance Criteria Addressed**: [AC-4, AC-8]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 点击条目能打开编辑模态框
  - `human-judgement` TR-4.2: 表单能正确显示和编辑所有字段
  - `programmatic` TR-4.3: 保存后 data.json 正确更新

## [x] Task 5: 实现产品新增功能
- **Priority**: P0
- **Depends On**: [Task 4]
- **Description**: 
  - 添加"新增产品"按钮
  - 复用编辑模态框，用于新增
  - 图片上传功能
- **Acceptance Criteria Addressed**: [AC-3, AC-8]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 新增按钮能打开新增模态框
  - `programmatic` TR-5.2: 新增后 data.json 包含新产品
  - `programmatic` TR-5.3: 图片保存到正确路径，命名正确

## [x] Task 6: 实现产品删除功能（带二次确认）
- **Priority**: P0
- **Depends On**: [Task 3]
- **Description**: 
  - 每个产品条目添加删除按钮
  - 点击删除弹出确认对话框
  - 确认后调用后端 API 删除数据和图片
- **Acceptance Criteria Addressed**: [AC-5, AC-6]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 点击删除弹出确认对话框
  - `programmatic` TR-6.2: 确认后产品从 data.json 删除
  - `programmatic` TR-6.3: 确认后图片文件被删除

## [x] Task 7: 实现分类管理功能
- **Priority**: P1
- **Depends On**: [Task 3]
- **Description**: 
  - 添加分类管理面板（展开/收起）
  - 一、二、三级分类的新增、编辑、删除
  - 删除分类时检查是否有子分类或产品
- **Acceptance Criteria Addressed**: [AC-7]
- **Test Requirements**:
  - `human-judgement` TR-7.1: 分类管理面板能正常展开和收起
  - `programmatic` TR-7.2: 新增/编辑/删除分类后 data.json 正确更新
  - `human-judgement` TR-7.3: 删除有子分类/产品的分类时有提示

## [x] Task 8: 集成测试和主页验证
- **Priority**: P0
- **Depends On**: [Task 5, Task 6, Task 7]
- **Description**: 
  - 完整测试所有功能
  - 验证修改后主页能正常展示
- **Acceptance Criteria Addressed**: [AC-9]
- **Test Requirements**:
  - `human-judgement` TR-8.1: 所有功能正常工作
  - `human-judgement` TR-8.2: 主页能正确展示修改后的数据
