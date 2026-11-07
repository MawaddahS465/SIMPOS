<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table         = 'users';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'nama',
        'username',
        'password',
        'role',
        'cabang_id',
        'status',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    // Tabel users punya kolom deleted_at, jadi aktifkan soft delete
    // agar riwayat transaksi kasir tidak ikut terhapus.
    protected $useSoftDeletes = true;
    protected $deletedField   = 'deleted_at';

    // Password selalu di-hash di model, bukan di controller.
    protected $beforeInsert = ['hashPassword'];
    protected $beforeUpdate = ['hashPassword'];

    /**
     * Hash password sebelum disimpan. Nilai yang sudah berupa hash
     * (mis. dari proses migrasi password lama) dilewati agar tidak
     * ter-hash dua kali.
     *
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    protected function hashPassword(array $data): array
    {
        if (! isset($data['data']['password'])) {
            return $data;
        }

        $password = (string) $data['data']['password'];

        if (password_get_info($password)['algoName'] !== 'unknown') {
            return $data;
        }

        $data['data']['password'] = password_hash($password, PASSWORD_DEFAULT);

        return $data;
    }
}
