let p = '0'
let pEnd = '0'

window.addEventListener('load', async () => {
    await new OrderTab().showTab()

})

class OrderTab {
    async showTab() {
        switch (tab) {
            case '0':
                await new PublicOrder().orderDbShow()
                break
            case '1':
                await new PrivateOrder().orderDbShow()
                break
            case '2':
                await new OpOrder().orderDbShow()
                break
            default:
                break
        }
    }
}

class PublicOrder {
    constructor() {
        this.subPage = os('.subPage')[tab]
        this.dbBody = o('.db-body', this.subPage)
        this.line = 1
        this.foot = o('.db-bottom', this.subPage)
        this.status = ['待接单', '进行中', '待验收', '已完成', '退款处理', '冻结中', '待发货', '已发货', '已退款', '退款中', '交易成功', '其他']
        this.color = ['grey', '#3b69da', '#a1da3b', 'green', '#252424', '#039eff','grey', '#71e071', '#f70202', '#ff9292', 'green', '#4ba79a']
        this.opButton()
    }

    async orderDbShow(page, ps) {
        const param = {
            page: page,
            ps: ps,
            pageSize: 10,
            user_id: -1,
            wait: () => {
                this.dbBody.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            },
        }
        const data = await new Order().get(param)
        if (data) {
            this.dbBody.innerHTML = this.orderDbTemp(data)
            this.robButton()
            this.bottomShow()
        } else this.dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无订单</div>`

    }

    orderDbTemp(data) {
        let html = ''
        data.forEach(e => {
            html += this.orderDbTempLine(e)
        })
        return html
    }

    orderDbTempLine(e) {
        return `<ul class="db-tr"><li class="value"><div class="rob sBox" data-id=${e.id}>抢单</div></li>
                              <li class="value">${e.tid ? e.tid : '暂无'}</li>
                              <li class="value">${e.payment ? e.payment : '暂无'}</li>
                              <li class="value">${e.refundfee ? e.refundfee : '暂无'}</li>
                              <li class="value">${e.item ? e.item : '暂无'}</li>
                              <li class="value">${e.createTime ? e.createTime.replace('T', ' ') : '暂无'}</li>
                              <li class="value">${e.buyer ? e.buyer : '暂无'}</li>
                              <li class="value"><div class="process sBox" style="background-color: ${this.color[e.status]};">${this.status[e.status]}</div></li>
                              <li class="value"><div class="sBox" style="background-color: ${this.color[e.tbstatus + 6]};">${this.status[e.tbstatus + 6]}</div></li>
                          </ul>`
    }

    robButton = () => {
        // 抢单
        const robs = os('.rob', this.subPage)
        if (robs.length < 1) return
        robs.forEach(e => {
            e.addEventListener('click', async () => {
                const data = {
                    order: e.dataset.id,
                    uid: getUid('token'),
                }
                const result = await new Order().patch({data})
                if (result) {
                    // console.log(result)
                    alert('抢单成功')
                    await this.orderDbShow()
                } else {
                    alert('抢单失败')
                }
            })
        })
    }

    opButton() {
        const flashButton = () => {
            // 刷新
            o('.flash', this.subPage).addEventListener('click', async () => {
                await this.orderDbShow(p)
            })
        }
        flashButton()
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
            await this.orderDbShow(--p, 'false')
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.orderDbShow(++p, 'false')
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change', async () => {
            const goP = o('.go-page input', this.foot).value - 1
            if (goP >= 0 && goP <= Number(pEnd)) {
                this.foot.innerHTML = ''
                await this.orderDbShow(goP, 'false')
                p = goP
            } else {
                alert('页面不存在')
            }

        })
    }
}

class PrivateOrder{
    constructor() {
        this.modal = new Modal()
        this.subPage = os('.subPage')[tab]
        this.dbBody = o('.db-body', this.subPage)
        this.line = 1
        this.foot = o('.db-bottom', this.subPage)
        this.status = ['待接单', '进行中', '待验收', '已完成', '退款处理', '冻结中', '待发货', '已发货', '已退款', '退款中', '交易成功', '其他']
        this.color = ['grey', '#3b69da', '#a1da3b', 'green', '#252424', '#039eff','grey', '#71e071', '#f70202', '#ff9292', 'green', '#4ba79a']
        this.row = null
        this.opButton()
        this.processButton()
    }

    async orderDbShow(page, ps){
        const param = {
            page: page,
            ps: ps,
            pageSize: 10,
            user_id: getUid('token'),
            wait: () => {
                this.dbBody.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            },
        }
        const data = await new Order().get(param)
        if (data) {
            this.dbBody.innerHTML = this.orderDbTemp(data)
            this.bottomShow()
        }
        else this.dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无订单</div>`
    }

