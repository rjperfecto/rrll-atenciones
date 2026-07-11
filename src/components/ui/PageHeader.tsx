// Título + descripción de página con tamaños de fuente consistentes
// (antes cada pantalla definía su propio h2/p con clases distintas).
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
    </div>
  )
}
