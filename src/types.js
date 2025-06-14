export const MINISTRIES = {
  mass: [
    "POTF",
    "Slides / OpenLP",
    "Bells",
    "Shadow Bells",
    "Communion Usher 1",
    "Communion Usher 2",
    "AV 1",
    "AV 2",
    "Co-vestments"
  ],
  music: [
    // e.g. "Lead Singer", "Guitar", "Keyboard", ...
  ],
  outreach: [
    // e.g. "Visitor Follow-up", "Community Liaison", ...
  ],
  intercess: [
    // e.g. "Prayer Leader", "Intercessor #1", ...
  ]
};

export const MINISTRY_OPTIONS = [
  { key: "mass",     label: "Mass Ministry" },
  { key: "music",    label: "Music Ministry" },
  { key: "outreach", label: "Outreach Ministry" },
  { key: "intercess",label: "Intercess Ministry" }
];

export function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function makePerson(name) {
    return {id: makeId(), name};
}

export function makeWeek(label) {
    return {id: makeId(), label};
}