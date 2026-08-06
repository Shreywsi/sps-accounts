export default function StatCard({
  title,
  value,
  icon: Icon,
}) {

  return (
    <div
      className="
      bg-white
      border
      border-gray-200
      p-5
      flex
      items-center
      justify-between
      "
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