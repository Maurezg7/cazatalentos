# Deployment

## Monad Testnet (chainId 10143)

| Campo | Valor |
|-------|-------|
| **Cazatalentos** | [`0x899c15654d9ffA753eD0C008831f41F3473B40d1`](https://testnet.monadscan.com/address/0x899c15654d9ffA753eD0C008831f41F3473B40d1) |
| **Deployer** | `0xF8Cc6b0F3e1F75228C16A8A391Bd95a2D4588083` (solo testnet; no reutilizar) |
| **Tx hash** | `0x5ad28de7a8c64e44b0976e7fafc4ef570ff5de4609f02d7d391220611b98d737` |
| **Block** | 67864749 |
| **Gas pagado** | 0.29893999000290233 MON |
| **Explorer** | https://testnet.monadscan.com/address/0x899c15654d9ffA753eD0C008831f41F3473B40d1 |
| **Broadcast** | `contracts/broadcast/Deploy.s.sol/10143/run-latest.json` |
| **Fecha** | 2026-10-03 |

### Parámetros del constructor

| Parámetro | Valor |
|-----------|-------|
| `MIN_STAKE` | 0.001 ether |
| `VOTE_WINDOW` | 48 hours |
| `MAX_POOL_DURATION` | 90 days |
| `QUORUM_BPS` | 2000 (20%) |
| `APPROVAL_BPS` | 5000 (50%) |

## Verificación en explorer

Intento de `forge verify-contract` falló con `Invalid API URL endpoint`. Monadscan
no expone endpoint compatible con Blockscout verifier. Pendiente para Fase 7:
verificación manual desde
https://testnet.monadscan.com/address/0x899c15654d9ffA753eD0C008831f41F3473B40d1/verify

