import requests
import hashlib
import time


class Agiso:
    def __init__(self, appid='', secret='', token=''):
        self.appid = appid
        self.app_secret = secret
        self.access_token = token

    def sign(self, params: str) -> str:
        query = self.app_secret + params + self.app_secret
        return hashlib.md5(query.encode('utf-8')).hexdigest().upper()

    def get_token(self, code, stata):
        response = requests.get(
            url=f'https://alds.agiso.com/auth/token?code={code}&appId={self.appid}&secret={self.app_secret}&state={stata}',
            verify=False)
        data = response.json()
        return {'name': data['Data']['UserNick'],
                'deadline': data['Data']['DeadLine'],
                'token': data['Data']['Token'],
                'platform': data['Data']['FromPlatform']}

    def get_tradeinfo(self, tid):
        headers = {
            'Authorization': 'Bearer ' + self.access_token,
            'ApiVersion': '1',
        }
        timestamp = int(time.time())
        params = f'tid{tid}timestamp{timestamp}'
        sign = self.sign(params)
        data = {
            'timestamp': timestamp,
            'sign': sign,
            'tid': tid
        }
        response = requests.post(
            url=f'http://gw.api.agiso.com/alds/Trade/TradeInfo/?timestamp={timestamp}',
            data=data,
            headers=headers,
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise ValueError(f'数据错误:{response[:100]}')

