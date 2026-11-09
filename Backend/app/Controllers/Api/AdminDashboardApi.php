<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

class AdminDashboardApi extends BaseController
{
    public function summary(): ResponseInterface
    {
        $branchId = (int) session()->get('cabang_id');
        $db       = db_connect();

        $branch = $db->table('cabang')
            ->select('nama_cabang')
            ->where('id', $branchId)
            ->where('status', 'aktif')
            ->get()
            ->getRowArray();

        if ($branch === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'success'   => false,
                'message'   => 'Cabang akun tidak ditemukan atau tidak aktif.',
                'csrfToken' => service('security')->getHash(),
            ]);
        }

        $lowStockCount = $db->table('barang b')
            ->join('stok_cabang s', "s.barang_id = b.id AND s.cabang_id = {$branchId}", 'left')
            ->where('b.status', 'aktif')
            ->where('COALESCE(s.jumlah_stok, 0) <= COALESCE(s.stok_minimum, 5)', null, false)
            ->countAllResults();

        $lowStock = $db->table('barang b')
            ->select('b.id, b.kode_barang, b.nama_barang, COALESCE(s.jumlah_stok, 0) AS stok, COALESCE(s.stok_minimum, 5) AS stok_minimum', false)
            ->join('stok_cabang s', "s.barang_id = b.id AND s.cabang_id = {$branchId}", 'left')
            ->where('b.status', 'aktif')
            ->where('COALESCE(s.jumlah_stok, 0) <= COALESCE(s.stok_minimum, 5)', null, false)
            ->orderBy('stok', 'ASC')
            ->orderBy('b.nama_barang', 'ASC')
            ->limit(3)
            ->get()
            ->getResultArray();

        $poCounts = $db->table('pemesanan_po')
            ->select('status, COUNT(*) AS total')
            ->where('cabang_id', $branchId)
            ->whereIn('status', ['dipesan', 'diproses'])
            ->groupBy('status')
            ->get()
            ->getResultArray();

        $counts = ['dipesan' => 0, 'diproses' => 0];
        foreach ($poCounts as $row) {
            $counts[(string) $row['status']] = (int) $row['total'];
        }

        $newOrders = $db->table('pemesanan_po po')
            ->select(
                'po.id_po, po.kode_po, po.status, po.tanggal_po, p.nama_pelanggan,
                (SELECT GROUP_CONCAT(CONCAT(b.nama_barang, \' ×\', d.jumlah) ORDER BY d.id_detail_po SEPARATOR \'|\')
                 FROM detail_po d JOIN barang b ON b.id = d.barang_id WHERE d.po_id = po.id_po) AS produk_label',
                false
            )
            ->join('pelanggan p', 'p.id_pelanggan = po.pelanggan_id', 'left')
            ->where('po.cabang_id', $branchId)
            ->where('po.status', 'dipesan')
            ->orderBy('po.tanggal_po', 'DESC')
            ->limit(2)
            ->get()
            ->getResultArray();

        return $this->response->setJSON([
            'success' => true,
            'data'    => [
                'branch' => (string) $branch['nama_cabang'],
                'stats'  => [
                    'lowStock'         => $lowStockCount,
                    'newOrders'        => $counts['dipesan'],
                    'processingOrders' => $counts['diproses'],
                ],
                'lowStock'  => $lowStock,
                'newOrders' => $newOrders,
            ],
            'csrfToken' => service('security')->getHash(),
        ]);
    }
}
