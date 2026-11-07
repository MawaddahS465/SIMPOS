<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateStokCabangTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'cabang_id' => [
                'type'       => 'INT',
                'constraint' => 5,
                'unsigned'   => true,
            ],
            'barang_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'jumlah_stok' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'default'    => 0,
            ],
            'stok_minimum' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'default'    => 5,
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

        $this->forge->addKey('id', true);

        $this->forge->addKey(
            ['cabang_id', 'barang_id'],
            false,
            true
        );

        $this->forge->addForeignKey(
            'cabang_id',
            'cabang',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->forge->addForeignKey(
            'barang_id',
            'barang',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->forge->createTable('stok_cabang');
    }

    public function down()
    {
        $this->forge->dropTable('stok_cabang');
    }
}
