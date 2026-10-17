import { ProximasCaminatas } from './ProximasCaminatas'
import { TableroConflictividad } from './TableroConflictividad'
import { PageHeader } from '@/components/ui/PageHeader'

// 360 Laboral > Próximas caminatas: arriba se programa (grupo+fecha, con
// líder/supervisor, conflictividad y ubicación autocompletados desde TAREO
// y la conflictividad importada); abajo, el tablero de las 3 zonas es solo
// informativo, para priorizar qué grupo conviene visitar primero.
export function ProximasCaminatasPage() {
  return (
    <div>
      <PageHeader title="Próximas caminatas" description="Programa caminatas 360 Laboral y prioriza por conflictividad del grupo." />
      <ProximasCaminatas />
      <TableroConflictividad />
    </div>
  )
}
