# Notices

## Not a Bizerba product

This is an unofficial training aid written by an end user. It is **not** made,
endorsed, supported or checked by Bizerba. "Bizerba", "GLM", "GLM-I" and
"BRAIN2" are marks of Bizerba SE & Co. KG and are used here only to say which
machine is being described.

Nothing here is safety guidance. **The simulator is not a substitute for the
machine's instruction manual, your site's work instructions, or training on the
real line.** Do not use it to decide what to do to a running machine.

## Quoted manual content

The menu tree, the option lists, the message texts and the figures shown in the
Hardware tab are taken from the *GLM-I instruction manual*, document
**38.019.129.001 en**, and are reproduced here as short excerpts for training
reference. Copyright in that manual remains with Bizerba. The PDF itself is not
in this repository and is not redistributed.

If Bizerba would prefer this content removed, open an issue and it will be
taken out.

## Product data

No real price list, customer, product or pricing data is in this repository.
`data/plu-demo.json` is invented sample data — the customers, products, PLUs,
barcodes and codes in it are fictional and resemble no real range.

A real price list is loaded at runtime from the Price list tab and kept in the
browser's `localStorage` on that device only. It is never written into the page,
never uploaded, and never reaches this repository. See [docs/plu-format.md](docs/plu-format.md).

## Site passwords

No passwords are in the code. The Settings tab stores site passwords in
`localStorage` on the device only. Don't commit them anywhere.
