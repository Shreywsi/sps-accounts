export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
        bg-white
        border
        border-gray-200
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}