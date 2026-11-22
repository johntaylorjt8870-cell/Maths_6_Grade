"""Optional local PDF audit. Requires PyMuPDF (test tool, not an app dependency).
Run after verify-unit-1-lessons.mjs: python scripts/verify-unit-1-pdfs.py
PDFs and previews remain in ignored test-results/.
"""
import json
from pathlib import Path
import pymupdf

folder = Path("test-results/unit-1")
results = []
for lesson in range(2, 7):
    document = pymupdf.open(folder / f"lesson-{lesson}-notebook.pdf")
    outside = []
    empty_pages = []
    drawing_count = 0
    # Review sheet includes every PDF page, not just the first page.
    sheet = pymupdf.open()
    sheet_page = sheet.new_page(width=900, height=((len(document) + 2) // 3) * 440)
    for index, page in enumerate(document):
        assert abs(page.rect.width - 595.28) < 2
        assert abs(page.rect.height - 841.89) < 2
        if not page.get_text().strip():
            empty_pages.append(index + 1)
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for span in line["spans"]:
                    x0, y0, x1, y1 = span["bbox"]
                    if x0 < 25 or x1 > page.rect.width - 25 or y0 < 20 or y1 > page.rect.height - 20:
                        outside.append({"page": index + 1, "text": span["text"], "bbox": span["bbox"]})
        drawing_count += len(page.get_drawings())
        col, row = index % 3, index // 3
        sheet_page.show_pdf_page(pymupdf.Rect(col*300, row*440, (col+1)*300, (row+1)*440), document, index)
    sheet_page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5)).save(folder / f"lesson-{lesson}-all-pages.png")
    result = {"lesson": lesson, "pages": len(document), "format": "A4", "emptyPages": empty_pages, "textOutsideSafeBounds": outside, "vectorDrawingPaths": drawing_count}
    results.append(result)
    assert not outside and not empty_pages, result
(folder / "pdf-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(json.dumps(results, ensure_ascii=False, indent=2))
