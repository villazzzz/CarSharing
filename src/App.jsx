import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRides } from './hooks/useRides';
import { SplitFlapDisplay } from './components/SplitFlapDisplay';
import { RideCard } from './components/RideCard';
import { InteractiveMap } from './components/InteractiveMap';
import { AddRideDialog } from './components/AddRideDialog';
import { JoinRideDialog } from './components/JoinRideDialog';

function App() {
  const { rides, loading, error, addRide, joinRide, leaveRide, deleteRide, myRides, myPassengers } = useRides();
  
  const [selectedRide, setSelectedRide] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [joinRideTarget, setJoinRideTarget] = useState(null);

  const totalOffers = rides.length;
  const totalFreeSeats = rides.reduce((acc, r) => acc + (r.seats_total - (r.passengers?.length || 0)), 0);
  const totalPassengers = rides.reduce((acc, r) => acc + (r.passengers?.length || 0), 0);

  return (
    <div className="min-h-screen bg-airport-dark flex flex-col font-sans text-white">
      {/* HEADER */}
      <header className="border-b border-white/5 bg-black/40 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-airport-orange flex items-center justify-center text-3xl font-black shadow-lg shadow-airport-orange/20">⬡</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-white mb-0.5">Paso Ecuador UPF 2026</h1>
              <p className="text-airport-orange font-mono text-sm tracking-wide">9 i 10 MAIG · EL PINATAR</p>
            </div>
          </div>

          <div className="flex gap-4 sm:gap-8 bg-black/60 p-3 px-6 rounded-lg border border-white/5 shadow-inner">
            <SplitFlapDisplay value={totalOffers} label="Ofertes" />
            <SplitFlapDisplay value={totalFreeSeats} label="Places" />
            <SplitFlapDisplay value={totalPassengers} label="Passatgers" />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6 lg:gap-8 lg:h-[calc(100vh-140px)]">
        
        {/* LEFT PANEL: LIST */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-[500px]">
          <div className="flex items-center justify-between mb-4 mt-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-gray-300">Panell de Sortides</h2>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-airport-orange hover:bg-[#c25402] text-white font-bold py-2.5 px-5 rounded-md shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Ofereixo cotxe</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-500 p-4 border border-red-500/30 rounded mb-4 font-mono text-sm">
              Error carregant ofertes: {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-4 custom-scrollbar">
            {loading && rides.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-airport-orange"></div>
              </div>
            ) : rides.length === 0 ? (
              <div className="bg-airport-board border border-white/5 rounded-lg p-12 text-center text-gray-400">
                <div className="text-4xl mb-3 opacity-20">🚗</div>
                <p className="text-lg">No hi ha cap oferta de cotxe encara.</p>
                <p>Sigues el primer en oferir places!</p>
              </div>
            ) : (
              rides.map(ride => (
                <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  myRides={myRides}
                  myPassengers={myPassengers}
                  isSelected={selectedRide?.id === ride.id}
                  onSelect={setSelectedRide}
                  onJoinClick={setJoinRideTarget}
                  onLeaveClick={async (pid, rid) => {
                    if(window.confirm("Segur que vols desapuntar-te?")) {
                      await leaveRide(pid, rid);
                    }
                  }}
                  onDeleteClick={async (rid) => {
                    if(window.confirm("Segur que vols eliminar aquesta oferta?")) {
                      await deleteRide(rid);
                      if (selectedRide?.id === rid) setSelectedRide(null);
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: MAP */}
        <div className="lg:w-[450px] xl:w-[550px] h-[400px] lg:h-full shrink-0 flex flex-col pb-4 lg:pb-8">
          <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative bg-airport-board">
             <InteractiveMap selectedRide={selectedRide} />
          </div>
        </div>

      </main>

      {/* DIALOGS */}
      <AddRideDialog 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onAdd={addRide} 
      />
      <JoinRideDialog 
        ride={joinRideTarget} 
        onClose={() => setJoinRideTarget(null)} 
        onJoin={joinRide}
      />
    </div>
  );
}

export default App;
