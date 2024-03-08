let p = '0'
let pEnd = '0'
window.addEventListener('load', async () => {
    await new DbView().orderDbShow()
    // all_check()
    new Button()
    new DbBottomView().bottomShow()
})

class DbView {
    constructor() {
        this.dbBody = document.querySelectorAll(`.db-body`)[tab]
        this.line = 1
    }

    // 模版显示
    async orderDbShow(page, ps) {
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
        if (tab === '0') param.user_id = -1
        if (tab === '1') param.user_id = getUid('token')
        const data = await new Order().get(param)
        // console.log(data)
        if (data) this.dbBody.innerHTML = this.orderDbTemp(data)
        else this.dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无订单</div>`
    }

    // 单记录修改
    orderDbLine(row, data) {
        if (data.length > 0) {
            const oldNode = this.dbBody.children[row - 1]
            const tempNode = c('div')
            tempNode.innerHTML = this.orderDbTemp(data)
            tempNode.querySelector('ul').dataset.line = row
            this.dbBody.insertBefore(tempNode.firstChild, oldNode)
            this.dbBody.removeChild(oldNode)
        }
    }

    // 数据渲染
    orderDbTemp(data) {
        this.status = ['待接单', '进行中', '待验收', '已完成', '退款处理', '冻结中', '待发货', '已发货', '已退款', '退款中', '交易成功', '其他']
        this.color = ['grey', '#3b69da', '#a1da3b', 'green', '#252424', '#039eff','grey', '#71e071', '#f70202', '#ff9292', 'green', '#4ba79a']
        let html = ''
        data.forEach(e => {
            if (tab === '0') {
                html += this.dbEasyTemp(e)
            }
            if (tab === '1') html += this.dbTemp(e)
            if (tab === '2') {
                html += this.dbTemp(e)
            }
        })
        return html
    }

    dbEasyTemp(e) {
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

    dbTemp(e) {
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
}

class Button {
    constructor() {
        this.init()
        this.modal = new Modal()
        this.row = null
    }

    async init() {
        const subPage = os('.subPage')[tab]
        if (tab !== '0') {
            // 表格 内部操作
            o('.db .db-body', subPage).addEventListener('click', e => {
                // 单选
                if (e.target.localName === 'input' && e.target.type === "checkbox") this.singleCheck(e.target)
                // 指派
                if (e.target.classList.contains('assign')) this.dialogAssign(e.target)
                // 状态修改
                if (e.target.classList.contains('process')) this.dialogProcess(e.target)
            })
        }

        // 刷新操作 - done
        o('.flash', subPage).addEventListener('click', async () => {
                await new DbView().orderDbShow()
            })
        if (tab === '2') {
            // 修改操作 - done
            o('.update', subPage).addEventListener('click', async () => {
                await this.dialogUpdate()
            })

            // 删除操作
            o('.delete', subPage).addEventListener('click', () => {
                this.dialogDelete()
            })
        }

        // 抢单
        if (tab === '0'){
            const rob = o('.rob', subPage)
            if (!rob) return
            rob.addEventListener('click', async function (){
                const data = {
                    order: this.dataset.id,
                    uid: getUid('token'),
                }
                const result = await new Order().patch({data})
                if(result) {
                    // console.log(result)
                    alert('抢单成功')
                    await new DbView().orderDbShow()
                }else{
                    alert('抢单失败')
                }
            })
        }

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
        const state = ['待接单', '进行中', '待验收', '已完成', '已取消']
        for (let i = 0; i < 5; i++) {
            if(i === 3 && !isAdmin()) break
            if (i === status) option += `<option value=${i} selected>${state[i]}</option>`
            else option += `<option value=${i}>${state[i]}</option>`
        }
        return option
    }

    isChecked() {
        const cb = o('.db .db-body .check input:checked')
        if (cb) return cb
        else alert('请先选择对应订单')
    }

    async contentTemp({type, e}) {
        this.row = getParent(e, 'ul')
        let content = `<div class="tt" data-id="${this.row.dataset.id}">订单号:${this.row.children[2].innerText}</div>`
        if (type === 1) content += `<div class="tt">暂时无法删除</div>`
        if (!type || type === 2) content += `<label class="tt">接单者:<select id="user">${await this.userClass(Number(this.row.dataset.uid))}</select></label>`
        if (!type || type === 3) content += `<label class="tt">订单状态:<select id="status">${this.statusClass(Number(this.row.dataset.status))}</select></label>`
        return content

    }

    async dialogUpdate() {
        const cb = this.isChecked()
        if (!cb) return
        const title = '修改'
        const content = await this.contentTemp({e: cb})
        this.modal.renewTemplate(title, content)
        this.submit()
    }

    async dialogDelete() {
        const cb = this.isChecked()
        if (!cb) return
        const title = '删除'
        const content = await this.contentTemp({type: 1, e: cb})
        this.modal.renewTemplate(title, content)
        alert('暂时无法删除')
    }

    async dialogAssign(e) {
        const title = '指派'
        const content = await this.contentTemp({type: 2, e: e})
        this.modal.renewTemplate(title, content)
        this.submit()
    }

    async dialogProcess(e) {
        if (tab === '2' && !isAdmin()) {
            alert('非法进入')
            window.location.href = 'index.html'
            return
        }
        const title = '状态修改'
        const content = await this.contentTemp({type: 3, e: e})
        this.modal.renewTemplate(title, content)
        this.submit()
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
            let value
            if (tab === '1') value = await new Order().patch({data})
            else value = await new Order().put({data})
            if (value) new DbView().orderDbLine(this.row.dataset.line, [value])
            else alert('error')
            this.modal.close()
        })


    }

}


// 全选
function all_check() {
    const ac = o('.all-check input')
    ac.addEventListener('click', () => {
        const cs = os('.check input')
        cs.forEach(e => {
            e.checked = ac.checked
        })
    })
}

class DbBottomView {
    constructor() {
        this.foot = o('.db-bottom', os('.subPage')[tab])
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
            await new DbView().orderDbShow(--p, 'false')
            this.bottomShow()
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async() => {
            this.foot.innerHTML = ''
            await new DbView().orderDbShow(++p, 'false')
            this.bottomShow()
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change',async function() {
            const goP = this.value - 1
            if (goP >= 0 && goP <= Number(pEnd)){
                this.foot.innerHTML = ''
                await new DbView().orderDbShow(goP, 'false')
                p = goP
                new DbBottomView().bottomShow()
            }else{
                alert('页面不存在')
            }

        })
    }
}
