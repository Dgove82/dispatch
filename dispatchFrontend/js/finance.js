let p = '0'
let pEnd = '0'
window.addEventListener('load', async () => {
    await new FinanceTab()
})

class FinanceTab{
    constructor() {
        this.showTab()
    }

    async showTab() {
        switch (tab) {
            case '0':
                await new UserBillView().billDbShow()
                break
            case '1':
                await new Wallet().walletShow()
                break
            case '2':
                await new OpCashView().cashesDbShow()
                break
            case '3':
                await new OpBillView().billsDbShow()
                break
            default:
                break
        }
    }
}

class UserBillView{
    constructor() {
        this.subPage = os('.subPage')[tab]
        this.foot = o('.db-bottom', this.subPage)
        this.opButton()
    }

    async billDbShow(page, ps){
        const dbBody = o('.db-body', this.subPage)
        const param = {
            page: page,
            ps: ps,
            pageSize: 10,
            part: 'true',
            wait: () => {
                dbBody.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            },
        }
        const data = await new Bills().get(param)
        // console.log(data)
        if(data) {
            dbBody.innerHTML = this.billDbTemp(data)
            this.bottomShow()
        }
        else dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无账单</div>`

    }

    billDbTemp(data){
        let html = ''
        data.forEach(e => {
            html += this.billDbTempLine(e)
        })
        return html
    }

    billDbTempLine(e){
        return `<ul class="db-tr" data-id="${e.id}">
                <li class="value">${e.other ? e.other : '订单:'+e.order.tid}</li>
                <li class="value">${e.amount}</li>
                <li class="value">${e.notes}</li>
                <li class="value">${e.createTime.replace('T', ' ')}</li></ul>`
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
            await this.billDbShow(--p, 'false')
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.billDbShow(++p, 'false')
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change', async () => {
            const goP = o('.go-page input', this.foot).value - 1
            if (goP >= 0 && goP <= Number(pEnd)) {
                this.foot.innerHTML = ''
                await this.billDbShow(goP, 'false')
                p = goP
            } else {
                alert('页面不存在')
            }

        })
    }
    async flash(){
        await this.billDbShow(p)
    }
    async opButton() {
        o('.flash', this.subPage).addEventListener('click', async () => {
            await this.flash()
        })
    }


}

class Wallet{
    constructor() {
        this.infoBox = o('.infoBox', os('.subPage')[tab])
        this.modal = new Modal()
    }
    async getPrivateUserData() {
        const param = {
            wait: () => {
                this.infoBox.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            }
        }
        return await new User().get(param)
    }

    async walletShow(){
        const data = await this.getPrivateUserData()
        this.infoBox.innerHTML = this.walletTemp(data)
        o('.submit', this.infoBox).addEventListener('click', ()=>{
            this.dialogExpand()
        })
    }
    walletTemp(data) {
        return `<li class="line"><div class="tt">余额:</div><span class="value">${data.balance} ¥</span></li>
                <li class="line"><div class="tt">提现审批:</div><span class="value">${data.lock_money} ¥</span></li>
                <li class="line"><div class="tt">累计收入:</div><span class="value">${data.income} ¥</span></li>
                <li class="settles"><div class="submit">提现</div></li>`
    }

    dialogExpand(){
        const title = '提现'
        const content = `<label class="tt">提现数额:<input type="text" id="amount"></label>
                                <label class="tt">数额确认:<input type="text" id="replyAmount"></label>`
        this.modal.renewTemplate(title, content)
        o('.modal .bottom .btn').addEventListener('click', async ()=>{
            const balance = os('.value', this.infoBox)[0].innerText
            const amount = o('#amount').value
            const replayAmount = o('#replyAmount').value
            if(amount !== replayAmount || !/^\d+(\.\d+)?$/g.test(amount)) {
                alert('数额不一致|数额未填|填写有误')
                return
            }
            if(Number(amount) < 100){
                alert('提现数额不得小于100')
                return
            }
            if(balance < amount){
                alert('违规提现')
                this.modal.close()
                return
            }
            const data ={
                amount: amount,
            }
            const result = await new CashOut().post({data})
            if(result) {
                alert('提现申请成功')
                await this.walletShow()
                this.modal.close()
            }
        })

    }

}

class OpCashView{
    constructor() {
        this.subPage = os('.subPage')[tab]
        this.foot = o('.db-bottom', this.subPage)
        this.modal = new Modal()
        this.opButton()

    }

    async cashesDbShow(page, ps){
        const dbBody = o('.db-body', this.subPage)
        const param = {
            page: page,
            ps: ps,
            pageSize: 10,
            wait: () =>{
                dbBody.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            },
        }
        const data = await new CashOut().get(param)
        if (data) {
            dbBody.innerHTML = this.cashesDbTemp(data)
            this.bottomShow()
        }
        else dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无结算账单</div>`
    }

