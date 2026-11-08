<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * Melayani aplikasi React (hasil build Frontend) dari public/app.
 *
 * Semua rute SPA memakai satu berkas index.html; React Router yang menentukan
 * halaman berdasarkan URL. Berkas aset (/app/assets/...) dilayani langsung
 * oleh web server karena memang ada di public.
 */
class Spa extends BaseController
{
    public function index(): ResponseInterface
    {
        $file = FCPATH . 'app' . DIRECTORY_SEPARATOR . 'index.html';

        if (! is_file($file)) {
            return $this->response
                ->setStatusCode(503)
                ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                ->setBody('Frontend belum dibangun. Jalankan "npm run build" di folder Frontend.');
        }

        return $this->response
            ->setHeader('Content-Type', 'text/html; charset=UTF-8')
            ->setBody((string) file_get_contents($file));
    }
}
