# 海拓选品管理 - Product Requirement Document

## Overview
- **Summary**: 为海拓选品网站开发一个可视化选品管理系统，实现产品和分类的增删改查功能
- **Purpose**: 简化选品数据的维护工作，让用户能够直观地管理所有产品信息和分类
- **Target Users**: 海拓商通的选品管理人员

## Goals
- 创建独立的管理页面 manage.html（中文界面）
- 实现产品列表展示、新增、编辑、删除功能
- 实现图片上传、替换功能，按照现有文件夹结构和命名规则保存
- 实现一、二、三级分类的完整管理功能
- 所有修改同步更新 data.json 和 images 文件夹
- 确保修改后主页能正常展示

## Non-Goals (Out of Scope)
- 不开发用户登录/权限系统（内部使用）
- 不开发数据导出/导入功能（通过 backup 手动备份）
- 不开发批量操作功能（先实现单条操作）
- 不开发图片裁剪/编辑功能

## Background & Context
- 现有项目是一个中日贸易选品展示网站，使用单文件架构
- 数据存储在 data.json，图片存储在 images 文件夹按分类组织
- 现有技术栈：HTML5 + Tailwind CSS + 原生 JS + Python 本地服务器
- 用户希望能够可视化管理数据，而不是手动编辑 JSON 和文件

## Functional Requirements
- **FR-1**: 产品列表页面展示所有产品，竖向列表，左图右文
- **FR-2**: 产品信息展示：一级分类、二级分类、三级分类、品名（中日双语）、图片描述（中日双语）
- **FR-3**: 产品新增功能，包括信息填写和图片上传
- **FR-4**: 产品编辑功能，包括信息修改和图片替换
- **FR-5**: 产品删除功能（带二次确认）
- **FR-6**: 一、二、三级分类的新增、编辑、删除功能
- **FR-7**: 图片按照现有文件夹结构和命名规则保存
- **FR-8**: 所有操作实时更新 data.json 和文件系统

## Non-Functional Requirements
- **NFR-1**: 管理页面使用中文界面
- **NFR-2**: 图片上传支持常见格式（PNG、JPG、JPEG、GIF、WEBP）
- **NFR-3**: 删除操作有二次确认，防止误操作
- **NFR-4**: 页面响应式设计，适配常见屏幕尺寸

## Constraints
- **Technical**: 必须使用现有技术栈（HTML5 + Tailwind CSS + 原生 JS + Python）
- **Business**: 必须严格遵守现有 data.json 和 images 文件夹结构
- **Dependencies**: 扩展现有的 app.py 作为后端 API

## Assumptions
- 用户会在本地运行管理系统（通过 app.py）
- 用户已经备份了重要数据
- 管理系统仅内部使用，无需考虑安全问题

## Acceptance Criteria

### AC-1: 产品列表展示
- **Given**: 已启动 app.py 服务器
- **When**: 访问 manage.html
- **Then**: 页面展示所有产品的竖向列表，每个条目左侧显示图片，右侧显示产品信息
- **Verification**: `human-judgment`

### AC-2: 产品信息完整显示
- **Given**: 产品列表已加载
- **When**: 查看任意产品条目
- **Then**: 显示：一级分类、二级分类、三级分类、中文品名、日文品名、图片描述（如有）
- **Verification**: `human-judgment`

### AC-3: 产品新增功能
- **Given**: 在管理页面
- **When**: 点击新增产品，填写信息并上传图片，点击保存
- **Then**: 产品信息保存到 data.json，图片保存到对应文件夹，列表中显示新产品
- **Verification**: `programmatic`

### AC-4: 产品编辑功能
- **Given**: 在产品列表
- **When**: 点击编辑产品，修改信息或替换图片，点击保存
- **Then**: data.json 更新，图片文件更新，列表显示修改后的信息
- **Verification**: `programmatic`

### AC-5: 产品删除功能
- **Given**: 在产品列表
- **When**: 点击删除产品，确认删除
- **Then**: 产品从 data.json 删除，图片文件删除，列表不再显示该产品
- **Verification**: `programmatic`

### AC-6: 删除二次确认
- **Given**: 在产品列表
- **When**: 点击删除产品
- **Then**: 弹出确认对话框，需要再次确认才执行删除
- **Verification**: `human-judgment`

### AC-7: 分类管理功能
- **Given**: 在管理页面
- **When**: 进行分类的新增、编辑、删除操作
- **Then**: data.json 同步更新，且保持数据结构正确
- **Verification**: `programmatic`

### AC-8: 图片保存规则
- **Given**: 上传或替换图片
- **When**: 保存产品
- **Then**: 图片按照现有文件夹结构保存，命名规则为 {产品名}_{序号}.{扩展名}
- **Verification**: `programmatic`

### AC-9: 主页正常展示
- **Given**: 完成产品/分类的增删改
- **When**: 访问主页 index.html
- **Then**: 主页能正常展示修改后的数据
- **Verification**: `human-judgment`

## Open Questions
- [ ] 无（已通过用户确认解决）
