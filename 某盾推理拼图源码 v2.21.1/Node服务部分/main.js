let fs = require("fs");
let {VM, VMScript} = require('vm2');
let axios = require("axios")

let code = ""
code += fs.readFileSync(`${__dirname}/temp_env.js`) + '\r\n' // 需要自己用插件补一下 自己补也行
code += fs.readFileSync(`${__dirname}/trace.js`) + '\r\n' // 我手工录制的28条有的不行 需要自己验证下 (可以多录制点、参数可以加点随机+-N值)
code += fs.readFileSync(`${__dirname}/watchman.js`) + '\r\n' // 我手动换了下p、l actoken主要验证下长度对不对就好了
// 1. 10375行去浏览器环境debugger拿到真实的List才能拿到真实的fp
// 2. 路径录制代码在文章里面 主要找onmousemove以及onDragEnd接受
code += fs.readFileSync(`${__dirname}/core.js`) + '\r\n'

// 我自己路径验证
// 成功的 x12 [0, 5] [0, 7] [1, 2] [1, 7] [2, 3] [2, 5] [2, 6] [3, 4] [3, 5] [4, 5] [4, 7] [5, 7]
// 失败的 x1 [1, 6]

// 自己填一下
// https://dun.163.com/trial/inference
let GlobalId = "07e2387ab53a4d6f930b8d9a9be71bdf"; // 这里就是 id参数 每个网站的id不一样
let GlobalHeaderReferer = "https://dun.163.com/"; // 找到header中的referer
let GlobalTokenReferer = "https://dun.163.com/trial/inference" // 找到get参数中的referer
let GlobalValidateReferer = "https://dun.163.com/trial/inference" // 找到check参数中的referer

const myGlobal = {}; //定义一个沙箱的全局变量，用来输出沙箱的运行结果
const vm = new VM({
    sandbox: {
        myGlobal: myGlobal
    },
})
const script = new VMScript(code + "debugger;", `${__dirname}/debugger.js`);
debugger; // 准备进入沙盒
vm.run(script);

// 这里主要是封装对data相关值的处理
myGlobal.getM = function getM(traceData) {
    return myGlobal['func_3'](myGlobal['func_1'](traceData, 50)['join'](':'))
}
myGlobal.getP = function getP(token, position) {
    return myGlobal['func_3'](myGlobal['func_2'](token, position['join'](',')))
}
myGlobal.getExt = function getExt(token, traceData) {
    return myGlobal['func_3'](myGlobal['func_2'](token, 1 + ',' + traceData['length']))
}
myGlobal.getTraceData = function getTracerData(token, m1, m2, m3) {
    return myGlobal['func_2'](token, [m1, m2, m3] + '')
}
console.log("脱出来的加密函数 ===> ", myGlobal)
console.log("============")

// callback 生成法则
getCallback = function () {
    return "__JSONP" + ('_' + Math.random().toString(0x24).slice(0x2, 0x9)) + ('_' + 1)
}
let callback = getCallback()
console.log("callback ===>", callback)
console.log("============")

// cb 生成法则
getCb = function () {
    return myGlobal.cbFunc()
}
let cb = getCb()
console.log("cb ===>", cb)
console.log("============")

// acToken 生成法则 
// 这个主要看看是不是与原网站长度一样就差不多了 不行就去watchaman里面改改
getAcToken = function () {
    let t = myGlobal['watchman_func_1']();
    let a = {
        "C": t,
        "la": false
    }
    return myGlobal['watchman_func_2'](a)
}
let acToken = getAcToken()
console.log("getAcToken ===>", acToken)
console.log("============")

// 这个是前后端交互最后传给后端的
// validate是check拿下来的
// fp就是get参数里面的那个
finalBackend = function (validate, fp) {
    return myGlobal['finalFunc'](validate, fp,  "CN31")
}

// 用来处理traceData
function getTraceDataList(token, position) {
    let resList = []
    let tempList = myGlobal["traceList"][position.join("")]
    for (let i in tempList) {
        resList.push(myGlobal.getTraceData(token, tempList[i]['a'], tempList[i]['b'], tempList[i]['c']))
    }
    return resList
}

console.log("fp ===> ", myGlobal["gdxidpyhxde"])

