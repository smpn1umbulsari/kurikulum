import { test, expect } from '@playwright/test';

/**
 * Backend API Integration Tests
 * 
 * Tests the CRUD endpoints implemented in Phase 7.
 * Run these tests after database migrations have been applied.
 * Set MOCK_AUTH=true in .env.local to bypass auth.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Backend API Endpoints (Phase 7)', () => {

  // 1. Master Kelas [ID]
  test.describe('Kelas ID API (/api/master/kelas/[id])', () => {
    const testKelasId = 'test-kelas-id';

    test('PUT - Update Kelas (Dapo & Real)', async ({ request }) => {
      // Test updating real class
      const resReal = await request.put(`${BASE_URL}/api/master/kelas/${testKelasId}?type=real`, {
        data: { nama: 'VII-A Updated', kapasitas: 32 }
      });
      // Should return 404 since record doesn't exist, but verify it doesn't 500 due to code crash
      expect([200, 404]).toContain(resReal.status());

      // Test updating dapo class
      const resDapo = await request.put(`${BASE_URL}/api/master/kelas/${testKelasId}?type=dapo`, {
        data: { nama: 'VII-A Dapo Updated' }
      });
      expect([200, 404]).toContain(resDapo.status());
    });

    test('DELETE - Delete Kelas (Dapo & Real)', async ({ request }) => {
      // Test delete real class
      const resReal = await request.delete(`${BASE_URL}/api/master/kelas/${testKelasId}?type=real`);
      expect([200, 404]).toContain(resReal.status());

      // Test delete dapo class
      const resDapo = await request.delete(`${BASE_URL}/api/master/kelas/${testKelasId}?type=dapo`);
      expect([200, 404]).toContain(resDapo.status());
    });
  });

  // 2. Master Mapel [ID]
  test.describe('Mapel ID API (/api/master/mapel/[id])', () => {
    const testMapelId = 'test-mapel-id';

    test('GET - Detail Mapel', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/master/mapel/${testMapelId}`);
      expect([200, 404]).toContain(res.status());
    });

    test('PUT - Update Mapel', async ({ request }) => {
      const res = await request.put(`${BASE_URL}/api/master/mapel/${testMapelId}`, {
        data: { nama: 'Bahasa Inggris', KKM: 75 }
      });
      expect([200, 404]).toContain(res.status());
    });

    test('DELETE - Delete Mapel', async ({ request }) => {
      const res = await request.delete(`${BASE_URL}/api/master/mapel/${testMapelId}`);
      expect([200, 404]).toContain(res.status());
    });
  });

  // 3. Distribusi Siswa Preview
  test.describe('Distribusi Siswa Preview API (/api/master/distribusi-siswa/preview)', () => {
    test('GET - Preview Student Assignments', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/master/distribusi-siswa/preview`);
      expect([200, 400, 404]).toContain(res.status());
    });
  });

  // 4. Pembagian Mengajar Dapo & Real [ID]
  test.describe('Pembagian Mengajar API', () => {
    const testAssignmentId = 'test-assignment-id';

    test('PUT & DELETE - Pembagian Mengajar Dapo', async ({ request }) => {
      const resPut = await request.put(`${BASE_URL}/api/master/pembagian-mengajar-dapo/${testAssignmentId}`, {
        data: { jam_pelajaran: 4 }
      });
      expect([200, 404]).toContain(resPut.status());

      const resDel = await request.delete(`${BASE_URL}/api/master/pembagian-mengajar-dapo/${testAssignmentId}`);
      expect([200, 404]).toContain(resDel.status());
    });

    test('PUT & DELETE - Pembagian Mengajar Real', async ({ request }) => {
      const resPut = await request.put(`${BASE_URL}/api/master/pembagian-mengajar-real/${testAssignmentId}`, {
        data: { jam_pelajaran: 4 }
      });
      expect([200, 404]).toContain(resPut.status());

      const resDel = await request.delete(`${BASE_URL}/api/master/pembagian-mengajar-real/${testAssignmentId}`);
      expect([200, 404]).toContain(resDel.status());
    });
  });

  // 5. Sinkronisasi Mengajar
  test.describe('Sinkronisasi Mengajar API (/api/master/sinkronisasi-mengajar)', () => {
    test('POST - Sync Assignments (Merge Strategy)', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/master/sinkronisasi-mengajar`, {
        data: { strategy: 'merge' }
      });
      expect([200, 400]).toContain(res.status());
    });

    test('POST - Sync Assignments (Overwrite Strategy)', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/master/sinkronisasi-mengajar`, {
        data: { strategy: 'overwrite' }
      });
      expect([200, 400]).toContain(res.status());
    });
  });

  // 6. Tugas Tambahan
  test.describe('Tugas Tambahan API (/api/master/tugas-tambahan)', () => {
    const testTugasId = 'test-tugas-id';

    test('GET - List Tugas Tambahan', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/master/tugas-tambahan`);
      expect([200, 400]).toContain(res.status());
    });

    test('POST - Create Tugas Tambahan', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/master/tugas-tambahan`, {
        data: {
          guru_id: 'some-guru-id',
          jabatan: 'Wali Kelas',
          kelas_real_id: 'some-kelas-id',
          tahun_pelajaran_id: 'some-tp-id'
        }
      });
      expect([201, 400]).toContain(res.status());
    });

    test('PUT & DELETE - Tugas Tambahan [ID]', async ({ request }) => {
      const resPut = await request.put(`${BASE_URL}/api/master/tugas-tambahan/${testTugasId}`, {
        data: { jabatan: 'Koordinator Penilaian' }
      });
      expect([200, 404]).toContain(resPut.status());

      const resDel = await request.delete(`${BASE_URL}/api/master/tugas-tambahan/${testTugasId}`);
      expect([200, 404]).toContain(resDel.status());
    });
  });
});
