<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class OwnerStockFlowApi extends BaseController
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

    private function input(): ?array
    {
        $data = $this->request->getJSON(true);

        return is_array($data) ? $data : null;
    }

    private function userId(): int
    {
        return (int) session()->get('user_id');
    }

    private function requestRows(): array
    {
        $rows = db_connect()->table('pengajuan_stok p')
            ->select(
                'p.*, c.nama_cabang, b.kode_barang, b.nama_barang, b.jenis, b.merek,
                COALESCE(s.jumlah_stok, 0) AS stok_cabang, COALESCE(s.stok_minimum, 5) AS stok_minimum,
                u.nama AS nama_pengaju,
                COALESCE((SELECT SUM(d.jumlah_dialokasikan) FROM detail_alokasi_stok d
                    JOIN alokasi_stok a ON a.id_alokasi = d.alokasi_id WHERE a.pengajuan_id = p.id_pengajuan), 0) AS jumlah_dialokasikan,
                COALESCE((SELECT SUM(d.jumlah_diterima) FROM detail_alokasi_stok d
                    JOIN alokasi_stok a ON a.id_alokasi = d.alokasi_id WHERE a.pengajuan_id = p.id_pengajuan), 0) AS jumlah_diterima',
                false
            )
            ->join('cabang c', 'c.id = p.cabang_id')
            ->join('barang b', 'b.id = p.barang_id')
            ->join('users u', 'u.id = p.pengguna_id')
            ->join('stok_cabang s', 's.barang_id = p.barang_id AND s.cabang_id = p.cabang_id', 'left')
            ->orderBy('p.created_at', 'DESC')
            ->get()
            ->getResultArray();

        foreach ($rows as &$row) {
            $requested = (int) $row['jumlah_diminta'];
            $allocated = (int) $row['jumlah_dialokasikan'];
            $received = (int) $row['jumlah_diterima'];
            $row['sisa'] = max(0, $requested - $allocated);
            $row['state'] = $row['status'] === 'ditolak'
                ? 'Ditolak'
                : ($requested > 0 && $received >= $requested
                    ? 'Selesai'
                    : ($requested > 0 && $allocated >= $requested
                        ? 'Dialokasikan'
                        : ($allocated > 0 ? 'Sebagian' : 'Diajukan')));
        }
        unset($row);

        return $rows;
    }

    public function requests(): ResponseInterface
    {
        $rows = $this->requestRows();
        $branch = trim((string) $this->request->getGet('branch'));
        $status = trim((string) $this->request->getGet('status'));
        $query = trim((string) $this->request->getGet('q'));

        if ($branch !== '' && $branch !== 'all') {
            $branchId = filter_var($branch, FILTER_VALIDATE_INT);
            if ($branchId === false) {
                return $this->failure(422, 'Filter cabang tidak valid.');
            }
            $rows = array_values(array_filter($rows, static fn (array $row): bool => (int) $row['cabang_id'] === $branchId));
        }
        if ($status !== '' && $status !== 'Semua') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => $row['state'] === $status));
        }
        if ($query !== '') {
            $rows = array_values(array_filter($rows, static function (array $row) use ($query): bool {
                $text = $row['kode_pengajuan'] . ' ' . $row['nama_barang'] . ' ' . $row['kode_barang'] . ' ' . $row['nama_cabang'];
                return mb_stripos($text, $query) !== false;
            }));
        }

        return $this->success($rows);
    }

    public function rejectRequest(int $id): ResponseInterface
    {
        $data = $this->input();
        if ($data === null || ! is_string($data['reason'] ?? null)) {
            return $this->failure(400, 'Alasan penolakan harus berupa teks.');
        }
        $reason = trim($data['reason']);
        if (mb_strlen($reason) < 3 || mb_strlen($reason) > 2000) {
            return $this->failure(422, 'Alasan penolakan harus 3 sampai 2000 karakter.');
        }

        $db = db_connect();
        $db->transBegin();
        try {
            $request = $db->query(
                'SELECT p.id_pengajuan, p.status,
                    COALESCE((SELECT SUM(d.jumlah_dialokasikan) FROM detail_alokasi_stok d
                        JOIN alokasi_stok a ON a.id_alokasi = d.alokasi_id WHERE a.pengajuan_id = p.id_pengajuan), 0) AS allocated
                 FROM pengajuan_stok p WHERE p.id_pengajuan = ? FOR UPDATE',
                [$id]
            )->getRowArray();

            if ($request === null) {
                $db->transRollback();
                return $this->failure(404, 'Pengajuan tidak ditemukan.');
            }
            if ($request['status'] !== 'diajukan' || (int) $request['allocated'] > 0) {
                $db->transRollback();
                return $this->failure(409, 'Pengajuan yang sudah ditolak atau mulai dialokasikan tidak dapat ditolak.');
            }

            $db->table('pengajuan_stok')->where('id_pengajuan', $id)->update([
                'status'           => 'ditolak',
                'alasan_penolakan' => $reason,
                'ditolak_oleh'     => $this->userId(),
                'ditolak_pada'     => date('Y-m-d H:i:s'),
                'updated_at'       => date('Y-m-d H:i:s'),
            ]);

            if (! $db->transStatus() || ! $db->transCommit()) {
                throw new \RuntimeException('Penolakan pengajuan gagal disimpan.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            log_message('error', 'Gagal menolak pengajuan {request}: {message}', [
                'request' => $id,
                'message' => $error->getMessage(),
            ]);
            return $this->failure(500, 'Pengajuan gagal ditolak.');
        }

        return $this->success(['rejected' => true]);
    }

    public function allocationOptions(): ResponseInterface
    {
        $db = db_connect();
        $branches = $db->table('cabang')
            ->select('id, nama_cabang, kode_cabang')
            ->where('status', 'aktif')
            ->where('kode_cabang !=', 'PST')
            ->orderBy('nama_cabang', 'ASC')
            ->get()
            ->getResultArray();

        $products = $db->table('barang b')
            ->select('b.id, b.kode_barang, b.nama_barang, b.jenis, b.merek, COALESCE(s.jumlah_stok, 0) AS stok_pusat', false)
            ->join('stok_pusat s', 's.barang_id = b.id', 'left')
            ->where('b.status', 'aktif')
            ->whereIn('b.jenis', ['Frame', 'Lensa', 'frame', 'lensa'])
            ->orderBy('b.nama_barang', 'ASC')
            ->get()
            ->getResultArray();

        foreach ($products as &$product) {
            $product['reserved'] = (int) $db->table('detail_alokasi_stok d')
                ->select('COALESCE(SUM(d.jumlah_dialokasikan - d.jumlah_diterima), 0) AS total', false)
                ->join('alokasi_stok a', 'a.id_alokasi = d.alokasi_id')
                ->where('d.barang_id', $product['id'])
                ->get()
                ->getRowArray()['total'];
            $product['available'] = max(0, (int) $product['stok_pusat'] - $product['reserved']);
        }
        unset($product);

        $requests = array_values(array_filter(
            $this->requestRows(),
            static fn (array $row): bool => $row['status'] !== 'ditolak' && (int) $row['sisa'] > 0
        ));

        return $this->success(['branches' => $branches, 'products' => $products, 'requests' => $requests]);
    }

    public function allocations(): ResponseInterface
    {
        $db = db_connect();
        $headers = $db->table('alokasi_stok a')
            ->select('a.*, c.nama_cabang, p.kode_pengajuan, u.nama AS nama_pemilik')
            ->join('cabang c', 'c.id = a.cabang_id')
            ->join('users u', 'u.id = a.pemilik_id')
            ->join('pengajuan_stok p', 'p.id_pengajuan = a.pengajuan_id', 'left')
            ->orderBy('a.created_at', 'DESC')
            ->get()
            ->getResultArray();

        $allocations = [];
        foreach ($headers as $header) {
            $lines = $db->table('detail_alokasi_stok d')
                ->select('d.id_detail_alokasi, d.barang_id, d.jumlah_dialokasikan, d.jumlah_diterima, b.kode_barang, b.nama_barang, b.jenis, b.merek')
                ->join('barang b', 'b.id = d.barang_id')
                ->where('d.alokasi_id', $header['id_alokasi'])
                ->get()
                ->getResultArray();
            $total = array_sum(array_map(static fn (array $line): int => (int) $line['jumlah_dialokasikan'], $lines));
            $received = array_sum(array_map(static fn (array $line): int => (int) $line['jumlah_diterima'], $lines));

            $allocations[] = [
                'id_alokasi'    => (int) $header['id_alokasi'],
                'kode_alokasi'  => $header['kode_alokasi'],
                'tanggal'       => $header['created_at'],
                'cabang_id'     => (int) $header['cabang_id'],
                'nama_cabang'   => $header['nama_cabang'],
                'kode_pengajuan'=> $header['kode_pengajuan'],
                'nama_pemilik'  => $header['nama_pemilik'],
                'catatan'       => $header['catatan'],
                'status'        => $received >= $total ? 'Diterima' : ($received > 0 ? 'Diterima Sebagian' : 'Menunggu Diterima'),
                'jumlah_dialokasikan' => $total,
                'jumlah_diterima' => $received,
                'items'         => $lines,
            ];
        }

        return $this->success($allocations);
    }

    public function createAllocation(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }
        $branchId = filter_var($data['branchId'] ?? null, FILTER_VALIDATE_INT);
        $productId = filter_var($data['productId'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($data['quantity'] ?? null, FILTER_VALIDATE_INT);
        $requestId = ($data['requestId'] ?? null) === null || $data['requestId'] === ''
            ? null
            : filter_var($data['requestId'], FILTER_VALIDATE_INT);
        $key = $data['idempotencyKey'] ?? null;
        $note = $data['note'] ?? '';
        if (
            ! $branchId || ! $productId || $quantity === false || $quantity < 1
            || ($requestId === false) || ! is_string($key) || mb_strlen($key) < 8 || mb_strlen($key) > 80
            || ! is_string($note) || mb_strlen($note) > 2000
        ) {
            return $this->failure(422, 'Cabang, produk, jumlah, atau data alokasi tidak valid.');
        }

        $db = db_connect();
        $existing = $db->table('alokasi_stok')->where('idempotency_key', $key)->get()->getRowArray();
        if ($existing !== null) {
            return $this->success(['id_alokasi' => (int) $existing['id_alokasi'], 'kode_alokasi' => $existing['kode_alokasi'], 'duplicate' => true]);
        }

        $db->transBegin();
        try {
            $branch = $db->table('cabang')->where('id', $branchId)->where('status', 'aktif')->where('kode_cabang !=', 'PST')->get()->getRowArray();
            $product = $db->table('barang')->where('id', $productId)->where('status', 'aktif')->whereIn('jenis', ['Frame', 'Lensa', 'frame', 'lensa'])->get()->getRowArray();
            if ($branch === null || $product === null) {
                $db->transRollback();
                return $this->failure(422, 'Cabang atau produk tidak aktif.');
            }

            $center = $db->query('SELECT jumlah_stok FROM stok_pusat WHERE barang_id = ? FOR UPDATE', [$productId])->getRowArray();
            if ($center === null) {
                $now = date('Y-m-d H:i:s');
                $db->table('stok_pusat')->insert(['barang_id' => $productId, 'jumlah_stok' => 0, 'created_at' => $now, 'updated_at' => $now]);
                $center = ['jumlah_stok' => 0];
            }
            $reserved = (int) $db->table('detail_alokasi_stok d')
                ->select('COALESCE(SUM(d.jumlah_dialokasikan - d.jumlah_diterima), 0) AS total', false)
                ->join('alokasi_stok a', 'a.id_alokasi = d.alokasi_id')
                ->where('d.barang_id', $productId)
                ->get()
                ->getRowArray()['total'];
            $available = (int) $center['jumlah_stok'] - $reserved;
            if ($quantity > $available) {
                $db->transRollback();
                return $this->failure(409, 'Stok pusat tidak mencukupi. Saldo pusat dimulai dari 0 dan harus diisi terlebih dahulu.');
            }

            if ($requestId !== null) {
                $request = $db->query(
                    'SELECT * FROM pengajuan_stok WHERE id_pengajuan = ? FOR UPDATE',
                    [$requestId]
                )->getRowArray();
                if ($request === null || $request['status'] !== 'diajukan'
                    || (int) $request['cabang_id'] !== $branchId || (int) $request['barang_id'] !== $productId) {
                    $db->transRollback();
                    return $this->failure(409, 'Pengajuan tidak cocok dengan cabang/produk atau sudah ditolak.');
                }

                $allocated = (int) $db->table('detail_alokasi_stok d')
                    ->select('COALESCE(SUM(d.jumlah_dialokasikan), 0) AS total', false)
                    ->join('alokasi_stok a', 'a.id_alokasi = d.alokasi_id')
                    ->where('a.pengajuan_id', $requestId)
                    ->get()
                    ->getRowArray()['total'];
                if ($quantity > (int) $request['jumlah_diminta'] - $allocated) {
                    $db->transRollback();
                    return $this->failure(409, 'Jumlah alokasi melebihi sisa kebutuhan pengajuan.');
                }
            }

            $now = date('Y-m-d H:i:s');
            $db->table('alokasi_stok')->insert([
                'kode_alokasi'   => 'DIST-' . date('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(2))),
                'cabang_id'      => $branchId,
                'pengajuan_id'   => $requestId,
                'pemilik_id'     => $this->userId(),
                'catatan'        => trim($note) !== '' ? trim($note) : null,
                'idempotency_key'=> $key,
                'created_at'     => $now,
                'updated_at'     => $now,
            ]);
            $allocationId = (int) $db->insertID();
            if ($allocationId <= 0) {
                throw new \RuntimeException('Alokasi gagal dibuat.');
            }
            $db->table('detail_alokasi_stok')->insert([
                'alokasi_id'          => $allocationId,
                'barang_id'           => $productId,
                'jumlah_dialokasikan' => $quantity,
                'jumlah_diterima'     => 0,
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);
            $db->query(
                'INSERT INTO stok_cabang (cabang_id, barang_id, jumlah_stok, stok_minimum, created_at, updated_at)
                 VALUES (?, ?, 0, 5, ?, ?)
                 ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)',
                [$branchId, $productId, $now, $now]
            );

            if (! $db->transStatus() || ! $db->transCommit()) {
                throw new \RuntimeException('Alokasi gagal disimpan.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            log_message('error', 'Gagal membuat alokasi stok: {message}', ['message' => $error->getMessage()]);
            return $this->failure(500, 'Alokasi stok gagal disimpan.');
        }

        $row = $db->table('alokasi_stok')->where('id_alokasi', $allocationId)->get()->getRowArray();

        return $this->success(['id_alokasi' => $allocationId, 'kode_alokasi' => $row['kode_alokasi']], 201);
    }
}
