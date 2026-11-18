import { formatDay } from './dates';

// The list must already be sorted: consecutive appointments on the same day share a section
export function groupByDay(appointments) {
  const sections = [];

  appointments.forEach((appointment) => {
    const title = formatDay(appointment.startsAt);
    const last = sections[sections.length - 1];

    if (last && last.title === title) {
      last.data.push(appointment);
    } else {
      sections.push({ title, data: [appointment] });
    }
  });

  return sections;
}
