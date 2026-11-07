<?php

namespace App\Controllers\Kasir;

use App\Models\BarangModel;
use App\Models\PembayaranModel;
use App\Models\PelangganModel;
use App\Models\PemesananPoModel;
use App\Models\ResepModel;
use App\Models\TransaksiModel;

class Pemesanan extends BaseKasir
{
    private const METODE_PEMBAYARAN = ['Tunai', 'Transfer Bank', 'Kartu Debit/Kredit', 'QRIS', 'E-Wallet'];

    public function notifikasi()
    {
        $notifikasi = (new PemesananPoModel())->notifikasiSiapDiambil($this->cabangId());

        $items = array_map(static function (array $po): array {
            return [
                'kode'      => $po['kode_po'],
                'pelanggan' => $po['nama_pelanggan'] ?? 'Pelanggan',
                'tanggal'   => tgl_id($po['tanggal_po'], true),
                'url'       => site_url('kasir/pemesanan/' . (int) $po['id_po']),
            ];
        }, $notifikasi['items']);

        return $this->response->setJSON([
            'total' => $notifikasi['total'],
            'items' => $items,
        ]);
    }

    public function index()
    {
        $status = (string) ($this->request->getGet('status') ?? '');
        $cari   = trim((string) ($this->request->getGet('q') ?? ''));
        $barangId = (int) ($this->request->getGet('productId') ?? 0);

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
            'barangId'   => $barangId,
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
        $formUrl   = 'kasir/pemesanan?buat=1&productId=' . $barangId;

        if ($pelanggan === null) {
            return redirect()->to($formUrl)->withInput()->with('error', 'Pelanggan tidak ditemukan.');
        }

        if ($barang === null) {
            return redirect()->to($formUrl)->withInput()->with('error', 'Produk tidak ditemukan atau tidak aktif.');
        }

        if (! preg_match('/^[0-9]+$/', $qtyInput) || (int) $qtyInput < 1) {
            return redirect()->to($formUrl)
                ->withInput()
                ->with('error', 'Jumlah harus bilangan bulat lebih dari 0 (tanpa titik, koma, atau minus).');
        }

        $qty      = (int) $qtyInput;
        $harga    = (float) $barang['harga_jual'];
        $subtotal = $harga * $qty;
        $tanggal  = date('Y-m-d H:i:s');

        $resep = (new ResepModel())->terakhirPelanggan($pelangganId);

        $db       = db_connect();
        $poModel  = new PemesananPoModel();
        $db->transBegin();

        try {
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
                throw new \RuntimeException('PO gagal disimpan.');
            }

            $kode = 'PO-' . date('Y') . '-' . str_pad((string) $poId, 4, '0', STR_PAD_LEFT);

            if (! $poModel->update($poId, ['kode_po' => $kode])) {
                throw new \RuntimeException('Nomor PO gagal diperbarui.');
            }

            if (! $db->table('detail_po')->insert([
                'po_id'     => $poId,
                'barang_id' => $barangId,
                'jumlah'    => $qty,
                'harga'     => $harga,
                'subtotal'  => $subtotal,
            ]) || ! $db->transStatus()) {
                throw new \RuntimeException('Rincian produk PO gagal disimpan.');
            }

            if (! $db->transCommit()) {
                throw new \RuntimeException('PO gagal diselesaikan.');
            }
        } catch (\Throwable $e) {
            $db->transRollback();
            log_message('error', 'Gagal menyimpan PO kasir: {message}', ['message' => $e->getMessage()]);

            return redirect()->to($formUrl)
                ->withInput()
                ->with('error', 'PO gagal disimpan. Periksa kembali data dan coba lagi.');
        }

        return redirect()->to('kasir/pemesanan')
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

    public function pengambilan(int $id)
    {
        $model = new PemesananPoModel();
        $po    = $model->satu($id);

        if ($po === null || (int) $po['cabang_id'] !== $this->cabangId()) {
            return redirect()->to('kasir/pemesanan')->with('error', 'PO tidak ditemukan.');
        }

        if ($po['status'] !== 'sudah_datang') {
            return redirect()->to('kasir/pemesanan/' . $id)
                ->with('error', 'Pengambilan hanya dapat diproses untuk PO yang sudah datang.');
        }

        $detail = $model->detail($id, $this->cabangId());

        if ($detail === []) {
            return redirect()->to('kasir/pemesanan/' . $id)
                ->with('error', 'PO ini belum memiliki produk untuk diproses.');
        }

        return view('kasir/pemesanan_pengambilan', [
            'judul'        => 'Proses Pengambilan ' . $po['kode_po'],
            'aktif'        => 'pemesanan',
            'po'           => $po,
            'detail'       => $detail,
            'total'        => array_sum(array_map(
                static fn (array $row): float => (float) ($row['subtotal'] ?? 0),
                $detail
            )),
            'daftarMetode' => self::METODE_PEMBAYARAN,
        ]);
    }

