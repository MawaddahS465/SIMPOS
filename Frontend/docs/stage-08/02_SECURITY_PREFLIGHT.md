# 02 — Security Preflight (rancangan, tanpa implementasi)

## Akun ( sog'liq: tanpa akun sungguhan tahap ini)

Kasir/Admin/Owner via Supabase Auth (email+password, hash server, JWT rotation,
idle timeout, lockout brute-force). Provisioning + deaktivasi oleh petugas berwenang
(item #13); akun demo terpisah + flag, password demo tidak dipakai produksi.
Password reset via email; tanpa reset manual oleh Owner.

## Threat model ringkas

- Pelanggan/resep: PII + data kesehatan → RLS ketat, minim di logistik/laporan
  (sudah diterapkan di UI: CP2-33), enkripsi at-rest bawaan, tanpa ekspor massal PII.
- Pembayaran: label demo kini; gateway nyata = callback terverifikasi + idempotency,
  tanpa secret di klien, tanpa log PAN/token.
- Stok: ancaman oversell/double-write → server function + constraint + idem keys.

## Secrets

Anon/publishable key di Vite BOLEH (bukan pengganti RLS); `service_role`/DB secret
HANYA di server/Edge Function — DILARANG di frontend, repo, dan laporan.
`.env.local` (gitignore) untuk dev, secret manager untuk prod; dev/prod project terpisah.
Tanpa kredensial apa pun ditulis tahap ini.
