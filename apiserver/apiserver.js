const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const crypto = require('crypto');
const fs = require('fs');
const spdy = require('spdy');

const app = express();

//設定やQR定義は起動時に定数として扱うので変更時は再起動する。
const severconfpath = "./config/server.json";
const qrconfpath = "./config/qr.json";
const giftconfpath = "./config/gift.json";
const suggestconfpath = "./config/suggest.json";
const serverconf = JSON.parse(fs.readFileSync(severconfpath, {encoding: 'utf8'}));
const qrconf = JSON.parse(fs.readFileSync(qrconfpath, {encoding: 'utf8'}));
const giftconf = JSON.parse(fs.readFileSync(giftconfpath, {encoding: 'utf8'}));
const suggestconf = JSON.parse(fs.readFileSync(suggestconfpath, {encoding: 'utf8'}));

const connection = mysql.createConnection({
    host: serverconf['mysql']['host'],
    user: serverconf['mysql']['user'],
    password: serverconf['mysql']['password'],
    port: serverconf['mysql']['port'],
    database: serverconf['mysql']['database'],
});
const table = serverconf['mysql']['table'];

//consoe.logだとクラスタ化してもうまくやってくれてる(log4js代替)
function log_info(msg){loging(`\u001b[34m[${now()}] [INFO]\u001b[0m ${msg}`);}
function log_sql(msg){loging(`\u001b[36m[${now()}] [SQL]\u001b[0m ${msg}`);}
function log_client(msg){loging(`\u001b[33m[${now()}] [CLIENT]\u001b[0m ${msg}`);}
function log_server(msg){loging(`\u001b[31m[${now()}] [SERVER]\u001b[0m ${msg}`);console.trace();}
function log_fatal(msg){loging(`\u001b[35m[${now()}] [SERVER FATAL]\u001b[0m ${msg}`);console.trace();}
function loging(msg){console.log(msg);}

app.use(bodyParser.json());
app.disable('x-powered-by');

//Expressパース時エラー処理
app.use(function(err,req,res,next){
    let sfunc = req['originalUrl'].slice(req['originalUrl'].lastIndexOf('/')+1);
    try{
        if(err){
            if(err['type']=='entity.parse.failed'){
                //不正なJSONデータが送られてきた場合
                log_client(`Bad Request (${sfunc})`);
                res.status(400).json({"result":"bad request"});
            }else{
                //不明エラー時
                log_server(err);
                res.status(500).json({"result":"unknown error"});
            }
        }
    }catch(ex){
        //不明エラー時
        res.status(500).json({"result":"unknown error"});;
        log_server(ex);
    }
});


process.on('uncaughtException', ex=>{
    log_fatal(ex);
    process.exit(1);
});
process.on('unhandledRejection', ex=>{
    log_fatal(ex);
    process.exit(1);
}); //エラーの処理もれはfatalで記録



//集計
try{
    fs.statSync("./.confcheck");
}catch{
    fs.writeFileSync("./.confcheck", JSON.stringify(qrconf, null, 2));
}
try{
    fs.statSync("./total/");
}catch{
    fs.mkdirSync("./total/");
}

try{
    fs.statSync("./total/total.json");
}catch{
    fs.writeFileSync("./total/total.json", JSON.stringify(new_total(), null, 2));
}

//QR定義が変更されたときに集計データも変更(前のをリネームして新しいのを作る)
if(JSON.stringify(qrconf) != JSON.stringify(JSON.parse(fs.readFileSync("./.confcheck", {encoding: 'utf8'})))){
    console.log(qrconf);
    fs.writeFileSync("./.confcheck", JSON.stringify(qrconf, null, 2));
    fs.renameSync("./total/total.json", `./total/total_${now(true)}.json`);
    fs.writeFileSync("./total/total.json", JSON.stringify(new_total(), null, 2));
}

