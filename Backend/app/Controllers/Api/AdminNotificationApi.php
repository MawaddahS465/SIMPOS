<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

class AdminNotificationApi extends BaseController
{
    public function index(): ResponseInterface
    {
        $branchId = (int) session()->get('cabang_id');
        $db       = db_connect();

        $lowStock = $db->table('barang b')
            ->select('b.id, b.kode_barang, b.nama_barang, COALESCE(s.jumlah_stok, 0) AS stok, COALESCE(s.stok_minimum, 5) AS stok_minimum', false)
            ->join('stok_cabang s', "s.barang_id = b.id AND s.cabang_id = {$branchId}", 'left')
            ->where('b.status', 'aktif')
            ->where('COALESCE(s.jumlah_stok, 0) <= COALESCE(s.stok_minimum, 5)', null, false)
            ->orderBy('stok', 'ASC')
            ->orderBy('b.nama_barang', 'ASC')
            ->limit(10)
            ->get()
            ->getResultArray();

        $newOrders = $db->table('pemesanan_po po')
            ->select('po.id_po, po.kode_po, po.tanggal_po, p.nama_pelanggan')
            ->join('pelanggan p', 'p.id_pelanggan = po.pelanggan_id', 'left')
            ->where('po.cabang_id', $branchId)
            ->where('po.status', 'dipesan')
            ->orderBy('po.tanggal_po', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();

        $pendingRequests = $db->table('pengajuan_stok p')
            ->select('p.id_pengajuan, p.kode_pengajuan, p.created_at, b.nama_barang')
            ->join('barang b', 'b.id = p.barang_id')
            ->where('p.cabang_id', $branchId)
            ->where('p.status !=', 'ditolak')
            ->where(
                'COALESCE((SELECT SUM(d.jumlah_dialokasikan) FROM detail_alokasi_stok d
                    JOIN alokasi_stok a ON a.id_alokasi = d.alokasi_id
                    WHERE a.pengajuan_id = p.id_pengajuan), 0) = 0',
                null,
                false
            )
            ->orderBy('p.created_at', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();

        $notifications = [];
        foreach ($newOrders as $order) {
            $notifications[] = [
                'id'    => 'po-' . $order['id_po'],
                'title' => 'PO baru',
                'sub'   => $order['kode_po'] . ' · ' . ($order['nama_pelanggan'] ?: 'Pelanggan'),
                'to'    => '/admin/pemesanan/' . $order['id_po'],
                'tone'  => 'info',
                'icon'  => 'po',
            ];
        }

        foreach ($lowStock as $product) {
            $notifications[] = [
                'id'    => 'stok-' . $product['id'],
                'title' => 'Stok menipis',
                'sub'   => $product['nama_barang'] . ' · ' . $product['stok'] . ' / minimum ' . $product['stok_minimum'],
                'to'    => '/admin/stok',
                'tone'  => 'danger',
                'icon'  => 'stock',
            ];
        }

        foreach ($pendingRequests as $request) {
            $notifications[] = [
                'id'    => 'pengajuan-' . $request['id_pengajuan'],
                'title' => 'Pengajuan stok menunggu',
                'sub'   => $request['kode_pengajuan'] . ' · ' . $request['nama_barang'],
                'to'    => '/admin/pengajuan',
                'tone'  => 'warn',
                'icon'  => 'request',
            ];
        }

        return $this->response->setJSON([
            'success'   => true,
            'data'      => $notifications,
            'csrfToken' => service('security')->getHash(),
        ]);
    }
}
