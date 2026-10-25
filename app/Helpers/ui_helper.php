<?php

use App\Enums\Role;

if (! function_exists('icon')) {
    /**
     * Ikon SVG dari sprite lucide (public/assets/icons/sprite.svg).
     */
    function icon(string $name, int $size = 18): string
    {
        $url = base_url('assets/icons/sprite.svg') . '#i-' . $name;

        return '<svg class="ic" width="' . $size . '" height="' . $size . '" aria-hidden="true">'
            . '<use href="' . $url . '"></use></svg>';
    }
}

if (! function_exists('rupiah')) {
    function rupiah($value): string
    {
        return 'Rp ' . number_format((float) $value, 0, ',', '.');
    }
}

if (! function_exists('rp_short')) {
    function rp_short($value): string
    {
        $v = (float) $value;

        if ($v >= 1_000_000) {
            return 'Rp ' . rtrim(rtrim(number_format($v / 1_000_000, 1, ',', '.'), '0'), ',') . ' jt';
        }

        if ($v >= 1_000) {
            return 'Rp ' . number_format($v / 1_000, 0, ',', '.') . ' rb';
        }

        return 'Rp 0';
    }
}

if (! function_exists('initials')) {
    function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $first = mb_substr($parts[0] ?? '', 0, 1);

        return mb_strtoupper($first . mb_substr($parts[1] ?? '', 0, 1));
    }
}

if (! function_exists('tgl_id')) {
    function tgl_id(?string $datetime, bool $withTime = false): string
    {
        if (empty($datetime)) {
            return '-';
        }

        $ts = strtotime($datetime);

        if ($ts === false) {
            return (string) $datetime;
        }

        $bulan = [1 => 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $text  = date('j', $ts) . ' ' . $bulan[(int) date('n', $ts)] . ' ' . date('Y', $ts);

        return $withTime ? $text . ', ' . date('H:i', $ts) : $text;
    }
}

if (! function_exists('label_status')) {
    /**
     * Label tampilan dari kode status di database.
     */
    function label_status(?string $key): string
    {
        $k = strtolower(str_replace(['-', ' '], '_', trim((string) $key)));

        return [
            'lunas'         => 'Lunas',
            'berhasil'      => 'Lunas',
            'selesai'       => 'Selesai',
            'pending'       => 'Pending',
            'dibatalkan'    => 'Dibatalkan',
            'menunggu'      => 'Diproses',
            'dipesan'       => 'Dipesan',
            'diproses'      => 'Diproses',
            'sudah_datang'  => 'Sudah Datang',
            'aktif'         => 'Aktif',
            'expired'       => 'Kedaluwarsa',
            'aman'          => 'Aman',
            'menipis'       => 'Stok Menipis',
        ][$k] ?? ucfirst($k);
    }
}

if (! function_exists('status_pill')) {
    /**
     * Pill status dengan warna yang sama seperti mockup.
     */
    function status_pill(?string $key, bool $dot = true): string
    {
        $k = strtolower(str_replace(['-', ' '], '_', trim((string) $key)));

        $map = [
            'lunas'        => ['#e2f7ec', '#1f9d63'],
            'berhasil'     => ['#e2f7ec', '#1f9d63'],
            'selesai'      => ['#eef0f8', '#5b5f7a'],
            'pending'      => ['#fdf0d6', '#b57a12'],
            'dibatalkan'   => ['#fde7ea', '#d8455f'],
            'menunggu'     => ['#eaf0ff', '#3a4fd0'],
            'dipesan'      => ['#eaf0ff', '#3a4fd0'],
            'diproses'     => ['#fff4dd', '#a16207'],
            'sudah_datang' => ['#e5f9ef', '#15803d'],
            'aktif'        => ['#e6e8fd', '#4a44ee'],
            'expired'      => ['#f1f0f8', '#8d8eb4'],
            'aman'         => ['#e2f7ec', '#1f9d63'],
            'menipis'      => ['#fdf0d6', '#b57a12'],
        ];

        [$bg, $fg] = $map[$k] ?? ['#eef0f8', '#5b5f7a'];
        $dotHtml   = $dot ? '<i style="background:' . $fg . '"></i>' : '';

        return '<span class="status-pill" style="background:' . $bg . ';color:' . $fg . '">'
            . $dotHtml . esc(label_status($key)) . '</span>';
    }
}

if (! function_exists('current_branch_name')) {
    function current_branch_name(): string
    {
        static $name = null;

        if ($name !== null) {
            return $name;
        }

        $id = (int) (session()->get('cabang_id') ?? 0);

        if ($id <= 0) {
            return $name = 'Seluruh Cabang';
        }

        $row  = db_connect()->table('cabang')->select('nama_cabang')->where('id', $id)->get()->getRow();
        $name = $row->nama_cabang ?? 'Cabang';

        return $name;
    }
}

if (! function_exists('current_role_label')) {
    function current_role_label(): string
    {
        return Role::tryFrom((string) session()->get('role'))?->label() ?? 'Pengguna';
    }
}

if (! function_exists('steps')) {
    /**
     * Indikator langkah transaksi (Pilih Produk -> Checkout -> Selesai).
     */
    function steps(int $current): string
    {
        $labels = ['Pilih Produk', 'Checkout', 'Selesai'];
        $html   = '<div class="steps" aria-label="Langkah transaksi">';

        foreach ($labels as $i => $label) {
            $no    = $i + 1;
            $kelas = $no === $current ? 'active' : ($no < $current ? 'done' : '');
            $html .= '<span style="display:inline-flex;align-items:center;gap:14px">'
                . '<span class="step ' . $kelas . '"><i></i>' . $label . '</span>';

            if ($no < count($labels)) {
                $html .= '<svg class="step-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'
                    . '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
            }

            $html .= '</span>';
        }

        return $html . '</div>';
    }
}

if (! function_exists('avatar')) {
    function avatar(string $name, int $size = 40): string
    {
        return '<span class="avatar-pill" style="width:' . $size . 'px;height:' . $size . 'px;font-size:'
            . round($size * 0.36, 1) . 'px">' . esc(initials($name)) . '</span>';
    }
}

if (! function_exists('status_text')) {
    /**
     * Label status apa adanya untuk data yang bukan status baku (mis. "Ada"/"Belum ada").
     */
    function status_text(string $label, bool $dot = true): string
    {
        $map = [
            'Ada'        => ['#e2f7ec', '#1f9d63'],
            'Belum ada'  => ['#eef0f8', '#8d8eb4'],
            'Tercatat'   => ['#e2f7ec', '#1f9d63'],
            'Diajukan'   => ['#e6e8fd', '#4a44ee'],
            'Diterima'   => ['#e2f7ec', '#1f9d63'],
        ];

        [$bg, $fg] = $map[$label] ?? ['#eef0f8', '#5b5f7a'];
        $dotHtml   = $dot ? '<i style="background:' . $fg . '"></i>' : '';

        return '<span class="status-pill" style="background:' . $bg . ';color:' . $fg . '">'
            . $dotHtml . esc($label) . '</span>';
    }
}
