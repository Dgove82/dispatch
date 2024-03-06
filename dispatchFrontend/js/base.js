// 加载于所有页面 - 一些常用api的编写
const baseUrl = 'http://127.0.0.1:8000/'

// 添加默认 GET方法, token请求参数, 失败回调
const baseConfig = config => {
    if (!config.method) config.method = 'GET'
    if (!config.params) config.params = {'token': `${getToken('token')[0]}`}
    config.fail = response => {
        // 测试 -  报错查看
        if (2000 < response.code && response.code < 2005) {
            alert(response.msg)
            document.cookie = `token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;;path=/`
            window.location.href = 'login.html'
        }
    }
    return config
}

const baseSend = config => {
    return dg(config).then(result => {
        return result
    }).catch(reason => {
        console.log(reason)
    })
}

// ajax请求
const dg = (config) => {
    const xhr = new XMLHttpRequest()
    const {
        api = "",
        method = "GET",
        header = [],
        params = {},
        data = {},
        wait = () => {
        },
        fail = () => {
        },
    } = config
    let url = Object.keys(params).length >= 1 ? `${baseUrl + api}?${new URLSearchParams(params).toString()}` : `${baseUrl + api}`
    xhr.open(method, url)

    // 设置请求头
    for (let i = 0; i < header.length; i++) {
        xhr.setRequestHeader(header[i], header[++i])
    }
    wait()
    return new Promise((resolve, reject) => {
        xhr.addEventListener('load', function () {
            if (this.status >= 200 && this.status < 300) {
                const response = JSON.parse(this.response)
                // console.log(response)
                if (response.code !== 200) {
                    fail(response)
                    reject(response)
                } else resolve(response)
            } else reject({status: this.status, statusText: this.statusText})
        })
        if (Object.keys(data).length >= 1) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    })

}


// 获取身份码
const getToken = key => {
    const cookies = document.cookie.split(';')
    for (let i in cookies) {
        const obj = cookies[i].split('=')
        if (key === obj[0]) {
            return obj.slice(1).join('=').split('-')
        }
    }
}
const getUid = key => {
    return getToken('token')[1].split('@')[0]
}

// 判断是否登入
const isLogin = () => {
    if (getToken('token')) return true
}

// 判断是否为管理员
const isAdmin = () => {
    if (getToken('token').length === 2 && getToken('token')[1].split('@')[1] === '0') return true
}


// 获取dom对象
const o = (t, p) => {
    if (p) return p.querySelector(t)
    return document.querySelector(t)
}

// 获取dom对象们
const os = (t, p) => {
    if (p) return p.querySelectorAll(t)
    return document.querySelectorAll(t)
}

// 查找目标父节点
const getParent = (e, parent) => {
    while (e) {
        if (e.parentNode.localName === parent) {
            return e.parentNode
        }
        e = e.parentNode
    }
}

// 创建节点对象
const c = e => {
    return document.createElement(e)
}

// 获取视口尺寸
const getViewportSize = () => {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    return [viewportWidth, viewportHeight]
}


// 获取dom对象 - 闭包对象封装(不完善)
const $ = t => {
    const self = {}
    // 默认为window对象 - 类型转换
    if (typeof t === 'string') self.e = document.querySelector(t)
    if (typeof t === 'object') self.e = t
    if (typeof t === 'undefined') self.e = window
    // 事件绑定
    self.on = (event, callback) => {
        console.log(1)
        self.e.addEventListener(event, callback)
        return self
    }
    // 添加类名
    self.add = className => {
        self.e.classList.add(className)
        return self
    }
    // 移除类名
    self.remove = className => {
        self.e.classList.remove(className)
        return self
    }
    return self
}

class Order {
    order(config) {
        config = baseConfig(config)
        config.api = 'api/v1/orders/'
        // header, data, wait 均为默认
        return baseSend(config)
    }

    async get({
                  pageSize, page, ps, user_id, id, tid, wait = () => {
        }
              } = {}) {
        if (!id) id = ''
        if (!tid) tid = ''
        if (!user_id) user_id = ''
        if (!ps) ps = 'true'
        if (!pageSize) pageSize = 10
        if (!page) page = 0
        const result = await this.order({
            params: {
                'token': `${getToken('token')[0]}`,
                'id': id,
                'tid': tid,
                'user_id': user_id,
                'page': page,
                'page_size': pageSize,
                'ps': ps
            },
            wait: wait,
        })
        try {
            pEnd = result.ps && result.ps !== 'false' ? result.ps : pEnd
        } catch (e) {
            console.log('无法分页')
        }
        return result ? result.data : undefined
    }

