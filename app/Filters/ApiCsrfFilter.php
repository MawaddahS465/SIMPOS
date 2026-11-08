<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Security\Exceptions\SecurityException;

class ApiCsrfFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        try {
            service('security')->verify($request);
        } catch (SecurityException) {
            return service('response')
                ->setStatusCode(403)
                ->setJSON([
                    'success'   => false,
                    'message'   => 'Token CSRF tidak valid atau sudah kedaluwarsa.',
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
        return null;
    }
}
