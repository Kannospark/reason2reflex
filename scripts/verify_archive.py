#!/usr/bin/env python3
"""Check the research archive. No robot training or external dependencies."""
from pathlib import Path
import hashlib
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
errors = []
manifest = ROOT / 'MANIFEST.sha256'
if not manifest.exists():
    errors.append('Missing MANIFEST.sha256')
else:
    listed = set()
    for line in manifest.read_text().splitlines():
        expected, relative = line.split('  ', 1)
        path = ROOT / relative
        listed.add(relative)
        if not path.is_file():
            errors.append(f'Missing file: {relative}')
        elif hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            errors.append(f'Hash mismatch: {relative}')
    actual = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*')
              if p.is_file() and '.git' not in p.relative_to(ROOT).parts
              and '__pycache__' not in p.relative_to(ROOT).parts
              and p.name != 'MANIFEST.sha256'}
    for extra in sorted(actual - listed):
        errors.append(f'Unlisted file: {extra}')

zip_count = 0
slide_count = 0
for path in sorted(ROOT.rglob('*')):
    if path.suffix not in {'.zip', '.pptx'}:
        continue
    zip_count += 1
    with zipfile.ZipFile(path) as archive:
        bad = archive.testzip()
        if bad:
            errors.append(f'Corrupt ZIP member: {path.name}: {bad}')
        if path.suffix == '.pptx':
            slides = [n for n in archive.namelist()
                      if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)]
            slide_count += len(slides)
            native_shapes = sum(len(ET.fromstring(archive.read(n)).findall(
                './/{http://schemas.openxmlformats.org/presentationml/2006/main}sp'))
                for n in slides)
            if native_shapes == 0:
                errors.append(f'No native editable shapes found: {path.name}')

# Raw dialogue retains original app/local links by design; only check current docs.
md_files = [ROOT / 'README.md', *sorted((ROOT / 'docs').glob('*.md')),
            ROOT / 'archive/v1/README.md']
link_count = 0
for path in md_files:
    for target in re.findall(r'!?\[[^\]]*\]\(([^\s)]+)\)', path.read_text()):
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target) or target.startswith('#'):
            continue
        link_count += 1
        if not (path.parent / target.split('#', 1)[0]).exists():
            errors.append(f'Broken local link: {path.relative_to(ROOT)} -> {target}')

if errors:
    print('\n'.join(errors), file=sys.stderr)
    raise SystemExit(1)
print(f'OK: {len(listed)} manifest entries; {zip_count} ZIP/PPTX files; '
      f'{slide_count} editable slides; {link_count} current local links.')
