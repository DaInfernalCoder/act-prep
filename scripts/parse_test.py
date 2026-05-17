#!/usr/bin/env python3
"""
ACT 'My Answer Key' PDF Parser → JSON
Handles J08/F12 format (scoring keys embedded in PDF).

Usage:
  python3 parse_test.py "ACT 2025 Form J08.pdf" J08
"""
import sys, re, json
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]

# ── helpers ──────────────────────────────────────────────────────────────────

def get_col(page, x_ratio_start=0.0, x_ratio_end=1.0):
    """Extract text from a horizontal slice of a page."""
    pw = float(page.width)
    ph = float(page.height)
    x0 = pw * x_ratio_start
    x1 = pw * x_ratio_end
    region = page.crop((x0, 0, x1, ph))
    words = region.extract_words(x_tolerance=3, y_tolerance=3)
    if not words:
        return []
    lines = {}
    for w in words:
        y = round(w['top'] / 4) * 4
        lines.setdefault(y, []).append(w)
    result = []
    for y in sorted(lines):
        ws = sorted(lines[y], key=lambda w: w['x0'])
        result.append(' '.join(w['text'] for w in ws))
    return result

CHOICE_LETTERS = 'ABCDEFGHJK'  # A/B/C/D/E (odd) and F/G/H/J/K (even)
NOISE_RE = re.compile(
    r'^(?:\d+|ACT[-\w]*|GO ON TO THE NEXT PAGE\.?|END OF TEST \d+|'
    r'STOP!?|(?:DO )?NOT TURN THE PAGE UNTIL TOLD TO DO SO\.?|'
    r'DO NOT RETURN TO A PREVIOUS TEST\.?)$',
    re.IGNORECASE
)

def is_noise_line(line):
    return bool(NOISE_RE.match(line.strip()))

def normalize_lines(lines):
    """
    Split OCR lines that accidentally contain the start of the next question,
    and drop page furniture before it can be appended to a choice.

    Some PDFs emit lines like:
      "D. certain exasperating calls with my sister, s 12. Which choice..."
      "e 4. F. NO CHANGE"
    """
    out = []
    q_start = re.compile(
        r'(?<!\d)(\d(?:\s*\d)?)\.\s+(?=(?:Which|If|Suppose|At this|The writer|'
        r'Given|For the sake|[AF]\.\s))'
    )
    for raw in lines:
        line = raw.strip()
        if not line or is_noise_line(line):
            continue
        matches = list(q_start.finditer(line))
        if not matches:
            out.append(line)
            continue
        cursor = 0
        for m in matches:
            prefix = line[cursor:m.start()].strip()
            if prefix:
                out.append(prefix)
            out.append(line[m.start():].strip())
            cursor = len(line)
            break
    return out

def parse_choice(line):
    m = re.match(rf'^([{CHOICE_LETTERS}])[.\s]\s*(.+)', line.strip())
    if m:
        return m.group(1), m.group(2).strip()
    return None

def split_question(lines):
    """Split lines into stem + choices dict."""
    stem_parts, choices = [], {}
    cur_letter, cur_parts = None, []

    expanded = []
    for line in normalize_lines(lines):
        # OCR sometimes glues the next answer choice to the previous one and
        # leaves a small fragment before its letter: "... bisects h C. highway".
        line = re.sub(r'\s+[a-z]{1,8}\s+([ABCDEFGHJK])\.\s+', r' \1. ', line)
        parts = re.split(r'(?<!^)\s+(?=[ABCDEFGHJK]\.\s)', line)
        expanded.extend(parts)

    for line in expanded:
        line = line.strip()
        if not line or is_noise_line(line):
            continue
        c = parse_choice(line)
        if c:
            if cur_letter:
                choices[cur_letter] = clean_choice_text(' '.join(cur_parts))
            cur_letter, text = c
            cur_parts = [text]
        elif cur_letter:
            cur_parts.append(line)
        else:
            stem_parts.append(line)

    if cur_letter:
        choices[cur_letter] = clean_choice_text(' '.join(cur_parts))
    return ' '.join(stem_parts).strip(), choices