function new_total(){
    let tmpconf = JSON.parse(JSON.stringify(qrconf));   //参照渡し回避
    return tmpconf.filter(qr=>qr['contents_type']!="gift_exchange").map(qr=>{
        let tmp={};
        if(qr['contents_type']=="enquete"){
            qr['contents']['enquete'] = qr['contents']['enquete'].map(enq=>{
                tmp={};
                if(enq['type']!="write"){
                    enq['choice'].forEach(choice=>{
                        tmp[choice] = 0;
                    });
                    enq['total'] = tmp;
                }else{
                    enq['write_total'] = [];
                }
                delete(enq['choice']);
                return enq;
            });
        }else{
            qr['contents']['choice'].forEach(choice=>{
                tmp[choice] = 0;
            });
            qr['contents']['total'] = tmp;
            delete(qr['contents']['choice']);
        }
        return qr;
    });
}

spdy.createServer({
    key: fs.readFileSync(serverconf['certificate_file']['key']),
    cert: fs.readFileSync(serverconf['certificate_file']['cert']),
    ca: fs.readFileSync(serverconf['certificate_file']['ca']),
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.2',
    ciphers: 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384'
},app).listen(18080);

log_info("Server Start");

//auth_code生成用 I i l 1 O o 0 J j は見ずらいかもしんないので使わない
const S1 = "abcdefghkmnpqrstuvwxyz23456789";
const S2 = "123456789"

//#####ユーザ登録API#####
app.post('/API/Entry', (req, res)=>{
    let user_agent = 'Unknown';
    if(req.header('User-Agent')){
        user_agent = req.header('User-Agent');
    }
    if(user_agent.length>200){
        user_agent = 'Unknown(Too Long UA)';
    }
    let auth_code1 = Array.from(crypto.randomFillSync(new Uint8Array(6))).map((n) => S1[n % S1.length]).join('');
    let auth_code2 = Array.from(crypto.randomFillSync(new Uint8Array(6))).map((n) => S2[n % S2.length]).join('');

    sbegin().then(()=>{
        return squery("INSERT INTO ??(auth_code, user_agent, os, created_at, rally_data, exchanged_gifts, suggest_type) VALUES (?,?,?,?,?,?,?);",
        [table, `${auth_code1}-${auth_code2}`, `${user_agent}`, `${getos(user_agent)}`, now(), '[]', '[]', '未分類']);
    }).then(()=>{
        return squery("SELECT id, auth_code FROM ?? WHERE id=LAST_INSERT_ID();", [table]);
    }).then(results=>{
        res.status(200).json({
            'id': `${results['id']}`,
            'auth_code': `${results['auth_code']}`
        });
        return scommit();
    }).catch(ex=>{
        srollback().then(()=>{
            res.status(500).json({"error": "server error"});
            log_server(ex);
        });
    });
});

