// app/tryout/[id]/components/TryoutHeader.tsx

type TryoutHeaderProps = {
  timeLeft: number;
};

export default function TryoutHeader({ timeLeft }: TryoutHeaderProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex justify-between items-center mb-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white">Tryout</h1>
      <div className="bg-red-600 dark:bg-red-500 text-white px-3 py-1 rounded font-mono">
        {minutes}:{seconds < 10 ? '0' : ''}{seconds}
      </div>
    </div>
  );
}