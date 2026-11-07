<?php

namespace App\Enums;

/**
 * Peran pengguna SIMPOS.
 *
 * Satu-satunya sumber daftar role. Jangan menulis ulang array role
 * di controller/filter; gunakan enum ini agar tidak ada duplikasi.
 */
enum Role: string
{
    case Pemilik = 'pemilik';
    case Admin   = 'admin';
    case Kasir   = 'kasir';

    /**
     * Semua nilai role, untuk validasi in_list / pengecekan in_array.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $role): string => $role->value, self::cases());
    }

    /**
     * Label yang ditampilkan di UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pemilik => 'Pemilik',
            self::Admin   => 'Admin Cabang',
            self::Kasir   => 'Kasir',
        };
    }

    /**
     * Judul dashboard untuk masing-masing role.
     */
    public function dashboardTitle(): string
    {
        return match ($this) {
            self::Pemilik => 'Dashboard Pemilik',
            self::Admin   => 'Dashboard Admin',
            self::Kasir   => 'Dashboard Kasir',
        };
    }

    /**
     * Role yang wajib terhubung ke satu cabang.
     */
    public function requiresCabang(): bool
    {
        return match ($this) {
            self::Pemilik => false,
            self::Admin   => true,
            self::Kasir   => true,
        };
    }
}
