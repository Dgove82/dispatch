from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from dispatch import models
from tools.jwt import Dgove
from tools.ser import UserSerializer, UpdateUserSerializer, OrderSerializer, ShopSerializer, BillSerializer, \
    CashOutSerializer, GetCashSerializer, LogSerializer
from tools.auth import UserAuthentication
from tools.permission import AdminPermission
from tools.agiso import Agiso
from django.conf import settings
from django.http import HttpResponseRedirect
from datetime import datetime
from django.db.models.query import QuerySet
import json


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'code': 1001, 'msg': '用户名或密码为空'})
        password = Dgove.md5(password)
        user = models.User.objects.filter(username=username).first()
        if not user:
            return Response({'code': 1002, 'msg': '用户名或密码错误'})
        if user.password != password:
            return Response({'code': 1002, 'msg': '用户名或密码错误'})
        payload = {'username': username}
        dg = Dgove()
        token = dg.encode(settings.KEY, payload, exp=3600 * 24 * 30)
        data = {'token': token}
        if user.role == 0:
            data["role"] = 0
        data["id"] = user.id
        Log(things='进入了系统', target=user.username).info()
        return Response({'code': 200, 'msg': 'login successfully', 'data': data})


class BillView(APIView):
    authentication_classes = [UserAuthentication, ]

    @staticmethod
    def paging_item(item, page=0, page_size=10):
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            raise (ValueError('参数类型错误'))
        item_start = page * page_size
        item_end = item_start + page_size
        try:
            return item[item_start:item_end]
        except TypeError:
            return item

    def get(self, request):
        part = request.query_params.get('part')
        if part:
            bills = models.Bill.objects.filter(user_id=request.user.id)
            Log(things='查询了个人账单', target=request.user.username).info()
        else:
            if request.user.role != 0:
                return Response({'code': 1401, 'msg': '权限不足'})
            bills = models.Bill.objects.all()
            Log(things='查询了所有人的账单', target=request.user.username).info()
        if not bills:
            return Response({'code': 1402, 'msg': '暂无记录'})
        page = request.query_params.get('page', 0)
        page_size = request.query_params.get('page_size', 10)
        ps = request.query_params.get('ps')
        if ps == 'true':
            ps = (len(bills) - 1) // int(page_size)
        bills = self.paging_item(bills.order_by('-createTime'), page, page_size)
        ser = BillSerializer(instance=bills, many=True)
        return Response({'code': 200, 'msg': '查询成功', 'data': ser.data, 'ps': ps})


# 管理员操作
class UserView(APIView):
    authentication_classes = [UserAuthentication, ]
    permission_classes = [AdminPermission, ]

    @staticmethod
    def handle_get_user(user_id=None):
        # 通过 本地订单id 淘宝订单编号 用户id 获取订单
        if user_id:
            user = models.User.objects.filter(id=user_id).first()
        else:
            user = models.User.objects.all()
        return user

    @staticmethod
    def paging_item(item, page=0, page_size=10):
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            raise (ValueError('参数类型错误'))
        item_start = page * page_size
        item_end = item_start + page_size
        try:
            return item[item_start:item_end]
        except TypeError:
            return item

    def get(self, request):
        # 获取用户
        user_id = request.query_params.get('id')
        user = self.handle_get_user(user_id)
        if not user:
            return Response({'code': 1003, 'msg': '用户不存在'})
        elif isinstance(user, models.User):
            ser = UserSerializer(instance=user, many=False)
            Log(things=f'查询了{user.username}的信息', target=request.user.username).info()
            return Response({'code': 200, 'msg': '获取成功', 'data': ser.data})
        elif isinstance(user, QuerySet):
            page = request.query_params.get('page', 0)
            page_size = request.query_params.get('page_size', 10)
            ps = request.query_params.get('ps')
            if ps == 'true':
                ps = (len(user) - 1) // int(page_size)
            users = self.paging_item(user, page, page_size)
            ser = UserSerializer(many=True, instance=users)
            Log(things=f'查询了所有用户的信息', target=request.user.username).info()
            return Response({'code': 200, 'msg': '查询成功', 'data': ser.data, 'ps': ps})

    def post(self, request):
        ser = UserSerializer(data=request.data)
        if not ser.is_valid():
            return Response({'code': 1004, 'msg': ser.errors})
        ser.validated_data.pop('password')
        ser.save(password=Dgove.md5(request.data['password']))
        target = dict(ser.data)
        Log(things=f'创建了用户{request.data.username}', target=request.user.username).add()
        # target.pop('password')
        return Response({'code': 200, 'msg': '用户添加成功', 'data': target})

    def put(self, request):
        uid = request.data.get('id')
        if not uid:
            return Response({'code': 1005, 'msg': '缺少查询参数'})
        user = models.User.objects.filter(id=uid).first()
        if not user:
            return Response({'code': 1006, 'msg': '用户不存在'})
        ser = UpdateUserSerializer(data=request.data)
        if ser.is_valid():
            target = dict(ser.data)
            if request.data.get('password'):
                target["password"] = Dgove.md5(request.data["password"])
            ser.update(instance=user, validated_data=target)
            ser = UserSerializer(instance=user)
            Log(things=f'修改了用户{user.username}的信息', target=request.user.username).update()
            return Response({'code': 200, 'msg': f'{user.username}信息更新成功', 'data': ser.data})
        Log(things=f'修改用户{user.username}的信息失败', target=request.user.username).error()
        return Response({'code': 1007, 'msg': '更新失败', "error": ser.errors})

    def delete(self, request):
        uid = request.query_params.get('id')
        if not uid:
            return Response({'code': 1005, 'msg': '缺少查询参数'})
        user = models.User.objects.filter(id=uid).first()
        if not user:
            return Response({'code': 1006, 'msg': '用户不存在'})
        Log(things=f'删除了用户{user.username}', target=request.user.username).delete()
        user.delete()
        return Response({'code': 200, 'msg': f'{user.username}删除成功'})


