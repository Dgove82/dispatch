// 登入验证
if (!isLogin()) {
    window.location.href = 'login.html'
}

// 通用页面加载
window.addEventListener('load', () => {
    // 导航栏
    navBar()
    // 子页面显示
    display()

})
// 导航栏
const navBar = () => {
    const navBox = `<div class=navBox></div>`
    o('body').insertAdjacentHTML('afterbegin', navBox)
    const navigation = document.querySelector('.navBox')
    let html = ''
    html = `<ul class="navBar">
              <li class="option">
                <div class="name"><a href="index.html">首页</a></div>
              </li>
              <li class="option">
                <div class="name">订单管理</div>
                <ul class="subTabs">
                  <li class="subOption" data-tab="orders.html#0">接单大厅</li>`
    html += isAdmin() ? `<li class="subOption" data-tab="orders.html#1">我的订单</li>` : `<li class="subOption" data-tab="orders.html#1">我的订单</li>`
    html += isAdmin() ? `<li class="subOption" data-tab="orders.html#2">订单管理</li>` : ``
    html += `</ul>
              </li>
              <li class="option">
                <div class="name">财务</div>
                <ul class="subTabs">
                  <li class="subOption" data-tab="finance.html#0">我的账单</li>
                  <li class="subOption" data-tab="finance.html#1">钱包</li>`
    html += isAdmin() ? `<li class="subOption" data-tab="finance.html#2">账单结算</li>` : ``
    html += isAdmin() ? `<li class="subOption" data-tab="finance.html#3">账单流水</li>` : ``
    html += `</ul>
              </li>
              <li class="option">
                <div class="name">系统设置</div>
                <ul class="subTabs">`
    html += isAdmin() ? `` :`<li class="subOption" data-tab="system.html#0">个人信息</li>`
    html += isAdmin() ? `` :`<li class="subOption" data-tab="system.html#1">修改密码</li>`
    html += isAdmin() ? `<li class="subOption" data-tab="system.html#2">用户管理</li>` :``
    html += isAdmin() ? `<li class="subOption" data-tab="system.html#3">店铺管理</li>` :``
    html += isAdmin() ? `<li class="subOption" data-tab="system.html#4">系统日志</li>` :``
    html +=`</ul>
              </li>
            </ul>`
    navigation.innerHTML = html

    const tab = o('.navBar')
    tab.addEventListener('mouseover', (e) => {
        if (e.target.nextElementSibling && e.target.localName === "div") {
            o('.active-option') ? o('.active-option').classList.remove('active-option') : null
            const options = e.target.nextElementSibling
            options.classList.toggle('active-option')
        }
    })
    const options = os('.option')
    options.forEach((e) => {
        e.onmouseleave = function () {
            o('.active-option') ? o('.active-option').classList.remove('active-option') : null
        }
    })
    tab.addEventListener('click', (e) => {
        if (e.target.localName === 'li') {
            window.location.href = e.target.dataset.tab
        }
    })
}

// 子页面内容显示
function display() {
    const url = window.location.hash
    const pages = os('.subPage')
    if (pages.length > 0) url.slice(-1) > pages.length || !url ? window.location.hash = '#0' :
        pages[url.slice(-1)].style.display = 'block'

    window.addEventListener('hashchange', () => {
        window.location.reload()
    })
}

const tab = window.location.hash.slice(-1)