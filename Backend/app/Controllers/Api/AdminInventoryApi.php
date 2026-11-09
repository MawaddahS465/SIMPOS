<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\BarangModel;
use App\Models\StokCabangModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class AdminInventoryApi extends BaseController
{
    private function success(mixed $data, int $status = 200): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON([
            'success'   => true,
            'data'      => $data,
            'csrfToken' => service('security')->getHash(),
        ]);
    }

    private function failure(int $status, string $message): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON([
            'success'   => false,
            'message'   => $message,
            'csrfToken' => service('security')->getHash(),
        ]);
    }

    private function branchId(): int
    {
        return (int) session()->get('cabang_id');
    }

    private function input(): ?array
    {
        $data = $this->request->getJSON(true);

        return is_array($data) ? $data : null;
    }

    private function productData(array $data): ?array
    {
        foreach (['name', 'brand', 'category'] as $field) {
            if (! is_string($data[$field] ?? null)) {
                return null;
            }
        }

        $name     = trim($data['name']);
        $brand    = trim($data['brand']);
        $category = trim($data['category']);
        $price    = filter_var($data['price'] ?? null, FILTER_VALIDATE_FLOAT);

        if (mb_strlen($name) < 2 || mb_strlen($name) > 150) {
            return null;
        }
        if (mb_strlen($brand) < 1 || mb_strlen($brand) > 100 || mb_strlen($category) < 1 || mb_strlen($category) > 100) {
            return null;
        }
        if ($price === false || $price <= 0 || $price > 9999999999.99) {
            return null;
        }

        return [
            'name'     => $name,
            'brand'    => $brand !== '' ? $brand : null,
            'category' => $category,
            'price'    => round((float) $price, 2),
        ];
    }

    private function categoryId(string $name): int
    {
        $db = db_connect();
        $row = $db->table('kategori_barang')
            ->select('id')
            ->where('nama_kategori', $name)
            ->get()
            ->getRowArray();

        if ($row !== null) {
            return (int) $row['id'];
        }

        $now = date('Y-m-d H:i:s');
        $db->table('kategori_barang')->insert([
            'kode_kategori' => 'CAT-' . strtoupper(substr(hash('sha256', mb_strtolower($name)), 0, 16)),
            'nama_kategori' => $name,
            'status'        => 'aktif',
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        return (int) $db->insertID();
    }

    private function nextProductCode(string $type): string
    {
        $prefix = $type === 'Frame' ? 'FR' : 'LS';
        $model  = new BarangModel();

        do {
            $code = $prefix . '-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        } while ($model->where('kode_barang', $code)->first() !== null);

        return $code;
    }

    private function product(int $id): ?array
    {
        $row = db_connect()->table('barang b')
            ->select('b.id, b.kode_barang, b.nama_barang, b.jenis, b.merek, b.harga_jual, b.status, k.nama_kategori')
            ->join('kategori_barang k', 'k.id = b.kategori_id', 'left')
            ->where('b.id', $id)
            ->get()
            ->getRowArray();

        return $row ?: null;
    }

    public function products(): ResponseInterface
    {
        $type = trim((string) $this->request->getGet('type'));
        $status = trim((string) $this->request->getGet('status'));
        $query = trim((string) $this->request->getGet('q'));
        $category = trim((string) $this->request->getGet('category'));

        if (! in_array($type, ['Frame', 'Lensa'], true)) {
            return $this->failure(422, 'Jenis produk tidak valid.');
        }
        if (! in_array($status, ['', 'aktif', 'nonaktif'], true)) {
            return $this->failure(422, 'Filter status produk tidak valid.');
        }

        $builder = db_connect()->table('barang b')
            ->select('b.id, b.kode_barang, b.nama_barang, b.jenis, b.merek, b.harga_jual, b.status, k.nama_kategori')
            ->join('kategori_barang k', 'k.id = b.kategori_id', 'left')
            ->where('LOWER(b.jenis)', strtolower($type), false);

        if ($status !== '') {
            $builder->where('b.status', $status);
        }
        if ($category !== '') {
            $builder->where('k.nama_kategori', $category);
        }
        if ($query !== '') {
            $builder->groupStart()
                ->like('b.kode_barang', $query)
                ->orLike('b.nama_barang', $query)
                ->orLike('b.merek', $query)
                ->groupEnd();
        }

        return $this->success($builder->orderBy('b.nama_barang', 'ASC')->get()->getResultArray());
    }

    public function createProduct(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $type = $data['type'] ?? null;
        $product = $this->productData($data);
        if (! is_string($type) || ! in_array($type, ['Frame', 'Lensa'], true) || $product === null) {
            return $this->failure(422, 'Nama, kategori, harga, atau jenis produk tidak valid.');
        }

        $db = db_connect();
        $db->transBegin();

        try {
            $categoryId = $this->categoryId($product['category']);
            $now = date('Y-m-d H:i:s');
            $model = new BarangModel();
            $id = $model->insert([
                'kategori_id' => $categoryId,
                'kode_barang' => $this->nextProductCode($type),
                'nama_barang' => $product['name'],
                'jenis'       => $type,
                'merek'       => $product['brand'],
                'harga_jual'  => $product['price'],
                'status'      => 'aktif',
                'created_at'  => $now,
                'updated_at'  => $now,
            ], true);

            if (! $id) {
                throw new \RuntimeException('Produk gagal disimpan.');
            }

            (new StokCabangModel())->insert([
                'cabang_id'    => $this->branchId(),
                'barang_id'    => (int) $id,
                'jumlah_stok'  => 0,
                'stok_minimum' => 5,
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);
            $db->query(
                'INSERT INTO stok_pusat (barang_id, jumlah_stok, created_at, updated_at)
                 VALUES (?, 0, ?, ?)
                 ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)',
                [(int) $id, $now, $now]
            );

            if (! $db->transStatus() || ! $db->transCommit()) {
                throw new \RuntimeException('Transaksi penyimpanan produk gagal.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            log_message('error', 'Gagal menambahkan produk admin: {message}', ['message' => $error->getMessage()]);

            return $this->failure(500, 'Produk gagal disimpan.');
        }

        return $this->success($this->product((int) $id), 201);
    }

    public function updateProduct(int $id): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $existing = $this->product($id);
        if ($existing === null) {
            return $this->failure(404, 'Produk tidak ditemukan.');
        }

        $type = $data['type'] ?? null;
        $product = $this->productData($data);
        if (
            ! is_string($type)
            || ! in_array($type, ['Frame', 'Lensa'], true)
            || strtolower((string) $existing['jenis']) !== strtolower($type)
            || $product === null
        ) {
            return $this->failure(422, 'Data produk tidak valid.');
        }

        $db = db_connect();
        $db->transBegin();

        try {
            $now = date('Y-m-d H:i:s');
            $model = new BarangModel();
            if (! $model->update($id, [
                'kategori_id' => $this->categoryId($product['category']),
                'nama_barang' => $product['name'],
                'merek'       => $product['brand'],
                'harga_jual'  => $product['price'],
                'status'      => 'aktif',
                'updated_at'  => $now,
            ]) || ! $db->transStatus() || ! $db->transCommit()) {
                throw new \RuntimeException('Perubahan produk gagal disimpan.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            log_message('error', 'Gagal mengubah produk {product}: {message}', [
                'product' => $id,
                'message' => $error->getMessage(),
            ]);

            return $this->failure(500, 'Produk gagal diperbarui.');
        }

        return $this->success($this->product($id));
    }

    public function deactivateProduct(int $id): ResponseInterface
    {
        $model = new BarangModel();
        $product = $model->find($id);
        if ($product === null) {
            return $this->failure(404, 'Produk tidak ditemukan.');
        }
        if (! $model->update($id, ['status' => 'nonaktif', 'updated_at' => date('Y-m-d H:i:s')])) {
            return $this->failure(500, 'Produk gagal dinonaktifkan.');
        }

        return $this->success($this->product($id));
    }

    public function stocks(): ResponseInterface
    {
        $branchId = $this->branchId();
        $query = trim((string) $this->request->getGet('q'));

        $builder = db_connect()->table('barang b')
            ->select(
                'b.id, b.kode_barang, b.nama_barang, b.jenis, b.merek, b.status,
                COALESCE(s.jumlah_stok, 0) AS stok, COALESCE(s.stok_minimum, 5) AS stok_minimum',
                false
            )
            ->join('stok_cabang s', "s.barang_id = b.id AND s.cabang_id = {$branchId}", 'left')
            ->where('b.status', 'aktif');

        if ($query !== '') {
            $builder->groupStart()
                ->like('b.kode_barang', $query)
                ->orLike('b.nama_barang', $query)
                ->orLike('b.merek', $query)
                ->groupEnd();
        }

        return $this->success($builder->orderBy('b.nama_barang', 'ASC')->get()->getResultArray());
    }

    public function updateMinimum(int $id): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $minimum = filter_var($data['minimum'] ?? null, FILTER_VALIDATE_INT);
        if ($minimum === false || $minimum < 0 || $minimum > 4294967295) {
            return $this->failure(422, 'Batas minimum harus bilangan bulat nonnegatif.');
        }

        if ((new BarangModel())->find($id) === null) {
            return $this->failure(404, 'Produk tidak ditemukan.');
        }

        $now = date('Y-m-d H:i:s');
        $db = db_connect();
        $db->query(
            'INSERT INTO stok_cabang (cabang_id, barang_id, jumlah_stok, stok_minimum, created_at, updated_at)
             VALUES (?, ?, 0, ?, ?, ?)
             ON DUPLICATE KEY UPDATE stok_minimum = VALUES(stok_minimum), updated_at = VALUES(updated_at)',
            [$this->branchId(), $id, $minimum, $now, $now]
        );

        $row = $db->table('stok_cabang')
            ->select('barang_id, jumlah_stok, stok_minimum')
            ->where('cabang_id', $this->branchId())
            ->where('barang_id', $id)
            ->get()
            ->getRowArray();

        if ($row === null) {
            return $this->failure(500, 'Batas stok minimum gagal disimpan.');
        }

        return $this->success($row);
    }
}
