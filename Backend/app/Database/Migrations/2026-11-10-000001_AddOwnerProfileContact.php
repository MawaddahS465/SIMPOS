<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Menambahkan kontak profil Pemilik dan email cabang agar halaman
 * Pengaturan dapat menyimpan data yang ditampilkan di UI.
 */
class AddOwnerProfileContact extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('email', 'users')) {
            $this->forge->addColumn('users', [
                'email' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 150,
                    'null'       => true,
                    'after'      => 'username',
                ],
            ]);
        }
        if (! $this->db->fieldExists('phone', 'users')) {
            $this->forge->addColumn('users', [
                'phone' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 30,
                    'null'       => true,
                    'after'      => 'email',
                ],
            ]);
        }
        if (! $this->db->fieldExists('email', 'cabang')) {
            $this->forge->addColumn('cabang', [
                'email' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 150,
                    'null'       => true,
                    'after'      => 'telepon',
                ],
            ]);
        }
    }

    public function down()
    {
        if ($this->db->fieldExists('email', 'cabang')) {
            $this->forge->dropColumn('cabang', 'email');
        }
        if ($this->db->fieldExists('phone', 'users')) {
            $this->forge->dropColumn('users', 'phone');
        }
        if ($this->db->fieldExists('email', 'users')) {
            $this->forge->dropColumn('users', 'email');
        }
    }
}
