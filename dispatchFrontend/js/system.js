let p = '0'
let pEnd = '0'
window.addEventListener('load', async () => {
    await new SystemTab().showTab()

})

class SystemTab {
    async showTab() {
        switch (tab) {
            case '0':
                await this.infoTemp()
                break
            case '1':
                await this.infoChangeTemp()
                break
            case '2':
                const userDbView = new UsersOpView()
                await userDbView.userDbShow()
                userDbView.bottomShow()
                break
            case '3':
                await new ShopOpView().shopDbShow()
                break
            case '4':
                const logDbView = new LogsOpView()
                await logDbView.logDbShow()
                logDbView.bottomShow()
                break
            default:
                break
        }
    }

    async getPrivateUserData() {
        const infoBox = os('.infoBox')[tab]
        const param = {
            wait: () => {
                infoBox.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            }
        }
        return await new User().get(param)
    }

    async infoTemp() {
        const infoBox = os('.infoBox')[tab]
        const data = await this.getPrivateUserData()
        infoBox.innerHTML = `<li class="line"><div class="tt">姓名:</div><span class="value">${data.uname}</span></li>
                            <li class="line"><div class="tt">用户名:</div><span class="value">${data.username}</span></li>
                            <li class="line"><div class="tt">权限:</div><span class="value">${data.role}</span></li>
                            <li class="line"><div class="tt">分成比例:</div><span class="value">${data.divide}</span></li>
                            <li class="line"><div class="tt">手机号:</div><span class="value">${data.phone}</span></li>
                            <li class="line"><div class="tt">支付宝账号:</div><span class="value">${data.alipay}</span></li>`
    }

    async infoChangeTemp() {
        const infoBox = os('.infoBox')[tab]
        o('.submit').addEventListener('click', async () => {
            const lines = os('.line', infoBox)
            const oldPassword = o('input', lines[0]).value
            const newPassword = o('input', lines[1]).value
            const verifyPassword = o('input', lines[2]).value
            if (!oldPassword || !newPassword || !verifyPassword) {
                alert('值不可为空')
                return
            }
            if (verifyPassword !== newPassword) {
                alert('密码比对错误')
                return
            }
            const data = await new User().patch({
                data: {
                    oldPassword: oldPassword,
                    newPassword: newPassword
                }
            })
            data ? alert('修改成功') : alert('修改失败')

        })
    }

}

class UsersOpView {
    constructor() {
        this.modal = new Modal()
        this.dbBody = o('.db-body', os('.subPage')[tab])
        this.line = 1
        this.foot = o('.db-bottom', os('.subPage')[tab])
        this.row = null
        this.opButton()
    }

