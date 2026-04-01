import { z } from "zod";
import { useEffect, useState } from "react";
import Input from "./input/Input";
import styles from "./CorrectableInput.module.css";

type CorrectableInputProps = {
  type: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onEnter?: React.KeyboardEventHandler<HTMLInputElement>;
  schema?: z.ZodTypeAny;
  onErrorChange?: (errorMsg: string) => void;
  forceShowError?: boolean;
};

export default function CorrectableInput({
  type,
  placeholder,
  value,
  onChange,
  onEnter,
  schema,
  onErrorChange,
  forceShowError,
}: CorrectableInputProps) {
  const [hasBlurred, setHasBlurred] = useState(false);

  let currentError = "";
  if (schema) {
    const result = schema.safeParse(value);
    if (!result.success) {
      currentError = result.error.issues[0]!.message;
    }
  }
  const shouldShowError = forceShowError || hasBlurred;
  const displayedError = shouldShowError ? currentError : "";

  // Elternkomponente über den echten Fehlerstatus informieren
  useEffect(() => {
    onErrorChange?.(currentError);
  }, [currentError, onErrorChange]);

  const handleBlur = () => {
    setHasBlurred(true);
  };

  return (
    <div className={styles.container}>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        {...(onEnter ? { onEnter } : {})}
      />
      {displayedError && <p className={styles.msg}>{displayedError}</p>}
    </div>
  );
}
