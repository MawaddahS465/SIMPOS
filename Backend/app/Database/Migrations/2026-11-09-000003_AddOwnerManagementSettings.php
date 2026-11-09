<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddOwnerManagementSettings extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('kota', 'cabang')) {
            $this->forge->addColumn('cabang', [
                'kota' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true, 'after' => 'nama_cabang'],
            ]);
        }
        if (! $this->db->fieldExists('penanggung_jawab', 'cabang')) {
            $this->forge->addColumn('cabang', [
                'penanggung_jawab' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true, 'after' => 'telepon'],
            ]);
        }

        if (! $this->db->tableExists('app_settings')) {
            $this->forge->addField([
                'setting_key' => ['type' => 'VARCHAR', 'constraint' => 64],
                'setting_value' => ['type' => 'TEXT', 'null' => true],
                'updated_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('setting_key', true);
            $this->forge->createTable('app_settings');
        }
    }

    public function down()
    {
        if ($this->db->tableExists('app_settings')) {
            $this->forge->dropTable('app_settings');
        }
        if ($this->db->fieldExists('penanggung_jawab', 'cabang')) {
            $this->forge->dropColumn('cabang', 'penanggung_jawab');
        }
        if ($this->db->fieldExists('kota', 'cabang')) {
            $this->forge->dropColumn('cabang', 'kota');
        }
    }
}
