
import React, { useState, useEffect } from 'react';
import { TARGET_DATE } from '../constants';

const Countdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = TARGET_DATE.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  const labels = ['Days', 'Hours', 'Minutes', 'Seconds'];
  const values = [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center">
      <h3 className="text-slate-500 font-semibold text-sm mb-4 uppercase tracking-widest">Time Remaining</h3>
      <div className="grid grid-cols-4 gap-4 w-full">
        {labels.map((label, idx) => (
          <div key={label} className="flex flex-col items-center">
            <div className="text-3xl md:text-4xl font-black text-slate-900">{values[idx].toString().padStart(2, '0')}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
         <div 
          className="bg-orange-500 h-full transition-all duration-1000" 
          style={{ width: `${Math.min(100, Math.max(0, (1 - (TARGET_DATE.getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000)) * 100))}%` }}
         ></div>
      </div>
    </div>
  );
};

export default Countdown;
