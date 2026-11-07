<?php

use App\Enums\Role;

if (! function_exists('current_role')) {
    /**
     * Role pengguna yang sedang login, atau null jika tidak valid.
     */
    function current_role(): ?Role
    {
        return Role::tryFrom((string) session()->get('role'));
    }
}

if (! function_exists('has_role')) {
    /**
     * Cek apakah pengguna yang login memiliki salah satu role.
     */
    function has_role(string ...$roles): bool
    {
        $role = current_role();

        return $role !== null && in_array($role->value, $roles, true);
    }
}
