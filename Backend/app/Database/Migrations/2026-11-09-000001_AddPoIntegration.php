<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Menyimpan keterkaitan PO dengan transaksi pengambilan dan riwayat status.
 */
class AddPoIntegration extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('transaksi_id', 'pemesanan_po')) {
            $this->forge->addColumn('pemesanan_po', [
                'transaksi_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => true,
                    'after'      => 'status',
                ],
            ]);
        }

        $transactionIndex = $this->db->query(
            'SHOW INDEX FROM `pemesanan_po` WHERE Key_name = ?',
            ['pemesanan_po_transaksi_id_index']
        )->getRowArray();
        if ($transactionIndex === null) {
            $this->db->query('ALTER TABLE `pemesanan_po` ADD INDEX `pemesanan_po_transaksi_id_index` (`transaksi_id`)');
        }

        $migratedLegacyTimeline = false;
        if ($this->db->tableExists('po_timeline') && ! $this->db->fieldExists('dari_status', 'po_timeline')) {
            $legacyFields = ['id_timeline', 'po_id', 'waktu', 'aktor', 'status_dari', 'status_ke', 'catatan'];
            foreach ($legacyFields as $field) {
                if (! $this->db->fieldExists($field, 'po_timeline')) {
                    throw new \RuntimeException('Skema tabel po_timeline lama tidak dikenali; migrasi dihentikan tanpa mengubah tabel tersebut.');
                }
            }
            if ($this->db->tableExists('po_timeline_legacy')) {
                throw new \RuntimeException('Tabel po_timeline_legacy sudah ada; migrasi dihentikan agar data tidak tertimpa.');
            }

            $this->forge->renameTable('po_timeline', 'po_timeline_legacy');
            $migratedLegacyTimeline = true;
        }

        if (! $this->db->tableExists('po_timeline')) {
            $this->forge->addField([
            'id_timeline' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'po_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'dari_status' => [
                'type'       => 'VARCHAR',
                'constraint' => 30,
                'null'       => true,
            ],
            'ke_status' => [
                'type'       => 'VARCHAR',
                'constraint' => 30,
            ],
            'catatan' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'actor_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'null'       => true,
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

            $this->forge->addKey('id_timeline', true);
            $this->forge->addKey('po_id');
            $this->forge->addKey('actor_id');
            $this->forge->addForeignKey('po_id', 'pemesanan_po', 'id_po', 'CASCADE', 'CASCADE');
            $this->forge->addForeignKey('actor_id', 'users', 'id', 'SET NULL', 'CASCADE');
            $this->forge->createTable('po_timeline');
        }

        if ($migratedLegacyTimeline) {
            $this->db->query(
                "INSERT INTO po_timeline (id_timeline, po_id, dari_status, ke_status, catatan, actor_id, created_at, updated_at)
                 SELECT id_timeline, po_id, status_dari, status_ke,
                    NULLIF(CONCAT_WS(': ', NULLIF(aktor, ''), NULLIF(catatan, '')), ''),
                    NULL, waktu, waktu
                 FROM po_timeline_legacy"
            );
        } elseif ((int) $this->db->table('po_timeline')->countAllResults() === 0) {
            $this->db->query(
                "INSERT INTO po_timeline (po_id, dari_status, ke_status, catatan, actor_id, created_at, updated_at)
                 SELECT id_po, NULL, status, 'Riwayat awal sebelum integrasi timeline', pengguna_id, tanggal_po, tanggal_po
                 FROM pemesanan_po"
            );
        }
    }

    public function down()
    {
        if ($this->db->tableExists('po_timeline')) {
            $this->forge->dropTable('po_timeline');
        }
        if ($this->db->tableExists('po_timeline_legacy')) {
            $this->forge->renameTable('po_timeline_legacy', 'po_timeline');
        }
        if ($this->db->fieldExists('transaksi_id', 'pemesanan_po')) {
            $this->forge->dropColumn('pemesanan_po', 'transaksi_id');
        }
    }
}
