<?php

namespace App\Controllers\Kasir;

use App\Models\BarangModel;
use App\Models\PelangganModel;
use App\Models\PembayaranModel;
use App\Models\ResepModel;
use App\Models\TransaksiModel;

class Transaksi extends BaseKasir
{
    private const METODE = ['Tunai', 'Transfer Bank', 'Kartu Debit/Kredit', 'QRIS', 'E-Wallet'];

    public function index()
    {
        $tab   = (string) ($this->request->getGet('tab') ?? 'Semua');
        $cari  = trim((string) ($this->request->getGet('q') ?? ''));
        $merek = (string) ($this->request->getGet('merek') ?? 'all');
        $sort  = (string) ($this->request->getGet('sort') ?? 'relevan');

        $semua = (new BarangModel())->katalogCabang($this->cabangId());

        $merekList = array_values(array_unique(array_filter(array_column($semua, 'merek'))));
        sort($merekList);

        $katalog = array_values(array_filter($semua, static function (array $p) use ($tab, $cari, $merek): bool {
            if ($tab !== 'Semua' && $p['jenis'] !== $tab) {
                return false;
            }

            if ($merek !== 'all' && $p['merek'] !== $merek) {
                return false;
            }

            if ($cari !== '') {
                $haystack = mb_strtolower($p['nama_barang'] . ' ' . $p['merek'] . ' ' . $p['kode_barang'] . ' ' . $p['jenis']);

                if (! str_contains($haystack, mb_strtolower($cari))) {
                    return false;
                }
            }

            return true;
        }));

        usort($katalog, static function (array $a, array $b) use ($sort): int {
            if ($sort === 'murah') {
                return (float) $a['harga_jual'] <=> (float) $b['harga_jual'];
            }

            if ($sort === 'mahal') {
                return (float) $b['harga_jual'] <=> (float) $a['harga_jual'];
            }

            return strcmp($a['nama_barang'], $b['nama_barang']);
        });

        return view('kasir/transaksi_baru', [
            'judul'     => 'Transaksi Baru',
            'aktif'     => 'transaksi',
            'cari'      => true,
            'katalog'   => $katalog,
            'merekList' => $merekList,
            'tab'       => $tab,
            'cariQ'     => $cari,
            'merek'     => $merek,
            'sort'      => $sort,
            'ringkasan' => $this->cartSummary(),
        ]);
    }

    public function tambah()
    {
        $barangId = (int) $this->request->getPost('barang_id');
        $barang   = $this->barangAktif($barangId);
        $kembali  = $this->tujuanKeranjang();

        if ($barang === null) {
            return redirect()->to($kembali)->with('error', 'Produk tidak ditemukan atau sudah tidak aktif.');
        }

        $cart = $this->cartData();
        $qty  = (int) ($cart['items'][$barangId] ?? 0) + 1;
        $stok = $this->stokBarang($barangId);

        if ($qty > $stok) {
            return redirect()->to($kembali)
                ->with('error', 'Stok ' . $barang['nama_barang'] . ' hanya ' . $stok . ' unit.');
        }

        $cart['items'][$barangId] = $qty;
        $this->simpanCart($cart);

        return redirect()->to($kembali);
    }

    public function ubahQty()
    {
        $barangId = (int) $this->request->getPost('barang_id');
        $aksi     = (string) $this->request->getPost('aksi');
        $cart     = $this->cartData();
        $kembali  = $this->tujuanKeranjang();

        if (! isset($cart['items'][$barangId])) {
            return redirect()->to($kembali);
        }

        $qty = (int) $cart['items'][$barangId];

        if ($aksi === 'plus') {
            $qty++;
        } elseif ($aksi === 'minus') {
            $qty--;
        } else {
            $qty = (int) $this->request->getPost('qty');
        }

        if ($qty <= 0) {
            unset($cart['items'][$barangId]);
        } else {
            $stok = $this->stokBarang($barangId);

            if ($qty > $stok) {
                return redirect()->to($kembali)
                    ->with('error', 'Jumlah melebihi stok tersedia (' . $stok . ' unit).');
            }

            $cart['items'][$barangId] = $qty;
        }

        $this->simpanCart($cart);

        return redirect()->to($kembali);
    }

    public function hapus()
    {
        $kembali = $this->tujuanKeranjang();

        if ($this->request->getPost('semua') !== null) {
            $this->kosongkanCart();

            return redirect()->to($kembali);
        }

        $barangId = (int) $this->request->getPost('barang_id');
        $cart     = $this->cartData();

        unset($cart['items'][$barangId]);
        $this->simpanCart($cart);

        return redirect()->to($kembali);
    }

