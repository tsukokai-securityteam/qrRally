# server.json

## 構成

```
{
  "mysql": {
    "host": SQLサーバー場所,
    "port": SQLサーバポート,
    "user": SQLサーバユーザネーム,
    "password": SQLサーバパスワード,
    "database": DB名,
    "table": テーブル名
  },
  "certificate_file": {
    "key": 証明書鍵,
    "cert": 証明書, 
    "ca": CA証明書
  },
  "operation_account": {
    "id": 集計ページアクセス用ID,
    "auth_code": 集計ページアクセス用PassWord
  }
}
```

---

## 注意事項
- **基本的に変更するのは集計ページアクセス用のIDとPWのみ**
- **証明書設定はコンテナ立ち上げ時に自動設定されます**

---

## 設定例

```json
{
  "mysql": {
    "host": "localhost",
    "port": "3306",
    "user": "qruser",
    "password": "qrserverDB@qruser",
    "database": "qrdb",
    "table": "userdata"
  },
  "certificate_file": {
    "key": "/etc/letsencrypt/live/example.co.jp/privkey.pem",
    "cert": "/etc/letsencrypt/live/example.co.jp/cert.pem",
    "ca": "/etc/letsencrypt/live/example.co.jp/fullchain.pem"
  },
  "operation_account": {
    "id": "setasai2019",
    "auth_code": "a7B&L.rvq@fM*10"
  }
}

```