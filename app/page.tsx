export default function Home() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Total Assets</h2>
          <p className="text-4xl font-bold mt-2">248</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Checked Out</h2>
          <p className="text-4xl font-bold mt-2">17</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">In Repair</h2>
          <p className="text-4xl font-bold mt-2">5</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Available</h2>
          <p className="text-4xl font-bold mt-2">226</p>
        </div>
      </div>

      <div className="mt-10 bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

        <p className="text-gray-500">
          No recent activity yet. This area will show equipment checkouts,
          maintenance updates, and inventory changes.
        </p>
      </div>
    </>
  );
}