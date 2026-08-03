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
    width=12.25,            # D  closure of south + north chains; +/-0.75

    # south wall, west -> east: [sw stub][WC door][switch stub][entry][stub][tub deck]
    sw_stub=0.70,           # E  SW corner -> WC door west jamb (IMG_9308)
    wc_door=3.00,           # given by owner
    switch_stub=1.30,       # M/E switch-bank wall between WC door and entry (IMG_9299/9308)
    entry_opening=2.70,     # M  2.7 +/- 0.15 (33"), double door, two leaves

    # water closet niche behind south wall (under stairs)
    wc_inner_depth=4.50,    # E
    wc_inner_width=3.60,    # E

    # west wall, south -> north: [stub][his closet door][stub][his vanity][corner desk]
    his_closet_stub=0.70,   # E  SW corner -> closet door south jamb
    his_closet_door=2.40,   # M-partial (>=1.7 seen; std door assumed)
    closet_to_vanity=0.88,  # M  casing + wall sliver + return pilaster
    his_vanity_len=2.80,    # M  along west wall
    his_vanity_depth=1.85,  # E  22" standard; front faces EAST (IMG_9309)

    # corner makeup desk: diagonal front across the NW corner
    desk_diag_end_wx=3.25,  # D  where desk front meets her vanity west end
    her_front_wy=9.60,      # M? her/desk kick lands near row 10 (IMG_9297); depth ~17"

    # her vanity (north wall, front faces south)
    her_vanity_len=2.50,    # M  2.2-3.0
    her_vanity_depth=1.40,  # E  17" compact (kick near row 10)

    her_wall_seg=0.60,      # M  7.1"
    casing=0.40,            # M  4.8"
    her_closet_door=2.70,   # M  2.63-3.08 (34")

    shower_gap=0.15,        # M  casing -> glass plane
    shower_depth=3.40,      # M/E glass front = door 2.2 + panel ~1.2 (N-S, faces west)

    # tub deck along east wall
    deck_gap=0.50,          # E  entry right jamb -> deck west face
    tub_deck_north_wy=4.00, # M  deck north base corner on row 4

    # heights (tile units)
    h_ceiling=10.0, h_vanity_his=3.10, h_vanity_her=2.90, h_bar=3.50,
    h_desk=2.50, h_tub_deck=1.70, h_shower=8.00, h_door=8.00,
)


