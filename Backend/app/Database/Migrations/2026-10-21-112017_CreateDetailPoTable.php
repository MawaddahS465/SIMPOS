<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateDetailPoTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id_detail_po' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'po_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
            ],
            'barang_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
            ],
            'jumlah' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'default' => 1,
            ],
            'harga' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
                'unsigned' => true,
                'default' => 0,
            ],
            'subtotal' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
                'unsigned' => true,
                'default' => 0,
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

        $this->forge->addKey('id_detail_po', true);
        $this->forge->addKey('po_id');
        $this->forge->addKey('barang_id');

        $this->forge->addForeignKey(
            'po_id',
            'pemesanan_po',
            'id_po',
            'CASCADE',
            'CASCADE'
        );

        $this->forge->addForeignKey(
            'barang_id',
            'barang',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->forge->createTable('detail_po');
    }

    public function down()
    {
        $this->forge->dropTable('detail_po');
    }
}
