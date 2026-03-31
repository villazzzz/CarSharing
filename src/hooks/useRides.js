import { useState, useEffect, useCallback } from 'react'
import {
  getRides,
  addRideAPI,
  deleteRideAPI,
  joinRideAPI,
  leaveRideAPI,
  subscribeToChanges
} from '../lib/supabase'

const MY_RIDES_KEY = 'cp_my_rides'
const MY_PASSENGERS_KEY = 'cp_my_passengers'

function getLocalObj(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
}

export function useRides() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // local state for permissions
  const [myRides, setMyRides] = useState(() => getLocalObj(MY_RIDES_KEY))
  const [myPassengers, setMyPassengers] = useState(() => getLocalObj(MY_PASSENGERS_KEY))

  useEffect(() => {
    localStorage.setItem(MY_RIDES_KEY, JSON.stringify(myRides))
  }, [myRides])

  useEffect(() => {
    localStorage.setItem(MY_PASSENGERS_KEY, JSON.stringify(myPassengers))
  }, [myPassengers])

  const fetchRides = useCallback(async () => {
    try {
      const data = await getRides()
      setRides(data || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRides()
    
    // Setup Realtime with Supabase
    const channel = subscribeToChanges(() => {
      fetchRides()
    })
    
    return () => {
      if (channel) channel.unsubscribe()
    }
  }, [fetchRides])

  const addRide = async (rideData) => {
    const data = await addRideAPI(rideData)
    // optimistic update
    const newRide = { ...data, passengers: [] }
    setRides(prev => {
      const updated = [...prev, newRide]
      updated.sort((a,b) => a.departure_time.localeCompare(b.departure_time))
      return updated
    })
    setMyRides(prev => ({ ...prev, [data.id]: data.delete_token }))
    return data
  }

  const joinRide = async (rideId, passengerName) => {
    // Optimistic UI update
    const tempId = 'temp-' + Date.now()
    setRides(prev => prev.map(r => {
      if (r.id === rideId) {
        return { ...r, passengers: [...(r.passengers || []), { id: tempId, passenger_name: passengerName }] }
      }
      return r
    }))

    try {
      const data = await joinRideAPI(rideId, passengerName)
      setMyPassengers(prev => ({ ...prev, [data.id]: rideId }))
      
      // Update the temp id with the real one
      setRides(prev => prev.map(r => {
        if (r.id === rideId) {
          return {
            ...r,
            passengers: r.passengers.map(p => p.id === tempId ? { ...p, id: data.id } : p)
          }
        }
        return r
      }))
      return data
    } catch (err) {
      // Revert optimistic on error
      fetchRides()
      throw err
    }
  }

  const leaveRide = async (passengerId, rideId) => {
    // Optimistic
    setRides(prev => prev.map(r => {
      if (r.id === rideId) {
        return { ...r, passengers: r.passengers.filter(p => p.id !== passengerId) }
      }
      return r
    }))
    try {
      await leaveRideAPI(passengerId)
      setMyPassengers(prev => {
        const copy = { ...prev }
        delete copy[passengerId]
        return copy
      })
    } catch (err) {
      fetchRides()
      throw err
    }
  }

  const deleteRide = async (rideId) => {
    const token = myRides[rideId]
    if (!token) throw new Error('No token found')
    
    // Optimistic
    setRides(prev => prev.filter(r => r.id !== rideId))
    
    try {
      await deleteRideAPI(rideId, token)
      setMyRides(prev => {
        const copy = { ...prev }
        delete copy[rideId]
        return copy
      })
    } catch (err) {
      fetchRides()
      throw err
    }
  }

  return { rides, loading, error, addRide, joinRide, leaveRide, deleteRide, myRides, myPassengers }
}
