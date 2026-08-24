export default function StatCard({
  title,
  value,
  icon: Icon,
  onClick,
}) {

  return (
    <div
      onClick={onClick}
      className={`
      bg-white
      border
      border-gray-200
      p-5
      flex
      items-center
      justify-between
      ${onClick ? 'cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all' : ''}
      `}
    >

      <div>
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h2 className="
          mt-2
          text-2xl
          font-semibold
          text-gray-800
        ">
          {value}
        </h2>
      </div>


      <div className="
        p-3
        bg-gray-100
      ">
        <Icon
          size={26}
          className="text-gray-600"
        />
      </div>

    </div>
  );
}