window.addEventListener('load', () => {
    if (isLogin()) window.location.href = 'index.html'
    o('#login').addEventListener('click', () => {
        verify()
    })
})

const verify = () => {
    const uid = o('#uid').value
    const pwd = o('#pwd').value
    const config = {
        api: 'api/v1/login/',
        method: 'POST',
        data: {"username": uid, "password": pwd},
    }
    dg(config).then(result =>{
        if (result.code === 200){
            let value = result.data.token
            value += `-${result.data.id}`
            result.data.role > -1 ? value += `@${result.data.role}` : value
            let hourToExpire = 24 * 30;
            let date = new Date()
            date.setHours(date.getHours() + hourToExpire)
            document.cookie = `token=${value};expires=${date};path=/`
            alert('登入成功')
            window.location.href = 'index.html'
        }else alert(result.msg)
    }).catch(reason => {
        console.log(reason)
        }
    )
}