# 用户自我管理个人信息
class PrivateView(APIView):
    authentication_classes = [UserAuthentication, ]

    def get(self, request):
        ser = UserSerializer(instance=request.user)
        Log(things=f'查询了个人信息', target=request.user.username).info()
        return Response({'code': 200, 'msg': '信息获取成功', 'data': ser.data})

    def patch(self, request):
        old_password = request.data.get('oldPassword')
        new_password = request.data.get('newPassword')
        user = request.user
        if Dgove.md5(old_password) != user.password:
            Log(things=f'修改个人密码失败,原因:原密码错误', target=request.user.username).error()
            return Response({'code': 1008, 'msg': '密码错误'})
        user.password = Dgove.md5(new_password)
        try:
            user.save()
            Log(things=f'修改了自己的密码', target=request.user.username).update()
            return Response({'code': 200, 'msg': '更新成功', 'data': UserSerializer(instance=user).data})
        except Exception as e:
            Log(things=f'修改个人密码失败,原因:{e}', target=request.user.username).error()
            return Response({'code': 1009, 'msg': str(e)})


def get_user(request):
    token = request.query_params.get('token')
    if not token:
        return {'code': 2001, 'msg': '未登入'}
    dg = Dgove()
    try:
        username = dg.decode(settings.KEY, token).get('username')
    except TimeoutError:
        return {'code': 2002, 'msg': '会话超时'}
    except ValueError:
        return {'code': 2003, 'msg': '非法进入'}
    user = models.User.objects.filter(username=username).first()
    if not user:
        return {'code': 2004, 'msg': '用户不存在'}
    return user


def is_admin(user):
    return True if user.role == 0 else False


