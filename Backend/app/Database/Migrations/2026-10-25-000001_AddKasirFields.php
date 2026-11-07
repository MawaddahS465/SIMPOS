<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Melengkapi kolom yang dibutuhkan halaman Kasir:
 * - resep: ukuran OD/OS, PD, ADD, status
 * - transaksi: kode transaksi, jenis, diskon, pajak
 */
class AddKasirFields extends Migration
{
    public function up()
    {
        $this->forge->addColumn('resep', [
            'od_sph' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'tanggal_resep'],
            'od_cyl' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'od_sph'],
            'od_axis' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'od_cyl'],
            'os_sph' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'od_axis'],
            'os_cyl' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'os_sph'],
            'os_axis' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'os_cyl'],
            'pd' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'os_axis'],
            'add_power' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'pd'],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'aktif', 'after' => 'add_power'],
        ]);

        $this->forge->addColumn('transaksi', [
            'kode_transaksi' => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => true, 'after' => 'id_transaksi'],
            'jenis' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'pembelian', 'after' => 'pengguna_id'],
            'diskon' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'unsigned' => true, 'default' => 0, 'after' => 'total'],
            'pajak' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'unsigned' => true, 'default' => 0, 'after' => 'diskon'],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('resep', ['od_sph', 'od_cyl', 'od_axis', 'os_sph', 'os_cyl', 'os_axis', 'pd', 'add_power', 'status']);
        $this->forge->dropColumn('transaksi', ['kode_transaksi', 'jenis', 'diskon', 'pajak']);
    }
}
