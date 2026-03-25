export default function CenteredVertically({
  content,
  gap,
}: {
  content: React.ReactNode;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: gap ?? 0,
      }}
    >
      {content}
    </div>
  );
}