    async put({
                  data = {}, wait = () => {
        }
              }) {
        let result
        if (Object.keys(data).length < 3 && !isAdmin()) result = await this.order({
            method: 'PATCH',
            data: data,
            wait: wait
        })
        else result = await this.order({method: 'PUT', data: data, wait: wait})
        return result ? result.data : undefined
    }

}

class Users {
    user(config) {
        config = baseConfig(config)
        config.api = 'api/v1/users/'
        // header, data, wait 均为默认
        return baseSend(config)
    }

    async get({
                  pageSize, page, ps, id, wait = () => {
        }
              }) {
        if (!id) id = ''
        if (!ps) ps = 'true'
        if (!pageSize) pageSize = 10
        if (!page) page = 0
        const result = await this.user({
            params: {
                'id': id,
                'token': getToken('token')[0],
                'page': page,
                'page_size': pageSize,
                'ps': ps
            },
            wait: wait,
        })
        pEnd = result.ps && result.ps !== 'false' ? result.ps : pEnd
        return result ? result.data : undefined
    }

    async post({
                   data = {}, wait = () => {
        }
               }) {
        if (!data) data = {}
        const result = await this.user({
            method: 'POST',
            data: data,
            wait: wait,
        })
        return result ? result.data : undefined
    }

    async put({
                  data = {}, wait = () => {
        }
              }) {
        if (!data) data = {}
        const result = await this.user({
            method: 'PUT',
            data: data,
            wait: wait,
        })
        return result ? result.data : undefined
    }
}

class User {
    user(config) {
        config = baseConfig(config)
        config.api = 'api/v1/user/'
        // header, data, wait 均为默认
        return baseSend(config)
    }

    async get({
                  wait = () => {
                  }
              } = {}) {
        const result = await this.user({
            wait: wait
        })
        return result ? result.data : undefined
    }

    async patch({
                    data, wait = () => {
        }
                } = {}) {
        if (!data) data = {}
        const result = await this.user({
            method: 'PATCH',
            data: data,
            wait: wait,
        })
        return result ? result.data : undefined
    }
}

class Shops {
    shops(config) {
        config = baseConfig(config)
        config.api = 'api/v1/shops/'
        // header, data, wait 均为默认
        return baseSend(config)
    }

    async get({
                  params, wait = () => {
        }
              }) {
        const result = await this.shops({
            method: 'GET',
            params: params,
            wait: wait,
        })
        return result ? result.data : undefined
    }

    async post({
                   data = {}, wait = () => {
        }
               } = {}) {
        const result = await this.shops({
            method: 'POST',
            data: data,
            wait: wait,
        })
        return result ? result.data : undefined
    }

    async delete({
                     data = {}, wait = () => {
        }
                 } = {}) {
        if (!data) data = {}
        const result = await this.shops({
            method: 'DELETE',
            data: data,
            wait: wait,
        })
        return result ? result.data : undefined
    }

    async patch({
                    data = {}, wait = () => {
        }
                }) {
        const result = await this.shops({
            method: 'PATCH',
            data: data,
            wait: wait,
        })
        return result ? result.data : undefined
    }
}

class Bills {
    bill(config) {
        config = baseConfig(config)
        config.api = 'api/v1/bills/'
        // header, data, wait 均为默认
        return baseSend(config)
    }

    async get({
                  pageSize, page, ps = 'true', part, wait = () => {
        }
              }) {
        if (!pageSize) pageSize = 10
        if (!page) page = 0
        if (!part) part = ''
        const result = await this.bill({
            params: {
                'token': getToken('token')[0],
                'page': page,
                'page_size': pageSize,
                'ps': ps,
                'part': part,
            },
            wait: wait,
        })
        try {
            pEnd = result.ps !== 'false' ? result.ps : pEnd
        } catch (e) {
            console.log('无法分页')
        }
        return result ? result.data : undefined
    }
}

class CashOut {
    cashOut(config) {
        config = baseConfig(config)
        config.api = 'api/v1/cash/'
        // header, data, wait 均为默认
        return baseSend(config)
    }

    async get({
                  pageSize=10, page=0, ps = 'true', wait = () => {
        }
              }) {
        const result = await this.cashOut({
            params:{
                'token': getToken('token')[0],
                'page': page,
                'page_size': pageSize,
                'ps': ps,
            },
            wait: wait,
        })
        try {
            pEnd = result.ps !== 'false' ? result.ps : pEnd
        } catch (e) {
            console.log('无法分页')
        }
        return result ? result.data : undefined
    }

