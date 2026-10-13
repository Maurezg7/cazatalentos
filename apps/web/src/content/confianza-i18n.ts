import type { Locale } from '../i18n/runtime';
import type { ConfianzaBloque } from './confianza';

const en: ConfianzaBloque[] = [
  {
    titulo: 'Small deposit',
    texto:
      'When you mark “I was there first” you leave at least 0.001 MON. That deposit stays in the contract, separate from the pool the artist opens.',
  },
  {
    titulo: 'Custody',
    texto:
      'The fan deposit and the artist pool stay in the Monad contract. This site only shows state; it does not hold or move the money.',
  },
  {
    titulo: 'If the goal is missed',
    texto:
      'If the milestone is rejected or the deadline passes undeclared, the artist can withdraw the pool. Your deposit is not shared out: you withdraw it when that artist has no active pool.',
  },
  {
    titulo: 'What a pioneer is',
    texto:
      'Whoever signs gets the next number. The contract gives weight 5 through rank 10, 3 through 50, 2 through 200, and 1 after that. That number is not for sale.',
  },
];

const es: ConfianzaBloque[] = [
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

export function getConfianza(locale: Locale): ConfianzaBloque[] {
  return locale === 'es' ? es : en;
}
