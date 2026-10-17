# Loading your own price list

The trainer ships with 18 **fictional** demo articles. To practise on your own
range, load your price list in the **Price list** tab.

The file is read by the browser on your machine, stored in that browser's
`localStorage`, and used as the article database until you remove it. It is
never uploaded, never written into `index.html`, and never reaches this
repository. Reload the page after loading and the articles are still there.

> It is still real commercial data. Keep the file off shared drives, and clear
> it from the Price list tab before handing the device to anyone else.

---

## The quickest route

1. Open the Price list tab and press **Export CSV**. That gives you the demo
   list in the exact format the importer wants.
2. Replace the rows with yours in Excel, keeping the header row.
3. Save as **CSV UTF-8**, then press **Load price list…**.

From a real Retail Product Information Sheet, use the converter instead — it
reads the sheet's own layout:

```bash
python -m pip install openpyxl
python tools/pricelist_to_plu.py "Price list wc 16 10 2026 V1.xlsm" my-plu.json
```

Then load `my-plu.json`. The converter drops any email address it finds and
never writes into the repository (see `.gitignore`).

---

## Columns

CSV needs one header row. Column order doesn't matter, and any column the
importer doesn't recognise is ignored. Only **Bizerba PLU** and **Product** are
required; a row missing either is skipped.

| Header | Key | What the trainer does with it |
|---|---|---|
| **Bizerba PLU** | `plu` | The PLU you call up. 3–5 digits. Required |
| **Product** | `name` | Article text on screen and on the label. Required. The weight in the name sets the weighing mode — see below |
| Customer | `cust` | Shown in the table; prefixed to the article text when the name doesn't already start with it; matched by the level 9 customer macro |
| Section | `sect` | Grouping from the sheet; display only |
| Pack Price | `price` | `C/W` makes it a counter-weigh (price-embedded) article |
| Price Pkg | `ppkg` | Unit price for `C/W` articles, e.g. `4.88` — digits only, no `£` |
| Pack Barcode | `barcode` | 13 digits → GTIN (drawn as a real EAN-13); `2` + 6 digits + `P…` → price-embedded; `M 12345678 S` style → customer code |
| Tray + film | `tare` | Tare, e.g. `24g`. Drives the NET/TARE display and the tare drills |
| End of Batch | `eob` | Shown on the total label |
| Tray Size | `tray` | Display only |
| Nav Code | `nav` | Searchable; display only |
| Product Code | `pcode` | Searchable; display only |
| Case Size | `case` | Preselection target for Total 1 — the case-label drill checks against it |
| Fops | `fops` | Display only |
| Basket Tare | `basket` | Shown on the total label |
| Outer-Case | `outer` | Display only |
| Extra Info | `info` | Display only, trimmed to 160 characters |
| Flash | `flash` | Display only |
| PZ PLU | `pz` | Shown in the table |
| Article Code | `acode` | Display only |

Aliases are accepted for most headers (`Tare` for *Tray + film*, `Notes` for
*Extra Info*, `PLU` for *Bizerba PLU*, `Outer Case`, `End Of Batch`, and so on).

## How the weighing mode is worked out

There is no mode column in the sheet, so the trainer reads the product name:

| Name contains | Mode | Example |
|---|---|---|
| a weight **range** (`1.4KG-1.8KG`) | Weight (weight class) | `Whole Chicken WB 1.4KG-1.8KG` |
| a single weight **and** a whole-bird word (`WB`, `Whole`, `CIB`, `Rotisserie`, `Spatchcock`, `Bird`, `Joint`) | Weight, band taken from the nominal | `Rotisserie CIB Chicken 1.550KG FW` |
| a single weight, no bird word | Fixed weight | `Chicken Breast Fillets 600G` |
| no weight at all | Weight, generic 1 kg band | — |

So name your articles the way the sheet does and the modes come out right.
Shelf-life isn't in the sheet either; every article gets 8 days.

## JSON instead of CSV

An array of objects using the **Key** column above, or `{"rows": [...]}`:

```json
[
  {
    "cust": "Northvale WB",
    "sect": "NORTHVALE WHOLE BIRD",
    "name": "Northvale British Whole Chicken WB 1.4KG-1.8KG",
    "plu": 1001,
    "barcode": "5023011001106",
    "tare": "32g",
    "case": "2",
    "eob": "4",
    "basket": "1.76kg"
  }
]
```

See [`data/plu-demo.json`](../data/plu-demo.json) for the full 18-row sample.

## Limits and errors

* Up to 4000 articles.
* Duplicate PLUs: the first one wins.
* If a browser refuses to store the list (private browsing, or storage full)
  the Price list tab says so and keeps the previous list.
* **Remove and use demo data** in the Price list tab clears it. Your file on
  disk isn't touched.
