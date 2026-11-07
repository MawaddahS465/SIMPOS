<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUsersTable extends Migration
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
            'nama' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'username' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'unique'     => true,
            ],
            'password' => [
                'type'       => 'VARCHAR',
                'constraint' => 255, // Sudah sangat tepat untuk menampung password_hash()
            ],
            // PERUBAHAN: Menggunakan ENUM agar hak akses terstruktur
            'role' => [
                'type'       => 'ENUM',
                'constraint' => ['pemilik', 'admin', 'kasir'],
                'default'    => 'kasir',
            ],
            'cabang_id' => [
                'type'       => 'INT',
                'constraint' => 5,
                'unsigned'   => true,
                'null'       => true, // Nullable jika ada user pusat/pemilik yang tidak terikat 1 cabang
            ],
            // PERUBAHAN: Konsisten menggunakan ENUM seperti tabel cabang
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
            // TAMBAHAN: Soft deletes untuk menjaga riwayat transaksi kasir
            'deleted_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        
        // PERUBAHAN: Penyesuaian aturan ON UPDATE dan ON DELETE
        $this->forge->addForeignKey(
            'cabang_id', 
            'cabang', 
            'id', 
            'CASCADE',  // ON UPDATE
            'RESTRICT'  // ON DELETE
        );
        
        $this->forge->createTable('users');
    }

    public function down()
    {
        $this->forge->dropTable('users');
    }
}