#!/usr/bin/env python3
"""
Render Science (and optionally other) section pages as images.
Updates imageSrc in the JSON to point to actual rendered files.
Usage: python3 render_sections.py "ACT 2025 Form J08.pdf" J08
"""
import sys, json
from pathlib import Path
import fitz
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]

def find_section_pages(pdf_path):
    pages = {}
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ''
            for sec, marker in [
                ('english', 'ENGLISH TEST'),
                ('math', 'MATHEMATICS TEST'),
                ('reading', 'READING TEST'),
                ('science', 'SCIENCE TEST'),
            ]:
                if marker in text and sec not in pages:
                    pages[sec] = i
        # Find scoring start
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ''
            if 'Scoring Guide' in text or 'Scoring Keys' in text:
                pages['_scoring'] = i
                break
        if '_scoring' not in pages:
            pages['_scoring'] = total
    return pages, total

def render_section_pages(pdf_path, test_id, section_id, start, end, dpi=150):
    out_dir = ROOT / 'public' / 'tests' / test_id / section_id
    out_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)

    page_map = {}
    for i in range(start, end):
        page = doc[i]
        pix = page.get_pixmap(matrix=mat)
        fname = f'page_{i}.jpg'
        pix.save(str(out_dir / fname))
        page_map[i] = f'/tests/{test_id}/{section_id}/{fname}'
        print(f'  [{section_id}] page {i+1} → {fname}')

    doc.close()
    return page_map

def update_english_images(json_path, page_map):
    """Update English passage + per-question imageSrc using pageIndex."""
    with open(json_path) as f:
        data = json.load(f)

    eng = next((s for s in data['sections'] if s['id'] == 'english'), None)
    if not eng:
        return

    pages = sorted(page_map.keys())

    def resolve(pi):
        if pi in page_map:
            return page_map[pi]
        return page_map[min(pages, key=lambda p: abs(p - pi))]

    total_qs = 0
    for passage in eng.get('passages', []):
        passage['imageSrc'] = resolve(passage.get('startPage', pages[0]))
        for q in passage.get('questions', []):
            pi = q.get('pageIndex', passage.get('startPage', pages[0]))
            q['imageSrc'] = resolve(pi)
            total_qs += 1

    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f'  Updated {len(eng.get("passages",[]))} English passages, {total_qs} questions with per-page images')


def update_science_images(json_path, page_map, sci_start, sci_end):
    with open(json_path) as f:
        data = json.load(f)

    sci = next((s for s in data['sections'] if s['id'] == 'science'), None)
    if not sci:
        return

    pages = sorted(page_map.keys())
    n_pages = len(pages)

    # Assign pages to passages proportionally, then all questions in passage get that page
    passages = sci.get('passages', [])
    n_passages = len(passages)
    if n_passages == 0:
        return

    for pi, passage in enumerate(passages):
        # Each passage gets a page roughly proportional to its position
        page_local = min(int(pi * n_pages / n_passages), n_pages - 1)
        page_abs = pages[page_local]
        img = page_map[page_abs]
        passage['imageSrc'] = img
        for q in passage.get('questions', []):
            q['imageSrc'] = img

    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    total_qs = sum(len(p.get('questions', [])) for p in passages)
    print(f'  Updated {n_passages} passages, {total_qs} questions with science images')

def update_reading_images(json_path, page_map):
    with open(json_path) as f:
        data = json.load(f)

    reading = next((s for s in data['sections'] if s['id'] == 'reading'), None)
    if not reading:
        return
    pages = sorted(page_map.keys())
    passages = reading.get('passages', [])
    if not pages or not passages:
        return
    for pi, passage in enumerate(passages):
        page_abs = pages[min(int(pi * len(pages) / len(passages)), len(pages) - 1)]
        img = page_map[page_abs]
        passage['imageSrc'] = img
        for q in passage.get('questions', []):
            q['imageSrc'] = img
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f'  Updated {len(passages)} Reading passages with images')

def main(pdf_path, test_id, json_path=None):
    sec_pages, total = find_section_pages(pdf_path)
    print(f'Section pages: {sec_pages}')

    order = ['english', 'math', 'reading', 'science']
    ends = {}
    for i, sec in enumerate(order):
        if sec not in sec_pages:
            continue
        nxt = next((order[j] for j in range(i+1, len(order)) if order[j] in sec_pages), '_scoring')
        ends[sec] = sec_pages.get(nxt, total)

    json_path = Path(json_path) if json_path else ROOT / 'src' / 'data' / f'{test_id}.json'

    # Render English pages
    if 'english' in sec_pages:
        s, e = sec_pages['english'], ends.get('english', total)
        print(f'\nRendering english pages {s+1}–{e}...')
        page_map = render_section_pages(pdf_path, test_id, 'english', s, e)
        update_english_images(json_path, page_map)

    if 'reading' in sec_pages:
        s, e = sec_pages['reading'], ends.get('reading', total)
        print(f'\nRendering reading pages {s+1}–{e}...')
        page_map = render_section_pages(pdf_path, test_id, 'reading', s, e)
        update_reading_images(json_path, page_map)

    # Render science pages
    if 'science' in sec_pages:
        s, e = sec_pages['science'], ends.get('science', sec_pages['_scoring'])
        print(f'\nRendering science pages {s+1}–{e}...')
        page_map = render_section_pages(pdf_path, test_id, 'science', s, e)
        update_science_images(json_path, page_map, s, e)

    print('\nDone.')

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python3 render_sections.py <pdf> <test_id>')
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
