async function api(edp, req={}, cl="API", type="json"){
    let res = await fetch(`https://${document.domain}/${cl}/${edp}`, {
        method: "POST",
        headers: {"Content-Type":"application/json; charset=utf-8"},
        body: JSON.stringify(req)
    });
    let obj;
    if(type=="json"){
        obj = await res.json();
    }else{
        obj = await res.text();
    }
    if(res.status==200){
        return Promise.resolve(obj);
    }else{
        console.log(`[ERROR] ${res.status}: ${obj['error']}`);
        return Promise.reject(obj['error']);
    }
}

function active(elementnames){
    elementnames.forEach(name=>{
        element = document.getElementById(name);
        if(!element.classList.contains("active")){
            element.classList.add("active");
        }else{
            element.classList.remove("active")
        }
    });
}

function dateformat(date){
    let f_year = date.getFullYear();
    let f_month = ('0' + (date.getMonth() + 1)).slice(-2);
    let f_date = ('0' + date.getDate()).slice(-2);
    let f_hour = ('0' + date.getHours()).slice(-2);
    let f_minute = ('0' + date.getMinutes()).slice(-2);
    let f_seconds = ('0' + date.getSeconds()).slice(-2);
    return `${f_year}/${f_month}/${f_date} ${f_hour}:${f_minute}:${f_seconds}`
}