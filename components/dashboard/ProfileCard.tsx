import { InfoItem } from '@/components/common/InfoItem';

type ProfileCardProps = {
  name: string;
  role: string;
  phone: string;
  school: string;
  roleColor: 'purple' | 'green' | 'blue';
  additionalInfo?: Array<{
    icon: string;
    label: string;
    value: string;
  }>;
};

export function ProfileCard({ 
  name, 
  role, 
  phone, 
  school, 
  roleColor,
  additionalInfo = []
}: ProfileCardProps) {
  const colors = {
    purple: {
      gradient: 'from-purple-500 to-indigo-600',
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500',
    },
    green: {
      gradient: 'from-green-500 to-emerald-600',
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500',
    },
    blue: {
      gradient: 'from-blue-500 to-cyan-600',
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500',
    },
  };

  const color = colors[roleColor];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full bg-linear-to-br ${color.gradient} flex items-center justify-center text-white text-xl font-bold`}>
          {name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {role}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoItem icon="📱" label="No HP" value={phone} />
        <InfoItem icon="🏫" label="Sekolah" value={school} />
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Akses</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${color.bg} rounded-full animate-pulse`}></div>
            <p className={`font-medium ${color.text}`}>{role}</p>
          </div>
        </div>
        {additionalInfo.map((info, index) => (
          <InfoItem key={index} {...info} />
        ))}
      </div>
    </div>
  );
}