"use client"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'outline';
  className?: string;
}

export default function Button({ 
  children, 
  variant = 'solid', 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors duration-200 ease-in-out";
  const variants = {
    solid: "bg-[#EE6C4D] text-white hover:bg-[#e85c3a] active:bg-[#d54e2d]",
    outline: "border-2 border-[#EE6C4D] text-[#EE6C4D] hover:bg-[#EE6C4D] hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
