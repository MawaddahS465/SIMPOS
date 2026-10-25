<?php

namespace App\Controllers\Kasir;

use App\Models\BarangModel;
use App\Models\PelangganModel;
use App\Models\PemesananPoModel;
use App\Models\ResepModel;

class Pemesanan extends BaseKasir
{
    public function index()
    {
        $status = (string) ($this->request->getGet('status') ?? '');
        $cari   = trim((string) ($this->request->getGet('q') ?? ''));

        $model = new PemesananPoModel();
        $rows  = $model->daftarCabang($this->cabangId(), $status, $cari);

        $semua = $model->daftarCabang($this->cabangId());
        $hitung = ['dipesan' => 0, 'diproses' => 0, 'sudah_datang' => 0];

        foreach ($semua as $row) {
            $kunci = $row['status'] === 'menunggu' ? 'dipesan' : $row['status'];

            if (isset($hitung[$kunci])) {
                $hitung[$kunci]++;
            }
        }

        $produk = array_values(array_filter(
            (new BarangModel())->katalogCabang($this->cabangId()),
            static fn (array $p): bool => $p['jenis'] !== 'Aksesoris'
        ));

        return view('kasir/pemesanan', [
            'judul'      => 'Pemesanan (PO)',
            'aktif'      => 'pemesanan',
            'rows'       => $rows,
            'total'      => count($semua),
            'hitung'     => $hitung,
            'status'     => $status,
            'cariQ'      => $cari,
            'pelanggan'  => (new PelangganModel())->orderBy('nama_pelanggan', 'ASC')->findAll(),
            'produk'     => $produk,
            'poKode'     => session()->getFlashdata('po_kode'),
            'poId'       => session()->getFlashdata('po_id'),
            'buat'       => $this->request->getGet('buat') === '1',
        ]);
    }

    public function simpan()
    {
        $pelangganId = (int) $this->request->getPost('pelanggan_id');
        $barangId    = (int) $this->request->getPost('barang_id');
        $qtyInput    = trim((string) $this->request->getPost('qty'));
        $catatan     = trim((string) $this->request->getPost('catatan'));

        $pelanggan = (new PelangganModel())->find($pelangganId);
        $barang    = $this->barangAktif($barangId);

        if ($pelanggan === null) {
            return redirect()->to('kasir/pemesanan')->with('error', 'Pelanggan tidak ditemukan.');
        }

        if ($barang === null) {
            return redirect()->to('kasir/pemesanan')->with('error', 'Produk tidak ditemukan atau tidak aktif.');
        }

        if (! preg_match('/^[0-9]+$/', $qtyInput) || (int) $qtyInput < 1) {
            return redirect()->to('kasir/pemesanan')
                ->with('error', 'Jumlah harus bilangan bulat lebih dari 0 (tanpa titik, koma, atau minus).');
        }

        $qty      = (int) $qtyInput;
        $harga    = (float) $barang['harga_jual'];
        $subtotal = $harga * $qty;
        $tanggal  = date('Y-m-d H:i:s');

        $resep = (new ResepModel())->terakhirPelanggan($pelangganId);

        $db       = db_connect();
        $poModel  = new PemesananPoModel();

        $poId = (int) $poModel->insert([
            'kode_po'                  => 'TMP-' . uniqid(),
            'pelanggan_id'             => $pelangganId,
            'cabang_id'                => $this->cabangId(),
            'pengguna_id'              => $this->kasirId(),
            'resep_id'                 => $resep['id_resep'] ?? null,
            'tanggal_po'               => $tanggal,
            'tanggal_estimasi_selesai' => date('Y-m-d', strtotime('+7 days')),
            'total'                    => $subtotal,
            'status'                   => 'dipesan',
            'catatan'                  => $catatan !== '' ? $catatan : null,
        ], true);

        if ($poId <= 0) {
            return redirect()->to('kasir/pemesanan')->with('error', 'PO gagal disimpan.');
        }

        $kode = 'PO-' . date('Y') . '-' . str_pad((string) $poId, 4, '0', STR_PAD_LEFT);
        $poModel->update($poId, ['kode_po' => $kode]);

        $db->table('detail_po')->insert([
            'po_id'     => $poId,
            'barang_id' => $barangId,
            'jumlah'    => $qty,
            'harga'     => $harga,
            'subtotal'  => $subtotal,
        ]);

        return redirect()->to('kasir/pemesanan')
            ->with('success', 'PO ' . $kode . ' tercatat dan diteruskan ke antrean Admin Cabang.')
            ->with('po_kode', $kode)
            ->with('po_id', $poId);
    }

    public function detail(int $id)
    {
        $model = new PemesananPoModel();
        $po    = $model->satu($id);

        if ($po === null || (int) $po['cabang_id'] !== $this->cabangId()) {
            return redirect()->to('kasir/pemesanan')->with('error', 'PO tidak ditemukan.');
        }

        return view('kasir/pemesanan_detail', [
            'judul'  => 'Detail PO ' . $po['kode_po'],
            'aktif'  => 'pemesanan',
            'po'     => $po,
            'detail' => $model->detail($id),
        ]);
    }
}
