// components/auth/AuthHeader.tsx
import Image from 'next/image';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  logoSrc?: string;
}

export default function AuthHeader({ 
  title, 
  subtitle, 
  logoSrc = '/logo.png' // Path di public folder
}: AuthHeaderProps) {
  return (
    <div className="text-center mb-8">
      {/* Logo dengan Image component */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-16 h-16">
          <Image 
            src={logoSrc}
            alt="Zona Edukasi Logo" 
            className="object-contain"
            fill
            sizes="(max-width: 768px) 64px, 64px"
            priority
          />
        </div>
      </div>
      
      {/* Brand Name */}
      <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 dark:from-blue-400 dark:to-indigo-400">
        {title}
      </h1>
      <p className="text-gray-600 dark:text-gray-300">{subtitle}</p>
    </div>
  );
}