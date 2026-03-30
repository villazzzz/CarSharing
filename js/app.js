// ============================================================
// app.js — Lògica de la interfície d'usuari
// ============================================================

import {
  supabase,
  getRides,
  addRide,
  deleteRide,
  joinRide,
  leaveRide,
  subscribeToChanges,
} from './supabase.js'


// ------------------------------------------------------------
// ESTAT LOCAL
// ------------------------------------------------------------

/**
 * Persistència en localStorage:
 *
 *  MY_RIDES_KEY  → { [rideId]: deleteToken }
 *    Permet al conductor esborrar la seva oferta en sessions futures.
 *
 *  MY_PASSENGERS_KEY → { [passengerId]: rideId }
 *    Permet al passatger desapuntar-se en sessions futures.
 */
const MY_RIDES_KEY      = 'cp_my_rides'
const MY_PASSENGERS_KEY = 'cp_my_passengers'

function getMyRides()      { return JSON.parse(localStorage.getItem(MY_RIDES_KEY)      || '{}') }
function getMyPassengers() { return JSON.parse(localStorage.getItem(MY_PASSENGERS_KEY) || '{}') }

function saveMyRide(rideId, deleteToken) {
  const rides = getMyRides()
  rides[rideId] = deleteToken
  localStorage.setItem(MY_RIDES_KEY, JSON.stringify(rides))
}

function saveMyPassenger(passengerId, rideId) {
  const passengers = getMyPassengers()
  passengers[passengerId] = rideId
  localStorage.setItem(MY_PASSENGERS_KEY, JSON.stringify(passengers))
}

function removeMyRide(rideId) {
  const rides = getMyRides()
  delete rides[rideId]
  localStorage.setItem(MY_RIDES_KEY, JSON.stringify(rides))
}

function removeMyPassenger(passengerId) {
  const passengers = getMyPassengers()
  delete passengers[passengerId]
  localStorage.setItem(MY_PASSENGERS_KEY, JSON.stringify(passengers))
}

/** Retorna si l'usuari actual és el conductor d'aquesta oferta. */
function isMine(rideId)  { return rideId in getMyRides() }

/** Retorna l'id del passatger de l'usuari en aquesta oferta (o null). */
function myPassengerId(rideId) {
  const myPass = getMyPassengers()
  return Object.keys(myPass).find(pid => myPass[pid] === rideId) ?? null
}

// Modal state
let joinTargetRideId = null


// ------------------------------------------------------------
// INICIALITZACIÓ
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  bindFormEvents()
  loadAndRender()
  setupRealtime()
})


// ------------------------------------------------------------
// CÀRREGA I RENDERITZAT
// ------------------------------------------------------------

async function loadAndRender() {
  setLoading(true)
  try {
    const rides = await getRides()
    renderAll(rides)
  } catch (err) {
    showError(err.message)
  } finally {
    setLoading(false)
  }
}

function renderAll(rides) {
  renderStats(rides)
  renderRidesList(rides)
}

function renderStats(rides) {
  const totalFree = rides.reduce((acc, r) => acc + freeSeats(r), 0)
  const totalPass = rides.reduce((acc, r) => acc + r.passengers.length, 0)

  setText('stat-offers',     rides.length)
  setText('stat-seats',      totalFree)
  setText('stat-passengers', totalPass)
}

