# StoryRemix Creator Economy: Donations & 90/10 Revenue Split

## 1. Core Economic Principle

StoryRemix is founded on fair compensation for collaborative writing.
Unlike legacy platforms that retain 30% to 50% of author tips, StoryRemix guarantees:

> **90% of Net Revenue flows directly to Story Authors & Collaborators.**
> **10% Platform Fee sustains infrastructure, database storage, and moderation.**

---

## 2. Mathematical Definition & Fee Invariant

All monetary calculations are performed in **integer cents (USD)** to prevent floating-point rounding errors.

Given a Gross Donation $G$ in cents:

1. **Payment Processor Fee**:
   $$F = \min(\text{round}(G \times 0.029 + 30), \lfloor G \times 0.50 \rfloor)$$
2. **Net Amount**:
   $$N = \max(0, G - F)$$
3. **Creator Pool (90%)**:
   $$C = \lfloor N \times 0.90 \rfloor$$
4. **Platform Fee (10%)**:
   $$P = N - C$$

### Absolute Invariant:
$$C + P = N$$
Zero pennies are lost or unaccounted for.

---

## 3. Co-Author Allocation Policies

When a story has multiple co-authors, the Creator Pool $C$ is distributed according to the story's configured policy:

1. **Equal Collaborators (`equal_collaborators`)**:
   - $C$ is divided evenly among all unique co-authors.
   - Any remainder cents are assigned one-by-one to the earliest contributors.
2. **Creator Reserved (`creator_and_collaborators`)**:
   - The original story initiator receives a reserved percentage (e.g., 30%).
   - The remaining 70% is divided equally among subsequent paragraph contributors.
3. **Contribution Weighted (`contribution_weighted`)**:
   - Allocations are directly proportional to the number of winning paragraphs each author contributed to the canonical story.

---

## 4. Sandbox Testing & Moroccan / International Payouts

### Sandbox Simulation:
In the MVP environment, transactions are processed in sandbox test mode (`is_sandbox: true`).
- Testing cards allow verifying multi-party allocations without billing real accounts.
- When an authenticated user tips a story, they are awarded **+20 XP** for patronizing writers.

### Moroccan & North African Banking Compatibility:
To support creators in Morocco (MAD) and internationally:
- Supported payout methods in roadmap: **Stripe Connect Custom/Express**, **Payoneer**, and direct **SWIFT / Wise IBAN transfers**.
- In Morocco, local bank accounts (Attijariwafa Bank, Banque Populaire, BMCE Bank of Africa) receive direct SWIFT transfers or Wise ACH deposits in Moroccan Dirhams (MAD).
- Minimum payout threshold: $25.00 USD to minimize international intermediary wire fees.
