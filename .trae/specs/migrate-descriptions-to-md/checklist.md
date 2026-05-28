# Checklist - 产品描述迁移至MD文件

## 迁移脚本
- [x] migrate_to_md.py 脚本可以正确执行，将data.json中的描述提取到MD文件
- [x] 迁移后 detail/ 目录结构与 images/ 目录结构一致
- [x] 迁移后 data.json 中不再包含 description_cn/description_jp 字段
- [x] 迁移前自动备份 data.json
- [x] MD文件内容与原data.json中的描述内容一致
- [x] 空描述也生成对应的空MD文件

## 后端API
- [x] GET /api/detail?path=xxx 能正确返回MD文件内容
- [x] GET /api/detail 对不存在的MD文件返回空字符串而非错误
- [x] POST /api/save-detail 能正确保存MD文件内容
- [x] POST /api/save-detail 能自动创建不存在的目录
- [x] GET /api/data 返回的数据中包含从MD文件读取的 description_cn/description_jp
- [x] POST /api/data 保存时自动提取描述写入MD文件，data.json中不含描述字段
- [x] image_path_to_detail_path() 辅助函数路径推导正确

## 前端 - 展示页
- [x] 展示页产品详情模态框中图片描述正常显示
- [x] 中文/日文语言切换后描述正确切换
- [x] 无描述的图片不显示描述区域（与当前行为一致）
- [x] 描述中的换行符正确渲染

## 前端 - 管理后台
- [x] 管理后台图片描述编辑模态框正常工作
- [x] 保存描述后MD文件内容正确更新
- [x] 新增产品时为每张图片创建对应MD文件
- [x] 删除产品时同步删除对应MD文件
- [x] 编辑产品时图片描述正确加载和保存

## 直接编辑MD文件
- [x] 直接编辑MD文件后刷新展示页，描述内容更新
- [x] 直接编辑MD文件后刷新管理页，描述内容更新
- [x] 管理后台编辑描述后，MD文件内容与界面显示一致

## 打包配置
- [x] build_all.py 包含 detail/ 目录
- [x] PyInstaller .spec 文件包含 detail/ 目录
- [ ] 打包后的程序能正确读写MD文件（需实际打包后验证）

## 数据完整性
- [x] 迁移前后展示页显示内容完全一致
- [x] 迁移前后管理后台功能完全一致
- [x] data.json 文件体积减小（描述内容已移出）
