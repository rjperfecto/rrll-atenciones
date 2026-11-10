import { registerSW } from 'virtual:pwa-register'

// Registro manual del service worker (en vez del script automático que
// inyecta vite-plugin-pwa) para poder forzar que los dispositivos ya
// abiertos se actualicen solos, sin que cada usuario tenga que limpiar el
// caché del navegador a mano.
//
// Con registerType: 'autoUpdate' el service worker nuevo activa
// skipWaiting + clientsClaim apenas se detecta, pero por defecto eso solo
// mueve el "control" de las próximas peticiones — la pestaña que ya está
// abierta se queda mostrando el HTML/JS viejo que cargó en memoria. Por
// eso acá:
//   1. Revisamos cada 60s si hay una versión nueva desplegada (el navegador
//      solo chequea sw.js por su cuenta al navegar/recargar, así que una
//      pestaña que queda abierta e inactiva no se enteraría sola).
//   2. En cuanto el nuevo service worker toma el control, recargamos la
//      página automáticamente para que se pidan los archivos nuevos.
const INTERVALO_REVISION_MS = 60_000

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => registration.update(), INTERVALO_REVISION_MS)
    },
  })

  let recargando = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return
    recargando = true
    window.location.reload()
  })
}

// Caso aparte del de arriba: entre que un deploy nuevo queda publicado y
// que esta pestaña se entera (chequea sw.js cada 60s), si en el medio se
// dispara un import() dinámico (ej. generarCartaVerificacion360 al
// "Guardar verificación") el navegador pide un chunk con el hash viejo que
// el deploy nuevo ya no sirve — "Failed to fetch dynamically imported
// module". Vite dispara este evento en ese caso puntual: recargar basta,
// la próxima carga ya pide los archivos correctos.
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})
