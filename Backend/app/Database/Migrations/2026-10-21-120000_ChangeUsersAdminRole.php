<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ChangeUsersAdminRole extends Migration
{
    public function up()
    {
        $this->forge->modifyColumn('users', [
            'role' => [
                'type'       => 'ENUM',
                'constraint' => ['pemilik', 'admin', 'admin_cabang', 'kasir'],
                'default'    => 'kasir',
            ],
        ]);

        $this->db->table('users')
            ->where('role', 'admin_cabang')
            ->update(['role' => 'admin']);

        $this->forge->modifyColumn('users', [
            'role' => [
                'type'       => 'ENUM',
                'constraint' => ['pemilik', 'admin', 'kasir'],
                'default'    => 'kasir',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->modifyColumn('users', [
            'role' => [
                'type'       => 'ENUM',
                'constraint' => ['pemilik', 'admin', 'admin_cabang', 'kasir'],
                'default'    => 'kasir',
            ],
        ]);

        $this->db->table('users')
            ->where('role', 'admin')
            ->update(['role' => 'admin_cabang']);

        $this->forge->modifyColumn('users', [
            'role' => [
                'type'       => 'ENUM',
                'constraint' => ['pemilik', 'admin_cabang', 'kasir'],
                'default'    => 'kasir',
            ],
        ]);
    }
}