class ShopView(APIView):
    def get(self, request):
        code = request.query_params.get('code')
        if not code:
            user = get_user(request)
            if isinstance(user, dict):
                return Response(user)
            part = request.query_params.get('part')
            if part == 'true':
                shops = models.Shop.objects.values('id', 'name')
                return Response({'code': 200, 'msg': '查询成功', 'data': shops})
            if not is_admin(user):
                return Response({'code': 1201, 'msg': '权限不足'})
            shops = models.Shop.objects.all()
            if not shops:
                return Response({'code': 1202, 'msg': '暂无店铺'})
            ser = ShopSerializer(instance=shops, many=True)
            Log(things=f'查询了所有店铺', target=user.username).info()
            return Response({'code': 200, 'msg': '拉取成功', 'data': ser.data})
        state = request.query_params.get('state')
        shop = models.Shop.objects.filter(id=state).first()
        agiso = Agiso(appid=shop.appid, secret=shop.secret)
        data = agiso.get_token(code, state)
        # 暂未测试
        ser = ShopSerializer(instance=shop, data=data)
        if ser.is_valid():
            Log(things=f'店铺{shop.appid}被授权使用了').sys()
            ser.save()
            return HttpResponseRedirect(settings.WEB)
            # return Response({'code': 200, 'msg': '授权成功'})
        print(f'授权数据存储失败{ser.errors}')
        return Response({'code': 1203, 'msg': '数据错误'})
        # return HttpResponseRedirect('https://baidu.com')

    def post(self, request):
        user = get_user(request)
        if isinstance(user, dict):
            return Response(user)
        if not is_admin(user):
            return Response({'code': 1203, 'msg': '权限不足'})
        ser = ShopSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            Log(things=f'店铺{request.data["appid"]}被新增了', target=user.username).add()
            return Response({'code': 200, 'msg': '添加成功', 'data': ser.data})
        Log(things=f'店铺新增失败', target=request.user.username).error()
        return Response({'code': 1204, 'msg': '添加失败'})

    def patch(self, request):
        user = get_user(request)
        if isinstance(user, dict):
            return Response(user)
        if not is_admin(user):
            return Response({'code': 1203, 'msg': '权限不足'})
        shop_id = request.data.get('shop_id')
        shop = models.Shop.objects.filter(id=shop_id).first()
        if not shop:
            return Response({'code': 1205, 'msg': '无此店铺授权'})
        ser = ShopSerializer(instance=shop, data=request.data)
        if ser.is_valid():
            ser.save()
            Log(things=f'店铺{shop.appid}信息修改成功', target=user.username).update()
            return Response({'code': 200, 'msg': '修改成功', 'data': ser.data})
        Log(things=f'店铺{shop.name}息修改失败', target=user.username).error()
        return Response({'code': 1206, 'msg': '修改失败,{}'.format(ser.errors)})

    def delete(self, request):
        user = get_user(request)
        if isinstance(user, dict):
            return Response(user)
        if not is_admin(user):
            return Response({'code': 1203, 'msg': '权限不足'})
        shop_id = request.data.get('shopId')
        if not shop_id:
            return Response({'code': 1207, 'msg': '缺少参数'})
        shop = models.Shop.objects.get(id=shop_id)
        if not shop:
            return Response({'code': 1208, 'msg': '无此店铺授权'})
        ser = ShopSerializer(instance=shop, many=False)
        Log(things=f'店铺{shop.name}被移除了', target=user.username).delete()
        shop.delete()
        return Response({'code': 200, 'msg': '删除成功', "data": ser.data})


