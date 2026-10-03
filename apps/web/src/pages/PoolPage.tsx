import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAccount, useBlock } from 'wagmi';
import { fetchPool } from '../lib/api';
import { DeclareMilestoneForm } from '../components/DeclareMilestoneForm';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { formatDeadline, formatMON, poolStatusLabel } from '../lib/format';
import { useArtist, usePool } from '../lib/hooks';

function parsePoolId(raw: string | undefined): bigint | undefined {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  try {
    const value = BigInt(raw);
    return value > 0n ? value : undefined;
  } catch {
    return undefined;
  }
}

export function PoolPage() {
  const { id } = useParams<{ id: string }>();
  const poolId = parsePoolId(id);
  const { address } = useAccount();
  const { data: block } = useBlock();
  const chain = usePool(poolId);
  const artistId = chain.pool?.artistId;
  const artistQuery = useArtist(artistId);
  const profileQuery = useQuery({
    queryKey: ['pool', id],
    queryFn: () => fetchPool(Number(poolId)),
    enabled: poolId !== undefined,
  });

  if (poolId === undefined) {
    return (
      <ErrorState
        title="Ese pozo no existe."
        message="El link tiene que terminar con un número de pozo válido."
      />
    );
  }

  if (chain.isLoading) {
    return <LoadingState label="Buscando el pozo…" />;
  }

  if (chain.isError || !chain.pool) {
    return (
      <ErrorState
        title="No encontramos ese pozo"
        message="Puede que el link esté mal o que todavía no esté confirmado."
        onRetry={() => {
          void chain.refetch();
        }}
      />
    );
  }

  const pool = chain.pool;
  const artist = artistQuery.data;
  const isOwner = Boolean(
    address && artist?.exists && address.toLowerCase() === artist.owner.toLowerCase(),
  );
  const canDeclare =
    pool.status === 0 && block !== undefined && block.timestamp < pool.deadline && isOwner;
  const description = profileQuery.data?.milestoneDescription;

  return (
    <section className="space-y-6 pt-4">
      <header className="space-y-2">
        <p className="text-sm text-tierra-700">Pozo de recompensa</p>
        <h1 className="font-serif text-3xl text-tierra-900">{poolStatusLabel(pool.status)}</h1>
      </header>

      <p className="font-serif text-4xl text-tierra-900">{formatMON(pool.amount)} MON</p>

      <p className="text-base text-tierra-900">
        {description ?? (profileQuery.isLoading ? 'Buscando la descripción…' : 'Sin descripción')}
      </p>

      <p className="text-sm text-tierra-700">Fecha límite: {formatDeadline(pool.deadline)}</p>

      {canDeclare ? (
        <DeclareMilestoneForm
          poolId={poolId}
          onSuccess={() => {
            void chain.refetch();
            void profileQuery.refetch();
          }}
        />
      ) : null}

      {pool.status === 1 ? (
        <p className="text-sm text-tierra-900">
          Votación en curso, termina el {formatDeadline(pool.voteEnd)}.
        </p>
      ) : null}

      <Link to={`/artist/${pool.artistId.toString()}`} className="inline-block text-sm text-ocre-600 underline">
        Volver al artista
      </Link>
    </section>
  );
}
