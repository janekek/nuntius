import React from "react";

export default function CustomButton({
  text,
  onClick,
}: {
  text: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      onClick={onClick}
      className="
        bg-[var(--col-primary-accent)] 
        text-white 
        font-poppins text-[18px] 
        px-[15px] py-[4px] 
        rounded-[5px] 
        shadow-[0_0_10px_#858585]
        transition-all duration-500 ease-in-out
        hover:bg-[var(--col-secondary)] 
        hover:-translate-y-[2px] 
        hover:text-[#f7f7f7]
      "
    >
      {text}
    </button>
  );
}