# 查订单
class OrderView(APIView):
    authentication_classes = [UserAuthentication, ]

    def get_permissions(self):
        if self.request.method == 'PUT':
            return [AdminPermission(), ]
        return super().get_permissions()

    @staticmethod
    def handle_get_order(order_id=None, tid=None, user_id=None, seller=None):
        # 通过 本地订单id 淘宝订单编号 用户id 获取订单
        if order_id:
            order = models.Order.objects.filter(id=order_id).first()
        elif tid:
            order = models.Order.objects.filter(tid=tid).first()
            if not order and seller:
                data = {"Tid": tid, "SellerNick": seller}
                return Ident(data).ident_create()
        elif user_id:
            if user_id == '-1':
                order = models.Order.objects.filter(user__isnull=True).order_by('-createTime')
            elif user_id == '-2':
                order = models.Order.objects.filter(status=2, tbstatus=1).order_by('-createTime')
            else:
                order = models.Order.objects.filter(user_id=user_id, status__lt=3).order_by('-createTime')
        else:
            order = models.Order.objects.order_by('-createTime')
        return order

    @staticmethod
    def paging_item(item, page=0, page_size=10):
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            raise (ValueError('参数类型错误'))
        item_start = page * page_size
        item_end = item_start + page_size
        try:
            return item[item_start:item_end]
        except TypeError:
            return item

    def get(self, request):
        order_id = request.query_params.get('id')
        tid = request.query_params.get('tid')
        user_id = request.query_params.get('user_id')
        seller = request.query_params.get('sellerNick')
        order = self.handle_get_order(order_id, tid, user_id, seller)
        if not order:
            return Response({'code': 200, 'msg': '暂无订单', 'data': None})
        elif isinstance(order, dict):
            return Response(order)
        elif isinstance(order, models.Order):
            ser = OrderSerializer(many=False, instance=order)
            return Response({'code': 200, 'msg': '查询成功', 'data': ser.data})
        elif isinstance(order, QuerySet):
            page = request.query_params.get('page', 0)
            page_size = request.query_params.get('page_size', 10)
            ps = request.query_params.get('ps')
            if ps == 'true':
                ps = (len(order) - 1) // int(page_size)
            orders = self.paging_item(order, page, page_size)
            ser = OrderSerializer(many=True, instance=orders)
            return Response({'code': 200, 'msg': '查询成功', 'data': ser.data, 'ps': ps})

    def put(self, request):
        order_id = request.data.get('order')
        user_id = request.data.get('uid')
        status = request.data.get('status')
        if not order_id and (not user_id or not status):
            return Response({'code': 1203, 'msg': '缺少参数'})
        order = models.Order.objects.filter(id=order_id).first()
        if not order:
            return Response({'code': 1204, 'msg': f'无对应订单'})
        if user_id:
            order.user_id = user_id
            # order.status = '1' if order.status == 0 else order.status
            user = models.User.objects.filter(id=user_id).first()
            Log(things=f'订单被指派给{user.uname}', target=request.user.username).update()
        else:
            user = order.user
        if status:
            if status == '0':
                Log(things=f'订单{order.tid}被放回接单大厅', target=request.user.username).update()
                order.user_id = None
            if status == '3' and order.status != 3:
                Log(things=f'订单{order.tid}结算成功', target=request.user.username).notice()
                Wallet(user=user, source=order, notes='订单结算(+)').income()
            if order.status == 3 and status != '3':
                Log(things=f'订单{order.tid}结算撤回', target=request.user.username).notice()
                Wallet(user=user, source=order, notes='结算撤回(-)').revoke()
            order.status = status
        try:
            order.save()
            Log(things=f'订单{order.tid}信息修改成功', target=request.user.username).update()
        except Exception as e:
            Log(things=f'订单{order.tid}信息修改失败', target=request.user.username).error()
            return Response({'code': 1205, 'msg': f'修改异常{e}'})
        return Response({'code': 200, 'msg': '修改成功', 'data': OrderSerializer(instance=order).data})

    # 仅修改订单状态
    def patch(self, request):
        o_id = request.data.get('order')
        status = request.data.get('status')
        user_id = request.data.get('uid')
        if not o_id:
            return Response({'code': 1206, 'msg': '缺少参数'})
        order = models.Order.objects.filter(id=o_id).first()
        if not order:
            return Response({'code': 1204, 'msg': f'无对应订单'})
        if status and order.user == request.user:
            if status == '0':
                Log(things=f'订单{order.tid}被用户{order.user.uname}放弃', target=request.user.username).update()
                order.user_id = None
                order.status = status
            elif status in ['1', '2']:
                order.status = status
                Log(things=f'订单{order.tid}的状态被更新了', target=request.user.username).update()
            else:
                Log(things=f'非法操作', target=request.user.username).error()
        elif user_id and not order.user and request.user.id == int(user_id):
            order.user_id = user_id
            order.status = '1' if order.status == 0 else order.status
        else:
            Log(things=f'非法操作', target=request.user.username).error()
            return Response({'code': 1209, 'msg': f'非法操作'})
        try:
            order.save()
        except Exception as e:
            Log(things=f'订单{order.tid}信息修改失败', target=request.user.username).error()
            return Response({'code': 1208, 'msg': f'修改异常{e}'})
        return Response({'code': 200, 'msg': '修改成功', 'data': OrderSerializer(instance=order).data})


