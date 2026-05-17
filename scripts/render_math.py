#!/usr/bin/env python3
"""
Render Math section pages as images and update the test JSON.
Usage: python3 render_math.py "ACT 2025 Form J08.pdf" J08
"""
import sys, json
from pathlib import Path
import fitz  # PyMuPDF
import pdfplumber

def find_math_pages(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        start, end = None, None
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ''
            if 'MATHEMATICS TEST' in text and start is None:
                start = i
            elif start is not None and any(x in text for x in ['READING TEST', 'Scoring Guide', 'Scoring Keys']):
                end = i
                break
        if end is None:
            end = len(pdf.pages)
        return start, end

ROOT = Path(__file__).resolve().parents[1]

def render_pages(pdf_path, test_id, start_page, end_page, dpi=150):
    out_dir = ROOT / 'public' / 'tests' / test_id / 'math'
    out_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)

    page_map = {}  # page_index → image filename
    for i in range(start_page, end_page):
        page = doc[i]
        pix = page.get_pixmap(matrix=mat)
        fname = f'page_{i}.jpg'
        out_path = out_dir / fname
        pix.save(str(out_path))
        page_map[i] = f'/tests/{test_id}/math/{fname}'
        print(f'  Rendered page {i+1} → {fname}')

    doc.close()
    return page_map

def assign_images_to_questions(json_path, page_map, math_start):
    """Assign imageSrc to each math question using its recorded pageIndex."""
    with open(json_path) as f:
        data = json.load(f)

    math_sec = next((s for s in data['sections'] if s['id'] == 'math'), None)
    if not math_sec:
        print('No math section found')
        return

    questions = math_sec.get('questions', [])
    pages = sorted(page_map.keys())

    if not pages or not questions:
        return

    for q in questions:
        pi = q.get('pageIndex', math_start)
        # Use exact page if available, else nearest
        if pi in page_map:
            q['imageSrc'] = page_map[pi]
        else:
            # Fallback: nearest page
            nearest = min(pages, key=lambda p: abs(p - pi))
            q['imageSrc'] = page_map[nearest]

    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f'  Updated {len(questions)} questions with exact page images')

def main(pdf_path, test_id, json_path=None):
    print(f'Finding math pages in {pdf_path}...')
    start, end = find_math_pages(pdf_path)
    print(f'  Math: pages {start+1}–{end}')

    print('Rendering pages...')
    page_map = render_pages(pdf_path, test_id, start, end)

    json_path = Path(json_path) if json_path else ROOT / 'src' / 'data' / f'{test_id}.json'
    print(f'Updating {json_path}...')
    assign_images_to_questions(json_path, page_map, start)
    print('Done.')

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python3 render_math.py <pdf> <test_id>')
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
