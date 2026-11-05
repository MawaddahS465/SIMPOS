<?php

namespace App\Controllers\Kasir;

use App\Models\ResepModel;
use App\Models\TransaksiModel;

class Riwayat extends BaseKasir
{
    /**
     * Nilai filter "Kartu" pada UI dipetakan ke nilai metode di database.
     */
    private const METODE_DB = [
        'Tunai'         => 'Tunai',
        'QRIS'          => 'QRIS',
        'Transfer Bank' => 'Transfer Bank',
        'Kartu'         => 'Kartu Debit/Kredit',
        'E-Wallet'      => 'E-Wallet',
    ];

    private const PERIODE = [
        'semua',
        'hari',
        'mingguan',
        'bulanan',
        'okt-2026',
        'sep-2026',
        'agu-2026',
        'custom',
    ];

    public function index()
    {
        $status  = mb_strtolower(trim((string) ($this->request->getGet('status') ?? '')));
        $cari    = trim((string) ($this->request->getGet('q') ?? ''));
        $metode  = (string) ($this->request->getGet('metode') ?? '');
        $periode = (string) ($this->request->getGet('periode') ?? 'semua');
        $buka    = (int) ($this->request->getGet('buka') ?? 0);

        if ($buka > 0) {
            return redirect()->to(site_url('kasir/riwayat/' . $buka));
        }

        if (! in_array($status, ['', 'selesai', 'pending', 'dibatalkan'], true)) {
            $status = '';
        }

        if (! array_key_exists($metode, self::METODE_DB)) {
            $metode = '';
        }

        if (! in_array($periode, self::PERIODE, true)) {
            $periode = 'semua';
        }

        // Rentang tanggal kustom memakai nilai awal yang sama dengan halaman React.
        $dari   = trim((string) ($this->request->getGet('dari') ?? ''));
        $sampai = trim((string) ($this->request->getGet('sampai') ?? ''));

        if ($dari === '') {
            $dari = '2026-08-01';
        }

        if ($sampai === '') {
            $sampai = '2026-10-31';
        }

        $model = new TransaksiModel();

        // Semua riwayat cabang (tanpa filter) untuk angka "total riwayat transaksi".
        $semua = [];
        foreach ($model->riwayatCabang($this->cabangId()) as $row) {
            $semua[(int) $row['id_transaksi']] = $row;
        }
        $semua = array_values($semua);

        [$from, $to, $periodeLabel] = $this->rentangPeriode($periode, $dari, $sampai);

        // Basis statistik: periode + metode (status & pencarian belum diterapkan).
        $base = array_values(array_filter(
            $semua,
            static function (array $t) use ($from, $to): bool {
                $ts = strtotime((string) ($t['tanggal_transaksi'] ?? ''));

                if ($ts === false) {
                    return $from === null && $to === null;
                }

                return ($from === null || $ts >= $from) && ($to === null || $ts <= $to);
            },
        ));

        $metodeDb = self::METODE_DB[$metode] ?? '';
        if ($metodeDb !== '') {
            $base = array_values(array_filter(
                $base,
                static fn (array $t): bool => (string) ($t['metode_pembayaran'] ?? 'Tunai') === $metodeDb,
            ));
        }

        $selesaiRows = array_values(array_filter(
            $base,
            static fn (array $t): bool => mb_strtolower((string) ($t['status'] ?? '')) === 'selesai',
        ));

        $diterima = 0.0;
        $tunai    = 0.0;
        $nonTunai = 0.0;

        foreach ($base as $t) {
            $kunci = mb_strtolower((string) ($t['status'] ?? ''));

            if (! in_array($kunci, ['selesai', 'lunas'], true)) {
                continue;
            }

            $nilai = (float) ($t['total'] ?? 0);
            $diterima += $nilai;

            if ((string) ($t['metode_pembayaran'] ?? 'Tunai') === 'Tunai') {
                $tunai += $nilai;
            } else {
                $nonTunai += $nilai;
            }
        }

        // Baris yang benar-benar tampil: status + pencarian.
        $cariLower = mb_strtolower($cari);
        $rows      = array_values(array_filter(
            $base,
            static function (array $t) use ($status, $cariLower): bool {
                if ($status !== '' && mb_strtolower((string) ($t['status'] ?? '')) !== $status) {
                    return false;
                }

                if ($cariLower === '') {
                    return true;
                }

                $teks = mb_strtolower(implode(' ', [
                    (string) ($t['kode_transaksi'] ?? ''),
                    (string) ($t['nama_pelanggan'] ?? ''),
                    (string) ($t['no_hp'] ?? ''),
                    (string) ($t['metode_pembayaran'] ?? 'Tunai'),
                    (string) ($t['jenis'] ?? ''),
                ]));

                return str_contains($teks, $cariLower);
            },
        ));

        if ((string) ($this->request->getGet('ekspor') ?? '') === '1') {
            return $this->ekspor($rows, $periodeLabel, $status, $metode);
        }

        return view('kasir/riwayat', [
            'judul'          => 'Riwayat Transaksi',
            'aktif'          => 'riwayat',
            'rows'           => $rows,
            'status'         => $status,
            'metode'         => $metode,
            'cariQ'          => $cari,
            'periode'        => $periode,
            'periodeLabel'   => $periodeLabel,
            'dari'           => $dari,
            'sampai'         => $sampai,
            'total'          => count($semua),
            'jumlah'         => count($rows),
            'selesaiCount'   => count($selesaiRows),
            'diterima'       => $diterima,
            'tunai'          => $tunai,
            'nonTunai'       => $nonTunai,
        ]);
    }

