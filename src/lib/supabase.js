import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tsynwcczohpurkyvzpdb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeW53Y2N6b2hwdXJreXZ6cGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDE3NjMsImV4cCI6MjA5MDQ3Nzc2M30.A7UNQuQ4LnwF0SXnIT3a9M6OA03i9ddcRdbJbz-ciJk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function getRides() {
  const { data, error } = await supabase
    .from('rides')
    .select(`
      id,
      driver_name,
      origin,
      departure_time,
      seats_total,
      contact,
      notes,
      created_at,
      passengers ( id, passenger_name, created_at )
    `)
    .order('departure_time', { ascending: true })

  if (error) throw error
  return data
}

export async function addRideAPI(rideData) {
  const { data, error } = await supabase
    .from('rides')
    .insert({
      driver_name: rideData.driver_name.trim(),
      origin: rideData.origin.trim(),
      departure_time: rideData.departure_time,
      seats_total: Number(rideData.seats_total),
      contact: rideData.contact.trim(),
      notes: rideData.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRideAPI(id, deleteToken) {
  const { error, count } = await supabase
    .from('rides')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('delete_token', deleteToken)

  if (error) throw error
  if (count === 0) throw new Error('Token incorrecte o oferta no trobada.')
}

export async function joinRideAPI(ride_id, passenger_name) {
  const { data, error } = await supabase
    .from('passengers')
    .insert({
      ride_id: ride_id,
      passenger_name: passenger_name.trim(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function leaveRideAPI(passengerId) {
  const { error } = await supabase
    .from('passengers')
    .delete()
    .eq('id', passengerId)

  if (error) throw error
}

export function subscribeToChanges(onChange) {
  return supabase
    .channel('carpooling-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'passengers' }, onChange)
    .subscribe()
}
