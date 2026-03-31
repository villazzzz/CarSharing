import React, { useState } from 'react';
import { Modal } from './Modal';

export function AddRideDialog({ isOpen, onClose, onAdd }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      driver_name: formData.get('driver_name'),
      origin: formData.get('origin'),
      departure_time: formData.get('departure_time'),
      seats_total: formData.get('seats_total'),
      contact: formData.get('contact'),
      notes: formData.get('notes')
    };

    setLoading(true);
    setError(null);
    try {
      await onAdd(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Oferta de Cotxe">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-500 rounded text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-300">Nom del conductor *</label>
            <input required name="driver_name" type="text" className="bg-black/40 border border-white/20 rounded p-2 text-white focus:border-airport-orange focus:outline-none" placeholder="El teu nom" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-300">Zona de sortida *</label>
            <input required name="origin" type="text" className="bg-black/40 border border-white/20 rounded p-2 text-white focus:border-airport-orange focus:outline-none" placeholder="Ex: Gràcia, Barcelona" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-300">Hora de sortida</label>
            <input required name="departure_time" type="time" defaultValue="10:00" className="bg-black/40 border border-white/20 rounded p-2 text-white focus:border-airport-orange focus:outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-300">Places totals ofertades</label>
            <select name="seats_total" defaultValue="3" className="bg-black/40 border border-white/20 rounded p-2 text-white focus:border-airport-orange focus:outline-none">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n} className="bg-airport-board">{n}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-300">Contacte *</label>
          <input required name="contact" type="text" className="bg-black/40 border border-white/20 rounded p-2 text-white focus:border-airport-orange focus:outline-none" placeholder="Mòbil o @insta" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Notes (opcional)</label>
          <textarea name="notes" rows="2" className="bg-black/40 border border-white/20 rounded p-2 text-white focus:border-airport-orange focus:outline-none" placeholder="Detalls del punt de trobada..."></textarea>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">Cancel·lar</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-airport-orange hover:bg-[#c25402] text-white font-bold rounded shadow-lg disabled:opacity-50 transition-colors">
            {loading ? 'Publicant...' : 'Publicar Oferta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
