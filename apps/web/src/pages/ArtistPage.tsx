import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { parseEther } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { fetchArtistPools, fetchArtistProfile, mediaUrl } from '../lib/api';
import { ActionButton } from '../components/ActionButton';
import { Icon } from '../components/Icon';
import { useEntrySheet } from '../components/EntrySheet';
import { ArtistHeader, CoverMedia } from '../components/ArtistHeader';
import { ArtistStudio } from '../components/ArtistStudio';
import { BeliefCard } from '../components/BeliefCard';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PoolCard } from '../components/PoolCard';
import { PoolOpeningForm } from '../components/PoolOpeningForm';
import { RegisterArtistModal } from '../components/RegisterArtistModal';
import { PrintTicket } from '../effects/PrintTicket';
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

  const { ready, authenticated } = usePrivy();
  const { openEntry } = useEntrySheet();
  const { address, isConnected } = useAccount();
  const minStake = useMinStake();
  const recentMine = useRecentRegisteredArtist(address);

  const {
    data: artistRaw,
    isLoading: artistLoading,
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

  const onChain = artist?.exists ? artist : null;
  const waiting = !profile && !onChain && (profileQuery.isLoading || artistLoading);

  if (waiting) {
    return <LoadingState label="Buscando al artista…" />;
  }

  if (!profile && !onChain) {
    return (
      <ErrorState
        title="No encontramos ese artista"
        message="Puede que el link esté mal o que el perfil no exista todavía."
        onRetry={() => {
          void refetchArtist();
          void profileQuery.refetch();
        }}
      />
    );
  }

  const hasBelief = Boolean(supporter && supporter.rank > 0);
  const balanceIsTooLow =
    minStake !== undefined &&
    balance !== undefined &&
    balance.value < minStake + GAS_BUFFER;

  const displayName = profile?.displayName ?? onChain?.metadataURI ?? 'Artista';
  const supporterCount = onChain?.supporterCount ?? profile?.supporterCount ?? 0;
  const owner = onChain?.owner ?? profile?.owner ?? '';
  const linkEntries = profile?.links ? Object.entries(profile.links) : [];
  const isOwner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const pools = [...(poolsQuery.data ?? [])].sort(
    (left, right) => new Date(right.deadline).getTime() - new Date(left.deadline).getTime(),
  );

  return (
    <section className="flex flex-col pb-6 pt-4 lg:pb-10 lg:pt-8">
      <div
        className="w-full overflow-hidden rounded-3xl border border-[#3c4626] text-[#e3e8d8] shadow-2xl"
        style={{
          background: `linear-gradient(180deg, ${profile?.bioWash ?? '#1c3a28'} 0%, #14180f 340px, #14180f 100%)`,
        }}
      >
        <CoverMedia src={mediaUrl(profile?.cover)} name={displayName} wash={profile?.bioWash ?? null} />

        <div className="px-4 pb-6 md:px-8 md:pb-8">
          <ArtistHeader
            artistId={artistId}
            name={displayName}
            bio={profile?.bio ?? null}
            bioWash={profile?.bioWash ?? null}
            bioInk={profile?.bioInk ?? null}
            nameFont={profile?.nameFont ?? null}
            country={profile?.country ?? null}
            region={profile?.region ?? null}
            photo={mediaUrl(profile?.photo)}
            isOwner={isOwner}
            ownerAddress={address}
            supporterCount={supporterCount}
            poolCount={pools.length}
            accent={profile?.bioInk ?? null}
          />

          {linkEntries.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {linkEntries.map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center rounded-full border border-[#414d2b] bg-[#1c2416] px-4 font-mono text-[0.6875rem] text-[#d6debe] transition-colors hover:border-[#8ea459] hover:text-[#f5f7ee]"
                  >
                    {prettyLinkLabel(label)}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ArtistStudio
                artistId={Number(artistId)}
                ownerAddress={address}
                isOwner={isOwner}
                bio={profile?.bio ?? null}
                bioWash={profile?.bioWash ?? null}
                bioInk={profile?.bioInk ?? null}
                nameFont={profile?.nameFont ?? null}
                displayName={displayName}
                country={profile?.country ?? null}
                region={profile?.region ?? null}
                photo={mediaUrl(profile?.photo)}
                cover={mediaUrl(profile?.cover)}
                onProfileSaved={() => {
                  void profileQuery.refetch();
                }}
              />
            </div>

            <div className="flex flex-col gap-6 lg:col-span-5">
            {hasBelief && supporter && !isOwner ? (
              <BeliefCard
                artistId={artistId}
                artistName={displayName}
                supporter={supporter}
                totalSupporters={supporterCount}
              />
            ) : null}

            {!onChain && profile ? (
              <p className="rounded-2xl border border-[#434e2b] bg-[#21281a] p-4 text-sm text-[#a8b393]">
                Este perfil está en el registro. La marca en el contrato se habilita cuando el artista quede publicado en la red.
              </p>
            ) : null}

            {!hasBelief && !isOwner && onChain ? (
              <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#434e2b] bg-[#21281a] p-4 lg:p-6">
                {!authenticated ? (
                  <ActionButton
                    label="Entrar para dejar mi marca"
                    onClick={() => openEntry()}
                    disabled={!ready}
                  />
                ) : (
                  <>
                    {balanceIsTooLow ? (
                      <div className="space-y-2 rounded-xl border border-ocre-400 bg-ocre-500/10 p-4">
                        <p className="text-sm font-medium text-[#f5f7ee]">
                          Necesitás un poco de MON para dejar tu marca.
                        </p>
                        <p className="text-xs text-[#a8b393]">
                          Tu dirección: {shortAddress(address ?? '')}. Copiala y pedí MON en el
                          faucet de Monad.
                        </p>
                        <a
                          href="https://faucet.monad.xyz"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center text-xs text-tertiary underline"
                        >
                          Ir al faucet <Icon name="arrow-right" className="ml-1 inline h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : null}

                    <ActionButton
                      label="Dejar mi marca"
                      onClick={() => {
                        reset();
                        void sign(artistId).catch(() => undefined);
                      }}
                      disabled={
                        isPending || isConfirming || minStake === undefined || balanceIsTooLow
                      }
                      loading={isPending || isConfirming}
                    />
                  </>
                )}
                <p className="text-center font-mono text-[0.6875rem] text-[#879373]">
                  {minStake !== undefined
                    ? `Depósito de respaldo: ${formatMON(minStake)} MON + costo de red.`
                    : 'Depósito de respaldo + costo de red.'}
                </p>
                {signError ? (
                  <p className="text-sm text-vino-700">{signError.userMessage}</p>
                ) : null}
                {isSuccess ? <PrintTicket confirmed rank={supporter?.rank || 1} /> : null}
              </div>
            ) : null}

            {isOwner ? (
              <section className="rounded-2xl border-[3px] border-[#434e2b] bg-[#21281a] p-4 shadow-xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#333e21] pb-3">
                  <h2 className="font-serif text-2xl font-semibold italic text-[#f5f7ee]">
                    Mis pozos
                  </h2>
                  {supporterCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setPoolFormOpen(true)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#8ea459] bg-[#5c6b3a] px-3.5 py-2 font-mono text-[0.6875rem] font-bold tracking-wide text-[#12160d] transition-colors hover:bg-[#6c7d44]"
                    >
                      Abrir un pozo
                    </button>
                  ) : null}
                </div>

                {poolsQuery.isLoading ? <LoadingState label="Buscando pozos…" /> : null}
                {!poolsQuery.isLoading && pools.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[#192013] p-6 text-center">
                    <p className="font-serif text-xl italic text-[#f5f7ee]">
                      Todavía no abriste ningún pozo
                    </p>
                    <p className="max-w-[280px] text-xs text-[#a8b393]">
                      Los pozos reúnen depósitos de respaldo para tus próximos discos, giras o
                      instrumentos.
                    </p>
                    {supporterCount === 0 ? (
                      <p className="text-xs text-[#a8b393]">
                        Cuando alguien deje su marca, vas a poder abrir un pozo de recompensa.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-col gap-3">
                  {pools.map((pool) => (
                    <Link key={pool.id} to={`/pool/${pool.id}`} className="block">
                      <PoolCard pool={pool} />
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {authenticated &&
            recentMine.data !== undefined &&
            recentMine.data !== null &&
            artistId !== undefined &&
            recentMine.data !== artistId ? (
              <Link
                to={`/artist/${recentMine.data.toString()}`}
                className="flex min-h-11 items-center justify-center gap-1 text-sm text-tertiary hover:underline"
              >
                Tu perfil ya está creado <Icon name="arrow-right" className="h-3.5 w-3.5" />
              </Link>
            ) : authenticated && !isOwner ? (
              <button
                type="button"
                onClick={() => setRegisterOpen(true)}
                className="flex min-h-11 w-full items-center justify-center gap-1 text-sm text-tertiary hover:underline"
              >
                ¿Sos artista? Creá tu perfil <Icon name="arrow-right" className="h-3.5 w-3.5" />
              </button>
            ) : null}
            </div>
          </div>
        </div>
      </div>

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
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="open-pool-title"
            className="relative max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border-[3px] border-[#5c6b3a] bg-[#202718] p-6 text-[#e3e8d8] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#384524] pb-3">
              <h2 id="open-pool-title" className="font-serif text-2xl font-semibold italic text-[#f5f7ee]">
                Abrir un pozo
              </h2>
              <button
                type="button"
                onClick={() => setPoolFormOpen(false)}
                aria-label="Cerrar"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#3b4725] bg-[#181d13] text-[#8e9a7a] hover:text-[#f4f7ee]"
              >
                <Icon name="x" className="h-4 w-4" />
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

function prettyLinkLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 0) return 'Link';
  return trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1);
}
