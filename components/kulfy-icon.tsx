'use client';

export function KulfyIcon({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-5 h-9',
    md: 'w-7 h-14',
    lg: 'w-10 h-20',
    xl: 'w-14 h-28',
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative inline-block`}>
      {/* Wooden stick at bottom */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-6 bg-gradient-to-b from-amber-700 to-amber-900 rounded-sm shadow-sm" />
      
      {/* Kulfy body - conical/pointed shape, milk-based white/cream color */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-4/5 shadow-xl animate-kulfy-float"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 20%, #fef3c7 50%, #fde68a 80%, #fcd34d 100%)',
          clipPath: 'polygon(30% 0%, 70% 0%, 95% 40%, 100% 70%, 85% 95%, 50% 100%, 15% 95%, 0% 70%, 5% 40%)',
        }}
      >
        {/* Creamy shine effect at top */}
        <div className="absolute top-2 left-1/4 w-1/2 h-1/4 bg-white/60 rounded-full blur-sm animate-shimmer" />
        
        {/* Pistachio pieces (green nuts) */}
        <div className="absolute top-[15%] left-[30%] w-1 h-1.5 bg-green-600 rounded-sm transform rotate-12" />
        <div className="absolute top-[35%] right-[25%] w-1 h-1 bg-green-700 rounded-sm transform -rotate-45" />
        <div className="absolute top-[55%] left-[35%] w-0.5 h-1 bg-green-600 rounded-sm transform rotate-45" />
        <div className="absolute top-[70%] right-[30%] w-1 h-1.5 bg-green-700 rounded-sm transform rotate-20" />
        
        {/* Almond pieces (brown nuts) */}
        <div className="absolute top-[25%] right-[35%] w-1 h-1 bg-amber-800 rounded-sm transform -rotate-30" />
        <div className="absolute top-[45%] left-[25%] w-1.5 h-1 bg-amber-700 rounded-sm transform rotate-60" />
        <div className="absolute top-[60%] right-[40%] w-1 h-1 bg-amber-800 rounded-sm transform -rotate-15" />
        <div className="absolute top-[80%] left-[40%] w-0.5 h-0.5 bg-amber-700 rounded-sm" />
        
        {/* Cashew pieces (light brown) */}
        <div className="absolute top-[20%] left-[40%] w-1 h-0.5 bg-orange-200 rounded-full transform rotate-45" />
        <div className="absolute top-[50%] right-[35%] w-1 h-0.5 bg-orange-300 rounded-full transform -rotate-20" />
        
        {/* Texture lines for creamy appearance */}
        <div className="absolute top-1/3 left-1/4 right-1/4 h-px bg-amber-100/40" />
        <div className="absolute top-2/3 left-1/4 right-1/4 h-px bg-amber-100/30" />
        
        {/* Slight drip at pointed bottom */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1.5 bg-amber-100 rounded-full opacity-70 animate-drip" />
      </div>
      
      {/* Frozen condensation effect */}
      <div className="absolute top-1/3 right-1 w-1 h-1 bg-white/80 rounded-full animate-pulse-slow" />
      <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-white/70 rounded-full animate-pulse-fast" />
    </div>
  );
}

