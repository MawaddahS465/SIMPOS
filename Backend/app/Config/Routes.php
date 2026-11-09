<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// API autentikasi menggunakan session CI4 dan perlindungan CSRF.
$routes->group('api', [
    'namespace' => 'App\Controllers\Api',
    'filter'    => 'api-csrf',
], static function ($routes): void {
    $routes->post('login', 'AuthApi::login');
    $routes->get('me', 'AuthApi::me');
    $routes->post('logout', 'AuthApi::logout');

    $routes->group('kasir', ['filter' => 'api-role:kasir'], static function ($routes): void {
        $routes->get('katalog', 'KasirApi::catalog');

        $routes->get('pelanggan', 'KasirApi::customers');
        $routes->post('pelanggan', 'KasirApi::createCustomer');
        $routes->post('pelanggan/(:num)', 'KasirApi::updateCustomer/$1');

        $routes->get('resep', 'KasirApi::recipes');
        $routes->post('resep', 'KasirApi::createRecipe');
        $routes->post('resep/(:num)', 'KasirApi::updateRecipe/$1');

        $routes->get('keranjang', 'KasirApi::cart');
        $routes->post('keranjang/item', 'KasirApi::setCartItem');
        $routes->post('keranjang/pelanggan', 'KasirApi::selectCartCustomer');
        $routes->post('keranjang/kosongkan', 'KasirApi::clearCart');
        $routes->post('checkout', 'KasirApi::checkout');

        $routes->get('transaksi', 'KasirApi::transactions');
        $routes->get('transaksi/(:num)', 'KasirApi::transaction/$1');

        $routes->get('pemesanan', 'KasirApi::orders');
        $routes->post('pemesanan', 'KasirApi::createOrder');
        $routes->get('pemesanan/(:num)', 'KasirApi::order/$1');
        $routes->post('pemesanan/(:num)/pengambilan', 'KasirApi::completeOrder/$1');

        $routes->get('pembayaran', 'KasirApi::payments');
    });
});

// Backend hanya menyediakan API dan frontend React hasil build.
$routes->get('/', static fn () => redirect()->to('/app/login'));

// Halaman login React: boleh diakses tanpa login.
$routes->get('app/login', 'Spa::index');

// Aplikasi React: wajib login.
$routes->group('app', ['filter' => 'auth'], static function ($routes): void {
    $routes->get('/', 'Spa::index');
    $routes->get('(:any)', 'Spa::index');
});
