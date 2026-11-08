<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCabangTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 5,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'kode_cabang' => [
                'type'       => 'VARCHAR',
                'constraint' => 10,
                'unique'     => true,
            ],
            'nama_cabang' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'alamat' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'telepon' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'null'       => true,
            ],
            // PERUBAHAN: Mengubah VARCHAR menjadi ENUM untuk integritas data
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['aktif', 'nonaktif'],
                'default'    => 'aktif',
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            // TAMBAHAN: Kolom untuk fitur Soft Deletes CodeIgniter 4
            'deleted_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->createTable('cabang');

        $existing = $this->db->table('cabang')->countAllResults();
        if ($existing === 0) {
            $this->db->table('cabang')->insertBatch([
                [
                    'kode_cabang' => 'CB001',
                    'nama_cabang' => 'Pasar Raya 1',
                    'alamat'      => 'Pasar Raya',
                    'telepon'     => '',
                    'status'      => 'aktif',
                ],
                [
                    'kode_cabang' => 'CB002',
                    'nama_cabang' => 'Pasar Raya 2',
                    'alamat'      => 'Pasar Raya',
                    'telepon'     => '',
                    'status'      => 'aktif',
                ],
                [
                    'kode_cabang' => 'CB003',
                    'nama_cabang' => 'Pasar Raya 3',
                    'alamat'      => 'Pasar Raya',
                    'telepon'     => '',
                    'status'      => 'aktif',
                ],
                [
                    'kode_cabang' => 'CB004',
                    'nama_cabang' => 'Pasar Raya 4',
                    'alamat'      => 'Pasar Raya',
                    'telepon'     => '',
                    'status'      => 'aktif',
                ],
                [
                    'kode_cabang' => 'CB005',
                    'nama_cabang' => 'Pasar Raya 5',
                    'alamat'      => 'Pasar Raya',
                    'telepon'     => '',
                    'status'      => 'aktif',
                ],
                [
                    'kode_cabang' => 'CB006',
                    'nama_cabang' => 'Bandar Buat',
                    'alamat'      => 'Bandar Buat',
                    'telepon'     => '',
                    'status'      => 'aktif',
                ],
                [
                    'kode_cabang' => 'CB007',
                    'nama_cabang' => 'Payakumbuh',
                    'alamat'      => 'Payakumbuh',
                    'telepon'     => '',
                    'status'      => 'aktif',
                ],
            ]);
        }
    }

    public function down()
    {
        $this->forge->dropTable('cabang');
    }
}