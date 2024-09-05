import https from "https";
import moment from "moment";
// const https = require('https');
// const moment = require('moment');
const resArray = []
const now = new Date();

function getInfo(time) {
    const data = JSON.stringify({
        "startTime": time.start, "endTime": time.end, "currPage": 1, "listType": 0, "pageSize": 10
    })

    const options = {
        hostname: "mapp.easy-hi.com",
        port: 443,
        path: "/m/api/yg/customer/SubscribeController/getMySubscriptions",
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
            const parsedData = JSON.parse(responseData)
            // console.log(parsedData, time.month)
            resArray.push({
                courseStat: now.getMonth() + 1 === time.month ? parsedData.data.courseStat - parsedData.data.subscribeNum : parsedData.data.courseStat,
                timeStat: now.getMonth() + 1 === time.month ? parsedData.data.timeStat - parsedData.data.subscribeNum * 60 : parsedData.data.timeStat,
                month: time.month
            })
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

export default function handler(vercelReq, vercelRes) {
    const origin = moment('2024-03-01 00:00:00')
    const dateParams = []
    while (1) {
        dateParams.push({
            month: origin.month() + 1,
            start: origin.format("YYYY-MM-DD HH:mm:ss"),
            end: origin.add(1, 'month').subtract(1, 'seconds').format("YYYY-MM-DD HH:mm:ss"),
        })

        origin.add(1, 'seconds')

        if (origin.isAfter()) {
            break;
        }
    }
    for (const params of dateParams) {
        getInfo(params)
    }
    setTimeout(() => {
        resArray.sort((a, b) => a.month - b.month)
        const courseStatTotal = resArray.reduce((a, b) => a + b.courseStat, 0)
        const timeStatTotal = resArray.reduce((a, b) => a + b.timeStat, 0)
        resArray.push({
            courseStat: courseStatTotal, timeStat: timeStatTotal, month: 13
        })

        // console.log(resArray)


        const calcHour = (timeStat) => {
            const hour = timeStat / 60

            return `${hour}小时`
        }
        const genLineStr = (res, total = false) => {
            if (total) {
                return `<tr><td>总</td><td>${res.courseStat}节</td><td>时长${res.timeStat}</td></tr>`
            }
            return `<tr><td>${res.month}月</td><td>${res.courseStat}节</td><td>时长${res.timeStat}</td></tr>`
        }
        let summary = resArray.map(res => {
            res.timeStat = calcHour(res.timeStat)
            if (res.month === '13') {
                return genLineStr(res, true)
            }
            return genLineStr(res)
        }).join('\n')
        summary = `
                <div style="padding: 40px;">
                <table>
                ${summary}
                </table>
                </div>
                <script>
                const meta = document.createElement('meta')
                meta.name="viewport"
                meta.content="width=device-width, initial-scale=1.0"
                document.head.appendChild(meta)
                </script>
        `
        vercelRes.status(200).send(summary);


        // const calcHour = (timeStat) => {
        //     const hour = timeStat / 60
        //
        //     return `${hour}小时`
        // }
        // const genLineStr = (res, total = false) => {
        //     if (total) {
        //         return `总的，${res.courseStat}节，时长${res.timeStat}`
        //     }
        //     return `${res.month}月，${res.courseStat}节，时长${res.timeStat}`
        // }
        // const summary = resArray.map(res => {
        //     res.month = res.month.toString().padStart(2, '0')
        //     res.courseStat = res.courseStat.toString().padStart(2, ' ')
        //     res.timeStat = calcHour(res.timeStat)
        //     if (res.month === '13') {
        //         return genLineStr(res, true)
        //     }
        //     return genLineStr(res)
        // }).join('\n')
        // console.log(summary)
    }, 2000)
}