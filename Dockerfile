FROM python:3.9-slim

WORKDIR /app

# 先复制依赖文件并安装（利用 Docker 缓存，避免每次改代码都重装）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制所有项目代码
COPY . .

EXPOSE 5000

# 启动命令，注意必须用 python 直接运行，且 host=0.0.0.0 已在代码中保证
CMD ["python", "app.py"]
