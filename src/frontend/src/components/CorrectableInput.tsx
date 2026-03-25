import Input from "./Input";
import styles from "./CorrectableInput.module.css";

type CorrectableInputProps = {
  type: string;
  placeholder: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  msg: string;
  displayMsg: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

export default function CorrectableInput({
  type,
  placeholder,
  value,
  onChange,
  msg,
  displayMsg,
  onKeyDown,
}: CorrectableInputProps) {
  return (
    <div className={styles.container}>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...(onKeyDown ? { onKeyDown } : {})}
      />
      {displayMsg && <p className={styles.msg}>{msg}</p>}
    </div>
  );
}