//#####QR読み取り記録API#####
app.post('/API/RecordQR', (req, res)=>{
    let id = req.body['id'];
    let auth_code = req.body['auth_code'];
    let location = objsearch(qrconf, "qr", req.body['qr'], "location");    //定義されていないもの投げられたとき対策

    if(objsearch(qrconf, "location", location, "contents_type")=="gift_exchange"){
        res.status(200).json({"url": `https://${req['hostname']}/gift_exchange`});
    }else{
        new Promise((resolve, reject)=>{
            if(!id || !auth_code || !location){
                res.status(400).json({"error":"invalid parameter"});
                reject(new Error("invalid parameter"));
            }else{
                resolve();
            }
        }).then(()=>{
            return getuserdata(id, auth_code);  //認証失敗したときは「Error(auth faild)」を返す
        }).then(userdata=>{
            let userstatus = getuserstatus(userdata);
            if(userstatus['recorded_locations'].some(value=> value==location)){ //ユーザの記録済みQRと照会
                if(userstatus['answerd_locations'].some(value=> value==location)){  //ユーザーの回答済みQRと照会
                    //記録済みかつ回答済み
                    res.status(400).json({"error": "alrady answerd"});
                }else{
                    //記録済みだが未回答
                    res.status(200).json({"url": `https://${req['hostname']}/${objsearch(qrconf, "location", location, "contents_type")}?location=${location}`});
                }
            }else{
                //未記録
                userdata['rally_data'].push({
                    "location": location,
                    "time": now(),
                    "point": 0,
                    "answer": []
                });
                let typehistory = userdata['rally_data'].map(value=> objsearch(qrconf, "location", value['location'], "group"));
                suggestconf.some(conf=>{
                    if(conf['patterns'].some(value=> JSON.stringify(value)==JSON.stringify(typehistory.slice(-value.length)))){
                        //サジェスト一致したら保存
                        squery("UPDATE ?? SET suggest_type=? WHERE id=? AND auth_code=?;",[table, conf['type'], id, auth_code]).then(()=>{
                            return true;  //最初に一致したものにする  @@@@@つまりはsuggestconfで上に記述するもののほうが優先順位が高い@@@@@
                        });
                    }
                });
                squery("UPDATE ?? SET rally_data=? WHERE id=? AND auth_code=?;",[table, JSON.stringify(userdata['rally_data']), id, auth_code]).then(()=>{
                    res.status(200).json({"url": `https://${req['hostname']}/${objsearch(qrconf, "location", location, "contents_type")}?location=${location}`});
                });
            }
        }).catch(ex=>{
            if(ex['message']=="auth faild"){
                res.status(400).json({"error": "auth faild"});
                log_client(`[Auth Faild] id: ${id}, auth_code: ${auth_code} (RecordQR)`);
            }else if(ex['message']=="invalid parameter"){
                log_client(`[Invalid Parameter] id: ${id}, auth_code: ${auth_code}, qr: ${req.body['qr']} (RecordQR)`);
            }else{
                res.status(500).json({"error": "server error"});
                log_server(ex);
            }
        });
    }
});

//#####QR対象固有ページコンテンツ表示API#####
app.post('/API/UniquePage', (req, res)=>{
    let id = req.body['id'];
    let auth_code = req.body['auth_code'];
    let location =　objsearch(qrconf, "location", req.body['location'], "location");    //定義されていないもの投げられたとき対策

    new Promise((resolve, reject)=>{
        if(!id || !auth_code || !location){
            res.status(400).json({"error":"invalid parameter"});
            reject(new Error("invalid parameter"));
        }else{
            resolve();
        }
    }).then(()=>{
        return getuserdata(id, auth_code);  //認証失敗したときは「Error(auth faild)」を返す
    }).then(userdata=>{
        let userstatus = getuserstatus(userdata);
            if(userstatus['recorded_locations'].some(value=> value==location)){ //ユーザの記録済みQRと照会
                if(userstatus['answerd_locations'].some(value=> value==location)){  //ユーザーの回答済みQRと照会
                    //記録済みかつ回答済み
                    res.status(400).json({"error": "alrady answerd"});
                }else{
                    //記録済みだが未回答
                    let limit = objsearch(qrconf, "location", location, "limit_time");
                    if(limit && new Date() > new Date(limit)){
                        //終了時間
                        res.status(400).json({"error": "time over"});
                    }else{
                        res.status(200).json({"contents": objsearch(qrconf, "location", location, "contents")});
                    }
                }
            }else{
                //未記録
                log_client(`[Access Denied] id: ${id}, location: ${location} (UniquePage)`)
                res.status(400).json({"error":"access denied"});
            }
    }).catch(ex=>{
        if(ex['message']=="auth faild"){
            res.status(400).json({"error": "auth faild"});
            log_client(`[Auth Faild] id: ${id}, auth_code: ${auth_code} (UniquePage)`);
        }else if(ex['message']=="invalid parameter"){
            log_client(`[Invalid Parameter] id: ${id}, auth_code: ${auth_code}, location: ${req.body['location']} (UniquePage)`);
        }else{
            res.status(500).json({"error": "server error"});
            log_server(ex);
        }
    });
});

