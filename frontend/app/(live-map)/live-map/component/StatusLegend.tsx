// app/(live-map)/live-map/components/StatusLegend.tsx

export default function StatusLegend() {
  return (
    <div className="bg-[#0F172A] border border-white/5 rounded-lg p-3 text-xs space-y-1">
      <Item color="bg-green-400" label="Active / Moving" />
      <Item color="bg-yellow-400" label="On Trip" />
      <Item color="bg-blue-400" label="Idle (Engine On)" />
      <Item color="bg-red-400" label="Critical Alert" />
      <Item color="bg-gray-400" label="Inactive" />
    </div>
  );
}

function Item({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-300">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}
