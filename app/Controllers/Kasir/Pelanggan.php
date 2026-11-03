<?php

namespace App\Controllers\Kasir;

use App\Models\PelangganModel;
use App\Models\ResepModel;

class Pelanggan extends BaseKasir
{
    public function index()
    {
        $cari     = trim((string) ($this->request->getGet('q') ?? ''));
        $filter   = (string) ($this->request->getGet('filter') ?? 'semua');
        $pilih    = (int) ($this->request->getGet('pilih') ?? 0);

        $semua = (new PelangganModel())->denganRingkasan();

        $rows = array_values(array_filter($semua, static function (array $c) use ($cari, $filter): bool {
            if ($filter === 'resep' && (int) $c['jml_resep'] === 0) {
                return false;
            }

            if ($filter === 'po' && (int) $c['po_aktif'] === 0) {
                return false;
            }

            if ($cari !== '') {
                $kode     = 'PLG-' . str_pad((string) $c['id_pelanggan'], 4, '0', STR_PAD_LEFT);
                $haystack = mb_strtolower($c['nama_pelanggan'] . ' ' . $c['no_hp'] . ' ' . $c['alamat'] . ' ' . $kode);

                if (! str_contains($haystack, mb_strtolower($cari))) {
                    return false;
                }
            }

            return true;
        }));

        $terpilih = null;
        foreach ($semua as $c) {
            if ((int) $c['id_pelanggan'] === $pilih) {
                $terpilih = $c;

                break;
            }
        }

        if ($terpilih === null) {
            $terpilih = $rows[0] ?? $semua[0] ?? null;
        }

        $resep       = null;
        $trxTerakhir = null;
        $poAktif     = null;

        if ($terpilih !== null) {
            $idPelanggan = (int) $terpilih['id_pelanggan'];
            $resep       = (new ResepModel())->terakhirPelanggan($idPelanggan);

            $trxTerakhir = db_connect()->table('transaksi')
                ->where('pelanggan_id', $idPelanggan)
                ->where('cabang_id', $this->cabangId())
                ->orderBy('tanggal_transaksi', 'DESC')
                ->get()
                ->getRowArray();

            $poAktif = db_connect()->table('pemesanan_po')
                ->where('pelanggan_id', $idPelanggan)
                ->where('cabang_id', $this->cabangId())
                ->whereIn('status', ['dipesan', 'menunggu', 'diproses', 'sudah_datang'])
                ->orderBy('tanggal_po', 'DESC')
                ->get()
                ->getRowArray();
        }

        $total      = count($semua);
        $punyaResep = count(array_filter($semua, static fn (array $c): bool => (int) $c['jml_resep'] > 0));
        $punyaPo    = count(array_filter($semua, static fn (array $c): bool => (int) $c['po_aktif'] > 0));

        return view('kasir/pelanggan', [
            'judul'       => 'Data Pelanggan',
            'aktif'       => 'pelanggan',
            'rows'        => $rows,
            'terpilih'    => $terpilih,
            'resep'       => $resep,
            'trxTerakhir' => $trxTerakhir,
            'poAktif'     => $poAktif,
            'cariQ'       => $cari,
            'filter'      => $filter,
            'total'       => $total,
            'punyaResep'  => $punyaResep,
            'punyaPo'     => $punyaPo,
        ]);
    }

    public function simpan()
    {
        $nama   = trim((string) $this->request->getPost('nama_pelanggan'));
        $hp     = trim((string) $this->request->getPost('no_hp'));
        $alamat = trim((string) $this->request->getPost('alamat'));

        if (mb_strlen($nama) < 2) {
            return redirect()->to('kasir/pelanggan')->with('error', 'Nama pelanggan minimal 2 karakter.');
        }

        $model = new PelangganModel();
        $id    = (int) $model->insert([
            'nama_pelanggan' => $nama,
            'no_hp'          => $hp !== '' ? $hp : null,
            'alamat'         => $alamat !== '' ? $alamat : null,
        ], true);

        if ($id <= 0) {
            return redirect()->to('kasir/pelanggan')->with('error', 'Pelanggan gagal disimpan.');
        }

        if ($this->request->getPost('kembali') === 'checkout') {
            $cart                 = $this->cartData();
            $cart['pelanggan_id'] = $id;
            $this->simpanCart($cart);

            return redirect()->to('kasir/checkout')->with('success', 'Pelanggan ' . $nama . ' ditambahkan dan dipilih.');
        }

        return redirect()->to('kasir/pelanggan?pilih=' . $id)->with('success', 'Pelanggan ' . $nama . ' ditambahkan.');
    }

    public function ubah()
    {
        $id     = (int) $this->request->getPost('id_pelanggan');
        $nama   = trim((string) $this->request->getPost('nama_pelanggan'));
        $hp     = trim((string) $this->request->getPost('no_hp'));
        $alamat = trim((string) $this->request->getPost('alamat'));

        $model = new PelangganModel();

        if ($model->find($id) === null) {
            return redirect()->to('kasir/pelanggan')->with('error', 'Pelanggan tidak ditemukan.');
        }

        if (mb_strlen($nama) < 2) {
            return redirect()->to('kasir/pelanggan?pilih=' . $id . '&ubah=1')
                ->with('error', 'Nama pelanggan minimal 2 karakter.');
        }

        $model->update($id, [
            'nama_pelanggan' => $nama,
            'no_hp'          => $hp !== '' ? $hp : null,
            'alamat'         => $alamat !== '' ? $alamat : null,
        ]);

        return redirect()->to('kasir/pelanggan?pilih=' . $id)->with('success', 'Data pelanggan diperbarui.');
    }
}
