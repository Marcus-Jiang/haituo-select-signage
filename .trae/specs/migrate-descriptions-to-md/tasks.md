# Tasks

- [x] Task 1: 编写数据迁移脚本 migrate_to_md.py
  - [x] SubTask 1.1: 读取 data.json，遍历所有产品的所有图片
  - [x] SubTask 1.2: 根据图片路径推导MD文件路径（images/ → detail/，扩展名 → _cn.md/_jp.md）
  - [x] SubTask 1.3: 创建 detail/ 目录结构，将 description_cn/description_jp 内容写入对应MD文件
  - [x] SubTask 1.4: 从 data.json 中移除 description_cn/description_jp 字段并保存
  - [x] SubTask 1.5: 迁移前自动备份 data.json 为 data.json.pre_md_migration.bak
  - [x] SubTask 1.6: 输出迁移统计信息（处理了多少产品、多少图片、多少MD文件）

- [x] Task 2: 修改后端 app.py - 新增MD文件读写API
  - [x] SubTask 2.1: 新增 GET /api/detail 接口，读取指定MD文件内容并返回
  - [x] SubTask 2.2: 新增 POST /api/save-detail 接口，将内容写入指定MD文件（自动创建目录）
  - [x] SubTask 2.3: 修改 GET /api/data 接口，读取data.json后遍历图片，读取对应MD文件内容注入到 description_cn/description_jp 字段
  - [x] SubTask 2.4: 修改 POST /api/data 接口，提取数据中的 description_cn/description_jp 写入MD文件，然后从数据中移除这些字段再保存到 data.json
  - [x] SubTask 2.5: 添加MD文件路径推导辅助函数 image_path_to_detail_path(image_path, lang)

- [x] Task 3: 修改前端 js/api.js - 新增MD文件API调用方法
  - [x] SubTask 3.1: 新增 getDetail(path) 方法，调用 GET /api/detail
  - [x] SubTask 3.2: 新增 saveDetail(path, content) 方法，调用 POST /api/save-detail

- [x] Task 4: 修改前端 js/manage.js - 管理后台描述编辑适配
  - [x] SubTask 4.1: 修改 saveImageDescription() 方法，调用 API.saveDetail() 保存描述到MD文件
  - [x] SubTask 4.2: 修改 saveProduct() 方法，保存产品时图片描述通过后端POST /api/data自动提取到MD文件
  - [x] SubTask 4.3: 修改 handleImageUpload() 方法，新图片的描述初始化为空（MD文件在保存时由后端自动创建）
  - [x] SubTask 4.4: 确保删除产品时同步删除对应的MD文件

- [x] Task 5: 修改前端 js/dataService.js - 数据服务层适配
  - [x] SubTask 5.1: 确认 loadData() 无需修改（后端GET /api/data已自动合并MD内容）
  - [x] SubTask 5.2: 确认 saveData() 无需修改（后端POST /api/data已自动提取描述到MD）
  - [x] SubTask 5.3: 确认无需添加辅助方法（路径推导已在api.js中实现）

- [x] Task 6: 修改前端 js/index.js - 展示页验证
  - [x] SubTask 6.1: 验证展示页产品详情模态框中图片描述正常显示（后端透明处理，无需修改）
  - [x] SubTask 6.2: 验证语言切换后描述正确切换（后端透明处理，无需修改）

- [x] Task 7: 修改前端 js/i18n.js - tDesc()方法验证
  - [x] SubTask 7.1: 验证 tDesc() 方法在数据结构不变的情况下正常工作（后端已合并MD内容）

- [x] Task 8: 修改打包配置 - 确保detail目录包含在打包中
  - [x] SubTask 8.1: 修改 build_all.py，确保打包时包含 detail/ 目录
  - [x] SubTask 8.2: 修改 海拓選品.spec（PyInstaller配置），确保 detail/ 目录被打包

- [x] Task 9: 端到端测试验证
  - [x] SubTask 9.1: 运行迁移脚本，验证MD文件正确生成（614个MD文件）
  - [x] SubTask 9.2: 启动服务器，验证展示页图片描述正常显示
  - [x] SubTask 9.3: 验证管理后台编辑描述后MD文件正确更新（通过API测试验证）
  - [x] SubTask 9.4: 验证直接编辑MD文件后刷新页面描述更新（GET /api/data自动读取MD内容）
  - [x] SubTask 9.5: 验证新增产品时MD文件正确创建（POST /api/data自动提取描述到MD）
  - [x] SubTask 9.6: 验证删除产品时MD文件正确删除（deleteDetail API测试通过）

# Task Dependencies
- [Task 2] depends on [Task 1] (需要先有MD文件才能测试后端API)
- [Task 3] depends on [Task 2] (前端API调用依赖后端接口)
- [Task 4] depends on [Task 3] (管理后台依赖前端API方法)
- [Task 5] depends on [Task 2] (数据服务层依赖后端接口行为)
- [Task 6] depends on [Task 5] (展示页依赖数据服务层)
- [Task 7] depends on [Task 5] (i18n依赖数据结构)
- [Task 8] depends on [Task 1] (打包配置依赖目录结构)
- [Task 9] depends on [Task 1-8] (测试依赖所有实现完成)
- [Task 1] 可独立执行（迁移脚本）
- [Task 2] 和 [Task 8] 可并行执行
