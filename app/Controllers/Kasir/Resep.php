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
        $pilih  = (int) ($this->request->getGet('pilih') ?? 0);

        $semua = (new ResepModel())->denganPelanggan();

        foreach ($semua as &$row) {
            $row['kode_resep'] = 'RS-' . date('Y', strtotime($row['tanggal_resep'])) . '-' . str_pad((string) $row['id_resep'], 4, '0', STR_PAD_LEFT);
        }
        unset($row);

        $rows = array_values(array_filter($semua, static function (array $r) use ($cari, $filter): bool {
            if ($filter === 'aktif' && $r['status'] !== 'aktif') {
                return false;
            }

            if ($filter === 'expired' && $r['status'] === 'aktif') {
                return false;
            }

            if ($cari !== '') {
                $haystack = mb_strtolower($r['nama_pelanggan'] . ' ' . $r['kode_resep']);

                if (! str_contains($haystack, mb_strtolower($cari))) {
                    return false;
                }
            }

            return true;
        }));

        $terpilih = null;
        foreach ($semua as $r) {
            if ((int) $r['id_resep'] === $pilih) {
                $terpilih = $r;

                break;
            }
        }

        if ($terpilih === null) {
            $terpilih = $rows[0] ?? $semua[0] ?? null;
        }

        $aktif = count(array_filter($semua, static fn (array $r): bool => $r['status'] === 'aktif'));

        return view('kasir/resep', [
            'judul'     => 'Resep Mata',
            'aktif'     => 'resep',
            'rows'      => $rows,
            'total'     => count($semua),
            'aktifCount' => $aktif,
            'expired'   => count($semua) - $aktif,
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

        return redirect()->to('kasir/resep?pilih=' . $id)->with('success', 'Resep baru berhasil disimpan.');
    }
}
