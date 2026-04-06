export function formatSmartDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  const isTwoDaysAgo =
    date.getDate() === twoDaysAgo.getDate() &&
    date.getMonth() === twoDaysAgo.getMonth() &&
    date.getFullYear() === twoDaysAgo.getFullYear();

  const timeString = date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Heute, ${timeString}`;
  if (isYesterday) return `Gestern, ${timeString}`;
  if (isTwoDaysAgo) return `Vorgestern, ${timeString}`;

  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    const weekday = date.toLocaleDateString("de-DE", { weekday: "long" });
    return `${weekday}, ${timeString}`;
  }

  return `${date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}, ${timeString}`;
}
