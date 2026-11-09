<?php

namespace App\Models;

use CodeIgniter\Model;

class PemesananPoModel extends Model
{
    protected $table         = 'pemesanan_po';
    protected $primaryKey    = 'id_po';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'kode_po', 'pelanggan_id', 'cabang_id', 'pengguna_id', 'resep_id',
        'tanggal_po', 'tanggal_estimasi_selesai', 'total', 'status', 'transaksi_id', 'catatan',
    ];

    public function daftarCabang(int $cabangId, string $status = '', string $cari = ''): array
    {
        $builder = $this->db->table('pemesanan_po po')
            ->select('po.*, p.nama_pelanggan, p.no_hp, (SELECT COUNT(*) FROM detail_po d WHERE d.po_id = po.id_po) AS jml_item, (SELECT GROUP_CONCAT(CONCAT(b.nama_barang, \' ×\', d.jumlah) ORDER BY d.id_detail_po SEPARATOR \'|\') FROM detail_po d JOIN barang b ON b.id = d.barang_id WHERE d.po_id = po.id_po) AS produk_label')
            ->join('pelanggan p', 'p.id_pelanggan = po.pelanggan_id', 'left')
            ->where('po.cabang_id', $cabangId);

        if ($status !== '') {
            $builder->where('po.status', $status);
        }

        if ($cari !== '') {
            $builder->groupStart()
                ->like('po.kode_po', $cari)
                ->orLike('p.nama_pelanggan', $cari)
                ->orLike('p.no_hp', $cari)
                ->groupEnd();
        }

        return $builder->orderBy('po.tanggal_po', 'DESC')->get()->getResultArray();
    }

    /**
     * PO yang sudah datang dan menunggu diambil pelanggan.
     *
     * @return array{total: int, items: list<array<string, mixed>>}
     */
    public function notifikasiSiapDiambil(int $cabangId, int $limit = 5): array
    {
        $builder = $this->db->table('pemesanan_po po')
            ->join('pelanggan p', 'p.id_pelanggan = po.pelanggan_id', 'left')
            ->where('po.cabang_id', $cabangId)
            ->where('po.status', 'sudah_datang');

        $total = (clone $builder)->countAllResults();
        $items = $builder
            ->select('po.id_po, po.kode_po, po.tanggal_po, p.nama_pelanggan')
            ->orderBy('po.tanggal_po', 'DESC')
            ->limit($limit)
            ->get()
            ->getResultArray();

        return ['total' => $total, 'items' => $items];
    }

    public function detail(int $poId, ?int $cabangId = null): array
    {
        $builder = $this->db->table('detail_po d')
            ->select('d.*, b.nama_barang, b.merek, b.jenis')
            ->join('barang b', 'b.id = d.barang_id');

        if ($cabangId !== null) {
            $builder->select('COALESCE(s.jumlah_stok, 0) AS stok')
                ->join('stok_cabang s', 's.barang_id = b.id AND s.cabang_id = ' . $cabangId, 'left');
        }

        return $builder->where('d.po_id', $poId)
            ->get()
            ->getResultArray();
    }

    public function satu(int $poId): ?array
    {
        $row = $this->db->table('pemesanan_po po')
            ->select('po.*, p.nama_pelanggan, p.no_hp, p.alamat, r.id_resep, r.od_sph, r.od_cyl, r.od_axis, r.os_sph, r.os_cyl, r.os_axis, r.pd, r.add_power, t.id_transaksi, t.kode_transaksi, t.tanggal_transaksi, t.total AS total_transaksi')
            ->join('pelanggan p', 'p.id_pelanggan = po.pelanggan_id', 'left')
            ->join('resep r', 'r.id_resep = po.resep_id', 'left')
            ->join('transaksi t', 't.id_transaksi = po.transaksi_id', 'left')
            ->where('po.id_po', $poId)
            ->get()
            ->getRowArray();

        return $row ?: null;
    }
}