//#####QR対象固有ページ回答記録API#####
app.post('/API/RecordAnswer', (req, res)=>{
    let id = req.body['id'];
    let auth_code = req.body['auth_code'];
    let location =　objsearch(qrconf, "location", req.body['location'], "location");    //定義されていないもの投げられたとき対策
    let answer = JSON.parse(JSON.stringify(req.body['answer']));  //念のためエスケープ

    new Promise((resolve, reject)=>{
        if(!id || !auth_code || !location || !answer){
            res.status(400).json({"error":"invalid parameter"});
            return reject(new Error("invalid parameter"));
        }else{
            return resolve();
        }
    }).then(()=>{
        return getuserdata(id, auth_code);  //認証失敗したときは「Error(auth faild)」を返す
    }).then(userdata=>{
        let userstatus = getuserstatus(userdata);
            if(userstatus['recorded_locations'].some(value=> value==location)){ //ユーザの記録済みQRと照会
                if(userstatus['answerd_locations'].some(value=> value==location)){  //ユーザーの回答済みQRと照会
                    //記録済みかつ回答済み
                    res.status(400).json({"error": "alrady answerd"});
                }else{
                    //記録済みだが未回答
                    let result = check_answer(location, answer);
                    if(result['point']==0){
                        if(result['limit']){
                            throw new Error("time over");
                        }else{
                            throw new Error("invalid answer");
                        }  
                    }else{
                        let index = userdata['rally_data'].findIndex(value=> value['location']==location);
                        if(result['result']){   //クイズの時は正誤を格納
                            userdata['rally_data'][index]['answer'] = result['result'];
                        }else{
                            userdata['rally_data'][index]['answer'] = answer;
                        }
                        userdata['rally_data'][index]['point'] = result['point'];
                        squery("UPDATE ?? SET rally_data=? WHERE id=? AND auth_code=?;",[table, JSON.stringify(userdata['rally_data']), id, auth_code]).then(()=>{
                            res.status(200).json(result);
                        });
                    }
                }
            }else{
                //未記録
                log_client(`[Access Denied] id: ${id}, location: ${location} (RecordAnswer)`)
                res.status(400).json({"error":"access denied"});
            }
    }).catch(ex=>{
        if(ex['message']=="auth faild"){
            res.status(400).json({"error": "auth faild"});
            log_client(`[Auth Faild] id: ${id}, auth_code: ${auth_code} (RecordAnswer)`);
        }else if(ex['message']=="invalid parameter"){
            log_client(`[Invalid Parameter] id: ${id}, auth_code: ${auth_code}, qr: ${req.body['qr']} (RecordAnswer)`);
        }else if(ex['message']=="invalid answer"){
            log_client(`[Invalid Answer] id: ${id}, location: ${location}, answer: ${answer} (RecordAnswer)`);
            res.status(400).json({"error":"bad request"});
        }else if(ex['message']=="time over"){
            //エラー扱いだけどログ取らない
            res.status(400).json({"error":"time over"});
        }else{
            res.status(500).json({"error": "server error"});
            log_server(ex);
        }
    });
});
function check_answer(location, answer){    //意図的に定義にない回答を投げられたりしたとき対策やクイズの回答チェックなど
    let total = JSON.parse(fs.readFileSync("./total/total.json", {encoding: 'utf8'}));  //集計記録もする
    try{
        //オブジェクトの形が曖昧なのでforEach使用していない
        let conf = objsearch(qrconf, "location", location);
        let tindex = total.findIndex(qr=>qr['location']==location);
        if(conf['contents_type']=="enquete"){
            for(i in conf['contents']['enquete']){
                if(conf['contents']['enquete'][i]['type']=="check"){
                    if(answer[i].length==0){
                        return {"point": 0};
                    }
                    for(j in answer[i]){
                        if(!conf['contents']['enquete'][i]['choice'].some(value=> value==answer[i][j])){
                            return {"point": 0};
                        }
                        total[tindex]['contents']['enquete'][i]['total'][answer[i][j]] += 1;
                    }
                }else if(conf['contents']['enquete'][i]['type']=="radio"){
                    if(!conf['contents']['enquete'][i]['choice'].some(value=> value==answer[i])){
                        return {"point": 0};
                    }
                    total[tindex]['contents']['enquete'][i]['total'][answer[i]] += 1;
                }else if(conf['contents']['enquete'][i]['type']=="write"){
                    //自由記述なので確認なし(エスケープ済み)
                    total[tindex]['contents']['enquete'][i]['write_total'].push(answer[i]);
                }
            }
            fs.writeFileSync("./total/total.json", JSON.stringify(total, null, 2));
            return {"point": objsearch(qrconf, "location", location, "point")};
        }else if(conf['contents_type']=="quiz"){
            total[tindex]['contents']['total'][answer] += 1;
            if(!objsearch(qrconf, "location", location, "contents")['choice'].some(val=>val==answer)){
                return {"point": 0};
            }
            fs.writeFileSync("./total/total.json", JSON.stringify(total, null, 2));
            if(answer == objsearch(qrconf, "location", location, "answer")){
                return({
                    "result": "correct",
                    "point": objsearch(qrconf, "location", location, "point_correct")
                });
            }else{
                return({
                    "result": "wrong",
                    "point": objsearch(qrconf, "location", location, "point_wrong")
                });
            }
        }else if(conf['contents_type']=="vote"){
            if(!conf['contents']['choice'].some(value=> value==answer)){
                return {"point": 0};
            }else if(new Date() > new Date(conf['limit_time'])){
                return {"point": 0,"limit": "limit"};
            }else{
                total[tindex]['contents']['total'][answer] += 1;
                fs.writeFileSync("./total/total.json", JSON.stringify(total, null, 2));
                return {"point": objsearch(qrconf, "location", location, "point")};
            }
        }else{
            //ないはず
        }
    }catch{
        return {"point": 0};
    }
}

