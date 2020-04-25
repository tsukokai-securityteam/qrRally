const crypto = require('crypto');
const fs = require('fs');

if(process.argv.length <= 2){
    process.exit();
}

const serverconfpath = "/apiserver/config/server.json";
const serverconf = JSON.parse(fs.readFileSync(serverconfpath, {encoding: 'utf8'}));

let id = process.argv[2];
let pw = process.argv[3];
let hashdata = hash(pw);

serverconf['operation_account']['id'] = id;
serverconf['operation_account']['hash'] = hashdata['hash'];
serverconf['operation_account']['solt'] = hashdata['solt'];

fs.writeFileSync(serverconfpath, JSON.stringify(serverconf, null, 2));

function hash(password){
    const solt = crypto.randomBytes(64);
    const hash = crypto.scryptSync(password, solt, 64);
    return {"hash":hash.toString("base64"),"solt":solt.toString("base64")}
}

id="";
pw="";