    cashesDbTemp(data){
        let html = ''
        data.forEach( e =>{
            html += this.cashesDbLine(e)
        })
        return html
    }

    cashesDbLine(e){
        let html = ''
        html += `<ul class="db-tr" data-id="${e.id}">
                    <li class="check"><label><input type="checkbox"></label></li>
                    <li class="value">${e.user.uname}</li>
                    <li class="value">${e.amount}</li>
                    <li class="value">${e.user.alipay}</li>
                    <li class="value">${e.createTime.replace('T', ' ')}</li>
                    <li class="value">${e.status===0 ? `<div class="sBox">待审批</div>` : `<div class="sBox" style="background-color: grey;">已结算</div>`}</li>
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
            await this.cashesDbShow(--p, 'false')
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.cashesDbShow(++p, 'false')
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change', async () => {
            const goP = o('.go-page input', this.foot).value - 1
            if (goP >= 0 && goP <= Number(pEnd)) {
                this.foot.innerHTML = ''
                await this.cashesDbShow(goP, 'false')
                p = goP
            } else {
                alert('页面不存在')
            }

        })
    }
    async flash(){
        await this.cashesDbShow(p)
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

    isChecked() {
        const cb = o('.db .db-body .check input:checked')
        if (cb) return cb
        else alert('请先选择对应订单')
    }

    async opButton() {
        o('.flash', this.subPage).addEventListener('click', async () => {
            await this.flash()
        })
        o('.db .db-body', this.subPage).addEventListener('click', e => {
            // 单选
            if (e.target.localName === 'input' && e.target.type === "checkbox") this.singleCheck(e.target)
        })
        o('.settle', this.subPage).addEventListener('click', () =>{
            this.dialogSettle()
        })


    }
    dialogSettle(){
        const cb = this.isChecked()
        if(!cb) return
        const row = getParent(cb, 'ul')
        const title = '结算'
        const content = `<div class="tt">提现用户: ${row.children[1].innerText}</div>
                                <div class="tt">提现数额: ${row.children[2].innerText}</div>
                                <div class="tt">支付宝账户: ${row.children[3].innerText}</div>`
        this.modal.renewTemplate(title, content)
        o('.dialog .btn').addEventListener('click', async ()=>{
            const data = {
                id: row.dataset.id,
            }
            const result = await new CashOut().patch({data})
            if (result) {
                alert('结算完毕')
                this.modal.close()
            }else{
                alert('结算失败')
                this.modal.close()
            }
        })

    }

}



class OpBillView{
    constructor() {
        this.subPage = os('.subPage')[tab]
        this.foot = o('.db-bottom', this.subPage)
        this.opButton()
    }

    async billsDbShow(page, ps){
        const dbBody = o('.db-body', this.subPage)
        const param = {
            page: page,
            ps: ps,
            pageSize: 10,
            wait: () => {
                dbBody.innerHTML = `<div class="loading">
                                    <span></span><span></span><span></span>
                                    <span></span><span></span></div>`
            },
        }
        const data = await new Bills().get(param)
        if(data) {
            dbBody.innerHTML = this.billsDbTemp(data)
            this.bottomShow()
        }
        else dbBody.innerHTML = `<div style="height: 50px;line-height: 50px; color: red;">暂无账单</div>`
    }
    billsDbTemp(data){
        let html = ''
        data.forEach(e => {
            html += this.billsDbTempLine(e)
        })
        return html
    }

    billsDbTempLine(e){
        return `<ul class="db-tr" data-id="${e.id}">
                    <li class="value">${e.user ? e.user.uname : '用户丢失'}</li>
                    <li class="value">${e.other ? e.other : '订单:'+e.order.tid}</li>
                    <li class="value">${e.amount}</li>
                    <li class="value">${e.notes}</li>
                    <li class="value">${e.createTime.replace('T', ' ')}</li>
                </ul>`
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
            await this.billsDbShow(--p, 'false')
        })
    }

    next() {
        o('.next', this.foot).addEventListener('click', async () => {
            this.foot.innerHTML = ''
            await this.billsDbShow(++p, 'false')
        })
    }

    go() {
        o('.go-page input', this.foot).addEventListener('change', async () => {
            const goP = o('.go-page input', this.foot).value - 1
            if (goP >= 0 && goP <= Number(pEnd)) {
                this.foot.innerHTML = ''
                await this.billsDbShow(goP, 'false')
                p = goP
            } else {
                alert('页面不存在')
            }

        })
    }
    async flash(){
        await this.billsDbShow(p)
    }
    async opButton() {
        o('.flash', this.subPage).addEventListener('click', async () => {
            await this.flash()
        })
    }

}
