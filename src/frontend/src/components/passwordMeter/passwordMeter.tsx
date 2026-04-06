import styles from "./passwordMeter.module.css";

export default function PasswordMeter({ password }: { password: string }) {
  const calculateStrength = (pw: string) => {
    if (!pw) return 0;
    let strength = 0;
    if (pw.length >= 8) strength += 1;
    if (pw.match(/[A-Z]/)) strength += 1;
    if (pw.match(/[0-9]/)) strength += 1;
    if (pw.match(/[^a-zA-Z0-9]/)) strength += 1;
    return strength;
  };

  const strength = calculateStrength(password);
  const colors = [
    "transparent",
    "var(--col-warning)",
    "#d25f27",
    "var(--col-primary-accent)",
    "var(--col-secondary)",
  ];

  return (
    <div className={styles.meterContainer}>
      <div
        className={styles.meterBar}
        style={{
          width: `${strength === 0 ? 100 : (strength / 4) * 100}%`,
          backgroundColor:
            strength === 0 ? "rgba(255,255,255,0.1)" : colors[strength],
        }}
      />
    </div>
  );
}
