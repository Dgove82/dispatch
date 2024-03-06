from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Configure for uwsgi'

    def handle(self, *args, **options):
        base_dir = settings.BASE_DIR
        config = f"""[uwsgi]
# 套接字方式的 IP地址:端口号
socket=127.0.0.1:8000
# Http通信方式的 IP地址:端口号
#http=127.0.0.1:8000
# 项目当前工作目录
chdir={base_dir}
# 上述需要换为项目文件夹的绝对路径
# 项目中wsgi.py文件的目录,相对于当前工作目录
wsgi-file={str(base_dir).split('/')[-1]}/wsgi.py
# 进程个数
process=1
# 每个进程的线程个数
threads=1
# 服务的pid记录文件
pidfile={base_dir}/uwsgi.pid
# 服务的日志文件位置
daemonize={base_dir}/uwsgi.log
"""
        with open(f"{base_dir}/uwsgi.ini", 'w') as f:
            f.write(config)
        self.stdout.write(f'配置文件已生成于{base_dir}/uwsgi.ini')
