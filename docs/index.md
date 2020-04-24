# Quick Start
## 1. コンテナを立ち上げる
```sh
git clone https://github.com/tsukokai-securityteam/qrRally.git
cd qrRally
./create_container.sh
```
**メールアドレスとドメインを聞かれるので入力する**

---

## 2. サーバの設定をする
**/qrserver/config/** 以下にあるファイルをすべて設定する。(デフォルト設定が入っているので書き換えてください)

### qr.json
QRの定義と、QRごと固有のページ(アンケート、クイズ、投票)を設定する。

[個別設定マニュアル](./conf/qr.md)

### suggest.json
サジェストの設定をする。qr.jsonでQRごとに設定した分類を利用。

[個別設定マニュアル](./conf/suggest.md)

### gift.json
景品の設定をする。(景品名と必要ポイント)

[個別設定マニュアル](./conf/gift.md)

### server.json
サーバの設定をする。基本的には集計ページの認証情報のみ設定。

[個別設定マニュアル](./conf/server.md)

---

## 3. サーバを立ち上げる
```sh
#qrRallyディレクトリで
./startsrv.sh
```

---

## 4. トップページのHTML書き換え
**/qrserver/webpage/index.html** がトップページです。

HTMLのコメントに従って書き換えてください。

---

## 5. サーバのログを見る
```sh
#qrRallyディレクトリで
./watchlog.sh
```

---

## 6. ユーザの交換可能景品確認、データ集計
**以下にアクセス**<br>
https://(ドメイン)/operationpage/