    orderDbTemp(data) {
        let html = ''
        data.forEach(e => {
            html += this.orderDbTempLine(e)
        })
        return html
    }

    orderDbTempLine(e){
        let html = ''
        html += `<ul class="db-tr" data-line="${this.line++}" data-id=${e.id} data-uid="${e.user ? e.user.id : 0}" data-status="${e.status}">
<li class="check"><label><input type="checkbox"></label></li>`
        e.user ? html += `<li class="value">${e.user.uname}</li>` :
            html += `<li class="value"><div class="assign sBox">指派</div></li>`
        html += `<li class="value">${e.tid ? e.tid : '暂无'}</li>
                          <li class="value">${e.user ? Math.floor(e.user.divide * e.payment /100) : 0}</li>
                          <li class="value">${e.payment ? e.payment : '暂无'}</li>
                          <li class="value">${e.refundfee ? e.refundfee : '暂无'}</li>
                          <li class="value">${e.item ? e.item : '暂无'}</li>
                          <li class="value">${e.createTime ? e.createTime.replace('T', ' ') : '暂无'}</li>
                          <li class="value">${e.buyer ? e.buyer : '暂无'}</li>
                          <li class="value"><div class="process sBox" style="background-color: ${this.color[e.status]};">${this.status[e.status]}</div></li>
                          <li class="value"><div class="sBox" style="background-color: ${this.color[e.tbstatus + 6]};">${this.status[e.tbstatus + 6]}</div></li>
                         </ul>`
        return html
    }

    async pageFlash() {
        await this.orderDbShow(p)
    }

    singleCheck(e) {
        if (e.checked) {
            const checked = o('.check-active')
            if (checked) {
                checked.checked = false
                checked.classList.remove('check-active')
            }
            e.classList.add('check-active')
        } else e.classList.remove('check-active')
    }

    processButton(){
        const statusClass= (status=0)=> {
            let option = ``
            const state = ['待接单', '进行中', '待验收', '已完成', '退款处理']
            for (let i = 0; i < 5; i++) {
                if(i === 3 && !isAdmin()) break
                if (i === status) option += `<option value=${i} selected>${state[i]}</option>`
                else option += `<option value=${i}>${state[i]}</option>`
            }
            return option
        }
        const dialogProcess = (e)=>{
            this.row = getParent(e, 'ul')
            const title = '状态修改'
            const content = `<div class="tt" data-id="${this.row.dataset.id}">订单号:${this.row.children[2].innerText}</div>
                                    <label class="tt">订单状态:<select id="status">${statusClass(Number(this.row.dataset.status))}</select></label>`
            this.modal.renewTemplate(title, content)
            o('.modal .bottom .btn').addEventListener('click', async () => {
                const data = {
                    'order': this.row.dataset.id,
                    'status': o('#status').value,
                }
                const result = await new Order().patch({data})
                if (result) await this.pageFlash()
                else alert('error')
                this.modal.close()
            })

        }

        o('.db .db-body', this.subPage).addEventListener('click', e => {
            // 单选
            if (e.target.localName === 'input' && e.target.type === "checkbox") this.singleCheck(e.target)
            // 状态修改
            if (e.target.classList.contains('process')) dialogProcess(e.target)
        })
    }