    public function selesaikanPengambilan(int $id)
    {
        $poModel = new PemesananPoModel();
        $po      = $poModel->satu($id);
        $url     = 'kasir/pemesanan/' . $id . '/pengambilan';

        if ($po === null || (int) $po['cabang_id'] !== $this->cabangId()) {
            return redirect()->to('kasir/pemesanan')->with('error', 'PO tidak ditemukan.');
        }

        if ($po['status'] !== 'sudah_datang') {
            return redirect()->to('kasir/pemesanan/' . $id)
                ->with('error', 'PO ini sudah diproses atau belum siap diambil.');
        }

        $detail = $poModel->detail($id, $this->cabangId());

        if ($detail === []) {
            return redirect()->to('kasir/pemesanan/' . $id)
                ->with('error', 'PO ini belum memiliki produk untuk diproses.');
        }

        $metode = (string) $this->request->getPost('metode');

        if (! in_array($metode, self::METODE_PEMBAYARAN, true)) {
            return redirect()->to($url)->withInput()->with('error', 'Metode pembayaran tidak valid.');
        }

        $total       = array_sum(array_map(static fn (array $row): float => (float) ($row['subtotal'] ?? 0), $detail));
        $jumlahBayar = $total;
        $modeBayar   = (string) $this->request->getPost('mode_bayar');

        if ($metode === 'Tunai' && $modeBayar === 'manual') {
            $jumlahInput = trim((string) $this->request->getPost('jumlah_dibayar'));

            if (! preg_match('/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/D', $jumlahInput)) {
                return redirect()->to($url)->withInput()
                    ->with('error', 'Jumlah pembayaran tunai harus berupa angka rupiah yang valid.');
            }

            $jumlahBayar = (float) str_replace('.', '', $jumlahInput);

            if ($jumlahBayar < $total) {
                return redirect()->to($url)->withInput()
                    ->with('error', 'Jumlah pembayaran tunai tidak boleh kurang dari total transaksi.');
            }
        }

        $db      = db_connect();
        $tanggal = date('Y-m-d H:i:s');
        $db->transBegin();

        try {
            $poTerkunci = $db->query(
                'SELECT id_po, status FROM pemesanan_po WHERE id_po = ? AND cabang_id = ? FOR UPDATE',
                [$id, $this->cabangId()]
            )->getRowArray();

            if ($poTerkunci === null || $poTerkunci['status'] !== 'sudah_datang') {
                throw new \RuntimeException('PO sudah diproses atau tidak lagi tersedia untuk diambil.');
            }

            $trxModel = new TransaksiModel();
            $trxId    = (int) $trxModel->insert([
                'kode_transaksi'    => 'TMP-' . uniqid(),
                'pelanggan_id'      => (int) $po['pelanggan_id'],
                'cabang_id'         => $this->cabangId(),
                'pengguna_id'       => $this->kasirId(),
                'jenis'             => 'pembelian',
                'tanggal_transaksi' => $tanggal,
                'total'             => $total,
                'diskon'            => 0,
                'pajak'              => 0,
                'status'             => 'selesai',
            ], true);

            if ($trxId <= 0) {
                throw new \RuntimeException('Gagal menyimpan transaksi pengambilan.');
            }

            $kode = 'TRX-' . date('Ymd') . '-' . str_pad((string) $trxId, 3, '0', STR_PAD_LEFT);

            if (! $trxModel->update($trxId, ['kode_transaksi' => $kode])) {
                throw new \RuntimeException('Nomor transaksi gagal diperbarui.');
            }

            foreach ($detail as $row) {
                $barangId = (int) $row['barang_id'];
                $jumlah   = (int) $row['jumlah'];

                if ($jumlah < 1 || ! $db->table('stok_cabang')
                    ->where('cabang_id', $this->cabangId())
                    ->where('barang_id', $barangId)
                    ->where('jumlah_stok >=', $jumlah)
                    ->set('jumlah_stok', 'jumlah_stok - ' . $jumlah, false)
                    ->update() || $db->affectedRows() === 0) {
                    throw new \RuntimeException('Stok ' . $row['nama_barang'] . ' tidak mencukupi untuk pengambilan.');
                }

                if (! $db->table('detail_transaksi')->insert([
                    'transaksi_id' => $trxId,
                    'barang_id'    => $barangId,
                    'jumlah'       => $jumlah,
                    'harga'        => (float) $row['harga'],
                    'subtotal'     => (float) $row['subtotal'],
                ])) {
                    throw new \RuntimeException('Rincian produk transaksi gagal disimpan.');
                }
            }

            if (! (new PembayaranModel())->insert([
                'transaksi_id'       => $trxId,
                'tanggal_pembayaran' => $tanggal,
                'metode_pembayaran'  => $metode,
                'jumlah_bayar'       => $jumlahBayar,
                'status'             => 'lunas',
            ])) {
                throw new \RuntimeException('Pembayaran transaksi gagal disimpan.');
            }

            if (! $poModel->update($id, ['status' => 'selesai'])) {
                throw new \RuntimeException('Status PO gagal diperbarui.');
            }

            if (! $db->transCommit()) {
                throw new \RuntimeException('Transaksi pengambilan gagal diselesaikan.');
            }
        } catch (\Throwable $e) {
            $db->transRollback();
            log_message('error', 'Gagal menyelesaikan pengambilan PO {po}: {message}', [
                'po'      => $po['kode_po'],
                'message' => $e->getMessage(),
            ]);

            return redirect()->to($url)->withInput()->with('error', $e->getMessage());
        }

        return redirect()->to('kasir/transaksi/berhasil/' . $trxId)
            ->with('success', 'Pengambilan PO ' . $po['kode_po'] . ' berhasil diselesaikan.');
    }
}
