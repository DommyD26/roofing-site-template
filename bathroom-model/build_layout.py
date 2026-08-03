#!/usr/bin/env python3
"""Build layout.json from measured tile-count parameters.

All parameters are in TILE UNITS (1 unit = one 12" floor tile).
Internal working frame: wx = distance east of the WEST wall face,
wy = distance north of the threshold/south wall plane.
Published frame (the fixed convention in layout.json):
  origin (0,0) = CENTER of the entry door threshold
  +X = to the right walking in  (== +wx direction)
  +Y = into the room            (== +wy direction)
  +Z = up
So X = wx - ENTRY_CENTER_WX, Y = wy.

tag: how each parameter was obtained
  M  = measured by tile-grout counting in the photos
  D  = derived from measured runs (sums/closure)
  E  = estimated (flagged in OPEN QUESTIONS; refine with more photos)
"""
import json
import os

P = dict(
    # room shell
    depth=11.00,            # M  threshold -> north wall (11 tile rows, IMG_9297)
    width=15.40,            # D  sum of north-run segments; +/-0.6

    # entry (south wall, near its east end)
    entry_left_jamb_wx=8.95,   # D  width - 6.45 (opening+stub+deck closure)
    entry_opening=2.70,        # M  2.7 +/- 0.15 (33"), double door, 2 leaves

    # water closet: door in SOUTH wall directly left of entry; niche extends south (under stairs)
    wc_door_west_wx=5.25,      # D  east jamb 0.7 west of entry left jamb (switch section)
    wc_door=3.00,              # given by owner
    wc_inner_depth=4.50,       # E  niche depth southward
    wc_inner_width=3.60,       # E  niche width east-west

    # his closet: door in WEST wall
    his_closet_door_s=6.70,    # M/D north jamb 0.88 south of his vanity front zone
    his_closet_door=2.40,      # M-partial (sill >=1.7 visible; std door assumed)

    # his vanity: NW corner, front faces SOUTH
    his_vanity_len=2.80,       # M  west wall -> corner cheek
    his_vanity_depth=1.85,     # E  22" standard (front kick plane derived below)
    cheek=0.35,                # M  wall stub between vanity and desk corner

    # corner makeup desk: kneehole spans the 45-degree corner diagonally
    kneehole=2.70,             # D  closes his-run to her-run (her-side agent consistent)
    desk_depth=1.60,           # E  19" (shallower than vanities)

    # her vanity: north wall, front faces SOUTH
    her_vanity_len=2.50,       # M  2.2-3.0 (kneehole corner -> end panel)
    her_vanity_depth=1.70,     # E  20"

    her_wall_seg=0.60,         # M  end panel -> closet casing (7.1")
    casing=0.40,               # M  door casing width (4.8")
    her_closet_door=2.80,      # M  2.63-3.08 along sill (34")

    shower_gap=0.15,           # M  casing -> shower glass plane (1-2")
    shower_width=2.70,         # E  glass plane -> east wall (33"); east end never visible
    shower_depth=3.40,         # M/E glass front = door 2.2 + fixed panel ~1.2

    # tub: platform deck along east wall, SE corner
    tub_deck_west_wx=11.90,    # M/D apron plane = threshold col C + 1.5 (+/-0.3)
    tub_deck_north_wy=4.00,    # M  deck north base corner lands on row 4
    tub_deck_south_wy=0.00,    # E  assumed to meet south wall (hidden behind door leaf)

    # heights (tile units; 1 = 12")
    h_ceiling=10.0,            # E
    h_vanity_his=3.10,         # E  owner: his slightly taller (~37")
    h_vanity_her=2.90,         # E  ~35"
    h_bar=3.50,                # E  raised bar ledge on his vanity ~42"
    h_desk=2.50,               # E  makeup desk ~30"
    h_tub_deck=1.70,           # E  ~20"
    h_shower=8.00,             # E  tile walls
    h_door=8.00,               # E  door head height
)


