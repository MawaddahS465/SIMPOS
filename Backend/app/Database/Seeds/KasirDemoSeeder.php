<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Data demo area Kasir: kategori, barang, stok, pelanggan, resep,
 * transaksi, pembayaran, dan pemesanan PO.
 *
 * Aman dijalankan berulang: tiap bagian dilewati bila datanya sudah ada.
 */
class KasirDemoSeeder extends Seeder
{
    private int $cabangId = 8;
    private int $kasirId  = 5;

    public function run()
    {
        $db = $this->db;

        /* ---------- Kategori ---------- */
        $kategori = ['Frame', 'Lensa', 'Aksesoris'];
        $kategoriId = [];

        foreach ($kategori as $i => $nama) {
            $row = $db->table('kategori_barang')->where('nama_kategori', $nama)->get()->getRowArray();

            if (! $row) {
                $db->table('kategori_barang')->insert([
                    'kode_kategori' => 'KT-' . str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
                    'nama_kategori' => $nama,
                    'keterangan'    => null,
                    'status'        => 'aktif',
                    'created_at'    => date('Y-m-d H:i:s'),
                    'updated_at'    => date('Y-m-d H:i:s'),
                ]);
                $row = $db->table('kategori_barang')->where('nama_kategori', $nama)->get()->getRowArray();
            }

            $kategoriId[$nama] = (int) $row['id'];
        }

        /* ---------- Barang ---------- */
        $produk = [
            ['P-001', 'Titanium Classic', 'Frame', 'Ray-Ban', 1_850_000],
            ['P-002', 'Urban Square', 'Frame', 'Oakley', 1_620_000],
            ['P-003', 'Bella Round', 'Frame', 'Vogue', 1_480_000],
            ['P-004', 'Metro Classic', 'Frame', "Levi's", 1_250_000],
            ['P-005', 'AirFlex', 'Frame', 'Excellence', 1_720_000],
            ['P-006', 'Heritage', 'Frame', 'Moscot', 2_100_000],
            ['P-007', 'Lensa Single Vision', 'Lensa', 'Essilor', 750_000],
            ['P-008', 'Lensa Blue Control', 'Lensa', 'Hoya', 1_250_000],
            ['P-009', 'Lensa Progressive', 'Lensa', 'Zeiss', 1_950_000],
            ['P-010', 'Paket Case & Lap', 'Aksesoris', 'Optik Mekar Jaya', 150_000],
            ['P-011', 'Cleaning Kit', 'Aksesoris', 'Makar Eyewear', 90_000],
            ['P-012', '3Clear Black Round', 'Frame', 'Makar Eyewear', 450_000],
        ];

        if ($db->table('barang')->countAllResults() === 0) {
            $rows = [];

            foreach ($produk as [$kode, $nama, $jenis, $merek, $harga]) {
                $rows[] = [
                    'kategori_id' => $kategoriId[$jenis],
                    'kode_barang' => $kode,
                    'nama_barang' => $nama,
                    'jenis'       => $jenis,
                    'merek'       => $merek,
                    'harga_jual'  => $harga,
                    'deskripsi'   => null,
                    'status'      => 'aktif',
                    'created_at'  => date('Y-m-d H:i:s'),
                    'updated_at'  => date('Y-m-d H:i:s'),
                ];
            }

            $db->table('barang')->insertBatch($rows);
        }

        $barang = [];
        foreach ($db->table('barang')->get()->getResultArray() as $b) {
            $barang[$b['kode_barang']] = $b;
        }

        /* ---------- Stok cabang ---------- */
        if ($db->table('stok_cabang')->where('cabang_id', $this->cabangId)->countAllResults() === 0) {
            $saldos = ['P-001' => 8, 'P-002' => 6, 'P-003' => 2, 'P-004' => 9, 'P-005' => 4, 'P-006' => 5, 'P-007' => 12, 'P-008' => 3, 'P-009' => 7, 'P-010' => 20, 'P-011' => 25, 'P-012' => 6];
            $rows   = [];

            foreach ($saldos as $kode => $saldo) {
                $rows[] = [
                    'cabang_id'    => $this->cabangId,
                    'barang_id'    => $barang[$kode]['id'],
                    'jumlah_stok'  => $saldo,
                    'stok_minimum' => $saldo <= 3 ? 3 : 4,
                    'created_at'   => date('Y-m-d H:i:s'),
                    'updated_at'   => date('Y-m-d H:i:s'),
                ];
            }

            $db->table('stok_cabang')->insertBatch($rows);
        }

        /* ---------- Pelanggan ---------- */
        $pelanggan = [
            ['PLG-0042', 'Andi Saputra', '0812 3456 7890', 'Jl. Khatib Sulaiman No. 12'],
            ['PLG-0001', 'Rian Pratama', '0852 7712 9011', 'Jl. Veteran No. 4'],
            ['PLG-0002', 'Siti Maulida', '0812 3456 7891', 'Jl. Pemuda No. 8'],
            ['PLG-0003', 'Andi Pratama', '0813 8765 4321', 'Jl. Sawahan No. 21'],
            ['PLG-0004', 'Nadia Amelia', '0821 6677 8899', 'Jl. Marapalam No. 9'],
            ['PLG-0005', 'Dimas Hidayat', '0853 1122 3344', 'Jl. Proklamasi No. 17'],
            ['PLG-0006', 'Fitri Putri', '0819 5566 7788', 'Jl. Sudirman No. 2'],
            ['PLG-0007', 'Dedi Rahman', '0813 6677 8899', 'Jl. Belanti No. 33'],
            ['PLG-0008', 'Fitri Ananda', '0851 2233 4455', 'Jl. Gajah Mada No. 6'],
            ['PLG-0009', 'Siti Nurhaliza', '0812 3456 7892', 'Jl. Diponegoro No. 10'],
            ['PLG-0010', 'Maya Lestari', '0821 9988 7766', 'Jl. Hayam Wuruk No. 5'],
            ['PLG-0011', 'Zulfa Ramadhani', '0823 1122 3344', 'Jl. Andalas No. 41'],
            ['PLG-0012', 'Hendra Wijaya', '0812 9987 6665', 'Jl. Ahmad Yani No. 19'],
            ['PLG-0013', 'Nadia Putri', '0822 7345 9988', 'Jl. Ratulangi No. 7'],
            ['PLG-0014', 'Siti Rahma', '0812 3456 7893', 'Jl. Pasar Raya No. 3'],
            ['PLG-0015', 'Maya Putri', '0822 9900 1112', 'Jl. Bypass No. 27'],
            ['PLG-0016', 'Dimas Pratama', '0831 1188 5500', 'Jl. Kuranji No. 14'],
        ];

        if ($db->table('pelanggan')->countAllResults() === 0) {
            $rows = [];

            foreach ($pelanggan as [$kode, $nama, $hp, $alamat]) {
                $rows[] = [
                    'nama_pelanggan' => $nama,
                    'alamat'         => $alamat . ' (kode ' . $kode . ')',
                    'no_hp'          => $hp,
                    'created_at'     => date('Y-m-d H:i:s'),
                    'updated_at'     => date('Y-m-d H:i:s'),
                ];
            }

            $db->table('pelanggan')->insertBatch($rows);
        }

        $cust = [];
        foreach ($db->table('pelanggan')->get()->getResultArray() as $c) {
            $cust[$c['nama_pelanggan']] = $c;
        }

        /* ---------- Resep ---------- */
        $resep = [
            ['Andi Saputra', '-1.50', '-0.75', '180', '-1.25', '-0.50', '170', '32.0', '+1.00', 'aktif', '-22 days'],
            ['Rian Pratama', '-2.00', '-0.50', '175', '-1.75', '-0.25', '5', '31.5', '+1.25', 'aktif', '-35 days'],
            ['Siti Maulida', '+1.00', '-0.75', '90', '+1.25', '-0.50', '85', '30.5', '+2.00', 'aktif', '-48 days'],
            ['Nadia Amelia', '-0.75', '-1.00', '160', '-0.50', '-0.75', '15', '32.5', '-', 'aktif', '-60 days'],
            ['Dedi Rahman', '-3.25', '-0.50', '180', '-3.00', '-0.25', '175', '33.0', '+1.75', 'expired', '-95 days'],
            ['Dimas Hidayat', '-0.25', '-0.25', '10', '-0.50', '-0.25', '170', '31.0', '-', 'expired', '-110 days'],
        ];

        if ($db->table('resep')->countAllResults() === 0) {
            $rows = [];

            foreach ($resep as [$nama, $oSph, $oCyl, $oAxis, $sSph, $sCyl, $sAxis, $pd, $add, $status, $offset]) {
                $rows[] = [
                    'fk_id_pelanggan' => $cust[$nama]['id_pelanggan'],
                    'tanggal_resep'   => date('Y-m-d', strtotime($offset)),
                    'catatan'         => 'Resep demo untuk pengujian.',
                    'od_sph'          => $oSph,
                    'od_cyl'          => $oCyl,
                    'od_axis'         => $oAxis,
                    'os_sph'          => $sSph,
                    'os_cyl'          => $sCyl,
                    'os_axis'         => $sAxis,
                    'pd'              => $pd,
                    'add_power'       => $add,
                    'status'          => $status,
                    'created_at'      => date('Y-m-d H:i:s'),
                    'updated_at'      => date('Y-m-d H:i:s'),
                ];
            }

            $db->table('resep')->insertBatch($rows);
        }

        $resepByCust = [];
        foreach ($db->table('resep')->get()->getResultArray() as $r) {
            $resepByCust[$r['fk_id_pelanggan']] = $r;
        }

        /* ---------- Transaksi + pembayaran ---------- */
        if ($db->table('transaksi')->countAllResults() === 0) {
            $metode = ['Tunai', 'QRIS', 'Transfer Bank', 'Kartu Debit/Kredit', 'E-Wallet'];

            $daftar = [
                [0, '14:23', 'selesai', 'Rian Pratama', [['P-010', 1], ['P-007', 1]], 0, 'pembelian'],
                [0, '11:10', 'selesai', 'Siti Nurhaliza', [['P-003', 1]], 1, 'pembelian'],
                [1, '16:45', 'pending', 'Andi Saputra', [['P-009', 1]], 2, 'pemesanan'],
                [1, '13:20', 'selesai', 'Maya Lestari', [['P-007', 1]], 3, 'pembelian'],
                [2, '10:05', 'selesai', 'Dedi Rahman', [['P-012', 1], ['P-008', 1]], 0, 'pembelian'],
                [2, '17:30', 'dibatalkan', 'Fitri Ananda', [['P-012', 1]], 1, 'pembelian'],
                [3, '12:15', 'pending', 'Zulfa Ramadhani', [['P-007', 1]], 2, 'pemesanan'],
                [3, '15:40', 'selesai', 'Hendra Wijaya', [['P-005', 1]], 3, 'pembelian'],
                [4, '09:20', 'selesai', 'Nadia Putri', [['P-011', 1], ['P-010', 1]], 4, 'pembelian'],
            ];

            foreach ($daftar as [$hari, $jam, $status, $nama, $items, $metodeIdx, $jenis]) {
                $tanggal = date('Y-m-d', strtotime("-{$hari} days")) . ' ' . $jam . ':00';
                $subtotal = 0;

                foreach ($items as [$kode, $qty]) {
                    $subtotal += (float) $barang[$kode]['harga_jual'] * $qty;
                }

                $total = $subtotal;

                $db->table('transaksi')->insert([
                    'kode_transaksi'    => 'TMP-' . uniqid(),
                    'pelanggan_id'      => $cust[$nama]['id_pelanggan'],
                    'cabang_id'         => $this->cabangId,
                    'pengguna_id'       => $this->kasirId,
                    'jenis'             => $jenis,
                    'tanggal_transaksi' => $tanggal,
                    'total'             => $total,
                    'diskon'            => 0,
                    'pajak'             => 0,
                    'status'            => $status,
                    'created_at'        => $tanggal,
                    'updated_at'        => $tanggal,
                ]);

                $trxId = (int) $db->insertID();
                $kode  = 'TRX-' . date('Ymd', strtotime($tanggal)) . '-' . str_pad((string) $trxId, 3, '0', STR_PAD_LEFT);
                $db->table('transaksi')->where('id_transaksi', $trxId)->update(['kode_transaksi' => $kode]);

                foreach ($items as [$kodeBarang, $qty]) {
                    $harga = (float) $barang[$kodeBarang]['harga_jual'];
                    $db->table('detail_transaksi')->insert([
                        'transaksi_id' => $trxId,
                        'barang_id'    => $barang[$kodeBarang]['id'],
                        'jumlah'       => $qty,
                        'harga'        => $harga,
                        'subtotal'     => $harga * $qty,
                        'created_at'   => $tanggal,
                        'updated_at'   => $tanggal,
                    ]);
                }

                $statusBayar = $status === 'selesai' ? 'lunas' : $status;
                $db->table('pembayaran')->insert([
                    'transaksi_id'       => $trxId,
                    'tanggal_pembayaran' => $tanggal,
                    'metode_pembayaran'  => $metode[$metodeIdx],
                    'jumlah_bayar'       => $total,
                    'referensi'          => null,
                    'status'             => $statusBayar,
                    'created_at'         => $tanggal,
                    'updated_at'         => $tanggal,
                ]);
            }
        }

        /* ---------- Pemesanan PO ---------- */
        if ($db->table('pemesanan_po')->countAllResults() === 0) {
            $daftarPo = [
                ['PO-2026-0108', 'Siti Rahma', 'sudah_datang', 2, [['P-007', 1], ['P-001', 1]], 'Hubungi pelanggan saat pesanan tersedia.', 'Rian Pratama'],
                ['PO-2026-0107', 'Andi Saputra', 'diproses', 2, [['P-001', 1], ['P-008', 1]], 'Pembuatan lensa mengikuti resep terlampir.', 'Andi Saputra'],
                ['PO-2026-0106', 'Maya Putri', 'dipesan', 3, [['P-008', 1]], 'Menunggu pemrosesan admin cabang.', null],
                ['PO-2026-0103', 'Dimas Pratama', 'selesai', 4, [['P-002', 1]], 'Pesanan selesai dan sudah diambil pelanggan.', null],
            ];

            foreach ($daftarPo as [$kodePo, $nama, $status, $hari, $items, $catatan, $resepNama]) {
                $tanggal  = date('Y-m-d H:i:s', strtotime("-{$hari} days 10:00:00"));
                $subtotal = 0;

                foreach ($items as [$kodeBarang, $qty]) {
                    $subtotal += (float) $barang[$kodeBarang]['harga_jual'] * $qty;
                }

                $resepId = $resepNama !== null ? ($resepByCust[$cust[$resepNama]['id_pelanggan']]['id_resep'] ?? null) : null;

                $db->table('pemesanan_po')->insert([
                    'kode_po'                 => $kodePo,
                    'pelanggan_id'            => $cust[$nama]['id_pelanggan'],
                    'cabang_id'               => $this->cabangId,
                    'pengguna_id'             => $this->kasirId,
                    'resep_id'                => $resepId,
                    'tanggal_po'              => $tanggal,
                    'tanggal_estimasi_selesai' => date('Y-m-d', strtotime($tanggal . ' +7 days')),
                    'total'                   => $subtotal,
                    'status'                  => $status,
                    'catatan'                 => $catatan,
                    'created_at'              => $tanggal,
                    'updated_at'              => $tanggal,
                ]);

                $poId = (int) $db->insertID();

                foreach ($items as [$kodeBarang, $qty]) {
                    $harga = (float) $barang[$kodeBarang]['harga_jual'];
                    $db->table('detail_po')->insert([
                        'po_id'      => $poId,
                        'barang_id'  => $barang[$kodeBarang]['id'],
                        'jumlah'     => $qty,
                        'harga'      => $harga,
                        'subtotal'   => $harga * $qty,
                        'catatan'    => null,
                        'created_at' => $tanggal,
                        'updated_at' => $tanggal,
                    ]);
                }
            }
        }
    }
}
