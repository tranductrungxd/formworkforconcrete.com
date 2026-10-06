#!/usr/bin/env python3
"""Converts the widgets of an Elementor page (extract/elementor/<id>.json) into a flat block list.

Used once, while rebuilding the content files: it prints/returns headings, rich text (as Markdown),
images and background-image sections in document order, so the copy is carried over verbatim.
"""
import json, re, sys, html as htmllib

def md_inline(h: str) -> str:
    h = h.replace('\r', '')
    h = re.sub(r'<a\s[^>]*href="([^"]+)"[^>]*>(.*?)</a>', lambda m: f'[{strip_tags(m.group(2))}]({m.group(1)})', h, flags=re.S)
    h = re.sub(r'<(strong|b)>(.*?)</\1>', r'**\2**', h, flags=re.S)
    h = re.sub(r'<(em|i)>(.*?)</\1>', r'*\2*', h, flags=re.S)
    h = re.sub(r'<br\s*/?>', '  \n', h)
    return h

def strip_tags(h: str) -> str:
    return re.sub(r'<[^>]+>', '', h)

def richtext_to_md(h: str) -> str:
    h = h.replace('\r', '').replace('\u200b', '')
    # Word paste leftovers (hidden on the live page): conditional comments and <style> blocks.
    h = re.sub(r'<!--.*?-->', '', h, flags=re.S)
    h = re.sub(r'<style\b.*?</style>', '', h, flags=re.S)
    # A paragraph that is only Word style rules (no tags left around it) is dropped as well.
    h = re.sub(r'(?:^|\n)\s*Normal\s+0\s+false.*?\}\s*(?=\n|$)', '', h, flags=re.S)
    out = []
    # lists
    def ul(m):
        items = re.findall(r'<li[^>]*>(.*?)</li>', m.group(0), flags=re.S)
        ordered = m.group(0).lstrip().startswith('<ol')
        out = []
        for i, it in enumerate(items):
            bullet = f'{i+1}. ' if ordered else '- '
            # An item can hold several <p>: the first is the item text, the others stay inside the item (indented).
            paras = re.findall(r'<p[^>]*>(.*?)</p>', it, flags=re.S) or [it]
            text = clean(md_inline(paras[0]))
            # \x00 keeps the blank line inside the item from splitting the list into paragraphs; it is removed at the end.
            rest = ''.join('\n\x00\n' + ' ' * len(bullet) + clean(md_inline(p)) for p in paras[1:])
            out.append(bullet + text + rest)
        return '\n\n' + '\n'.join(out) + '\n\n'
    h = re.sub(r'<(ul|ol)[^>]*>.*?</\1>', ul, h, flags=re.S)
    h = re.sub(r'<h([1-6])[^>]*>(.*?)</h\1>', lambda m: '\n\n' + '#' * int(m.group(1)) + ' ' + clean(strip_tags(m.group(2))) + '\n\n', h, flags=re.S)
    h = re.sub(r'<p[^>]*>(.*?)</p>', lambda m: '\n\n' + md_inline(m.group(1)) + '\n\n', h, flags=re.S)
    h = md_inline(h)
    h = strip_tags(h)
    h = htmllib.unescape(h)
    paras = [clean(p) if not re.match(r'\s*(#|- |\d+\. )', p) else p.strip() for p in re.split(r'\n\s*\n', h)]
    return '\n\n'.join(p for p in paras if p).replace('\x00', '')

def clean(s: str) -> str:
    return re.sub(r'[ \t]+', ' ', htmllib.unescape(strip_tags(s))).strip() if '[' not in s and '**' not in s else re.sub(r'[ \t]+', ' ', htmllib.unescape(s)).strip()

def walk(el, out, depth=0):
    s = el.get('settings') or {}
    w = el.get('widgetType')
    if el.get('elType') != 'widget':
        bg = (s.get('background_image') or {}).get('url') or (s.get('background_overlay_image') or {}).get('url')
        if bg: out.append(('bg', bg, depth))
    if w == 'heading':
        out.append(('heading', s.get('title', ''), s.get('header_size', 'h2'), (s.get('link') or {}).get('url', '')))
    elif w == 'text-editor':
        out.append(('text', richtext_to_md(s.get('editor', ''))))
    elif w == 'image':
        img = s.get('image') or {}
        out.append(('image', img.get('url', ''), img.get('alt', ''), (s.get('link') or {}).get('url', '')))
    elif w in ('button',):
        out.append(('button', s.get('text', ''), (s.get('link') or {}).get('url', '')))
    elif w == 'call-to-action':
        out.append(('cta', s.get('title', ''), strip_tags(s.get('description', '')), (s.get('link') or {}).get('url', ''), (s.get('bg_image') or {}).get('url', '')))
    elif w == 'icon-list':
        out.append(('label', ' / '.join(i.get('text', '') for i in s.get('icon_list', []))))
    elif w == 'toggle':
        out.append(('toggle', [(t.get('tab_title'), strip_tags(t.get('tab_content', ''))) for t in s.get('tabs', [])]))
    for c in el.get('elements', []):
        walk(c, out, depth + 1)

def blocks(path):
    out = []
    for e in json.load(open(path)):
        walk(e, out)
    return out

if __name__ == '__main__':
    for b in blocks(sys.argv[1]):
        print(b)