def build():
    W, D = P['width'], P['depth']
    ej0 = P['sw_stub'] + P['wc_door'] + P['switch_stub']   # entry left jamb wx
    ej1 = ej0 + P['entry_opening']
    exc = ej0 + P['entry_opening'] / 2.0

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

    wt = 0.35
    wc0 = P['sw_stub']
    wc1 = wc0 + P['wc_door']

    # south wall: [corner stub][WC door][switch stub][entry][east stub to corner]
    add('wall-south-a', 'wall', [(-wt, -wt), (wc0, -wt), (wc0, 0), (-wt, 0)], P['h_ceiling'])
    add('wall-south-b', 'wall', [(wc1, -wt), (ej0, -wt), (ej0, 0), (wc1, 0)], P['h_ceiling'],
        notes='3-gang light-switch bank on this stub, room side')
    add('wall-south-c', 'wall', [(ej1, -wt), (W + wt, -wt), (W + wt, 0), (ej1, 0)], P['h_ceiling'])
    add('wall-east', 'wall', [(W, 0), (W + wt, 0), (W + wt, D), (W, D)], P['h_ceiling'],
        notes='window with blinds above tub deck (position estimated)')
    add('wall-north', 'wall', [(-wt, D), (W + wt, D), (W + wt, D + wt), (-wt, D + wt)], P['h_ceiling'])

    # west wall: [stub][his closet door][stub+pilaster][behind his vanity to NW corner]
    hc0 = P['his_closet_stub']
    hc1 = hc0 + P['his_closet_door']
    add('wall-west-s', 'wall', [(-wt, 0), (0, 0), (0, hc0), (-wt, hc0)], P['h_ceiling'],
        notes='towel-hook rail on the room side (wraps the SW corner)')
    add('wall-west-n', 'wall', [(-wt, hc1), (0, hc1), (0, D), (-wt, D)], P['h_ceiling'],
        notes='his mirror + sconce + outlets above his vanity')

    # ---- entry
    add('entry-door', 'door', [(ej0, -0.08), (ej1, -0.08), (ej1, 0.08), (ej0, 0.08)], P['h_door'],
        label="entry 2'8\" dbl",
        notes='double door, two ~16.5" leaves, opens toward bedroom; threshold on a grout row = Y origin')

    # ---- water closet (niche behind south wall, under stairs)
    wcw, wcd = P['wc_inner_width'], P['wc_inner_depth']
    wcx0 = wc0 - (wcw - P['wc_door']) / 2.0
    add('water-closet', 'closet', [(wcx0, -wcd), (wcx0 + wcw, -wcd), (wcx0 + wcw, 0), (wcx0, 0)],
        P['h_ceiling'], label='WC', estimated=True,
        notes='tiled floor; sloped under-stair ceiling dropping toward the back; wall cabinet above toilet')
    add('wc-door', 'door', [(wc0, -0.08), (wc1, -0.08), (wc1, 0.08), (wc0, 0.08)], P['h_door'],
        label="WC door 3'0\"",
        notes='swings OUT into the bathroom toward the vanity (open leaf seen in IMG_9298/9300/9301/9308)')
    add('toilet', 'fixture', [(wcx0 + wcw / 2 - 0.85, -wcd + 0.1), (wcx0 + wcw / 2 + 0.85, -wcd + 0.1),
                              (wcx0 + wcw / 2 + 0.85, -wcd + 2.4), (wcx0 + wcw / 2 - 0.85, -wcd + 2.4)],
        2.6, label='toilet', estimated=True, notes='bidet seat; squatty stool; faces the door')

    # ---- his closet (walk-in behind west wall, door near SW corner)
    add('his-closet', 'closet', [(-4.5, hc0 - 0.6), (0, hc0 - 0.6), (0, hc1 + 1.2), (-4.5, hc1 + 1.2)],
        P['h_ceiling'], label='his closet', estimated=True,
        notes='walk-in, carpet, rod + hat shelf, interior extends west/southwest (IMG_9309); size unmeasured')
    add('his-closet-door', 'opening', [(-0.08, hc0), (0.08, hc0), (0.08, hc1), (-0.08, hc1)],
        P['h_door'], label='his closet door', estimated=True,
        notes='opening >=1.7 measured along sill, 2.4 assumed; directly LEFT of his sink position')

    # ---- his vanity (west wall, front faces EAST)
    hv0 = hc1 + P['closet_to_vanity']
    hv1 = hv0 + P['his_vanity_len']
    hd = P['his_vanity_depth']
    add('his-vanity', 'vanity', [(0, hv0), (hd, hv0), (hd, hv1), (0, hv1)], P['h_vanity_his'],
        label='his vanity',
        notes='front faces EAST; sink + raised granite return at south end; mirror on west wall; taller than hers')

    # ---- corner makeup desk: diagonal front across the NW corner
    dk_e = P['desk_diag_end_wx']
    add('makeup-desk', 'vanity',
        [(0, hv1), (hd, hv1), (dk_e, P['her_front_wy']), (dk_e, D), (0, D)],
        P['h_desk'], label='makeup desk', estimated=True,
        notes='low counter, kneehole + chair on the diagonal, drawer; 45-deg corner mirror on wall facet above; granite steps down from his counter')

    # ---- her vanity (north wall, front faces SOUTH)
    her0 = dk_e
    her1 = her0 + P['her_vanity_len']
    add('her-vanity', 'vanity', [(her0, P['her_front_wy']), (her1, P['her_front_wy']),
                                 (her1, D), (her0, D)], P['h_vanity_her'],
        label='her vanity', estimated=True,
        notes='front faces SOUTH; single sink; mirror + 4-light sconce; kick lands near tile row 10; depth needs confirmation')

    # ---- her closet (north wall)
    c0 = her1 + P['her_wall_seg'] + P['casing']
    c1 = c0 + P['her_closet_door']
    add('her-closet-door', 'opening', [(c0, D - 0.08), (c1, D - 0.08), (c1, D + 0.08), (c0, D + 0.08)],
        P['h_door'], label='her closet door',
        notes='open doorway, door leaf parks inside; carpet sill; shower door parks across it when open')
    add('her-closet', 'closet', [(c0 - 1.0, D), (c1 + 1.0, D), (c1 + 1.0, D + 5.0), (c0 - 1.0, D + 5.0)],
        P['h_ceiling'], label='her closet', estimated=True,
        notes='walk-in, carpet, hat shelf; interior unmeasured - nominal 5 ft box')

    # ---- shower (NE corner; glass front faces WEST)
    sg = c1 + P['casing'] + P['shower_gap']
    add('shower', 'shower', [(sg, D - P['shower_depth']), (W, D - P['shower_depth']), (W, D), (sg, D)],
        P['h_shower'], label='shower', estimated=True,
        notes='N-S glass front FACING WEST: frameless hinged door (north, ~2.2t) + fixed panel (~1.2t); low tiled curb; brown tile + mosaic band; plumbing on east wall')

    # ---- tub deck (SE, along east wall)
    tw = ej1 + P['deck_gap']
    tn = P['tub_deck_north_wy']
    add('tub-deck', 'tub', [(tw, 0), (W, 0), (W, tn), (tw, tn)], P['h_tub_deck'],
        label='tub deck', estimated=True,
        notes='white-paneled platform, tile top, drop-in garden tub; window above; south extent hidden behind open entry leaf - assumed to reach south wall')
    add('tub-basin', 'fixture', [(tw + 0.4, 0.4), (W - 0.4, 0.4), (W - 0.4, tn - 0.4), (tw + 0.4, tn - 0.4)],
        1.55, label='tub', estimated=True, notes='faucet at NW deck corner')

    return dict(
        title='Master bathroom - tile-derived plan (1 unit = 12" tile)',
        convention=dict(origin='center of entry door threshold from bedroom',
                        x='+X to the RIGHT walking in', y='+Y INTO the room', z='+Z up',
                        unit='1.0 = one 12in x 12in floor tile'),
        derived_from='photos/IMG_9297..9301 + IMG_9308/9309 grout-line counting (7 of 49 photos); '
                     'threshold coincides with a grout row',
        elements=els,
        params=P,
    )


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'layout.json')
    with open(out, 'w') as f:
        json.dump(build(), f, indent=1)
    print('wrote', out)
