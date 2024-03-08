window.addEventListener('load', async ()=>{
    await init()
    new SearchBox()
})

const init = async () => {
    const user = await new User().get()
    o('.uname').innerHTML = `${user.uname}`
    o('.username').innerHTML = `${user.username}`
    o('.logout').addEventListener('click', ()=>{
        logout()
    })
}

const logout = () =>{
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    alert('退出成功')
    this.location.href = 'login.html'
}

class SearchBox{
    constructor() {
        this.modal = new Modal()
        this.searchBtn()
    }

    searchBtn(){
        o('.searchBtn').addEventListener('click', async ()=>{
            await this.dialogSearch()
        })
    }
    async shopClass(){
        let html = ``
        const params = {
            part: 'true',
            token: getToken('token')[0],
        }
        const result = await new Shops().get({params})
        if (result){
            result.forEach(e=>{
                html += `<option value="${e.name}">${e.name}</option>`
            })
            return html
        }
    }

    async dialogSearch(){
        const searchResult = o('.searchResult')
        const title = '订单查询'
        const content = `<label class="tt">订单号:<input type="text" id="tid"></label>
                                <label class="tt">店铺:<select id="shop">${await this.shopClass()}</select></label>`
        this.modal.renewTemplate(title, content)
        // 点击查询
        o('.modal .dialog .bottom .btn').addEventListener('click', async ()=>{
            const id = o('#tid').value
            if (!id) alert('请输入订单号')
            const params = {
                tid: o('#tid').value,
                sellerNick: o('#shop').value,
                wait: ()=>{},
            }
            const result = await new Order().get(params)
            // console.log(result)
            if (result) {
                searchResult.style.opacity = '100%'
                this.searchResultShow(result)
                if(!result.user && Number(result.status) < 3) {
                    const getOrder = o('.getOrder')
                    getOrder.style.display = 'flex'
                    getOrder.addEventListener('click', async()=>{
                        const data ={
                            order: result.id,
                            uid: getUid('token'),
                        }
                        const value = await new Order().patch({data})
                        if (value) alert('成功获得此单')
                        else alert('error')
                    })

                }
                this.modal.close()
            } else{
                alert('并无此订单')
            }
        })

    }

    searchResultShow(result){
        o('.searchResult .card .card__left').innerHTML = this.searchResultTemp(result)
    }

    searchResultTemp(data){
        return `<div class="item">${data.tid}</div>
                <div class="item">${data.user ? data.user.uname : '暂无'}</div>
                <div class="item">${data.payment}</div>
                <div class="item">${data.refundfee}</div>
                <div class="item">${data.item}</div>
                <div class="item">${data.createTime.replace('T', ' ')}</div>
                <div class="item">${data.updateTime? data.updateTime.replace('T', ' ') : null}</div>
                <div class="item">${data.buyer}</div>
                <div class="item">${data.buyerid}</div>
                <div class="item">${['待接单', '进行中', '待验收', '已完成', '冻结中'][data.status]}</div>
                <div class="item">${['待发货', '已发货', '已退款', '退款中', '交易成功', '其他'][data.tbstatus]}</div>`
    }
}