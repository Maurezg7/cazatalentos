export type SimConfig = {
  depositoMinWei: bigint;
  depositoMaxWei: bigint;
  cupo: number;
  comisionBps: number;
};

export type SimInput = {
  depositoWei: bigint;
  entrada: number;
  pozoWei: bigint;
  pesoTotal: bigint;
  seCumple: boolean;
};

export type SimOk = {
  ok: true;
  peso: number;
  partePozoWei: bigint;
  comisionWei: bigint;
  depositoWei: bigint;
};

export type SimError = { ok: false; campo: 'deposito' | 'entrada' | 'pozo'; mensaje: string };

export function pesoPorEntrada(entrada: number): number {
  if (entrada <= 10) return 5;
  if (entrada <= 50) return 3;
  if (entrada <= 200) return 2;
  return 1;
}

export function simularEntrada(input: SimInput, config: SimConfig): SimOk | SimError {
  if (input.depositoWei < config.depositoMinWei) {
    return { ok: false, campo: 'deposito', mensaje: 'El depósito está por debajo del mínimo de ejemplo.' };
  }
  if (input.depositoWei > config.depositoMaxWei) {
    return { ok: false, campo: 'deposito', mensaje: 'El depósito supera el máximo de ejemplo.' };
  }
  if (!Number.isInteger(input.entrada) || input.entrada < 1 || input.entrada > config.cupo) {
    return { ok: false, campo: 'entrada', mensaje: 'La entrada tiene que ser un entero entre 1 y el cupo.' };
  }
  if (input.pozoWei < 0n || input.pesoTotal <= 0n) {
    return { ok: false, campo: 'pozo', mensaje: 'El pozo de ejemplo no se puede repartir.' };
  }
  const peso = pesoPorEntrada(input.entrada);
  const partePozoWei = input.seCumple ? (input.pozoWei * BigInt(peso)) / input.pesoTotal : 0n;
  const comisionWei = (input.depositoWei * BigInt(config.comisionBps)) / 10_000n;
  return { ok: true, peso, partePozoWei, comisionWei, depositoWei: input.depositoWei };
}
