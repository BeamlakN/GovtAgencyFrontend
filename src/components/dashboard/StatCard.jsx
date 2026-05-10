import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value, icon }) {
  return (
    <Card className="shadow-md rounded-2xl">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
        <div className="text-3xl">{icon}</div>
      </CardContent>
    </Card>
  );
}