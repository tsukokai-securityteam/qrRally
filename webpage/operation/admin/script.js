let operationid="";
let operationcode="";

let giftconf;
(async()=>{
    giftconf = await api("GetGift");
})().catch(ex=>{
    throw ex;
});

function login(){
    operationid = document.getElementById("username").value;
    operationcode = document.getElementById("password").value;
    api("GetTotalList", {operationid:operationid, operationcode:operationcode}, "API/Operation").then(res=>{
        console.log(res);
        active(["loginform"]);
    }).catch(ex=>{
        if(ex=="auth faild"){
            alert("認証失敗");
        }
    });
}

function userdata(){
    let userid = document.getElementById("userid").value;
    (async()=>{
        let userdata = await api("GetUserData", {operationid:operationid, operationcode:operationcode, userid:userid}, "API/Operation");
        let rally_data = JSON.parse(userdata['rally_data']);
        let exchanged_gifts = JSON.parse(userdata['exchanged_gifts']);
        let suggest_type = userdata['suggest_type'];
        let recorded_locations=[];
        let answerd_locations=[];
        let total_point = 0;
        let exchangeable_gifts = [];
        for(i in rally_data){
            recorded_locations.push(rally_data[i]['location']);
            if(rally_data[i]['point']>0){
                total_point += rally_data[i]['point'];
                answerd_locations.push(rally_data[i]['location']);
            }
        }
        exchangeable_gifts = giftconf.filter(value=> value['point']<= total_point && !exchanged_gifts.some(exval=> exval== value['giftname']));

        document.getElementById("point").innerText = `ポイント: ${total_point}`;
        document.getElementById("gift").innerHTML = Array.from(exchangeable_gifts).map(val=>val['giftname']).join("<br>");

    })().catch(ex=>{
        if(ex=="auth faild"){
            alert("認証失敗");
        }else if(ex=="not found"){
            alert("ユーザが見つかりませんでした");
        }else{
            throw ex;
        }
    });
}


//Total系
function total(element){
    (async()=>{
        let tmptext = element.innerText;
        element.style.pointerEvents = "none";
        element.innerText = "処理中…";

        let totaldata = await gettotaldata();
        download(JSON.stringify(totaldata, null, 4), "application/json", "total.json");

        element.style.pointerEvents = "auto";
        element.innerText = tmptext;
    })();
}
function gettotaldata(){
    return api("GetTotalData", {operationid:operationid, operationcode:operationcode}, "API/Operation").then(res=>{
        return res;
    }).catch(ex=>{
        if(ex=="auth faild"){
            alert("認証失敗");
        }else{
            throw ex;
        }
    });
}


//DB系
function historycsv(element){
    (async()=>{
        let tmptext = element.innerText;
        element.style.pointerEvents = "none";
        element.innerText = "処理中…";

        let dbdata = await getalldata();
        download(dbdata.map(user=>{
            return user['rally_data'].map(hst=>{
                return `${user['id']},${hst['time']},${hst['location']}`;
            }).filter(val=>val).join("\n");
        }).filter(val=>val).join("\n"), "text/csv", "history.csv");

        element.style.pointerEvents = "auto";
        element.innerText = tmptext;
    })();
}
function alldb(element){
    (async()=>{
        let tmptext = element.innerText;
        element.style.pointerEvents = "none";
        element.innerText = "処理中…";

        let dbdata = await getalldata();
        download(JSON.stringify(dbdata, null, 4), "application/json", "dbdata.json");

        element.style.pointerEvents = "auto";
        element.innerText = tmptext;
    })().catch(ex=>{
        alert("エラーが発生しました。\nリロードしてください。");
        throw ex;
    });
}
function getalldata(){
    return api("GetAllData", {operationid:operationid, operationcode:operationcode}, "API/Operation").then(res=>{
        return Array.from(res).map(val=>{
            val['rally_data'] = JSON.parse(val['rally_data']);
            val['exchanged_gifts'] = JSON.parse(val['exchanged_gifts']);
            return val;
        });
    }).catch(ex=>{
        throw ex;
    });
}


function download(data, type, name){
    let bom  = new Uint8Array([0xEF, 0xBB, 0xBF]);
    let blob = new Blob([bom, data], {type:type});
    let tmp = document.createElement("a");
    tmp.href = URL.createObjectURL(blob);
    tmp.target = "_blank";
    tmp.download = name;
    tmp.click();
}