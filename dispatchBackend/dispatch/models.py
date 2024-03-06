from django.db import models


# Create your models here.
class User(models.Model):
    class Meta:
        db_table = 'user'
        verbose_name = '用户'

    objects = models.Manager()
    username = models.CharField(max_length=30, verbose_name='用户名', unique=True, db_index=True)
    password = models.CharField(max_length=35, verbose_name='密码')
    role = models.IntegerField(choices=((0, '管理员'), (1, '用户'), (2, '其他')), default=1, verbose_name='权限等级')
    divide = models.IntegerField(verbose_name='分成比例', default=50)
    uname = models.CharField(verbose_name='接单人姓名', max_length=30)
    phone = models.CharField(max_length=11, verbose_name='手机号')
    alipay = models.CharField(verbose_name='支付宝账号', max_length=255)
    balance = models.DecimalField(max_digits=7, decimal_places=2, verbose_name='余额', default=0.0)
    lock_money = models.DecimalField(max_digits=7, decimal_places=2, default=0, verbose_name='锁定数额')
    income = models.DecimalField(max_digits=7, decimal_places=2, verbose_name='总收入', default=0.0)


class Shop(models.Model):
    class Meta:
        db_table = 'shop'
        verbose_name = '店铺'
    objects = models.Manager()
    name = models.CharField(max_length=30, verbose_name='店铺名UserNick', null=True, default=None)
    token = models.CharField(max_length=255, verbose_name='acess_token', null=True, default=None)
    deadline = models.DateTimeField(verbose_name='过期时间', null=True, default=None)
    platform = models.CharField(max_length=30, verbose_name='供应商平台', null=True, default=None)
    appid = models.CharField(max_length=50, verbose_name='应用id', null=False)
    secret = models.CharField(max_length=50, verbose_name='应用密钥', null=False)


class Order(models.Model):
    class Meta:
        db_table = 'order'
        verbose_name = '订单'

    objects = models.Manager()
    tid = models.CharField(max_length=255, verbose_name='订单号', unique=True, db_index=True)
    user = models.ForeignKey(to=User, verbose_name='接单人员', on_delete=models.SET_NULL, null=True)
    payment = models.DecimalField(max_digits=7, decimal_places=2, default=0.0, verbose_name='付款金额')
    refundfee = models.DecimalField(max_digits=7, decimal_places=2, default=0.0, verbose_name='退款金额')
    item = models.CharField(max_length=255, verbose_name='商品名称')
    createTime = models.DateTimeField(verbose_name='创建时间')
    updateTime = models.DateTimeField(verbose_name='更新时间', null=True)
    buyer = models.CharField(max_length=100, verbose_name='旺旺名')
    buyerid = models.CharField(max_length=30, verbose_name='淘宝id')
    status = models.IntegerField(choices=((0, '待接单'), (1, '进行中'), (2, '待验收'), (3, '已完成'), (4, '已取消')), default=0,
                                 verbose_name='订单状态')
    tbstatus = models.IntegerField(choices=((0, '待发货'), (1, '已发货'), (2, '已退款'), (3, '退款中')), default=0,
                                   verbose_name='淘宝状态')
    shopId = models.ForeignKey(to=Shop, verbose_name='供应商平台', on_delete=models.SET_NULL, null=True)


class Bill(models.Model):
    class Meta:
        db_table = 'bill'
        verbose_name = '账单'
    objects = models.Manager()
    user = models.ForeignKey(to=User, verbose_name='接单人员', on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(to=Order, verbose_name="收支来源", on_delete=models.SET_NULL, null=True)
    other = models.CharField(max_length=100, verbose_name='其他收支来源', null=True)
    amount = models.DecimalField(max_digits=7, decimal_places=2, default=0.0, verbose_name='变化数额')
    notes = models.CharField(max_length=255, verbose_name='备注', null=True)
    createTime = models.DateTimeField(auto_now_add=True, verbose_name='入账时间')


class CashOut(models.Model):
    class Meta:
        db_table = 'cash_out'
        verbose_name = '提现审批'
    objects = models.Manager()
    user = models.ForeignKey(to=User, verbose_name='接单人员', on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=7, decimal_places=2, default=0.0, verbose_name='提现数额', null=True)
    createTime = models.DateTimeField(auto_now_add=True, verbose_name='申请时间', null=True)
    status = models.IntegerField(choices=((0, '待审批'), (1, '已完成')), verbose_name='审批状态', null=True, default=0)


class Logs(models.Model):
    class Meta:
        db_table = 'logs'
        verbose_name = '日志'
    objects = models.Manager()
    tag = models.CharField(max_length=30, verbose_name='事件类型', db_index=True)
    happenTime = models.DateTimeField(auto_now_add=True, verbose_name='发生时间')
    target = models.CharField(max_length=30, verbose_name='事情发生对象', null=True, blank=True)
    things = models.TextField(verbose_name='事件内容', null=True, blank=True)

