<?php

namespace App\Models;

use CodeIgniter\Model;

class ResepModel extends Model
{
    protected $table         = 'resep';
    protected $primaryKey    = 'id_resep';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'fk_id_pelanggan', 'tanggal_resep', 'catatan',
        'od_sph', 'od_cyl', 'od_axis', 'os_sph', 'os_cyl', 'os_axis',
        'pd', 'add_power', 'status',
    ];

    public function denganPelanggan(): array
    {
        return $this->db->table('resep r')
            ->select('r.*, p.nama_pelanggan, p.no_hp')
            ->join('pelanggan p', 'p.id_pelanggan = r.fk_id_pelanggan')
            ->orderBy('r.tanggal_resep', 'DESC')
            ->get()
            ->getResultArray();
    }

    public function terakhirPelanggan(int $pelangganId): ?array
    {
        return $this->where('fk_id_pelanggan', $pelangganId)
            ->orderBy('tanggal_resep', 'DESC')
            ->first();
    }
}
