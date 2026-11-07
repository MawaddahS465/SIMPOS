<?php

namespace App\Controllers\Master;

use App\Controllers\BaseController;
use App\Models\KategoriBarangModel;
use CodeIgniter\Exceptions\PageNotFoundException;

class Kategori extends BaseController
{
    private KategoriBarangModel $kategori;

    public function __construct()
    {
        $this->kategori = new KategoriBarangModel();
    }

    public function index()
    {
        $cari = trim((string) $this->request->getGet('q'));

        if ($cari !== '') {
            $this->kategori
                ->groupStart()
                ->like('kode_kategori', $cari)
                ->orLike('nama_kategori', $cari)
                ->groupEnd();
        }

        $daftar = $this->kategori
            ->orderBy('nama_kategori', 'ASC')
            ->paginate(10);

        return view('master/kategori/index', [
            'judul'    => 'Kategori Barang',
            'kategori' => $daftar,
            'pager'    => $this->kategori->pager,
            'cari'     => $cari,
        ]);
    }

    public function create()
    {
        return view('master/kategori/form', [
            'judul'    => 'Tambah Kategori',
            'kategori' => null,
        ]);
    }

    public function store()
    {
        $data = $this->dataDariForm();

        if (! $this->kategori->validate($data)) {
            return redirect()->to('/kategori/baru')
                ->withInput()
                ->with('errors', $this->kategori->errors());
        }

        $this->kategori->insert($data);

        return redirect()->to('/kategori')
            ->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function edit($id = null)
    {
        $kategori = $this->cariAtau404($id);

        return view('master/kategori/form', [
            'judul'    => 'Edit Kategori',
            'kategori' => $kategori,
        ]);
    }

    public function update($id = null)
    {
        $this->cariAtau404($id);

        // Kode sendiri tidak dianggap duplikat saat mengedit.
        $this->kategori->setValidationRules([
            'kode_kategori' => "required|max_length[20]|is_unique[kategori_barang.kode_kategori,id,{$id}]",
            'nama_kategori' => 'required|max_length[100]',
            'status'        => 'required|in_list[aktif,nonaktif]',
        ]);

        $data = $this->dataDariForm();

        if (! $this->kategori->validate($data)) {
            return redirect()->to('/kategori/' . $id . '/edit')
                ->withInput()
                ->with('errors', $this->kategori->errors());
        }

        $this->kategori->update($id, $data);

        return redirect()->to('/kategori')
            ->with('success', 'Kategori berhasil diperbarui.');
    }

    public function delete($id = null)
    {
        $this->cariAtau404($id);

        $dipakai = db_connect()
            ->table('barang')
            ->where('kategori_id', $id)
            ->countAllResults();

        if ($dipakai > 0) {
            return redirect()->to('/kategori')
                ->with('error', "Kategori tidak bisa dihapus karena dipakai oleh {$dipakai} barang.");
        }

        $this->kategori->delete($id);

        return redirect()->to('/kategori')
            ->with('success', 'Kategori berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function cariAtau404($id): array
    {
        $kategori = $this->kategori->find($id);

        if ($kategori === null) {
            throw PageNotFoundException::forPageNotFound('Kategori tidak ditemukan.');
        }

        return $kategori;
    }

    /**
     * @return array<string, mixed>
     */
    private function dataDariForm(): array
    {
        return [
            'kode_kategori' => strtoupper(trim((string) $this->request->getPost('kode_kategori'))),
            'nama_kategori' => trim((string) $this->request->getPost('nama_kategori')),
            'keterangan'    => trim((string) $this->request->getPost('keterangan')) ?: null,
            'status'        => $this->request->getPost('status') === 'nonaktif' ? 'nonaktif' : 'aktif',
        ];
    }
}