//#####景品交換API#####
app.post('/API/RecordGift', (req, res)=>{
    let id = req.body['id'];
    let auth_code = req.body['auth_code'];
    let giftname = objsearch(giftconf, "giftname", req.body['giftname'], "giftname");   //定義されていないもの投げられたとき対策

    new Promise((resolve, reject)=>{
        if(!id || !auth_code || !giftname){
            res.status(400).json({"error":"invalid parameter"});
            reject(new Error("invalid parameter"));
        }else{
            resolve();
        }
    }).then(()=>{
        return getuserdata(id, auth_code);  //認証失敗したときは「Error(auth faild)」を返す
    }).then(userdata=>{
        let userstatus = getuserstatus(userdata);
        if(!userstatus['exchangeable_gifts'].some(val=> val['giftname']==giftname)){
            if(userstatus['exchanged_gifts'].some(val=> val['giftname']==giftname)){
                //交換済み
                res.status(400).json({"error": "alrady exchanged"});
            }else{
                //交換不可能(ポイント不足)
                res.status(400).json({"error": "insufficient point"});
            }
        }else{
            //交換可能
            userdata['exchanged_gifts'].push(giftname);
            squery("UPDATE ?? SET exchanged_gifts=? WHERE id=? AND auth_code=?;",[table, JSON.stringify(userdata['exchanged_gifts']), id, auth_code]).then(()=>{
                res.status(200).json({"results": "ok"});
            });
        }
    }).catch(ex=>{
        if(ex['message']=="auth faild"){
            res.status(400).json({"error": "auth faild"});
            log_client(`[Auth Faild] id: ${id}, auth_code: ${auth_code} (RecordGift)`);
        }else if(ex['message']=="invalid parameter"){
            log_client(`[Invalid Parameter] id: ${id}, auth_code: ${auth_code}, giftname: ${req.body['giftname']} (RecordGift)`);
        }else{
            res.status(500).json({"error": "server error"});
            log_server(ex);
        }
    });
});

//#####行動履歴によるサジェストAPI#####
app.post('/API/Suggest', (req, res)=>{
    let id = req.body['id'];
    let auth_code = req.body['auth_code'];
    new Promise((resolve, reject)=>{
        if(!id || !auth_code){
            res.status(400).json({"error":"invalid parameter"});
            reject(new Error("invalid parameter"));
        }else{
            resolve();
        }
    }).then(()=>{
        return getuserdata(id, auth_code);
    }).then(userdata=>{
        res.status(200).json({"message": objsearch(suggestconf, "type", userdata['suggest_type'], "message")});
    }).catch(ex=>{
        if(ex['message']=="auth faild"){
            res.status(400).json({"error": "auth faild"});
            log_client(`[Auth Faild] id: ${id}, auth_code: ${auth_code} (Suggest)`);
        }else if(ex['message']=="invalid parameter"){
            log_client(`[Invalid Parameter] id: ${id}, auth_code: ${auth_code} (Suggest)`);
        }else{
            res.status(500).json({"error": "server error"});
            log_server(ex);
        }
    });
});

