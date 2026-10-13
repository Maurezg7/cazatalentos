# Script — Full app demo (English, dark mode)

Video: [`cazatalentos-demo.mp4`](./cazatalentos-demo.mp4)  
Length: **~2:18** · 1280×720 · H.264 · **silent** · **dark mode** · **UI in English**  
Voiceover: [`VOZ-EN-OFF.txt`](./VOZ-EN-OFF.txt)

Live data (Monad testnet):
- Pool **#1** Mauro — **Approved**
- Pool **#2** Mauro — closed / reclaimed
- Pool **#3** Valley Copleros — **Open** · 0.01 MON · 2 pioneers

## Scenes

| Time (approx.) | Screen | What to show |
|----------------|--------|--------------|
| `00:00 – 00:25` | Home + open pools | “You believed first…” · open pools |
| `00:25 – 00:50` | `/artist/1` | Valley Copleros · leave my mark |
| `00:50 – 01:10` | `/pool/1` | Approved · claim path · Simulate +48h (EN) |
| `01:10 – 01:25` | `/pool/2` | Closed / reclaimed pool |
| `01:25 – 01:45` | `/pool/3` | Open pool · 0.01 MON · 2 pioneers |
| `01:45 – 02:00` | Explore + How it works | Board + four steps |
| `02:00 – end` | Mauro + EN/ES | Profile · language toggle · home |

## Voiceover (English)

### By scene

**[00:00] Home**  
Cazatalentos is the registry of who believed first. Open pools show how much each artist raised and how long they still accept marks.

**[00:25] Fan — leave a mark**  
As a fan you open an artist profile and leave your mark. The minimum deposit is 0.001 MON — it stays in the contract and gives you a pioneer number.

**[00:50] Approved pool**  
If the milestone is approved, pioneers can claim their share of the pool. Consensus stays settled on-chain.

**[01:10] Closed pool**  
If the milestone is not met, the artist can reclaim the pool. That outcome is recorded too.

**[01:25] Open pool**  
Here is a freshly opened on-chain pool: amount in MON, closing date, and pioneers already counted.

**[01:45] Explore / How it works**  
Explore artists by city and pool status. The flow is simple: discover, leave a mark, get your entry, and vote the milestone.

**[02:00] Profile + language**  
Artists upload their own photo, cover and reels. The app runs in English by default and switches to Spanish anytime. You believed first — it stayed on-chain.

### Single take (full VO)

> Cazatalentos is the registry of who believed first. As a fan you leave a mark with a small deposit and get a pioneer number. If the milestone is approved, you claim your share of the pool. As an artist you open an on-chain pool with a goal and a deadline — if it fails, you can reclaim it. Explore artists from the NOA, switch the app between English and Spanish, and keep every mark on Monad. You believed first — it stayed on-chain.

## Re-record

```bash
pnpm --filter @cazatalentos/api dev
pnpm --filter @cazatalentos/web dev -- --host 127.0.0.1 --port 5173
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
  DEMO_URL=http://localhost:5173 DEMO_POOL_ID=3 \
  node docs/demo/record-roles.mjs
```
