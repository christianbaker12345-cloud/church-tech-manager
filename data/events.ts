export type Event = {
  id: string;
  name: string;
  ministry: string;
  location: string;
  day: string;
  startTime: string;
  endTime: string;
};

export const events: Event[] = [
  {
    id: "sun-9",
    name: "Sunday Worship - 9:00 AM",
    ministry: "Worship",
    location: "Main Auditorium",
    day: "Sunday",
    startTime: "09:00",
    endTime: "10:15",
  },
  {
    id: "sun-11",
    name: "Sunday Worship - 11:00 AM",
    ministry: "Worship",
    location: "Main Auditorium",
    day: "Sunday",
    startTime: "11:00",
    endTime: "12:15",
  },
  {
    id: "rehearsal",
    name: "Wednesday Rehearsal",
    ministry: "Production",
    location: "Main Auditorium",
    day: "Wednesday",
    startTime: "18:30",
    endTime: "20:30",
  },
  {
    id: "students",
    name: "Student Ministry",
    ministry: "Student Ministry",
    location: "Student Center",
    day: "Wednesday",
    startTime: "19:00",
    endTime: "20:30",
  },
  {
    id: "kids",
    name: "Kids Worship",
    ministry: "Kids",
    location: "Kids Wing",
    day: "Sunday",
    startTime: "09:00",
    endTime: "12:15",
  },
  {
    id: "creative",
    name: "Creative Team Meeting",
    ministry: "Creative",
    location: "Broadcast Control Room",
    day: "Tuesday",
    startTime: "15:00",
    endTime: "16:00",
  },
];