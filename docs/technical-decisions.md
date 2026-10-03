# Decisiones técnicas — Cazatalentos

Registro de decisiones de diseño del protocolo on-chain (Fase 1–2) y de hallazgos de análisis estático aceptados a propósito.

## Contratos

### Sin proxy, sin owner, sin admin

Un solo contrato inmutable.

| | |
|---|---|
| **Costo** | Un bug no se puede parchear. |
| **Beneficio** | Superficie de ataque mínima. |
| **Mitigación** | Tests exhaustivos (87+ tests, 6 invariantes) e inmutabilidad de las reglas de negocio. |

### Pull payments y dust

Los pagos son uno a uno (`claimReward`, `reclaimPool`, `withdrawStake`). El polvo de redondeo (`amount * weight % totalWeightAtOpen`) queda en el contrato y no se redistribuye.

**Por qué:** evita loops on-chain y complejidad adicional. Los montos son chicos y el polvo es despreciable.

### Snapshot con suma analítica

`totalWeightAtOpen` se computa con aritmética de tramos (`weightSumUpTo`, O(1)) en lugar de iterar sobre firmantes. Los firmantes posteriores al `openPool` no pueden votar ni cobrar.

**Por qué:** protege a los pioneros de la dilución.

### `withdrawStake` bloqueado por pozos activos

Un pozo está activo si su status es `Open` o `Claimed`. Una vez finalizado (`Approved` o `Rejected`) o reclamado, el contador `_activePoolsByArtist` decrece y los retiros se desbloquean. El rango persiste tras el retiro.

### Aprobación estricta

| Regla | Fórmula |
|-------|---------|
| Aprobación | `votesFor * 10_000 > totalVotes * APPROVAL_BPS` (desigualdad estricta) |
| Empate 50/50 | Se rechaza |
| Quórum | `totalVotes >= (totalWeightAtOpen * QUORUM_BPS) / 10_000` (20% del peso elegible con los params de deploy) |

## Off-chain metadata (`metadataURI`)

On-chain, `Artist.metadataURI` apunta a datos editables fuera del contrato.

| Caso | Valor | Comportamiento del frontend |
|------|-------|-----------------------------|
| Legacy (artista 1 actual) | String literal, p. ej. `"Los Copleros del Valle"` | Fallback: mostrar la string como nombre |
| Fase 4+ | URL del backend, p. ej. `https://api.cazatalentos.xyz/artists/1` | Resolver JSON `{ name, photo, bio, links }` |

**Por qué:** el nombre, la foto y la bio se pueden editar sin tocar el contrato. Los artistas ya registrados con string cruda siguen siendo válidos; el frontend debe soportar ambos formatos.

## Hallazgos de Slither aceptados (Low / Informational)

| Hallazgo | Decisión |
|----------|----------|
| **incorrect-equality** en `poolOf` | `_pools[poolId].artistId == 0` es un check de existencia, no de balance. Falso positivo. |
| **timestamp** (×6) | Uso intencional de `block.timestamp` para deadlines y ventanas de votación. La manipulación de validadores (~12s) es despreciable contra ventanas de 48h. |
| **low-level-calls** (×3) | `call{value}` con CEI estricto + `nonReentrant` de OpenZeppelin. Práctica estándar. |
| **naming-convention** (×5) | Inmutables en `SCREAMING_CASE` es convención estándar (OpenZeppelin, Uniswap). Falso positivo. |

## Hallazgos de Foundry lint

| Hallazgo | Decisión |
|----------|----------|
| **block-timestamp** (×5) | Esperados; misma justificación que Slither `timestamp`. |
| **reentrancy-eth** (×3) | Falso positivo: Foundry lint no entiende `ReentrancyGuard`. Silenciados con `// forge-lint: disable-next-line`. |
| **environment-read-across-mutation** | Cosmético, en tests. No bloqueante. |
