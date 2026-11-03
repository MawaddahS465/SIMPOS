<?php

namespace App\Controllers\Kasir;

use App\Models\PelangganModel;
use App\Models\ResepModel;

class Resep extends BaseKasir
{
    public function index()
    {
        $cari   = trim((string) ($this->request->getGet('q') ?? ''));
        $filter = (string) ($this->request->getGet('filter') ?? 'semua');
        $filter = in_array($filter, ['semua', 'terbaru'], true) ? $filter : 'semua';
        $pilih  = (int) ($this->request->getGet('pilih') ?? 0);

        $semua = (new ResepModel())->denganPelanggan();

        foreach ($semua as &$row) {
            $row['kode_resep'] = 'RX-' . str_pad((string) $row['id_resep'], 3, '0', STR_PAD_LEFT);
        }
        unset($row);

        $rows = $semua;

        // "Resep Terbaru" hanya menampilkan satu resep terbaru per pelanggan.
        if ($filter === 'terbaru') {
            $sudah = [];

            $rows = array_values(array_filter($rows, static function (array $r) use (&$sudah): bool {
                $nama = (string) $r['nama_pelanggan'];

                if (isset($sudah[$nama])) {
                    return false;
                }

                $sudah[$nama] = true;

                return true;
            }));
        }

        // Pencarian mendukung nama, nomor HP, kode resep, tanggal, dan catatan.
        if ($cari !== '') {
            $needle = mb_strtolower($cari);

            $rows = array_values(array_filter($rows, static function (array $r) use ($needle): bool {
                $haystack = mb_strtolower(implode(' ', [
                    (string) $r['nama_pelanggan'],
                    (string) ($r['no_hp'] ?? ''),
                    (string) $r['kode_resep'],
                    (string) $r['tanggal_resep'],
                    (string) ($r['catatan'] ?? ''),
                ]));

                return str_contains($haystack, $needle);
            }));
        }

        $terpilih = null;
        foreach ($semua as $r) {
            if ((int) $r['id_resep'] === $pilih) {
                $terpilih = $r;

                break;
            }
        }

        $namaUnik = [];
        foreach ($semua as $r) {
            $namaUnik[mb_strtolower((string) $r['nama_pelanggan'])] = true;
        }

        return view('kasir/resep', [
            'judul'     => 'Resep Mata',
            'aktif'     => 'resep',
            'rows'      => $rows,
            'total'     => count($semua),
            'unik'      => count($namaUnik),
            'terbaru'   => $semua[0] ?? null,
            'terpilih'  => $terpilih,
            'cariQ'     => $cari,
            'filter'    => $filter,
            'pelanggan' => (new PelangganModel())->orderBy('nama_pelanggan', 'ASC')->findAll(),
        ]);
    }

    public function simpan()
    {
        $pelangganId = (int) $this->request->getPost('pelanggan_id');
        $tanggal     = (string) $this->request->getPost('tanggal_resep');

        if ((new PelangganModel())->find($pelangganId) === null) {
            return redirect()->to('kasir/resep')->with('error', 'Pelanggan tidak ditemukan.');
        }

        if ($tanggal === '' || strtotime($tanggal) === false) {
            return redirect()->to('kasir/resep')->with('error', 'Tanggal resep tidak valid.');
        }

        $ambil = static fn (string $key): ?string => trim((string) request()->getPost($key)) ?: null;

        $model = new ResepModel();
        $id    = (int) $model->insert([
            'fk_id_pelanggan' => $pelangganId,
            'tanggal_resep'   => $tanggal,
            'od_sph'          => $ambil('od_sph'),
            'od_cyl'          => $ambil('od_cyl'),
            'od_axis'         => $ambil('od_axis'),
            'os_sph'          => $ambil('os_sph'),
            'os_cyl'          => $ambil('os_cyl'),
            'os_axis'         => $ambil('os_axis'),
            'pd'              => $ambil('pd'),
            'add_power'       => $ambil('add_power'),
            'catatan'         => $ambil('catatan'),
            'status'          => 'aktif',
        ], true);

        if ($id <= 0) {
            return redirect()->to('kasir/resep')->with('error', 'Resep gagal disimpan.');
        }

        return redirect()->to('kasir/resep')->with('success', 'Resep baru berhasil disimpan.');
    }
}