//#####ユーザ状態照会API#####
app.post('/API/GetData', (req, res)=>{
    let id = req.body['id'];
    let auth_code = req.body['auth_code'];
    new Promise((resolve, reject)=>{
        if(!id || !auth_code){
            res.status(400).json({"error":"invalid parameter"});
            reject(new Error("invalid parameter"));
        }else{
            resolve();
        }
    }).then(()=>{
        return getuserdata(id, auth_code);
    }).then(userdata=>{
        res.status(200).json(getuserstatus(userdata));
    }).catch(ex=>{
        if(ex['message']=="auth faild"){
            res.status(400).json({"error": "auth faild"});
            log_client(`[Auth Faild] id: ${id}, auth_code: ${auth_code} (GetData)`);
        }else if(ex['message']=="invalid parameter"){
            log_client(`[Invalid Parameter] id: ${id}, auth_code: ${auth_code} (GetData)`);
        }else{
            res.status(500).json({"error": "server error"});
            log_server(ex);
        }
    });
});

//#####QRロケーション一覧表示API#####
app.post('/API/GetLocation', (req, res)=>{
    if(req.body['gift']=="false"){
        res.status(200).json(qrconf.filter(values=>values['contents_type'] != "gift_exchange").map(values=>values['location']));
    }else{
        res.status(200).json(qrconf.map(values=>values['location']));
    }
});

//#####景品一覧表示API#####
app.post('/API/GetGift', (req, res)=>{
    res.status(200).json(giftconf.map(values=>{return {"giftname": values['giftname'], "point": values['point']};}));
});

app.post('/API/Operation/GetTotalList', (req, res)=>{
    let id = req.body['operationid'];
    let auth_code = req.body['operationcode'];
    if(id == serverconf['operation_account']['id'] && verify(auth_code, serverconf['operation_account']['hash'], serverconf['operation_account']['solt']) == true){
        res.status(200).json(JSON.parse(JSON.stringify(fs.readdirSync("./total/").filter(val=>{
            if(val.indexOf(".json")>0){
                return true;
            }
        }))));
    }else{
        res.status(400).json({"error":"auth faild"});
    }
});
app.post('/API/Operation/GetTotalData', (req, res)=>{
    let id = req.body['operationid'];
    let auth_code = req.body['operationcode'];
    let file = req.body['file'];
    if(!file){
        file="total.json";
    }
    fs.stat(`./total/${file}`, err=>{
        if(err){
            res.status(400).json({"error":"file not found"});
        }else{
            if(id == serverconf['operation_account']['id'] && verify(auth_code, serverconf['operation_account']['hash'], serverconf['operation_account']['solt']) == true){
                res.status(200).json(JSON.parse(fs.readFileSync(`./total/${file}`, {encoding: 'utf-8'})));
            }else{
                res.status(400).json({"error":"auth faild"});
            }
        }
    });

});

app.post('/API/Operation/GetUserData', (req, res)=>{
    let id = req.body['operationid'];
    let auth_code = req.body['operationcode'];
    let userid = req.body['userid'];
    if(id == serverconf['operation_account']['id'] && verify(auth_code, serverconf['operation_account']['hash'], serverconf['operation_account']['solt']) == true){
        squery("SELECT * FROM ?? WHERE id=?", [table, userid]).then(result=>{
            res.status(200).json(result);
        }).catch(ex=>{
            if(ex['message']=='not found'){
                res.status(400).json({"error":"not found"});
            }else{
                res.status(400).json({"error":"server error"});
            }
        });
    }else{
        res.status(400).json({"error":"auth faild"});
    }
});
app.post('/API/Operation/GetAllData', (req, res)=>{
    let id = req.body['operationid'];
    let auth_code = req.body['operationcode'];
    if(id == serverconf['operation_account']['id'] && verify(auth_code, serverconf['operation_account']['hash'], serverconf['operation_account']['solt']) == true){
        squery("SELECT * FROM ??", [table]).then(result=>{
            if(!Array.isArray(result)){
                result = [result];
            }
            res.status(200).json(result);
        }).catch(ex=>{
            res.status(400).json({"error":"server error"});
        });
    }else{
        res.status(400).json({"error":"auth faild"});
    }
});

