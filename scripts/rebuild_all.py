#!/usr/bin/env python3
"""Rebuild every ACT form from PDFs and refuse to finish with invalid data."""

import json
import re
import sys
from pathlib import Path

from parse_test import parse_test
from render_math import main as render_math
from render_sections import main as render_sections

ROOT = Path(__file__).resolve().parents[1]
PDF_ROOT = ROOT.parent
FORMS = [
    ('ACT 2025 Form J08.pdf', 'J08'),
    ('ACT June 2023 Form F12.pdf', 'F12'),
    ('ACT 2023 Form G01.pdf', 'G01'),
    ('ACT Dec 2022 Form F07.pdf', 'F07'),
    ('ACT Form G20 2024.pdf', 'G20'),
    ('ACT G19 April 2024.pdf', 'G19'),
    ('ACT Test Info H11 Sept 2024.pdf', 'H11'),
    ('ACT Test Info H31 Dec 2024.pdf', 'H31'),
    ('F11 April 2023 Form.pdf', 'F11'),
    ('ACT 2022 E25.pdf', 'E25'),
    ('ACT 2022 Z08.pdf', 'Z08'),
    ('ACT Form D06 2021.pdf', 'D06'),
    ('ACT June 2022 E26.pdf', 'E26'),
]
JUNK_RE = re.compile(
    r'END OF TEST|GO ON TO THE NEXT PAGE|DO NOT TURN THE PAGE|'
    r'Question \d+ asks about the preceding passage as a whole',
    re.IGNORECASE,
)

def questions_for(section):
    return [q for p in section.get('passages', []) for q in p.get('questions', [])] + section.get('questions', [])

def validate_form(test_id):
    path = ROOT / 'src' / 'data' / f'{test_id}.json'
    data = json.loads(path.read_text())
    errors = []

    for section in data['sections']:
        sid = section['id']
        if sid not in {'english', 'math', 'reading'}:
            continue
        qs = questions_for(section)
        if not qs:
            errors.append(f'{sid}: no questions')
            continue
        nums = [q['number'] for q in qs]
        expected = set(range(1, max(nums) + 1))
        missing = sorted(expected - set(nums))
        if missing:
            errors.append(f'{sid}: missing {missing}')
        if len(nums) != len(set(nums)):
            errors.append(f'{sid}: duplicate numbers')

        if sid in {'english', 'reading'}:
            wrong = [q['number'] for q in qs if len(q.get('choices', {})) != 4]
            if wrong:
                errors.append(f'{sid}: invalid choice count {wrong}')

        if sid in {'english', 'math'}:
            no_images = [q['number'] for q in qs if not q.get('imageSrc')]
            if no_images:
                errors.append(f'{sid}: missing imageSrc {no_images[:10]}')
        if sid == 'reading':
            no_passage_images = [p.get('id', '?') for p in section.get('passages', []) if not p.get('imageSrc')]
            if no_passage_images:
                errors.append(f'{sid}: missing passage imageSrc {no_passage_images}')

        junk = [
            q['number']
            for q in qs
            if any(JUNK_RE.search(str(text)) for text in q.get('choices', {}).values())
        ]
        if junk:
            errors.append(f'{sid}: junk in choices {junk}')

    return errors

def rebuild_one(pdf_name, test_id):
    pdf_path = PDF_ROOT / pdf_name
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)
    print(f'\n=== {test_id} ===')
    parse_test(pdf_path, test_id)
    json_path = ROOT / 'src' / 'data' / f'{test_id}.json'
    render_math(pdf_path, test_id, json_path)
    render_sections(pdf_path, test_id, json_path)
    errors = validate_form(test_id)
    if errors:
        raise RuntimeError(f'{test_id} failed validation: ' + '; '.join(errors))
    print(f'✓ {test_id} valid')

def main():
    forms = FORMS
    if len(sys.argv) > 1:
        requested = set(sys.argv[1:])
        forms = [form for form in FORMS if form[1] in requested]
        unknown = requested - {test_id for _, test_id in FORMS}
        if unknown:
            raise SystemExit(f'Unknown form ids: {", ".join(sorted(unknown))}')
    for pdf_name, test_id in forms:
        rebuild_one(pdf_name, test_id)
    print(f'\n✓ rebuilt {len(forms)} form(s)')

if __name__ == '__main__':
    main()
