# 产品描述迁移至MD文件 Spec

## Why
当前产品图片描述（description_cn/description_jp）内嵌在 data.json 中，导致：
1. data.json 文件体积大、可读性差，难以直接编辑描述内容
2. 无法利用文本编辑器/Markdown工具高效批量编辑描述
3. 描述与结构数据耦合，修改描述必须通过管理后台或手动编辑JSON

将描述迁移到独立MD文件后，用户可以直接用任何文本编辑器修改描述，提高维护效率。

## What Changes
- **BREAKING**: data.json 中图片对象的 `description_cn` 和 `description_jp` 字段将被移除，描述内容迁移到 `detail/` 目录下的独立MD文件
- 新增 `detail/` 目录，文件夹结构与 `images/` 一致，每个图片对应一对MD文件（`_cn.md` 和 `_jp.md`）
- 后端新增MD文件读写API，GET /api/data 返回数据时自动合并MD内容
- 管理后台保存时同步写入MD文件，同时支持直接编辑MD文件
- 新增数据迁移脚本，将现有data.json中的描述提取到MD文件

## Impact
- Affected specs: haituo-select-website, haituomanager
- Affected code:
  - `app.py` - 新增MD文件读写API，修改GET/POST /api/data逻辑
  - `js/dataService.js` - 数据加载/保存逻辑适配
  - `js/api.js` - 新增MD文件API调用
  - `js/index.js` - 展示页描述渲染逻辑（可能需异步加载）
  - `js/manage.js` - 管理后台描述编辑/保存逻辑
  - `js/i18n.js` - tDesc()方法适配
  - `data.json` - 移除description_cn/description_jp字段
  - 新增 `detail/` 目录和MD文件
  - 新增迁移脚本 `migrate_to_md.py`

## ADDED Requirements

### Requirement: MD文件存储产品图片描述
系统 SHALL 将每张图片的中文和日文描述分别存储在独立的MD文件中。

#### Scenario: MD文件路径规则
- **GIVEN** 一张图片路径为 `images/一级分类/二级分类/三级分类/产品名_1.png`
- **THEN** 对应的中文描述文件路径为 `detail/一级分类/二级分类/三级分类/产品名_1_cn.md`
- **AND** 对应的日文描述文件路径为 `detail/一级分类/二级分类/三级分类/产品名_1_jp.md`

#### Scenario: MD文件内容格式
- **GIVEN** 一个图片描述MD文件
- **THEN** 文件内容为纯文本（合法Markdown），支持换行符
- **AND** 文件使用UTF-8编码保存

#### Scenario: MD文件不存在时的降级处理
- **GIVEN** 某张图片对应的MD文件不存在
- **THEN** 系统应将该图片的描述视为空字符串，不报错

### Requirement: 后端API支持MD文件读写
系统 SHALL 提供MD文件的读取和写入API。

#### Scenario: 读取单个MD文件
- **WHEN** 前端请求 `GET /api/detail?path=detail/xxx/xxx_cn.md`
- **THEN** 返回该MD文件的文本内容

#### Scenario: 保存单个MD文件
- **WHEN** 前端请求 `POST /api/save-detail`，提供path和content
- **THEN** 将content写入指定MD文件，自动创建不存在的目录

#### Scenario: GET /api/data 自动合并MD内容
- **WHEN** 前端请求 `GET /api/data`
- **THEN** 后端读取data.json后，遍历所有图片，读取对应MD文件内容
- **AND** 将MD内容注入到返回数据的 description_cn 和 description_jp 字段中
- **AND** 前端接收到的数据结构与当前完全一致，无需修改前端渲染逻辑

#### Scenario: POST /api/data 自动提取描述到MD文件
- **WHEN** 前端请求 `POST /api/data`，数据中包含 description_cn/description_jp
- **THEN** 后端提取所有图片的描述字段，写入对应MD文件
- **AND** 从数据中移除 description_cn/description_jp 后保存到 data.json
- **AND** 确保MD文件目录结构存在

### Requirement: 管理后台支持MD文件编辑
管理后台 SHALL 同时支持通过界面编辑和直接编辑MD文件两种方式。

#### Scenario: 通过管理后台编辑描述
- **WHEN** 用户在管理后台的图片描述编辑模态框中修改描述并保存
- **THEN** 系统调用 `POST /api/save-detail` 将描述写入对应MD文件
- **AND** data.json 中不保存描述字段

#### Scenario: 直接编辑MD文件后刷新页面
- **WHEN** 用户直接编辑MD文件后刷新展示页或管理页
- **THEN** 页面显示更新后的描述内容（因为GET /api/data会重新读取MD文件）

### Requirement: 数据迁移工具
系统 SHALL 提供迁移脚本将现有data.json中的描述提取到MD文件。

#### Scenario: 执行迁移
- **WHEN** 运行 `python migrate_to_md.py`
- **THEN** 脚本读取data.json，为每张图片创建对应的MD文件
- **AND** 从data.json中移除description_cn/description_jp字段
- **AND** 迁移前自动备份data.json

## MODIFIED Requirements

### Requirement: data.json数据结构
data.json中图片对象的结构从：
```json
{
  "path": "images/xxx/产品名_1.png",
  "description_cn": "中文描述",
  "description_jp": "日文描述"
}
```
修改为：
```json
{
  "path": "images/xxx/产品名_1.png"
}
```
描述字段完全由MD文件提供，data.json不再存储。

### Requirement: 管理后台产品保存逻辑
管理后台保存产品时，图片描述不再写入data.json，而是通过 `POST /api/save-detail` API单独保存到MD文件。

## REMOVED Requirements

### Requirement: data.json中存储图片描述
**Reason**: 描述内容迁移到独立MD文件，data.json只保留结构数据
**Migration**: 运行 migrate_to_md.py 脚本自动迁移
