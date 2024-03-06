"""
URL configuration for dispatchBackend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from dispatch import views

urlpatterns = [
    path('api/v1/login/', views.LoginView.as_view()),
    path('api/v1/users/', views.UserView.as_view()),
    path('api/v1/user/', views.PrivateView.as_view()),
    path('api/v1/orders/', views.OrderView.as_view()),
    path('api/v1/shops/', views.ShopView.as_view()),
    path('api/v1/bills/', views.BillView.as_view()),
    path('api/v1/cash/', views.CashOutView.as_view()),
    path('api/v1/logs/', views.LogView.as_view()),

    # 推送请求
    path('push/receiveMsg/', views.AgisoView.as_view())


]