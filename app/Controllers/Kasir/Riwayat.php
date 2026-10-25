<?php

namespace App\Controllers\Kasir;

use App\Models\PelangganModel;
use App\Models\ResepModel;
use App\Models\TransaksiModel;

class Riwayat extends BaseKasir
{
    public function index()
    {
        $status = (string) ($this->request->getGet('status') ?? '');
        $cari   = trim((string) ($this->request->getGet('q') ?? ''));
        $buka   = (int) ($this->request->getGet('buka') ?? 0);

        $model = new TransaksiModel();
        $rows  = $model->riwayatCabang($this->cabangId(), $status, $cari);

        $detailMap = [];
        $ids       = array_map(static fn (array $r): int => (int) $r['id_transaksi'], $rows);

        if ($ids !== []) {
            $detail = db_connect()->table('detail_transaksi d')
                ->select('d.*, b.nama_barang, b.merek, b.jenis')
                ->join('barang b', 'b.id = d.barang_id')
                ->whereIn('d.transaksi_id', $ids)
                ->get()
                ->getResultArray();

            foreach ($detail as $d) {
                $detailMap[(int) $d['transaksi_id']][] = $d;
            }
        }

        $bukaRow = null;
        if ($buka > 0) {
            foreach ($rows as $row) {
                if ((int) $row['id_transaksi'] === $buka) {
                    $bukaRow = $row;

                    break;
                }
            }

            if ($bukaRow === null) {
                $bukaRow = $model->where('cabang_id', $this->cabangId())->find($buka);
            }
        }

        $resep = null;
        if ($bukaRow !== null && ! empty($bukaRow['pelanggan_id'])) {
            $resep = (new ResepModel())->terakhirPelanggan((int) $bukaRow['pelanggan_id']);
        }

        return view('kasir/riwayat', [
            'judul'     => 'Riwayat Transaksi',
            'aktif'     => 'riwayat',
            'rows'      => $rows,
            'detailMap' => $detailMap,
            'buka'      => $buka,
            'bukaRow'   => $bukaRow,
            'resep'     => $resep,
            'status'    => $status,
            'cariQ'     => $cari,
            'total'     => (new TransaksiModel())->where('cabang_id', $this->cabangId())->countAllResults(),
        ]);
    }
}
