// app/programme/components/ProgressBar.tsx

interface ProgressBarProps {
  progress: number;
  color: string;
  height?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, color, height = 'h-4', showPercentage = false }: ProgressBarProps) {
  return (
    <div className={`bg-gray-200 rounded-full ${height} overflow-hidden`}>
      <div 
        className={`h-full bg-gradient-to-r ${color} transition-all duration-500 flex items-center justify-end pr-2`}
        style={{ width: `${progress}%` }}
      >
        {showPercentage && progress > 0 && (
          <span className="text-white text-xs font-bold">{progress}%</span>
        )}
      </div>
    </div>
  );
}