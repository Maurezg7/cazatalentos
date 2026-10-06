export type ConfianzaBloque = {
  titulo: string;
  texto: string;
};

// TODO(contenido): validar con contrato antes de publicar.
export const CONFIANZA: ConfianzaBloque[] = [
  {
    titulo: 'Depósito chico',
    // TODO(contenido): validar con contrato
    texto: 'Al marcar “Estuve antes” dejás un depósito en el pozo de ese artista. El mínimo lo fija el contrato, no esta página.',
  },
  {
    titulo: 'Custodia',
    // TODO(contenido): validar con contrato
    texto: 'El pozo queda en el contrato en Monad. Esta web solo muestra el estado; no guarda ni mueve la plata.',
  },
  {
    titulo: 'Si no se cumple la meta',
    // TODO(contenido): validar con contrato. reclaimPool devuelve el monto al artista, no a los fans.
    texto: 'Si el hito se rechaza o vence el plazo sin declararse, el contrato permite que el artista retire el pozo. No está prometida una devolución automática a los pioneros.',
  },
  {
    titulo: 'Qué es un pionero',
    // TODO(contenido): validar con contrato
    texto: 'Quien firma antes recibe un número de entrada que asigna el contrato en la transacción. Ese número no se compra y otro puede adelantarse.',
  },
];
