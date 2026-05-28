# -*- coding: utf-8 -*-
"""
海拓選品 - Flask Web 服务器
"""

from flask import Flask, request, jsonify, send_from_directory
import os
import sys
import errno
import webbrowser
import json
import shutil
from collections import OrderedDict

def get_resource_dir():
    if getattr(sys, 'frozen', False):
        if hasattr(sys, '_MEIPASS'):
            return sys._MEIPASS
        else:
            return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))

base_dir = get_resource_dir()
os.chdir(base_dir)

app = Flask(__name__, static_folder=None, static_url_path='')

PORT = 65001
DATA_FILE = 'data.json'
SCENES_FILE = 'scenes.json'
MAPPING_FILE = 'scenes_mapping.json'
DETAIL_DIR = 'details'
DETAIL_CACHE_MAX = 128

_detail_cache = OrderedDict()

def _cache_get(key):
    if key in _detail_cache:
        _detail_cache.move_to_end(key)
        return _detail_cache[key]
    return None

def _cache_set(key, value):
    if key in _detail_cache:
        _detail_cache.move_to_end(key)
    _detail_cache[key] = value
    while len(_detail_cache) > DETAIL_CACHE_MAX:
        _detail_cache.popitem(last=False)

def _cache_delete(key):
    _detail_cache.pop(key, None)

def ensure_dir_exists(dir_path):
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)