    public function detail(int $id)
    {
        $model = new TransaksiModel();
        $trx   = $model->riwayatSatuCabang($this->cabangId(), $id);

        if ($trx === null) {
            return redirect()->to('kasir/riwayat')->with('error', 'Transaksi tidak ditemukan.');
        }

        $resep = ! empty($trx['pelanggan_id'])
            ? (new ResepModel())->terakhirPelanggan((int) $trx['pelanggan_id'])
            : null;
        $db     = db_connect();
        $cabang = $db->table('cabang')
            ->where('id', (int) $trx['cabang_id'])
            ->get()
            ->getRowArray() ?? [];
        $kasir  = $db->table('users')
            ->select('nama')
            ->where('id', (int) $trx['pengguna_id'])
            ->get()
            ->getRowArray();

        return view('kasir/riwayat_detail', [
            'judul'         => 'Detail Transaksi ' . $trx['kode_transaksi'],
            'aktif'         => 'riwayat',
            'trx'           => $trx,
            'detail'        => $model->detail($id),
            'resep'         => $resep,
            'cabang'        => $cabang,
            'kasirNama'     => (string) ($kasir['nama'] ?? ''),
            'pelangganNama' => (string) ($trx['nama_pelanggan'] ?? ''),
            'pembayaran'    => [
                'metode_pembayaran' => $trx['metode_pembayaran'] ?? 'Tunai',
                'jumlah_bayar'      => $trx['jumlah_bayar'] ?? $trx['total'],
                'status'            => $trx['status_bayar'] ?? 'lunas',
            ],
        ]);
    }

