// cameras.js — named viewpoints for the master-bathroom scene.
//
// COORDINATES: layout.json convention (NOT three.js native):
//   origin = center of entry door threshold, +X right walking in,
//   +Y into the room, +Z up, 1 unit = one 12" floor tile.
// scene.jsx is responsible for mapping layout coords -> three.js
// (e.g. three.position.set(x, z, -y) for Y-up three scenes).
//
// Each view stands where a person would actually stand (eye height 5.2 = 62")
// and looks at the fixture. "room-center" is the DEFAULT view: scene.jsx
// auto-frames the whole bathroom; the values here are its fallback pose.
//
// Room extents in these coords: west wall X=-6.35, east wall X=+5.90,
// entry threshold Y=0, north wall Y=11.

const EYE = 5.2;

export const cameras = {
  // default — scene.jsx should auto-frame the full room; fallback pose:
  'room-center': {
    position: [-0.5, 4.5, EYE],
    target: [-1.5, 9.5, 3.0],
    default: true,
    autoFrame: true,
  },

  // standing in the walkway at his sink, looking WEST into his mirror
  'his-vanity': {
    position: [-2.85, 5.4, EYE],
    target: [-6.15, 5.4, 4.2],
  },

  // standing in front of her sink, looking north into her mirror
  'her-vanity': {
    position: [-1.85, 6.7, EYE],
    target: [-1.85, 10.6, 4.0],
  },

  // standing mid-room facing the shower's west-facing glass front
  'shower': {
    position: [1.4, 9.3, EYE],
    target: [4.6, 9.5, 3.2],
  },

  // standing mid-room, looking southeast at the garden tub + window wall
  'tub': {
    position: [-0.6, 3.5, EYE],
    target: [3.9, 1.9, 1.8],
  },

  // standing at his sink, turned LEFT (south) toward his closet door
  'his-closet': {
    position: [-3.75, 5.0, EYE],
    target: [-6.3, 1.9, 4.0],
  },

  // standing at her closet doorway center, looking north into the closet
  'her-closet-center': {
    position: [1.75, 8.8, EYE],
    target: [1.75, 13.5, 3.8],
  },
};

export default cameras;