    async post({
                   data = {}, wait = () => {
        }
               }) {
        const result = await this.cashOut({
            method: 'POST',
            data: data,
            wait: wait,
        })
        return result ? result.data : undefined
    }

    async patch({
        data = {}, wait =() =>{}
                }){
        const result = await this.cashOut({
            method: 'PATCH',
            data: data,
            wait: wait,
        })
        return result ? result.data : undefined
    }
}


class Log{
    log(config){
        config = baseConfig(config)
        config.api = 'api/v1/logs/'
        return baseSend(config)
    }

    async get({
                  pageSize=10, page=0, ps = 'true', wait = () => {
        }
              }){
        const result = await this.log({
            params:{
                'token': getToken('token')[0],
                'page': page,
                'page_size': pageSize,
                'ps': ps,
            },
            wait: wait,
        })
        try {
            pEnd = result.ps !== 'false' ? result.ps : pEnd
        } catch (e) {
            console.log('无法分页')
        }
        return result ? result.data : undefined
    }

}

class Modal {
    constructor() {
        // view
        this.modal = this.init()
        this.cancel()
        this.setDirection()
    }

    // 插入modal节点
    init() {
        if (!o('.modal')) {
            const modal = c('div')
            modal.className = 'modal'
            modal.innerHTML = `<div class="dialog"><div class="head">
                    <div class="cancel">
                        <svg class="icon" viewBox="0 0 1024 1024"
                             id="mx_n_1708074767823" width="200" height="200">
                            <path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#d81e06"
                                  data-spm-anchor-id="a313x.search_index.0.i7.4ee33a81gER0S3" class="selected"></path>
                            <path d="M258.56 358.912l434.432 434.432a51.2 51.2 0 0 0 72.3968-72.3968L330.9568 286.5152A51.2 51.2 0 1 0 258.56 358.912z"
                                  fill="#d81e06"></path>
                            <path d="M258.56 712.192l434.432-434.432a51.2 51.2 0 0 1 72.448 72.3968l-434.4832 434.432A51.2 51.2 0 1 1 258.56 712.192z"
                                  fill="#d81e06"></path>
                        </svg>
                    </div>
                </div>
                <div class="body">
                  <div class="title">标题</div>
                  <div class="content">内容</div>
                <div class="bottom">操作区</div>
                </div>`
            o('body').appendChild(modal)
            modal.style.display = 'none'
        }
        return o('.modal')
    }

    setDirection() {
        const viewport = getViewportSize()
        const dialog = o('.dialog', this.modal)
        const dialogHead = o('.dialog .head', dialog)
        dialog.style.left = `${(viewport[0] - window.getComputedStyle(dialog).width.replace('px', ' ')) / 2}px`
        dialog.style.top = `${(viewport[1] * 0.15)}px`

        let moving = false
        let startX, startY

        dialogHead.addEventListener('mousedown', function (e) {
            moving = true
            startX = e.clientX
            startY = e.clientY
        })
        this.modal.addEventListener('mousemove', (e) => {
            if (!moving) return
            const originX = parseInt(dialog.style.left.replace('px', ''))
            const originY = parseInt(dialog.style.top.replace('px', ''))
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            dialog.style.left = `${originX + deltaX}px`
            dialog.style.top = `${originY + deltaY}px`
            startX = e.clientX
            startY = e.clientY

        })
        this.modal.addEventListener('mouseup', () => {
            moving = false
        })
    }

    // 模版更新
    renewTemplate(title = '修改', content = '内容', bottom = '') {
        o('.modal .dialog .body .title').innerHTML = title
        o('.modal .dialog .body .content').innerHTML = content
        o('.modal .dialog .bottom').innerHTML = bottom ? bottom : '<div class="btn">提交</div>'
        this.show()

    }

    // 模态框显示
    show() {
        this.modal.style.display = 'block'
    }

    close() {
        this.modal.style.display = 'none'
    }

    // 模态框关闭按钮
    cancel() {
        const cancel = o('.modal .dialog .head .cancel .icon')
        cancel.addEventListener('click', () => {
            this.modal.style.display = 'none'
        })
        cancel.addEventListener('mouseover', function () {
            this.children[1].style.fill = '#F9F9F9'
            this.children[2].style.fill = '#F9F9F9'
        })
        cancel.addEventListener('mouseleave', function () {
            this.children[1].style.fill = '#d81e06'
            this.children[2].style.fill = '#d81e06'
        })
    }
}
