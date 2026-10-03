import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { parseEther } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { fetchArtistPools, fetchArtistProfile } from '../lib/api';
import { ActionButton } from '../components/ActionButton';
import { ArtistHeader } from '../components/ArtistHeader';
import { BeliefCard } from '../components/BeliefCard';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PoolCard } from '../components/PoolCard';
import { PoolOpeningForm } from '../components/PoolOpeningForm';
import { RegisterArtistModal } from '../components/RegisterArtistModal';
import { formatMON, shortAddress } from '../lib/format';
import { useArtist, useMinStake, useRecentRegisteredArtist, useSignBelief, useSupporter } from '../lib/hooks';

const GAS_BUFFER = parseEther('0.001');

function parseArtistId(raw: string | undefined): bigint | undefined {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  try {
    const value = BigInt(raw);
    return value > 0n ? value : undefined;
  } catch {
    return undefined;
  }
}

export function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const artistId = parseArtistId(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [poolFormOpen, setPoolFormOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const { ready, authenticated, login } = usePrivy();
  const { address, isConnected } = useAccount();
  const minStake = useMinStake();
  const recentMine = useRecentRegisteredArtist(address);

  const {
    data: artistRaw,
    isLoading: artistLoading,
    isError: artistError,
    refetch: refetchArtist,
  } = useArtist(artistId);

  const {
    data: supporterRaw,
    refetch: refetchSupporter,
  } = useSupporter(artistId, isConnected ? address : undefined);

  const { data: balance } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const { sign, isPending, isConfirming, isSuccess, error: signError, reset } = useSignBelief();

  const artist = artistRaw;
  const supporter = supporterRaw;
  const profileQuery = useQuery({
    queryKey: ['artist-profile', artistId?.toString()],
    queryFn: () => fetchArtistProfile(Number(artistId)),
    enabled: artistId !== undefined,
  });
  const profile = profileQuery.data ?? null;
  const poolsQuery = useQuery({
    queryKey: ['artist-pools', artistId?.toString()],
    queryFn: () => fetchArtistPools(Number(artistId)),
    enabled: artistId !== undefined,
  });

  useEffect(() => {
    if (!isSuccess) return;
    void refetchArtist();
    void refetchSupporter();
  }, [isSuccess, refetchArtist, refetchSupporter]);

  if (artistId === undefined) {
    return (
      <ErrorState
        title="Ese artista no existe."
        message="El link tiene que terminar con un número de artista válido."
      />
    );
  }

  if (artistLoading) {
    return <LoadingState label="Buscando al artista…" />;
  }

  if (artistError || !artist || !artist.exists) {
    return (
      <ErrorState
        title="No encontramos ese artista"
        message="Puede que el link esté mal o que el perfil no exista todavía."
        onRetry={() => {
          void refetchArtist();
        }}
      />
    );
  }

  const hasBelief = Boolean(supporter && supporter.rank > 0);
  const balanceIsTooLow =
    minStake !== undefined &&
    balance !== undefined &&
    balance.value < minStake + GAS_BUFFER;

  const displayName = profile?.displayName ?? artist.metadataURI;
  const linkEntries = profile?.links ? Object.entries(profile.links) : [];
  const isOwner = Boolean(
    address && artist.owner && address.toLowerCase() === artist.owner.toLowerCase(),
  );
  const pools = [...(poolsQuery.data ?? [])].sort(
    (left, right) => new Date(right.deadline).getTime() - new Date(left.deadline).getTime(),
  );

  return (
    <section className="space-y-6 pt-4">
      <ArtistHeader name={displayName} supporterCount={artist.supporterCount} />

      {authenticated &&
      recentMine.data !== undefined &&
      recentMine.data !== null &&
      artistId !== undefined &&
      recentMine.data !== artistId ? (
        <Link
          to={`/artist/${recentMine.data.toString()}`}
          className="block text-sm text-ocre-600 underline"
        >
          Tu perfil ya está creado →
        </Link>
      ) : authenticated && !isOwner ? (
        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="block text-left text-sm text-ocre-600 underline"
        >
          ¿Sos artista? Creá tu perfil →
        </button>
      ) : null}

      {profile?.photo ? (
        <img
          src={profile.photo}
          alt={displayName}
          className="h-40 w-full rounded-lg object-cover"
        />
      ) : null}
      {profile?.bio ? <p className="text-base text-tierra-700">{profile.bio}</p> : null}
      {linkEntries.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {linkEntries.map(([label, href]) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer" className="text-ocre-600 underline">
                {label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {isOwner ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-tierra-900">Mis pozos</h2>
          </div>
          {poolsQuery.isLoading ? <LoadingState label="Buscando pozos…" /> : null}
          {!poolsQuery.isLoading && pools.length === 0 ? (
            <p className="text-sm text-tierra-700">Todavía no abriste ningún pozo.</p>
          ) : null}
          <div className="space-y-3">
            {pools.map((pool) => (
              <Link key={pool.id} to={`/pool/${pool.id}`} className="block">
                <PoolCard pool={pool} />
              </Link>
            ))}
          </div>
          {artist.supporterCount === 0 ? (
            <p className="text-sm text-tierra-700">
              Cuando alguien deje su marca, vas a poder abrir un pozo de recompensa.
            </p>
          ) : (
            <ActionButton label="Abrir pozo de recompensa" onClick={() => setPoolFormOpen(true)} />
          )}
        </section>
      ) : null}

      {hasBelief && supporter && !isOwner ? (
        <BeliefCard
          artistId={artistId}
          artistName={displayName}
          supporter={supporter}
          totalSupporters={artist.supporterCount}
        />
      ) : null}

      {!hasBelief && !isOwner ? (
        <div className="space-y-4">
          <p className="text-base text-tierra-700">
            Si estuviste antes de que esto se haga grande, este es el momento de dejarlo escrito.
          </p>

          {!authenticated ? (
            <ActionButton
              label="Entrar para dejar mi marca"
              onClick={() => login()}
              disabled={!ready}
            />
          ) : (
            <>
              {balanceIsTooLow ? (
                <div className="space-y-2 rounded-lg border border-ocre-400 bg-ocre-500/10 p-4">
                  <p className="text-sm font-medium text-tierra-900">
                    Necesitás un poco de MON para dejar tu marca.
                  </p>
                  <p className="text-xs text-tierra-700">
                    Tu dirección: {shortAddress(address ?? '')}. Copiala y pedí MON en el faucet de
                    Monad.
                  </p>
                  <a
                    href="https://faucet.monad.xyz"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs text-ocre-600 underline"
                  >
                    Ir al faucet →
                  </a>
                </div>
              ) : null}

              <ActionButton
                label={
                  minStake !== undefined
                    ? `Dejar mi marca (depósito ${formatMON(minStake)})`
                    : 'Dejar mi marca'
                }
                onClick={() => {
                  reset();
                  void sign(artistId).catch(() => undefined);
                }}
                disabled={
                  isPending || isConfirming || minStake === undefined || balanceIsTooLow
                }
                loading={isPending || isConfirming}
              />

              {signError ? (
                <p className="text-sm text-vino-700">
                  No se pudo registrar la marca. Probá de nuevo en un momento.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {isSuccess ? (
        <p className="text-sm text-ocre-600">Listo. Tu marca quedó registrada.</p>
      ) : null}

      <RegisterArtistModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={(newArtistId) => {
          setRegisterOpen(false);
          if (newArtistId !== undefined) {
            void navigate(`/artist/${newArtistId.toString()}`);
            return;
          }
          window.location.reload();
        }}
      />

      {poolFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-tierra-900/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="open-pool-title"
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="open-pool-title" className="font-serif text-2xl text-tierra-900">
                Abrir pozo de recompensa
              </h2>
              <button type="button" onClick={() => setPoolFormOpen(false)} className="text-sm text-tierra-700">
                Cerrar
              </button>
            </div>
            <PoolOpeningForm
              artistId={artistId}
              onSuccess={() => {
                void queryClient.invalidateQueries({ queryKey: ['artist-pools', artistId.toString()] });
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
