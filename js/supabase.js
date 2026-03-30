// ============================================================
// supabase.js — Client i operacions de base de dades
// ============================================================
// Substitueix les dues constants de sota amb les teves credencials:
// Supabase Dashboard → Settings → API
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = 'https://tsynwcczohpurkyvzpdb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeW53Y2N6b2hwdXJreXZ6cGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDE3NjMsImV4cCI6MjA5MDQ3Nzc2M30.A7UNQuQ4LnwF0SXnIT3a9M6OA03i9ddcRdbJbz-ciJk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)


// ------------------------------------------------------------
// RIDES
// ------------------------------------------------------------

/**
 * Retorna totes les ofertes amb els seus passatgers inclosos.
 * Ordenades per hora de sortida.
 * @returns {Promise<Array>}
 */
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

  if (error) throw new Error(`Error carregant ofertes: ${error.message}`)
  return data
}

/**
 * Crea una nova oferta de cotxe.
 * Retorna la fila creada, incloent el delete_token secret.
 * El token s'ha de guardar en localStorage al costat del client.
 *
 * @param {{ driver_name, origin, departure_time, seats_total, contact, notes }} ride
 * @returns {Promise<Object>} Ride creat (amb delete_token)
 */
export async function addRide({ driver_name, origin, departure_time, seats_total, contact, notes }) {
  const { data, error } = await supabase
    .from('rides')
    .insert({
      driver_name:    driver_name.trim(),
      origin:         origin.trim(),
      departure_time: departure_time,
      seats_total:    Number(seats_total),
      contact:        contact.trim(),
      notes:          notes?.trim() || null,
    })
    .select()        // retorna la fila completa, incloent el delete_token generat per Postgres
    .single()

  if (error) throw new Error(`Error creant oferta: ${error.message}`)
  return data        // data.delete_token és el token secret
}

/**
 * Esborra una oferta.
 * La query inclou delete_token per assegurar que el client
 * és el propietari; si el token no coincideix, no s'esborra res.
 *
 * @param {string} id           UUID de l'oferta
 * @param {string} deleteToken  Token UUID secret del conductor
 */
export async function deleteRide(id, deleteToken) {
  const { error, count } = await supabase
    .from('rides')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('delete_token', deleteToken)

  if (error)    throw new Error(`Error esborrant oferta: ${error.message}`)
  if (count === 0) throw new Error('Token incorrecte o oferta no trobada.')
}


// ------------------------------------------------------------
// PASSENGERS
// ------------------------------------------------------------

/**
 * Afegeix un passatger a una oferta.
 * Retorna el passatger creat (amb el seu id).
 * L'id s'ha de guardar en localStorage per poder desapuntar-se.
 *
 * @param {string} ride_id          UUID de l'oferta
 * @param {string} passenger_name   Nom del passatger
 * @returns {Promise<Object>}
 */
export async function joinRide(ride_id, passenger_name) {
  const { data, error } = await supabase
    .from('passengers')
    .insert({
      ride_id:        ride_id,
      passenger_name: passenger_name.trim(),
    })
    .select()
    .single()

  if (error) throw new Error(`Error apuntant-se: ${error.message}`)
  return data        // data.id és l'id del passatger (per desapuntar-se)
}

/**
 * Esborra un passatger (desapuntar-se d'una oferta).
 *
 * @param {string} passengerId  UUID del registre del passatger
 */
export async function leaveRide(passengerId) {
  const { error } = await supabase
    .from('passengers')
    .delete()
    .eq('id', passengerId)

  if (error) throw new Error(`Error desapuntant-se: ${error.message}`)
}


// ------------------------------------------------------------
// REAL-TIME
// ------------------------------------------------------------

/**
 * Subscriu als canvis de les taules rides i passengers.
 * Qualsevol INSERT/UPDATE/DELETE en temps real crida el callback.
 *
 * @param {Function} onChange  Funció cridada amb cada canvi
 * @returns {Object}           Canal Supabase (guardar-lo per poder cancel·lar-lo)
 *
 * @example
 * const channel = subscribeToChanges(() => loadRides())
 * // Per cancel·lar: supabase.removeChannel(channel)
 */
export function subscribeToChanges(onChange) {
  return supabase
    .channel('carpooling-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rides' },
      onChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'passengers' },
      onChange
    )
    .subscribe()
}
