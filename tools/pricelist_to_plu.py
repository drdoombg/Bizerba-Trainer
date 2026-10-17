#!/usr/bin/env python3
"""Turn a Retail Product Information Sheet into a PLU file the trainer can load.

    python -m pip install openpyxl
    python tools/pricelist_to_plu.py "Price list.xlsm" my-plu.json
    python tools/pricelist_to_plu.py "Price list.xlsm" my-plu.csv

Then open the trainer, go to the Price list tab and load the file. It is stored
in that browser only.

Reads every worksheet whose name starts with "Page". Inside a sheet it looks for
a row holding "Bizerba PLU" to learn the column positions, treats a lone cell
near the left as a section heading, and takes any row whose PLU cell is 3-5
digits as an article. The row underneath an article can carry "PZ PLU" and an
article/product code; both are picked up.

Output is NEVER written into the repository by accident — see .gitignore. Treat
it as internal data: it carries customer names, product codes and barcodes.
"""
import csv
import json
import pathlib
import re
import sys

COLUMNS = [
    ('cust',    'Customer',     None),
    ('sect',    'Section',      None),
    ('name',    'Product',      None),
    ('plu',     'Bizerba PLU',  ('Bizerba PLU',)),
    ('price',   'Pack Price',   ('Pack Price',)),
    ('ppkg',    'Price Pkg',    ('Price Pkg',)),
    ('barcode', 'Pack Barcode', ('Pack Barcode',)),
    ('tare',    'Tray + film',  ('Tray + film', 'Tray+film', 'Tare')),
    ('eob',     'End of Batch', ('End of Batch', 'End Of Batch')),
    ('tray',    'Tray Size',    ('Tray Size',)),
    ('nav',     'Nav Code',     ('Nav Code',)),
    ('pcode',   'Product Code', ('Product Code',)),
    ('case',    'Case Size',    ('Case Size',)),
    ('fops',    'Fops',         ('Fops',)),
    ('basket',  'Basket Tare',  ('Basket Tare',)),
    ('outer',   'Outer-Case',   ('Outer-Case', 'Outer Case')),
    ('info',    'Extra Info',   ('Extra Info', 'Notes')),
    ('flash',   'Flash',        ('Flash',)),
    ('pz',      'PZ PLU',       None),
    ('acode',   'Article Code', None),
]
KEYS = [k for k, _, _ in COLUMNS]
EMAIL = re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+')


def txt(v):
    """Cell to a clean one-line string, with any email address dropped."""
    if v is None:
        return ''
    return EMAIL.sub('', re.sub(r'\s+', ' ', str(v))).strip()


def parse(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    out = []
    for ws in wb.worksheets:
        if not ws.title.startswith('Page'):
            continue
        rows = [[txt(c) for c in r] for r in ws.iter_rows(values_only=True)]
        cust = sect = None
        hdr = None
        for ri, cells in enumerate(rows):
            filled = [(i, c) for i, c in enumerate(cells) if c]
            if not filled:
                continue

            banner = [c for _, c in filled if re.search(r'price check', c, re.I)]
            if banner:
                cust = re.sub(r'\s*price check.*', '', banner[0], flags=re.I).strip()

            if any(c == 'Bizerba PLU' for c in cells):
                hdr = {c.replace('\n', ' '): i for i, c in enumerate(cells) if c}
                continue
            if hdr is None:
                continue

            pi = hdr.get('Bizerba PLU')
            name = filled[0][1]
            # a lone short cell near the left margin is a section heading
            if (len(filled) == 1 and pi is not None and filled[0][0] < 3
                    and not re.search(r'code|PLU', name, re.I) and len(name) < 40):
                sect = name
                continue

            plu = cells[pi] if pi is not None and pi < len(cells) else ''
            if not (re.fullmatch(r'\d{3,5}(\.0)?', plu) and filled[0][0] < pi and len(name) > 6):
                continue

            def col(*aliases):
                for a in aliases:
                    for h, i in hdr.items():
                        if h.lower().startswith(a.lower()) and i < len(cells):
                            return cells[i]
                return ''

            rec = {'cust': cust, 'sect': sect, 'name': name, 'plu': int(float(plu))}
            for key, _, aliases in COLUMNS:
                if aliases and key != 'plu':
                    rec[key] = col(*aliases)

            # the row underneath can carry the PZ PLU and an article/product code
            if ri + 1 < len(rows):
                nxt = rows[ri + 1]
                if 'PZ PLU' in nxt:
                    left = [c for c in nxt[:nxt.index('PZ PLU')] if c]
                    if left and re.match(r'^\d{3,5}', left[-1]):
                        rec['pz'] = int(re.match(r'\d+', left[-1]).group())
                codes = [c for c in nxt if re.search(r'(Article|PRODUCT|Order) Code', c, re.I)]
                if codes:
                    rec['acode'] = codes[0]

            for k, v in list(rec.items()):
                if isinstance(v, str):
                    rec[k] = v[:160]
            out.append({k: rec[k] for k in KEYS if k in rec and rec[k] not in (None, '')})
    return out


def write_csv(rows, dest):
    head = [label for _, label, _ in COLUMNS]
    with open(dest, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(head)
        for r in rows:
            w.writerow([r.get(k, '') for k in KEYS])


def main(argv):
    if len(argv) != 3:
        sys.exit(__doc__.strip().splitlines()[0] + '\n\n'
                 'usage: pricelist_to_plu.py <price list.xlsm> <out.json|out.csv>')
    src, dest = pathlib.Path(argv[1]), pathlib.Path(argv[2])
    rows = parse(src)
    if not rows:
        sys.exit('No articles found. Are the worksheets named "Page…" and is there a '
                 '"Bizerba PLU" header row?')
    if dest.suffix.lower() == '.csv':
        write_csv(rows, dest)
    else:
        with open(dest, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(rows, f, ensure_ascii=False, indent=1)
            f.write('\n')

    from collections import Counter
    print(f'{len(rows)} articles -> {dest}')
    for c, n in Counter(r.get('cust') or '(no customer)' for r in rows).most_common():
        print(f'  {n:4d}  {c}')
    print('\nInternal data: keep it out of version control and off shared drives.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
