## 淘宝订单派单系统

### 项目介绍:

本项目是一个前后端分离的淘宝订单(基于第三方阿奇索)派单系统，旨在高效管理和派发淘宝订单。后端采用 Django构建，通过 uwsgi + nginx 部署。

### 前置条件

+ 阿奇索应用`https://open.agiso.com/#/`

#### 后端部署方法

1. 安装依赖

   ```bash
   pip install -r dispatchBackend/requirements.txt
   ```

2. 配置修改

   按需修改`dispatchBackend/config.yaml`的参数值

3. 数据库迁移

   ```bash
   python dispatchBackend/manage.py makemigrations
   python dispatchBackend/manage.py migrate
   ```

4. 添加管理员用户

   ```bash
   python dispatchBackend/manage.py admin
   # 本地运行
   python dispatchBackend/manage.py runserver
   ```

5. 配置uwsgi(本地部署略)

   ```bash
   python dispatchBackend/manage.py uwsgi
   ```

   按需修改`dispatchBackend/uwsgi.ini`的参数值

6. 配置nginx(本地部署略)

   参考配置（`/etc/nginx/sites-available/default`）

   ```
   server {
   	listen 80;
   	listen [::]:80;
   
   	server_name dispatch;
   	
   	index index.html;
   
   	location /dispatchFrontend {
   		root /var/www;
   	}
   	location /api {
   		uwsgi_pass 127.0.0.1:8000;
   		include /etc/nginx/uwsgi_params;
   	}
   }
   ```

   访问网页: `http://[ip]/dispatch/`

### 前端部署

运行前端html文件即可（非双击直接打开*.html）

(本地部署略)

修改`dispatchFrontend/js/base.js`的`baseUrl`的值改为后端所在的服务器ip（如:`http://66.66.66.66[:80]/`）

将`dispatchFrontend`拖动至 `/var/www/dispatchFrontend`(可自定义修改见nginx配置)

