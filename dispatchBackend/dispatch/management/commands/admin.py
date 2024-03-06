from django.core.management.base import BaseCommand, CommandError
from dispatch.models import User
from tools.jwt import Dgove


class Command(BaseCommand):
    help = "Initialize user of admin"

    # def add_arguments(self, parser):
    #     parser.add_argument('password', nargs='?', type=str, help='Password is necessary')

    def handle(self, *args, **options):
        username = input("请输入管理员用户名: ")
        if not username:
            raise CommandError("管理员用户名不能为空")
        user = User.objects.filter(username=username).first()
        if not user:
            password = input("[新增]\n请输入密码: ")
            re_password = input('请再次输入密码: ')
            if not password or password != re_password:
                raise CommandError("密码不一致或未填")
            User.objects.create(username="admin", uname="管理员", password=Dgove.md5(password), role=0)
            self.stdout.write('管理员用户注入完毕')
        else:
            password = input("[修改]\n请输入密码: ")
            re_password = input('请再次输入密码: ')
            if not password or password != re_password:
                raise CommandError("密码不一致或未填")
            user.password = Dgove.md5(password)
            user.save()
            self.stdout.write('密码修改完毕')
