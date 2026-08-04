export type Location = {
  id: string;
  name: string;
  building: string;
  description: string;
};

export const locations: Location[] = [
  {
    id: "foh",
    name: "Front of House",
    building: "Main Auditorium",
    description: "Audio, lighting, and video control positions.",
  },
  {
    id: "stage",
    name: "Main Stage",
    building: "Main Auditorium",
    description: "Primary worship platform.",
  },
  {
    id: "audio-storage",
    name: "Audio Storage",
    building: "Production",
    description: "Wireless microphones, cables, and audio accessories.",
  },
  {
    id: "video-storage",
    name: "Video Storage",
    building: "Production",
    description: "Cameras, tripods, lenses, and accessories.",
  },
  {
    id: "lighting-storage",
    name: "Lighting Storage",
    building: "Production",
    description: "Lighting fixtures, DMX gear, and power distribution.",
  },
  {
    id: "broadcast",
    name: "Broadcast Control Room",
    building: "Production",
    description: "Livestream, recording, and media production.",
  },
  {
    id: "music-storage",
    name: "Music Storage",
    building: "Production",
    description: "Instruments, amplifiers, and pedalboards.",
  },
  {
    id: "rack-room",
    name: "Rack Room",
    building: "Production",
    description: "Network racks, UPS systems, and infrastructure.",
  },
  {
    id: "student-center",
    name: "Student Center",
    building: "Student Ministry",
    description: "Equipment assigned to student ministry.",
  },
  {
    id: "kids-wing",
    name: "Kids Wing",
    building: "Children's Ministry",
    description: "Equipment used by children's ministry.",
  },
];