/*
app.post('/API/Operation/GetConfig', (req, res)=>{
    let id = req.body['operationid'];
    let auth_code = req.body['operationcode'];
    let conf_type = req.body['conf_type'];
    if(id == serverconf['operation_account']['id'] && verify(auth_code, serverconf['operation_account']['hash'], serverconf['operation_account']['solt']) == true){
        let resdata;
        if(conf_type == "qr"){
            resdata = qrconf;
        }else if(conf_type="gift"){
            resdata = giftconf;
        }else if(conf_type="suggest"){
            resdata = suggestconf;
        }
        res.status(200).json(resdata);
    }else{
        res.status(400).json({"error":"auth faild"});
    }
});
app.post('/API/Operation/SetConfig', (req, res)=>{
    let id = req.body['operationid'];
    let auth_code = req.body['operationcode'];
    let conf_type = req.body['conf_type'];
    let conf_json = req.body['conf_json'];
    if(id == serverconf['operation_account']['id'] && verify(auth_code, serverconf['operation_account']['hash'], serverconf['operation_account']['solt']) == true){
        let confpath;
        if(conf_type == "qr"){
            confpath = qrconfpath;
        }else if(conf_type="gift"){
            confpath = giftconfpath;
        }else if(conf_type="suggest"){
            confpath = suggestconfpath;
        }
        fs.writeFileSync(confpath, JSON.stringify(conf_json, null, 2));
        res.status(200).json({"results": "ok"});
    }else{
        res.status(400).json({"error":"auth faild"});
    }
});
*/

/**@description ユーザの情報をDBから取得 */
function getuserdata(id, auth_code){
    return new Promise((resolve, reject)=>{
        squery("SELECT rally_data, exchanged_gifts, suggest_type FROM ?? WHERE id=? AND auth_code=?", [table, id, auth_code]).then(results=>{
            resolve({
                "rally_data": JSON.parse(results['rally_data']),
                "exchanged_gifts": JSON.parse(results['exchanged_gifts']),
                "suggest_type": results['suggest_type']
            });
        }).catch(ex=>{
            if(ex['message']=='not found'){
                reject(new Error("auth faild"));
            }else{
                reject(ex);
            }
        });
    });
}

/**@description ユーザーの情報をまとめる */
function getuserstatus(userdata){
    let rally_data = userdata['rally_data'];
    let exchanged_gifts = userdata['exchanged_gifts'];
    let suggest_type = userdata['suggest_type'];

    let recorded_locations=[];
    let answerd_locations=[];
    let total_point = 0;
    let exchangeable_gifts = [];
    let achievement_rate = 0;

    for(i in rally_data){
        recorded_locations.push(rally_data[i]['location']);
        if(rally_data[i]['point']>0){
            total_point += rally_data[i]['point'];
            answerd_locations.push(rally_data[i]['location']);
        }
    }
    exchangeable_gifts = giftconf.filter(value=> value['point']<= total_point && !exchanged_gifts.some(exval=> exval== value['giftname']));

    achievement_rate = Math.floor(answerd_locations.length / qrconf.filter(value=> value['contents_type']!= "gift_exchange").length * 100);

    return({
        "recorded_locations": recorded_locations,   //記録済みQRのLocationの配列
        "answerd_locations": answerd_locations,     //回答済みQRのLocationの配列
        "total_point": total_point,                 //合計ポイント
        "exchangeable_gifts": exchangeable_gifts,   //ポイントが足りるかつ未交換の交換可能ギフト
        "exchanged_gifts": exchanged_gifts,         //交換済みのギフト
        "suggest_type": suggest_type,               //おすすめタイプ
        "achievement_rate": achievement_rate        //達成度合(回答済みで判断)
    });

}


