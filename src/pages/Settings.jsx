export default function Settings() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-2">Manage application configuration, user preferences, and agency settings.</p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">General settings</h2>
            <p className="text-sm text-slate-500 mt-1">Adjust your dashboard preferences and agency settings.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Agency name</h3>
              <p className="text-sm text-slate-600 mt-2">Update agency name, contact details, or public information.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <p className="text-sm text-slate-600 mt-2">Configure notification delivery and announcement preferences.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
