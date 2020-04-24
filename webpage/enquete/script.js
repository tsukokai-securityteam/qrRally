const id = localStorage.getItem("id");
const auth_code = localStorage.getItem("auth_code");
const limit = localStorage.getItem("limit");

var qr_location = (new URLSearchParams(location.search)).get("location");

if(!id || !auth_code || !limit || new Date()>new Date(limit) || !qr_location){
    location.replace("/");
}

api("UniquePage", {id:id, auth_code:auth_code, location:qr_location}).then(res=>{
    document.getElementById("title").innerHTML = res['contents']['title'];
    document.getElementById("description").innerHTML = res['contents']['description'];

    let contentsbox = document.getElementById("contentsbox");
    res['contents']['enquete'].map((val, i)=>{
        if(val['type']=="check"){
            let checkele = `<div class="choice" onclick="choice(this)"><input type="checkbox" name="${i}">`;
            contentsbox.innerHTML += `<div class="item"><p>${val['question']}</p><div class="choicebox">${checkele}${val['choice'].join(`</div>${checkele}`)}</div></div></div>`;
        }else if(val['type']=="radio"){
            let radioele = `<div class="choice" onclick="choice(this)"><input type="radio" name="${i}">`;
            contentsbox.innerHTML += `<div class="item"><p>${val['question']}</p><div class="choicebox">${radioele}${val['choice'].join(`</div>${radioele}`)}</div></div></div>`;
        }else if(val['type']=="write"){
            contentsbox.innerHTML += `<div class="item"><p>${val['question']}</p><textarea class="textbox"></textarea></div>`
        }
    });
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
    if(element.children[0].type=="checkbox"){
        element.children[0].checked = !element.children[0].checked;
    }else{
        element.children[0].checked = true;
    }
    Array.from(document.getElementsByTagName("input")).forEach(val=>{
        if(val.checked){
            val.parentElement.classList.add("active");
        }else{
            val.parentElement.classList.remove("active");
        }
    });
}

function submit(){
    let answer = Array.from(document.getElementsByClassName("item")).map(val=>{
        let textele = val.getElementsByTagName("textarea");
        let inputele = val.getElementsByTagName("input");
        if(Array.from(textele).length>0){
            return textele[0].value;
        }else if(inputele[0].type=="radio"){
            return Array.from(inputele).find(val=> val.checked).parentElement.innerText;
        }else{
            return Array.from(inputele).filter(val=> val.checked).map(val=>val.parentElement.innerText);
        }
    });

    console.log(answer);

    api("RecordAnswer", {id:id, auth_code:auth_code, location:qr_location, answer:answer}).then(res=>{
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