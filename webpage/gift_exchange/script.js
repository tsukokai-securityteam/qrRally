const id = localStorage.getItem("id");
const auth_code = localStorage.getItem("auth_code");
const limit = localStorage.getItem("limit");

if(!id || !auth_code || !limit || new Date()>new Date(limit)){
    location.replace("/");
}

let exbutton = document.getElementById("button");

let exgifts;
api("GetData", {id:id, auth_code:auth_code}).then(userdata=>{
    document.getElementById("info").innerText = `ID:${id} , Time:${dateformat(new Date())}`;
    document.getElementById("point").innerText = userdata['total_point'];
    exgifts = userdata['exchangeable_gifts'];
    if(exgifts.length==0){
        exbutton.innerText = "交換対象はありません";
        exbutton.style.pointerEvents = "none";
    }else{
        document.getElementById("gifts").innerHTML = exgifts.map(gift=>`<p id="giftname">${gift['giftname']}</p>`).join("");
    }
}).catch(ex=>{
    location.replace("/");
});

function exchange(bele){
    bele.style.pointerEvents = "none";
    (async()=>{
        for(const gift of exgifts){     //forEach不可( async - forEach - await のようにはできない)
            await api("RecordGift", {id:id, auth_code:auth_code, giftname:gift['giftname']});
        }
        exgifts=[];
        bele.innerText = "交換OK!";
    })().catch(ex=>{
        location.replace("/");
    });
}