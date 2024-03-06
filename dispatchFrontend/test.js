const a = {version: 1}
const config = a
config.api = 'orders/'
console.log(config)

if(undefined){
    console.log(1)
}else{
    console.log(2)
}
let ss = {
    "order": "6",
    "uid": "1"
}
console.log(Object.keys(ss).length)

const amount = '9k'

console.log(/^\d+$/g.test(amount))