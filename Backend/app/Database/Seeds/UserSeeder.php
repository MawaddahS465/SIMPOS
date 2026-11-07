<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run()
    {
        $cabang = $this->db
    ->table('cabang')
    ->where('nama_cabang', 'Pasar Raya 1')
    ->get()
    ->getRowArray();

if (!$cabang) {
    throw new \RuntimeException(
        'Cabang Pasar Raya 1 belum tersedia. Jalankan CabangSeeder terlebih dahulu.'
    );
}

$cabangId = $cabang['id'];


        $users = [
            [
                'nama'      => 'Pemilik Optik',
                'username'  => 'pemilik',
                'password'  => '123',
                'role'      => 'pemilik',
                'cabang_id' => null,
                'status'    => 'aktif',
            ],
            [
                'nama'      => 'Kasir ',
                'username'  => 'kasir1',
                'password'  => '123',
                'role'      => 'kasir',
                'cabang_id' => $cabangId,
                'status'    => 'aktif',
            ],
            [
                'nama'      => 'Admin',
                'username'  => 'admin1',
                'password'  => '123',
                'role'      => 'admin',
                'cabang_id' => $cabangId,
                'status'    => 'aktif',
            ],
        ];

        foreach ($users as $user) {
            $sudahAda = $this->db
                ->table('users')
                ->where('username', $user['username'])
                ->countAllResults();

            if ($sudahAda > 0) {
                echo "Username {$user['username']} sudah ada, dilewati.\n";
                continue;
            }

            $data = [
                'nama'       => $user['nama'],
                'username'   => $user['username'],
                'password'   => password_hash(
                    $user['password'],
                    PASSWORD_DEFAULT
                ),
                'role'       => $user['role'],
                'cabang_id'  => $user['cabang_id'],
                'status'     => $user['status'],
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $this->db->table('users')->insert($data);

            echo "Akun {$user['username']} berhasil dibuat.\n";
        }
    }
}
