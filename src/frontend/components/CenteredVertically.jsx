export default function CenteredVertically({content}) {
    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            {content}
        </div>
    );
}