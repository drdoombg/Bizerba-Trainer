#!/usr/bin/env python3
"""Build index.html: one self-contained file, no network, no build tooling.

    python src/build.py            # repo root -> index.html

Inlines the manual sections, the manual figures and the demo price list as JSON
constants, then the stylesheet/markup shell and app.js. Nothing is fetched at
runtime, so the result opens straight from disk.

No real price list is ever inlined. data/plu-demo.json is fictional sample data;
a real one is loaded at runtime from the Price list tab into localStorage.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAN_KEYS = ('num', 'title', 'page', 'levels', 'paths', 'options', 'kind', 'text')


def read_json(rel):
    with open(ROOT / rel, encoding='utf-8') as f:
        return json.load(f)


def js(o):
    """JSON that is safe to drop inside a <script> block."""
    return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def main():
    man = [{k: sec[k] for k in MAN_KEYS} for sec in read_json('data/manual.json')]
    figs = read_json('data/figs.json')
    # captions the PDF text extraction attached to the wrong image
    figs['felt']['cap'] = 'Illustration 73: Changing the felt strip in the printer'
    figs['device']['cap'] = 'Illustration 1: Device view GLM-I'

    demo = read_json('data/plu-demo.json')
    for p in demo:
        p.pop('d2', None)

    tpl = (ROOT / 'src/template.html').read_text(encoding='utf-8')
    app = (ROOT / 'src/app.js').read_text(encoding='utf-8')

    out = (tpl
           + '\n<script>\n'
           + 'const MAN=' + js(man) + ';\n'
           + 'const DEMO_PRODUCTS=' + js(demo) + ';\n'
           + 'const FIGS=' + js(figs) + ';\n'
           + '</script>\n<script>\n' + app + '\n</script>\n'
           + '</body>\n</html>\n')

    dest = ROOT / 'index.html'
    with open(dest, 'w', encoding='utf-8', newline='\n') as f:
        f.write(out)
    print(f'{dest.name}  {len(out.encode("utf-8")) // 1024} KB  '
          f'{len(man)} manual sections, {len(figs)} figures, {len(demo)} demo articles')
    return 0


if __name__ == '__main__':
    sys.exit(main())
