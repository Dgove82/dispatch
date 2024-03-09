from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
# from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
import logging

logger = logging.getLogger('django')


def exception_handler(exc, context):
    # 先让DRF处理异常, 根据异常的种类进行区分
    response = drf_exception_handler(exc, context)
    if response is None:
        logger.error(f'Unhandled exception caught: {str(exc)}', exc_info=True)

    # 如果response为None，则说明这不是一个DRF可以处理的异常
    # 我们需要自己处理。
    # 或者是DRF已经处理过的AuthenticationFailed异常，我们修改下内容
    # if response is None or isinstance(exc, AuthenticationFailed):
    #     # view = context.get('view')

    # 将错误信息和HTTP状态码包装成一个字典
    if isinstance(exc, AuthenticationFailed) or isinstance(exc, PermissionDenied):
        # exc.detail已经是你自定义的错误详情
        data = exc.detail
    else:
        data = {'code': 500, 'msg': str(exc), 'data': None}

        # # 自定义返回的HTTP状态码。如果是AuthenticationFailed异常，返回401。
        # http_status = status.HTTP_401_UNAUTHORIZED if isinstance(exc,AuthenticationFailed)
        # else status.HTTP_500_INTERNAL_SERVER_ERROR

        # response = Response(data)

    return Response(data)
