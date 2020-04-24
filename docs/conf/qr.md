# qr.json 設定

## JSON第一階層の構成
QRごとの設定の配列
```
[
    {QR1の設定},
    {QR2の設定},
    {QR3の設定},
    …
    …
    {景品交換所QRの設定(一番最後必須)}
]
```
**QRの設定は「enqueteタイプ」「quizタイプ」「voteタイプ」がある**

---

## QR設定 enqueteタイプの構成
```
{
    "qr": QRコード文字列,
    "location": QRコード位置,
    "group": サジェスト用分類,
    "contents_type": "enquete",
    "point": 回答時付与ポイント,
    "contents": {
        "title": アンケートタイトル,
        "description": アンケート全体の説明文(HTML可),
        "enquete": [
            アンケート項目(後述)
        ]
    }
}
```

### (enqueteタイプ内) アンケート項目の構成
**アンケート項目には「checkタイプ(複数選択)」「radioタイプ(単一選択)」「writeタイプ(自由記述)」がある**
```
"enquete": [
    {
        "type": "check",
        "question": 質問文,
        "choice": [選択肢1, 選択肢2, 選択肢3, ……]
    },
    {
        "type": "radio",
        "question": 質問文,
        "choice": [選択肢1, 選択肢2, 選択肢3, ……]
    },
    {
        "type": "write",
        "question": 質問文
    },
    …
    …
]
```

---

## QR設定 quizタイプの構成

```
{
    "qr": QRコード文字列,
    "location": QRコード位置,
    "group": サジェスト用分類,
    "contents_type": "quiz",
    "point_correct": 正解時付与ポイント,
    "point_wrong": 不正解時付与ポイント,
    "answer": 正答選択肢(の文字列),
    "contents": {
        "title": クイズタイトル,
        "question": 問題文(HTML可),
        "choice": [選択肢1, 選択肢2, 選択肢3, ……]
    }
}
```

---

## QR設定 voteタイプの構成

```
{
    "qr": QRコード文字列,
    "location": QRコード位置,
    "group": サジェスト用分類,
    "contents_type": "vote",
    "point": 回答時付与ポイント,
    "limit_time": 投票終了時間( yyyy/MM/dd HH:mm:ss 形式など),
    "contents": {
        "title": 投票タイトル,
        "question": 質問文(HTML可),
        "choice": [選択肢1, 選択肢2, 選択肢3, ……]
    }
}
```

---

## 注意事項など

- **どの項目にも数の制限はナシ**
- **景品交換所QRの設定は一番最後に記述**
- **景品交換所設定は「QRコード文字列」「QRコード位置」「サジェスト用分類」のみ変更可**

---

## 設定例

```json
[
    {
        "qr": "tcu_Ichigokan",
        "location": "一号館",
        "group":"通信系A",
        "contents_type": "enquete",
        "point": 100,
        "contents": {
            "title": "志望大学アンケート",
            "description": "現時点で志望している大学についてのアンケートです<br>ご回答よろしくお願いします。",
            "enquete": [
                {
                    "type": "check",
                    "question": "志望する大学を選んでください(複数回答可)",
                    "choice": ["工学院大", "東京都市大", "東京電機大", "芝浦工業大"]
                },
                {
                    "type": "radio",
                    "question": "第一志望の学部を選んでください",
                    "choice": ["工学部", "情報学部", "その他"]
                },
                {
                    "type": "write",
                    "question": "大学選びのポイントを自由に記述してください。"
                }
            ]
        }
    },
    {
        "qr": "tcu_Nigokan",
        "location": "二号館",
        "group":"通信系A",
        "contents_type": "quiz",
        "point_correct": 100,
        "point_wrong": 50,
        "answer": "東京都市大学",
        "contents": {
            "title": "大学名クイズ",
            "question": "ここの大学の名前は何でしょう",
            "choice": ["東京都市大学", "首都大学東京", "東大"]
        }
    },
    {
        "qr": "tcu_Sangokan",
        "location": "三号館",
        "group":"工学系A",
        "contents_type": "vote",
        "point": 100,
        "limit_time": "2019/11/01 15:30:59",
        "contents": {
            "title": "投票",
            "question": "このなかで一番よいと思うものに投票してください。<br>選択は一つです。",
            "choice": ["企画A", "企画B", "企画C"]
        }
    },
    {
        "qr": "tcu_GiftPoint",
        "location": "景品交換所",
        "group":"運営設備",
        "contents_type": "gift_exchange",
        "point": 0,
        "contents": {}
    }
]
```