class AgisoView(APIView):
    def post(self, request):
        data = request.data.get('json', '{}')
        params = 'json' + data
        params += 'timestamp' + request.query_params.get('timestamp', '')
        sign = request.query_params.get('sign', '')
        if not sign:
            return Response({'code': 1301, 'msg': '缺少验证值'})
        data = json.loads(data)
        shop = models.Shop.objects.filter(name=data.get('SellerNick')).first()
        if not shop:
            return Response({'code': 1309, 'msg': '无店铺订单'})
        if Agiso(secret=shop.secret).sign(params) != sign:
            return Response({'code': 1302, 'msg': '验证失败'})
        data['createTime'] = request.query_params.get('timestamp')
        msg_type = str(request.query_params.get('aopic'))
        print(f'推送类别{msg_type},数据包{data}')
        if msg_type == '2097152':
            # 买家付款推送
            ident = Ident(data)
            return Response(ident.ident_push_payment())
        elif msg_type == '256':
            # 退款创建
            ident = Ident(data)
            return Response(ident.ident_push_create_refund())
        elif msg_type == '1048576':
            # 卖家发货推送
            ident = Ident(data)
            return Response(ident.ident_push_item_send())
        elif msg_type == '65536':
            # 退款成功
            ident = Ident(data)
            return Response(ident.ident_push_refund())
        else:
            return Response({'code': 1303, 'msg': '未知推送信息'})
        # return Response({'code': 200, 'msg': '签名验证成功'})


