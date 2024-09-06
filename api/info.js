import https from "https";
import moment from "moment";
import querystring from "querystring"
// const https = require('https');
// const moment = require('moment');
// const querystring = require('querystring');

function getInfo(card, vercelRes) {
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

            const reserve = logs.filter((i) => i.changeMode === "2").reduce(sumFn, 0)
            const cancel = logs.filter(i => i.changeMode === "1" && i.servitemChange < 9).reduce(sumFn, 0)

            const now = moment().format("YYYY-MM-DD")
            const activateDate = moment(card.activateDate.replaceAll('.', '-'))
            const expireDate = moment(card.expireDate.replaceAll('.', '-'))

            const activateDiff = Math.abs(activateDate.diff(now, 'days')) + 1
            const expireDiff = expireDate.diff(now, 'days')
            const diff = expireDate.diff(activateDate, 'days') + 1

            const summary = `
            <div style="padding: 40px;">
            <p>有效期：${card.expireTimeStr}，共${diff}天</p>
            <p>已生效：${activateDiff} 天，还剩余：${expireDiff} 天</p>
            <p>预定：${reserve} 课次，取消：${cancel} 课次</p>
            <p>实际使用：${reserve - cancel} 课次</p>
            <p>课次单价：${Math.round((5980 / (reserve - cancel)) * 100) / 100}元</p>
            </div>
            <script>
            const meta = document.createElement('meta')
            meta.name="viewport"
            meta.content="width=device-width, initial-scale=1.0"
            document.head.appendChild(meta)
            </script>
            `
            vercelRes.status(200).send(summary);

            // const summary = `
            // 有效期：${card.expireTimeStr}，共${diff}天
            // 已生效：${activateDiff} 天，还剩余：${expireDiff} 天
            // 预定：${reserve} 课次，取消：${cancel} 课次
            // 实际使用：${reserve - cancel} 课次
            // 课次单价：${Math.round((5980 / (reserve - cancel)) * 100) / 100}元
            // `
            // console.log(summary)
        })
    })

    req.on("error", (error) => {
        console.error("Error:", error)
    })
    req.write(data)
    req.end()
}

function getCard() {
    return new Promise((resolve, reject) => {
        const data = querystring.stringify({condition: 1})

        const options = {
            hostname: "mapp.easy-hi.com",
            port: 443,
            path: "/m/api/base/customer/UserServCardController/init-self-cards",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": data.length,
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
                resolve(parsedData.data)
            })
        })
        req.on("error", (error) => {
            console.error("Error:", error)
        })
        req.write(data)
        req.end()
    })
}

export default function handler(req, res) {
    getCard().then((res) => {
        const card = res.cards.find(c => c.servcardId === "00973786020767428608")
        getInfo(card)
    })
}