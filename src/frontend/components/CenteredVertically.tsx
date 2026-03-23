export default function CenteredVertically({
  content,
}: {
  content: React.ReactNode;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {content}
    </div>
  );
}