class Ident:
    def __init__(self, data):
        # data为推送信息数据包
        self.data = data
        self.serializer = {
            'tid': '',
            'payment': 0.0,
            'refundfee': 0.0,
            'item': '',
            'createTime': '',
            'updateTime': '',
            'buyer': '',
            'buyerid': '',
            'status': 0,
            'tbstatus': 0,
            'shopId': ''
        }
        self.order = None

    def search_ident(self):
        """
        tid, SellerNick通过data传入
        :return: 订单信息
        """
        # 主要是为了填充字段值
        seller = self.data['SellerNick']
        tid = self.data['Tid']
        if not seller or not tid:
            raise ValueError({'code': 504, 'msg': '数据表缺少重要参数'})
        shops = models.Shop.objects.filter(name=seller)
        for shop in shops:
            agiso = Agiso(appid=shop.appid, secret=shop.secret, token=shop.token)
            # 发送主动查询详细订单请求
            res = agiso.get_tradeinfo(tid)
            if res['IsSuccess']:
                self.serializer['shopId'] = shop.id
                return res

    def check_order_exists(self):
        self.order = models.Order.objects.filter(tid=self.data['Tid']).first()
        return True if self.order else False

    def update_order_time(self, timestamp):
        self.order.updateTime = datetime.fromtimestamp(int(timestamp)).strftime('%Y-%m-%d %H:%M:%S')
        self.order.save()

    def choose_status_for_taobao(self, status):
        status_for_taobao = ['WAIT_SELLER_SEND_GOODS', 'WAIT_BUYER_CONFIRM_GOODS', 'TRADE_FINISHED', 'TRADE_CLOSED',
                             'TRADE_CLOSED_BY_TAOBAO']
        try:
            index = status_for_taobao.index(status)
            if 0 <= index < 2:
                # 0 / 1
                self.serializer['tbstatus'] = index
            elif index == 2:
                # 4
                self.serializer['tbstatus'] = 4
            else:
                # 2 / 3
                self.serializer['tbstatus'] = 2
        except ValueError:
            # 5
            self.serializer['tbstatus'] = 5

    def ident_create(self):
        """
        订单创建-入库(订单未在本地数据库)
        :return:
        """
        res = self.search_ident()
        # print(f'查询数据包{res}')
        if not res:
            print('无效订单')
            return {'code': 1304, 'msg': '无效订单', 'data': res}
        self.serializer['tid'] = self.data['Tid']
        self.serializer['buyer'] = res['Data']['BuyerNick']
        self.serializer['buyerid'] = res['Data']['BuyerOpenUid']
        self.serializer['createTime'] = res['Data']['Created']
        self.serializer['payment'] = res['Data']['Payment']
        self.serializer['item'] = res['Data']['Orders'][0]['Title']
        self.serializer['updateTime'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.choose_status_for_taobao(res['Data']['Status'])
        ser = OrderSerializer(data=self.serializer)
        if ser.is_valid():
            ser.save()
            Log(things=f'新订单{self.data["Tid"]}被系统收入').sys()
            # print(f'订单{self.serializer["tid"]}入库成功')
            return {'code': 200, 'msg': '数据保存成功', 'data': ser.data}
        return {'code': 1305, 'msg': '失败', 'data': ser.errors}

    def ident_push_payment(self):
        """
        用户付款推送
        :return:
        """
        if self.check_order_exists():
            self.update_order_time(self.data['createTime'])
            return {'code': 200, 'msg': '信息修改成功'}
        return self.ident_create()

    # 创建退款推送
    def ident_push_create_refund(self):
        if self.check_order_exists():
            self.order.refundfee = float(self.data['RefundFee'])
            self.order.tbstatus = 3
            if self.order.status != 4:
                self.order.status = 4
            self.order.updateTime = self.data['Modified']
            self.order.save()
            # print(f'退款创建推送: 当前订单状态{self.order.tbstatus}')
            return {'code': 200, 'msg': '信息修改成功'}
        return self.ident_create()

    # 退款推送
    def ident_push_refund(self):
        if self.check_order_exists():
            self.order.refundfee = float(self.data['RefundFee'])
            self.order.tbstatus = 2
            if self.order.status != 4:
                self.order.status = 4
            self.order.updateTime = self.data['Modified']
            self.order.save()
            # print(f'退款推送:当前订单状态{self.order.tbstatus}')
            return {'code': 200, 'msg': '信息修改成功'}
        return self.ident_create()

    # 卖家发货推送
    def ident_push_item_send(self):
        if self.check_order_exists():
            self.order.tbstatus = 1
            self.update_order_time(self.data['createTime'])
            # print(f'卖家发货推送: 当前订单状态{self.order.tbstatus}')
            return {'code': 200, 'msg': ' 信息修改成功'}
        return self.ident_create()


class Wallet:
    def __init__(self, user, source, amount=0.0, notes=None):
        self.user = user
        self.source = source
        self.amount = amount
        self.notes = notes

    # 流水保存
    def save(self):
        if isinstance(self.source, models.Order):
            self.amount = eval(f'{self.user.divide} * {self.source.payment - self.source.refundfee} / 100')
            # print('收益{}'.format(self.amount))
            try:
                models.Bill.objects.create(user=self.user, order=self.source, amount=self.amount, notes=self.notes)
                # print('账单保存成功')
            except Exception as e:
                print(f'{e}')
                return False
            return True
        else:
            try:
                models.Bill.objects.create(user=self.user, other=self.source, amount=self.amount, notes=self.notes)
                print('账单保存成功')
            except Exception as e:
                print(f'{e}')
                return False
            return True

    def income(self):
        if self.save():
            self.user.income = eval(f'{self.user.income} + {self.amount}')
            self.user.balance = eval(f'{self.user.balance} + {self.amount}')
            try:
                self.user.save()
                # print('收入保存成功')
            except Exception as e:
                print(f'{e}')

    # 支出 或 提现
    def expand(self, t=0):
        if self.save():
            self.user.balance = eval(f'{self.user.balance} - {self.amount}')
            if t == 1:
                self.user.lock_money = eval(f'{self.user.lock_money} + {self.amount}')
            try:
                self.user.save()
            except Exception as e:
                print(f'{e}')

    # 撤销
    def revoke(self):
        if self.save():
            self.user.income = eval(f'{self.user.income} - {self.amount}')
            self.user.balance = eval(f'{self.user.balance} - {self.amount}')
            try:
                self.user.save()
                # print('撤回成功')
            except Exception as e:
                print(f'{e}')


class CashOutView(APIView):
    authentication_classes = [UserAuthentication, ]

    @staticmethod
    def paging_item(item, page=0, page_size=10):
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            raise (ValueError('参数类型错误'))
        item_start = page * page_size
        item_end = item_start + page_size
        try:
            return item[item_start:item_end]
        except TypeError:
            return item

    def get(self, request):
        self.permission_classes = [AdminPermission, ]
        self.check_permissions(request)
        cashes = models.CashOut.objects.all().order_by('status', 'createTime')
        if not cashes:
            return Response({'code': 1500, 'msg': '当前无可结算账单'})
        page = request.query_params.get('page', 0)
        page_size = request.query_params.get('page_size', 10)
        ps = request.query_params.get('ps')
        if ps == 'true':
            ps = (len(cashes) - 1) // int(page_size)
        cashes = self.paging_item(cashes, page, page_size)
        ser = GetCashSerializer(instance=cashes, many=True)
        Log(things=f'查询了所有可结算账单', target=request.user.username).info()
        return Response({'code': 200, 'msg': '拉取成功', 'data': ser.data, "ps": ps})

    def post(self, request):
        amount = request.data.get('amount')
        if not amount:
            return Response({'code': 1501, 'msg': '缺少参数'})
        if eval(f'{amount} <= 100'):
            return Response({'code': 1502, 'msg': '提现数额不得小于100'})
        if eval(f'{amount} > {request.user.balance}'):
            return Response({'code': 1503, 'msg': '非法提现'})
        data = {"amount": amount, "user": request.user.id, "status": 0}
        ser = CashOutSerializer(data=data)
        if ser.is_valid():
            ser.save()
            Log(things=f'申请提现{amount}', target=request.user.username).notice()
            Wallet(user=request.user, source='提现', amount=amount, notes='提现审批申请(-)').expand(t=1)
            user = models.User.objects.filter(id=request.user.id).first()
            return Response({'code': 200, 'msg': '申请成功', 'data': UserSerializer(user).data})
        return Response({'code': 1504, 'msg': ser.errors})

    def patch(self, request):
        self.permission_classes = [AdminPermission, ]
        self.check_permissions(request)
        cash_id = request.data.get('id')
        if not cash_id:
            return Response({'code': 1504, 'msg': '缺少参数'})
        cash = models.CashOut.objects.filter(id=cash_id).first()
        if not cash:
            return Response({'code': 1505, 'msg': '并无此账单需要结算'})
        cash.status = 1
        try:
            cash.save()
            cash.user.lock_money -= cash.amount
            cash.user.save()
            Log(things=f'审批了{cash.user.username}的提现申请', target=request.user.username).notice()
            return Response({'code': 200, 'msg': '结算完毕', 'data': GetCashSerializer(instance=cash, many=False).data})
        except Exception as e:
            return Response({'code': 1506, 'msg': f'保存失败,{e}'})


class LogView(APIView):
    authentication_classes = [UserAuthentication]
    permission_classes = [AdminPermission]

    @staticmethod
    def handle_get_log(tag, log_id):
        if log_id:
            log = models.Logs.objects.filter(id=log_id).first()
        elif tag and not log_id:
            log = models.Logs.objects.filter(tag=tag).order_by('-happenTime')
        else:
            log = models.Logs.objects.all().order_by('-happenTime')
        return log

    @staticmethod
    def paging_item(item, page=0, page_size=10):
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            raise (ValueError('参数类型错误'))
        item_start = page * page_size
        item_end = item_start + page_size
        try:
            return item[item_start:item_end]
        except TypeError:
            return item

    def get(self, request):
        tag = request.query_params.get('tag')
        log_id = request.query_params.get('logId')
        log = self.handle_get_log(tag, log_id)
        if not log:
            return Response({'code': 200, 'msg': '暂无日志'})
        elif isinstance(log, models.Logs):
            return Response({'code': 200, 'msg': '获取成功', 'data': LogSerializer(log).data})
        elif isinstance(log, QuerySet):
            page = request.query_params.get('page', 0)
            page_size = request.query_params.get('page_size', 10)
            ps = request.query_params.get('ps')
            if ps == 'true':
                ps = (len(log) - 1) // int(page_size)
            logs = self.paging_item(log, page, page_size)
            ser = LogSerializer(many=True, instance=logs)
            return Response({'code': 200, 'msg': '查询成功', 'data': ser.data, 'ps': ps})


class Log:
    def __init__(self, things, target=None):
        """
        日志记录
        :param target: 执行者
        :param things: 发生事情
        """
        self.things = things
        self.target = target

    def info(self):
        models.Logs.objects.create(tag='info', target=self.target, things=self.things)

    def error(self):
        models.Logs.objects.create(tag='error', target=self.target, things=self.things)

    def sys(self):
        models.Logs.objects.create(tag='sys', target='系统', things=self.things)

    def notice(self):
        models.Logs.objects.create(tag='notice', target=self.target, things=self.things)

    def add(self):
        models.Logs.objects.create(tag='add', target=self.target, things=self.things)

    def update(self):
        models.Logs.objects.create(tag='update', target=self.target, things=self.things)

    def delete(self):
        models.Logs.objects.create(tag='del', target=self.target, things=self.things)
