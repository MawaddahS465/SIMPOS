<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Gudang pusat sebelumnya hanya representasi sintetis di UI Pemilik.
 * Tabel users butuh cabang_id nyata untuk akun admin/kasir, jadi gudang
 * pusat didaftarkan sebagai cabang tersembunyi dengan kode PST.
 */
class AddGudangPusatBranch extends Migration
{
    public function up()
    {
        $existing = $this->db->table('cabang')
            ->where('kode_cabang', 'PST')
            ->get()
            ->getRowArray();

        if ($existing !== null) {
            if ($existing['status'] !== 'aktif' || $existing['deleted_at'] !== null) {
                $this->db->table('cabang')->where('id', $existing['id'])->update([
                    'status' => 'aktif',
                    'deleted_at' => null,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }

            return;
        }

        $settings = [];
        if ($this->db->tableExists('app_settings')) {
            $rows = $this->db->table('app_settings')->get()->getResultArray();
            $settings = array_column($rows, 'setting_value', 'setting_key');
        }

        $this->db->table('cabang')->insert([
            'kode_cabang' => 'PST',
            'nama_cabang' => 'Gudang Pusat',
            'kota' => '',
            'alamat' => $settings['storeAddress'] ?? '',
            'telepon' => $settings['storePhone'] ?? '',
            'email' => $settings['storeEmail'] ?? null,
            'penanggung_jawab' => $settings['storePic'] ?? 'Pemilik',
            'status' => 'aktif',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function down()
    {
        $central = $this->db->table('cabang')
            ->where('kode_cabang', 'PST')
            ->get()
            ->getRowArray();

        if ($central === null) {
            return;
        }

        $this->db->table('users')->where('cabang_id', $central['id'])->update(['cabang_id' => null]);
        $this->db->table('cabang')->where('id', $central['id'])->delete();
    }
}
