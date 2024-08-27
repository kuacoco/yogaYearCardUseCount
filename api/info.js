import https from "https";
import moment from "moment";
// const https = require('https');
// const moment = require('moment');

function getInfo(vercelRes) {
    const data = JSON.stringify({
        cardId: "00973786020767428608", startTime: "", endTime: "", dateType: "全部日期", changeType: "全部",
    })

    const options = {
        hostname: "mapp.easy-hi.com",
        port: 443,
        path: "/m/api/base/customer/UserServCardController/init-servcard-logs",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
            tcode: "2007905268",
            cookie: "ynpc-customer-authc-2007905268=6q0gPdhzSuqqwq-Bw82gqSIU64MeJxLPCBOGJ2K4-Pr_o9AaxuhL9tlQNzTGghDl",
        },
    }

    const req = https.request(options, (res) => {
        let responseData = ""

        res.on("data", (chunk) => {
            responseData += chunk
        })

        res.on("end", () => {
            const sumFn = (accumulator, currentValue) => accumulator += currentValue.servitemChange
            const parsedData = JSON.parse(responseData)
            const logs = parsedData.data
            // console.log(logs[0])
            const reserve = logs.filter((i) => i.changeMode === "2").reduce(sumFn, 0)
            const cancel = logs.filter(i => i.changeMode === "1" && i.servitemChange < 9).reduce(sumFn, 0)
            const firstDay = logs[logs.length - 2].timeCreate
            // let i
            // for (i = 0; i < logs.length; i++) {
            //     if (logs[i].changeMode === '2') {
            //         break
            //     }
            // }
            // const newlyDay = logs[i].serviceTime
            const date1 = moment(firstDay)
            const date2 = moment()
            const daysDifference = date2.diff(date1, 'days')
            const summary = `
            <div style="padding: 40px;">
            <p>激活时间：${firstDay}</p>
            <p>年卡已用：${daysDifference + 2} 天</p>
            <p>预定次数：${reserve} 课次</p>
            <p>取消次数：${cancel} 课次</p>
            <p>实际使用：${reserve - cancel} 课次</p>
            </div>
            <script>
            const meta = document.createElement('meta')
            meta.name="viewport"
            meta.content="width=device-width, initial-scale=1.0"
            document.head.appendChild(meta)
            </script>
            `
            vercelRes.status(200).send(summary);

            //         const summary = `
            // 激活时间：${firstDay}
            // 年卡已用：${daysDifference + 2} 天
            // 预定次数：${reserve} 课次
            // 取消次数：${cancel} 课次
            // 实际使用：${reserve - cancel} 课次
            //         console.log(summary)
        })
    })

    req.on("error", (error) => {
        console.error("Error:", error)
    })

// 发送请求数据
    req.write(data)

// 结束请求并发送
    req.end()
}

export default function handler(req, res) {
    getInfo(res)
}
// getInfo()