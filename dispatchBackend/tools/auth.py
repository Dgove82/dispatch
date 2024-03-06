from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from dispatch import models
from tools.jwt import Dgove
from tools.agiso import Agiso
from django.conf import settings


class UserAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.query_params.get('token')
        if not token:
            raise AuthenticationFailed({'code': 2001, 'msg': '未登入'})
        dg = Dgove()
        try:
            username = dg.decode(settings.KEY, token).get('username')
        except TimeoutError:
            raise AuthenticationFailed({'code': 2002, 'msg': '会话超时'})
        except ValueError:
            raise AuthenticationFailed({'code': 2003, 'msg': '非法进入'})
        user = models.User.objects.filter(username=username).first()
        if not user:
            raise AuthenticationFailed({'code': 2004, 'msg': '用户不存在'})
        return user, token





