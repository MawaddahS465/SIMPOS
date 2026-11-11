<?php

namespace App\Controllers\Kasir;

use App\Controllers\BaseController;
use App\Models\BarangModel;
use App\Models\StokCabangModel;

/**
 * Dasar controller area Kasir: data cabang aktif, keranjang sesi,
 * dan ringkasan belanja.
 */
abstract class BaseKasir extends BaseController
{
    protected function cabangId(): int
    {
        return (int) (session()->get('cabang_id') ?? 0);
    }

    protected function kasirId(): int
    {
        return (int) (session()->get('user_id') ?? 0);
    }

    /**
     * Isi keranjang pada sesi: items (id => qty), pelanggan_id, metode.
     */
    protected function cartData(): array
    {
        return session()->get('kasir_cart') ?? [
            'items'       => [],
            'pelanggan_id' => null,
            'metode'      => 'Tunai',
        ];
    }

    protected function simpanCart(array $cart): void
    {
        session()->set('kasir_cart', $cart);
    }

    protected function kosongkanCart(): void
    {
        session()->remove('kasir_cart');
    }

    /**
     * Baris keranjang lengkap dengan harga dan stok terkini.
     *
     * @return list<array<string, mixed>>
     */
    protected function cartRows(): array
    {
        $cart  = $this->cartData();
        $items = $cart['items'] ?? [];

        if ($items === []) {
            return [];
        }

        $rows = db_connect()->table('barang b')
            ->select('b.id, b.nama_barang, b.merek, b.jenis, b.harga_jual, COALESCE(s.jumlah_stok, 0) AS stok')
            ->join('stok_cabang s', 's.barang_id = b.id AND s.cabang_id = ' . $this->cabangId(), 'left')
            ->whereIn('b.id', array_keys($items))
            ->get()
            ->getResultArray();

        $byId  = [];
        foreach ($rows as $row) {
            $byId[(int) $row['id']] = $row;
        }

        $hasil = [];
        foreach ($items as $id => $qty) {
            if (! isset($byId[(int) $id])) {
                continue;
            }

            $row           = $byId[(int) $id];
            $row['qty']     = (int) $qty;
            $row['subtotal'] = (float) $row['harga_jual'] * (int) $qty;
            $hasil[]        = $row;
        }

        return $hasil;
    }

    /**
     * @return array{rows: list<array<string, mixed>>, count: int, subtotal: float, pajak: float, total: float}
     */
    protected function cartSummary(): array
    {
        $rows     = $this->cartRows();
        $count    = 0;
        $subtotal = 0.0;

        foreach ($rows as $row) {
            $count    += (int) $row['qty'];
            $subtotal += (float) $row['subtotal'];
        }

        return [
            'rows'     => $rows,
            'count'    => $count,
            'subtotal' => $subtotal,
            'pajak'    => 0.0,
            'total'    => $subtotal,
        ];
    }

    /**
     * Stok tersedia pada cabang untuk satu barang.
     */
    protected function stokBarang(int $barangId): int
    {
        $row = (new StokCabangModel())->baris($this->cabangId(), $barangId);

        return (int) ($row['jumlah_stok'] ?? 0);
    }

    protected function barangAktif(int $barangId): ?array
    {
        $barang = (new BarangModel())->find($barangId);

        return $barang && $barang['status'] === 'aktif' ? $barang : null;
    }
}
