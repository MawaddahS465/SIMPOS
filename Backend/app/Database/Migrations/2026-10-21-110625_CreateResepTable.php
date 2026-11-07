<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateResepTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id_resep' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'fk_id_pelanggan' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'tanggal_resep' => [
                'type' => 'DATE',
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

        $this->forge->addKey('id_resep', true);
        $this->forge->addKey('fk_id_pelanggan');

        $this->forge->addForeignKey(
            'fk_id_pelanggan',
            'pelanggan',
            'id_pelanggan',
            'CASCADE',
            'CASCADE'
        );

        $this->forge->createTable('resep');
    }

    public function down()
    {
        $this->forge->dropTable('resep');
    }
}
