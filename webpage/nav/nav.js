(async()=>{
    let navdoc = await (await fetch("/nav/nav.html")).text();
    let navparser = new DOMParser();
    document.getElementById("nav").innerHTML = navparser.parseFromString(navdoc, "text/html").getElementById("nav").innerHTML;
})();
