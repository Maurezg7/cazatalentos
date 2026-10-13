import type { Locale } from '../i18n/runtime';
import { CONTRATO_DESPLEGADO, SIMULADOR_CONFIG, SIMULADOR_HABILITADO, VIDEO as VIDEO_ES } from './como-funciona';

type Paso = { numero: number; titulo: string; accion: string; plata: string };
type Evento = { fecha: string; texto: string };
type Glosa = { termino: string; definicion: string };
type Faq = { pregunta: string; respuesta: string };

type ComoCopy = {
  pageTitle: string;
  intro: string;
  fourSteps: string;
  fullExample: string;
  tryNumbers: string;
  glossary: string;
  faq: string;
  video: string;
  transcript: string;
  follow: string;
  viewContract: string;
  contractNote: string;
  pasos: Paso[];
  ejemplo: {
    artista: string;
    ciudad: string;
    fan: string;
    numero: number;
    eventos: Evento[];
    ticketMeta: string;
    ticketDate: string;
  };
  escenarios: { cumple: string; noCumple: string };
  glosario: Glosa[];
  faqItems: Faq[];
  videoTranscript: string;
  stepVisuals: { profile: string; vote: string };
};

const en: ComoCopy = {
  pageTitle: 'How it works',
  intro:
    'Cazatalentos is the Salta registry where a fan leaves a mark on a NOA artist before the line fills up — with a numbered entry and a deposit in the contract.',
  fourSteps: 'The four steps',
  fullExample: 'Full example',
  tryNumbers: 'Try with your numbers',
  glossary: 'Glossary',
  faq: 'FAQ',
  video: 'Video',
  transcript: 'Transcript',
  follow: 'Next',
  viewContract: 'View the contract on Monadscan',
  contractNote: '. Minimum 0.001 MON, 48-hour vote, 20% quorum and strict majority.',
  pasos: [
    {
      numero: 1,
      titulo: 'Discover an artist',
      accion: 'Open their profile and check pioneers and whether a pool is open.',
      plata: 'You are not moving money yet.',
    },
    {
      numero: 2,
      titulo: 'Mark “I was there first”',
      accion: 'Sign on-chain. The contract assigns the next entry number.',
      plata: 'You leave a deposit of at least the contract minimum. It stays custodied there, separate from the pool.',
    },
    {
      numero: 3,
      titulo: 'Receive the numbered entry',
      accion: 'You see your number and a weight based on how early you arrived.',
      plata: 'The deposit stays in the contract. You cannot withdraw while that artist has an active pool.',
    },
    {
      numero: 4,
      titulo: 'The goal is resolved',
      accion: 'The artist posts evidence and eligible pioneers vote. Then voting closes.',
      plata: 'If approved, you can claim a pool share by weight. If not, you do not earn from that pool.',
    },
  ],
  ejemplo: {
    artista: 'Lunar Zamba',
    ciudad: 'Cafayate',
    fan: 'Lucia',
    numero: 41,
    ticketDate: '2 Oct 2026',
    ticketMeta: 'The artist declares the goal in the contract',
    eventos: [
      { fecha: 'October 2', texto: 'Lucia finds Lunar Zamba on the board and opens the profile.' },
      { fecha: 'October 2', texto: 'She marks “I was there first” and the contract assigns entry Nº 041.' },
      {
        fecha: 'October 3',
        texto: 'Her deposit stays in the contract. The number is not bought or transferred on this page.',
      },
      {
        fecha: 'October 24',
        texto: 'The pool reaches its date. If the artist declared the goal, pioneer voting opens.',
      },
    ],
  },
  escenarios: {
    cumple:
      'If voting approves the goal, Lucia can claim a pool share proportional to her weight. Her deposit is separate: she withdraws it when the artist has no active pool.',
    noCumple:
      'If the goal is rejected or the deadline passes undeclared, Lucia does not earn from that pool. The artist can withdraw what they put in. Lucia’s deposit can be withdrawn when no active pool remains.',
  },
  glosario: [
    { termino: 'Pioneer', definicion: 'Someone who marked “I was there first” and received an entry number in the contract.' },
    { termino: 'Pool', definicion: 'The amount the artist deposits when opening a goal. It is not the sum of fan deposits.' },
    { termino: 'Goal', definicion: 'The milestone the artist declares and pioneers vote on with the evidence presented.' },
    { termino: 'Numbered entry', definicion: 'Your place in line. Assigned by the contract in the transaction and not sold on this site.' },
    { termino: 'Deposit', definicion: 'The money the fan leaves when signing. The contract keeps it apart from the pool.' },
    { termino: 'Quota', definicion: 'Who can vote and earn from a pool: those who already had a number when the pool opened.' },
    { termino: 'Wallet', definicion: 'The account you sign with. This page does not custody that account.' },
    { termino: 'Contract', definicion: 'The Monad program that stores deposits, numbers, votes and claims.' },
  ],
  faqItems: [
    {
      pregunta: 'How much money do I put in?',
      respuesta:
        'At least 0.001 MON. That minimum was set by the contract on Monad Testnet. The deposit stays apart from the pool.',
    },
    {
      pregunta: 'What do I receive?',
      respuesta:
        'An entry number and a weight. If a later pool is approved and you were already there when it opened, you can claim a share of that pool.',
    },
    {
      pregunta: 'When do I get paid?',
      respuesta: 'After voting closes and the pool is approved. Until then the deposit stays in the contract.',
    },
    {
      pregunta: 'Who decides if the artist met the goal?',
      respuesta:
        'The artist posts evidence and a 48-hour vote opens. Pioneers who were already there when the pool opened vote with their weight. You need 20% quorum of eligible weight and a strict majority: yes votes must beat half of votes cast. A 50/50 tie rejects.',
    },
    {
      pregunta: 'What if the goal is not met?',
      respuesta:
        'You do not earn from that pool. The artist can withdraw the pool amount. Your deposit can be withdrawn when there is no active pool.',
    },
    {
      pregunta: 'Can I withdraw my deposit?',
      respuesta:
        'Yes, via the contract function, only if that artist has no active pool. If one is open or in voting, withdrawal reverts.',
    },
    {
      pregunta: 'Can the entry be bought?',
      respuesta: 'Not on this site. The number comes from signing “I was there first,” and someone else can get ahead in the same line.',
    },
    {
      pregunta: 'Where is the money?',
      respuesta: 'In the contract, on Monad. This page only shows state and does not move funds on its own.',
    },
  ],
  videoTranscript:
    'Cazatalentos records who arrived first. You leave a deposit in the contract and get a number. If the artist opens a pool and pioneers approve the goal, you can claim a share of that pool. If not approved, you do not earn from the pool and withdraw your deposit when no active pool remains.',
  stepVisuals: {
    profile: 'Lunar Zamba profile · Cafayate',
    vote: 'Pioneer vote · 48 hours',
  },
};

