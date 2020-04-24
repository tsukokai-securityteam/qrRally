#!/bin/bash
echo ""
echo "QRラリー 自動コンテナ作成機 Ver2.0"
echo ""

mkdir -p ./container_data/mysql
mkdir -p ./container_data/letsencrypt
mkdir -p ./container_data/nginxconf

sudo docker rm -f qrserver

sudo docker-compose up -d
sudo docker exec -it qrserver sh /srvscript/install.sh

echo ""
echo "/qrserver/config/ 以下のJSONファイルを設定してください。(マニュアル参照)"
echo "設定しましたら /startsrv.sh を実行してください。"
echo ""