def clean_choice_text(text):
    """Remove page furniture that OCR sometimes appends to the last choice."""
    return re.split(
        r'\s+(?:GO ON TO THE NEXT PAGE\.?|END OF TEST \d+|STOP!?|'
        r'(?:DO )?NOT TURN THE PAGE UNTIL TOLD TO DO SO\.?|'
        r'DO NOT RETURN TO A PREVIOUS TEST\.?|'
        r'Question \d+ asks about the preceding passage as a whole\.)',
        text,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip()

def parse_questions_from_lines(lines, max_num=75):
    """Parse numbered questions from a list of lines."""
    questions = []
    cur_num, cur_lines = None, []

    def flush():
        nonlocal cur_num, cur_lines
        if cur_num:
            stem, choices = split_question(cur_lines)
            if len(choices) >= 2:
                questions.append({'number': cur_num, 'stem': stem, 'choices': choices})
        cur_num, cur_lines = None, []

    for line in normalize_lines(lines):
        line = line.strip()
        if not line:
            continue
        # Require "N. text" format (period + space + text).
        # This correctly rejects "17" (footer), "3.4 data" (table), "2 2" (header).
        m = re.search(r'(?<!\d)(\d(?:\s*\d)?)\.\s+(.+)', line)
        if m:
            num = int(re.sub(r'\s+', '', m.group(1)))
            rest = m.group(2).strip()
            if (1 <= num <= max_num and rest and
                    not re.match(r'^(ACT|GO ON|NEXT PAGE)', rest, re.IGNORECASE)):
                flush()
                cur_num = num
                cur_lines.append(rest)
                continue
        if cur_num is not None:
            cur_lines.append(line)

    flush()
    return questions

def dedupe(questions):
    seen = {}
    for q in questions:
        if q['number'] not in seen:
            seen[q['number']] = q
    return sorted(seen.values(), key=lambda q: q['number'])

def fallback_letters(section_id, num):
    if section_id == 'math':
        return ['F', 'G', 'H', 'J', 'K'] if num % 2 == 0 else ['A', 'B', 'C', 'D', 'E']
    return ['F', 'G', 'H', 'J'] if num % 2 == 0 else ['A', 'B', 'C', 'D']

def normalize_english_choice_set(q):
    expected = fallback_letters('english', q['number'])
    extras = [letter for letter in q.get('choices', {}) if letter not in expected]
    if extras:
        extra_text = ' '.join(q['choices'].pop(letter) for letter in extras).strip()
        q['stem'] = f"{q.get('stem', '')} {extra_text}".strip()
    for letter in expected:
        q.setdefault('choices', {}).setdefault(letter, '')
    q['choices'] = {letter: q['choices'][letter] for letter in expected}
    return q

def fill_missing_from_answer_key(items, answer_key, section_id, passages=False):
    """
    Keep the UI navigable when PDF text extraction drops an entire item.
    The rendered page remains the source of truth for these rare fallbacks;
    the synthetic record supplies the missing navigation/answer slot.
    """
    flat = [q for p in items for q in p.get('questions', [])] if passages else items
    if not flat or not answer_key:
        return items
    present = {q['number'] for q in flat}
    missing = [n for n in sorted(answer_key) if n not in present]
    for n in missing:
        nearest = min(flat, key=lambda q: abs(q['number'] - n))
        q = {
            'number': n,
            'stem': '',
            'choices': {letter: '' for letter in fallback_letters(section_id, n)},
            'pageIndex': nearest.get('pageIndex'),
            'imageSrc': nearest.get('imageSrc'),
            'correct': answer_key.get(n, ''),
            'synthetic': True,
        }
        if passages:
            target = min(items, key=lambda p: min(abs(existing['number'] - n) for existing in p['questions']))
            target['questions'].append(q)
            target['questions'] = sorted(target['questions'], key=lambda x: x['number'])
        else:
            items.append(q)
            items.sort(key=lambda x: x['number'])
        if passages:
            flat.append(q)
    return items

# ── answer key extraction ─────────────────────────────────────────────────────

def extract_answer_keys(pdf):
    """Extract answer keys using column-aware extraction for two-column AK pages."""
    keys = {}
    section_markers = {
        'english': ['English Scoring Key', 'English—Scoring Key', 'Test 1: English'],
        'math': ['Mathematics Scoring Key', 'Mathematics—Scoring Key', 'Test 2: Mathematics'],
        'reading': ['Reading Scoring Key', 'Reading—Scoring Key', 'Test 3: Reading'],
        'science': ['Science Scoring Key', 'Science—Scoring Key', 'Test 4: Science'],
    }
    # Matches "N. LETTER" or "N LETTER" anywhere in text (handles both J08 and F12 formats)
    # Not anchored to line start — handles two-column lines like "1. B ___ 31. B ___"
    ak_pattern = re.compile(r'(?<!\d)(\d{1,2})\.?\s+([ABCDEFGHJK])(?=\s|_|\b[^A-Z])')

    def extract_from_page(page, sec_dict):
        full_text = page.extract_text() or ''
        for m in ak_pattern.finditer(full_text):
            num = int(m.group(1))
            letter = m.group(2)
            if 1 <= num <= 80 and num not in sec_dict:
                sec_dict[num] = letter

    for pi, page in enumerate(pdf.pages):
        full_text = page.extract_text() or ''
        for sec, markers in section_markers.items():
            if sec in keys:
                continue
            if not any(m in full_text for m in markers):
                continue
            keys[sec] = {}
            # Scoring keys can continue onto an otherwise-unlabeled page
            # before the next section's scoring key begins.
            extract_from_page(page, keys[sec])
            for pj in range(pi + 1, min(pi + 4, len(pdf.pages))):
                next_text = pdf.pages[pj].extract_text() or ''
                if any(
                    other != sec and any(marker in next_text for marker in markers2)
                    for other, markers2 in section_markers.items()
                ):
                    break
                extract_from_page(pdf.pages[pj], keys[sec])
    return keys

def extract_scale_table(pdf):
    tables = {}
    for page in pdf.pages:
        text = page.extract_text() or ''
        if not any(marker in text for marker in [
            'Conversion of Raw Scores to Scale Scores',
            'Scale Scores from Raw Scores',
            'Explanation of Procedures Used to Obtain',
            'Your Scale Score',
        ]):
            continue
        for m in re.finditer(
            r'^(\d+)\s+([\d\-–—]+|—)\s+([\d\-–—]+|—)\s+([\d\-–—]+|—)\s+([\d\-–—]+|—)',
            text, re.MULTILINE
        ):
            scale = int(m.group(1))
            for i, sec in enumerate(['english', 'math', 'reading', 'science'], 2):
                raw_str = m.group(i).strip()
                if '—' in raw_str or not raw_str:
                    continue
                if any(sep in raw_str for sep in ['-', '–']):
                    parts = re.split(r'[-–]', raw_str)
                    try:
                        lo, hi = int(parts[0]), int(parts[1])
                        for r in range(lo, hi + 1):
                            tables.setdefault(sec, {})[r] = scale
                    except ValueError:
                        pass
                else:
                    try:
                        tables.setdefault(sec, {})[int(raw_str.strip())] = scale
                    except ValueError:
                        pass
        break
    return tables

def find_section_pages(pdf):
    pages = {}
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
    return pages

def find_scoring_start(pdf):
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ''
        if 'Scoring Guide' in text and 'Scoring Key' in text:
            return i
    return len(pdf.pages)

# ── English ──────────────────────────────────────────────────────────────────

def parse_english(pdf, start, end, test_id=None):
    all_questions = []  # list of (question_dict, page_index)
    for pi in range(start, end):
        page = pdf.pages[pi]
        right_lines = get_col(page, 0.47, 1.0)
        qs = parse_questions_from_lines(right_lines, max_num=75)
        for q in qs:
            all_questions.append((q, pi))

    # Dedupe keeping first occurrence
    seen = {}
    deduped = []
    for q, pi in all_questions:
        if q['number'] not in seen:
            seen[q['number']] = True
            deduped.append((q, pi))

    # Assign per-question imageSrc based on the page the question was parsed from
    for q, pi in deduped:
        normalize_english_choice_set(q)
        q['pageIndex'] = pi
        q['imageSrc'] = f'/tests/{test_id}/english/page_{pi}.jpg' if test_id else None

    # Group into passages
    passages = []
    group_size = max(12, len(deduped) // 4)
    for i in range(0, len(deduped), group_size):
        group_items = deduped[i:i + group_size]
        group_qs = [q for q, _ in group_items]
        first_page = group_items[0][1] if group_items else start
        pid = i // group_size + 1
        passages.append({
            'id': f'eng-p{pid}',
            'title': f'Passage {pid}',
            'imageSrc': f'/tests/{test_id}/english/page_{first_page}.jpg' if test_id else None,
            'startPage': first_page,
            'questions': group_qs,
        })
    return passages

# ── Math ─────────────────────────────────────────────────────────────────────

MATH_SKIP = re.compile(
    r'^(MATHEMATICS TEST|DIRECTIONS|Do not linger|Solve each|You are permitted'
    r'|Note:|1\.\s+Illustrative|2\.\s+Geometric|3\.\s+The word|4\.\s+The word'
    r'|DO YOUR FIGURING|[12]\s+[12]|2\s*2|GO ON TO)',
    re.IGNORECASE
)

def parse_math(pdf, start, end):
    # Track (line, page_index) so we can assign each question to its source page
    all_lines = []  # list of (line_text, page_index)
    for pi in range(start, end):
        page = pdf.pages[pi]
        lines = get_col(page, 0.0, 0.62)
        for line in lines:
            all_lines.append((line, pi))

    filtered = [(l, pi) for l, pi in all_lines if not MATH_SKIP.match(l.strip())]
    text_lines = [l for l, _ in filtered]
    page_indices = [pi for _, pi in filtered]

    # Math is rendered from page images and the UI shows letter-only answer
    # buttons, so a question is still useful even when PDF extraction misses
    # choices near a figure.
    questions = parse_questions_from_lines_with_pages(text_lines, page_indices, max_num=60, min_choices=0)
    questions = dedupe(questions)
    for q in questions:
        if 'pageIndex' not in q:
            q['pageIndex'] = start
        q['imageSrc'] = None  # filled in by render_math.py
    return questions


def parse_questions_from_lines_with_pages(lines, page_indices, max_num=75, min_choices=2):
    """Like parse_questions_from_lines but also records which page each Q started on."""
    questions = []
    cur_num, cur_lines, cur_page = None, [], None

    def flush():
        nonlocal cur_num, cur_lines, cur_page
        if cur_num:
            stem, choices = split_question(cur_lines)
            if len(choices) >= min_choices:
                questions.append({'number': cur_num, 'stem': stem, 'choices': choices, 'pageIndex': cur_page})
        cur_num, cur_lines, cur_page = None, [], None

    for i, line in enumerate(lines):
        line = line.strip()
        if not line or is_noise_line(line):
            continue
        m = re.search(r'(?<!\d)(\d(?:\s*\d)?)\.\s+(.+)', line)
        if m:
            num = int(re.sub(r'\s+', '', m.group(1)))
            rest = m.group(2).strip()
            if (1 <= num <= max_num and rest and
                    not re.match(r'^(ACT|GO ON|NEXT PAGE)', rest, re.IGNORECASE)):
                flush()
                cur_num = num
                cur_page = page_indices[i] if i < len(page_indices) else None
                cur_lines.append(rest)
                continue
        if cur_num is not None:
            cur_lines.append(line)

    flush()
    return questions

# ── Reading ──────────────────────────────────────────────────────────────────

def parse_reading(pdf, start, end):
    """
    Reading pages alternate: passage page → question pages (2-col).
    Strategy: detect passage text pages vs question pages by presence of
    numbered questions. Extract left + right columns from question pages.
    """
    passages_raw = []  # list of {title, genre, text, questions}
    current_passage = None

    passage_header_re = re.compile(
        r'Passage\s+([IVX]+)',
        re.IGNORECASE
    )
    genre_re = re.compile(
        r'^(INFORMATIONAL|LITERARY NARRATIVE|PROSE FICTION|SOCIAL SCIENCE|HUMANITIES|NATURAL SCIENCE)',
        re.IGNORECASE
    )

    for pi in range(start, end):
        page = pdf.pages[pi]
        full_text = page.extract_text() or ''

        # Detect if this is a question page (has numbered items near top)
        is_q_page = bool(re.search(r'^\d+[.\s]', full_text, re.MULTILINE))

        # Check for passage header
        ph_match = passage_header_re.search(full_text)

        if ph_match and not is_q_page:
            # Pure passage page
            if current_passage:
                passages_raw.append(current_passage)
            roman = ph_match.group(1)
            current_passage = {
                'id': f'passage-{roman.lower()}',
                'title': f'Passage {roman}',
                'genre': '',
                'text': full_text,
                'questions': [],
            }
        elif ph_match and is_q_page:
            # Mixed page: starts with passage header, has questions too
            if current_passage:
                passages_raw.append(current_passage)
            roman = ph_match.group(1)
            current_passage = {
                'id': f'passage-{roman.lower()}',
                'title': f'Passage {roman}',
                'genre': '',
                'text': full_text,
                'questions': [],
            }
            # Extract questions from both columns
            left = get_col(page, 0.0, 0.50)
            right = get_col(page, 0.50, 1.0)
            qs = parse_questions_from_lines(left + right, max_num=40)
            if current_passage:
                current_passage['questions'].extend(qs)
        elif is_q_page and current_passage:
            # Pure question page: two-column layout
            left = get_col(page, 0.0, 0.50)
            right = get_col(page, 0.50, 1.0)
            qs_left = parse_questions_from_lines(left, max_num=40)
            qs_right = parse_questions_from_lines(right, max_num=40)
            current_passage['questions'].extend(qs_left + qs_right)
        elif current_passage:
            # Continue passage text
            current_passage['text'] += '\n' + full_text

    if current_passage:
        passages_raw.append(current_passage)

    # Clean up and dedupe questions per passage
    passages = []
    for p in passages_raw:
        qs = dedupe(p['questions'])
        if not qs:
            continue
        # Extract genre from text
        genre = ''
        for line in p['text'].split('\n'):
            gm = genre_re.match(line.strip())
            if gm:
                genre = gm.group(0)
                break
        # Extract clean passage text (remove header noise)
        clean_text = re.sub(r'^.*?Passage [IVX]+', '', p['text'], flags=re.DOTALL)
        clean_text = re.sub(r'\n\d+ \d+\n', '\n', clean_text)  # remove page headers like "3 3"
        clean_text = clean_text.strip()

        for q in qs:
            q['correct'] = ''
            q['lineRef'] = None

        passages.append({
            'id': p['id'],
            'genre': genre,
            'title': p['title'],
            'source': '',
            'text': clean_text,
            'questions': qs,
        })

    return passages

# ── Science ──────────────────────────────────────────────────────────────────

def parse_science(pdf, start, end, test_id):
    passages_raw = []
    current_passage = None

    passage_header_re = re.compile(r'Passage\s+([IVX]+)', re.IGNORECASE)
    sci_skip = re.compile(r'^(SCIENCE TEST|DIRECTIONS|You are not permitted|4\s+4|GO ON TO|ACT-)', re.IGNORECASE)

    for pi in range(start, end):
        page = pdf.pages[pi]
        full_text = page.extract_text() or ''

        ph_match = passage_header_re.search(full_text)
        has_questions = bool(re.search(r'^\d+[.\s]', full_text, re.MULTILINE))

        if ph_match:
            if current_passage:
                passages_raw.append(current_passage)
            roman = ph_match.group(1)
            current_passage = {
                'id': f'passage-{roman.lower()}',
                'title': f'Passage {roman}',
                'start_page': pi,
                'questions': [],
            }

        if has_questions and current_passage:
            # Extract questions from both columns
            left = get_col(page, 0.0, 0.50)
            right = get_col(page, 0.50, 1.0)
            filtered = [l for l in left + right if not sci_skip.match(l.strip())]
            qs = parse_questions_from_lines(filtered, max_num=40)
            current_passage['questions'].extend(qs)
        elif current_passage:
            pass  # just passage content, no questions

    if current_passage:
        passages_raw.append(current_passage)

    passages = []
    for p in passages_raw:
        qs = dedupe(p['questions'])
        if not qs:
            continue
        img_src = f'/tests/{test_id}/science/passage_{p["id"]}.jpg'
        for q in qs:
            q['correct'] = ''
            q['imageSrc'] = img_src
        passages.append({
            'id': p['id'],
            'title': p['title'],
            'imageSrc': img_src,
            'startPage': p['start_page'],
            'questions': qs,
        })

    return passages

# ── main ─────────────────────────────────────────────────────────────────────

def parse_test(pdf_path, test_id):
    out_dir = ROOT / 'public' / 'tests' / test_id
    out_dir.mkdir(parents=True, exist_ok=True)
    (ROOT / 'src' / 'data').mkdir(exist_ok=True)

    print(f"\nParsing: {pdf_path}")

    with pdfplumber.open(pdf_path) as pdf:
        print(f"  Pages: {len(pdf.pages)}")

        answer_keys = extract_answer_keys(pdf)
        scale_table = extract_scale_table(pdf)
        sec_starts = find_section_pages(pdf)
        ak_start = find_scoring_start(pdf)

        for sec, k in answer_keys.items():
            print(f"  AK {sec}: {sorted(k.items())[:5]}... ({len(k)} total)")

        print(f"  Section starts: {sec_starts}, scoring@p{ak_start+1}")

        order = ['english', 'math', 'reading', 'science']
        ends = {}
        for i, sec in enumerate(order):
            if sec not in sec_starts:
                continue
            nxt = next((order[j] for j in range(i+1, len(order)) if order[j] in sec_starts), None)
            ends[sec] = sec_starts[nxt] if nxt else ak_start

        sections = []

        def apply_ak(questions, section_id, is_list=True):
            ak = answer_keys.get(section_id, {})
            qs = questions if is_list else [q for p in questions for q in p.get('questions', [])]
            for q in qs:
                q['correct'] = ak.get(q['number'], '')

        if 'english' in sec_starts:
            s, e = sec_starts['english'], ends['english']
            print(f"\n  English pages {s+1}–{e}:")
            passages = parse_english(pdf, s, e, test_id=test_id)
            passages = fill_missing_from_answer_key(passages, answer_keys.get('english', {}), 'english', passages=True)
            all_qs = [q for p in passages for q in p['questions']]
            apply_ak(all_qs, 'english')
            sections.append({'id': 'english', 'name': 'English', 'timeMinutes': 45, 'passages': passages})
            print(f"    {len(all_qs)} questions, {len(passages)} passages")

        if 'math' in sec_starts:
            s, e = sec_starts['math'], ends['math']
            print(f"\n  Math pages {s+1}–{e}:")
            questions = parse_math(pdf, s, e)
            questions = fill_missing_from_answer_key(questions, answer_keys.get('math', {}), 'math')
            apply_ak(questions, 'math')
            sections.append({'id': 'math', 'name': 'Mathematics', 'timeMinutes': 60, 'questions': questions})
            print(f"    {len(questions)} questions")

        if 'reading' in sec_starts:
            s, e = sec_starts['reading'], ends['reading']
            print(f"\n  Reading pages {s+1}–{e}:")
            passages = parse_reading(pdf, s, e)
            apply_ak(passages, 'reading', is_list=False)
            sections.append({'id': 'reading', 'name': 'Reading', 'timeMinutes': 35, 'passages': passages})
            total_q = sum(len(p['questions']) for p in passages)
            print(f"    {total_q} questions, {len(passages)} passages")

        if 'science' in sec_starts:
            s, e = sec_starts['science'], ends['science']
            print(f"\n  Science pages {s+1}–{e}:")
            passages = parse_science(pdf, s, e, test_id)
            apply_ak(passages, 'science', is_list=False)
            sections.append({'id': 'science', 'name': 'Science', 'timeMinutes': 35, 'passages': passages})
            total_q = sum(len(p['questions']) for p in passages)
            print(f"    {total_q} questions, {len(passages)} passages")

    test_data = {
        'id': test_id,
        'name': f'ACT Form {test_id}',
        'sections': sections,
        'scaleTable': scale_table,
    }

    out = ROOT / 'src' / 'data' / f'{test_id}.json'
    with open(out, 'w') as f:
        json.dump(test_data, f, indent=2)
    print(f"\n  ✓ Saved: {out}")
    return test_data

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 parse_test.py <pdf> <test_id>")
        sys.exit(1)
    parse_test(sys.argv[1], sys.argv[2])
