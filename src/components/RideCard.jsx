import React from 'react';
import { Clock, MapPin, Users, Phone } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function RideCard({ 
  ride, 
  myRides, 
  myPassengers, 
  onJoinClick, 
  onLeaveClick, 
  onDeleteClick,
  isSelected,
  onSelect
}) {
  const freeSeats = ride.seats_total - (ride.passengers?.length || 0);
  const isMine = !!myRides[ride.id];
  const myPassengerId = Object.keys(myPassengers).find(pid => myPassengers[pid] === ride.id);
  const isFull = freeSeats <= 0;

  // Boarding states
  let statusBadge = null;
  if (isFull) {
    statusBadge = <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Complet</span>;
  } else if (freeSeats === 1) {
    statusBadge = <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1">Last Seat</span>;
  } else {
    statusBadge = <span className="bg-airport-green/20 text-airport-green border border-airport-green/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Boarding</span>;
  }

  return (
    <div 
      className={cn(
        "bg-airport-card border-l-4 rounded-r-md p-4 transition-all duration-200 cursor-pointer flex flex-col gap-3",
        isFull ? "border-l-red-500" : freeSeats === 1 ? "border-l-yellow-500" : "border-l-airport-green",
        isSelected ? "ring-2 ring-airport-orange bg-[#2a2a2a] shadow-lg scale-[1.02]" : "hover:bg-[#2a2a2a]"
      )}
      onClick={() => onSelect(ride)}
    >
      {/* Top row */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg leading-none">{ride.driver_name}</h3>
            {isMine && <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded text-xs font-bold uppercase">Tu (Cond)</span>}
          </div>
          <div className="text-gray-400 text-sm flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{ride.contact}</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="font-mono text-xl font-bold flex items-center gap-1 text-airport-orange">
            <Clock className="w-5 h-5 text-gray-400" />
            {ride.departure_time}
          </div>
          {statusBadge}
        </div>
      </div>

      {/* Middle row: Origin -> Destination */}
      <div className="flex items-center gap-3 bg-black/40 p-2 rounded text-sm">
        <div className="flex items-center gap-1 flex-1 font-semibold text-gray-200 min-w-0" title={ride.origin}>
          <MapPin className="w-4 h-4 text-airport-orange shrink-0" />
          <span className="truncate">{ride.origin}</span>
        </div>
        <div className="text-gray-500 font-mono shrink-0">→</div>
        <div className="flex-1 font-semibold text-gray-400 truncate text-right shrink-0">
          El Pinatar
        </div>
      </div>

      {/* Details & Passengers */}
      {ride.notes && (
        <p className="text-sm text-gray-400 italic">"{ride.notes}"</p>
      )}

      <div className="flex flex-wrap gap-1.5 items-center mt-1">
        <Users className="w-4 h-4 text-gray-500 mr-1 shrink-0" />
        {ride.passengers && ride.passengers.length > 0 ? (
          ride.passengers.map(p => (
            <span key={p.id} className={cn(
              "text-xs px-2 py-0.5 rounded-full border truncate max-w-[120px]",
              p.id === myPassengerId 
                ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                : "bg-gray-800 border-gray-700 text-gray-300"
            )} title={p.passenger_name}>
              {p.passenger_name}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">Cap passatger</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
        {!isMine && !myPassengerId && !isFull && (
          <button 
            onClick={(e) => { e.stopPropagation(); onJoinClick(ride); }}
            className="flex-1 bg-airport-orange hover:bg-[#c25402] text-white font-bold py-2 px-4 rounded text-sm transition-colors"
          >
            Unir-se
          </button>
        )}
        {myPassengerId && (
          <button 
            onClick={(e) => { e.stopPropagation(); onLeaveClick(myPassengerId, ride.id); }}
            className="flex-1 bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
          >
            Desapuntar-se
          </button>
        )}
        {isMine && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteClick(ride.id); }}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-bold py-2 px-4 rounded text-sm transition-colors"
          >
            Cancel·lar Oferta
          </button>
        )}
      </div>
    </div>
  );
}
