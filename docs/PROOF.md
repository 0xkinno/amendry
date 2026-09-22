# AMENDRY — Mathematical Proof & Verification Model

## 1. The Core Invariant

$$
\text{Readiness}(T, R_k, P) = \begin{cases}
\text{READY} & \text{if } \Phi(T, R_k, P) = \text{true} \\
\text{BLOCKED} & \text{otherwise}
\end{cases}
$$

Where the readiness predicate $\Phi(T, R_k, P)$ holds if and only if:

1. **Revision Pinning**: $P.\text{revisionId} = R_k.\text{id}$ (Package is pinned to the current verified revision $R_k$).
2. **Mandatory Requirement Verification**: $\forall r \in \text{Mandatory}(R_k), \text{status}(r) = \text{VERIFIED}$.
3. **Evidence Currency**: $\forall r \in \text{Mandatory}(R_k), \exists e \in \text{Evidence}(r) : \text{status}(e) = \text{CURRENT} \land e.\text{revisionId} = R_k.\text{id}$.
4. **Zero Open Conflicts**: $\{ c \in \text{Conflicts}(T) \mid c.\text{status} = \text{OPEN} \} = \emptyset$.
5. **Valid Human Authorization**: $P.\text{approvalState} = \text{APPROVED} \land (\text{currentTime} - P.\text{approvedAt}) < 24\text{h}$.

---

## 2. Cryptographic Lineage Chain

Every revision $R_k$ contains:
- `contentHash`: $\text{SHA-256}(\text{rawText})$
- `normalizedHash`: $\text{SHA-256}(\text{normalize}(\text{rawText}))$
- `parentRevisionHash`: $H(R_{k-1})$ where $H(R_0) = 0^{64}$
- `lineageHash`: $\text{SHA-256}(k \parallel \text{contentHash} \parallel \text{parentRevisionHash})$

Because each revision points to its predecessor's lineage hash, the entire procurement history forms an append-only, tamper-evident cryptographic hash chain. Any retroactive modification to a historical addendum breaks the parent-pointer chain.

---

## 3. Pure Deterministic Digest

The readiness fingerprint is computed via a 3-way 32-bit FNV-1a hash producing a 24-character hexadecimal signature:

$$
D = \text{readinessDigest}([R_k.\text{id}, \text{status}, r_1, r_2, \dots, r_m, e_1, \dots, e_n])
$$

- Pure and dependency-free.
- Guaranteed to execute identically in the Convex backend, in client browsers, in unit test runners, and in offline verification scripts.
- Re-verifiable at any time with `npm run verify:proof`.

---

## 4. Verification Guarantees

1. **Zero False Current-Ready Escapes**: In any state transition where an external addendum arrives, the system transitions fail-closed to `BLOCKED`.
2. **Zero Ingestion Race Conditions**: If a submission is submitted concurrently with an amendment, the mutation transaction aborts with `PACKAGE_REVISION_MISMATCH`.
3. **Zero Duplicate Outbound Actions**: External communications (such as buyer clarifications via AgentMail) require an idempotency receipt record in `outboundActions`. Secondary attempts are deduplicated and intercepted.