    // 模版显示
    async userDbShow(page, ps) {
        const param = {
            page: page,
            ps: ps,
            pageSize: 10,
            wait: () => {
                this.dbBody.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            },
        }
        const data = await new Users().get(param)
        if (data) this.dbBody.innerHTML = this.userDbTemp(data)
        else this.dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无用户</div>`
    }

    userDbTemp(data) {
        let html = ''
        data.forEach(e => {
            html += this.userDbTempLine(e)
        })
        return html
    }

    userDbTempLine(e) {
        const roles = ['管理员', '用户', '其他']
        let html = ''
        html += `<ul class="db-tr" data-line="${this.line++}" data-id="${e.id}" data-role="${e.role}">
                  <li class="check"><label><input type="checkbox"></label></li>`
        html += `<li class="value">${e.id}</li>
                          <li class="value">${e.username}</li>
                          <li class="value">${e.uname}</li>
                          <li class="value">${roles[e.role]}</li>
                          <li class="value">${e.divide}</li>
                          <li class="value">${e.phone}</li>
                          <li class="value">${e.alipay}</li>
                         </ul>`
        return html
    }

    bottomShow() {
        let html = ''
        const curr_p = Number(p)
        const curr_pEnd = Number(pEnd)
        if (curr_p !== 0) html += `<li><div class="prev">上一页</div></li>`
        html += `<li class="go-page">前往第<label><input type="text" placeholder="${curr_p + 1}">页</label></li>`
        if (curr_p !== curr_pEnd) html += `<li><div class="next">下一页</div></li>`
        this.foot.innerHTML = html
        if (curr_p !== 0) this.prev()
        this.go()
        if (curr_p !== curr_pEnd) this.next()
    }

    prev() {
        o('.prev', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.userDbShow(--p, 'false')
            this.bottomShow()
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.userDbShow(++p, 'false')
            this.bottomShow()
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change', async () => {
            const goP = o('.go-page input', this.foot).value - 1
            if (goP >= 0 && goP <= Number(pEnd)) {
                this.foot.innerHTML = ''
                await this.userDbShow(goP, 'false')
                p = goP
                this.bottomShow()
            } else {
                alert('页面不存在')
            }

        })
    }

    opButton() {
        const subPage = os('.subPage')[tab]// 表格 内部操作
        o('.db .db-body', subPage).addEventListener('click', e => {
            // 单选
            if (e.target.localName === 'input' && e.target.type === "checkbox") singleCheck(e.target)
        })
        // 刷新操作 - done
        o('.flash', subPage).addEventListener('click', async () => {
            await this.userDbShow()
            await this.bottomShow()
        })

        // 修改操作 - done
        o('.update', subPage).addEventListener('click', async () => {
            await dialogUpdate()
        })

        // 删除操作
        o('.delete', subPage).addEventListener('click', async () => {
            await dialogDelete()
        })

        // 新增操作
        o('.add', subPage).addEventListener('click', async () => {
            await dialogAdd()
        })

        function isChecked() {
            const cb = o('.db .db-body .check input:checked')
            if (cb) return cb
            else alert('请先选择对应订单')
        }

        function singleCheck(e) {
            if (e.checked) {
                const checked = o('.check-active')
                if (checked) {
                    checked.checked = false
                    checked.classList.remove('check-active')
                }
                e.classList.add('check-active')
            } else e.classList.remove('check-active')
        }

        const dialogUpdate = async () => {
            const cb = isChecked()
            if (!cb) return
            const title = '修改'
            const content = contentTemp({e: cb})
            this.modal.renewTemplate(title, content)
            o('.modal .bottom .btn').addEventListener('click', async () => {
                    const data = {
                        id: this.row.dataset.id,
                        uname: o('#uname').value,
                        role: o('#role').value,
                        divide: o('#divide').value,
                        phone: o('#phone').value,
                        alipay: o('#alipay').value,
                    }
                    if (o('#password').value) data.password = o('#password').value
                    const result = await new Users().put({data})
                    if (result) {
                        alert('修改成功')
                        await this.userDbShow()
                        await this.bottomShow()
                    } else alert('error')
                    this.modal.close()
                }
            )
        }

        const dialogDelete = () => {
            const cb = isChecked()
            if (!cb) return
            const title = '删除'
            const content = contentTemp({type: 1, e: cb})
            this.modal.renewTemplate(title, content)
            alert('暂时无法删除')
        }

        // 新增菜单
        const dialogAdd = () => {
            const title = '新增用户'
            const content = `<label class="tt">用户名:<input id="username" placeholder="请输入用户名"></label>
                                    <label class="tt">姓名:<input id="uname" placeholder="请输入姓名"></label>
                                    <label class="tt">密码:<input id="password" placeholder="请输入密码"></label>
                                    <label class="tt">权限:<select id="role">${roleClass('1')}</select></label>
                                    <label class="tt">分成比:<input id="divide" placeholder="请输入百分比整数"></label>
                                    <label class="tt">手机号:<input id="phone" placeholder="请输入手机号"></label>
                                    <label class="tt">支付宝:<input id="alipay" placeholder="请输入支付宝账号"></label>`
            this.modal.renewTemplate(title, content)
            o('.modal .bottom .btn').addEventListener('click', async () => {
                const data = {
                    username: o('#username').value,
                    uname: o('#uname').value,
                    password: o('#password').value,
                    role: o('#role').value,
                    divide: o('#divide').value,
                    phone: o('#phone').value,
                    alipay: o('#alipay').value,
                }
                const result = await new Users().post({data})
                if (result) {
                    alert('增加成功')
                    await this.userDbShow()
                    await this.bottomShow()
                } else alert('error')
                this.modal.close()
            })


        }

        const roleClass = (role) => {
            let html = ''
            const roleType = ['管理员', '用户', '其他']
            for (let i in roleType) {
                if (role === i) html += `<option value=${i} selected>${roleType[i]}</option>`
                else html += `<option value=${i}>${roleType[i]}</option>`
            }
            return html
        }

        const contentTemp = ({type, e}) => {
            this.row = getParent(e, 'ul')
            const children = this.row.children
            let content = `<label class="tt">用户名:${children[2].innerText}</label>`
            if (type === 1) content += `<div class="tt">暂时无法删除</div>`
            else {
                content += `<label class="tt">姓名:<input id="uname" value="${children[3].innerText}"></label>
                            <label class="tt">密码:<input id="password" value=""></label>
                            <label class="tt">权限:<select id="role">${roleClass(this.row.dataset.role)}</select></label>
                            <label class="tt">分成:<input id="divide" value="${children[5].innerText}"></label>
                            <label class="tt">手机号:<input id="phone" value="${children[6].innerText}"></label>
                            <label class="tt">支付宝:<input id="alipay" value="${children[7].innerText}"></label>`
            }
            return content
        }
    }


}

class ShopOpView {
    constructor() {
        this.modal = new Modal()
        this.dbBody = o('.db-body', os('.subPage')[tab])
        this.line = 1
        this.row = null
        this.opButton()
    }

    // 模版显示
    async shopDbShow() {
        const param = {
            wait: () => {
                this.dbBody.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            },
        }
        const data = await new Shops().get(param)
        if (data) {
            this.dbBody.innerHTML = this.shopDbTemp(data)
            // 授权
            const empowers = os('.empower', this.dbBody)
            if (empowers.length > 0) {
                empowers.forEach(e => {
                    e.addEventListener('click', function () {
                        const row = getParent(this, 'ul')
                        window.location.href = `https://alds.agiso.com/authorize.aspx?appId=${row.children[1].innerText}&state=${row.dataset.id}`
                    })
                })
            }
        }
        else this.dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无用户</div>`
    }

    shopDbTemp(data) {
        let html = ''
        data.forEach(e => {
            html += this.shopDbTempLine(e)
        })
        return html
    }

    shopDbTempLine(e) {
        let html = ''
        html += `<ul class="db-tr" data-line="${this.line++}" data-id="${e.id}">
                  <li class="check"><label><input type="checkbox"></label></li>`
        html += `<li class="value">${e.appid ? e.appid : `<div class="tipBox">待补充</div>`}</li>
                  <li class="value">${e.secret ? `<div class="tipBox" style="background-color: #A1DA3BFF;">已填充</div>` : `<div class="tipBox">待补充</div>`}</li>`
        if (!e.name) {
            html += `<li class="value" style="flex:3;padding-left:4px; "><div class="tipBox empower">授权</div></li>`
        } else {
            html += `<li class="value">${e.name}</li>
                    <li class="value">${e.deadline.replace('T', ' ')}</li>
                    <li class="value">${e.platform}</li>
                </ul>`
        }
        return html
    }

    opButton() {
        const subPage = os('.subPage')[tab]// 表格 内部操作
        o('.db .db-body', subPage).addEventListener('click', e => {
            // 单选
            if (e.target.localName === 'input' && e.target.type === "checkbox") singleCheck(e.target)
        })
        // 刷新操作 - done
        o('.flash', subPage).addEventListener('click', async () => {
            await this.shopDbShow()
        })

        o('.add', subPage).addEventListener('click', async () => {
            await dialogAdd()
        })

        // 删除操作
        o('.delete', subPage).addEventListener('click', async () => {
            await dialogDelete()
        })

        // 补充
        o('.patch', subPage).addEventListener('click', async () => {
            await dialogPatch()
        })

        function isChecked() {
            const cb = o('.db .db-body .check input:checked')
            if (cb) return cb
            else alert('请先选择对应订单')
        }

        function singleCheck(e) {
            if (e.checked) {
                const checked = o('.check-active')
                if (checked) {
                    checked.checked = false
                    checked.classList.remove('check-active')
                }
                e.classList.add('check-active')
            } else e.classList.remove('check-active')
        }

        const dialogPatch = async () => {
            const cb = isChecked()
            if (!cb) return
            this.row = getParent(cb, 'ul')
            const title = 'SppSecret修改'
            const content = `<label class="tt">AppId:${this.row.children[1].innerText}</label>
                                    <label class="tt">AppSecret:<input type="text" id="secret" value="${this.row.children[2].innerText === '待补充' ? '' : ''}" placeholder="请重新输入"></label>`
            this.modal.renewTemplate(title, content)
            o('.modal .bottom .btn').addEventListener('click', async () => {
                const data = {
                    shop_id: this.row.dataset.id,
                    secret: o('#secret').value,
                }
                const result = await new Shops().patch({data})
                if (result) {
                    console.log(result)
                    alert('修改成功')
                    this.modal.close()
                    await this.shopDbShow()
                } else {
                    alert('error')
                    this.modal.close()
                }
            })
        }

        const dialogDelete = async () => {
            const cb = isChecked()
            if (!cb) return
            const title = '删除'
            const content = contentTemp({type: 1, e: cb})
            this.modal.renewTemplate(title, content)
            // alert('暂时无法删除')
            await submit()
        }

        const dialogAdd = () => {
            const title = '新增店铺'
            const content = `<label class="tt">AppId:<input type="text" id="appid"></label>
                                    <label class="tt">AppSecret:<input type="text" id="secret"></label>`
            this.modal.renewTemplate(title, content)
            o('.modal .bottom .btn').addEventListener('click', async () => {
                const data = {
                    appid: o('#appid').value,
                    secret: o('#secret').value,
                }
                const result = await new Shops().post({data})
                if (result) await this.shopDbShow()
                this.modal.close()
            })
        }

        const contentTemp = ({type, e}) => {
            this.row = getParent(e, 'ul')
            const children = this.row.children
            let content = `<label class="tt">店铺:${children[2].innerText}</label>`
            if (type === 1) content += `<div class="tt" style="color: red">是否要删除？</div>`
            return content
        }

        // 仅删除
        const submit = async () => {
            o('.modal .bottom .btn').addEventListener('click', async () => {
                    const data = {
                        shopId: this.row.dataset.id,
                    }
                    const result = await new Shops().delete({data})
                    if (result) {
                        alert('删除成功')
                        await this.shopDbShow()
                    } else alert('error')
                    this.modal.close()
                }
            )
        }
    }
}


class LogsOpView{
    constructor() {
        this.modal = new Modal()
        this.dbBody = o('.db-body', os('.subPage')[tab])
        this.foot = o('.db-bottom', os('.subPage')[tab])
        this.line = 1
        this.row = null
        this.opButton()
    }

    async logDbShow(page, ps){
        const param = {
            page: page,
            ps: ps,
            pageSize: 10,
            wait: () => {

                this.dbBody.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            },
        }
        const data = await new Log().get(param)
        if (data) this.dbBody.innerHTML = this.logDbTemp(data)
        else this.dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无日志记录</div>`
    }

    logDbTemp(data){
        let html = ''
        data.forEach(e=>{
            html += this.logDbTempLine(e)
        })
        return html
    }

    logDbTempLine(e){
        return `<ul class="db-tr" data-line="${this.line++}" data-id="${e.id}">
                  <li class="check"><label><input type="checkbox"></label></li>
                  <li class="value">${e.tag}</li>
                  <li class="value">${e.happenTime.replace('T', ' ')}</li>
                  <li class="value">${e.target}</li>
                  <li class="value">${e.things}</li></ul>`
    }

    bottomShow() {
        let html = ''
        const curr_p = Number(p)
        const curr_pEnd = Number(pEnd)
        if (curr_p !== 0) html += `<li><div class="prev">上一页</div></li>`
        html += `<li class="go-page">前往第<label><input type="text" placeholder="${curr_p + 1}">页</label></li>`
        if (curr_p !== curr_pEnd) html += `<li><div class="next">下一页</div></li>`
        this.foot.innerHTML = html
        if (curr_p !== 0) this.prev()
        this.go()
        if (curr_p !== curr_pEnd) this.next()
    }

    prev() {
        o('.prev', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.logDbShow(--p, 'false')
            this.bottomShow()
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.logDbShow(++p, 'false')
            this.bottomShow()
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change', async () => {
            const goP = o('.go-page input', this.foot).value - 1
            if (goP >= 0 && goP <= Number(pEnd)) {
                this.foot.innerHTML = ''
                await this.logDbShow(goP, 'false')
                p = goP
                this.bottomShow()
            } else {
                alert('页面不存在')
            }

        })
    }

    opButton() {
        const subPage = os('.subPage')[tab]// 表格 内部操作
        o('.db .db-body', subPage).addEventListener('click', e => {
            // 单选
            if (e.target.localName === 'input' && e.target.type === "checkbox") singleCheck(e.target)
        })
        // 刷新操作 - done
        o('.flash', subPage).addEventListener('click', async () => {
            await this.logDbShow()
            await this.bottomShow()
        })

        // 删除操作
        o('.delete', subPage).addEventListener('click', async () => {
            await dialogDelete()
        })

        // 查看操作
        // 删除操作
        o('.read', subPage).addEventListener('click', async () => {
            await dialogRead()
        })


        function isChecked() {
            const cb = o('.db .db-body .check input:checked')
            if (cb) return cb
            else alert('请先选择对应订单')
        }

        function singleCheck(e) {
            if (e.checked) {
                const checked = o('.check-active')
                if (checked) {
                    checked.checked = false
                    checked.classList.remove('check-active')
                }
                e.classList.add('check-active')
            } else e.classList.remove('check-active')
        }

        const dialogDelete = () => {
            const cb = isChecked()
            if (!cb) return
            const title = '删除'
            const content = `<div class="tt">暂时无法删除</div>`
            this.modal.renewTemplate(title, content)
            const submit = o('.dialog .bottom .btn')
            submit.addEventListener('click', ()=>{
                alert('暂时无法删除')
            })
        }

        const dialogRead = () => {
            const cb = isChecked()
            if (!cb) return
            this.row = getParent(cb, 'ul')
            const title = '详情查看'
            const content = `<div class="tt">事件类型:${this.row.children[1].innerHTML}</div>
                                    <div class="tt">发生时间:${this.row.children[2].innerHTML}</div>
                                    <div class="tt">操作者:${this.row.children[3].innerHTML}</div>
                                    <div class="tt">事件内容:${this.row.children[4].innerHTML}</div>`
            this.modal.renewTemplate(title, content)
            const close = o('.dialog .bottom .btn')
            close.innerText = '关闭'
            close.addEventListener('click', ()=>{
                this.modal.close()
            })
        }
    }
}




