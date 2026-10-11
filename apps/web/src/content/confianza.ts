export type ConfianzaBloque = {
  titulo: string;
  texto: string;
};

export const CONFIANZA: ConfianzaBloque[] = [
  {
    titulo: 'Depósito chico',
    texto:
      'Al marcar “Estuve antes” dejás al menos 0,001 MON. Ese depósito queda en el contrato, separado del pozo que abre el artista.',
  },
  {
    titulo: 'Custodia',
    texto:
      'El depósito del fan y el pozo del artista quedan en el contrato en Monad. Esta web solo muestra el estado; no guarda ni mueve la plata.',
  },
  {
    titulo: 'Si no se cumple la meta',
    texto:
      'Si el hito se rechaza o vence el plazo sin declararse, el artista puede retirar el pozo. Tu depósito no se reparte: lo retirás cuando ese artista no tenga un pozo activo.',
  },
  {
    titulo: 'Qué es un pionero',
    texto:
      'Quien firma recibe el siguiente número. El contrato le da peso 5 hasta el puesto 10, 3 hasta el 50, 2 hasta el 200 y 1 después. Ese número no se compra.',
  },
];