    opButton() {
        const flashButton = () => {
            // 刷新
            o('.flash', this.subPage).addEventListener('click', async () => {
                await this.pageFlash()
            })
        }
        flashButton()
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
            await this.orderDbShow(--p, 'false')
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.orderDbShow(++p, 'false')
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change', async () => {
            const goP = o('.go-page input', this.foot).value - 1
            if (goP >= 0 && goP <= Number(pEnd)) {
                this.foot.innerHTML = ''
                await this.orderDbShow(goP, 'false')
                p = goP
            } else {
                alert('页面不存在')
            }

        })
    }
}

class OpOrder{
    constructor() {
        this.modal = new Modal()
        this.subPage = os('.subPage')[tab]
        this.dbBody = o('.db-body', this.subPage)
        this.line = 1
        this.foot = o('.db-bottom', this.subPage)
        this.status = ['待接单', '进行中', '待验收', '已完成', '退款处理', '冻结中', '待发货', '已发货', '已退款', '退款中', '交易成功', '其他']
        this.color = ['grey', '#3b69da', '#a1da3b', 'green', '#252424', '#039eff','grey', '#71e071', '#f70202', '#ff9292', 'green', '#4ba79a']
        this.row = null
        this.opButton()
        this.bodyDbButton()
    }

    async orderDbShow(page, ps){
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
        const data = await new Order().get(param)
        if (data) {
            this.dbBody.innerHTML = this.orderDbTemp(data)
            this.bottomShow()
        }
        else this.dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无订单</div>`
    }

    orderDbTemp(data) {
        let html = ''
        data.forEach(e => {
            html += this.orderDbTempLine(e)
        })
        return html
    }

    orderDbTempLine(e){
        let html = ''
        html += `<ul class="db-tr" data-line="${this.line++}" data-id=${e.id} data-uid="${e.user ? e.user.id : 0}" data-status="${e.status}">
<li class="check"><label><input type="checkbox"></label></li>`
        e.user ? html += `<li class="value">${e.user.uname}</li>` :
            html += `<li class="value"><div class="assign sBox">指派</div></li>`
        html += `<li class="value">${e.tid ? e.tid : '暂无'}</li>
                          <li class="value">${e.user ? Math.floor(e.user.divide * e.payment /100) : 0}</li>
                          <li class="value">${e.payment ? e.payment : '暂无'}</li>
                          <li class="value">${e.refundfee ? e.refundfee : '暂无'}</li>
                          <li class="value">${e.item ? e.item : '暂无'}</li>
                          <li class="value">${e.createTime ? e.createTime.replace('T', ' ') : '暂无'}</li>
                          <li class="value">${e.buyer ? e.buyer : '暂无'}</li>
                          <li class="value"><div class="process sBox" style="background-color: ${this.color[e.status]};">${this.status[e.status]}</div></li>
                          <li class="value"><div class="sBox" style="background-color: ${this.color[e.tbstatus + 6]};">${this.status[e.tbstatus + 6]}</div></li>
                         </ul>`
        return html
    }

    async pageFlash() {
        await this.orderDbShow(p)
    }


    async userClass(uid = 0) {
        const params = {}
        const user = await new Users().get(params)
        let option = ''
        if (uid-- === 0) option = `<option value="" selected disabled>请选择</option>`
        for (let i in user) {
            if (i === `${uid}`) option += `<option value="${user[i].id}" selected>${user[i].uname}</option>`
            else option += `<option value="${user[i].id}">${user[i].uname}</option>`
        }
        return option
    }

    statusClass(status = 0) {
        let option = ``
        const state = ['待接单', '进行中', '待验收', '已完成', '退款处理']
        for (let i = 0; i < 5; i++) {
            if(i === 3 && !isAdmin()) break
            if (i === status) option += `<option value=${i} selected>${state[i]}</option>`
            else option += `<option value=${i}>${state[i]}</option>`
        }
        return option
    }

    async contentTemp({type, e}) {
        this.row = getParent(e, 'ul')
        let content = `<div class="tt" data-id="${this.row.dataset.id}">订单号:${this.row.children[2].innerText}</div>`
        if (type === 1) content += `<div class="tt" style="color:red">确定要删除吗?</div>`
        if (!type || type === 2) content += `<label class="tt">接单者:<select id="user">${await this.userClass(Number(this.row.dataset.uid))}</select></label>`
        if (!type || type === 3) content += `<label class="tt">订单状态:<select id="status">${this.statusClass(Number(this.row.dataset.status))}</select></label>`
        return content

    }

    bodyDbButton(){
        const singleCheck = e =>{
            if (e.checked) {
                const checked = o('.check-active')
                if (checked) {
                    checked.checked = false
                    checked.classList.remove('check-active')
                }
                e.classList.add('check-active')
            } else e.classList.remove('check-active')
        }

        const dialogProcess= async (e) => {
            const title = '状态修改'
            const content = await this.contentTemp({type: 3, e: e})
            this.modal.renewTemplate(title, content)
            this.submit()
        }
        const dialogAssign = async (e) => {
            const title = '指派'
            const content = await this.contentTemp({type: 2, e: e})
            this.modal.renewTemplate(title, content)
            this.submit()
        }


        o('.db .db-body', this.subPage).addEventListener('click', async e => {
            // 单选
            if (e.target.localName === 'input' && e.target.type === "checkbox") {
                singleCheck(e.target)
            }
            // 指派
            if (e.target.classList.contains('assign')) {
                await dialogAssign(e.target)
            }
            // 状态修改
            if (e.target.classList.contains('process')) await dialogProcess(e.target)
        })
    }
    submit() {
        o('.modal .bottom .btn').addEventListener('click', async () => {
            const id = this.row.dataset.id
            const uid = o('#user')
            const status = o('#status')
            const data = {
                'order': id,
            }
            if (uid) data.uid = uid.value
            if (status) data.status = status.value
            const result = await new Order().put({data})
            if (result) await this.pageFlash()
            else alert('error')
            this.modal.close()
        })


    }
    opButton() {

        const flashButton = () => {
            // 刷新
            o('.flash', this.subPage).addEventListener('click', async () => {
                await this.pageFlash()
            })
        }
        const isChecked = () => {
            const cb = o('.db .db-body .check input:checked')
            if (cb) return cb
            else alert('请先选择对应订单')
        }
        const dialogDelete = async () => {
            const cb = isChecked()
            if (!cb) return
            const title = '删除'
            const content = await this.contentTemp({type: 1, e: cb})
            this.modal.renewTemplate(title, content)
            o('.dialog .bottom .btn').addEventListener('click', async() =>{
                const data = {
                    id: this.row.dataset.id
                }
                const result = new Order().delete({data})
                if (result){
                    alert('删除成功')
                    await this.orderDbShow(p)
                }
                else alert('删除失败')
                this.modal.close()

            })

        }
        const deleteButton = () =>{
            // 删除操作
            o('.delete', this.subPage).addEventListener('click', async () => {
                await dialogDelete()
            })
        }
        const dialogUpdate = async () => {
            const cb = isChecked()
            if (!cb) return
            const title = '修改'
            const content = await this.contentTemp({e: cb})
            this.modal.renewTemplate(title, content)
            this.submit()
        }
        const updateButton = () =>{
            // 更新操作
            o('.update', this.subPage).addEventListener('click', async () => {
                await dialogUpdate()
            })
        }
        flashButton()
        deleteButton()
        updateButton()
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
            await this.orderDbShow(--p, 'false')
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.orderDbShow(++p, 'false')
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change', async () => {
            const goP = o('.go-page input', this.foot).value - 1
            if (goP >= 0 && goP <= Number(pEnd)) {
                this.foot.innerHTML = ''
                await this.orderDbShow(goP, 'false')
                p = goP
            } else {
                alert('页面不存在')
            }

        })
    }
}