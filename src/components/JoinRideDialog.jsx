import React, { useState } from 'react';
import { Modal } from './Modal';
import { Clock, MapPin } from 'lucide-react';

export function JoinRideDialog({ ride, onClose, onJoin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const passengerName = formData.get('passenger_name');

    setLoading(true);
    setError(null);
    try {
      await onJoin(ride.id, passengerName);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ride) return null;

  return (
    <Modal isOpen={!!ride} onClose={onClose} title="Unir-se a aquesta oferta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-500 rounded text-sm">{error}</div>}
        
        <div className="bg-black/40 p-4 rounded-lg flex flex-col gap-2 border border-white/5 mb-2">
          <h3 className="font-bold text-lg text-white">{ride.driver_name}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-airport-orange"/> {ride.departure_time}</div>
            <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-airport-orange"/> {ride.origin}</div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-300">El teu nom *</label>
          <input 
            required 
            autoFocus
            name="passenger_name" 
            type="text" 
            className="bg-black/40 border border-white/20 rounded p-3 text-white focus:border-airport-orange focus:outline-none text-lg" 
            placeholder="Nom complet" 
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">Cancel·lar</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-airport-orange hover:bg-[#c25402] text-white font-bold rounded shadow-lg disabled:opacity-50 transition-colors">
            {loading ? 'Unint...' : "Confirmar i Unir-se"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
