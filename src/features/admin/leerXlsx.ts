import { read, utils } from 'xlsx'

// Usa la build oficial de SheetJS distribuida desde su propio CDN (parcheada:
// ver README del proyecto) en vez de la versión de npm, que tiene 2
// vulnerabilidades sin parche (prototype pollution y ReDoS). Se probó contra
// el archivo real de TAREO porque otra librería más liviana (read-excel-file)
// fallaba al parsearlo.
export async function leerFilasXlsx(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer()
  const libro = read(buffer, { type: 'array' })
  const hoja = libro.Sheets[libro.SheetNames[0]]
  return utils.sheet_to_json(hoja, { header: 1, raw: false }) as string[][]
}
