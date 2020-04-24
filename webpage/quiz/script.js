const id = localStorage.getItem("id");
const auth_code = localStorage.getItem("auth_code");
const limit = localStorage.getItem("limit");

const qr_location = (new URLSearchParams(location.search)).get("location");

if(!id || !auth_code || !limit || new Date()>new Date(limit) || !qr_location){
    location.replace("/");
}

api("UniquePage", {id:id, auth_code:auth_code, location:qr_location}).then(res=>{
    document.getElementById("title").innerHTML = res['contents']['title'];
    document.getElementById("question").innerHTML = res['contents']['question'];
    const elebox = '<div class="choice" onclick="choice(this)"><input type="radio" name="choice">';
    document.getElementById("contentsbox").innerHTML = `${elebox}${res['contents']['choice'].join(`</div>${elebox}`)}</div>`
}).catch(ex=>{
    if(ex=="invalid parameter" || ex=="auth faild" || ex=="bad request"){
        location.replace("/");
    }else if(ex=="server error"){
        location.replace("/qrcamera/");
    }else if(ex=="alrady answerd" || ex=="access denied"){
        location.replace("/mypage/");
    }else{
        location.replace("/");
    }
});

function choice(element){
    element.children[0].checked = true;
    Array.from(document.getElementsByTagName("input")).forEach(val=>{
        if(val.checked){
            val.parentElement.classList.add("active");
        }else{
            val.parentElement.classList.remove("active");
        }
    });
}

function submit(){
    let answer = Array.from(document.getElementsByTagName("input")).find(val=> val.checked).parentElement.innerText;
    api("RecordAnswer", {id:id, auth_code:auth_code, location:qr_location, answer:answer}).then(res=>{
        let result = document.getElementById("result");
        if(res['result']=="correct"){
            result.innerText = "正解"
        }else{
            result.innerText = "不正解…"
        }
        document.getElementById("point").innerText = res['point'];
        active(["resultbox"]);
    }).catch(ex=>{
        if(ex=="invalid parameter" || ex=="invalid answer" || ex=="bad request"){
            alert("回答に不備があります");
        }else if(ex=="auth faild"){
            location.replace("/");
        }else if(ex=="alrady answerd" || ex=="access denied"){
            location.replace("/mypage/");
        }else if(ex=="server error"){
            location.replace("/qrcamera/");
        }else{
            location.replace("/");
        }
    });
}