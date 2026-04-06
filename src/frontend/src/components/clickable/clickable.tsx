export default function Clickable({
  link,
  children,
}: {
  children: React.ReactNode;
  link: string;
}) {
  return (
    <>
      <a href={link}>{children}</a>
    </>
  );
}
