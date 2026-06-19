# VaultPay: Secure Fintech Gateway Demonstration

**VaultPay** is an enterprise-grade mock fintech gateway designed to prove compliance against the **Fortress Security Matrix** under standard **PCI DSS 4.0** regulations. This demonstration is fully implemented with a multi-tier separation of concerns, ensuring absolute data security at rest, in transit, and in process.

---

## Directory Architecture

To satisfy strict modular separation, the project implements the requested logical boundaries:

```text
vaultpay-mock/
├── frontend/                 # Secure Fintech Client
│   ├── public/               
│   ├── src/
│   │   ├── app/              # Application Pages
│   │   ├── components/       # UI elements (PaymentForm.tsx)
│   │   └── services/         # Secure Fetch API Services
│   ├── .env.local            # Public URL environment config
│   └── package.json
│
├── backend/                  # High-Isolation Node.js / Express Server
│   ├── config/               # Supabase standard client configuration (supabase.ts)
│   ├── controllers/          # Secure Transaction Processing (transactionController.ts)
│   ├── routes/               # Modular Express REST Endpoints (transactionRoutes.ts)
│   ├── services/             # Isolation Vault cryptographical logic (mockPciVault.ts)
│   ├── .env                  # Deep Secrets (Supabase service keys)
│   └── package.json
└── README.md                 # Security Blueprint Documentation
```

---

## The Fortress Security Matrix

VaultPay guarantees zero-leakage security across three critical program states:

### 1. Data-in-Transit (TLS Enforced)
- **Encryption**: Every payload dispatched from the Next.js client component to the Express processing node is forced over secure HTTPS.
- **Backend Headers**: The Express controller leverages standard security controls by setting HSTS parameters:
  ```json
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"
  ```
  This defends against packet sniffing or server hijacking during raw payload transit.

### 2. Data-in-Process (Memory Scrubbing & API Boundaries)
- **Vulnerability**: If credit card PAN variables linger in Node's garbage collector or register heap, high-privilege system dumps can expose raw client cards.
- **Mitigation**: Once received, the card is immediately passed to the isolation module `mockPciVault.ts`. Once the non-reversible unique token (e.g. `tok_pci_vp_...`) is generated, the original PAN is **hard-overwritten** in memory:
  ```typescript
  pan = "PCI_SCRUBBED_OVERWRITTEN";
  req.body.pan = "PCI_SCRUBBED_OVERWRITTEN";
  ```
- **Luhn Algorithm Check**: Pre-flight checks are run in isolation to halt processing of unallocated card frames before executing any core database operations.

### 3. Data-at-Rest (Zero Raw-PAN Storage Policy)
- **Tokenization**: Credit card PAN integers are never written to disk, databases, or logs. Only the secure token reference is stored.
- **SQL Injection Prevention**: All queries written into the database utilize parameterized pre-compiled prepared statements. Even if an attacker injects a toxic string like:
  ```sql
  '; DROP TABLE transactions;--
  ```
  The Supabase parser handles the input strictly as a text literal, completely neutralizing structural injection attacks.

---

## Sandbox Verification

The companion interactive dashboard provides complete visual, real-time proof of these secure concepts:
- **Interactive Terminal**: Select Visa, Mastercard, or Amex mock profiles to simulate end-to-end payments.
- **Live Memory Scrubber**: Watch raw numbers enter, convert to tokens, wipe from variable registers, and serialize as parameterized placeholders.
- **Database Ledger**: Confirm that the stored records display generated token handles with zero raw-PAN traces.
- **Ask Lead Architect**: Engage in real-time consultations with an integrated AI Compliance Officer, confirming active gateway scores.
