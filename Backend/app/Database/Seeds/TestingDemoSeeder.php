<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Seeder data pengujian lengkap untuk alur Kasir, Admin Cabang, dan Pemilik.
 * Aman dijalankan ulang: hanya mengisi bagian yang belum memiliki data.
 */
class TestingDemoSeeder extends Seeder
{
    public function run()
    {
        $db = $this->db;

        $owner = $db->table('users')
            ->where('role', 'pemilik')
            ->where('status', 'aktif')
            ->orderBy('id', 'ASC')
            ->get()
            ->getRowArray();
        $ownerId = $owner ? (int) $owner['id'] : 1;

        $branches = $db->table('cabang')
            ->where('status', 'aktif')
            ->where('deleted_at', null)
            ->where('kode_cabang !=', 'PST')
            ->orderBy('id', 'ASC')
            ->get()
            ->getResultArray();

        if ($branches === []) {
            throw new \RuntimeException('Belum ada cabang aktif untuk diisi data uji.');
        }

        $branchIds = array_map(static fn (array $b): int => (int) $b['id'], $branches);
        $primaryBranchId = $branchIds[0]; // e.g. Pasar Raya 1
        $secondaryBranchId = $branchIds[count($branchIds) - 1]; // e.g. cabang aktif lain
        $thirdBranchId = $branchIds[1] ?? $primaryBranchId;
        $fourthBranchId = $branchIds[5] ?? ($branchIds[2] ?? $primaryBranchId);
        $fifthBranchId = $branchIds[6] ?? ($branchIds[3] ?? $primaryBranchId);

        $users = $db->table('users')->where('status', 'aktif')->get()->getResultArray();
        $kasirByBranch = [];
        $adminByBranch = [];
        $defaultKasirId = $ownerId;
        $defaultAdminId = $ownerId;

        foreach ($users as $u) {
            if ($u['role'] === 'kasir') {
                if ($defaultKasirId === $ownerId) {
                    $defaultKasirId = (int) $u['id'];
                }
                if ($u['cabang_id'] !== null && ! isset($kasirByBranch[(int) $u['cabang_id']])) {
                    $kasirByBranch[(int) $u['cabang_id']] = (int) $u['id'];
                }
            }
            if ($u['role'] === 'admin') {
                if ($defaultAdminId === $ownerId) {
                    $defaultAdminId = (int) $u['id'];
                }
                if ($u['cabang_id'] !== null && ! isset($adminByBranch[(int) $u['cabang_id']])) {
                    $adminByBranch[(int) $u['cabang_id']] = (int) $u['id'];
                }
            }
        }

        $kasirFor = static fn (int $bId): int => $kasirByBranch[$bId] ?? $defaultKasirId;
        $adminFor = static fn (int $bId): int => $adminByBranch[$bId] ?? $defaultAdminId;

        /* 1. Kategori Barang */
        $kategoriList = [
            ['KT-001', 'Frame'],
            ['KT-002', 'Lensa'],
            ['KT-003', 'Aksesoris'],
        ];
        $kategoriId = [];
        $now = date('Y-m-d H:i:s');

        foreach ($kategoriList as [$kodeKat, $namaKat]) {
            $row = $db->table('kategori_barang')->where('nama_kategori', $namaKat)->get()->getRowArray();
            if ($row === null) {
                $db->table('kategori_barang')->insert([
                    'kode_kategori' => $kodeKat,
                    'nama_kategori' => $namaKat,
                    'keterangan'    => null,
                    'status'        => 'aktif',
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);
                $row = $db->table('kategori_barang')->where('nama_kategori', $namaKat)->get()->getRowArray();
            }
            $kategoriId[$namaKat] = (int) $row['id'];
        }

        /* 2. Katalog Barang + Stok Gudang Pusat */
        $produkCatalog = [
            ['P-001', 'Titanium Classic', 'Frame', 'Ray-Ban', 1_850_000, 55],
            ['P-002', 'Urban Square', 'Frame', 'Oakley', 1_620_000, 48],
            ['P-003', 'Bella Round', 'Frame', 'Vogue', 1_480_000, 40],
            ['P-004', 'Metro Classic', 'Frame', "Levi's", 1_250_000, 62],
            ['P-005', 'AirFlex', 'Frame', 'Excellence', 1_720_000, 36],
            ['P-006', 'Heritage', 'Frame', 'Moscot', 2_100_000, 30],
            ['P-007', 'Lensa Single Vision', 'Lensa', 'Essilor', 750_000, 80],
            ['P-008', 'Lensa Blue Control', 'Lensa', 'Hoya', 1_250_000, 64],
            ['P-009', 'Lensa Progressive', 'Lensa', 'Zeiss', 1_950_000, 44],
            ['P-010', 'Paket Case & Lap', 'Aksesoris', 'Optik Mekar Jaya', 150_000, 120],
            ['P-011', 'Cleaning Kit', 'Aksesoris', 'Makar Eyewear', 90_000, 140],
            ['P-012', '3Clear Black Round', 'Frame', 'Makar Eyewear', 450_000, 70],
        ];

        $barang = [];
        foreach ($produkCatalog as [$kode, $nama, $jenis, $merek, $harga, $stokPusatAwal]) {
            $existing = $db->table('barang')->where('kode_barang', $kode)->get()->getRowArray();
            if ($existing === null) {
                $db->table('barang')->insert([
                    'kategori_id' => $kategoriId[$jenis],
                    'kode_barang' => $kode,
                    'nama_barang' => $nama,
                    'jenis'       => $jenis,
                    'merek'       => $merek,
                    'harga_jual'  => $harga,
                    'deskripsi'   => null,
                    'status'      => 'aktif',
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]);
                $existing = $db->table('barang')->where('kode_barang', $kode)->get()->getRowArray();
            }
            $barangId = (int) $existing['id'];
            $barang[$kode] = $existing;

            $pusatRow = $db->table('stok_pusat')->where('barang_id', $barangId)->get()->getRowArray();
            if ($pusatRow === null) {
                $db->table('stok_pusat')->insert([
                    'barang_id'   => $barangId,
                    'jumlah_stok' => $stokPusatAwal,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]);
            } elseif ((int) $pusatRow['jumlah_stok'] === 0) {
                $db->table('stok_pusat')->where('barang_id', $barangId)->update([
                    'jumlah_stok' => $stokPusatAwal,
                    'updated_at'  => $now,
                ]);
            }
        }

        /* 3. Stok Awal Per Cabang + Ledger Mutasi */
        // Base stok cabang disusun agar setelah transaksi demo beberapa item menipis (<= stok_minimum)
        $branchStockPlan = [
            $primaryBranchId => [
                'P-001' => [12, 4], 'P-002' => [8, 4], 'P-003' => [3, 4], 'P-004' => [10, 4],
                'P-005' => [4, 4],  'P-006' => [6, 3], 'P-007' => [16, 5], 'P-008' => [3, 5],
                'P-009' => [8, 3],  'P-010' => [24, 6], 'P-011' => [30, 8], 'P-012' => [9, 4],
            ],
            $secondaryBranchId => [
                'P-001' => [7, 4], 'P-002' => [6, 4], 'P-003' => [5, 4], 'P-004' => [8, 4],
                'P-005' => [2, 4], 'P-006' => [5, 3], 'P-007' => [3, 5], 'P-008' => [6, 4],
                'P-009' => [5, 3], 'P-010' => [14, 5], 'P-011' => [18, 6], 'P-012' => [7, 4],
            ],
        ];

        $defaultPlan = [
            'P-001' => [6, 3], 'P-002' => [5, 3], 'P-003' => [2, 4], 'P-004' => [7, 3],
            'P-005' => [4, 3], 'P-006' => [4, 3], 'P-007' => [9, 4], 'P-008' => [3, 4],
            'P-009' => [5, 3], 'P-010' => [12, 5], 'P-011' => [15, 5], 'P-012' => [6, 3],
        ];

        $ledger = []; // [$branchId][$kode] => int current balance
        $initAt = date('Y-m-d 08:30:00', strtotime('-60 days'));

        foreach ($branchIds as $idx => $bId) {
            $plan = $branchStockPlan[$bId] ?? $defaultPlan;
            foreach ($produkCatalog as [$kode]) {
                $bItem = $barang[$kode];
                $barangId = (int) $bItem['id'];
                [$qty, $min] = $plan[$kode];
                // Variasi stok kecil untuk cabang lainnya agar tampilan monitoring cabang bervariasi realistis
                if (! isset($branchStockPlan[$bId])) {
                    $qty = max(1, $qty - ($idx % 3));
                }

                $row = $db->table('stok_cabang')
                    ->where('cabang_id', $bId)
                    ->where('barang_id', $barangId)
                    ->get()
                    ->getRowArray();

                if ($row === null) {
                    $db->table('stok_cabang')->insert([
                        'cabang_id'    => $bId,
                        'barang_id'    => $barangId,
                        'jumlah_stok'  => $qty,
                        'stok_minimum' => $min,
                        'created_at'   => $initAt,
                        'updated_at'   => $initAt,
                    ]);
                    $ledger[$bId][$kode] = $qty;

                    $eventKey = 'seed-init-' . $bId . '-' . $barangId;
                    if ($db->table('mutasi_stok')->where('event_key', $eventKey)->countAllResults() === 0) {
                        $db->table('mutasi_stok')->insert([
                            'cabang_id'     => $bId,
                            'barang_id'     => $barangId,
                            'pengguna_id'   => $adminFor($bId),
                            'arah'          => 'IN',
                            'sumber'        => 'Saldo Awal',
                            'jumlah'        => $qty,
                            'saldo_sebelum' => 0,
                            'saldo_sesudah' => $qty,
                            'referensi'     => 'INIT-' . str_pad((string) $bId, 2, '0', STR_PAD_LEFT),
                            'event_key'     => $eventKey,
                            'created_at'    => $initAt,
                        ]);
                    }
                } else {
                    $ledger[$bId][$kode] = (int) $row['jumlah_stok'];
                }
            }
        }

        /* 4. Pelanggan */
        $pelangganList = [
            ['PLG-0001', 'Andi Saputra', '0812 3456 7890', 'Jl. Khatib Sulaiman No. 12, Padang'],
            ['PLG-0002', 'Rian Pratama', '0852 7712 9011', 'Jl. Veteran No. 4, Padang'],
            ['PLG-0003', 'Siti Maulida', '0812 3456 7891', 'Jl. Pemuda No. 8, Padang'],
            ['PLG-0004', 'Nadia Amelia', '0821 6677 8899', 'Jl. Marapalam No. 9, Padang'],
            ['PLG-0005', 'Dimas Hidayat', '0853 1122 3344', 'Jl. Proklamasi No. 17, Padang'],
            ['PLG-0006', 'Fitri Ananda', '0851 2233 4455', 'Jl. Gajah Mada No. 6, Padang'],
            ['PLG-0007', 'Dedi Rahman', '0813 6677 8899', 'Jl. Belanti No. 33, Padang'],
            ['PLG-0008', 'Siti Nurhaliza', '0812 3456 7892', 'Jl. Diponegoro No. 10, Padang'],
            ['PLG-0009', 'Maya Lestari', '0821 9988 7766', 'Jl. Hayam Wuruk No. 5, Padang'],
            ['PLG-0010', 'Zulfa Ramadhani', '0823 1122 3344', 'Jl. Andalas No. 41, Padang'],
            ['PLG-0011', 'Hendra Wijaya', '0812 9987 6665', 'Jl. Ahmad Yani No. 19, Padang'],
            ['PLG-0012', 'Nadia Putri', '0822 7345 9988', 'Jl. Ratulangi No. 7, Padang'],
            ['PLG-0013', 'Siti Rahma', '0812 3456 7893', 'Jl. Pasar Raya No. 3, Padang'],
            ['PLG-0014', 'Maya Putri', '0822 9900 1112', 'Jl. Bypass No. 27, Padang'],
            ['PLG-0015', 'Dimas Pratama', '0831 1188 5500', 'Jl. Kuranji No. 14, Padang'],
        ];

        if ($db->table('pelanggan')->countAllResults() === 0) {
            $rows = [];
            foreach ($pelangganList as [$kode, $nama, $hp, $alamat]) {
                $rows[] = [
                    'nama_pelanggan' => $nama,
                    'alamat'         => $alamat,
                    'no_hp'          => $hp,
                    'created_at'     => $initAt,
                    'updated_at'     => $initAt,
                ];
            }
            $db->table('pelanggan')->insertBatch($rows);
        }

        $cust = [];
        foreach ($db->table('pelanggan')->get()->getResultArray() as $c) {
            $cust[$c['nama_pelanggan']] = $c;
        }

        /* 5. Resep Mata */
        $resepList = [
            ['Andi Saputra', '-1.50', '-0.75', '180', '-1.25', '-0.50', '170', '32.0', '+1.00', 'aktif', '-8 days', 'Resep progresif nyaman untuk kerja komputer'],
            ['Rian Pratama', '-2.00', '-0.50', '175', '-1.75', '-0.25', '5', '31.5', '+1.25', 'aktif', '-15 days', 'Pemeriksaan berkala lensa antiradiasi'],
            ['Siti Maulida', '+1.00', '-0.75', '90', '+1.25', '-0.50', '85', '30.5', '+2.00', 'aktif', '-25 days', 'Resep dokter mata untuk baca & jarak jauh'],
            ['Nadia Amelia', '-0.75', '-1.00', '160', '-0.50', '-0.75', '15', '32.5', '-', 'aktif', '-32 days', 'Lensa blue control harian'],
            ['Siti Rahma', '-1.25', '-0.25', '175', '-1.00', '-0.50', '170', '31.5', '-', 'aktif', '-5 days', 'Siap untuk pemesanan frame & lensa baru'],
            ['Maya Putri', '-2.50', '-0.50', '180', '-2.25', '-0.50', '180', '32.0', '-', 'aktif', '-10 days', 'Lensa tipis indeks tinggi'],
            ['Dedi Rahman', '-3.25', '-0.50', '180', '-3.00', '-0.25', '175', '33.0', '+1.75', 'expired', '-190 days', 'Disarankan periksa ulang sebelum order'],
            ['Dimas Hidayat', '-0.25', '-0.25', '10', '-0.50', '-0.25', '170', '31.0', '-', 'expired', '-210 days', 'Resep lama lebih dari 6 bulan'],
        ];

        if ($db->table('resep')->countAllResults() === 0) {
            $rows = [];
            foreach ($resepList as [$nama, $oSph, $oCyl, $oAxis, $sSph, $sCyl, $sAxis, $pd, $add, $status, $offset, $catatan]) {
                if (! isset($cust[$nama])) {
                    continue;
                }
                $rows[] = [
                    'fk_id_pelanggan' => (int) $cust[$nama]['id_pelanggan'],
                    'tanggal_resep'   => date('Y-m-d', strtotime($offset)),
                    'od_sph'          => $oSph,
                    'od_cyl'          => $oCyl,
                    'od_axis'         => $oAxis,
                    'os_sph'          => $sSph,
                    'os_cyl'          => $sCyl,
                    'os_axis'         => $sAxis,
                    'pd'              => $pd,
                    'add_power'       => $add,
                    'status'          => $status,
                    'catatan'         => $catatan,
                    'created_at'      => date('Y-m-d 10:00:00', strtotime($offset)),
                    'updated_at'      => date('Y-m-d 10:00:00', strtotime($offset)),
                ];
            }
            $db->table('resep')->insertBatch($rows);
        }

        $resepByCust = [];
        foreach ($db->table('resep')->where('status', 'aktif')->orderBy('id_resep', 'DESC')->get()->getResultArray() as $r) {
            $cId = (int) $r['fk_id_pelanggan'];
            if (! isset($resepByCust[$cId])) {
                $resepByCust[$cId] = $r;
            }
        }

        /* 6. Helper Mutasi Stok Cabang Aman */
        $applyStockOut = function (int $bId, string $kode, int $qty, string $source, string $ref, string $eventKey, string $at, int $userId) use ($db, $barang, &$ledger): void {
            if ($db->table('mutasi_stok')->where('event_key', $eventKey)->countAllResults() > 0) {
                return;
            }
            $barangId = (int) $barang[$kode]['id'];
            $before = $ledger[$bId][$kode] ?? 0;
            $after = max(0, $before - $qty);
            $actualOut = max(0, $before - $after);
            $ledger[$bId][$kode] = $after;

            $db->table('stok_cabang')
                ->where('cabang_id', $bId)
                ->where('barang_id', $barangId)
                ->update(['jumlah_stok' => $after, 'updated_at' => $at]);

            if ($actualOut > 0) {
                $db->table('mutasi_stok')->insert([
                    'cabang_id'     => $bId,
                    'barang_id'     => $barangId,
                    'pengguna_id'   => $userId,
                    'arah'          => 'OUT',
                    'sumber'        => $source,
                    'jumlah'        => $actualOut,
                    'saldo_sebelum' => $before,
                    'saldo_sesudah' => $after,
                    'referensi'     => $ref,
                    'event_key'     => $eventKey,
                    'created_at'    => $at,
                ]);
            }
        };

        /* 7. Alur Pengajuan Stok, Alokasi Distribusi Pusat -> Cabang, dan Penerimaan Admin */
        if ($db->table('pengajuan_stok')->countAllResults() === 0 && $db->table('alokasi_stok')->countAllResults() === 0) {
            $addTime = static fn (string $offset): string => date('Y-m-d H:i:s', strtotime($offset));

            // Kasus A: Pengajuan Diajukan (Menunggu Pemilik pada cabang 1 & cabang 2)
            $db->table('pengajuan_stok')->insert([
                'kode_pengajuan' => 'REQ-2026-0001',
                'cabang_id'      => $primaryBranchId,
                'barang_id'      => (int) $barang['P-003']['id'],
                'pengguna_id'    => $adminFor($primaryBranchId),
                'jumlah_diminta' => 8,
                'catatan'        => 'Stok Bella Round menipis, perlu tambahan untuk akhir pekan.',
                'status'         => 'diajukan',
                'created_at'     => $addTime('-1 day 09:15:00'),
                'updated_at'     => $addTime('-1 day 09:15:00'),
            ]);

            $db->table('pengajuan_stok')->insert([
                'kode_pengajuan' => 'REQ-2026-0002',
                'cabang_id'      => $secondaryBranchId,
                'barang_id'      => (int) $barang['P-005']['id'],
                'pengguna_id'    => $adminFor($secondaryBranchId),
                'jumlah_diminta' => 6,
                'catatan'        => 'Permintaan rutin Frame AirFlex untuk display.',
                'status'         => 'diajukan',
                'created_at'     => $addTime('-6 hours'),
                'updated_at'     => $addTime('-6 hours'),
            ]);

            // Kasus B: Pengajuan Sebagian + Alokasi Menunggu Diterima (Owner masih bisa alokasi sisa, Admin bisa terima yg sudah dikirim)
            $db->table('pengajuan_stok')->insert([
                'kode_pengajuan' => 'REQ-2026-0003',
                'cabang_id'      => $primaryBranchId,
                'barang_id'      => (int) $barang['P-008']['id'],
                'pengguna_id'    => $adminFor($primaryBranchId),
                'jumlah_diminta' => 10,
                'catatan'        => 'Kebutuhan Lensa Blue Control meningkat.',
                'status'         => 'diajukan',
                'created_at'     => $addTime('-2 days 11:00:00'),
                'updated_at'     => $addTime('-2 days 11:00:00'),
            ]);
            $reqBId = (int) $db->insertID();

            $db->table('alokasi_stok')->insert([
                'kode_alokasi'    => 'DIST-2026-0001',
                'cabang_id'       => $primaryBranchId,
                'pengajuan_id'    => $reqBId,
                'pemilik_id'      => $ownerId,
                'catatan'         => 'Kirim tahap 1 sebanyak 6 unit dulu.',
                'idempotency_key' => 'seed-aloc-0001',
                'created_at'      => $addTime('-1 day 14:30:00'),
                'updated_at'      => $addTime('-1 day 14:30:00'),
            ]);
            $alocBId = (int) $db->insertID();
            $db->table('detail_alokasi_stok')->insert([
                'alokasi_id'          => $alocBId,
                'barang_id'           => (int) $barang['P-008']['id'],
                'jumlah_dialokasikan' => 6,
                'jumlah_diterima'     => 0,
                'created_at'          => $addTime('-1 day 14:30:00'),
                'updated_at'          => $addTime('-1 day 14:30:00'),
            ]);

            // Kasus C: Pengajuan Dialokasikan + Alokasi Diterima Sebagian (Penerimaan + Mutasi IN tercatat)
            $db->table('pengajuan_stok')->insert([
                'kode_pengajuan' => 'REQ-2026-0004',
                'cabang_id'      => $primaryBranchId,
                'barang_id'      => (int) $barang['P-005']['id'],
                'pengguna_id'    => $adminFor($primaryBranchId),
                'jumlah_diminta' => 8,
                'catatan'        => 'Restock Frame AirFlex ukuran standar.',
                'status'         => 'diajukan',
                'created_at'     => $addTime('-5 days 10:00:00'),
                'updated_at'     => $addTime('-5 days 10:00:00'),
            ]);
            $reqCId = (int) $db->insertID();

            $alocCAt = $addTime('-4 days 13:20:00');
            $db->table('alokasi_stok')->insert([
                'kode_alokasi'    => 'DIST-2026-0002',
                'cabang_id'       => $primaryBranchId,
                'pengajuan_id'    => $reqCId,
                'pemilik_id'      => $ownerId,
                'catatan'         => 'Dikirim lengkap 8 unit ke Pasar Raya 1.',
                'idempotency_key' => 'seed-aloc-0002',
                'created_at'      => $alocCAt,
                'updated_at'      => $alocCAt,
            ]);
            $alocCId = (int) $db->insertID();
            $db->table('detail_alokasi_stok')->insert([
                'alokasi_id'          => $alocCId,
                'barang_id'           => (int) $barang['P-005']['id'],
                'jumlah_dialokasikan' => 8,
                'jumlah_diterima'     => 5,
                'created_at'          => $alocCAt,
                'updated_at'          => $addTime('-3 days 15:10:00'),
            ]);
            $detailCId = (int) $db->insertID();

            $recCAt = $addTime('-3 days 15:10:00');
            $db->table('penerimaan_stok')->insert([
                'detail_alokasi_id' => $detailCId,
                'admin_id'          => $adminFor($primaryBranchId),
                'jumlah'            => 5,
                'catatan'           => 'Koli pertama diterima 5 unit, sisa 3 menyusul.',
                'idempotency_key'   => 'seed-rec-0001',
                'created_at'        => $recCAt,
            ]);
            $recCId = (int) $db->insertID();

            $beforeC = $ledger[$primaryBranchId]['P-005'];
            $afterC = $beforeC + 5;
            $ledger[$primaryBranchId]['P-005'] = $afterC;
            $db->table('stok_cabang')
                ->where('cabang_id', $primaryBranchId)
                ->where('barang_id', (int) $barang['P-005']['id'])
                ->update(['jumlah_stok' => $afterC, 'updated_at' => $recCAt]);
            $db->table('stok_pusat')
                ->where('barang_id', (int) $barang['P-005']['id'])
                ->set('jumlah_stok', 'GREATEST(0, jumlah_stok - 5)', false)
                ->update();
            $db->table('mutasi_stok')->insert([
                'cabang_id'     => $primaryBranchId,
                'barang_id'     => (int) $barang['P-005']['id'],
                'pengguna_id'   => $adminFor($primaryBranchId),
                'arah'          => 'IN',
                'sumber'        => 'Penerimaan',
                'jumlah'        => 5,
                'saldo_sebelum' => $beforeC,
                'saldo_sesudah' => $afterC,
                'referensi'     => 'DIST-2026-0002',
                'event_key'     => 'receipt-' . $recCId,
                'created_at'    => $recCAt,
            ]);

            // Kasus D: Pengajuan Selesai & Alokasi Diterima Penuh (cabang utama + cabang sekunder)
            $completedFlows = [
                ['REQ-2026-0005', 'DIST-2026-0003', $primaryBranchId, 'P-001', 6, '-9 days', '-8 days', 'seed-aloc-0003', 'seed-rec-0002', 'Barang diterima utuh dan dicek QC.'],
                ['REQ-2026-0006', 'DIST-2026-0004', $secondaryBranchId, 'P-007', 8, '-7 days', '-6 days', 'seed-aloc-0004', 'seed-rec-0003', 'Stok Lensa Single Vision masuk cabang.'],
            ];
            foreach ($completedFlows as [$reqKode, $alocKode, $bId, $pKode, $qty, $reqOff, $recOff, $aKey, $rKey, $recNote]) {
                $reqAt = $addTime($reqOff . ' 09:00:00');
                $recAt = $addTime($recOff . ' 14:00:00');
                $pId = (int) $barang[$pKode]['id'];

                $db->table('pengajuan_stok')->insert([
                    'kode_pengajuan' => $reqKode,
                    'cabang_id'      => $bId,
                    'barang_id'      => $pId,
                    'pengguna_id'    => $adminFor($bId),
                    'jumlah_diminta' => $qty,
                    'catatan'        => 'Pengajuan stok bulanan.',
                    'status'         => 'diajukan',
                    'created_at'     => $reqAt,
                    'updated_at'     => $reqAt,
                ]);
                $rId = (int) $db->insertID();

                $db->table('alokasi_stok')->insert([
                    'kode_alokasi'    => $alocKode,
                    'cabang_id'       => $bId,
                    'pengajuan_id'    => $rId,
                    'pemilik_id'      => $ownerId,
                    'catatan'         => 'Disetujui sesuai pengajuan.',
                    'idempotency_key' => $aKey,
                    'created_at'      => $reqAt,
                    'updated_at'      => $recAt,
                ]);
                $aId = (int) $db->insertID();

                $db->table('detail_alokasi_stok')->insert([
                    'alokasi_id'          => $aId,
                    'barang_id'           => $pId,
                    'jumlah_dialokasikan' => $qty,
                    'jumlah_diterima'     => $qty,
                    'created_at'          => $reqAt,
                    'updated_at'          => $recAt,
                ]);
                $dId = (int) $db->insertID();

                $db->table('penerimaan_stok')->insert([
                    'detail_alokasi_id' => $dId,
                    'admin_id'          => $adminFor($bId),
                    'jumlah'            => $qty,
                    'catatan'           => $recNote,
                    'idempotency_key'   => $rKey,
                    'created_at'        => $recAt,
                ]);
                $recId = (int) $db->insertID();

                $before = $ledger[$bId][$pKode];
                $after = $before + $qty;
                $ledger[$bId][$pKode] = $after;
                $db->table('stok_cabang')
                    ->where('cabang_id', $bId)
                    ->where('barang_id', $pId)
                    ->update(['jumlah_stok' => $after, 'updated_at' => $recAt]);
                $db->table('stok_pusat')
                    ->where('barang_id', $pId)
                    ->set('jumlah_stok', 'GREATEST(0, jumlah_stok - ' . $qty . ')', false)
                    ->update();
                $db->table('mutasi_stok')->insert([
                    'cabang_id'     => $bId,
                    'barang_id'     => $pId,
                    'pengguna_id'   => $adminFor($bId),
                    'arah'          => 'IN',
                    'sumber'        => 'Penerimaan',
                    'jumlah'        => $qty,
                    'saldo_sebelum' => $before,
                    'saldo_sesudah' => $after,
                    'referensi'     => $alocKode,
                    'event_key'     => 'receipt-' . $recId,
                    'created_at'    => $recAt,
                ]);
            }

            // Kasus E: Alokasi Langsung Pemilik (tanpa pengajuan) untuk cabang lain
            $directAt = $addTime('-12 hours');
            $db->table('alokasi_stok')->insert([
                'kode_alokasi'    => 'DIST-2026-0005',
                'cabang_id'       => $fourthBranchId,
                'pengajuan_id'    => null,
                'pemilik_id'      => $ownerId,
                'catatan'         => 'Distribusi stok baru promo awal bulan.',
                'idempotency_key' => 'seed-aloc-0005',
                'created_at'      => $directAt,
                'updated_at'      => $directAt,
            ]);
            $alocEId = (int) $db->insertID();
            $db->table('detail_alokasi_stok')->insert([
                'alokasi_id'          => $alocEId,
                'barang_id'           => (int) $barang['P-004']['id'],
                'jumlah_dialokasikan' => 5,
                'jumlah_diterima'     => 0,
                'created_at'          => $directAt,
                'updated_at'          => $directAt,
            ]);

            // Kasus F: Pengajuan Ditolak Pemilik
            $db->table('pengajuan_stok')->insert([
                'kode_pengajuan'   => 'REQ-2026-0007',
                'cabang_id'        => $thirdBranchId,
                'barang_id'        => (int) $barang['P-006']['id'],
                'pengguna_id'      => $adminFor($thirdBranchId),
                'jumlah_diminta'   => 12,
                'catatan'          => 'Tambah stok Heritage untuk etalase.',
                'status'           => 'ditolak',
                'alasan_penolakan' => 'Stok Heritage cabang masih mencukupi, fokus alokasi ke seri AirFlex dulu.',
                'ditolak_oleh'     => $ownerId,
                'ditolak_pada'     => $addTime('-4 days 16:00:00'),
                'created_at'       => $addTime('-4 days 10:20:00'),
                'updated_at'       => $addTime('-4 days 16:00:00'),
            ]);
        }

        /* 8. Transaksi Kasir + Detail + Pembayaran + Mutasi Penjualan */
        if ($db->table('transaksi')->countAllResults() === 0) {
            $trxSeeds = [
                ['t1', $primaryBranchId, 0, '14:20', 'selesai', 'pembelian', 'Rian Pratama', [['P-001', 1], ['P-010', 1]], 'Tunai', 0],
                ['t2', $primaryBranchId, 0, '11:05', 'selesai', 'pembelian', 'Siti Nurhaliza', [['P-003', 1], ['P-011', 1]], 'QRIS', 0],
                ['t3', $primaryBranchId, 1, '16:40', 'selesai', 'pembelian', 'Andi Saputra', [['P-007', 1], ['P-004', 1]], 'Transfer Bank', 50_000],
                ['t4', $primaryBranchId, 2, '13:15', 'selesai', 'pembelian', 'Maya Lestari', [['P-008', 1]], 'Kartu Debit/Kredit', 0],
                ['t5', $primaryBranchId, 3, '10:30', 'pending', 'pemesanan', 'Zulfa Ramadhani', [['P-009', 1]], 'Transfer Bank', 0],
                ['t6', $primaryBranchId, 4, '17:15', 'dibatalkan', 'pembelian', 'Fitri Ananda', [['P-012', 1]], 'QRIS', 0],
                ['t7', $primaryBranchId, 5, '15:25', 'selesai', 'pembelian', 'Dedi Rahman', [['P-005', 2], ['P-010', 1]], 'E-Wallet', 0],
                ['t8', $secondaryBranchId, 1, '12:10', 'selesai', 'pembelian', 'Hendra Wijaya', [['P-005', 1], ['P-007', 2]], 'Tunai', 0],
                ['t9', $secondaryBranchId, 3, '14:50', 'selesai', 'pembelian', 'Nadia Putri', [['P-011', 2], ['P-012', 1]], 'QRIS', 0],
                ['t10', $thirdBranchId, 2, '11:45', 'selesai', 'pembelian', 'Nadia Amelia', [['P-002', 1], ['P-007', 1]], 'Transfer Bank', 0],
                ['t11', $fourthBranchId, 6, '13:05', 'selesai', 'pembelian', 'Dimas Hidayat', [['P-003', 1], ['P-010', 1]], 'QRIS', 0],
                ['t12', $fifthBranchId, 7, '16:00', 'selesai', 'pembelian', 'Siti Maulida', [['P-001', 1], ['P-008', 1]], 'Kartu Debit/Kredit', 0],
                // Periode pembanding (~1-2 bulan lalu agar grafik perbandingan tanggal di Dashboard Pemilik kaya data)
                ['t13', $primaryBranchId, 35, '10:45', 'selesai', 'pembelian', 'Rian Pratama', [['P-002', 1], ['P-007', 1]], 'Tunai', 0],
                ['t14', $primaryBranchId, 40, '15:10', 'selesai', 'pembelian', 'Siti Rahma', [['P-006', 1]], 'Transfer Bank', 0],
                ['t15', $thirdBranchId, 44, '11:30', 'selesai', 'pembelian', 'Andi Saputra', [['P-004', 1], ['P-010', 1]], 'QRIS', 0],
            ];

            foreach ($trxSeeds as [$seedKey, $bId, $hariLalu, $jam, $status, $jenis, $namaPelanggan, $items, $metode, $diskon]) {
                $tanggal = date('Y-m-d', strtotime("-{$hariLalu} days")) . ' ' . $jam . ':00';
                $kasirId = $kasirFor($bId);
                $subtotal = 0.0;
                foreach ($items as [$kodeBarang, $qty]) {
                    $subtotal += (float) $barang[$kodeBarang]['harga_jual'] * $qty;
                }
                $total = max(0, $subtotal - $diskon);

                $db->table('transaksi')->insert([
                    'kode_transaksi'    => 'TMP-' . strtoupper(bin2hex(random_bytes(4))),
                    'pelanggan_id'      => (int) $cust[$namaPelanggan]['id_pelanggan'],
                    'cabang_id'         => $bId,
                    'pengguna_id'       => $kasirId,
                    'jenis'             => $jenis,
                    'tanggal_transaksi' => $tanggal,
                    'total'             => $total,
                    'diskon'            => $diskon,
                    'pajak'             => 0,
                    'status'            => $status,
                    'created_at'        => $tanggal,
                    'updated_at'        => $tanggal,
                ]);
                $trxId = (int) $db->insertID();
                $kodeTrx = 'TRX-' . date('Ymd', strtotime($tanggal)) . '-' . str_pad((string) $trxId, 3, '0', STR_PAD_LEFT);
                $db->table('transaksi')->where('id_transaksi', $trxId)->update(['kode_transaksi' => $kodeTrx]);

                foreach ($items as [$kodeBarang, $qty]) {
                    $pRow = $barang[$kodeBarang];
                    $harga = (float) $pRow['harga_jual'];
                    $db->table('detail_transaksi')->insert([
                        'transaksi_id' => $trxId,
                        'barang_id'    => (int) $pRow['id'],
                        'jumlah'       => $qty,
                        'harga'        => $harga,
                        'subtotal'     => $harga * $qty,
                        'created_at'   => $tanggal,
                        'updated_at'   => $tanggal,
                    ]);

                    if ($status === 'selesai') {
                        $applyStockOut(
                            $bId,
                            $kodeBarang,
                            $qty,
                            'Penjualan',
                            $kodeTrx,
                            'sale-' . $trxId . '-' . (int) $pRow['id'],
                            $tanggal,
                            $kasirId
                        );
                    }
                }

                $statusBayar = $status === 'selesai' ? 'lunas' : $status;
                $dibayar = $metode === 'Tunai' ? $total + 50_000 : $total;
                $db->table('pembayaran')->insert([
                    'transaksi_id'       => $trxId,
                    'tanggal_pembayaran' => $tanggal,
                    'metode_pembayaran'  => $metode,
                    'jumlah_bayar'       => $dibayar,
                    'referensi'          => $metode === 'Tunai' ? null : 'REF-' . str_pad((string) $trxId, 4, '0', STR_PAD_LEFT),
                    'status'             => $statusBayar,
                    'created_at'         => $tanggal,
                    'updated_at'         => $tanggal,
                ]);
            }
        }

        /* 9. Pemesanan PO Kasir & Admin + Timeline Status + Pengambilan PO */
        if ($db->table('pemesanan_po')->countAllResults() === 0) {
            $poSeeds = [
                // Pasar Raya 1: mencakup semua status (dipesan, diproses, sudah_datang, selesai, dibatalkan)
                ['PO-2026-0201', $primaryBranchId, 'Siti Rahma', 'dipesan', 0, [['P-001', 1], ['P-007', 1]], 'Frame + lensa sesuai resep terbaru.', 'Siti Rahma'],
                ['PO-2026-0202', $primaryBranchId, 'Andi Saputra', 'dipesan', 1, [['P-005', 1], ['P-008', 1]], 'Mohon diproses segera, pelanggan butuh untuk kerja.', 'Andi Saputra'],
                ['PO-2026-0203', $primaryBranchId, 'Maya Putri', 'diproses', 2, [['P-009', 1]], 'Pembuatan lensa progressive di lab pusat.', 'Maya Putri'],
                ['PO-2026-0204', $primaryBranchId, 'Nadia Amelia', 'sudah_datang', 3, [['P-003', 1], ['P-008', 1]], 'Sudah selesai dipasang, siap diambil pelanggan.', 'Nadia Amelia'],
                ['PO-2026-0205', $primaryBranchId, 'Rian Pratama', 'sudah_datang', 4, [['P-002', 1], ['P-007', 1]], 'Sudah sampai di cabang, tinggal serah terima kasir.', 'Rian Pratama'],
                ['PO-2026-0206', $primaryBranchId, 'Dimas Pratama', 'selesai', 7, [['P-004', 1]], 'Pesanan selesai dan sudah diambil pelanggan.', null],
                ['PO-2026-0207', $primaryBranchId, 'Fitri Ananda', 'dibatalkan', 6, [['P-006', 1]], 'Pelanggan ganti pilihan frame stok ready.', null],
                // Cabang kedua (untuk pengujian akun kasir2 & admin2)
                ['PO-2026-0208', $secondaryBranchId, 'Siti Maulida', 'dipesan', 1, [['P-007', 1]], 'Pesanan lensa cabang baru.', 'Siti Maulida'],
                ['PO-2026-0209', $secondaryBranchId, 'Dedi Rahman', 'diproses', 3, [['P-001', 1]], 'Sedang dalam pengerjaan.', null],
            ];

            foreach ($poSeeds as [$kodePo, $bId, $namaPelanggan, $status, $hariLalu, $items, $catatan, $resepNama]) {
                $tglPo = date('Y-m-d 10:00:00', strtotime("-{$hariLalu} days"));
                $kasirId = $kasirFor($bId);
                $adminId = $adminFor($bId);
                $custRow = $cust[$namaPelanggan];
                $resepId = $resepNama !== null && isset($cust[$resepNama])
                    ? ($resepByCust[(int) $cust[$resepNama]['id_pelanggan']]['id_resep'] ?? null)
                    : null;

                $subtotal = 0.0;
                foreach ($items as [$kodeBarang, $qty]) {
                    $subtotal += (float) $barang[$kodeBarang]['harga_jual'] * $qty;
                }

                $linkedTrxId = null;
                if ($status === 'selesai') {
                    $pickupAt = date('Y-m-d 15:30:00', strtotime('-' . max(0, $hariLalu - 2) . ' days'));
                    $db->table('transaksi')->insert([
                        'kode_transaksi'    => 'TMP-' . strtoupper(bin2hex(random_bytes(4))),
                        'pelanggan_id'      => (int) $custRow['id_pelanggan'],
                        'cabang_id'         => $bId,
                        'pengguna_id'       => $kasirId,
                        'jenis'             => 'pembelian',
                        'tanggal_transaksi' => $pickupAt,
                        'total'             => $subtotal,
                        'diskon'            => 0,
                        'pajak'             => 0,
                        'status'            => 'selesai',
                        'created_at'        => $pickupAt,
                        'updated_at'        => $pickupAt,
                    ]);
                    $linkedTrxId = (int) $db->insertID();
                    $trxKode = 'TRX-' . date('Ymd', strtotime($pickupAt)) . '-' . str_pad((string) $linkedTrxId, 3, '0', STR_PAD_LEFT);
                    $db->table('transaksi')->where('id_transaksi', $linkedTrxId)->update(['kode_transaksi' => $trxKode]);

                    foreach ($items as [$kodeBarang, $qty]) {
                        $pRow = $barang[$kodeBarang];
                        $harga = (float) $pRow['harga_jual'];
                        $db->table('detail_transaksi')->insert([
                            'transaksi_id' => $linkedTrxId,
                            'barang_id'    => (int) $pRow['id'],
                            'jumlah'       => $qty,
                            'harga'        => $harga,
                            'subtotal'     => $harga * $qty,
                            'created_at'   => $pickupAt,
                            'updated_at'   => $pickupAt,
                        ]);

                        $applyStockOut(
                            $bId,
                            $kodeBarang,
                            $qty,
                            'Pengambilan PO',
                            $trxKode,
                            'po-pickup-' . $linkedTrxId . '-' . (int) $pRow['id'],
                            $pickupAt,
                            $kasirId
                        );
                    }

                    $db->table('pembayaran')->insert([
                        'transaksi_id'       => $linkedTrxId,
                        'tanggal_pembayaran' => $pickupAt,
                        'metode_pembayaran'  => 'QRIS',
                        'jumlah_bayar'       => $subtotal,
                        'referensi'          => 'PO-LUNAS-' . $linkedTrxId,
                        'status'             => 'lunas',
                        'created_at'         => $pickupAt,
                        'updated_at'         => $pickupAt,
                    ]);
                }

                $db->table('pemesanan_po')->insert([
                    'kode_po'                  => $kodePo,
                    'pelanggan_id'             => (int) $custRow['id_pelanggan'],
                    'cabang_id'                => $bId,
                    'pengguna_id'              => $kasirId,
                    'resep_id'                 => $resepId !== null ? (int) $resepId : null,
                    'tanggal_po'               => $tglPo,
                    'tanggal_estimasi_selesai' => date('Y-m-d', strtotime($tglPo . ' +5 days')),
                    'total'                    => $subtotal,
                    'status'                   => $status,
                    'transaksi_id'             => $linkedTrxId,
                    'catatan'                  => $catatan,
                    'created_at'               => $tglPo,
                    'updated_at'               => $tglPo,
                ]);
                $poId = (int) $db->insertID();

                foreach ($items as [$kodeBarang, $qty]) {
                    $pRow = $barang[$kodeBarang];
                    $harga = (float) $pRow['harga_jual'];
                    $db->table('detail_po')->insert([
                        'po_id'      => $poId,
                        'barang_id'  => (int) $pRow['id'],
                        'jumlah'     => $qty,
                        'harga'      => $harga,
                        'subtotal'   => $harga * $qty,
                        'catatan'    => $catatan,
                        'created_at' => $tglPo,
                        'updated_at' => $tglPo,
                    ]);
                }

                // Timeline status realistis sesuai status PO saat ini
                $timelineRows = [
                    [null, 'dipesan', $catatan, $kasirId, $tglPo],
                ];
                if (in_array($status, ['diproses', 'sudah_datang', 'selesai'], true)) {
                    $timelineRows[] = ['dipesan', 'diproses', 'PO mulai diproses Admin Cabang.', $adminId, date('Y-m-d 13:00:00', strtotime($tglPo))];
                }
                if (in_array($status, ['sudah_datang', 'selesai'], true)) {
                    $timelineRows[] = ['diproses', 'sudah_datang', 'Barang tersedia di cabang dan siap diambil.', $adminId, date('Y-m-d 11:00:00', strtotime($tglPo . ' +1 day'))];
                }
                if ($status === 'selesai') {
                    $timelineRows[] = ['sudah_datang', 'selesai', 'PO diselesaikan melalui pengambilan pelanggan.', $kasirId, date('Y-m-d 15:30:00', strtotime($tglPo . ' +2 days'))];
                }
                if ($status === 'dibatalkan') {
                    $timelineRows[] = ['dipesan', 'dibatalkan', 'Dibatalkan atas permintaan pelanggan.', $adminId, date('Y-m-d 14:20:00', strtotime($tglPo))];
                }

                foreach ($timelineRows as [$fromSt, $toSt, $noteSt, $actorSt, $atSt]) {
                    $db->table('po_timeline')->insert([
                        'po_id'       => $poId,
                        'dari_status' => $fromSt,
                        'ke_status'   => $toSt,
                        'catatan'     => $noteSt,
                        'actor_id'    => $actorSt,
                        'created_at'  => $atSt,
                        'updated_at'  => $atSt,
                    ]);
                }
            }
        }

        echo "TestingDemoSeeder selesai dijalankan.\n";
    }
}
