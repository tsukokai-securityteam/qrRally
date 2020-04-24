# gift.json 設定

## JSON第一階層の構成
景品ごとの設定の配列
```
[
    {景品1の設定},
    {景品2の設定},
    {景品3の設定},
    …
    …
]
```

---

## 景品設定
```
{
    "giftname": 景品名,
    "point": 必要ポイント
}
```

---

## 設定例

```json
[
    {
        "giftname": "景品A",
        "point": 50
    },
    {
        "giftname": "景品B",
        "point": 100
    },
    {
        "giftname": "景品C",
        "point": 150
    }
]
```