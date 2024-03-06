from rest_framework.permissions import BasePermission


class AdminPermission(BasePermission):
    message = {'code': '2005', 'msg': '无权访问'}

    def has_permission(self, request, view):
        if not request.user:
            return False
        role = request.user.role
        if role == 0:
            return True
        return False