    private function tujuanKeranjang(): string
    {
        $tujuan = (string) $this->request->getPost('kembali');

        return in_array($tujuan, ['kasir/transaksi', 'kasir/checkout?step=confirm', 'kasir/checkout?step=payment'], true)
            ? $tujuan
            : 'kasir/transaksi';
    }

    public function checkout()
    {
        $ringkasan = $this->cartSummary();

        if ($ringkasan['rows'] === []) {
            return redirect()->to('kasir/transaksi')->with('error', 'Keranjang masih kosong.');
        }

        $step         = (string) $this->request->getGet('step');
        $konfirmasi   = in_array($step, ['confirm', 'payment'], true);
        $ringkasanStep = $step === 'payment';
        $cart    = $this->cartData();
        $cari    = trim((string) ($this->request->getGet('q') ?? ''));
        $builder = (new PelangganModel())->orderBy('nama_pelanggan', 'ASC');

        if ($cari !== '') {
            if (preg_match('/^PLG-0*(\d+)$/i', $cari, $kodePelanggan)) {
                $builder->where('id_pelanggan', (int) $kodePelanggan[1]);
            } else {
                $builder->groupStart()
                    ->like('nama_pelanggan', $cari)
                    ->orLike('no_hp', $cari)
                    ->groupEnd();
            }
        }

        $pelanggan = $builder->findAll();
        $terpilih  = null;
        $resep     = null;

        if (! empty($cart['pelanggan_id'])) {
            $terpilih = (new PelangganModel())->find((int) $cart['pelanggan_id']);
        }

        if ($konfirmasi && $terpilih === null) {
            return redirect()->to('kasir/checkout')->with('error', 'Pilih pelanggan terlebih dahulu.');
        }

        if ($terpilih !== null) {
            $resep = (new ResepModel())->terakhirPelanggan((int) $terpilih['id_pelanggan']);
        }

        return view('kasir/checkout', [
            'judul'        => $ringkasanStep ? 'Ringkasan & Pembayaran' : ($konfirmasi ? 'Konfirmasi Transaksi' : 'Pilih Pelanggan'),
            'aktif'        => 'transaksi',
            'ringkasan'    => $ringkasan,
            'pelanggan'    => $pelanggan,
            'terpilih'     => $terpilih,
            'resep'        => $resep,
            'metode'       => $cart['metode'] ?? 'Tunai',
            'daftarMetode' => self::METODE,
            'cariQ'        => $cari,
            'konfirmasi'   => $konfirmasi,
            'ringkasanStep' => $ringkasanStep,
        ]);
    }

    public function pilihPelanggan()
    {
        $id       = (int) $this->request->getPost('pelanggan_id');
        $pelanggan = (new PelangganModel())->find($id);

        if ($pelanggan === null) {
            return redirect()->to('kasir/checkout')->with('error', 'Pelanggan tidak ditemukan.');
        }

        $cart                 = $this->cartData();
        $cart['pelanggan_id'] = $id;
        $this->simpanCart($cart);

        return redirect()->to('kasir/checkout?step=confirm');
    }

