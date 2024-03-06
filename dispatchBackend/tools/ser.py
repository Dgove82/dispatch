from dispatch import models
from rest_framework import serializers
import re
from tools.jwt import Dgove


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate_phone(self, value):
        if re.match(r'^1[3-9]\d{9}$', value):
            return value
        else:
            raise serializers.ValidationError('请输入正确的手机号')

    def validate_divide(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('无效值')
        return value


class UpdateUserSerializer(UserSerializer):
    password = serializers.CharField(required=False)
    username = serializers.CharField(required=False)

    class Meta:
        model = models.User
        fields = '__all__'
        extra_kwargs = {
            'uname': {'required': False},
            'phone': {'required': False},
            'alipay': {'required': False},
            'balance': {'required': False}
        }


class ShopSerializer(serializers.ModelSerializer):
    appid = serializers.CharField(required=False)

    class Meta:
        model = models.Shop
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(required=False)

    class Meta:
        model = models.Order
        fields = '__all__'


class CustomDateTimeField(serializers.DateTimeField):
    def to_representation(self, value):
        return value.strftime('%Y-%m-%d %H:%M:%S')


class BillSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    order = OrderSerializer()
    createTime = CustomDateTimeField()

    class Meta:
        model = models.Bill
        fields = '__all__'


class CashOutSerializer(serializers.ModelSerializer):
    createTime = CustomDateTimeField(required=False)

    class Meta:
        model = models.CashOut
        fields = '__all__'


class GetCashSerializer(serializers.ModelSerializer):
    createTime = CustomDateTimeField(required=False)
    user = UserSerializer()

    class Meta:
        model = models.CashOut
        fields = '__all__'


class LogSerializer(serializers.ModelSerializer):
    happenTime = CustomDateTimeField(required=False)

    class Meta:
        model = models.Logs
        fields = '__all__'
