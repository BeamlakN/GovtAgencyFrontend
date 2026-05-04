import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value, icon }) {
  return (
    <Card className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{value}</h2>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
          <div className="text-xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}