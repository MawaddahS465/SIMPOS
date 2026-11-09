<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateStockWorkflowTables extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('stok_pusat')) {
            $this->forge->addField([
                'barang_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'jumlah_stok' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'default' => 0],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
                'updated_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('barang_id', true);
            $this->forge->addForeignKey('barang_id', 'barang', 'id', 'CASCADE', 'CASCADE');
            $this->forge->createTable('stok_pusat');
            $this->db->query(
                'INSERT INTO stok_pusat (barang_id, jumlah_stok, created_at, updated_at)
                 SELECT id, 0, NOW(), NOW() FROM barang'
            );
        }

        $migratedLegacyRequests = false;
        if ($this->db->tableExists('pengajuan_stok') && ! $this->db->fieldExists('jumlah_diminta', 'pengajuan_stok')) {
            $legacyFields = ['id_pengajuan', 'kode_pengajuan', 'waktu', 'pengguna_id', 'cabang_id', 'barang_id', 'jumlah', 'catatan', 'status', 'ditolak_pada', 'ditolak_oleh', 'ditolak_alasan', 'created_at', 'updated_at'];
            foreach ($legacyFields as $field) {
                if (! $this->db->fieldExists($field, 'pengajuan_stok')) {
                    throw new \RuntimeException('Skema tabel pengajuan_stok lama tidak dikenali; migrasi dihentikan tanpa mengubah tabel tersebut.');
                }
            }
            if ($this->db->tableExists('pengajuan_stok_legacy')) {
                throw new \RuntimeException('Tabel pengajuan_stok_legacy sudah ada; migrasi dihentikan agar data tidak tertimpa.');
            }

            $this->forge->renameTable('pengajuan_stok', 'pengajuan_stok_legacy');
            $migratedLegacyRequests = true;
        }

        if (! $this->db->tableExists('pengajuan_stok')) {
            $this->forge->addField([
                'id_pengajuan' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
                'kode_pengajuan' => ['type' => 'VARCHAR', 'constraint' => 40],
                'cabang_id' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true],
                'barang_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'pengguna_id' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true],
                'jumlah_diminta' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'catatan' => ['type' => 'TEXT', 'null' => true],
                'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'diajukan'],
                'alasan_penolakan' => ['type' => 'TEXT', 'null' => true],
                'ditolak_oleh' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true, 'null' => true],
                'ditolak_pada' => ['type' => 'DATETIME', 'null' => true],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
                'updated_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id_pengajuan', true);
            $this->forge->addKey('kode_pengajuan', false, true);
            $this->forge->addKey(['cabang_id', 'status']);
            $this->forge->addForeignKey('cabang_id', 'cabang', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->addForeignKey('barang_id', 'barang', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->addForeignKey('pengguna_id', 'users', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->addForeignKey('ditolak_oleh', 'users', 'id', 'SET NULL', 'CASCADE');
            $this->forge->createTable('pengajuan_stok');
        }

        if ($migratedLegacyRequests) {
            $this->db->query(
                "INSERT INTO pengajuan_stok
                    (id_pengajuan, kode_pengajuan, cabang_id, barang_id, pengguna_id, jumlah_diminta, catatan,
                     status, alasan_penolakan, ditolak_oleh, ditolak_pada, created_at, updated_at)
                 SELECT id_pengajuan, kode_pengajuan, cabang_id, barang_id, pengguna_id, jumlah, catatan,
                    LOWER(status), ditolak_alasan, ditolak_oleh, ditolak_pada,
                    COALESCE(created_at, waktu), COALESCE(updated_at, created_at, waktu)
                 FROM pengajuan_stok_legacy"
            );
        }

        if (! $this->db->tableExists('alokasi_stok')) {
            $this->forge->addField([
                'id_alokasi' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
                'kode_alokasi' => ['type' => 'VARCHAR', 'constraint' => 40],
                'cabang_id' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true],
                'pengajuan_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
                'pemilik_id' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true],
                'catatan' => ['type' => 'TEXT', 'null' => true],
                'idempotency_key' => ['type' => 'VARCHAR', 'constraint' => 80, 'null' => true],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
                'updated_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id_alokasi', true);
            $this->forge->addKey('kode_alokasi', false, true);
            $this->forge->addKey('idempotency_key', false, true);
            $this->forge->addKey(['cabang_id', 'created_at']);
            $this->forge->addForeignKey('cabang_id', 'cabang', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->addForeignKey('pengajuan_id', 'pengajuan_stok', 'id_pengajuan', 'SET NULL', 'CASCADE');
            $this->forge->addForeignKey('pemilik_id', 'users', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->createTable('alokasi_stok');
        }

        if (! $this->db->tableExists('detail_alokasi_stok')) {
            $this->forge->addField([
                'id_detail_alokasi' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
                'alokasi_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'barang_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'jumlah_dialokasikan' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'jumlah_diterima' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'default' => 0],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
                'updated_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id_detail_alokasi', true);
            $this->forge->addKey(['alokasi_id', 'barang_id'], false, true);
            $this->forge->addForeignKey('alokasi_id', 'alokasi_stok', 'id_alokasi', 'CASCADE', 'CASCADE');
            $this->forge->addForeignKey('barang_id', 'barang', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->createTable('detail_alokasi_stok');
        }

        if (! $this->db->tableExists('penerimaan_stok')) {
            $this->forge->addField([
                'id_penerimaan' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
                'detail_alokasi_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'admin_id' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true],
                'jumlah' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'catatan' => ['type' => 'TEXT', 'null' => true],
                'idempotency_key' => ['type' => 'VARCHAR', 'constraint' => 80],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id_penerimaan', true);
            $this->forge->addKey('idempotency_key', false, true);
            $this->forge->addKey('detail_alokasi_id');
            $this->forge->addForeignKey('detail_alokasi_id', 'detail_alokasi_stok', 'id_detail_alokasi', 'RESTRICT', 'CASCADE');
            $this->forge->addForeignKey('admin_id', 'users', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->createTable('penerimaan_stok');
        }

        $migratedLegacyMutations = false;
        if ($this->db->tableExists('mutasi_stok') && ! $this->db->fieldExists('event_key', 'mutasi_stok')) {
            $legacyFields = ['id_mutasi', 'kode_mutasi', 'waktu', 'barang_id', 'cabang_id', 'arah', 'sumber', 'jumlah', 'saldo_sebelum', 'saldo_sesudah', 'referensi', 'pengguna_id', 'petugas', 'created_at'];
            foreach ($legacyFields as $field) {
                if (! $this->db->fieldExists($field, 'mutasi_stok')) {
                    throw new \RuntimeException('Skema tabel mutasi_stok lama tidak dikenali; migrasi dihentikan tanpa mengubah tabel tersebut.');
                }
            }
            if ($this->db->tableExists('mutasi_stok_legacy')) {
                throw new \RuntimeException('Tabel mutasi_stok_legacy sudah ada; migrasi dihentikan agar data tidak tertimpa.');
            }

            $this->forge->renameTable('mutasi_stok', 'mutasi_stok_legacy');
            $migratedLegacyMutations = true;
        }

        if (! $this->db->tableExists('mutasi_stok')) {
            $this->forge->addField([
                'id_mutasi' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
                'cabang_id' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true],
                'barang_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'pengguna_id' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true, 'null' => true],
                'arah' => ['type' => 'VARCHAR', 'constraint' => 3],
                'sumber' => ['type' => 'VARCHAR', 'constraint' => 30],
                'jumlah' => ['type' => 'INT', 'constraint' => 11],
                'saldo_sebelum' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'saldo_sesudah' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
                'referensi' => ['type' => 'VARCHAR', 'constraint' => 100],
                'event_key' => ['type' => 'VARCHAR', 'constraint' => 120],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id_mutasi', true);
            $this->forge->addKey('event_key', false, true);
            $this->forge->addKey(['cabang_id', 'created_at']);
            $this->forge->addForeignKey('cabang_id', 'cabang', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->addForeignKey('barang_id', 'barang', 'id', 'RESTRICT', 'CASCADE');
            $this->forge->addForeignKey('pengguna_id', 'users', 'id', 'SET NULL', 'CASCADE');
            $this->forge->createTable('mutasi_stok');
        }

        if ($migratedLegacyMutations) {
            $this->db->query(
                "INSERT INTO mutasi_stok
                    (id_mutasi, cabang_id, barang_id, pengguna_id, arah, sumber, jumlah,
                     saldo_sebelum, saldo_sesudah, referensi, event_key, created_at)
                 SELECT id_mutasi, cabang_id, barang_id, pengguna_id,
                    CASE UPPER(arah)
                        WHEN 'MASUK' THEN 'IN'
                        WHEN 'KELUAR' THEN 'OUT'
                        ELSE UPPER(arah)
                    END,
                    sumber, jumlah, saldo_sebelum, saldo_sesudah, referensi,
                    CONCAT('legacy-mutasi-', id_mutasi), COALESCE(created_at, waktu)
                 FROM mutasi_stok_legacy"
            );
        }
    }

    public function down()
    {
        foreach (['mutasi_stok', 'penerimaan_stok', 'detail_alokasi_stok', 'alokasi_stok', 'pengajuan_stok', 'stok_pusat'] as $table) {
            if ($this->db->tableExists($table)) {
                $this->forge->dropTable($table);
            }
        }
        foreach (['mutasi_stok', 'pengajuan_stok'] as $table) {
            if ($this->db->tableExists($table . '_legacy')) {
                $this->forge->renameTable($table . '_legacy', $table);
            }
        }
    }
}
