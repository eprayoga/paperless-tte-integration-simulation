# Paperless TTE Demo

Website demo integrasi API **TTE Paperless**: OAuth, balance, tanda tangan elektronik V1, V2,
V2 Custom (dengan editor koordinat PDF), cek status, dan hasil dokumen.

> Demo frontend, bukan aplikasi produksi. Dokumen dan template disimpan di `localStorage`
> browser; file PDF tidak pernah disimpan.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi nilainya
npm run dev                  # http://localhost:3000
```

Daftarkan `PAPERLESS_REDIRECT_PAGE` (default `http://localhost:3000/api/auth/callback`) sebagai
redirect OAuth di Paperless.

| Script              | Fungsi                                |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Development server                    |
| `npm run build`     | Production build                      |
| `npm run typecheck` | Generate route types + `tsc --noEmit` |
| `npm run lint`      | ESLint                                |
| `npm test`          | Unit test (Vitest)                    |

## Keamanan

- Semua env bersifat **server-only**. `secret-key` dan `customer-key` ditambahkan oleh proxy
  `src/app/api/paperless/[...path]/route.ts`; browser tidak pernah melihatnya.
- Proxy hanya meneruskan 5 endpoint yang diizinkan (`src/lib/server/paperless-routes.ts`).
- `ttetoken` disimpan sebagai cookie **httpOnly** (`/api/auth/callback`), lalu di-redirect 303
  ke `/documents` sehingga token tidak tertinggal di URL dan tidak bisa dibaca JavaScript.
- Setiap 401 (HTTP status maupun `status` di body) menghapus cookie dan mengarahkan ke `/login`.

## Alur

```text
/login -> /api/auth/login -> Paperless OAuth -> /api/auth/callback?ttetoken=...
       -> validasi token (GET balance) -> cookie httpOnly -> /documents
/documents: balance + tabel dokumen (localStorage)
Draft -> TTE V1 / V2 (dialog konfirmasi + pilih ulang PDF)
      -> TTE V2 Custom -> template editor -> preview wajib -> konfirmasi
      -> trx_id -> Pending -> Check Status -> Success | Failed (Retry)
Success: Preview / Download (URL diambil ulang dari status) / Verification
```

## Struktur

```text
src/
├── app/                      # routes (App Router) + API routes (auth, proxy)
├── components/
│   ├── auth/ balance/ layout/ common/
│   ├── documents/            # tabel, form, dialog sign/delete, detail
│   ├── pdf/                  # viewer react-pdf (client-only)
│   └── pdf-editor/           # editor template V2 Custom + preview
├── services/                 # axios client, paperless service + mapper, auth
├── stores/                   # Zustand: auth, document, template, balance, ui, session-file
├── schemas/                  # Zod: document, template
├── lib/                      # konversi koordinat, preview pdf-lib, util, server-only
├── hooks/ types/ constants/
└── proxy.ts                  # route guard (Next 16 "proxy", dulu middleware)
```

## Koordinat V2 Custom

Semua koordinat yang disimpan dan dikirim memakai satuan point PDF dengan **origin (0,0) di kiri
bawah**. Editor menampilkan halaman dengan pdf.js dan mengonversi posisi layar (origin kiri atas)
memakai `viewport.transform` (`src/lib/pdf-coordinates.ts`), sehingga zoom dan rotasi halaman
ikut diperhitungkan.

Catatan: pada contoh payload API, `upper_left_x/upper_left_y` berisi sudut **kanan atas** kotak
signature (431→535, 163→202). Nama property dipertahankan, nilainya diisi sudut kanan atas.