// 获取图片信息
let getData = {
    referer: GlobalTokenReferer,
    zoneId: "CN31",
    acToken: getAcToken(),
    id: GlobalId,
    // fp: myGlobal["gdxidpyhxde"],
    fp: `njhMcfeDe2QAqLRNxWDOQcbizVP+07iPcWQjB3\\Z90ap678uv8jwUjYDvk3v1WQHnplPUu4q9gpZ0AZd/lBjRpR6qpzIp2zmk3+o5vAlafrq2/7YweyrlWliOV6MHHHK5ro0mu6XXJAVNnbeVGYe89QKzoN4HIAzIbWca6PAdEg8z1/d:1673075848090`,
    https: true,
    type: 9,
    version: "2.21.1",
    dpr: 2,
    dev: 1,
    cb: getCb(),
    ipv6: false,
    runEnv: 10,
    group: "",
    scene: "",
    lang: "zh-CN",
    sdkVersion: 'undefined',
    width: 320,
    audio: false,
    sizeType: 10,
    token: "",
    callback: getCallback()
}

let getStr = "";
let getObj = {};
for (let each in getData) {
    getStr += "&" + each + "=" + encodeURIComponent(getData[each])
}

function getToken() {
    return new Promise(function (resolve, reject) {
        axios({
            method: 'get',
            url: 'https://c.dun.163.com/api/v3/get?' + getStr.substring(1),
            headers: {
                'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                'Referer': GlobalHeaderReferer,
            },
        }).then(function (ret) {
            resolve(ret);
        }).catch(function (err) {
            reject(err);
        })
    })
}

async function getPicAndToken() {
    // 1. 获取图片信息拿到图片对应的token
    let r = await getToken()
    console.log(r)
    // 2. 处理拿到结果
    const regex = /\{\"data\":(.+?)\}/g;
    let m;
    while ((m = regex.exec(r.data)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        m.forEach((match, groupIndex) => {
            if (groupIndex === 1) {
                getObj = JSON.parse(match + "}");
            }
        });
    }
    console.log("get 结果====", getObj)
    console.log("============")
    return getObj
}

let getValidateData = {
    referer: GlobalValidateReferer,
    zoneId: "CN31",
    id: GlobalId,
    token: "", // 要传进来的
    acToken: 'undefined',
    data: "", // 要传进来的
    width: 320,
    type: 9,
    version: "2.21.1",
    cb: getCb(),
    extraData: "",
    bf: 0,
    runEnv: 10,
    sdkVersion: 'undefined',
    callback: getCallback(),
}

function getValidate(token, position) {
    let getValidateStr = "";
    getValidateData.token = token
    let traceTempData = getTraceDataList(token, position);
    let tempObj = {
        d: '',
        m: myGlobal.getM(traceTempData),
        p: myGlobal.getP(token, position),
        ext: myGlobal.getExt(token, traceTempData)
    }
    getValidateData.data = JSON.stringify(tempObj)
    for (let each in getValidateData) {
        getValidateStr += "&" + each + "=" + encodeURIComponent(getValidateData[each])
    }
    return new Promise(function (resolve, reject) {
        axios({
            method: 'get',
            url: 'https://c.dun.163.com/api/v3/check?' + getValidateStr.substring(1),
            headers: {
                'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                'Referer': GlobalHeaderReferer,
            },
        }).then(function (ret) {
            resolve(ret);
        }).catch(function (err) {
            reject(err);
        })
    })
}

// 检查validate是否为空
async function getFinalValidate(token, position) {
    // 1. 获取图片信息拿到图片对应的token
    let r = await getValidate(token, position);
    console.log(r.data)
    // 2. 处理data
}

// 使用流程
// 1. picAndTokenObj拿到token以及图片
// 2. 调用python进行识别(建议启服务)
// 3. getFinalValidate拿到validate
// 4. finalBackendn拿到后端的参数

// 要补的地方
// 1. watchman中的q参数 对应的环境是写死的 搜todo
// 2. core中的fp数组 每个浏览器是写死的 搜debug

// 失败的原因
// 1. getFinalValidate失败就是卢路径录制的问题
// 2. getPicAndToken拿到假Token多半是fp的问题
// 拿到实战环境中改参数验证

// 我自己路径验证
// 成功的 x12 [0, 5] [0, 7] [1, 2] [1, 7] [2, 3] [2, 5] [2, 6] [3, 4] [3, 5] [4, 5] [4, 7] [5, 7]
// 失败的 x1 [1, 6]

// picAndTokenObj = getPicAndToken();
getFinalValidate("307eeb0a8f574b309c415535d1558380", [4, 7]);
