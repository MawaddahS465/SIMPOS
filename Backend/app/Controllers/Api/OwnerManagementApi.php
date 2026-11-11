<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\PemesananPoModel;
use App\Models\PoTimelineModel;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class OwnerManagementApi extends BaseController
{
    private function success(mixed $data, int $status = 200): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON([
            'success' => true,
            'data' => $data,
            'csrfToken' => service('security')->getHash(),
        ]);
    }

    private function failure(int $status, string $message): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON([
            'success' => false,
            'message' => $message,
            'csrfToken' => service('security')->getHash(),
        ]);
    }

    private function input(): ?array
    {
        $data = $this->request->getJSON(true);

        return is_array($data) ? $data : null;
    }

    private function branchRows(): array
    {
        $branches = db_connect()->table('cabang')
            ->select('id, kode_cabang, nama_cabang, kota, alamat, telepon, email, penanggung_jawab, status')
            ->where('deleted_at', null)
            ->orderBy('nama_cabang', 'ASC')
            ->get()
            ->getResultArray();

        return array_map(static fn (array $branch): array => [
            'id' => (int) $branch['id'],
            'kode_cabang' => $branch['kode_cabang'],
            'nama_cabang' => $branch['nama_cabang'],
            'kota' => $branch['kota'] ?? '',
            'alamat' => $branch['alamat'] ?? '',
            'telepon' => $branch['telepon'] ?? '',
            'email' => $branch['email'] ?? '',
            'penanggung_jawab' => $branch['penanggung_jawab'] ?? '',
            'status' => $branch['status'],
        ], $branches);
    }

    public function branches(): ResponseInterface
    {
        $db = db_connect();
        $branches = $this->branchRows();
        $result = [[
            'id' => 'pusat',
            'kode_cabang' => 'PST',
            'nama_cabang' => 'Gudang Pusat',
            'kota' => '',
            'alamat' => '',
            'telepon' => '',
            'email' => '',
            'penanggung_jawab' => '',
            'status' => 'aktif',
            'type' => 'Pusat',
            'stok_unit' => (int) $db->table('stok_pusat')->selectSum('jumlah_stok')->get()->getRowArray()['jumlah_stok'],
            'transaksi' => 0,
            'po_aktif' => 0,
            'pengajuan' => 0,
        ]];

        foreach ($branches as $branch) {
            $branchId = $branch['id'];
            $result[] = [
                ...$branch,
                'type' => 'Cabang',
                'stok_unit' => (int) $db->table('stok_cabang')->selectSum('jumlah_stok')->where('cabang_id', $branchId)->get()->getRowArray()['jumlah_stok'],
                'transaksi' => (int) $db->table('transaksi')->where('cabang_id', $branchId)->where('status', 'selesai')->countAllResults(),
                'po_aktif' => (int) $db->table('pemesanan_po')->where('cabang_id', $branchId)->whereIn('status', ['dipesan', 'menunggu', 'diproses', 'sudah_datang'])->countAllResults(),
                'pengajuan' => (int) $db->table('pengajuan_stok')->where('cabang_id', $branchId)->where('status', 'diajukan')->countAllResults(),
            ];
        }

        return $this->success($result);
    }

    public function upsertBranch(?int $id = null): ResponseInterface
    {
        $isNew = $id === null;
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }
        foreach (['name', 'code', 'city', 'address', 'phone', 'pic', 'status'] as $field) {
            if (! is_string($data[$field] ?? null)) {
                return $this->failure(422, 'Data cabang tidak lengkap.');
            }
        }

        $name = trim($data['name']);
        $code = strtoupper(trim($data['code']));
        $city = trim($data['city']);
        $address = trim($data['address']);
        $phone = trim($data['phone']);
        $pic = trim($data['pic']);
        $status = strtolower(trim($data['status']));
        $email = array_key_exists('email', $data) ? trim((string) $data['email']) : null;
        if (mb_strlen($name) < 2 || mb_strlen($name) > 100 || ! preg_match('/^[A-Z0-9]{2,8}$/', $code)
            || mb_strlen($city) < 2 || mb_strlen($city) > 100 || mb_strlen($address) < 3 || mb_strlen($address) > 1000
            || mb_strlen($phone) > 20 || mb_strlen($pic) < 2 || mb_strlen($pic) > 100
            || ($email !== null && mb_strlen($email) > 150)
            || ($email !== null && $email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL))
            || ! in_array($status, ['aktif', 'nonaktif'], true)) {
            return $this->failure(422, 'Nama, kode, lokasi, kontak, email, atau status cabang tidak valid.');
        }

        $db = db_connect();
        $duplicateSql = 'SELECT COUNT(*) AS total FROM cabang WHERE deleted_at IS NULL';
        $duplicateParams = [];
        if ($id !== null) {
            $duplicateSql .= ' AND id != ?';
            $duplicateParams[] = $id;
        }
        $duplicateSql .= ' AND (kode_cabang = ? OR LOWER(nama_cabang) = ?)';
        $duplicateParams[] = $code;
        $duplicateParams[] = mb_strtolower($name);
        $duplicate = (int) ($db->query($duplicateSql, $duplicateParams)->getRowArray()['total'] ?? 0);
        if ($duplicate > 0) {
            return $this->failure(409, 'Kode atau nama cabang sudah digunakan.');
        }

        $record = [
            'kode_cabang' => $code,
            'nama_cabang' => $name,
            'kota' => $city,
            'alamat' => $address,
            'telepon' => $phone !== '' ? $phone : null,
            'penanggung_jawab' => $pic,
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s'),
        ];
        if ($email !== null) {
            $record['email'] = $email !== '' ? $email : null;
        }
        if ($id === null) {
            $record['created_at'] = date('Y-m-d H:i:s');
            $db->table('cabang')->insert($record);
            $id = (int) $db->insertID();
        } else {
            $branch = $db->table('cabang')->where('id', $id)->where('deleted_at', null)->get()->getRowArray();
            if ($branch === null) {
                return $this->failure(404, 'Cabang tidak ditemukan.');
            }
            $db->table('cabang')->where('id', $id)->update($record);
        }

        if ($id <= 0) {
            return $this->failure(500, 'Data cabang gagal disimpan.');
        }

        return $this->success($this->branchRows(), $isNew ? 201 : 200);
    }

    public function stocks(): ResponseInterface
    {
        $db = db_connect();
        $products = $db->table('barang b')
            ->select('b.id, b.kode_barang, b.nama_barang, b.jenis, b.merek, b.harga_jual, b.status, k.nama_kategori')
            ->join('kategori_barang k', 'k.id = b.kategori_id', 'left')
            ->orderBy('b.nama_barang', 'ASC')
            ->get()
            ->getResultArray();
        $branches = $db->table('cabang')
            ->select('id, nama_cabang')
            ->where('status', 'aktif')
            ->where('deleted_at', null)
            ->orderBy('id', 'ASC')
            ->get()
            ->getResultArray();
        $result = [];

        foreach ($products as $product) {
            $center = $db->table('stok_pusat')->select('jumlah_stok')->where('barang_id', $product['id'])->get()->getRowArray();
            $result[] = [
                'branch_id' => 'pusat',
                'nama_cabang' => 'Gudang Pusat',
                'barang_id' => (int) $product['id'],
                'kode_barang' => $product['kode_barang'],
                'nama_barang' => $product['nama_barang'],
                'jenis' => $product['jenis'],
                'merek' => $product['merek'],
                'status_produk' => $product['status'],
                'harga_jual' => (float) $product['harga_jual'],
                'nama_kategori' => $product['nama_kategori'],
                'jumlah_stok' => (int) ($center['jumlah_stok'] ?? 0),
                'stok_minimum' => 0,
            ];
            foreach ($branches as $branch) {
                $stock = $db->table('stok_cabang')
                    ->select('jumlah_stok, stok_minimum')
                    ->where('barang_id', $product['id'])
                    ->where('cabang_id', $branch['id'])
                    ->get()
                    ->getRowArray();
                $result[] = [
                    'branch_id' => (int) $branch['id'],
                    'nama_cabang' => $branch['nama_cabang'],
                    'barang_id' => (int) $product['id'],
                    'kode_barang' => $product['kode_barang'],
                    'nama_barang' => $product['nama_barang'],
                    'jenis' => $product['jenis'],
                    'merek' => $product['merek'],
                    'status_produk' => $product['status'],
                    'harga_jual' => (float) $product['harga_jual'],
                    'nama_kategori' => $product['nama_kategori'],
                    'jumlah_stok' => (int) ($stock['jumlah_stok'] ?? 0),
                    'stok_minimum' => (int) ($stock['stok_minimum'] ?? 5),
                ];
            }
        }

        return $this->success($result);
    }

    public function receipts(): ResponseInterface
    {
        $rows = db_connect()->table('penerimaan_stok r')
            ->select('r.id_penerimaan, r.jumlah, r.created_at, r.catatan, r.detail_alokasi_id, a.id_alokasi, a.kode_alokasi, a.cabang_id, c.nama_cabang, b.id AS barang_id, b.kode_barang, b.nama_barang, u.nama AS admin_nama')
            ->join('detail_alokasi_stok d', 'd.id_detail_alokasi = r.detail_alokasi_id')
            ->join('alokasi_stok a', 'a.id_alokasi = d.alokasi_id')
            ->join('cabang c', 'c.id = a.cabang_id')
            ->join('barang b', 'b.id = d.barang_id')
            ->join('users u', 'u.id = r.admin_id', 'left')
            ->orderBy('r.created_at', 'DESC')
            ->get()
            ->getResultArray();
        foreach ($rows as &$row) {
            foreach (['id_penerimaan', 'jumlah', 'detail_alokasi_id', 'id_alokasi', 'cabang_id', 'barang_id'] as $field) {
                $row[$field] = (int) $row[$field];
            }
        }
        unset($row);

        return $this->success($rows);
    }

    public function mutations(): ResponseInterface
    {
        $db = db_connect();
        $rows = $db->table('mutasi_stok m')
            ->select('m.*, b.kode_barang, b.nama_barang, b.jenis, c.nama_cabang, u.nama AS petugas, r.id_penerimaan AS receipt_id')
            ->join('barang b', 'b.id = m.barang_id')
            ->join('cabang c', 'c.id = m.cabang_id')
            ->join('users u', 'u.id = m.pengguna_id', 'left')
            ->join('penerimaan_stok r', "m.event_key = CONCAT('receipt-', r.id_penerimaan)", 'left', false)
            ->orderBy('m.created_at', 'DESC')
            ->orderBy('m.id_mutasi', 'DESC')
            ->get()
            ->getResultArray();
        foreach ($rows as &$row) {
            foreach (['id_mutasi', 'cabang_id', 'barang_id', 'jumlah', 'saldo_sebelum', 'saldo_sesudah'] as $field) {
                $row[$field] = (int) $row[$field];
            }
        }
        unset($row);

        return $this->success($rows);
    }

    public function transactions(): ResponseInterface
    {
        $db = db_connect();
        $rows = $db->table('transaksi t')
            ->select('t.*, p.nama_pelanggan, p.no_hp, c.nama_cabang, u.nama AS kasir, pb.metode_pembayaran, pb.jumlah_bayar, pb.status AS status_bayar')
            ->join('pelanggan p', 'p.id_pelanggan = t.pelanggan_id', 'left')
            ->join('cabang c', 'c.id = t.cabang_id')
            ->join('users u', 'u.id = t.pengguna_id', 'left')
            ->join('pembayaran pb', 'pb.transaksi_id = t.id_transaksi', 'left')
            ->orderBy('t.tanggal_transaksi', 'DESC')
            ->orderBy('t.id_transaksi', 'DESC')
            ->get()
            ->getResultArray();
        $details = $db->table('detail_transaksi d')
            ->select('d.transaksi_id, d.barang_id, d.jumlah, d.harga, b.nama_barang, b.merek, b.jenis')
            ->join('barang b', 'b.id = d.barang_id')
            ->orderBy('d.id_detail_transaksi', 'ASC')
            ->get()
            ->getResultArray();
        $byTransaction = [];
        foreach ($details as $detail) {
            $byTransaction[$detail['transaksi_id']][] = [
                'id' => (int) $detail['barang_id'],
                'name' => $detail['nama_barang'],
                'brand' => $detail['merek'] ?? '',
                'type' => $detail['jenis'],
                'qty' => (int) $detail['jumlah'],
                'price' => (float) $detail['harga'],
                'subtotal' => (float) ($detail['jumlah'] * $detail['harga']),
            ];
        }
        foreach ($rows as &$row) {
            $row['items'] = $byTransaction[$row['id_transaksi']] ?? [];
            $row['id_transaksi'] = (int) $row['id_transaksi'];
            $row['cabang_id'] = (int) $row['cabang_id'];
            $row['total'] = (float) $row['total'];
            $row['tanggal_transaksi'] = (string) $row['tanggal_transaksi'];
        }
        unset($row);

        return $this->success($rows);
    }

    public function orders(): ResponseInterface
    {
        $db = db_connect();
        $orders = $db->table('pemesanan_po po')
            ->select('po.id_po, po.kode_po, po.pelanggan_id, po.cabang_id, po.pengguna_id, po.tanggal_po, po.total, po.status, po.catatan, po.transaksi_id, p.nama_pelanggan, p.no_hp, c.nama_cabang,
                (SELECT GROUP_CONCAT(CONCAT(b.nama_barang, \' ×\', d.jumlah) ORDER BY d.id_detail_po SEPARATOR \'|\') FROM detail_po d JOIN barang b ON b.id = d.barang_id WHERE d.po_id = po.id_po) AS produk_label')
            ->join('pelanggan p', 'p.id_pelanggan = po.pelanggan_id', 'left')
            ->join('cabang c', 'c.id = po.cabang_id')
            ->orderBy('po.tanggal_po', 'DESC')
            ->orderBy('po.id_po', 'DESC')
            ->get()
            ->getResultArray();
        $model = new PemesananPoModel();
        $timelineModel = new PoTimelineModel();
        foreach ($orders as &$order) {
            $order['id_po'] = (int) $order['id_po'];
            $order['pelanggan_id'] = (int) $order['pelanggan_id'];
            $order['cabang_id'] = (int) $order['cabang_id'];
            $order['total'] = (float) $order['total'];
            $order['items'] = $model->detail($order['id_po']);
            foreach ($order['items'] as &$item) {
                foreach (['id_detail_po', 'po_id', 'barang_id', 'jumlah'] as $field) {
                    $item[$field] = (int) $item[$field];
                }
                $item['harga'] = (float) $item['harga'];
                $item['subtotal'] = (float) $item['subtotal'];
            }
            unset($item);
            $order['timeline'] = $timelineModel->forPo($order['id_po']);
            $order['nama_pelanggan'] = $order['nama_pelanggan'] ?? 'Pelanggan';
        }
        unset($order);

        return $this->success($orders);
    }

    public function users(): ResponseInterface
    {
        $users = (new UserModel())->select('id, nama, username, email, phone, role, cabang_id, status')
            ->orderBy('nama', 'ASC')
            ->findAll();

        return $this->success(array_map(static fn (array $user): array => [
            'id' => (int) $user['id'],
            'nama' => $user['nama'],
            'username' => $user['username'],
            'email' => $user['email'] ?? '',
            'phone' => $user['phone'] ?? '',
            'role' => $user['role'],
            'cabang_id' => $user['cabang_id'] === null ? null : (int) $user['cabang_id'],
            'status' => $user['status'],
        ], $users));
    }

    public function saveUser(?int $id = null): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }
        $name = $data['name'] ?? null;
        $username = $data['username'] ?? null;
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? null;
        $branchId = $data['branchId'] ?? null;
        $email = array_key_exists('email', $data) ? $data['email'] : null;
        $phone = array_key_exists('phone', $data) ? $data['phone'] : null;
        if (! is_string($name) || ! is_string($username) || ! is_string($password) || ! is_string($role)
            || ($email !== null && ! is_string($email)) || ($phone !== null && ! is_string($phone))) {
            return $this->failure(422, 'Data pengguna tidak valid.');
        }
        $name = trim($name);
        $username = trim($username);
        $email = $email === null ? null : trim($email);
        $phone = $phone === null ? null : trim($phone);
        if (mb_strlen($name) < 2 || mb_strlen($name) > 100 || mb_strlen($username) < 2 || mb_strlen($username) > 50
            || ! in_array($role, ['kasir', 'admin', 'pemilik'], true)
            || ($email !== null && mb_strlen($email) > 150)
            || ($email !== null && $email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL))
            || ($phone !== null && mb_strlen($phone) > 30)
            || ($id === null && mb_strlen($password) < 6)
            || ($password !== '' && mb_strlen($password) < 6)) {
            return $this->failure(422, 'Nama, username, email, telepon, role, atau password tidak memenuhi ketentuan.');
        }
        $cabangId = null;
        if ($role !== 'pemilik') {
            $cabangId = filter_var($branchId, FILTER_VALIDATE_INT);
            if (! $cabangId || db_connect()->table('cabang')->where('id', $cabangId)->where('status', 'aktif')->where('deleted_at', null)->countAllResults() !== 1) {
                return $this->failure(422, 'Pilih cabang aktif untuk akun Kasir atau Admin.');
            }
        }

        $model = new UserModel();
        $duplicate = $model->where('username', $username)->first();
        if ($duplicate !== null && (int) $duplicate['id'] !== $id) {
            return $this->failure(409, 'Username sudah digunakan.');
        }
        $fields = ['nama' => $name, 'username' => $username, 'role' => $role, 'cabang_id' => $cabangId];
        if ($email !== null) {
            $fields['email'] = $email !== '' ? $email : null;
        }
        if ($phone !== null) {
            $fields['phone'] = $phone !== '' ? $phone : null;
        }
        if ($password !== '') {
            $fields['password'] = $password;
        }
        if ($id === null) {
            $fields['status'] = 'aktif';
            $savedId = $model->insert($fields, true);
        } else {
            if ($model->find($id) === null) {
                return $this->failure(404, 'Pengguna tidak ditemukan.');
            }
            $savedId = $model->update($id, $fields) ? $id : false;
        }
        if (! $savedId) {
            return $this->failure(500, 'Data pengguna gagal disimpan.');
        }

        return $this->success(['id' => (int) $savedId], $id === null ? 201 : 200);
    }

    public function userStatus(int $id): ResponseInterface
    {
        $data = $this->input();
        $status = $data['status'] ?? null;
        if (! is_string($status) || ! in_array($status, ['aktif', 'nonaktif'], true)) {
            return $this->failure(422, 'Status pengguna tidak valid.');
        }
        if ($id === (int) session()->get('user_id') && $status !== 'aktif') {
            return $this->failure(409, 'Akun yang sedang digunakan tidak dapat dinonaktifkan.');
        }
        $model = new UserModel();
        $user = $model->find($id);
        if ($user === null) {
            return $this->failure(404, 'Pengguna tidak ditemukan.');
        }
        if ($user['role'] === 'pemilik' && $status === 'nonaktif'
            && (int) $model->where('role', 'pemilik')->where('status', 'aktif')->countAllResults() <= 1) {
            return $this->failure(409, 'Tidak dapat menonaktifkan satu-satunya akun Pemilik aktif.');
        }
        if (! $model->update($id, ['status' => $status])) {
            return $this->failure(500, 'Status pengguna gagal diperbarui.');
        }

        return $this->success(['updated' => true]);
    }

    public function changePassword(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null
            || ! is_string($data['currentPassword'] ?? null)
            || ! is_string($data['newPassword'] ?? null)) {
            return $this->failure(422, 'Kata sandi saat ini dan kata sandi baru wajib diisi.');
        }

        $current = $data['currentPassword'];
        $new = $data['newPassword'];
        if (mb_strlen($new) < 8) {
            return $this->failure(422, 'Kata sandi baru minimal 8 karakter.');
        }
        if ($current === $new) {
            return $this->failure(422, 'Kata sandi baru harus berbeda dari kata sandi saat ini.');
        }

        $model = new UserModel();
        $userId = (int) session()->get('user_id');
        $user = $model->find($userId);
        if ($user === null) {
            return $this->failure(404, 'Akun Pemilik tidak ditemukan.');
        }

        $stored = (string) $user['password'];
        $valid = password_verify($current, $stored) || hash_equals($stored, $current);
        if (! $valid) {
            return $this->failure(422, 'Kata sandi saat ini salah.');
        }
        if (! $model->update($userId, ['password' => $new])) {
            return $this->failure(500, 'Kata sandi gagal diperbarui.');
        }

        return $this->success(['updated' => true]);
    }

    public function settings(): ResponseInterface
    {
        $rows = db_connect()->table('app_settings')->get()->getResultArray();
        $values = array_column($rows, 'setting_value', 'setting_key');

        return $this->success([
            'defaultMinimum' => isset($values['defaultMinimum']) ? (int) $values['defaultMinimum'] : 2,
            'storeName' => $values['storeName'] ?? 'Optik Mekar Jaya',
            'storePhone' => $values['storePhone'] ?? '',
            'storeAddress' => $values['storeAddress'] ?? '',
            'storeEmail' => $values['storeEmail'] ?? '',
            'storePic' => $values['storePic'] ?? '',
        ]);
    }

    public function saveSettings(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null || ! is_string($data['storeName'] ?? null)
            || ! is_string($data['storePhone'] ?? null) || ! is_string($data['storeAddress'] ?? null)) {
            return $this->failure(400, 'Data pengaturan tidak valid.');
        }
        $minimum = filter_var($data['defaultMinimum'] ?? null, FILTER_VALIDATE_INT);
        $storeEmail = is_string($data['storeEmail'] ?? null) ? trim($data['storeEmail']) : '';
        $storePic = is_string($data['storePic'] ?? null) ? trim($data['storePic']) : '';
        if ($minimum === false || $minimum < 0 || $minimum > 4294967295
            || mb_strlen(trim($data['storeName'])) < 2 || mb_strlen($data['storeName']) > 150
            || mb_strlen($data['storePhone']) > 30 || mb_strlen($data['storeAddress']) > 1000
            || mb_strlen($storeEmail) > 150
            || ($storeEmail !== '' && ! filter_var($storeEmail, FILTER_VALIDATE_EMAIL))
            || mb_strlen($storePic) > 100) {
            return $this->failure(422, 'Nama toko, kontak, email, penanggung jawab, alamat, atau batas minimum tidak valid.');
        }
        $db = db_connect();
        $now = date('Y-m-d H:i:s');
        foreach ([
            'defaultMinimum' => (string) $minimum,
            'storeName' => trim($data['storeName']),
            'storePhone' => trim($data['storePhone']),
            'storeAddress' => trim($data['storeAddress']),
            'storeEmail' => $storeEmail,
            'storePic' => $storePic,
        ] as $key => $value) {
            $db->table('app_settings')->replace(['setting_key' => $key, 'setting_value' => $value, 'updated_at' => $now]);
        }

        return $this->settings();
    }
}
