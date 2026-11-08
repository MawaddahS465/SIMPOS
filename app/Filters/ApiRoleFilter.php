<?php

namespace App\Filters;

use App\Libraries\SessionAuthenticator;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class ApiRoleFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $authenticated = (new SessionAuthenticator())->current();

        if ($authenticated === null) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'success'   => false,
                    'message'   => 'Sesi tidak aktif. Silakan masuk kembali.',
                    'csrfToken' => service('security')->getHash(),
                ]);
        }

        $allowedRoles = is_array($arguments) ? $arguments : [];
        if ($allowedRoles === []) {
            return null;
        }

        if (! in_array($authenticated['role']->value, $allowedRoles, true)) {
            return service('response')
                ->setStatusCode(403)
                ->setJSON([
                    'success'   => false,
                    'message'   => 'Akses ditolak untuk peran akun ini.',
                    'csrfToken' => service('security')->getHash(),
                ]);
        }

        return null;
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
        // Tidak ada tindakan setelah request.
    }
}
