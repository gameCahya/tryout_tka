type InfoItemProps = {
  icon: string;
  label: string;
  value: string | number;
};

export function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}