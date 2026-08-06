export default function Button({
  children,
  onClick,
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="
        bg-blue-600
        hover:bg-blue-700
        text-white
        px-4
        py-2
        text-sm
        font-medium
        transition
      "
    >
      {children}
    </button>
  );
}