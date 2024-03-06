import base64
import copy
import hmac
import json
import time
import hashlib


class Dgove:
    @staticmethod
    def b64encode(content):
        return base64.b64encode(content).replace(b'=', b'').replace(b'+', b'_').replace(b'/', b'~')

    @staticmethod
    def b64decode(byte: bytes):
        byte = byte.replace(b'_', b'+').replace(b'~', b'/')
        sem = 4 - len(byte) % 4
        if sem > 0:
            byte += b'=' * sem
        return base64.urlsafe_b64decode(byte)

    @staticmethod
    def encode(key: str, payload: dict, exp=300) -> str:
        header = {'alg': 'HS256', 'typ': 'JWT'}
        header_json = json.dumps(header, separators=(',', ':'), sort_keys=True)
        header_bs = Dgove.b64encode(header_json.encode())
        payload_twice = copy.deepcopy(payload)
        if not isinstance(exp, int) and not isinstance(exp, str):
            raise TypeError('exp must be int or str')
        payload_twice['exp'] = time.time() + int(exp)
        payload_json = json.dumps(payload_twice, separators=(',', ':'), sort_keys=True)
        payload_bs = Dgove.b64encode(payload_json.encode())
        sign = hmac.new(key.encode(), header_bs + b'.' + payload_bs, digestmod='SHA256')
        sign_bs = Dgove.b64encode(sign.digest())
        return (header_bs + b'.' + payload_bs + b'.' + sign_bs).decode()

    @staticmethod
    def decode(key: str, token: str) -> dict:
        token = token.encode()
        header_bs, payload_bs, sign_bs = token.split(b'.')
        hm = hmac.new(key.encode(), header_bs + b'.' + payload_bs, digestmod='SHA256')
        # 检查签名
        if sign_bs != Dgove.b64encode(hm.digest()):
            raise ValueError('非法进入')
        # 检查是否过期
        payload_json = Dgove.b64decode(payload_bs)
        payload = json.loads(payload_json)
        if 'exp' in payload:
            now = time.time()
            if now > payload['exp']:
                raise TimeoutError('会话过期')
        return payload

    @staticmethod
    def md5(password):
        md5 = hashlib.md5()
        md5.update(password.encode())
        return md5.hexdigest()