def safe_rename_dir(old_dir, new_dir):
    if not os.path.exists(old_dir):
        return
    if os.path.exists(new_dir):
        for fname in os.listdir(old_dir):
            src = os.path.join(old_dir, fname)
            dst = os.path.join(new_dir, fname)
            if not os.path.exists(dst):
                shutil.move(src, dst)
        shutil.rmtree(old_dir, ignore_errors=True)
    else:
        shutil.move(old_dir, new_dir)

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_scenes():
    if not os.path.exists(SCENES_FILE):
        return []
    with open(SCENES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_scenes(data):
    with open(SCENES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_mapping():
    if not os.path.exists(MAPPING_FILE):
        return []
    with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_mapping(data):
    with open(MAPPING_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def image_path_to_detail_path(image_path, lang):
    rel_path = image_path.replace('\\', '/')
    if rel_path.startswith('images/'):
        rel_path = rel_path[len('images/'):]
    base = os.path.splitext(rel_path)[0]
    return os.path.join(DETAIL_DIR, base + '_' + lang + '.md')

def convert_to_webp(file_stream, quality=90):
    from PIL import Image, ImageCms
    import io

    img = Image.open(file_stream)

    if getattr(img, 'is_animated', False):
        img.seek(0)

    if img.mode in ('P', 'PA'):
        img = img.convert('RGBA')
    elif img.mode == 'LA':
        img = img.convert('RGBA')
    elif img.mode == 'L':
        img = img.convert('RGB')
    elif img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA')

    buffer = io.BytesIO()
    save_kwargs = {'format': 'WEBP', 'quality': quality}

    if 'icc_profile' in img.info:
        save_kwargs['icc_profile'] = img.info['icc_profile']
    else:
        try:
            srgb = ImageCms.createProfile('sRGB')
            save_kwargs['icc_profile'] = ImageCms.ImageCmsProfile(srgb).tobytes()
        except Exception:
            pass

    img.save(buffer, **save_kwargs)
    buffer.seek(0)
    return buffer

@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        if not os.path.exists(DATA_FILE):
            return jsonify({'error': '数据文件不存在'}), 404

        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify({
            'success': True,
            'data': data
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/scenes', methods=['GET'])
def get_scenes():
    try:
        if not os.path.exists(SCENES_FILE):
            return jsonify({'success': True, 'data': []})

        with open(SCENES_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify({
            'success': True,
            'data': data
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/mapping', methods=['GET'])
def get_mapping():
    try:
        if not os.path.exists(MAPPING_FILE):
            return jsonify({'success': True, 'data': []})

        with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify({
            'success': True,
            'data': data
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/detail', methods=['GET'])
def get_detail():
    image_path = request.args.get('path', '')
    lang = request.args.get('lang', 'jp')

    if not image_path:
        return jsonify({'success': False, 'error': '缺少 path 参数'}), 400

    detail_path = image_path_to_detail_path(image_path, lang)
    detail_path = os.path.normpath(detail_path)

    detail_full = os.path.join(base_dir, detail_path)
    detail_full = os.path.normpath(detail_full)

    if not detail_full.startswith(os.path.normpath(base_dir)):
        return jsonify({'success': False, 'error': '非法路径'}), 400

    cached = _cache_get(detail_path)
    if cached is not None:
        return jsonify({'success': True, 'content': cached})

    if not os.path.exists(detail_full):
        return jsonify({'success': True, 'content': ''})

    try:
        with open(detail_full, 'r', encoding='utf-8') as f:
            content = f.read()
        _cache_set(detail_path, content)
        return jsonify({'success': True, 'content': content})
    except FileNotFoundError:
        return jsonify({'success': False, 'error': '文件不存在'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==========================================
# 管理后台 API
# ==========================================

@app.route('/api/admin/scenes', methods=['GET'])
def admin_get_scenes():
    try:
        data = load_scenes()
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/scenes', methods=['PUT'])
def admin_update_scenes():
    try:
        body = request.get_json()
        data = body.get('data', [])
        save_scenes(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/mapping', methods=['GET'])
def admin_get_mapping():
    try:
        data = load_mapping()
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/mapping', methods=['PUT'])
def admin_update_mapping():
    try:
        body = request.get_json()
        data = body.get('data', [])
        save_mapping(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/data', methods=['GET'])
def admin_get_data():
    try:
        data = load_data()
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/category', methods=['POST'])
def admin_add_category():
    try:
        body = request.get_json()
        name_cn = body.get('name_cn', '').strip()
        name_jp = body.get('name_jp', '').strip()
        if not name_cn:
            return jsonify({'success': False, 'error': '中文名称不能为空'}), 400

        data = load_data()
        data.append({
            'name_cn': name_cn,
            'name_jp': name_jp,
            'children': []
        })
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/category/<int:cat_idx>', methods=['PUT'])
def admin_update_category(cat_idx):
    try:
        body = request.get_json()
        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400

        old_name_cn = data[cat_idx].get('name_cn', '')
        new_name_cn = body.get('name_cn', '').strip()
        new_name_jp = body.get('name_jp', '').strip()

        if not new_name_cn:
            return jsonify({'success': False, 'error': '中文名称不能为空'}), 400

        if old_name_cn != new_name_cn:
            old_image_dir = os.path.join('images', old_name_cn)
            new_image_dir = os.path.join('images', new_name_cn)
            safe_rename_dir(old_image_dir, new_image_dir)

            old_detail_dir = os.path.join('details', old_name_cn)
            new_detail_dir = os.path.join('details', new_name_cn)
            safe_rename_dir(old_detail_dir, new_detail_dir)

            for sub in data[cat_idx].get('children', []):
                old_sub_name = sub.get('name_cn', '')
                for prod in sub.get('products', []):
                    for img in prod.get('images', []):
                        img['path'] = img['path'].replace(
                            'images/' + old_name_cn + '/',
                            'images/' + new_name_cn + '/',
                            1
                        )

        data[cat_idx]['name_cn'] = new_name_cn
        data[cat_idx]['name_jp'] = new_name_jp
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def remove_product_from_mapping(product_name):
    if not os.path.exists(MAPPING_FILE):
        return
    try:
        mapping = load_mapping()
        new_mapping = [item for item in mapping if item.get('productname') != product_name]
        if len(new_mapping) != len(mapping):
            save_mapping(new_mapping)
    except Exception:
        pass

def rename_product_in_mapping(old_name, new_name):
    if not os.path.exists(MAPPING_FILE):
        return
    try:
        mapping = load_mapping()
        changed = False
        for item in mapping:
            if item.get('productname') == old_name:
                item['productname'] = new_name
                changed = True
        if changed:
            save_mapping(mapping)
    except Exception:
        pass

def delete_product_details(cat_name, sub_name, prod_name):
    detail_dir = os.path.join('details', cat_name, sub_name)
    if not os.path.exists(detail_dir):
        return
    for fname in os.listdir(detail_dir):
        base_no_ext = os.path.splitext(fname)[0]
        if base_no_ext == prod_name or base_no_ext.startswith(prod_name + '_'):
            full_path = os.path.join(detail_dir, fname)
            try:
                os.remove(full_path)
            except Exception:
                pass
            cache_key = os.path.normpath(os.path.join(DETAIL_DIR, cat_name, sub_name, fname))
            _cache_delete(cache_key)

@app.route('/api/admin/category/<int:cat_idx>', methods=['DELETE'])
def admin_delete_category(cat_idx):
    try:
        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400

        cat = data[cat_idx]
        cat_name = cat.get('name_cn', '')
        image_dir = os.path.join('images', cat_name)
        if os.path.exists(image_dir):
            shutil.rmtree(image_dir, ignore_errors=True)
        detail_dir = os.path.join('details', cat_name)
        if os.path.exists(detail_dir):
            shutil.rmtree(detail_dir, ignore_errors=True)

        for sub in cat.get('children', []):
            for prod in sub.get('products', []):
                prod_name = prod.get('name_cn', '')
                if prod_name:
                    remove_product_from_mapping(prod_name)

        data.pop(cat_idx)
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/categories/sort', methods=['PUT'])
def admin_sort_categories():
    try:
        body = request.get_json()
        order = body.get('order', [])
        data = load_data()
        if len(order) != len(data):
            return jsonify({'success': False, 'error': '排序索引数量不匹配'}), 400

        new_data = [data[i] for i in order]
        save_data(new_data)
        return jsonify({'success': True, 'data': new_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/category/<int:cat_idx>/subcategory', methods=['POST'])
def admin_add_subcategory(cat_idx):
    try:
        body = request.get_json()
        name_cn = body.get('name_cn', '').strip()
        name_jp = body.get('name_jp', '').strip()
        if not name_cn:
            return jsonify({'success': False, 'error': '中文名称不能为空'}), 400

        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400

        data[cat_idx].setdefault('children', []).append({
            'name_cn': name_cn,
            'name_jp': name_jp,
            'products': []
        })

        cat_name = data[cat_idx]['name_cn']
        image_dir = os.path.join('images', cat_name, name_cn)
        ensure_dir_exists(image_dir)

        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subcategory/<int:cat_idx>/<int:sub_idx>', methods=['PUT'])
def admin_update_subcategory(cat_idx, sub_idx):
    try:
        body = request.get_json()
        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400
        children = data[cat_idx].get('children', [])
        if sub_idx < 0 or sub_idx >= len(children):
            return jsonify({'success': False, 'error': '子分类索引无效'}), 400

        cat_name = data[cat_idx]['name_cn']
        old_sub_name = children[sub_idx].get('name_cn', '')
        new_name_cn = body.get('name_cn', '').strip()
        new_name_jp = body.get('name_jp', '').strip()

        if not new_name_cn:
            return jsonify({'success': False, 'error': '中文名称不能为空'}), 400

        if old_sub_name != new_name_cn:
            old_image_dir = os.path.join('images', cat_name, old_sub_name)
            new_image_dir = os.path.join('images', cat_name, new_name_cn)
            safe_rename_dir(old_image_dir, new_image_dir)

            old_detail_dir = os.path.join('details', cat_name, old_sub_name)
            new_detail_dir = os.path.join('details', cat_name, new_name_cn)
            safe_rename_dir(old_detail_dir, new_detail_dir)

            for prod in children[sub_idx].get('products', []):
                for img in prod.get('images', []):
                    img['path'] = img['path'].replace(
                        'images/' + cat_name + '/' + old_sub_name + '/',
                        'images/' + cat_name + '/' + new_name_cn + '/',
                        1
                    )

        children[sub_idx]['name_cn'] = new_name_cn
        children[sub_idx]['name_jp'] = new_name_jp
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subcategory/<int:cat_idx>/<int:sub_idx>', methods=['DELETE'])
def admin_delete_subcategory(cat_idx, sub_idx):
    try:
        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400
        children = data[cat_idx].get('children', [])
        if sub_idx < 0 or sub_idx >= len(children):
            return jsonify({'success': False, 'error': '子分类索引无效'}), 400

        cat_name = data[cat_idx]['name_cn']
        sub_name = children[sub_idx].get('name_cn', '')
        image_dir = os.path.join('images', cat_name, sub_name)
        if os.path.exists(image_dir):
            shutil.rmtree(image_dir, ignore_errors=True)
        detail_dir = os.path.join('details', cat_name, sub_name)
        if os.path.exists(detail_dir):
            shutil.rmtree(detail_dir, ignore_errors=True)

        for prod in children[sub_idx].get('products', []):
            prod_name = prod.get('name_cn', '')
            if prod_name:
                remove_product_from_mapping(prod_name)

        children.pop(sub_idx)
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/category/<int:cat_idx>/subcategories/sort', methods=['PUT'])
def admin_sort_subcategories(cat_idx):
    try:
        body = request.get_json()
        order = body.get('order', [])
        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400
        children = data[cat_idx].get('children', [])
        if len(order) != len(children):
            return jsonify({'success': False, 'error': '排序索引数量不匹配'}), 400

        data[cat_idx]['children'] = [children[i] for i in order]
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subcategory/<int:cat_idx>/<int:sub_idx>/product', methods=['POST'])
def admin_add_product(cat_idx, sub_idx):
    try:
        body = request.get_json()
        name_cn = body.get('name_cn', '').strip()
        name_jp = body.get('name_jp', '').strip()
        images = body.get('images', [])
        if not name_cn:
            return jsonify({'success': False, 'error': '中文名称不能为空'}), 400

        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400
        children = data[cat_idx].get('children', [])
        if sub_idx < 0 or sub_idx >= len(children):
            return jsonify({'success': False, 'error': '子分类索引无效'}), 400

        children[sub_idx].setdefault('products', []).append({
            'name_cn': name_cn,
            'name_jp': name_jp,
            'images': images
        })
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/product/<int:cat_idx>/<int:sub_idx>/<int:prod_idx>', methods=['PUT'])
def admin_update_product(cat_idx, sub_idx, prod_idx):
    try:
        body = request.get_json()
        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400
        children = data[cat_idx].get('children', [])
        if sub_idx < 0 or sub_idx >= len(children):
            return jsonify({'success': False, 'error': '子分类索引无效'}), 400
        products = children[sub_idx].get('products', [])
        if prod_idx < 0 or prod_idx >= len(products):
            return jsonify({'success': False, 'error': '产品索引无效'}), 400

        name_cn = body.get('name_cn', '').strip()
        name_jp = body.get('name_jp', '').strip()
        images = body.get('images', None)

        if not name_cn:
            return jsonify({'success': False, 'error': '中文名称不能为空'}), 400

        old_name_cn = products[prod_idx].get('name_cn', '')

        if old_name_cn != name_cn:
            cat_name = data[cat_idx]['name_cn']
            sub_name = children[sub_idx]['name_cn']

            detail_dir = os.path.join('details', cat_name, sub_name)
            if os.path.exists(detail_dir):
                for fname in list(os.listdir(detail_dir)):
                    base_no_ext = os.path.splitext(fname)[0]
                    if base_no_ext == old_name_cn or base_no_ext.startswith(old_name_cn + '_'):
                        old_file = os.path.join(detail_dir, fname)
                        new_base = base_no_ext.replace(old_name_cn, name_cn, 1)
                        ext = os.path.splitext(fname)[1]
                        new_fname = new_base + ext
                        new_file = os.path.join(detail_dir, new_fname)
                        if os.path.exists(old_file) and not os.path.exists(new_file):
                            os.rename(old_file, new_file)
                        old_cache_key = os.path.normpath(os.path.join(DETAIL_DIR, cat_name, sub_name, fname))
                        _cache_delete(old_cache_key)

            image_dir = os.path.join('images', cat_name, sub_name)
            if os.path.exists(image_dir):
                for fname in list(os.listdir(image_dir)):
                    base_no_ext = os.path.splitext(fname)[0]
                    if base_no_ext == old_name_cn or base_no_ext.startswith(old_name_cn + '_'):
                        old_file = os.path.join(image_dir, fname)
                        new_base = base_no_ext.replace(old_name_cn, name_cn, 1)
                        ext = os.path.splitext(fname)[1]
                        new_fname = new_base + ext
                        new_file = os.path.join(image_dir, new_fname)
                        if os.path.exists(old_file) and not os.path.exists(new_file):
                            os.rename(old_file, new_file)

            for img in products[prod_idx].get('images', []):
                old_prefix = 'images/' + cat_name + '/' + sub_name + '/' + old_name_cn
                new_prefix = 'images/' + cat_name + '/' + sub_name + '/' + name_cn
                img['path'] = img['path'].replace(old_prefix, new_prefix, 1)

            if images is not None:
                for img in images:
                    old_prefix = 'images/' + cat_name + '/' + sub_name + '/' + old_name_cn
                    new_prefix = 'images/' + cat_name + '/' + sub_name + '/' + name_cn
                    img['path'] = img['path'].replace(old_prefix, new_prefix, 1)

            rename_product_in_mapping(old_name_cn, name_cn)

        products[prod_idx]['name_cn'] = name_cn
        products[prod_idx]['name_jp'] = name_jp
        if images is not None:
            products[prod_idx]['images'] = images
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/product/<int:cat_idx>/<int:sub_idx>/<int:prod_idx>', methods=['DELETE'])
def admin_delete_product(cat_idx, sub_idx, prod_idx):
    try:
        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400
        children = data[cat_idx].get('children', [])
        if sub_idx < 0 or sub_idx >= len(children):
            return jsonify({'success': False, 'error': '子分类索引无效'}), 400
        products = children[sub_idx].get('products', [])
        if prod_idx < 0 or prod_idx >= len(products):
            return jsonify({'success': False, 'error': '产品索引无效'}), 400

        cat_name = data[cat_idx]['name_cn']
        sub_name = children[sub_idx]['name_cn']
        prod = products[prod_idx]
        prod_name = prod.get('name_cn', '')

        for img in prod.get('images', []):
            img_path = img.get('path', '')
            if img_path:
                full_path = os.path.join(base_dir, img_path)
                if os.path.exists(full_path):
                    os.remove(full_path)

        delete_product_details(cat_name, sub_name, prod_name)

        if prod_name:
            remove_product_from_mapping(prod_name)

        products.pop(prod_idx)
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subcategory/<int:cat_idx>/<int:sub_idx>/products/sort', methods=['PUT'])
def admin_sort_products(cat_idx, sub_idx):
    try:
        body = request.get_json()
        order = body.get('order', [])
        data = load_data()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400
        children = data[cat_idx].get('children', [])
        if sub_idx < 0 or sub_idx >= len(children):
            return jsonify({'success': False, 'error': '子分类索引无效'}), 400
        products = children[sub_idx].get('products', [])
        if len(order) != len(products):
            return jsonify({'success': False, 'error': '排序索引数量不匹配'}), 400

        children[sub_idx]['products'] = [products[i] for i in order]
        save_data(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/upload', methods=['POST'])
def admin_upload():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': '没有上传文件'}), 400

        file = request.files['file']
        cat_name = request.form.get('category', '').strip()
        sub_name = request.form.get('subcategory', '').strip()
        custom_name = request.form.get('filename', '').strip()

        if not cat_name or not sub_name:
            return jsonify({'success': False, 'error': '缺少分类信息'}), 400

        if file.filename == '':
            return jsonify({'success': False, 'error': '文件名为空'}), 400

        target_dir = os.path.join('images', cat_name, sub_name)
        ensure_dir_exists(target_dir)

        if custom_name:
            base = os.path.splitext(custom_name)[0]
        else:
            base = os.path.splitext(file.filename)[0]
        filename = base + '.webp'

        filepath = os.path.join(target_dir, filename)
        webp_data = convert_to_webp(file.stream)
        with open(filepath, 'wb') as f:
            f.write(webp_data.read())

        rel_path = 'images/' + cat_name + '/' + sub_name + '/' + filename
        return jsonify({'success': True, 'path': rel_path})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/upload-detail-image', methods=['POST'])
def admin_upload_detail_image():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': '没有上传文件'}), 400

        file = request.files['file']
        cat_name = request.form.get('category', '').strip()
        sub_name = request.form.get('subcategory', '').strip()
        product_name = request.form.get('product', '').strip()

        if not cat_name or not sub_name or not product_name:
            return jsonify({'success': False, 'error': '缺少分类或产品信息'}), 400

        if file.filename == '':
            return jsonify({'success': False, 'error': '文件名为空'}), 400

        target_dir = os.path.join('details', cat_name, sub_name)
        ensure_dir_exists(target_dir)

        filename = product_name + '.webp'
        filepath = os.path.join(target_dir, filename)
        webp_data = convert_to_webp(file.stream)
        with open(filepath, 'wb') as f:
            f.write(webp_data.read())

        rel_path = 'details/' + cat_name + '/' + sub_name + '/' + filename
        return jsonify({'success': True, 'path': rel_path})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/detail', methods=['GET'])
def admin_get_detail():
    cat_name = request.args.get('category', '').strip()
    sub_name = request.args.get('subcategory', '').strip()
    product_name = request.args.get('product', '').strip()
    lang = request.args.get('lang', 'cn')

    if not cat_name or not sub_name or not product_name:
        return jsonify({'success': False, 'error': '缺少参数'}), 400

    detail_dir = os.path.join('details', cat_name, sub_name)
    md_filename = product_name + '_' + lang + '.md'
    md_path = os.path.join(detail_dir, md_filename)

    img_path = None
    for img_ext in ['webp', 'png', 'jpg', 'jpeg', 'gif']:
        candidate = os.path.join(detail_dir, product_name + '.' + img_ext)
        if os.path.exists(candidate):
            img_path = 'details/' + cat_name + '/' + sub_name + '/' + product_name + '.' + img_ext
            break

    content = ''
    if os.path.exists(md_path):
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()

    return jsonify({'success': True, 'content': content, 'detail_image': img_path})

@app.route('/api/admin/detail', methods=['PUT'])
def admin_save_detail():
    try:
        body = request.get_json()
        cat_name = body.get('category', '').strip()
        sub_name = body.get('subcategory', '').strip()
        product_name = body.get('product', '').strip()
        lang = body.get('lang', 'cn')
        content = body.get('content', '')

        if not cat_name or not sub_name or not product_name:
            return jsonify({'success': False, 'error': '缺少参数'}), 400

        detail_dir = os.path.join('details', cat_name, sub_name)
        ensure_dir_exists(detail_dir)

        md_filename = product_name + '_' + lang + '.md'
        md_path = os.path.join(detail_dir, md_filename)

        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(content)

        cache_key = os.path.join(DETAIL_DIR, cat_name, sub_name, md_filename)
        cache_key = os.path.normpath(cache_key)
        _cache_set(cache_key, content)

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/detail-image', methods=['DELETE'])
def admin_delete_detail_image():
    try:
        body = request.get_json()
        cat_name = body.get('category', '').strip()
        sub_name = body.get('subcategory', '').strip()
        product_name = body.get('product', '').strip()

        if not cat_name or not sub_name or not product_name:
            return jsonify({'success': False, 'error': '缺少参数'}), 400

        detail_dir = os.path.join('details', cat_name, sub_name)
        if not os.path.exists(detail_dir):
            return jsonify({'success': True})

        deleted = False
        for img_ext in ['webp', 'png', 'jpg', 'jpeg', 'gif']:
            candidate = os.path.join(detail_dir, product_name + '.' + img_ext)
            if os.path.exists(candidate):
                try:
                    os.remove(candidate)
                    deleted = True
                except Exception:
                    pass
                cache_key = os.path.normpath(os.path.join(DETAIL_DIR, cat_name, sub_name, product_name + '.' + img_ext))
                _cache_delete(cache_key)

        return jsonify({'success': True, 'deleted': deleted})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/product-scenes', methods=['GET'])
def admin_get_product_scenes():
    product_name = request.args.get('product', '').strip()
    if not product_name:
        return jsonify({'success': True, 'scenes': []})

    try:
        if not os.path.exists(MAPPING_FILE):
            return jsonify({'success': True, 'scenes': []})

        with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
            mapping = json.load(f)

        scenes = []
        for item in mapping:
            if item.get('productname') == product_name:
                scene_name = item.get('scene', '').strip()
                if scene_name:
                    scenes.append(scene_name)

        return jsonify({'success': True, 'scenes': scenes})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/scene-products', methods=['GET'])
def admin_get_scene_products():
    scene_name = request.args.get('scene', '').strip()
    if not scene_name:
        return jsonify({'success': True, 'products': []})

    try:
        if not os.path.exists(MAPPING_FILE):
            return jsonify({'success': True, 'products': []})

        with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
            mapping = json.load(f)

        products = []
        for item in mapping:
            if item.get('scene') == scene_name:
                product_name = item.get('productname', '').strip()
                if product_name:
                    products.append(product_name)

        return jsonify({'success': True, 'products': products})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/scene-category', methods=['POST'])
def admin_add_scene_category():
    try:
        body = request.get_json()
        name_cn = body.get('name_cn', '').strip()
        name_jp = body.get('name_jp', '').strip()
        if not name_cn:
            return jsonify({'success': False, 'error': '场景分类中文名称不能为空'}), 400

        data = load_scenes()
        data.append({
            'name_cn': name_cn,
            'name_jp': name_jp,
            'scenes': []
        })
        save_scenes(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/scene-category/<int:idx>', methods=['PUT'])
def admin_update_scene_category(idx):
    try:
        body = request.get_json()
        data = load_scenes()
        if idx < 0 or idx >= len(data):
            return jsonify({'success': False, 'error': '场景分类索引无效'}), 400

        name_cn = body.get('name_cn', '').strip()
        name_jp = body.get('name_jp', '').strip()
        if not name_cn:
            return jsonify({'success': False, 'error': '场景分类中文名称不能为空'}), 400

        old_name_cn = data[idx].get('name_cn', '')
        if old_name_cn != name_cn:
            old_dir = os.path.join('scenes', old_name_cn)
            new_dir = os.path.join('scenes', name_cn)
            safe_rename_dir(old_dir, new_dir)

            for scene in data[idx].get('scenes', []):
                for img in scene.get('images', []):
                    img['path'] = img['path'].replace(
                        'scenes/' + old_name_cn + '/',
                        'scenes/' + name_cn + '/',
                        1
                    )

        data[idx]['name_cn'] = name_cn
        data[idx]['name_jp'] = name_jp
        save_scenes(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/scene-category/<int:idx>', methods=['DELETE'])
def admin_delete_scene_category(idx):
    try:
        data = load_scenes()
        if idx < 0 or idx >= len(data):
            return jsonify({'success': False, 'error': '场景分类索引无效'}), 400

        cat = data[idx]
        cat_name = cat.get('name_cn', '')
        scene_dir = os.path.join('scenes', cat_name)
        if os.path.exists(scene_dir):
            shutil.rmtree(scene_dir, ignore_errors=True)

        mapping = load_mapping()
        for scene in cat.get('scenes', []):
            scene_name = scene.get('name_cn', '')
            if scene_name:
                mapping = [item for item in mapping if item.get('scene') != scene_name]
        save_mapping(mapping)

        data.pop(idx)
        save_scenes(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/scene-category/<int:idx>/scene', methods=['POST'])
def admin_add_scene(idx):
    try:
        body = request.get_json()
        name_cn = body.get('name_cn', '').strip()
        name_jp = body.get('name_jp', '').strip()
        if not name_cn:
            return jsonify({'success': False, 'error': '场景中文名称不能为空'}), 400

        data = load_scenes()
        if idx < 0 or idx >= len(data):
            return jsonify({'success': False, 'error': '场景分类索引无效'}), 400

        data[idx].setdefault('scenes', []).append({
            'name_cn': name_cn,
            'name_jp': name_jp,
            'images': []
        })
        save_scenes(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/scene/<int:cat_idx>/<int:scene_idx>', methods=['PUT'])
def admin_update_scene(cat_idx, scene_idx):
    try:
        body = request.get_json()
        data = load_scenes()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '场景分类索引无效'}), 400
        scenes = data[cat_idx].get('scenes', [])
        if scene_idx < 0 or scene_idx >= len(scenes):
            return jsonify({'success': False, 'error': '场景索引无效'}), 400

        name_cn = body.get('name_cn', '').strip()
        name_jp = body.get('name_jp', '').strip()
        if not name_cn:
            return jsonify({'success': False, 'error': '场景中文名称不能为空'}), 400

        old_name_cn = scenes[scene_idx].get('name_cn', '')
        cat_name = data[cat_idx].get('name_cn', '')

        if old_name_cn != name_cn:
            old_file = os.path.join('scenes', cat_name, old_name_cn + '.webp')
            new_file = os.path.join('scenes', cat_name, name_cn + '.webp')
            if os.path.exists(old_file):
                os.rename(old_file, new_file)
            for img in scenes[scene_idx].get('images', []):
                img['path'] = img['path'].replace(
                    'scenes/' + cat_name + '/' + old_name_cn + '.webp',
                    'scenes/' + cat_name + '/' + name_cn + '.webp',
                    1
                )
            mapping = load_mapping()
            for item in mapping:
                if item.get('scene') == old_name_cn:
                    item['scene'] = name_cn
            save_mapping(mapping)

        scenes[scene_idx]['name_cn'] = name_cn
        scenes[scene_idx]['name_jp'] = name_jp
        save_scenes(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/scene/<int:cat_idx>/<int:scene_idx>', methods=['DELETE'])
def admin_delete_scene(cat_idx, scene_idx):
    try:
        data = load_scenes()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '场景分类索引无效'}), 400
        scenes = data[cat_idx].get('scenes', [])
        if scene_idx < 0 or scene_idx >= len(scenes):
            return jsonify({'success': False, 'error': '场景索引无效'}), 400

        cat_name = data[cat_idx].get('name_cn', '')
        scene_name = scenes[scene_idx].get('name_cn', '')

        for img in scenes[scene_idx].get('images', []):
            img_path = img.get('path', '')
            if img_path:
                full_path = os.path.join(base_dir, img_path)
                if os.path.exists(full_path):
                    os.remove(full_path)

        scene_file = os.path.join('scenes', cat_name, scene_name + '.webp')
        if os.path.exists(scene_file):
            os.remove(scene_file)

        if scene_name:
            mapping = load_mapping()
            mapping = [item for item in mapping if item.get('scene') != scene_name]
            save_mapping(mapping)

        scenes.pop(scene_idx)
        save_scenes(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/scene-category/<int:cat_idx>/scenes/sort', methods=['PUT'])
def admin_sort_scenes(cat_idx):
    try:
        body = request.get_json()
        order = body.get('order', [])
        data = load_scenes()
        if cat_idx < 0 or cat_idx >= len(data):
            return jsonify({'success': False, 'error': '分类索引无效'}), 400
        scenes = data[cat_idx].get('scenes', [])
        if len(order) != len(scenes):
            return jsonify({'success': False, 'error': '排序索引数量不匹配'}), 400

        data[cat_idx]['scenes'] = [scenes[i] for i in order]
        save_scenes(data)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/upload-scene-image', methods=['POST'])
def admin_upload_scene_image():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': '没有上传文件'}), 400

        file = request.files['file']
        category_cn = request.form.get('category_cn', '').strip()
        scene_cn = request.form.get('scene_cn', '').strip()

        if not category_cn or not scene_cn:
            return jsonify({'success': False, 'error': '缺少分类或场景信息'}), 400

        if file.filename == '':
            return jsonify({'success': False, 'error': '文件名为空'}), 400

        target_dir = os.path.join('scenes', category_cn)
        ensure_dir_exists(target_dir)

        filename = scene_cn + '.webp'
        filepath = os.path.join(target_dir, filename)
        webp_data = convert_to_webp(file.stream)
        with open(filepath, 'wb') as f:
            f.write(webp_data.read())

        rel_path = 'scenes/' + category_cn + '/' + filename

        data = load_scenes()
        for cat in data:
            if cat.get('name_cn') == category_cn:
                for scene in cat.get('scenes', []):
                    if scene.get('name_cn') == scene_cn:
                        existing = [img for img in scene.get('images', []) if img.get('path') == rel_path]
                        if not existing:
                            scene.setdefault('images', []).append({'path': rel_path})
                        break
                break
        save_scenes(data)

        return jsonify({'success': True, 'path': rel_path})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/product-scenes', methods=['PUT'])
def admin_update_product_scenes():
    try:
        body = request.get_json()
        product = body.get('product', '').strip()
        scenes = body.get('scenes', [])

        if not product:
            return jsonify({'success': False, 'error': '产品名称不能为空'}), 400

        mapping = load_mapping()
        mapping = [item for item in mapping if item.get('productname') != product]

        unique_scenes = list(dict.fromkeys(scenes))
        for scene_name in unique_scenes:
            scene_name = scene_name.strip()
            if scene_name:
                mapping.append({'productname': product, 'scene': scene_name})

        save_mapping(mapping)
        return jsonify({'success': True, 'data': mapping})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/scene-products', methods=['PUT'])
def admin_update_scene_products():
    try:
        body = request.get_json()
        scene = body.get('scene', '').strip()
        products = body.get('products', [])

        if not scene:
            return jsonify({'success': False, 'error': '场景名称不能为空'}), 400

        mapping = load_mapping()
        mapping = [item for item in mapping if item.get('scene') != scene]

        unique_products = list(dict.fromkeys(products))
        for product_name in unique_products:
            product_name = product_name.strip()
            if product_name:
                mapping.append({'productname': product_name, 'scene': scene})

        save_mapping(mapping)
        return jsonify({'success': True, 'data': mapping})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==========================================
# 页面路由
# ==========================================

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/manage.html')
def manage():
    return send_from_directory('.', 'manage.html')

@app.route('/scene.html')
def scene():
    return send_from_directory('.', 'scene.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('images', filename)

@app.route('/details/<path:filename>')
def serve_details(filename):
    return send_from_directory('details', filename)

@app.route('/scenes/<path:filename>')
def serve_scenes(filename):
    return send_from_directory('scenes', filename)

@app.route('/<filename>')
def serve_root_file(filename):
    allowed_root_exts = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'svg', 'html', 'json'}
    if '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_root_exts:
        if os.path.exists(filename):
            return send_from_directory('.', filename)
    return '', 404

@app.route('/favicon.ico')
def favicon():
    if os.path.exists('logo1.png'):
        return send_from_directory('.', 'logo1.png', mimetype='image/png')
    else:
        return '', 204

def main():
    print("=" * 70)
    print("海拓選品 - Flask Web 服务器")
    print("=" * 70)
    print("\n项目目录: " + base_dir)
    print("启动端口: " + str(PORT))

    if not os.path.exists('index.html'):
        print("\n错误：index.html 不存在！")
        input("\n按 Enter 键退出...")
        return

    if not os.path.exists('data.json'):
        print("\n警告：data.json 不存在！")

    if not os.path.exists('scenes.json'):
        print("\n警告：scenes.json 不存在！")

    if not os.path.exists('scenes_mapping.json'):
        print("\n警告：scenes_mapping.json 不存在！")

    ensure_dir_exists('images')
    ensure_dir_exists('scenes')

    url = "http://localhost:" + str(PORT)

    print("\n服务器启动成功！")
    print("访问地址: " + url)
    print("管理后台: " + url + "/manage.html")
    print("\n" + "=" * 70)
    print("按 Ctrl+C 停止服务器")
    print("=" * 70)

    try:
        webbrowser.open(url)
        print("\n已自动打开浏览器...")
    except Exception:
        print("\n无法自动打开浏览器，请手动访问: " + url)

    try:
        app.run(host='0.0.0.0', port=PORT, debug=True, use_reloader=False)
    except OSError as e:
        if e.errno == errno.EADDRINUSE:
            print("\n错误：端口 " + str(PORT) + " 已被占用！")
        else:
            print("\n服务器启动失败: " + str(e))
        input("\n按 Enter 键退出...")
    except KeyboardInterrupt:
        print("\n\n服务器已停止。")
    except Exception as e:
        print("\n发生错误: " + str(e))
        input("\n按 Enter 键退出...")

if __name__ == "__main__":
    main()
