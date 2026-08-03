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

const EYE = 5.2;

export const cameras = {
  // default — scene.jsx should auto-frame the full room; fallback pose:
  'room-center': {
    position: [-0.5, 4.6, EYE],
    target: [-1.5, 9.0, 3.0],
    default: true,
    autoFrame: true,
  },

  // standing in front of his sink, looking north into his mirror
  'his-vanity': {
    position: [-8.9, 6.3, EYE],
    target: [-8.9, 10.4, 4.0],
  },

  // standing in front of her sink, looking north into her mirror
  'her-vanity': {
    position: [-3.2, 6.4, EYE],
    target: [-3.2, 10.4, 4.0],
  },

  // standing on the walkway facing the shower's west-facing glass front
  'shower': {
    position: [0.7, 9.0, EYE],
    target: [3.6, 9.4, 3.2],
  },

  // standing mid-room, looking southeast at the garden tub + window wall
  'tub': {
    position: [-0.8, 3.2, EYE],
    target: [3.4, 1.8, 1.8],
  },

  // standing at his sink area, turned left (west) toward his closet door
  'his-closet': {
    position: [-7.5, 7.9, EYE],
    target: [-11.6, 7.9, 3.8],
  },

  // standing at her closet doorway center, looking north into the closet
  'her-closet-center': {
    position: [0.45, 9.1, EYE],
    target: [0.45, 13.6, 3.8],
  },
};

export default cameras;
