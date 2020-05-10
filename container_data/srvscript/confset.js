const crypto = require('crypto');
const fs = require('fs');

const serverconfpath = "/apiserver/config/server.json";
//const serverconf = JSON.parse(fs.readFileSync(serverconfpath, {encoding: 'utf8'}));

const newconf = JSON.parse(fs.readFileSync(process.argv[2]));
const hashdata = hash(newconf['operation_account']['pw']);

delete newconf['operation_account']['pw'];
newconf['operation_account']['hash'] = hashdata['hash'];
newconf['operation_account']['solt'] = hashdata['solt'];

fs.writeFileSync(serverconfpath, JSON.stringify(newconf, null, 2));


function hash(password){
    const solt = crypto.randomBytes(64);
    const hash = crypto.scryptSync(password, solt, 64);
    return {"hash":hash.toString("base64"),"solt":solt.toString("base64")}
}
