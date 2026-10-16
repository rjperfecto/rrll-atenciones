import { fechaLarga } from './fechaLarga'

// Interlineado del bloque "datos" (3 líneas): mismo valor acá que en el
// preview del editor (PosicionadorPlantilla), si no las líneas quedarían
// más juntas/separadas en la vista previa que en el PDF real.
export const INTERLINEADO_PLANTILLA = 1.3

// Los dos bloques de texto de una Plantilla PDF (ver CampoPlantilla):
// se arman acá, no en cada pantalla, para que la vista previa del editor
// (PosicionadorPlantilla) y el PDF final (DocumentoIndividual/DocumentoMasivo) usen
// exactamente el mismo formato.

export function textoDatos(nombre: string, dni: string, celular: string): string {
  return `SEÑOR(A): ${nombre}\nDNI: ${dni}\nCELULAR: ${celular}`
}

export function textoFecha(fechaYyyyMmDd: string): string {
  return `CHAO, ${fechaLarga(fechaYyyyMmDd)}`.toUpperCase()
}