function renderRidesList(rides) {
  const container = document.getElementById('rides-list')
  if (!container) return

  if (rides.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Encara no hi ha ofertes de cotxe.</p>
        <p>Sigues el primer en afegir-ne una!</p>
      </div>`
    return
  }

  container.innerHTML = rides.map(renderRideCard).join('')
  attachRideCardEvents(rides)
}

function renderRideCard(ride) {
  const free      = freeSeats(ride)
  const mine      = isMine(ride.id)
  const myPid     = myPassengerId(ride.id)
  const isFull    = free === 0
  const seatClass = isFull ? 'badge--red' : free === 1 ? 'badge--amber' : 'badge--green'

  const passengerTags = ride.passengers.length > 0
    ? ride.passengers.map(p => {
        const isMe = myPid === p.id
        return `<span class="passenger-tag${isMe ? ' passenger-tag--me' : ''}" data-pid="${p.id}">
          ${escapeHtml(p.passenger_name)}${isMe ? ' (tu)' : ''}
        </span>`
      }).join('')
    : `<span class="passenger-tag passenger-tag--empty">Ningú apuntat encara</span>`

  return `
    <article class="ride-card" data-ride-id="${ride.id}">
      <header class="ride-card__header">
        <div class="ride-card__avatar">${initials(ride.driver_name)}</div>
        <div class="ride-card__info">
          <strong class="ride-card__name">${escapeHtml(ride.driver_name)}</strong>
          <span class="ride-card__contact">${escapeHtml(ride.contact)}</span>
        </div>
        ${mine ? `<span class="badge badge--blue badge--sm">La meva oferta</span>` : ''}
      </header>

      <div class="ride-card__badges">
        <span class="badge">🕐 ${escapeHtml(ride.departure_time)}</span>
        <span class="badge">📍 ${escapeHtml(ride.origin)}</span>
        <span class="badge ${seatClass}">
          ${free} plaça${free !== 1 ? 'ces' : ''} lliure${free !== 1 ? 's' : ''}
        </span>
      </div>

      ${ride.notes
        ? `<p class="ride-card__notes">${escapeHtml(ride.notes)}</p>`
        : ''}

      <div class="ride-card__passengers">${passengerTags}</div>

      <footer class="ride-card__actions">
        ${!mine && !myPid && !isFull
          ? `<button class="btn btn--primary js-join" data-ride-id="${ride.id}">
               Unir-me
             </button>`
          : ''}
        ${myPid
          ? `<button class="btn btn--outline js-leave"
               data-ride-id="${ride.id}" data-pid="${myPid}">
               Desapuntar-me
             </button>`
          : ''}
        ${mine
          ? `<button class="btn btn--danger js-delete" data-ride-id="${ride.id}">
               Eliminar oferta
             </button>`
          : ''}
        ${isFull && !myPid && !mine
          ? `<span class="badge badge--red">Complet</span>`
          : ''}
      </footer>
    </article>`
}

function attachRideCardEvents(rides) {
  // Unir-me
  document.querySelectorAll('.js-join').forEach(btn => {
    btn.addEventListener('click', () => openJoinModal(btn.dataset.rideId, rides))
  })

  // Desapuntar-me
  document.querySelectorAll('.js-leave').forEach(btn => {
    btn.addEventListener('click', () => handleLeave(btn.dataset.rideId, btn.dataset.pid))
  })

  // Eliminar oferta
  document.querySelectorAll('.js-delete').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteRide(btn.dataset.rideId))
  })
}


// ------------------------------------------------------------
// FORMULARI — AFEGIR OFERTA
// ------------------------------------------------------------

function bindFormEvents() {
  // Toggle formulari
  const toggleBtn = document.getElementById('toggle-form-btn')
  const form      = document.getElementById('add-ride-form')
  if (toggleBtn && form) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = form.classList.toggle('is-open')
      toggleBtn.setAttribute('aria-expanded', String(isOpen))
      toggleBtn.querySelector('.toggle-icon').textContent = isOpen ? '−' : '+'
      if (isOpen) form.querySelector('input, select, textarea').focus()
    })
  }

  // Submit
  const submitBtn = document.getElementById('submit-ride-btn')
  if (submitBtn) {
    submitBtn.addEventListener('click', handleAddRide)
  }

  // Cancel
  const cancelBtn = document.getElementById('cancel-ride-btn')
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      form?.classList.remove('is-open')
      toggleBtn?.setAttribute('aria-expanded', 'false')
      if (toggleBtn) toggleBtn.querySelector('.toggle-icon').textContent = '+'
    })
  }

  // Modal — confirmar unió
  document.getElementById('confirm-join-btn')?.addEventListener('click', handleConfirmJoin)
  document.getElementById('cancel-join-btn')?.addEventListener('click', closeJoinModal)
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeJoinModal()
  })
}

async function handleAddRide() {
  const fields = {
    driver_name:    getValue('f-driver'),
    origin:         getValue('f-origin'),
    departure_time: getValue('f-time'),
    seats_total:    getValue('f-seats'),
    contact:        getValue('f-contact'),
    notes:          getValue('f-notes'),
  }

  if (!fields.driver_name || !fields.origin || !fields.contact) {
    showToast('Omple els camps obligatoris: nom, zona i contacte.', 'error')
    return
  }

  setButtonLoading('submit-ride-btn', true)
  try {
    const ride = await addRide(fields)
    saveMyRide(ride.id, ride.delete_token)  // guarda el token en localStorage
    showToast('Oferta publicada correctament!')
    clearForm()
    await loadAndRender()
    document.getElementById('add-ride-form')?.classList.remove('is-open')
    document.getElementById('toggle-form-btn')?.setAttribute('aria-expanded', 'false')
    const icon = document.querySelector('#toggle-form-btn .toggle-icon')
    if (icon) icon.textContent = '+'
  } catch (err) {
    showToast(err.message, 'error')
  } finally {
    setButtonLoading('submit-ride-btn', false)
  }
}


// ------------------------------------------------------------
// MODAL — UNIR-SE A UN COTXE
// ------------------------------------------------------------

function openJoinModal(rideId, rides) {
  const ride = rides.find(r => r.id === rideId)
  if (!ride) return

  joinTargetRideId = rideId
  setText('modal-ride-info', `${ride.driver_name} · ${ride.departure_time} · ${ride.origin}`)
  setValue('modal-name', '')
  setDisplay('modal-overlay', 'flex')
  document.getElementById('modal-name')?.focus()
}

function closeJoinModal() {
  setDisplay('modal-overlay', 'none')
  joinTargetRideId = null
}

async function handleConfirmJoin() {
  const name = getValue('modal-name')
  if (!name) {
    showToast('Escriu el teu nom.', 'error')
    return
  }

  setButtonLoading('confirm-join-btn', true)
  try {
    const passenger = await joinRide(joinTargetRideId, name)
    saveMyPassenger(passenger.id, joinTargetRideId)
    closeJoinModal()
    showToast(`${name} afegit/da correctament!`)
    await loadAndRender()
  } catch (err) {
    showToast(err.message, 'error')
  } finally {
    setButtonLoading('confirm-join-btn', false)
  }
}


// ------------------------------------------------------------
// ACCIONS — DESAPUNTAR-SE / ELIMINAR
// ------------------------------------------------------------

async function handleLeave(rideId, passengerId) {
  if (!confirm('Segur que vols desapuntar-te?')) return
  try {
    await leaveRide(passengerId)
    removeMyPassenger(passengerId)
    showToast('T\'has desapuntat.')
    await loadAndRender()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function handleDeleteRide(rideId) {
  if (!confirm('Segur que vols eliminar la teva oferta? Els passatgers ho veuran desaparèixer.')) return
  const token = getMyRides()[rideId]
  if (!token) {
    showToast('No s\'ha trobat el token d\'aquesta oferta.', 'error')
    return
  }
  try {
    await deleteRide(rideId, token)
    removeMyRide(rideId)
    showToast('Oferta eliminada.')
    await loadAndRender()
  } catch (err) {
    showToast(err.message, 'error')
  }
}


// ------------------------------------------------------------
// REAL-TIME
// ------------------------------------------------------------

function setupRealtime() {
  subscribeToChanges(() => {
    // Torna a carregar dades quan hi hagi qualsevol canvi
    loadAndRender()
  })
}


// ------------------------------------------------------------
// UTILITATS DOM
// ------------------------------------------------------------

function freeSeats(ride) {
  return ride.seats_total - ride.passengers.length
}

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function getText(id)        { return document.getElementById(id)?.value?.trim() ?? '' }
function getValue(id)       { return document.getElementById(id)?.value ?? '' }
function setValue(id, val)  { const el = document.getElementById(id); if (el) el.value = val }
function setText(id, val)   { const el = document.getElementById(id); if (el) el.textContent = val }
function setDisplay(id, v)  { const el = document.getElementById(id); if (el) el.style.display = v }

function setLoading(loading) {
  const el = document.getElementById('loading-indicator')
  if (el) el.style.display = loading ? 'block' : 'none'
}

function setButtonLoading(id, loading) {
  const btn = document.getElementById(id)
  if (!btn) return
  btn.disabled = loading
  btn.dataset.originalText ??= btn.textContent
  btn.textContent = loading ? 'Un moment...' : btn.dataset.originalText
}

function clearForm() {
  ;['f-driver','f-origin','f-time','f-seats','f-contact','f-notes'].forEach(id => setValue(id, ''))
  setValue('f-seats', '3')
}

function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'toast'
    document.body.appendChild(toast)
  }
  toast.textContent = msg
  toast.className = `toast toast--${type} toast--visible`
  clearTimeout(toast._timer)
  toast._timer = setTimeout(() => toast.classList.remove('toast--visible'), 3000)
}

function showError(msg) {
  const el = document.getElementById('rides-list')
  if (el) el.innerHTML = `<div class="error-state">Error: ${escapeHtml(msg)}</div>`
}
