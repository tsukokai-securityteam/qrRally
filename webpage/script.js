var id = localStorage.getItem("id");
var auth_code = localStorage.getItem("auth_code");
var limit = localStorage.getItem("limit");
var visited = JSON.parse(localStorage.getItem("visited"));
var vote_limit = localStorage.getItem("vote_limit");

(async()=>{
    //visitedは配列が空かどうかでなくあるかどうかなので
    if(!id || !auth_code || !limit || new Date()>new Date(limit) || !visited || !vote_limit){
        localStorage.clear();
        let newuser = await api("Entry");
        id = newuser['id'];
        auth_code = newuser['auth_code'];
        visited = [];
        localStorage.setItem("id", id);
        localStorage.setItem("auth_code", auth_code);
        localStorage.setItem("visited", "[]");
        let day = new Date();
        day.setDate(day.getDate()+7);   //期限は7日
        localStorage.setItem("limit", dateformat(day));
        localStorage.setItem("vote_limit", "{}");
        vote_limit = {};
    }else{
        vote_limit = JSON.parse(vote_limit);
    }

    let qr_count = (await api("GetLocation", {gift:"false"})).length;
    let userdata = await api("GetData", {id:id, auth_code:auth_code});
    
    document.getElementById("qrtext").innerText = `${qr_count}種類のQRコードを読もう!`;
    document.getElementById("wavetext").innerText = `${userdata['achievement_rate']}%`;
    
    if(userdata['achievement_rate']==100){
        document.getElementById("wavesvg").style.top = "0";
        document.getElementById("qr").classList.add("success");
    }else{
        document.getElementById("wavesvg").style.top = `${(100-userdata['achievement_rate'])*0.8+10}%`;
    }
    if(userdata['recorded_locations'].length - Object.keys(vote_limit).length != userdata['answerd_locations'].length){
        document.getElementById("qrtext").innerHTML += `<br><span style="font-size: 0.7em;color:red;">未回答のものがあります!!(タップでマイページ)</span>`;
    }

    visited.forEach(eid=>{
        document.getElementById(eid).classList.add("success");
    });

})().catch(ex=>{
    if(ex=="auth faild"){
        localStorage.clear();
        location.reload(true);
    }else{
        //invalid parameter, bad request, server error
        //ここトップなので飛ぶ先ないのでなにもしない
    }
})


function linktap(element){
    visited.push(element.id);
    localStorage.setItem("visited", JSON.stringify(visited));
}