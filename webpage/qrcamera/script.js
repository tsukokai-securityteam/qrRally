const id = localStorage.getItem("id");
const auth_code = localStorage.getItem("auth_code");
const limit = localStorage.getItem("limit");

let video = document.createElement("video");
let canvasElement = document.getElementById("cameracanvas");
let canvas = canvasElement.getContext("2d");

if(!id || !auth_code || !limit || new Date()>new Date(limit)){
    location.replace("/");
}
if(!localStorage.getItem("fa_camera")){
    alert("QRコードの読み取りのためにカメラの使用許可をお願いします。");
    localStorage.setItem("fa_camera", "true");
}

let scan;
(async()=>{
    //aspectRatio デスクトップ版Firefoxは非対応
    video.srcObject = await navigator.mediaDevices.getUserMedia({audio:false, video:{facingMode:"environment",aspectRatio:1}});
    let wait = setTimeout(() => {
        alert("ほかのタブで開いてるQRカメラを閉じてOKを押してください。");
        location.reload();
    }, 2000);
    await video.play(); //2秒以内にダメならタイムアウト
    clearTimeout(wait);

    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    scan = setInterval(()=>{
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        let image = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        let qrobj = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
        if(qrobj && (qrobj['data'].indexOf('tcu_')!=-1)){
            clearInterval(scan);
            submit(qrobj['data']);
        }else if(qrobj && (qrobj['data'].indexOf('url_')!=-1)){
            clearInterval(scan);
            location.href = qrobj['data'].replace("url_", "");
        }else{
            //なんもしない(まつ)
        }
    },100);

})().catch(ex=>{
    alert("エラーが発生しました。\n(複数ブラウザで開いている場合はすべて閉じてから一つで開きなおしてください)\nカメラを非許可に設定した場合は許可する設定に変更してください。");
    location.reload();
});


function submit(qr) {
    if(!qr){
        //手動入力時用
        qr = document.getElementById("textbox").value;
    }
    api("RecordQR", {id:id, auth_code:auth_code, qr:qr}).then(res=>{
        localStorage.setItem(res['url'].slice(res['url'].lastIndexOf("=")+1), res['url']);
        location.replace(res['url']);
    }).catch(ex=>{
        if(ex=="alrady answerd"){
            alert("このQRは記録済みです!!");
            location.replace("/mypage/");
        }else if(ex=="invalid parameter" || ex=="bad request"){
            alert("QRをもう一度読み込んでください\n(手動入力の場合もう一度ご確認ください)");
        }else if(ex=="auth faild"){
            location.replace("/");
        }else{
            location.replace("/");
        }
    });
}
