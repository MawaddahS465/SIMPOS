<?php

namespace App\Models;

use CodeIgniter\Model;

class PoTimelineModel extends Model
{
    protected $table         = 'po_timeline';
    protected $primaryKey    = 'id_timeline';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['po_id', 'dari_status', 'ke_status', 'catatan', 'actor_id'];

    /**
     * @return list<array<string, mixed>>
     */
    public function forPo(int $poId): array
    {
        return $this->db->table('po_timeline t')
            ->select('t.*, u.nama AS actor_nama')
            ->join('users u', 'u.id = t.actor_id', 'left')
            ->where('t.po_id', $poId)
            ->orderBy('t.created_at', 'ASC')
            ->orderBy('t.id_timeline', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function catat(int $poId, ?string $from, string $to, ?string $note, int $actorId): bool
    {
        return (bool) $this->insert([
            'po_id'       => $poId,
            'dari_status' => $from,
            'ke_status'   => $to,
            'catatan'     => $note,
            'actor_id'    => $actorId > 0 ? $actorId : null,
        ]);
    }
}
