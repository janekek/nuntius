import Input from "./Input"
import styles from "./CorrectableInput.module.css";

export default function CorrectableInput({ type, placeholder, value, onChange, msg, displayMsg }) {
    return(
        <>
        <div className={styles.container}>
            <Input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            {displayMsg && <p className={styles.msg}>{msg}</p>}
        </div>
            
        </>
        
    );
}