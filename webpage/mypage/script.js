const id = localStorage.getItem("id");
const auth_code = localStorage.getItem("auth_code");
const limit = localStorage.getItem("limit");
let vote_limit = localStorage.getItem("vote_limit");

if(!id || !auth_code || !limit || new Date()>new Date(limit) || !vote_limit){
    location.replace("/");
}

vote_limit = JSON.parse(vote_limit);

(async()=>{
    const qr_location = await api("GetLocation", {gift:"false"});
    const userdata = await api("GetData", {id:id, auth_code:auth_code});
    const suggestmsg = (await api("Suggest", {id:id, auth_code:auth_code}))['message'];
    const gifts = await api("GetGift");

    document.getElementById("wavetext").innerText = `${userdata['achievement_rate']}%`;
    if(userdata['achievement_rate']==100){
        document.getElementById("wavesvg").style.top = "0";
    }else{
        document.getElementById("wavesvg").style.top = `${(100-userdata['achievement_rate'])*0.8+10}%`;
    }
    document.getElementById("pointtext").innerText = `${userdata['total_point']}`;

    document.getElementById("visit_list").innerHTML = `<li>${userdata['recorded_locations'].map(val=>{
        if(!userdata['answerd_locations'].some(val2=> val2==val) && !vote_limit[val]){
            return `<a href="${localStorage.getItem(val)}">${val}(タップして回答!)</a>`
        }else{
            return val;
        }
    }).join("</li><li>")}</li>`;
    document.getElementById("list_not").innerHTML = `<li>${qr_location.filter(
        val=>!userdata['recorded_locations'].some(val2=> val2==val)).join("</li><li>")}</li>`;

    if(userdata['recorded_locations'].length==0){
        document.getElementById("visit_list").innerHTML = "<li>(ナシ)</li>"
    }else if(userdata['recorded_locations'].length==qr_location.length){
        document.getElementById("list_not").innerHTML = "<li>(ナシ)</li>"
    }

    if(suggestmsg){
        document.getElementById("suggest_type").innerHTML = userdata['suggest_type'];
        document.getElementById("suggest_text").innerHTML = suggestmsg;
    }else{
        document.getElementById("suggest_text").innerHTML = "QRを記録していくとここにおすすめを表示します";
    }

    document.getElementById("giftlistbox").innerHTML = gifts.map(val=>`<div><p>${val['giftname']}</p><p>${val['point']} Points</p></div>`).join("");

})().catch(ex=>{
    //auth faild, invalid parameter, bad request, server error
    location.replace("/");
});