    /**
     * @return array{0: int|null, 1: int|null, 2: string}
     */
    private function rentangPeriode(string $periode, string $dari, string $sampai): array
    {
        $hariIni = strtotime('today');

        switch ($periode) {
            case 'hari':
                return [$hariIni, strtotime('today 23:59:59'), 'Hari Ini'];

            case 'mingguan':
                $hariKe = (int) date('N', $hariIni);

                return [strtotime('today -' . ($hariKe - 1) . ' days'), strtotime('today 23:59:59'), 'Minggu Ini'];

            case 'bulanan':
                return [strtotime(date('Y-m-01', $hariIni)), strtotime('today 23:59:59'), 'Bulan Ini'];

            case 'okt-2026':
                return [strtotime('2026-10-01 00:00:00'), strtotime('2026-10-31 23:59:59'), 'Oktober 2026'];

            case 'sep-2026':
                return [strtotime('2026-09-01 00:00:00'), strtotime('2026-09-30 23:59:59'), 'September 2026'];

            case 'agu-2026':
                return [strtotime('2026-08-01 00:00:00'), strtotime('2026-08-31 23:59:59'), 'Agustus 2026'];

            case 'custom':
                $from = strtotime($dari . ' 00:00:00');
                $to   = strtotime($sampai . ' 23:59:59');

                return [
                    $from !== false ? $from : null,
                    $to !== false ? $to : null,
                    'Rentang khusus',
                ];

            default:
                return [null, null, 'Semua Periode (01 Agu - 31 Okt 2026)'];
        }
    }

    /**
     * Ekspor CSV yang bisa dibuka langsung di Excel (tanpa dependensi tambahan).
     */
    private function ekspor(array $rows, string $periodeLabel, string $status, string $metode)
    {
        $metodeLabel = $metode === '' ? 'Semua' : $metode;
        $stream      = fopen('php://temp', 'r+');

        if ($stream === false) {
            return redirect()->to(site_url('kasir/riwayat'));
        }

        fputcsv($stream, ['Laporan Riwayat Transaksi & Pembayaran - Cabang ' . current_branch_name()]);
        fputcsv($stream, ['Periode: ' . $periodeLabel]);
        fputcsv($stream, ['Status: ' . ($status === '' ? 'Semua' : label_status($status))]);
        fputcsv($stream, ['Metode Pembayaran: ' . $metodeLabel]);
        fputcsv($stream, ['Jumlah baris: ' . count($rows)]);
        fputcsv($stream, []);

        fputcsv($stream, [
            'No. Transaksi',
            'Tanggal',
            'Jam',
            'Pelanggan',
            'Jenis',
            'Metode Pembayaran',
            'Total (Rp)',
            'Dibayar (Rp)',
            'Kembalian (Rp)',
            'Status',
        ]);

        $grandTotal = 0.0;

        foreach ($rows as $t) {
            $metodeBaris = (string) ($t['metode_pembayaran'] ?? 'Tunai');
            $total       = (float) ($t['total'] ?? 0);
            $dibayar     = $metodeBaris === 'Tunai'
                ? (float) ($t['jumlah_bayar'] ?? $total)
                : $total;
            $kembalian = $metodeBaris === 'Tunai' ? max(0, $dibayar - $total) : 0.0;
            $ts        = strtotime((string) ($t['tanggal_transaksi'] ?? ''));

            $grandTotal += $total;

            fputcsv($stream, [
                (string) ($t['kode_transaksi'] ?? ''),
                $ts !== false ? tgl_id((string) $t['tanggal_transaksi']) : '-',
                $ts !== false ? date('H:i', $ts) : '-',
                (string) ($t['nama_pelanggan'] ?? '-'),
                (string) ($t['jenis'] ?? '-'),
                $metodeBaris,
                $total,
                $dibayar,
                $kembalian,
                label_status((string) ($t['status'] ?? '')),
            ]);
        }

        fputcsv($stream, ['TOTAL', '', '', '', '', '', $grandTotal, '', '', '']);

        rewind($stream);
        $isi = stream_get_contents($stream);
        fclose($stream);

        $cabang   = preg_replace('/[^A-Za-z0-9]+/', '-', current_branch_name()) ?: 'Cabang';
        $filename = 'Riwayat-Pembayaran-' . $cabang . '-' . date('Ymd-Hi') . '.csv';

        return $this->response
            ->setHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->setHeader('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->setBody("\xEF\xBB\xBF" . (string) $isi);
    }
}