const es: ComoCopy = {
  pageTitle: 'Cómo funciona',
  intro:
    'Cazatalentos es el registro de Salta donde un fan deja su marca en un artista del NOA antes de que se llene la fila, con una entrada numerada y un depósito en el contrato.',
  fourSteps: 'Los cuatro pasos',
  fullExample: 'Ejemplo completo',
  tryNumbers: 'Probá con tus números',
  glossary: 'Glosario',
  faq: 'Preguntas frecuentes',
  video: 'Video',
  transcript: 'Transcripción',
  follow: 'Seguir',
  viewContract: 'Ver el contrato en Monadscan',
  contractNote: '. Mínimo 0,001 MON, votación de 48 horas, quórum del 20% y mayoría estricta.',
  pasos: [
    {
      numero: 1,
      titulo: 'Descubrís un artista',
      accion: 'Entrás a su perfil y mirás si ya hay pioneros y si tiene un pozo abierto.',
      plata: 'Todavía no movés plata.',
    },
    {
      numero: 2,
      titulo: 'Marcás “Estuve antes”',
      accion: 'Firmás en la red. El contrato te asigna el siguiente número de entrada.',
      plata: 'Dejás un depósito de al menos el mínimo del contrato. Queda custodiado ahí, separado del pozo.',
    },
    {
      numero: 3,
      titulo: 'Recibís la entrada numerada',
      accion: 'Ves tu número y un peso según qué tan adelante llegaste.',
      plata: 'El depósito sigue en el contrato. No podés retirarlo mientras ese artista tenga un pozo activo.',
    },
    {
      numero: 4,
      titulo: 'Se resuelve la meta',
      accion: 'El artista presenta evidencia y los pioneros que ya estaban votan. Después se cierra la votación.',
      plata: 'Si se aprueba, podés reclamar una parte del pozo según tu peso. Si no, no cobrás de ese pozo.',
    },
  ],
  ejemplo: {
    artista: 'Zamba Lunar',
    ciudad: 'Cafayate',
    fan: 'Lucía',
    numero: 41,
    ticketDate: '2 oct 2026',
    ticketMeta: 'La meta la declara el artista en el contrato',
    eventos: [
      { fecha: '2 de octubre', texto: 'Lucía encuentra a Zamba Lunar en la cartelera y abre el perfil.' },
      { fecha: '2 de octubre', texto: 'Marca “Estuve antes” y el contrato le asigna la entrada Nº 041.' },
      {
        fecha: '3 de octubre',
        texto: 'Su depósito queda en el contrato. El número no se compra ni se transfiere en esta página.',
      },
      {
        fecha: '24 de octubre',
        texto: 'El pozo llega a su fecha. Si el artista declaró la meta, se abre la votación de los pioneros.',
      },
    ],
  },
  escenarios: {
    cumple:
      'Si la votación aprueba la meta, Lucía puede reclamar del pozo una parte proporcional a su peso. Su depósito es otra cosa: lo retira cuando el artista no tenga un pozo activo.',
    noCumple:
      'Si la meta se rechaza o el plazo vence sin declararse, Lucía no cobra de ese pozo. El artista puede retirar lo que él puso en el pozo. El depósito de Lucía se puede retirar cuando no quede un pozo activo.',
  },
  glosario: [
    { termino: 'Pionero', definicion: 'Quien marcó “Estuve antes” y recibió un número de entrada en el contrato.' },
    { termino: 'Pozo', definicion: 'El monto que el artista deposita al abrir una meta. No es la suma de los depósitos de los fans.' },
    { termino: 'Meta', definicion: 'El hito que el artista declara y que los pioneros votan con la evidencia que presente.' },
    { termino: 'Entrada numerada', definicion: 'El puesto en la fila. Lo asigna el contrato en la transacción y no se ofrece a la venta en esta web.' },
    { termino: 'Depósito', definicion: 'La plata que deja el fan al firmar. El contrato la guarda aparte del pozo.' },
    { termino: 'Cupo', definicion: 'Quiénes pueden votar y cobrar un pozo: quienes ya tenían número cuando el pozo se abrió.' },
    { termino: 'Wallet', definicion: 'La cuenta con la que firmás. La página no custodia esa cuenta.' },
    { termino: 'Contrato', definicion: 'El programa en Monad que guarda depósitos, números, votos y cobros.' },
  ],
  faqItems: [
    {
      pregunta: '¿Cuánto dinero pongo?',
      respuesta:
        'Al menos 0,001 MON. Ese mínimo lo fijó el contrato desplegado en Monad Testnet. El depósito queda aparte del pozo.',
    },
    {
      pregunta: '¿Qué recibo?',
      respuesta:
        'Un número de entrada y un peso. Si más adelante un pozo se aprueba y ya estabas cuando se abrió, podés reclamar una parte de ese pozo.',
    },
    {
      pregunta: '¿Cuándo cobro?',
      respuesta: 'Después de que la votación cierre y el pozo quede aprobado. Hasta entonces el depósito sigue en el contrato.',
    },
    {
      pregunta: '¿Quién decide si el artista cumplió la meta?',
      respuesta:
        'El artista presenta la evidencia y se abre una votación de 48 horas. Votan los pioneros que ya estaban cuando se abrió el pozo, cada uno con su peso. Hace falta quórum del 20% del peso elegible y mayoría estricta: los votos a favor tienen que superar la mitad de los votos emitidos. Un empate 50/50 se rechaza.',
    },
    {
      pregunta: '¿Qué pasa si no se cumple?',
      respuesta:
        'No cobrás de ese pozo. El artista puede retirar el monto del pozo. Tu depósito se puede retirar cuando no haya un pozo activo.',
    },
    {
      pregunta: '¿Puedo retirar mi depósito?',
      respuesta:
        'Sí, con la función del contrato, solo si ese artista no tiene un pozo activo. Si hay uno abierto o en votación, el retiro se rechaza.',
    },
    {
      pregunta: '¿La entrada se puede comprar?',
      respuesta: 'No en esta web. El número sale de firmar “Estuve antes” y otro puede adelantarse en la misma fila.',
    },
    {
      pregunta: '¿Dónde está la plata?',
      respuesta: 'En el contrato, en Monad. Esta página solo muestra el estado y no mueve fondos por su cuenta.',
    },
  ],
  videoTranscript: VIDEO_ES.transcripcion,
  stepVisuals: {
    profile: 'Perfil de Zamba Lunar · Cafayate',
    vote: 'Votación de pioneros · 48 horas',
  },
};

export function getComoFunciona(locale: Locale): ComoCopy {
  return locale === 'es' ? es : en;
}

export { CONTRATO_DESPLEGADO, SIMULADOR_CONFIG, SIMULADOR_HABILITADO };
