#!/usr/bin/env python3
"""Render a 2D top-down plan view from layout.json.

Single source of truth is layout.json — this script only draws it.
Convention (fixed): origin = center of entry threshold, +X right walking in,
+Y into the room, 1 unit = one 12" floor tile. Screen mapping: +X -> right,
+Y -> UP (so the far/north wall is at the top, entry at the bottom).

Usage: python3 render_plan.py [--out plan.png] [--scale 90]
"""
import json
import argparse
import os
from PIL import Image, ImageDraw, ImageFont

TYPE_STYLE = {
    'wall':     dict(fill=(60, 60, 60),    outline=(20, 20, 20)),
    'door':     dict(fill=(255, 255, 255), outline=(120, 80, 40)),
    'opening':  dict(fill=(245, 240, 230), outline=(120, 80, 40)),
    'vanity':   dict(fill=(200, 215, 235), outline=(60, 90, 140)),
    'fixture':  dict(fill=(215, 235, 215), outline=(70, 130, 70)),
    'tub':      dict(fill=(210, 230, 245), outline=(60, 110, 160)),
    'shower':   dict(fill=(230, 220, 240), outline=(110, 70, 150)),
    'closet':   dict(fill=(240, 230, 210), outline=(150, 110, 60)),
    'room':     dict(fill=(250, 247, 242), outline=(40, 40, 40)),
}
DEFAULT_STYLE = dict(fill=(225, 225, 225), outline=(90, 90, 90))


def ft_in(tiles):
    inches = round(tiles * 12)
    return f"{inches // 12}'{inches % 12}\""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--layout', default=os.path.join(os.path.dirname(__file__), 'layout.json'))
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), 'plan.png'))
    ap.add_argument('--scale', type=int, default=90, help='pixels per tile unit')
    args = ap.parse_args()

    with open(args.layout) as f:
        layout = json.load(f)

    els = layout['elements']
    xs = [c[0] for e in els for c in e['footprint']]
    ys = [c[1] for e in els for c in e['footprint']]
    pad = 1.6
    x0, x1 = min(xs) - pad, max(xs) + pad
    y0, y1 = min(ys) - pad, max(ys) + pad
    S = args.scale
    W, H = int((x1 - x0) * S), int((y1 - y0) * S)

    def P(pt):
        return ((pt[0] - x0) * S, (y1 - pt[1]) * S)  # +Y up

    img = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
        fbig = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
        fsm = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
    except OSError:
        font = fbig = fsm = ImageFont.load_default()

    # tile grid (1 unit = 12") across the room interior, if a room element exists
    room = next((e for e in els if e['type'] == 'room'), None)
    if room:
        rxs = [c[0] for c in room['footprint']]
        rys = [c[1] for c in room['footprint']]
        d.polygon([P(c) for c in room['footprint']], **TYPE_STYLE['room'])
        gx = int(min(rxs)) - 1
        while gx <= max(rxs) + 1:
            if min(rxs) <= gx <= max(rxs):
                d.line([P((gx, min(rys))), P((gx, max(rys)))], fill=(225, 218, 205), width=1)
            gx += 1
        gy = int(min(rys)) - 1
        while gy <= max(rys) + 1:
            if min(rys) <= gy <= max(rys):
                d.line([P((min(rxs), gy)), P((max(rxs), gy))], fill=(225, 218, 205), width=1)
            gy += 1
        d.polygon([P(c) for c in room['footprint']], outline=TYPE_STYLE['room']['outline'])

    order = {'room': 0, 'wall': 1, 'closet': 2, 'opening': 3, 'door': 6}
    for e in sorted((e for e in els if e['type'] != 'room'), key=lambda e: order.get(e['type'], 4)):
        style = TYPE_STYLE.get(e['type'], DEFAULT_STYLE)
        pts = [P(c) for c in e['footprint']]
        if len(pts) >= 3:
            d.polygon(pts, fill=style['fill'], outline=style['outline'])
        else:
            d.line(pts, fill=style['outline'], width=4)
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        label = e.get('label', e['name'])
        est = ' *' if e.get('estimated') else ''
        tw = d.textlength(label, font=fsm)
        d.text((cx - tw / 2, cy - 8), label + est, fill=(30, 30, 30), font=fsm)

    # entry arrow at origin
    o = P((0, 0))
    d.line([(o[0], o[1] + 40), (o[0], o[1] - 10)], fill=(200, 30, 30), width=3)
    d.polygon([(o[0] - 7, o[1] - 8), (o[0] + 7, o[1] - 8), (o[0], o[1] - 22)], fill=(200, 30, 30))
    d.text((o[0] + 10, o[1] + 14), 'entry (0,0)  +Y ->into room', fill=(200, 30, 30), font=font)

    # scale bar: 3 tiles = 3 ft
    bx, by = 30, H - 46
    d.line([(bx, by), (bx + 3 * S, by)], fill=(0, 0, 0), width=3)
    for i in range(4):
        d.line([(bx + i * S, by - 6), (bx + i * S, by + 6)], fill=(0, 0, 0), width=2)
    d.text((bx, by + 10), "3 tiles = 3'0\"   (* = estimated)", fill=(0, 0, 0), font=font)
    d.text((30, 20), layout.get('title', 'Bathroom plan'), fill=(0, 0, 0), font=fbig)

    img.save(args.out)
    print(f'wrote {args.out} ({W}x{H})')


if __name__ == '__main__':
    main()
