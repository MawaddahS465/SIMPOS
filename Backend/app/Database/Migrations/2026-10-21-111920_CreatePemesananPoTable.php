<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePemesananPoTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id_po' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'kode_po' => [
                'type' => 'VARCHAR',
                'constraint' => 30,
                'unique' => true,
            ],
            'pelanggan_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
            ],
            'cabang_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
            ],
            'pengguna_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
            ],
            'resep_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'null' => true,
            ],
            'tanggal_po' => [
                'type' => 'DATETIME',
            ],
            'tanggal_estimasi_selesai' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'total' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
                'unsigned' => true,
                'default' => 0,
            ],
            'status' => [
                'type' => 'VARCHAR',
                'constraint' => 30,
                'default' => 'menunggu',
            ],
            'catatan' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id_po', true);
        $this->forge->addKey('pelanggan_id');
        $this->forge->addKey('cabang_id');
        $this->forge->addKey('pengguna_id');
        $this->forge->addKey('resep_id');

        $this->forge->addForeignKey(
            'pelanggan_id',
            'pelanggan',
            'id_pelanggan',
            'RESTRICT',
            'CASCADE'
        );

        $this->forge->addForeignKey(
            'cabang_id',
            'cabang',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->forge->addForeignKey(
            'pengguna_id',
            'users',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->forge->addForeignKey(
            'resep_id',
            'resep',
            'id_resep',
            'SET NULL',
            'CASCADE'
        );

        $this->forge->createTable('pemesanan_po');
    }

    public function down()
    {
        $this->forge->dropTable('pemesanan_po');
    }
}
