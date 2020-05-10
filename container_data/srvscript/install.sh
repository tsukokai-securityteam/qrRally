#!/bin/bash
echo ""
echo "QRラリー情報保存用DBへのアクセス用ユーザの設定をします。"
echo ""
read -p "新規DBユーザ名: " sql_user
while :
do  
    stty -echo
    read -p "新規DBユーザPW: " sql_pw
    echo ""
    read -p "新規DBユーザPW(確認): " sql_pw2
    echo ""
    stty echo
    if [ ${sql_pw} != ${sql_pw2} ]; then
        echo "入力PWが一致しませんでした"
    else
        break
    fi
done

echo ""
echo "LetsEncrypt用の設定を入力してください"
read -p "メールアドレス入力: " mail
read -p "ドメイン入力: " domain
privkey="/etc/letsencrypt/live/${domain}/privkey.pem"
fullchain="/etc/letsencrypt/live/${domain}/fullchain.pem"

echo ""
echo "管理用ページログイン用のアカウントを作成します。"
read -p "新規管理用アカウントID: " oa_id
while :
do  
    stty -echo
    read -p "新規管理用アカウントPW: " oa_pw
    echo ""
    read -p "新規管理用アカウントPW(確認): " oa_pw2
    echo ""
    stty echo
    if [ ${oa_pw} != ${oa_pw2} ]; then
        echo "入力PWが一致しませんでした"
    else
        break
    fi
done
echo ""

#nodejsやnginxなどのコンテナへのインストール
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
apt -y install nodejs sudo certbot git nginx openssl

#apiserver依存環境のインストール
cd /apiserver
npm install
npm install -g pm2

#nginxテンプレ設定コピー、dhparamのDL(作成せずmozillaのモノを使う)
cp /nginxconf_tmp/* /nginxconf/
curl https://ssl-config.mozilla.org/ffdhe2048.txt > /nginxconf/dhparam.pem

service nginx start

#letsencrypt初回証明書発行用nginx設定
sed -i.bak -e "s@include \/etc\/nginx\/conf.d\/\*.conf\;@include \/nginxconf\/firstcert.conf\;@g" /etc/nginx/nginx.conf
sed -i.bak -E -e "s@server_name .*;@server_name ${domain};@g" /nginxconf/firstcert.conf

nginx -s reload

#letsencrypt証明書発行
if [ -e $privkey ]; then
    echo "証明書は発行済みです。" -w /webpage
    certbot renew
else
    echo "証明書を新規発行します"
    certbot certonly --webroot -d $domain -m $mail -w /webpage --agree-tos -n
fi

#nginx証明書設定
sed -i.bak -e "s@include \/nginxconf\/firstcert.conf\;@include \/nginxconf\/frontsrv.conf\;@g" /etc/nginx/nginx.conf
sed -i.bak -E -e "s@server_name [^_].*;@server_name ${domain};@g" \
    -e "s@ssl_certificate .*;@ssl_certificate ${fullchain};@g" \
    -e "s@ssl_certificate_key .*;@ssl_certificate_key ${privkey};@g" \
    -e "s@ssl_trusted_certificate .*;@ssl_trusted_certificate ${fullchain};@g" /nginxconf/frontsrv.conf

nginx -s reload
nginx -s stop


#server.json設定情報
setting=\
"{
    \"mysql\": {
        \"host\": \"localhost\",
        \"port\": \"3306\",
        \"user\": \"${sql_user}\",
        \"password\": \"${sql_pw}\",
        \"database\": \"qrdb\",
        \"table\": \"userdata\"
    },
    \"certificate_file\": {
        \"key\": \"${privkey}\",
        \"cert\": \"${fullchain}\",
        \"ca\": \"${fullchain}\"
    },
    \"operation_account\": {
        \"id\": \"${oa_id}\",
        \"pw\": \"${oa_pw}\",
        \"secret\": \"\"
    }
}"

#server.json設定スクリプト(nodejs)
cd /srvscript
echo $setting >> ./settingtmp.json
nodejs confset.js ./settingtmp.json
rm ./settingtmp.json

echo "################################################################"
echo "自動コンテナ作成を終了します。"
echo "################################################################"