<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\PemesananPoModel;
use App\Models\PoTimelineModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class AdminPoApi extends BaseController
{
    private function success(mixed $data, int $status = 200): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON([
            'success'   => true,
            'data'      => $data,
            'csrfToken' => service('security')->getHash(),
        ]);
    }

    private function failure(int $status, string $message): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON([
            'success'   => false,
            'message'   => $message,
            'csrfToken' => service('security')->getHash(),
        ]);
    }

    private function branchId(): int
    {
        return (int) session()->get('cabang_id');
    }

    private function userId(): int
    {
        return (int) session()->get('user_id');
    }

    public function orders(): ResponseInterface
    {
        $status = trim((string) $this->request->getGet('status'));
        $query = trim((string) $this->request->getGet('q'));
        $allowedStatuses = ['', 'dipesan', 'menunggu', 'diproses', 'sudah_datang', 'selesai', 'dibatalkan'];
        if (! in_array($status, $allowedStatuses, true)) {
            return $this->failure(422, 'Filter status PO tidak valid.');
        }

        return $this->success((new PemesananPoModel())->daftarCabang($this->branchId(), $status, $query));
    }

    public function order(int $id): ResponseInterface
    {
        $model = new PemesananPoModel();
        $order = $model->satu($id);
        if ($order === null || (int) $order['cabang_id'] !== $this->branchId()) {
            return $this->failure(404, 'PO tidak ditemukan.');
        }

        return $this->success([
            'order'    => $order,
            'items'    => $model->detail($id, $this->branchId()),
            'timeline' => (new PoTimelineModel())->forPo($id),
        ]);
    }

    public function updateStatus(int $id): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        if (! is_array($data)) {
            return $this->failure(400, 'Body JSON tidak valid.');
        }

        $target = $data['status'] ?? null;
        $note = $data['note'] ?? '';
        if (! is_string($target) || ! in_array($target, ['diproses', 'sudah_datang', 'dibatalkan'], true)) {
            return $this->failure(422, 'Status tujuan PO tidak valid.');
        }
        if (! is_string($note) || mb_strlen($note) > 2000) {
            return $this->failure(422, 'Catatan status harus berupa teks maksimal 2000 karakter.');
        }
        if ($target === 'dibatalkan' && mb_strlen(trim($note)) < 3) {
            return $this->failure(422, 'Alasan pembatalan minimal 3 karakter.');
        }

        $db = db_connect();
        $model = new PemesananPoModel();
        $db->transBegin();

        try {
            $order = $db->query(
                'SELECT id_po, status FROM pemesanan_po WHERE id_po = ? AND cabang_id = ? FOR UPDATE',
                [$id, $this->branchId()]
            )->getRowArray();

            if ($order === null) {
                $db->transRollback();
                return $this->failure(404, 'PO tidak ditemukan.');
            }

            $from = (string) $order['status'];
            $validTransition = ($from === 'dipesan' && in_array($target, ['diproses', 'dibatalkan'], true))
                || ($from === 'diproses' && in_array($target, ['sudah_datang', 'dibatalkan'], true));
            if (! $validTransition) {
                $db->transRollback();
                return $this->failure(409, 'Perubahan status PO tidak sesuai alur atau PO sudah berubah.');
            }

            $message = trim($note);
            if ($message === '') {
                $message = $target === 'sudah_datang' ? 'Barang tersedia di cabang.' : 'PO diproses Admin Cabang.';
            }

            if (! $model->update($id, ['status' => $target])
                || ! (new PoTimelineModel())->catat($id, $from, $target, $message, $this->userId())
                || ! $db->transStatus()
                || ! $db->transCommit()) {
                throw new \RuntimeException('Perubahan status PO gagal disimpan.');
            }
        } catch (Throwable $error) {
            $db->transRollback();
            log_message('error', 'Gagal memperbarui status PO {po}: {message}', [
                'po'      => $id,
                'message' => $error->getMessage(),
            ]);

            return $this->failure(500, 'Status PO gagal diperbarui.');
        }

        return $this->order($id);
    }
}
