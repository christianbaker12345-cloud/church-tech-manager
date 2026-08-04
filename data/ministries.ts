export type Ministry = {
  id: string;
  name: string;
  leader: string;
  color: string;
  description: string;
};

export const ministries: Ministry[] = [
  {
    id: "worship",
    name: "Worship",
    leader: "Worship Pastor",
    color: "#2563eb",
    description: "Weekend worship services and rehearsals.",
  },
  {
    id: "production",
    name: "Production",
    leader: "Production Director",
    color: "#7c3aed",
    description: "Audio, video, lighting, and broadcast.",
  },
  {
    id: "broadcast",
    name: "Broadcast",
    leader: "Broadcast Director",
    color: "#0891b2",
    description: "Livestream and video production.",
  },
  {
    id: "students",
    name: "Student Ministry",
    leader: "Student Pastor",
    color: "#ea580c",
    description: "Weekly student services and events.",
  },
  {
    id: "kids",
    name: "Kids Ministry",
    leader: "Children's Director",
    color: "#16a34a",
    description: "Children's classrooms and worship.",
  },
  {
    id: "creative",
    name: "Creative",
    leader: "Creative Director",
    color: "#db2777",
    description: "Photography, graphics, and media.",
  },
  {
    id: "communications",
    name: "Communications",
    leader: "Communications Director",
    color: "#0f766e",
    description: "Social media, website, and announcements.",
  }
];