    public function selesaikan()
    {
        $ringkasan = $this->cartSummary();

        if ($ringkasan['rows'] === []) {
            return redirect()->to('kasir/transaksi')->with('error', 'Keranjang masih kosong.');
        }

        $cart = $this->cartData();

        if (empty($cart['pelanggan_id'])) {
            return redirect()->to('kasir/checkout')->with('error', 'Pilih pelanggan terlebih dahulu.');
        }

        $pelanggan = (new PelangganModel())->find((int) $cart['pelanggan_id']);

        if ($pelanggan === null) {
            return redirect()->to('kasir/checkout')->with('error', 'Pelanggan tidak ditemukan.');
        }

        $metode = (string) $this->request->getPost('metode');

        if (! in_array($metode, self::METODE, true)) {
            return redirect()->to('kasir/checkout?step=payment')->with('error', 'Metode pembayaran tidak valid.');
        }

        $jumlahBayar = (float) $ringkasan['total'];

        if ($metode === 'Tunai') {
            $jumlahInput = trim((string) $this->request->getPost('jumlah_dibayar'));

            if (! preg_match('/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/D', $jumlahInput)) {
                return redirect()->to('kasir/checkout?step=payment')
                    ->withInput()
                    ->with('error', 'Jumlah pembayaran tunai harus berupa angka rupiah yang valid.');
            }

            $jumlahBayar = (float) str_replace('.', '', $jumlahInput);

            if ($jumlahBayar < $ringkasan['total']) {
                return redirect()->to('kasir/checkout?step=payment')
                    ->withInput()
                    ->with('error', 'Jumlah pembayaran tunai tidak boleh kurang dari total transaksi.');
            }
        }

        foreach ($ringkasan['rows'] as $row) {
            if ((int) $row['qty'] > (int) $row['stok']) {
                return redirect()->to('kasir/checkout?step=payment')
                    ->with('error', 'Stok ' . $row['nama_barang'] . ' tidak mencukupi (tersedia ' . $row['stok'] . ').');
            }
        }

        $db      = db_connect();
        $tanggal = date('Y-m-d H:i:s');

        $db->transBegin();

        try {
            $trxModel = new TransaksiModel();
            $trxId    = (int) $trxModel->insert([
                'kode_transaksi'    => 'TMP-' . uniqid(),
                'pelanggan_id'      => (int) $pelanggan['id_pelanggan'],
                'cabang_id'         => $this->cabangId(),
                'pengguna_id'       => $this->kasirId(),
                'jenis'             => 'pembelian',
                'tanggal_transaksi' => $tanggal,
                'total'             => $ringkasan['total'],
                'diskon'            => 0,
                'pajak'             => $ringkasan['pajak'],
                'status'            => 'selesai',
            ], true);

            if ($trxId <= 0) {
                throw new \RuntimeException('Gagal menyimpan transaksi.');
            }

            $kode = 'TRX-' . date('Ymd') . '-' . str_pad((string) $trxId, 3, '0', STR_PAD_LEFT);
            $trxModel->update($trxId, ['kode_transaksi' => $kode]);

            foreach ($ringkasan['rows'] as $row) {
                $db->table('detail_transaksi')->insert([
                    'transaksi_id' => $trxId,
                    'barang_id'    => (int) $row['id'],
                    'jumlah'       => (int) $row['qty'],
                    'harga'        => (float) $row['harga_jual'],
                    'subtotal'     => (float) $row['subtotal'],
                ]);

                $db->table('stok_cabang')
                    ->where('cabang_id', $this->cabangId())
                    ->where('barang_id', (int) $row['id'])
                    ->where('jumlah_stok >=', (int) $row['qty'])
                    ->set('jumlah_stok', 'jumlah_stok - ' . (int) $row['qty'], false)
                    ->update();

                if ($db->affectedRows() === 0) {
                    throw new \RuntimeException('Stok ' . $row['nama_barang'] . ' berubah saat transaksi diproses.');
                }
            }

            (new PembayaranModel())->insert([
                'transaksi_id'       => $trxId,
                'tanggal_pembayaran' => $tanggal,
                'metode_pembayaran'  => $metode,
                'jumlah_bayar'       => $jumlahBayar,
                'status'             => 'lunas',
            ]);

            $db->transCommit();
        } catch (\Throwable $e) {
            $db->transRollback();

            return redirect()->to('kasir/checkout?step=payment')->withInput()->with('error', $e->getMessage());
        }

        $this->kosongkanCart();

        return redirect()->to('kasir/transaksi/berhasil/' . $trxId)
            ->with('success', 'Transaksi berhasil disimpan.');
    }

    public function berhasil(int $id)
    {
        $trx = (new TransaksiModel())->where('cabang_id', $this->cabangId())->find($id);

        if ($trx === null) {
            return redirect()->to('kasir/riwayat')->with('error', 'Transaksi tidak ditemukan.');
        }

        $detail = (new TransaksiModel())->detail($id);
        $bayar  = db_connect()->table('pembayaran')->where('transaksi_id', $id)->get()->getRowArray();
        $cust   = ! empty($trx['pelanggan_id'])
            ? (new PelangganModel())->find((int) $trx['pelanggan_id'])
            : null;
        $cabang = db_connect()->table('cabang')
            ->where('id', (int) $trx['cabang_id'])
            ->get()
            ->getRowArray() ?? [];

        return view('kasir/transaksi_berhasil', [
            'judul'       => 'Transaksi Berhasil',
            'aktif'       => 'transaksi',
            'trx'         => $trx,
            'detail'      => $detail,
            'bayar'       => $bayar,
            'cust'        => $cust,
            'cabang'      => $cabang,
            'kasirNama'   => (string) session()->get('nama'),
            'pelangganNama' => (string) ($cust['nama_pelanggan'] ?? ''),
        ]);
    }
}
