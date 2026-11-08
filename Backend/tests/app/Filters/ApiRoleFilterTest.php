<?php

namespace App;

use App\Filters\ApiRoleFilter;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * @internal
 */
final class ApiRoleFilterTest extends CIUnitTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        service('session')->destroy();
    }

    public function testUnauthenticatedRequestReceivesJsonUnauthorizedResponse(): void
    {
        $response = (new ApiRoleFilter())->before(service('request'));

        $this->assertInstanceOf(ResponseInterface::class, $response);
        $this->assertSame(401, $response->getStatusCode());

        $payload = json_decode($response->getBody(), true);

        $this->assertIsArray($payload);
        $this->assertFalse($payload['success']);
        $this->assertArrayHasKey('csrfToken', $payload);
    }
}
