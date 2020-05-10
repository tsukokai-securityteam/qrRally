#!/bin/bash

#既存のコンテナと既存データ削除(証明書除く)
sudo docker rm -f qrserver
sudo rm -rf ./container_data/mysql
sudo rm -rf ./container_data/nginxconf

#データ永続化用ディレクトリ作成
mkdir -p ./container_data/mysql
mkdir -p ./container_data/letsencrypt
mkdir -p ./container_data/nginxconf

echo ""
echo "QRラリー 自動コンテナ作成スクリプト"
echo ""
echo "################################################################"
echo "事前にホストOSのファイアウォールを適切に設定してください"
echo "( 基本的には 80/tcp, 443/tcp, SSH のみの解放 )"
echo ""
echo "事前にホストOSにDocker, Docker-Composeをインストールしてください"
echo "################################################################"
echo ""
echo "コンテナを作成します。各種設定情報を入力してください。"
echo ""

echo "QRラリー情報保存用DBのrootのPWを設定します。"
while :
do  
    stty -echo
    read -p "rootパスワード: " pw1
    echo ""
    read -p "rootパスワード(確認): " pw2
    echo ""
    stty echo
    if [ ${pw1} != ${pw2} ]; then
        echo "入力PWが一致しませんでした"
    else
        break
    fi
done

export MYSQL_ROOT_PASSWORD=${pw1}
sudo -E docker-compose up -d
export -n MYSQL_ROOT_PASSWORD
unset pw1 pw2

sudo docker exec -it qrserver sh /srvscript/install.sh

echo ""
echo "/qrserver/config/ 以下のJSONファイルを設定してください。(マニュアル参照)"
echo "設定しましたら /startsrv.sh を実行してください。"
echo ""