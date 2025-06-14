export const ROLES = [
  "POTF",
  "Slides / OpenLP",
  "Bells",
  "Shadow Bells",
  "Communion Usher 1",
  "Communion Usher 2",
  "AV 1",
  "AV 2",
  "Co-vestments"
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