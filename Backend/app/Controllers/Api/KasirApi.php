<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\BarangModel;
use App\Models\DetailTransaksiModel;
use App\Models\PembayaranModel;
use App\Models\PelangganModel;
use App\Models\PemesananPoModel;
use App\Models\ResepModel;
use App\Models\TransaksiModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class KasirApi extends BaseController
{
    private const PAYMENT_METHODS = [
        'Tunai',
        'Transfer Bank',
        'Kartu Debit/Kredit',
        'QRIS',
        'E-Wallet',
    ];

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

    /**
     * @return array<string, mixed>|null
     */
    private function input(): ?array
    {
        $data = $this->request->getJSON(true);

        return is_array($data) ? $data : null;
    }

    private function stringField(array $data, string $key, string $default = ''): ?string
    {
        if (! array_key_exists($key, $data)) {
            return $default;
        }

        return is_string($data[$key]) ? $data[$key] : null;
    }

    private function branchId(): int
    {
        return (int) session()->get('cabang_id');
    }

    private function userId(): int
    {
        return (int) session()->get('user_id');
    }

    /**
     * @return array{items: array<int, int>, pelanggan_id: int|null, metode: string}
     */
    private function cartData(): array
    {
        $cart = session()->get('kasir_cart');
        if (! is_array($cart)) {
            $cart = [];
        }

        $items = [];
        foreach (($cart['items'] ?? []) as $id => $qty) {
            if (filter_var($id, FILTER_VALIDATE_INT) && filter_var($qty, FILTER_VALIDATE_INT) && (int) $qty > 0) {
                $items[(int) $id] = (int) $qty;
            }
        }

        return [
            'items'        => $items,
            'pelanggan_id' => isset($cart['pelanggan_id']) ? (int) $cart['pelanggan_id'] : null,
            'metode'       => (string) ($cart['metode'] ?? 'Tunai'),
        ];
    }

    /**
     * @return array{rows: list<array<string, mixed>>, count: int, subtotal: float, pajak: float, total: float}
     */
    private function cartSummary(): array
    {
        $cart = $this->cartData();
        $rows = [];

        if ($cart['items'] !== []) {
            $products = db_connect()->table('barang b')
                ->select('b.id, b.kode_barang, b.nama_barang, b.merek, b.jenis, b.harga_jual, COALESCE(s.jumlah_stok, 0) AS stok')
                ->join('stok_cabang s', 's.barang_id = b.id AND s.cabang_id = ' . $this->branchId(), 'left')
                ->where('b.status', 'aktif')
                ->whereIn('b.id', array_keys($cart['items']))
                ->get()
                ->getResultArray();

            $byId = [];
            foreach ($products as $product) {
                $byId[(int) $product['id']] = $product;
            }

            foreach ($cart['items'] as $id => $qty) {
                if (! isset($byId[$id])) {
                    continue;
                }

                $row            = $byId[$id];
                $row['qty']     = $qty;
                $row['subtotal'] = (float) $row['harga_jual'] * $qty;
                $rows[]         = $row;
            }
        }

        $count    = array_sum(array_column($rows, 'qty'));
        $subtotal = array_sum(array_column($rows, 'subtotal'));
        $pajak    = round($subtotal * 0.11);

        return [
            'rows'     => $rows,
            'count'    => $count,
            'subtotal' => $subtotal,
            'pajak'    => $pajak,
            'total'    => $subtotal + $pajak,
        ];
    }

    public function catalog(): ResponseInterface
    {
        $query = trim((string) $this->request->getGet('q'));
        $type  = trim((string) $this->request->getGet('type'));
        $brand = trim((string) $this->request->getGet('brand'));
        $sort  = (string) $this->request->getGet('sort');

        $rows = (new BarangModel())->katalogCabang($this->branchId());
        $rows = array_values(array_filter($rows, static function (array $row) use ($query, $type, $brand): bool {
            if ($type !== '' && $type !== 'Semua' && $row['jenis'] !== $type) {
                return false;
            }
            if ($brand !== '' && $brand !== 'all' && $row['merek'] !== $brand) {
                return false;
            }
            if ($query !== '') {
                $searchable = mb_strtolower(implode(' ', [
                    $row['kode_barang'],
                    $row['nama_barang'],
                    $row['merek'] ?? '',
                    $row['jenis'],
                ]));
                if (! str_contains($searchable, mb_strtolower($query))) {
                    return false;
                }
            }

            return true;
        }));

        usort($rows, static function (array $left, array $right) use ($sort): int {
            if ($sort === 'murah') {
                return (float) $left['harga_jual'] <=> (float) $right['harga_jual'];
            }
            if ($sort === 'mahal') {
                return (float) $right['harga_jual'] <=> (float) $left['harga_jual'];
            }

            return strcmp((string) $left['nama_barang'], (string) $right['nama_barang']);
        });

        return $this->success($rows);
    }

    public function customers(): ResponseInterface
    {
        $query = mb_strtolower(trim((string) $this->request->getGet('q')));
        $rows  = (new PelangganModel())->denganRingkasan();

        if ($query !== '') {
            $rows = array_values(array_filter($rows, static function (array $row) use ($query): bool {
                return str_contains(mb_strtolower(implode(' ', [
                    $row['nama_pelanggan'],
                    $row['no_hp'] ?? '',
                    $row['alamat'] ?? '',
                    'PLG-' . str_pad((string) $row['id_pelanggan'], 4, '0', STR_PAD_LEFT),
                ])), $query);
            }));
        }

        return $this->success($rows);
    }

    public function createCustomer(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $name    = trim($this->stringField($data, 'name') ?? '');
        $phone   = trim($this->stringField($data, 'phone') ?? '');
        $address = trim($this->stringField($data, 'address') ?? '');
        if ($this->stringField($data, 'name') === null
            || $this->stringField($data, 'phone') === null
            || $this->stringField($data, 'address') === null) {
            return $this->failure(422, 'Nama, nomor telepon, dan alamat harus berupa teks.');
        }

        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            return $this->failure(422, 'Nama pelanggan harus terdiri dari 2 sampai 100 karakter.');
        }
        if (mb_strlen($phone) > 30 || mb_strlen($address) > 500) {
            return $this->failure(422, 'Nomor telepon atau alamat terlalu panjang.');
        }

        $model = new PelangganModel();
        $id    = $model->insert([
            'nama_pelanggan' => $name,
            'no_hp'          => $phone !== '' ? $phone : null,
            'alamat'         => $address !== '' ? $address : null,
        ], true);

        if (! $id) {
            return $this->failure(500, 'Pelanggan gagal disimpan.');
        }

        return $this->success($model->find((int) $id), 201);
    }

    public function updateCustomer(int $id): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $model = new PelangganModel();
        if ($model->find($id) === null) {
            return $this->failure(404, 'Pelanggan tidak ditemukan.');
        }

        $name    = trim($this->stringField($data, 'name') ?? '');
        $phone   = trim($this->stringField($data, 'phone') ?? '');
        $address = trim($this->stringField($data, 'address') ?? '');
        if ($this->stringField($data, 'name') === null
            || $this->stringField($data, 'phone') === null
            || $this->stringField($data, 'address') === null) {
            return $this->failure(422, 'Nama, nomor telepon, dan alamat harus berupa teks.');
        }
        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            return $this->failure(422, 'Nama pelanggan harus terdiri dari 2 sampai 100 karakter.');
        }
        if (mb_strlen($phone) > 30 || mb_strlen($address) > 500) {
            return $this->failure(422, 'Nomor telepon atau alamat terlalu panjang.');
        }

        if (! $model->update($id, [
            'nama_pelanggan' => $name,
            'no_hp'          => $phone !== '' ? $phone : null,
            'alamat'         => $address !== '' ? $address : null,
        ])) {
            return $this->failure(500, 'Data pelanggan gagal diperbarui.');
        }

        return $this->success($model->find($id));
    }

    public function recipes(): ResponseInterface
    {
        $customerId = (int) $this->request->getGet('customerId');
        $status      = trim((string) $this->request->getGet('status'));
        if (! in_array($status, ['', 'aktif', 'expired', 'kedaluwarsa'], true)) {
            return $this->failure(422, 'Filter status resep tidak valid.');
        }

        $builder    = db_connect()->table('resep r')
            ->select('r.*, p.nama_pelanggan, p.no_hp')
            ->join('pelanggan p', 'p.id_pelanggan = r.fk_id_pelanggan');

        if ($customerId > 0) {
            $builder->where('r.fk_id_pelanggan', $customerId);
        }
        if ($status !== '') {
            $builder->where('r.status', $status);
        }

        return $this->success($builder
            ->orderBy('r.tanggal_resep', 'DESC')
            ->orderBy('r.id_resep', 'DESC')
            ->get()
            ->getResultArray());
    }

    public function createRecipe(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $customerId = filter_var($data['customerId'] ?? null, FILTER_VALIDATE_INT);
        $date       = $this->stringField($data, 'date');
        if ($date === null) {
            return $this->failure(422, 'Tanggal resep harus berupa teks dengan format YYYY-MM-DD.');
        }
        $dateObject = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        if (! $customerId || (new PelangganModel())->find($customerId) === null) {
            return $this->failure(422, 'Pelanggan tidak ditemukan.');
        }
        if ($dateObject === false || $dateObject->format('Y-m-d') !== $date) {
            return $this->failure(422, 'Tanggal resep tidak valid.');
        }

        $fields = [
            'od_sph'    => 'odSph',
            'od_cyl'    => 'odCyl',
            'od_axis'   => 'odAxis',
            'os_sph'    => 'osSph',
            'os_cyl'    => 'osCyl',
            'os_axis'   => 'osAxis',
            'pd'        => 'pd',
            'add_power' => 'addPower',
            'catatan'   => 'notes',
        ];
        $recipe = [
            'fk_id_pelanggan' => (int) $customerId,
            'tanggal_resep'   => $date,
            'status'          => 'aktif',
        ];
        foreach ($fields as $column => $key) {
            $rawValue = $this->stringField($data, $key);
            if ($rawValue === null) {
                return $this->failure(422, 'Nilai resep dan catatan harus berupa teks.');
            }
            $value = trim($rawValue);
            if (mb_strlen($value) > 100) {
                return $this->failure(422, 'Nilai resep atau catatan terlalu panjang.');
            }
            $recipe[$column] = $value !== '' ? $value : null;
        }

        $model = new ResepModel();
        $id    = $model->insert($recipe, true);
        if (! $id) {
            return $this->failure(500, 'Resep gagal disimpan.');
        }

        return $this->success($model->find((int) $id), 201);
    }

    public function updateRecipe(int $id): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $model = new ResepModel();
        if ($model->find($id) === null) {
            return $this->failure(404, 'Resep tidak ditemukan.');
        }

        $date = $this->stringField($data, 'date');
        if ($date === null) {
            return $this->failure(422, 'Tanggal resep harus berupa teks dengan format YYYY-MM-DD.');
        }
        $dateObject = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        if ($dateObject === false || $dateObject->format('Y-m-d') !== $date) {
            return $this->failure(422, 'Tanggal resep tidak valid.');
        }

        $fields = [
            'od_sph'    => 'odSph',
            'od_cyl'    => 'odCyl',
            'od_axis'   => 'odAxis',
            'os_sph'    => 'osSph',
            'os_cyl'    => 'osCyl',
            'os_axis'   => 'osAxis',
            'pd'        => 'pd',
            'add_power' => 'addPower',
            'catatan'   => 'notes',
        ];
        $recipe = ['tanggal_resep' => $date];
        foreach ($fields as $column => $key) {
            $rawValue = $this->stringField($data, $key);
            if ($rawValue === null) {
                return $this->failure(422, 'Nilai resep dan catatan harus berupa teks.');
            }
            $value = trim($rawValue);
            if (mb_strlen($value) > 100) {
                return $this->failure(422, 'Nilai resep atau catatan terlalu panjang.');
            }
            $recipe[$column] = $value !== '' ? $value : null;
        }

        if (! $model->update($id, $recipe)) {
            return $this->failure(500, 'Resep gagal diperbarui.');
        }

        return $this->success($model->find($id));
    }

    public function cart(): ResponseInterface
    {
        return $this->success([
            'cart'    => $this->cartData(),
            'summary' => $this->cartSummary(),
        ]);
    }

    public function setCartItem(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $productId = filter_var($data['productId'] ?? null, FILTER_VALIDATE_INT);
        $quantity  = filter_var($data['quantity'] ?? null, FILTER_VALIDATE_INT);
        if (! $productId || $quantity === false || $quantity < 0) {
            return $this->failure(422, 'ID produk atau jumlah tidak valid.');
        }

        $product = (new BarangModel())->find($productId);
        if ($product === null || $product['status'] !== 'aktif') {
            return $this->failure(404, 'Produk tidak ditemukan atau tidak aktif.');
        }

        $stock = db_connect()->table('stok_cabang')
            ->select('jumlah_stok')
            ->where('cabang_id', $this->branchId())
            ->where('barang_id', $productId)
            ->get()
            ->getRowArray();
        $available = (int) ($stock['jumlah_stok'] ?? 0);
        if ($quantity > $available) {
            return $this->failure(409, 'Jumlah melebihi stok tersedia (' . $available . ' unit).');
        }

        $cart = $this->cartData();
        if ($quantity === 0) {
            unset($cart['items'][$productId]);
        } else {
            $cart['items'][$productId] = $quantity;
        }
        session()->set('kasir_cart', $cart);

        return $this->cart();
    }

    public function selectCartCustomer(): ResponseInterface
    {
        $data       = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }
        $customerId = filter_var($data['customerId'] ?? null, FILTER_VALIDATE_INT);
        if (! $customerId || (new PelangganModel())->find($customerId) === null) {
            return $this->failure(404, 'Pelanggan tidak ditemukan.');
        }

        $cart                 = $this->cartData();
        $cart['pelanggan_id'] = (int) $customerId;
        session()->set('kasir_cart', $cart);

        return $this->cart();
    }

    public function clearCart(): ResponseInterface
    {
        session()->remove('kasir_cart');

        return $this->cart();
    }

    public function checkout(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $cart    = $this->cartData();
        $summary = $this->cartSummary();
        if ($summary['rows'] === []) {
            return $this->failure(422, 'Keranjang masih kosong.');
        }

        $discount = filter_var($data['discountAmount'] ?? 0, FILTER_VALIDATE_INT);
        if ($discount === false || $discount < 0 || $discount > $summary['subtotal']) {
            return $this->failure(422, 'Nominal diskon tidak valid.');
        }

        $summary['subtotal'] -= $discount;
        $summary['pajak']     = round($summary['subtotal'] * 0.11);
        $summary['total']     = $summary['subtotal'] + $summary['pajak'];

        $customerId = filter_var($data['customerId'] ?? $cart['pelanggan_id'], FILTER_VALIDATE_INT);
        if (! $customerId || (new PelangganModel())->find($customerId) === null) {
            return $this->failure(422, 'Pilih pelanggan yang valid terlebih dahulu.');
        }

        $method = $this->stringField($data, 'paymentMethod', 'Tunai');
        if ($method === null || ! in_array($method, self::PAYMENT_METHODS, true)) {
            return $this->failure(422, 'Metode pembayaran tidak valid.');
        }

        $amount = $summary['total'];
        if ($method === 'Tunai') {
            $amount = filter_var($data['amountPaid'] ?? null, FILTER_VALIDATE_INT);
            if ($amount === false || $amount < $summary['total']) {
                return $this->failure(422, 'Pembayaran tunai harus berupa rupiah utuh dan tidak kurang dari total.');
            }
        }

        foreach ($summary['rows'] as $row) {
            if ((int) $row['qty'] > (int) $row['stok']) {
                return $this->failure(409, 'Stok ' . $row['nama_barang'] . ' tidak mencukupi.');
            }
        }

        $db      = db_connect();
        $date    = date('Y-m-d H:i:s');
        $db->transBegin();

        try {
            $transactionModel = new TransaksiModel();
            $transactionId    = (int) $transactionModel->insert([
                'kode_transaksi'    => 'TMP-' . bin2hex(random_bytes(8)),
                'pelanggan_id'      => (int) $customerId,
                'cabang_id'         => $this->branchId(),
                'pengguna_id'       => $this->userId(),
                'jenis'             => 'pembelian',
                'tanggal_transaksi' => $date,
                'total'             => $summary['total'],
                'diskon'            => $discount,
                'pajak'             => $summary['pajak'],
                'status'            => 'selesai',
            ], true);

            if ($transactionId <= 0) {
                throw new \RuntimeException('Gagal membuat transaksi.');
            }

            $code = 'TRX-' . date('Ymd') . '-' . str_pad((string) $transactionId, 3, '0', STR_PAD_LEFT);
            if (! $transactionModel->update($transactionId, ['kode_transaksi' => $code])) {
                throw new \RuntimeException('Nomor transaksi gagal disimpan.');
            }

            foreach ($summary['rows'] as $row) {
                if (! $db->table('detail_transaksi')->insert([
                    'transaksi_id' => $transactionId,
                    'barang_id'    => (int) $row['id'],
                    'jumlah'       => (int) $row['qty'],
                    'harga'        => (float) $row['harga_jual'],
                    'subtotal'     => (float) $row['subtotal'],
                ])) {
                    throw new \RuntimeException('Rincian transaksi gagal disimpan.');
                }

                $db->table('stok_cabang')
                    ->where('cabang_id', $this->branchId())
                    ->where('barang_id', (int) $row['id'])
                    ->where('jumlah_stok >=', (int) $row['qty'])
                    ->set('jumlah_stok', 'jumlah_stok - ' . (int) $row['qty'], false)
                    ->update();

                if ($db->affectedRows() !== 1) {
                    throw new \RuntimeException('Stok ' . $row['nama_barang'] . ' berubah saat transaksi diproses.');
                }
            }

            if (! (new PembayaranModel())->insert([
                'transaksi_id'       => $transactionId,
                'tanggal_pembayaran' => $date,
                'metode_pembayaran'  => $method,
                'jumlah_bayar'       => $amount,
                'status'             => 'lunas',
            ])) {
                throw new \RuntimeException('Pembayaran gagal disimpan.');
            }

            if (! $db->transCommit()) {
                throw new \RuntimeException('Transaksi gagal diselesaikan.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            log_message('error', 'Gagal menyimpan transaksi Kasir: {message}', ['message' => $error->getMessage()]);

            return $this->failure(409, 'Transaksi gagal diproses. Pastikan stok dan data pembayaran valid, lalu coba lagi.');
        }

        session()->remove('kasir_cart');
        $transaction = (new TransaksiModel())->riwayatSatuCabang($this->branchId(), $transactionId);

        return $this->success([
            'transaction' => $transaction,
            'items'       => (new TransaksiModel())->detail($transactionId),
        ], 201);
    }

    public function transactions(): ResponseInterface
    {
        $status = trim((string) $this->request->getGet('status'));
        $query  = trim((string) $this->request->getGet('q'));
        $allowedStatuses = ['', 'selesai', 'pending', 'dibatalkan'];
        if (! in_array($status, $allowedStatuses, true)) {
            return $this->failure(422, 'Filter status transaksi tidak valid.');
        }

        return $this->success((new TransaksiModel())->riwayatCabang($this->branchId(), $status, $query));
    }

    public function transaction(int $id): ResponseInterface
    {
        $model = new TransaksiModel();
        $row   = $model->riwayatSatuCabang($this->branchId(), $id);
        if ($row === null) {
            return $this->failure(404, 'Transaksi tidak ditemukan.');
        }

        return $this->success([
            'transaction' => $row,
            'items'       => $model->detail($id),
            'payment'     => db_connect()->table('pembayaran')
                ->where('transaksi_id', $id)
                ->get()
                ->getResultArray(),
        ]);
    }

    public function orders(): ResponseInterface
    {
        $status = trim((string) $this->request->getGet('status'));
        $query  = trim((string) $this->request->getGet('q'));
        $allowedStatuses = ['', 'dipesan', 'menunggu', 'diproses', 'sudah_datang', 'selesai'];
        if (! in_array($status, $allowedStatuses, true)) {
            return $this->failure(422, 'Filter status PO tidak valid.');
        }

        return $this->success((new PemesananPoModel())->daftarCabang($this->branchId(), $status, $query));
    }

    public function createOrder(): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $customerId = filter_var($data['customerId'] ?? null, FILTER_VALIDATE_INT);
        $productId  = filter_var($data['productId'] ?? null, FILTER_VALIDATE_INT);
        $quantity   = filter_var($data['quantity'] ?? null, FILTER_VALIDATE_INT);
        $customer   = $customerId ? (new PelangganModel())->find($customerId) : null;
        $product    = $productId ? (new BarangModel())->find($productId) : null;

        if ($customer === null) {
            return $this->failure(422, 'Pelanggan tidak ditemukan.');
        }
        if ($product === null || $product['status'] !== 'aktif' || $product['jenis'] === 'Aksesoris') {
            return $this->failure(422, 'Pilih produk frame atau lensa yang aktif.');
        }
        if ($quantity === false || $quantity < 1 || $quantity > 1000) {
            return $this->failure(422, 'Jumlah harus bilangan bulat antara 1 dan 1000.');
        }

        $notes = $this->stringField($data, 'notes');
        if ($notes === null || mb_strlen($notes) > 2000) {
            return $this->failure(422, 'Catatan PO harus berupa teks maksimal 2000 karakter.');
        }

        $recipeId = null;
        if (isset($data['recipeId']) && $data['recipeId'] !== '') {
            $recipeId = filter_var($data['recipeId'], FILTER_VALIDATE_INT);
            $recipe   = $recipeId ? (new ResepModel())->find($recipeId) : null;
            if ($recipe === null || (int) $recipe['fk_id_pelanggan'] !== (int) $customerId || $recipe['status'] !== 'aktif') {
                return $this->failure(422, 'Resep tidak ditemukan untuk pelanggan yang dipilih.');
            }
        } elseif ($product['jenis'] === 'Lensa') {
            $recipe = (new ResepModel())->terakhirPelanggan((int) $customerId);
            $recipeId = $recipe ? (int) $recipe['id_resep'] : null;
            if ($recipeId === null) {
                return $this->failure(422, 'Pelanggan belum memiliki resep aktif untuk pesanan lensa.');
            }
        }

        $price = (float) $product['harga_jual'];
        $total = $price * (int) $quantity;
        $date  = date('Y-m-d H:i:s');
        $db    = db_connect();
        $db->transBegin();

        try {
            $model = new PemesananPoModel();
            $id    = (int) $model->insert([
                'kode_po'                  => 'TMP-' . bin2hex(random_bytes(8)),
                'pelanggan_id'             => (int) $customerId,
                'cabang_id'                => $this->branchId(),
                'pengguna_id'              => $this->userId(),
                'resep_id'                 => $recipeId,
                'tanggal_po'               => $date,
                'tanggal_estimasi_selesai' => date('Y-m-d', strtotime('+7 days')),
                'total'                    => $total,
                'status'                   => 'dipesan',
                'catatan'                  => trim($notes) ?: null,
            ], true);

            if ($id <= 0) {
                throw new \RuntimeException('PO gagal disimpan.');
            }

            $code = 'PO-' . date('Y') . '-' . str_pad((string) $id, 4, '0', STR_PAD_LEFT);
            if (! $model->update($id, ['kode_po' => $code])
                || ! $db->table('detail_po')->insert([
                    'po_id'     => $id,
                    'barang_id' => (int) $productId,
                    'jumlah'    => (int) $quantity,
                    'harga'     => $price,
                    'subtotal'  => $total,
                    'catatan'   => trim($notes) ?: null,
                ])
                || ! $db->transStatus()
                || ! $db->transCommit()) {
                throw new \RuntimeException('Rincian PO gagal disimpan.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            log_message('error', 'Gagal menyimpan PO Kasir: {message}', ['message' => $error->getMessage()]);

            return $this->failure(500, 'PO gagal disimpan. Periksa data dan coba lagi.');
        }

        return $this->success([
            'order' => $model->satu($id),
            'items' => $model->detail($id, $this->branchId()),
        ], 201);
    }

    public function order(int $id): ResponseInterface
    {
        $model = new PemesananPoModel();
        $order = $model->satu($id);
        if ($order === null || (int) $order['cabang_id'] !== $this->branchId()) {
            return $this->failure(404, 'PO tidak ditemukan.');
        }

        return $this->success([
            'order' => $order,
            'items' => $model->detail($id, $this->branchId()),
        ]);
    }

    public function completeOrder(int $id): ResponseInterface
    {
        $data = $this->input();
        if ($data === null) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $method = $this->stringField($data, 'paymentMethod');
        if ($method === null || ! in_array($method, self::PAYMENT_METHODS, true)) {
            return $this->failure(422, 'Metode pembayaran tidak valid.');
        }

        $db     = db_connect();
        $model  = new PemesananPoModel();
        $date   = date('Y-m-d H:i:s');
        $db->transBegin();

        try {
            $lockedOrder = $db->query(
                'SELECT id_po, kode_po, pelanggan_id, cabang_id, status FROM pemesanan_po WHERE id_po = ? AND cabang_id = ? FOR UPDATE',
                [$id, $this->branchId()]
            )->getRowArray();

            if ($lockedOrder === null) {
                $db->transRollback();

                return $this->failure(404, 'PO tidak ditemukan.');
            }
            if ($lockedOrder['status'] !== 'sudah_datang') {
                $db->transRollback();

                return $this->failure(409, 'Pengambilan hanya dapat diproses satu kali untuk PO berstatus sudah datang.');
            }

            $items = $model->detail($id, $this->branchId());
            if ($items === []) {
                $db->transRollback();

                return $this->failure(422, 'PO ini belum memiliki produk untuk diproses.');
            }

            $total = array_sum(array_map(static fn (array $item): float => (float) $item['subtotal'], $items));
            $amount = $total;
            if ($method === 'Tunai') {
                $amount = filter_var($data['amountPaid'] ?? null, FILTER_VALIDATE_INT);
                if ($amount === false || $amount < $total) {
                    $db->transRollback();

                    return $this->failure(422, 'Pembayaran tunai harus berupa rupiah utuh dan tidak kurang dari total.');
                }
            }

            $transactionModel = new TransaksiModel();
            $transactionId    = (int) $transactionModel->insert([
                'kode_transaksi'    => 'TMP-' . bin2hex(random_bytes(8)),
                'pelanggan_id'      => (int) $lockedOrder['pelanggan_id'],
                'cabang_id'         => $this->branchId(),
                'pengguna_id'       => $this->userId(),
                'jenis'             => 'pembelian',
                'tanggal_transaksi' => $date,
                'total'             => $total,
                'diskon'            => 0,
                'pajak'             => 0,
                'status'            => 'selesai',
            ], true);
            if ($transactionId <= 0) {
                throw new \RuntimeException('Transaksi pengambilan gagal disimpan.');
            }

            $transactionCode = 'TRX-' . date('Ymd') . '-' . str_pad((string) $transactionId, 3, '0', STR_PAD_LEFT);
            if (! $transactionModel->update($transactionId, ['kode_transaksi' => $transactionCode])) {
                throw new \RuntimeException('Nomor transaksi gagal disimpan.');
            }

            foreach ($items as $item) {
                $quantity = (int) $item['jumlah'];
                $db->table('stok_cabang')
                    ->where('cabang_id', $this->branchId())
                    ->where('barang_id', (int) $item['barang_id'])
                    ->where('jumlah_stok >=', $quantity)
                    ->set('jumlah_stok', 'jumlah_stok - ' . $quantity, false)
                    ->update();
                if ($quantity < 1 || $db->affectedRows() !== 1) {
                    throw new \RuntimeException('Stok ' . $item['nama_barang'] . ' tidak mencukupi untuk pengambilan.');
                }

                if (! (new DetailTransaksiModel())->insert([
                    'transaksi_id' => $transactionId,
                    'barang_id'    => (int) $item['barang_id'],
                    'jumlah'       => $quantity,
                    'harga'        => (float) $item['harga'],
                    'subtotal'     => (float) $item['subtotal'],
                ])) {
                    throw new \RuntimeException('Rincian transaksi pengambilan gagal disimpan.');
                }
            }

            if (! (new PembayaranModel())->insert([
                'transaksi_id'       => $transactionId,
                'tanggal_pembayaran' => $date,
                'metode_pembayaran'  => $method,
                'jumlah_bayar'       => $amount,
                'status'             => 'lunas',
            ]) || ! $model->update($id, ['status' => 'selesai']) || ! $db->transCommit()) {
                throw new \RuntimeException('Pengambilan PO gagal diselesaikan.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            log_message('error', 'Gagal menyelesaikan PO {po}: {message}', [
                'po'      => $id,
                'message' => $error->getMessage(),
            ]);

            return $this->failure(409, 'Pengambilan gagal diproses. Pastikan stok tersedia lalu coba lagi.');
        }

        return $this->success([
            'order'       => $model->satu($id),
            'transaction' => (new TransaksiModel())->riwayatSatuCabang($this->branchId(), $transactionId),
        ]);
    }

    public function payments(): ResponseInterface
    {
        return $this->success((new PembayaranModel())->daftarCabang($this->branchId()));
    }
}
