#!/bin/bash

echo ""
echo "################################################################"
echo "事前にホストOSのファイアウォールを適切に設定してください"
echo "( 基本的には 80/tcp, 443/tcp, SSH のみの解放 )"
echo ""
echo "事前にホストOSにDocker, Docker-Composeをインストールしてください"
echo "################################################################"
echo ""

echo "コンテナを作成し、コンテナ内で環境のインストールと証明書の発行を行います。"
read -p "(LetsEncrypt)メールアドレス入力: " mail
read -p "(LetsEncrypt)ドメイン入力: " domain

apt -y update
apt -y upgrade
apt -y install curl wget gnupg
curl -sL https://deb.nodesource.com/setup_12.x | bash -

wget https://nginx.org/keys/nginx_signing.key
apt-key add nginx_signing.key
echo "deb http://nginx.org/packages/ubuntu/ bionic nginx" >> /etc/apt/sources.list
echo "deb-src http://nginx.org/packages/ubuntu/ bionic nginx" >> /etc/apt/sources.list
rm nginx_signing.key
apt -y update

apt -y install nodejs jq sudo certbot git nginx openssl

cd /apiserver
npm install
npm install -g pm2

privkey="/etc/letsencrypt/live/${domain}/privkey.pem"
cert="/etc/letsencrypt/live/${domain}/fullchain.pem"
chain="/etc/letsencrypt/live/${domain}/fullchain.pem"

cp /nginxconf_tmp/* /nginxconf/
curl https://ssl-config.mozilla.org/ffdhe2048.txt > /nginxconf/dhparam.pem
service nginx start
sed -i.bak -e "s@include \/etc\/nginx\/conf.d\/\*.conf\;@include \/nginxconf\/firstcert.conf\;@g" /etc/nginx/nginx.conf
sed -i.bak -E -e "s@server_name .*;@server_name ${domain};@g" /nginxconf/firstcert.conf
nginx -s reload
if [ -e $privkey ]; then
    echo "証明書は発行済みです。" -w /webpage
    certbot renew
else
    echo "証明書を新規発行します"
    certbot certonly --webroot -d $domain -m $mail -w /webpage --agree-tos -n
fi
sed -i.bak -e "s@include \/nginxconf\/firstcert.conf\;@include \/nginxconf\/frontsrv.conf\;@g" /etc/nginx/nginx.conf
sed -i.bak -E -e "s@server_name [^_].*;@server_name ${domain};@g" \
    -e "s@ssl_certificate .*;@ssl_certificate /etc/letsencrypt/live/${domain}/cert.pem;@g" \
    -e "s@ssl_certificate_key .*;@ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;@g" \
    -e "s@ssl_trusted_certificate .*;@ssl_trusted_certificate /etc/letsencrypt/live/${domain}/chain.pem;@g" /nginxconf/frontsrv.conf
nginx -s reload

nginx -s stop

cd /apiserver/config/
own=$(stat --format='%u:%g' server.json)
per=$(stat --format='%a' server.json)
mv server.json server.json_tmp
cat server.json_tmp | jq ".certificate_file.key|=\"${privkey}\""  | jq ".certificate_file.cert|=\"${cert}\""  | jq ".certificate_file.ca|=\"${chain}\"" > server.json
rm server.json_tmp
chown $own server.json
chmod $per server.json


echo "データ集計・確認、QRラリーの設定などを行うページのアカウントを作成します。"
echo ""
read -p "新規管理用アカウントID: " id
while :
do  
    stty -echo
    read -p "新規管理用アカウントPW: " pw1
    echo ""
    read -p "新規管理用アカウントPW(確認): " pw2
    echo ""
    stty echo
    if [ ${pw1} != ${pw2} ]; then
        echo "入力PWが一致しませんでした"
    else
        break
    fi
done
cd /srvscript
nodejs srvhashsetup.js ${id} ${pw1}
unset id pw1 pw2


echo "################################################################"
echo "自動コンテナ作成を終了します。"
echo "################################################################"