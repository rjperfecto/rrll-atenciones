import type { ChangeEvent } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

// Convierte a mayúsculas mientras se escribe (no solo visualmente: el valor
// que guarda react-hook-form también queda en mayúscula), para los campos de
// texto libre del negocio (nombre, fundo, grupo, área, etc.). Legajo/fecha/
// selects quedan afuera porque no aplica (numérico, catálogos ya en mayúscula).
export function conMayusculas(campo: UseFormRegisterReturn) {
  return {
    ...campo,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.value = e.target.value.toUpperCase()
      return campo.onChange(e)
    },
  }
}
