
// "Carlos Guerra" -> "Carlos G."
export function publicName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : parts[0];
}

export const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  isVisible: true,
  createdAt: true,
  clientId: true,
  client: { select: { name: true } },
  barber: { select: { id: true, name: true } },
  appointment: { select: { serviceName: true } },
};

// What the app receives. The admin sees full names; everyone else sees the short form.
export function toDto(review, viewerId, { fullName = false } = {}) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    isVisible: review.isVisible,
    createdAt: review.createdAt,
    authorName: fullName ? review.client.name : publicName(review.client.name),
    barberName: review.barber.name,
    serviceName: review.appointment.serviceName,
    isMine: review.clientId === viewerId,
  };
}
