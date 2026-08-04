export type Volunteer = {
  id: string;
  firstName: string;
  lastName: string;
  ministry: string;
  role: string;
};

export const volunteers: Volunteer[] = [
  {
    id: "v001",
    firstName: "Josh",
    lastName: "Miller",
    ministry: "Production",
    role: "Audio Engineer",
  },
  {
    id: "v002",
    firstName: "Sarah",
    lastName: "Wilson",
    ministry: "Production",
    role: "Lighting Operator",
  },
  {
    id: "v003",
    firstName: "David",
    lastName: "Thomas",
    ministry: "Broadcast",
    role: "Camera Operator",
  },
  {
    id: "v004",
    firstName: "Emily",
    lastName: "Johnson",
    ministry: "Creative",
    role: "Photographer",
  },
  {
    id: "v005",
    firstName: "Nathan",
    lastName: "Brown",
    ministry: "Worship",
    role: "Keyboard",
  },
  {
    id: "v006",
    firstName: "Rachel",
    lastName: "Davis",
    ministry: "Worship",
    role: "Vocals",
  },
];