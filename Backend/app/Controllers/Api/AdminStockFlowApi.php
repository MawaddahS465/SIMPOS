<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class AdminStockFlowApi extends BaseController
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

    private function userId(): int
    {
        return (int) session()->get('user_id');
    }

    private function input(): ?array
    {
        $data = $this->request->getJSON(true);

        return is_array($data) ? $data : null;
    }

    private function state(array $row): string
    {
        if ($row['status'] === 'ditolak') {
            return 'Ditolak';
        }

        $requested = (int) $row['jumlah_diminta'];
        $allocated = (int) $row['jumlah_dialokasikan'];
        $received  = (int) $row['jumlah_diterima'];

        if ($requested > 0 && $received >= $requested) {
            return 'Selesai';
        }
        if ($requested > 0 && $allocated >= $requested) {
            return 'Dialokasikan';
        }

        return $allocated > 0 ? 'Sebagian' : 'Diajukan';
    }

    private function existingReceiptResponse(string $key, int $detailId, int $quantity): ?ResponseInterface
    {
        $receipt = db_connect()->table('penerimaan_stok r')
            ->select('r.detail_alokasi_id, r.jumlah, a.cabang_id')
            ->join('detail_alokasi_stok d', 'd.id_detail_alokasi = r.detail_alokasi_id')
            ->join('alokasi_stok a', 'a.id_alokasi = d.alokasi_id')
            ->where('r.idempotency_key', $key)
            ->get()
            ->getRowArray();

        if ($receipt === null) {
            return null;
        }

        if ((int) $receipt['cabang_id'] !== $this->branchId()
            || (int) $receipt['detail_alokasi_id'] !== $detailId
            || (int) $receipt['jumlah'] !== $quantity) {
            return $this->failure(409, 'Kunci penerimaan sudah digunakan untuk data yang berbeda.');
        }

        return $this->success(['recorded' => true, 'duplicate' => true]);
    }

    public function requests(): ResponseInterface
    {
        $query = trim((string) $this->request->getGet('q'));
        $status = trim((string) $this->request->getGet('status'));
        $allowedStatuses = ['', 'Diajukan', 'Sebagian', 'Dialokasikan', 'Selesai', 'Ditolak'];
        if (! in_array($status, $allowedStatuses, true)) {
            return $this->failure(422, 'Filter status pengajuan tidak valid.');
        }

        $rows = db_connect()->table('pengajuan_stok p')
            ->select(
                'p.*, c.nama_cabang, b.kode_barang, b.nama_barang, b.jenis, b.merek,
                COALESCE(s.jumlah_stok, 0) AS stok, COALESCE(s.stok_minimum, 5) AS stok_minimum,
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
            ->where('p.cabang_id', $this->branchId())
            ->groupStart()
            ->like('p.kode_pengajuan', $query)
            ->orLike('b.kode_barang', $query)
            ->orLike('b.nama_barang', $query)
            ->groupEnd()
            ->orderBy('p.created_at', 'DESC')
            ->get()
            ->getResultArray();

        $rows = array_map(function (array $row): array {
            $row['state'] = $this->state($row);
            return $row;
        }, $rows);

        if ($status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => $row['state'] === $status));
        }

        return $this->success($rows);
    }

    public function createRequest(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $productId = filter_var($data['productId'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($data['quantity'] ?? null, FILTER_VALIDATE_INT);
        $note = $data['note'] ?? '';
        if (! $productId || $quantity === false || $quantity < 1 || $quantity > 4294967295) {
            return $this->failure(422, 'Produk dan jumlah pengajuan tidak valid.');
        }
        if (! is_string($note) || mb_strlen($note) > 2000) {
            return $this->failure(422, 'Catatan maksimal 2000 karakter.');
        }

        $product = db_connect()->table('barang')
            ->where('id', $productId)
            ->where('status', 'aktif')
            ->whereIn('jenis', ['Frame', 'Lensa', 'frame', 'lensa'])
            ->get()
            ->getRowArray();
        if ($product === null) {
            return $this->failure(422, 'Produk tidak aktif atau bukan frame/lensa.');
        }

        $db = db_connect();
        $now = date('Y-m-d H:i:s');
        try {
            $db->table('pengajuan_stok')->insert([
                'kode_pengajuan' => 'REQ-' . date('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(2))),
                'cabang_id'      => $this->branchId(),
                'barang_id'      => $productId,
                'pengguna_id'    => $this->userId(),
                'jumlah_diminta' => $quantity,
                'catatan'        => trim($note) !== '' ? trim($note) : null,
                'status'         => 'diajukan',
                'created_at'     => $now,
                'updated_at'     => $now,
            ]);
            $id = (int) $db->insertID();
        } catch (Throwable $error) {
            log_message('error', 'Gagal membuat pengajuan stok: {message}', ['message' => $error->getMessage()]);
            return $this->failure(500, 'Pengajuan stok gagal disimpan.');
        }

        return $this->success(['id_pengajuan' => $id], 201);
    }

    public function distributions(): ResponseInterface
    {
        $query = trim((string) $this->request->getGet('q'));
        $status = trim((string) $this->request->getGet('status'));
        if (! in_array($status, ['', 'Menunggu Diterima', 'Diterima Sebagian', 'Diterima'], true)) {
            return $this->failure(422, 'Filter status penerimaan tidak valid.');
        }

        $headers = db_connect()->table('alokasi_stok a')
            ->select('a.*, c.nama_cabang, p.kode_pengajuan, u.nama AS nama_pemilik')
            ->join('cabang c', 'c.id = a.cabang_id')
            ->join('users u', 'u.id = a.pemilik_id')
            ->join('pengajuan_stok p', 'p.id_pengajuan = a.pengajuan_id', 'left')
            ->where('a.cabang_id', $this->branchId())
            ->orderBy('a.created_at', 'DESC')
            ->get()
            ->getResultArray();

        $items = [];
        $db = db_connect();
        foreach ($headers as $header) {
            $lines = $db->table('detail_alokasi_stok d')
                ->select('d.id_detail_alokasi, d.barang_id, d.jumlah_dialokasikan, d.jumlah_diterima, b.kode_barang, b.nama_barang, b.jenis, b.merek, COALESCE(s.jumlah_stok, 0) AS stok')
                ->join('barang b', 'b.id = d.barang_id')
                ->join('stok_cabang s', 's.barang_id = d.barang_id AND s.cabang_id = ' . $this->branchId(), 'left')
                ->where('d.alokasi_id', $header['id_alokasi'])
                ->get()
                ->getResultArray();
            $lines = array_map(static function (array $line): array {
                foreach (['id_detail_alokasi', 'barang_id', 'jumlah_dialokasikan', 'jumlah_diterima', 'stok'] as $field) {
                    $line[$field] = (int) $line[$field];
                }

                return $line;
            }, $lines);
            $allocated = array_sum(array_map(static fn (array $line): int => (int) $line['jumlah_dialokasikan'], $lines));
            $received = array_sum(array_map(static fn (array $line): int => (int) $line['jumlah_diterima'], $lines));
            $state = $received >= $allocated
                ? 'Diterima'
                : ($received > 0 ? 'Diterima Sebagian' : 'Menunggu Diterima');

            if ($status !== '' && $status !== $state) {
                continue;
            }
            if ($query !== '') {
                $searchable = $header['kode_alokasi'] . ' ' . $header['nama_cabang'] . ' '
                    . implode(' ', array_column($lines, 'kode_barang')) . ' '
                    . implode(' ', array_column($lines, 'nama_barang'));
                if (mb_stripos($searchable, $query) === false) {
                    continue;
                }
            }

            $items[] = [
                'id_alokasi'    => (int) $header['id_alokasi'],
                'kode_alokasi'  => $header['kode_alokasi'],
                'tanggal'       => $header['created_at'],
                'cabang_id'     => (int) $header['cabang_id'],
                'nama_cabang'   => $header['nama_cabang'],
                'kode_pengajuan'=> $header['kode_pengajuan'],
                'nama_pemilik'  => $header['nama_pemilik'],
                'catatan'       => $header['catatan'],
                'status'        => $state,
                'jumlah_dialokasikan' => $allocated,
                'jumlah_diterima'    => $received,
                'items'         => $lines,
            ];
        }

        $receipts = $db->table('penerimaan_stok r')
            ->select('r.id_penerimaan, r.jumlah, r.created_at, r.catatan, a.kode_alokasi, b.kode_barang, b.nama_barang, u.nama AS admin_nama')
            ->join('detail_alokasi_stok d', 'd.id_detail_alokasi = r.detail_alokasi_id')
            ->join('alokasi_stok a', 'a.id_alokasi = d.alokasi_id')
            ->join('barang b', 'b.id = d.barang_id')
            ->join('users u', 'u.id = r.admin_id')
            ->where('a.cabang_id', $this->branchId())
            ->orderBy('r.created_at', 'DESC')
            ->get()
            ->getResultArray();
        $receipts = array_map(static function (array $receipt): array {
            $receipt['id_penerimaan'] = (int) $receipt['id_penerimaan'];
            $receipt['jumlah'] = (int) $receipt['jumlah'];

            return $receipt;
        }, $receipts);

        return $this->success(['distributions' => $items, 'receipts' => $receipts]);
    }

    public function receive(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $detailId = filter_var($data['detailId'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($data['quantity'] ?? null, FILTER_VALIDATE_INT);
        $key = $data['idempotencyKey'] ?? null;
        $note = $data['note'] ?? '';
        if (! $detailId || $quantity === false || $quantity < 1 || $quantity > 2147483647 || ! is_string($key) || mb_strlen($key) < 8 || mb_strlen($key) > 80) {
            return $this->failure(422, 'Detail alokasi, jumlah, atau kunci penerimaan tidak valid.');
        }
        if (! is_string($note) || mb_strlen($note) > 2000) {
            return $this->failure(422, 'Catatan maksimal 2000 karakter.');
        }

        $db = db_connect();
        $existingResponse = $this->existingReceiptResponse($key, (int) $detailId, (int) $quantity);
        if ($existingResponse !== null) {
            return $existingResponse;
        }

        $db->transBegin();
        try {
            $line = $db->query(
                'SELECT d.*, a.cabang_id, a.kode_alokasi FROM detail_alokasi_stok d
                 JOIN alokasi_stok a ON a.id_alokasi = d.alokasi_id
                 WHERE d.id_detail_alokasi = ? AND a.cabang_id = ? FOR UPDATE',
                [$detailId, $this->branchId()]
            )->getRowArray();
            if ($line === null) {
                $db->transRollback();
                return $this->failure(404, 'Alokasi tidak ditemukan untuk cabang ini.');
            }

            $existingResponse = $this->existingReceiptResponse($key, (int) $detailId, (int) $quantity);
            if ($existingResponse !== null) {
                $db->transRollback();
                return $existingResponse;
            }

            $remaining = (int) $line['jumlah_dialokasikan'] - (int) $line['jumlah_diterima'];
            if ($quantity > $remaining) {
                $db->transRollback();
                return $this->failure(409, 'Jumlah diterima melebihi sisa alokasi.');
            }

            $center = $db->query('SELECT jumlah_stok FROM stok_pusat WHERE barang_id = ? FOR UPDATE', [$line['barang_id']])->getRowArray();
            if ($center === null || (int) $center['jumlah_stok'] < $quantity) {
                $db->transRollback();
                return $this->failure(409, 'Saldo stok pusat tidak mencukupi untuk menyelesaikan penerimaan ini.');
            }

            $now = date('Y-m-d H:i:s');
            $db->query(
                'INSERT INTO stok_cabang (cabang_id, barang_id, jumlah_stok, stok_minimum, created_at, updated_at)
                 VALUES (?, ?, 0, 5, ?, ?)
                 ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)',
                [$this->branchId(), $line['barang_id'], $now, $now]
            );
            $branchRow = $db->query(
                'SELECT jumlah_stok FROM stok_cabang WHERE cabang_id = ? AND barang_id = ? FOR UPDATE',
                [$this->branchId(), $line['barang_id']]
            )->getRowArray();
            $before = (int) ($branchRow['jumlah_stok'] ?? 0);
            $after = $before + $quantity;

            $db->table('penerimaan_stok')->insert([
                'detail_alokasi_id' => $detailId,
                'admin_id'          => $this->userId(),
                'jumlah'            => $quantity,
                'catatan'           => trim($note) !== '' ? trim($note) : null,
                'idempotency_key'   => $key,
                'created_at'        => $now,
            ]);
            $receiptId = (int) $db->insertID();
            $db->table('detail_alokasi_stok')
                ->where('id_detail_alokasi', $detailId)
                ->set('jumlah_diterima', 'jumlah_diterima + ' . $quantity, false)
                ->set('updated_at', $now)
                ->update();
            if ($db->affectedRows() !== 1) {
                throw new \RuntimeException('Detail alokasi berubah saat penerimaan diproses.');
            }
            $db->table('stok_cabang')
                ->where('cabang_id', $this->branchId())
                ->where('barang_id', $line['barang_id'])
                ->set('jumlah_stok', 'jumlah_stok + ' . $quantity, false)
                ->set('updated_at', $now)
                ->update();
            if ($db->affectedRows() !== 1) {
                throw new \RuntimeException('Saldo stok cabang gagal diperbarui.');
            }
            $db->table('stok_pusat')
                ->where('barang_id', $line['barang_id'])
                ->where('jumlah_stok >=', $quantity)
                ->set('jumlah_stok', 'jumlah_stok - ' . $quantity, false)
                ->set('updated_at', $now)
                ->update();
            if ($db->affectedRows() !== 1) {
                throw new \RuntimeException('Saldo stok pusat berubah saat penerimaan diproses.');
            }
            $db->table('mutasi_stok')->insert([
                'cabang_id'     => $this->branchId(),
                'barang_id'     => $line['barang_id'],
                'pengguna_id'   => $this->userId(),
                'arah'          => 'IN',
                'sumber'        => 'Penerimaan',
                'jumlah'        => $quantity,
                'saldo_sebelum' => $before,
                'saldo_sesudah' => $after,
                'referensi'     => $line['kode_alokasi'],
                'event_key'     => 'receipt-' . $receiptId,
                'created_at'    => $now,
            ]);

            if (! $db->transStatus() || ! $db->transCommit()) {
                throw new \RuntimeException('Penerimaan stok gagal disimpan.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            $existingResponse = $this->existingReceiptResponse($key, (int) $detailId, (int) $quantity);
            if ($existingResponse !== null) {
                return $existingResponse;
            }
            log_message('error', 'Gagal mencatat penerimaan stok: {message}', ['message' => $error->getMessage()]);
            return $this->failure(500, 'Penerimaan stok gagal dicatat.');
        }

        return $this->success(['recorded' => true], 201);
    }

    public function mutations(): ResponseInterface
    {
        $query = trim((string) $this->request->getGet('q'));
        $direction = trim((string) $this->request->getGet('direction'));
        $source = trim((string) $this->request->getGet('source'));
        $mutationId = preg_match('/^(?:MUT-)?([0-9]+)$/i', $query, $matches) === 1
            ? filter_var($matches[1], FILTER_VALIDATE_INT)
            : false;
        if (! in_array($direction, ['', 'IN', 'OUT'], true)) {
            return $this->failure(422, 'Filter arah mutasi tidak valid.');
        }
        if (! in_array($source, ['', 'Penerimaan', 'Penjualan', 'Pengambilan PO', 'Pembatalan', 'Saldo Awal'], true)) {
            return $this->failure(422, 'Filter sumber mutasi tidak valid.');
        }

        $builder = db_connect()->table('mutasi_stok m')
            ->select('m.*, b.kode_barang, b.nama_barang, b.jenis, u.nama AS petugas')
            ->join('barang b', 'b.id = m.barang_id')
            ->join('users u', 'u.id = m.pengguna_id', 'left')
            ->where('m.cabang_id', $this->branchId());
        if ($direction !== '') {
            $builder->where('m.arah', $direction);
        }
        if ($source !== '') {
            $builder->where('m.sumber', $source);
        }
        if ($query !== '') {
            $builder->groupStart()
                ->like('m.referensi', $query)
                ->orLike('b.kode_barang', $query)
                ->orLike('b.nama_barang', $query)
                ->orLike('u.nama', $query);
            if ($mutationId !== false) {
                $builder->orWhere('m.id_mutasi', (int) $mutationId);
            }
            $builder->groupEnd();
        }

        $mutations = $builder->orderBy('m.created_at', 'DESC')->get()->getResultArray();
        $mutations = array_map(static function (array $mutation): array {
            foreach (['id_mutasi', 'barang_id', 'jumlah', 'saldo_sebelum', 'saldo_sesudah'] as $field) {
                $mutation[$field] = (int) $mutation[$field];
            }
            if ($mutation['pengguna_id'] !== null) {
                $mutation['pengguna_id'] = (int) $mutation['pengguna_id'];
            }

            return $mutation;
        }, $mutations);

        return $this->success($mutations);
    }
}
