import requests
import json
import os
import random

class WibioOtpRequestHelper:
    SERVER = 'https://otpsandbox.wibiocard.com'
    USERNAME = '***************************'
    PASSWORD = '***************************'

    def __init__(self):
        self.session = requests.Session()
        self.cookie_file_name = f"{random.randint(100000000,1999999999):013}.txt"
        self.csrf_access_token = None

    def __del__(self):
        self.session.close()
        if os.path.exists(self.cookie_file_name):
            os.remove(self.cookie_file_name)

    def init(self):
        try:
            url = f"{self.SERVER}/admin/login"
            headers = {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/32.0.1700.107 Chrome/32.0.1700.107 Safari/537.36'
            }
            data = {
                'username': self.USERNAME,
                'password': self.PASSWORD
            }
            response = self.session.post(url, headers=headers, data=data, verify=False)
            response.raise_for_status()
            
            cookies = response.cookies.get_dict()
            self.csrf_access_token = cookies.get('csrf_access_token')
            if self.csrf_access_token:
                self.session.headers.update({'X-CSRF-TOKEN': self.csrf_access_token})

            obj_session = response.json()
            if obj_session.get('result', {}).get('status') and obj_session.get('result', {}).get('value'):
                return obj_session['result']['status']
            else:
                raise Exception("cURL authentication failed!")
        except Exception as e:
            return str(e)

    def admin_assign(self, serial, user, pin='0000'):
        url = f"{self.SERVER}/admin/assign"
        data = {
            'serial': serial,
            'user': user,
            'pin': pin
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_check(self, serial):
        url = f"{self.SERVER}/admin/check_serial"
        params = {
            'serial': serial
        }
        response = self.session.get(url, params=params, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_disable_user(self, user):
        url = f"{self.SERVER}/admin/disable"
        data = {
            'user': user
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_disable_token(self, token):
        url = f"{self.SERVER}/admin/disable"
        data = {
            'serial': token
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_enable_user(self, user):
        url = f"{self.SERVER}/admin/enable"
        data = {
            'user': user
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_enable_token(self, token):
        url = f"{self.SERVER}/admin/enable"
        data = {
            'serial': token
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_get_token_owner(self, serial):
        url = f"{self.SERVER}/admin/getTokenOwner"
        params = {
            'serial': serial
        }
        response = self.session.get(url, params=params, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_remove_user(self, user):
        url = f"{self.SERVER}/admin/remove"
        data = {
            'user': user
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_remove_token(self, token):
        url = f"{self.SERVER}/admin/remove"
        data = {
            'serial': token
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_reset_user(self, user):
        url = f"{self.SERVER}/admin/reset"
        data = {
            'user': user
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_reset_token(self, token):
        url = f"{self.SERVER}/admin/reset"
        data = {
            'serial': token
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_resync_user(self, user, otp1, otp2):
        url = f"{self.SERVER}/admin/resync"
        data = {
            'user': user,
            'otp1': otp1,
            'otp2': otp2
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_resync_token(self, token, otp1, otp2):
        url = f"{self.SERVER}/admin/resync"
        data = {
            'serial': token,
            'otp1': otp1,
            'otp2': otp2
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_set_user(self, user, pin='0000', MaxFailCount=10, SyncWindow=0, OtpLen=8, CounterWindow=0, hashlib='sha1', timeWindow=0, timeStep=30, timeShift=10, countAuthSuccessMax=0, countAuthSuccess=0, countAuth=0, countAuthMax=0, validityPeriodStart='', validityPeriodEnd='', phone=''):
        url = f"{self.SERVER}/admin/set"
        data = {
            'user': user,
            'pin': pin,
            'MaxFailCount': MaxFailCount,
            'SyncWindow': SyncWindow,
            'OtpLen': OtpLen,
            'CounterWindow': CounterWindow,
            'hashlib': hashlib,
            'timeWindow': timeWindow,
            'timeStep': timeStep,
            'timeShift': timeShift,
            'countAuthSuccessMax': countAuthSuccessMax,
            'countAuthSuccess': countAuthSuccess,
            'countAuth': countAuth,
            'countAuthMax': countAuthMax,
            'validityPeriodStart': validityPeriodStart,
            'validityPeriodEnd': validityPeriodEnd,
            'phone': phone
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_set_token(self, token, pin='0000', MaxFailCount=10, SyncWindow=0, OtpLen=8, CounterWindow=0, hashlib='sha1', timeWindow=0, timeStep=30, timeShift=10, countAuthSuccessMax=0, countAuthSuccess=0, countAuth=0, countAuthMax=0, validityPeriodStart='', validityPeriodEnd='', phone=''):
        url = f"{self.SERVER}/admin/set"
        data = {
            'serial': token,
            'pin': pin,
            'MaxFailCount': MaxFailCount,
            'SyncWindow': SyncWindow,
            'OtpLen': OtpLen,
            'CounterWindow': CounterWindow,
            'hashlib': hashlib,
            'timeWindow': timeWindow,
            'timeStep': timeStep,
            'timeShift': timeShift,
            'countAuthSuccessMax': countAuthSuccessMax,
            'countAuthSuccess': countAuthSuccess,
            'countAuth': countAuth,
            'countAuthMax': countAuthMax,
            'validityPeriodStart': validityPeriodStart,
            'validityPeriodEnd': validityPeriodEnd,
            'phone': phone
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_show_all(self, viewrealm='', tokeninfo_format='json'):
        url = f"{self.SERVER}/admin/show"
        params = {
            'viewrealm': viewrealm,
            'tokeninfo_format': tokeninfo_format
        }
        response = self.session.get(url, params=params, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_show_user(self, user, viewrealm='', tokeninfo_format='json'):
        url = f"{self.SERVER}/admin/show"
        params = {
            'user': user,
            'viewrealm': viewrealm,
            'tokeninfo_format': tokeninfo_format
        }
        response = self.session.get(url, params=params, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_show_token(self, token, viewrealm='', tokeninfo_format='json'):
        url = f"{self.SERVER}/admin/show"
        params = {
            'serial': token,
            'viewrealm': viewrealm,
            'tokeninfo_format': tokeninfo_format
        }
        response = self.session.get(url, params=params, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_token_realm(self, token, realms):
        url = f"{self.SERVER}/admin/tokenrealm"
        data = {
            'serial': token,
            'realms': realms
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_unassign_token(self, token):
        url = f"{self.SERVER}/admin/unassign"
        data = {
            'serial': token
        }
        response = self.session.post(url, data=data, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

    def admin_user_list(self, searchexpr='', realm='', resConf='', page=1, rp=100):
        url = f"{self.SERVER}/admin/userlist"
        params = {
            'searchexpr': searchexpr,
            'realm': realm,
            'resConf': resConf,
            'page': page,
            'rp': rp
        }
        response = self.session.get(url, params=params, verify=False)
        if response.status_code != 200:
            return "cURL request error!"
        return response.json()

