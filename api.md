## Entry
ユーザ登録
### Parameter
なし
### Responce
```json :200
{
    "id": "1",
    "auth_code": "4a9km5-397843"
}
```
### Error Responce
|種|Code|EX|
|-|-|-|
|共通|500|server error|

---

## RecordQR
読み取ったQRの記録
### Parameter
```json
{
    "id": "1",
    "auth_code": "4a9km5-397843",
    "qr": "tcu_Ichigokan"
}
```
### Responce
/[対応するコンテンツ]?location=[QRに対応するロケーション]
```json
{
    "url": "https://domain.com/enquete?location=一号館"
}
```
### Error Responce
|種|Code|EX|
|-|-|-|
|共通|400|invalid parameter|
|共通|400|auth faild|
|共通|400|bad request|
|共通|500|server error|
|固有|400|alrady answerd|

---

## UniquePage
ロケーション(QR)ごと固有のコンテンツを返す
### Parameter
```json
{
    "id": "1",
    "auth_code": "4a9km5-397843",
    "location": "一号館"
}
```
### Responce
config/qr.jsonに応じる
```json
{
    "contents": {
        "title": "アンケートその1",
        "description": "アンケートその1です。",
        "enquete": [
            "(略)"
        ]
    }
}
```
### Error Responce
|種|Code|EX|
|-|-|-|
|共通|400|invalid parameter|
|共通|400|auth faild|
|共通|400|bad request|
|共通|500|server error|
|固有|400|alrady answerd|
|固有|400|access denied|

---

## RecordAnswer
コンテンツ回答記録
### Parameter
config/qr.jsonに応じる
```json
{
    "id": "1",
    "auth_code": "4a9km5-397843",
    "location": "一号館",
    "answer": [["東京都市大学", "東京電機大学"], "東京都市大学", "自由記述aaa"]
}
```
### Responce
```json
{
    "point": 100
}
```
```json
{
    "result": "wrong",
    "point": 50
}
```
### Error Responce
|種|Code|EX|
|-|-|-|
|共通|400|invalid parameter|
|共通|400|auth faild|
|共通|400|bad request|
|共通|500|server error|
|固有|400|alrady answerd|
|固有|400|access denied|
|固有|400|invalid answer|

---

## RecordGift
景品交換記録
### Parameter
config/gift.jsonに応じる
```json
{
    "id": "1",
    "auth_code": "4a9km5-397843",
    "giftname": "景品1"
}
```
### Responce
```json
{
    "result": "ok"
}
```
### Error Responce
|種|Code|EX|
|-|-|-|
|共通|400|invalid parameter|
|共通|400|auth faild|
|共通|400|bad request|
|共通|500|server error|
|固有|400|alrady exchanged|
|固有|400|insufficient point|

---

### Suggest
行動履歴からのサジェストを返す
### Parameter
```json
{
    "id": "1",
    "auth_code": "4a9km5-397843"
}
```
### Responce
```json
{
    "message": "通信工学がおすすめです。"
}
```
### Error Responce
|種|Code|EX|
|-|-|-|
|共通|400|invalid parameter|
|共通|400|auth faild|
|共通|400|bad request|
|共通|500|server error|

---

## GetData
ユーザー状態の取得
### Parameter
```json
{
    "id": "1",
    "auth_code": "4a9km5-397843"
}
```
### Responce
```json
    {
        "recorded_locations": ["tcu_Ichigokan", "tcu_Nigokan"],
        "answerd_locations": ["tcu_Ichigokan"],
        "total_point": 500,
        "exchangeable_gifts": ["景品B"],
        "exchanged_gifts": ["景品A"],
        "suggest_type": "通信工学系A",
        "achievement_rate": 50
    }
```
### Error Responce
|種|Code|EX|
|-|-|-|
|共通|400|invalid parameter|
|共通|400|auth faild|
|共通|400|bad request|
|共通|500|server error|

---

## GetLocation
QRロケーション一覧を返す
### Parameter
なし
### Responce
```json
["一号館", "二号館", "食堂", "景品交換所"]
```
### Error Responce
(設定なし)

---

## GetGift
QRロケーション一覧を返す
### Parameter
なし
### Responce
```json
[
    {
        "name": "景品A",
        "point": 100
    },
    {
        "name": "景品B",
        "point": 200
    }
]
```
### Error Responce
(設定なし)

---

### /Operation/GetTotalList
集計データ一覧を返す
### Parameter
```json
{
    "operationid":"setasai_id",
	"operationcode":"setasai_code"
}
```
---

### /Operation/GetTotalData
集計データを返す
### Parameter
```json
{
    "operationid":"setasai_id",
	"operationcode":"setasai_code"
}
```
---

### /Operation/GetUserData
DBの特定ユーザのデータを返す
### Parameter
```json
{
    "operationid":"setasai_id",
    "operationcode":"setasai_code",
    "userid":"1"
}
```
---

### /Operation/GetAllData
DBの全ユーザのデータを返す
### Parameter
```json
{
    "operationid":"setasai_id",
	"operationcode":"setasai_code"
}
```
---