/**@description (JSONの要素が含まれる)配列の中から条件に合うJSON要素を取り出す。(ひとつのみ)
 * @param {any} object 対象の配列
 * @param {string} key 検索に利用するキー
 * @param {string} value キーに対応する値
 * @param {string} target これを指定すると該当するJSON要素の中の該当するキーに対応する値を返す
*/
function objsearch(object, key, value, target=""){
    try{
        if(!object || !key || !value){
            return undefined;
        }else if(!target){
            return object.find(conf=> conf[key]==value);
        }else{
            return object.find(conf=> conf[key]==value)[target];
        }
    }catch{
        //targetが存在しえないobjectを扱うなどするとエラーになるため
        return undefined;
    }
}

//SQL操作Promise化 @@@@@グローバルにconnectionとかtabeleとかloggerあること前提@@@@@
/**@description  データはモノによって型整えてから返す*/
function squery(query, values=[]){
    return new Promise((resolve, reject)=>{
        let sq = connection.query(query, values, (err, results)=>{
            if(err){
                reject(err);
            }else{
                log_sql(sq['sql']);
                if(results.length==0){
                    reject(new Error("not found"));
                }else if(results.length==1){
                    if(Object.values(results[0]).length==1){
                        resolve(Object.values(results[0])[0]);
                    }else{
                        resolve(results[0]);
                    }
                }else{
                    resolve(results);
                }
            }
        });
    });
}
//トランザクション使う場合
function sbegin(){
    return new Promise((resolve, reject)=>{
        connection.beginTransaction(err=>{
            if(err){
                reject(new Error("begin error"));
            }else{
                resolve();
            }
        });
    });
}
function scommit(){
    return new Promise((resolve, reject)=>{
        connection.commit(err=>{
            if(err){
                reject(new Error("commit error"));
            }else{
                resolve();
            }
        });
    });
}
function srollback(){
    return new Promise((resolve, reject)=>{
        connection.rollback(()=>{
            resolve();
        });
    });
}

/**@description 現在時刻を「yyyy/mm/dd hh:mm:ss」で返す*/
function now(mode=false){
    let now = new Date();
    let year = now.getFullYear();
    let month = ('0' + (now.getMonth() + 1)).slice(-2);
    let date = ('0' + now.getDate()).slice(-2);
    let hour = ('0' + now.getHours()).slice(-2);
    let minute = ('0' + now.getMinutes()).slice(-2);
    let seconds = ('0' + now.getSeconds()).slice(-2);
    if(mode==true){
        return `${year}${month}${date}${hour}${minute}${seconds}`;
    }else{
        return `${year}/${month}/${date} ${hour}:${minute}:${seconds}`;
    }
}

/**@description ユーザーエージェントからOSを判別する */
function getos(user_agent){
    let os="";
    if(user_agent.indexOf("Android")!=-1){
        os="Android"
    }else if(user_agent.indexOf("iPhone")!=-1){
        os="iPhone"
    }else if(user_agent.indexOf("iPad")!=-1){
        os="iPad"
    }else if(user_agent.indexOf("Windows")!=-1){
        os="Windows"
    }else if(user_agent.indexOf("Macintosh")!=-1){
        os="Macintosh"
    }else if(user_agent.indexOf("Linux")!=-1){
        os="Linux"
    }else{
        os="Unknown"
    }
    return os;
}

/**@description パスワードハッシュ化 */
function hash(password){
    const solt = crypto.randomBytes(64);
    const hash = crypto.scryptSync(password, solt, 64);
    return {"hash":hash.toString("base64"),"solt":solt.toString("base64")}
}
/**@description パスワードハッシュ認証 */
function verify(password, hash, solt){
    return crypto.scryptSync(password, Buffer.from(solt, "base64"), 64).toString("base64") == hash;
}