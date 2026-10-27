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
      // Reasignar e.target.value manda el cursor al final del campo (así
      // funciona el DOM en cualquier navegador): en celular eso hacía
      // imposible editar en medio del texto (el cursor "saltaba" con cada
      // letra) y rompía el autocompletado del teclado (que depende de que
      // la selección no se pise sola). Guardar y restaurar la posición del
      // cursor antes/después de mayuscularlo arregla ambas cosas.
      const inicio = e.target.selectionStart
      const fin = e.target.selectionEnd
      e.target.value = e.target.value.toUpperCase()
      if (inicio !== null && fin !== null) {
        e.target.setSelectionRange(inicio, fin)
      }
      return campo.onChange(e)
    },
  }
}
