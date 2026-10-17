<p align="center">
  <img src="assets/icon-192.png" width="96" height="96" alt="">
</p>

<h1 align="center">Labeller Line Trainer</h1>

<p align="center">
  A browser replica of the <b>Bizerba GLM-I</b> weigh-price labeller terminal.<br>
  One file, no server, no internet — learn the machine software without touching a live line.
</p>

<p align="center">
  <a href="#quick-start"><img alt="runs offline" src="https://img.shields.io/badge/runs-offline-1f5c94"></a>
  <img alt="one file" src="https://img.shields.io/badge/build-single%20HTML%20file-555">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/licence-MIT-1d7a3b"></a>
  <a href="NOTICE.md"><img alt="unofficial" src="https://img.shields.io/badge/status-unofficial-a35f00"></a>
</p>

---

A weigh-price labeller is unforgiving to learn on. It is in the middle of a
running line, the menu is five levels deep, and the wrong setting means
mislabelled product. This is that terminal in a browser tab: the same menu
tree, the same authorization levels, the same messages — plus a simulated line
you can break on purpose and put back together.

Written by an end user as a training aid. **Not a Bizerba product** and not a
substitute for the manual or for training on the real line — see
[NOTICE.md](NOTICE.md).

## What's in it

* **The terminal** — 1280×768 screen, a menu tree of 500+ softkeys built from
  726 sections of the GLM-I instruction manual, authorization levels 0–9 with
  the password dialog, and the customer level 9 layout photographed from a real
  line.
* **A running line** — packages are weighed with realistic spread, sorted into
  weight classes, routed to print channels, labelled, totalled and ejected.
  Totals, the weighing list, motor currents and throughput all move.
* **Hardware** — schematic of the line, label roll change step by step with the
  manual's own figures, height adjustment, air, E-stop, light barriers.
* **31 drills** across terminal basics, cooking time by weight class, hardware
  and settings faults. Fault drills load a problem as if the last shift left
  it; fix it and run eight good packs. Progress is kept per line.
* **Explain mode** — press `E` and every softkey shows its manual section
  instead of running.
* **Macros** — record, save to a key, replay, and copy to a level 9 softkey,
  the way the customer macros on the real terminal work.
* **Four lines** — two GLM-I 40s, a GLM-I 70 with master and slave heads that
  is offline from BRAIN2, and one with a C-Wrap applicator.

## Quick start

**Online** — open the GitHub Pages site for this repository.

**From disk** — download `index.html` and double-click it. That's the whole
application: 1.5 MB, no server, no network access, nothing to install. Put it on
a USB stick and it works on a line-side PC with no internet.

```bash
git clone https://github.com/drdoombg/Bizerba-Trainer.git
# then open index.html
```

Everything you change — screen mode, site passwords, your price list, drill
progress — is stored in that browser's `localStorage` and nowhere else.

## Your own articles

The trainer ships with **18 fictional demo articles**. No real price list,
customer, product or pricing data is in this repository or in `index.html`.

To practise on your own range, open the **Price list** tab and load a CSV or
JSON file. It is read in the browser, stored on that device only, and never
becomes part of the page. From a real Retail Product Information Sheet:

```bash
python -m pip install openpyxl
python tools/pricelist_to_plu.py "Price list wc 16 10 2026 V1.xlsm" my-plu.json
```

Full column list, the aliases accepted, and how the weighing mode is read from
the product name: **[docs/plu-format.md](docs/plu-format.md)**.

Site name, the level 9 customer macro label and its filter are set in
**Settings** — also browser-local. Site passwords go there too; none are in the
code.

## Repo layout

```
index.html                 the application — built, committed, open it directly
src/template.html          page shell and all CSS
src/app.js                 all behaviour, one IIFE
src/build.py               inlines the JSON + app.js into index.html
data/manual.json           726 sections from the GLM-I manual (paths, levels, options, text)
data/figs.json             43 manual figures as WebP data URIs
data/plu-demo.json/.csv    the fictional demo articles, and the import format by example
tools/pricelist_to_plu.py  price list .xlsm -> PLU json/csv for loading in the browser
tools/make_icons.py        regenerates assets/ from one shape definition
docs/plu-format.md         price list import format
```

### Building

```bash
python src/build.py     # rewrites index.html from src/ and data/
node --check src/app.js # optional syntax check
```

Edit `src/`, never `index.html` — the Pages workflow rebuilds and fails the
deploy if the committed `index.html` is out of step.

## What's real and what's assumed

The Reference tab inside the app tags every item. In short:

| | |
|---|---|
| **From the manual** | menu paths, mode levels, option lists, messages and remedies, print channel options, weight class table fields, the macro menu, the preselection matrix, roll-change steps |
| **From photographs** of a real terminal | level names, the level 9 softkey layout on both pages, screen layout, status box, totals, motor currents, weighing list |
| **Inferred** — my reading, not confirmed | manual mode level → site level mapping, weighing mode and weight limits read from product names, 8-day shelf life, position trigger 2 as ejector timing, label layouts, the key under the flag |

The label layouts are generic. Real customer designs are not modelled.

## Not modelled yet

GT-SoftControl layouts, the contents of the real customer macros, real label
layouts, and BRAIN2 (data maintenance, download/upload, Label_Designer) beyond
the download that overwrites local changes.

## Contributing

Photographs of the main menu at each level, a weight class data table, a lock
message or a slave head screen are worth more than code here — the fidelity is
limited by what has been seen. Open an issue.

## Licence

[MIT](LICENSE) for the code. The quoted manual text and figures, and the
Bizerba name, are not covered by it — see [NOTICE.md](NOTICE.md).