def build():
    W, D = P['width'], P['depth']
    exc = P['entry_left_jamb_wx'] + P['entry_opening'] / 2.0

    def pt(wx, wy):
        return [round(wx - exc, 3), round(wy, 3)]

    els = []

    def add(name, typ, corners, height, z0=0.0, label=None, estimated=False, notes=None):
        e = dict(name=name, type=typ, footprint=[pt(*c) for c in corners], height=round(height, 3))
        if z0:
            e['z0'] = round(z0, 3)
        e['label'] = label or name
        if estimated:
            e['estimated'] = True
        if notes:
            e['notes'] = notes
        els.append(e)

    # ---- room shell
    add('room', 'room', [(0, 0), (W, 0), (W, D), (0, D)], P['h_ceiling'], label='master bath')

    wt = 0.35  # drawn wall thickness
    ej0 = P['entry_left_jamb_wx']
    ej1 = ej0 + P['entry_opening']
    wc0 = P['wc_door_west_wx']
    wc1 = wc0 + P['wc_door']

    # south wall pieces: [west corner..wc0][wc door][wc1..entry jamb][entry][jamb..east corner]
    add('wall-south-a', 'wall', [(-wt, -wt), (wc0, -wt), (wc0, 0), (-wt, 0)], P['h_ceiling'])
    add('wall-south-b', 'wall', [(wc1, -wt), (ej0, -wt), (ej0, 0), (wc1, 0)], P['h_ceiling'],
        notes='light-switch bank on this stub, room side')
    add('wall-south-c', 'wall', [(ej1, -wt), (W + wt, -wt), (W + wt, 0), (ej1, 0)], P['h_ceiling'])
    add('wall-east', 'wall', [(W, 0), (W + wt, 0), (W + wt, D), (W, D)], P['h_ceiling'],
        notes='window above tub deck (position estimated)')
    add('wall-north', 'wall', [(-wt, D), (W + wt, D), (W + wt, D + wt), (-wt, D + wt)], P['h_ceiling'])

    hc0, hc1 = P['his_closet_door_s'], P['his_closet_door_s'] + P['his_closet_door']
    add('wall-west-s', 'wall', [(-wt, 0), (0, 0), (0, hc0), (-wt, hc0)], P['h_ceiling'])
    add('wall-west-n', 'wall', [(-wt, hc1), (0, hc1), (0, D), (-wt, D)], P['h_ceiling'])

    # ---- entry
    add('entry-door', 'door', [(ej0, -0.08), (ej1, -0.08), (ej1, 0.08), (ej0, 0.08)], P['h_door'],
        label="entry 2'8\" dbl",
        notes='double door, two ~16.5" leaves, opens toward bedroom; threshold on a grout row = Y origin')

    # ---- water closet (niche south of south wall, under stairs)
    wcw = P['wc_inner_width']
    wcd = P['wc_inner_depth']
    wcx0 = wc0 - (wcw - P['wc_door']) / 2.0
    add('water-closet', 'closet', [(wcx0, -wcd), (wcx0 + wcw, -wcd), (wcx0 + wcw, 0), (wcx0, 0)],
        P['h_ceiling'], label='WC', estimated=True,
        notes='tiled floor; sloped under-stair ceiling dropping toward the back (south); wall cabinet above toilet')
    add('wc-door', 'door', [(wc0, -0.08), (wc1, -0.08), (wc1, 0.08), (wc0, 0.08)], P['h_door'],
        label="WC door 3'0\"", notes='hinge on west jamb, swings OUT into the bathroom (leaf seen in IMG_9298/9300/9301)')
    add('toilet', 'fixture', [(wcx0 + wcw / 2 - 0.85, -wcd + 0.1), (wcx0 + wcw / 2 + 0.85, -wcd + 0.1),
                              (wcx0 + wcw / 2 + 0.85, -wcd + 2.4), (wcx0 + wcw / 2 - 0.85, -wcd + 2.4)],
        2.6, label='toilet', estimated=True, notes='bidet seat; faces the door')

    # ---- his closet (behind west wall)
    add('his-closet', 'closet', [(-4.0, hc0 - 0.8), (0, hc0 - 0.8), (0, hc1 + 0.8), (-4.0, hc1 + 0.8)],
        P['h_ceiling'], label='his closet', estimated=True,
        notes='walk-in, carpet, hanging rods + shelves; interior size unmeasured')
    add('his-closet-door', 'opening', [(-0.08, hc0), (0.08, hc0), (0.08, hc1), (-0.08, hc1)],
        P['h_door'], label='his closet door', estimated=True,
        notes='opening measured >=1.7 tiles along sill; 2.4 assumed (near jamb hidden behind WC door leaf)')

    # ---- vanity assembly along north wall (west -> east)
    hv_front = D - P['his_vanity_depth']
    add('his-vanity', 'vanity', [(0, hv_front), (P['his_vanity_len'], hv_front),
                                 (P['his_vanity_len'], D), (0, D)], P['h_vanity_his'],
        label='his vanity',
        notes='front faces SOUTH; sink run with raised 42" bar ledge; mirror + 4-light sconce on wall above; taller than hers')

    ck0 = P['his_vanity_len']
    ck1 = ck0 + P['cheek']
    add('corner-cheek', 'wall', [(ck0, hv_front), (ck1, hv_front), (ck1, D), (ck0, D)], P['h_ceiling'],
        notes='wall stub proud of his vanity face')

    kh0 = ck1
    kh1 = kh0 + P['kneehole']
    dk_front_w = D - P['desk_depth']          # desk front at its west end
    dk_front_e = D - P['desk_depth'] - 0.60   # slightly deeper at the east end (angled ~15-20 deg)
    add('makeup-desk', 'vanity', [(kh0, dk_front_w), (kh1, dk_front_e), (kh1, D), (kh0, D)],
        P['h_desk'], label='makeup desk', estimated=True,
        notes='low counter with kneehole + chair spanning the clipped NW corner diagonally; 45-degree corner mirror on the wall facet above; drawer under counter; flanked by cabinets')

    her0 = kh1
    her1 = her0 + P['her_vanity_len']
    her_front = D - P['her_vanity_depth']
    add('her-vanity', 'vanity', [(her0, her_front), (her1, her_front), (her1, D), (her0, D)],
        P['h_vanity_her'], label='her vanity',
        notes='front faces SOUTH; single sink; mirror + 4-light sconce above; outlet on wall segment east of it')

    # ---- her closet (north wall)
    c0 = her1 + P['her_wall_seg'] + P['casing']
    c1 = c0 + P['her_closet_door']
    add('her-closet-door', 'opening', [(c0, D - 0.08), (c1, D - 0.08), (c1, D + 0.08), (c0, D + 0.08)],
        P['h_door'], label='her closet door',
        notes='open doorway with door leaf parked inside; carpet sill; hats shelf + rods inside')
    add('her-closet', 'closet', [(c0 - 1.0, D), (c1 + 1.0, D), (c1 + 1.0, D + 5.0), (c0 - 1.0, D + 5.0)],
        P['h_ceiling'], label='her closet', estimated=True,
        notes='walk-in, carpet; interior unmeasured — nominal 5 ft deep box')

    # ---- shower (NE corner; glass front faces WEST)
    sg = c1 + P['casing'] + P['shower_gap']   # glass plane wx
    add('shower', 'shower', [(sg, D - P['shower_depth']), (W, D - P['shower_depth']), (W, D), (sg, D)],
        P['h_shower'], label='shower', estimated=True,
        notes='glass front is a N-S plane FACING WEST: hinged frameless door (north, ~2.2t, parks open over her closet doorway) + fixed panel (south ~1.2t); low tiled curb under the glass; brown tile walls + mosaic band; plumbing on east wall')

    # ---- tub deck (SE, along east wall)
    tw = P['tub_deck_west_wx']
    tn = P['tub_deck_north_wy']
    ts = P['tub_deck_south_wy']
    add('tub-deck', 'tub', [(tw, ts), (W, ts), (W, tn), (tw, tn)], P['h_tub_deck'],
        label='tub deck', estimated=True,
        notes='white-paneled platform, tile top; drop-in garden tub; window with blinds above (east wall); south extent hidden behind open entry leaf in photos — assumed to reach the south wall')
    add('tub-basin', 'fixture', [(tw + 0.4, ts + 0.4), (W - 0.4, ts + 0.4), (W - 0.4, tn - 0.4), (tw + 0.4, tn - 0.4)],
        1.55, label='tub', estimated=True, notes='faucet at NW deck corner')

    return dict(
        title='Master bathroom — tile-derived plan (1 unit = 12" tile)',
        convention=dict(origin='center of entry door threshold from bedroom',
                        x='+X to the RIGHT walking in', y='+Y INTO the room', z='+Z up',
                        unit='1.0 = one 12in x 12in floor tile'),
        derived_from='photos/IMG_9297..IMG_9301 grout-line counting (5 of 49 photos); '
                     'threshold coincides with a grout row; grid column ~at entry left jamb',
        elements=els,
        params=P,
    )


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'layout.json')
    with open(out, 'w') as f:
        json.dump(build(), f, indent=1)
    print('wrote', out)
