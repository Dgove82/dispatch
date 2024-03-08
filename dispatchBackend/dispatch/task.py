import models
from views import Ident, Wallet, Log
import time
from datetime import datetime, timedelta
from django.conf import settings


def timed_task():
    patrol_for_order()
    settle_order()


def settle_order():
    # 冻结中的订单进行 -> 结算
    count_days = -settings.config['settlement_days']
    days_of_threshold = datetime.now() + timedelta(days=count_days)
    orders = models.Order.objects.filter(status=5, updateTime__gte=days_of_threshold)
    for order in orders:
        order.status = 3
        if order.user:
            Log(things=f'系统结算了{order.user.username}的{order.tid},结算{"存在退款" if order.refundfee > 0 else ""};'
                       f'用户收益为{eval(order.payment - order.refundfee / 100)}').sys()
            Wallet(user=order.user, source=order, notes='订单结算(+)').income()
        else:
            Log(things=f'订单{order.tid}未被分派，但被退款或其他情况进入已完成状态')
        order.save()
    Log(things=f'今日【结算】定时任务巡查完成').sys()


def patrol_for_order():
    # 查询待验收订单
    orders = models.Order.objects.filter(status=2)
    for order in orders:
        check_for_order(order)
    # 处理 退款处理 的订单
    orders = models.Order.objects.filter(status=4)
    for order in orders:
        order.status = 5
        order.save()
        Log(things=f'退款订单{order.tid},进入冻结期').sys()
    Log(things=f'今日【巡查】定时任务结束').sys()


def check_for_order(order):
    data = {"Tid": order.tid, "SellerNick": order.shopId.name}
    ident = Ident(data)
    res = ident.search_ident()
    time.sleep(0.2)
    if not res:
        Log(things=f'{order.tid}订单丢失').sys()
    if res['Data']['Status'] in ['TRADE_CLOSED', 'TRADE_CLOSED_BY_TAOBAO']:
        # 状态转变: 退款订单
        order.status = 5
        order.updateTime = datetime.now()
        order.save()
        Log(things=f'检测非退款处理的订单{order.tid}处于淘宝退款状态,进入冻结期').sys()
    if res['Data']['Status'] in ['TRADE_FINISHED']:
        # 进入冻结期
        order.status = 5
        order.updateTime = datetime.now()
        order.save()
        Log(things=f'检测到待验收订单{order.tid}交易完成,进入冻结期').sys()

