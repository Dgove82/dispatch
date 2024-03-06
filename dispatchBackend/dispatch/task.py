import models
from views import Ident, Wallet,Log
import logging
import time
import datetime


def tbstatus_check_task():
    logging.basicConfig(filename='ident.log', level=logging.DEBUG,
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    time.sleep(0.5)
    orders = models.Order.objects.filter(status=2)
    for order in orders:
        data = {"Tid": order.tid, "SellerNick": order.shopId.name}
        ident = Ident(data)
        res = ident.search_ident()
        if not res:
            logging.error(f"{order.tid}订单丢失")
        if res['Data']['Status'] in ['TRADE_CLOSED', 'TRADE_CLOSED_BY_TAOBAO']:
            order.status = 4
            order.save()
            logging.info(f"{order.tid}被取消了")
        elif res['Data']['Status'] in ['TRADE_FINISHED']:
            old_time = datetime.datetime.strptime(res['Dara']['CreationTime'], "%Y-%m-%d %H:%M:%S")
            diff = old_time - datetime.datetime.now()
            if diff.days > 15:
                order.status = 3
                Log(things=f'系统结算了{order.user.username}的{order.tid}').sys()
                Wallet(user=order.user, source=order, notes='订单结算(+)').income()
                logging.info(f"{order.tid}结算完毕")
                order.save()
        else:
            logging.info(f"{order.tid}查询状态结果为 【{res['Data']['Status']}】")
    else:
        logging.info(f"本时刻无检查订单")
