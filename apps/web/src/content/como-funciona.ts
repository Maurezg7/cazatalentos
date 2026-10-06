// El archivo fuente-como-funciona.md no estaba en el repo.
// Este texto sigue el contrato Cazatalentos.sol. Lo marcado TODO(validar) no es definitivo.

export const INTRODUCCION =
  'Cazatalentos es el registro de Salta donde un fan deja su marca en un artista del NOA antes de que se llene la fila, con una entrada numerada y un depósito en el contrato.';

export const PASOS = [
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
] as const;

export const EJEMPLO = {
  artista: 'Zamba Lunar',
  ciudad: 'Cafayate',
  fan: 'Lucía',
  numero: 41,
  eventos: [
    { fecha: '2 de octubre', texto: 'Lucía encuentra a Zamba Lunar en la cartelera y abre el perfil.' },
    { fecha: '2 de octubre', texto: 'Marca “Estuve antes” y el contrato le asigna la entrada Nº 041.' },
    { fecha: '3 de octubre', texto: 'Su depósito queda en el contrato. El número no se compra ni se transfiere en esta página.' },
    { fecha: '24 de octubre', texto: 'El pozo llega a su fecha. Si el artista declaró la meta, se abre la votación de los pioneros.' },
  ],
};

export const ESCENARIOS = {
  cumple:
    'Si la votación aprueba la meta, Lucía puede reclamar del pozo una parte proporcional a su peso. Su depósito es otra cosa: lo retira cuando el artista no tenga un pozo activo.',
  noCumple:
    'Si la meta se rechaza o el plazo vence sin declararse, Lucía no cobra de ese pozo. El artista puede retirar lo que él puso en el pozo. El depósito de Lucía se puede retirar cuando no quede un pozo activo.',
};

export const GLOSARIO = [
  { termino: 'Pionero', definicion: 'Quien marcó “Estuve antes” y recibió un número de entrada en el contrato.' },
  { termino: 'Pozo', definicion: 'El monto que el artista deposita al abrir una meta. No es la suma de los depósitos de los fans.' },
  { termino: 'Meta', definicion: 'El hito que el artista declara y que los pioneros votan con la evidencia que presente.' },
  { termino: 'Entrada numerada', definicion: 'El puesto en la fila. Lo asigna el contrato en la transacción y no se ofrece a la venta en esta web.' },
  { termino: 'Depósito', definicion: 'La plata que deja el fan al firmar. El contrato la guarda aparte del pozo.' },
  { termino: 'Cupo', definicion: 'Quiénes pueden votar y cobrar un pozo: quienes ya tenían número cuando el pozo se abrió.' },
  { termino: 'Wallet', definicion: 'La cuenta con la que firmás. La página no custodia esa cuenta.' },
  { termino: 'Contrato', definicion: 'El programa en Monad que guarda depósitos, números, votos y cobros.' },
];

export const FAQ = [
  {
    pregunta: '¿Cuánto dinero pongo?',
    respuesta: 'Al menos el mínimo que fijó el despliegue del contrato. Esta página no publica ese número como definitivo.',
  },
  {
    pregunta: '¿Qué recibo?',
    respuesta: 'Un número de entrada y un peso. Si más adelante un pozo se aprueba y ya estabas cuando se abrió, podés reclamar una parte de ese pozo.',
  },
  {
    pregunta: '¿Cuándo cobro?',
    respuesta: 'Después de que la votación cierre y el pozo quede aprobado. Hasta entonces el depósito sigue en el contrato.',
  },
  {
    pregunta: '¿Quién decide si el artista cumplió la meta?',
    respuesta: 'El artista presenta la evidencia. Votan los pioneros que ya estaban cuando se abrió el pozo, cada uno con su peso. Quórum y mayoría son parámetros del contrato desplegado, no de esta página.',
  },
  {
    pregunta: '¿Qué pasa si no se cumple?',
    respuesta: 'No cobrás de ese pozo. El artista puede retirar el monto del pozo. Tu depósito se puede retirar cuando no haya un pozo activo.',
  },
  {
    pregunta: '¿Puedo retirar mi depósito?',
    respuesta: 'Sí, con la función del contrato, solo si ese artista no tiene un pozo activo. Si hay uno abierto o en votación, el retiro se rechaza.',
  },
  {
    pregunta: '¿La entrada se puede comprar?',
    respuesta: 'No en esta web. El número sale de firmar “Estuve antes” y otro puede adelantarse en la misma fila.',
  },
  {
    pregunta: '¿Dónde está la plata?',
    respuesta: 'En el contrato, en Monad. Esta página solo muestra el estado y no mueve fondos por su cuenta.',
  },
];

export const VIDEO = {
  src: null as string | null,
  poster: null as string | null,
  transcripcion:
    'Cazatalentos anota quién llegó antes. Dejás un depósito en el contrato y recibís un número. Si el artista abre un pozo y los pioneros aprueban la meta, podés reclamar una parte de ese pozo. Si no se aprueba, no cobrás del pozo y tu depósito se retira cuando no haya un pozo activo.',
};

// TODO(validar): el contrato desplegado no está leído desde la página; mínimo, quórum y mayoría son inmutables del deploy.
export const SIMULADOR_CONFIG = {
  depositoMinWei: 1_000_000_000_000_000n,
  depositoMaxWei: 1_000_000_000_000_000_000n,
  cupo: 500,
  comisionBps: 0,
  pozoEjemploWei: 10_000_000_000_000_000n,
  pesoTotalEjemplo: 100n,
};

export const SIMULADOR_HABILITADO = import.meta.env.DEV && import.meta.env.VITE_SIMULADOR === '1';
