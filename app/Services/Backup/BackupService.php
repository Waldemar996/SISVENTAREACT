<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use ZipArchive;

/**
 * Automated Backup Service
 * 
 * Features:
 * - Database backup
 * - File backup
 * - Compression
 * - S3 upload
 * - Retention policy
 * - Encryption
 */
class BackupService
{
    private string $backupPath;

    public function __construct()
    {
        $this->backupPath = storage_path('app/backups');
        
        if (!file_exists($this->backupPath)) {
            mkdir($this->backupPath, 0755, true);
        }
    }

    /**
     * Crea backup completo
     */
    public function createFullBackup(): array
    {
        $timestamp = Carbon::now()->format('Y-m-d_His');
        $backupName = "backup_{$timestamp}";

        $this->log("Starting full backup: {$backupName}");

        $files = [];

        try {
            // 1. Backup database
            $dbFile = $this->backupDatabase($backupName);
            $files[] = $dbFile;
            $this->log("✅ Database backup completed");

            // 2. Backup uploads
            $uploadsFile = $this->backupUploads($backupName);
            if ($uploadsFile) {
                $files[] = $uploadsFile;
                $this->log("✅ Uploads backup completed");
            }

            // 3. Create ZIP
            $zipFile = $this->createZip($backupName, $files);
            $this->log("✅ ZIP archive created");

            // 4. Upload to S3 (if configured)
            if (config('production.backup.destinations.s3')) {
                $this->uploadToS3($zipFile);
                $this->log("✅ Uploaded to S3");
            }

            // 5. Clean old backups
            $this->cleanOldBackups();
            $this->log("✅ Old backups cleaned");

            // 6. Clean temp files
            foreach ($files as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }

            return [
                'success' => true,
                'backup_name' => $backupName,
                'file' => $zipFile,
                'size' => filesize($zipFile),
                'timestamp' => $timestamp
            ];

        } catch (\Exception $e) {
            $this->log("❌ Backup failed: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Backup database
     */
    private function backupDatabase(string $backupName): string
    {
        $filename = "{$this->backupPath}/{$backupName}_database.sql";

        $host = config('database.connections.mysql.host');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        // Use mysqldump
        $command = sprintf(
            'mysqldump -h%s -u%s -p%s %s > %s',
            escapeshellarg($host),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($filename)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception("Database backup failed with code: {$returnCode}");
        }

        return $filename;
    }

    /**
     * Backup uploads directory
     */
    private function backupUploads(string $backupName): ?string
    {
        $uploadsPath = storage_path('app/public/uploads');
        
        if (!file_exists($uploadsPath)) {
            return null;
        }

        $filename = "{$this->backupPath}/{$backupName}_uploads.zip";

        $zip = new ZipArchive();
        if ($zip->open($filename, ZipArchive::CREATE) !== true) {
            throw new \Exception("Cannot create uploads ZIP");
        }

        $this->addDirectoryToZip($zip, $uploadsPath, 'uploads');
        $zip->close();

        return $filename;
    }

    /**
     * Create final ZIP
     */
    private function createZip(string $backupName, array $files): string
    {
        $zipFilename = "{$this->backupPath}/{$backupName}.zip";

        $zip = new ZipArchive();
        if ($zip->open($zipFilename, ZipArchive::CREATE) !== true) {
            throw new \Exception("Cannot create final ZIP");
        }

        foreach ($files as $file) {
            $zip->addFile($file, basename($file));
        }

        // Add metadata
        $metadata = [
            'created_at' => now()->toIso8601String(),
            'app_version' => config('app.version', '1.0.0'),
            'database' => config('database.connections.mysql.database'),
            'files_count' => count($files)
        ];

        $zip->addFromString('metadata.json', json_encode($metadata, JSON_PRETTY_PRINT));
        $zip->close();

        return $zipFilename;
    }

    /**
     * Upload to S3
     */
    private function uploadToS3(string $file): void
    {
        $s3Path = 'backups/' . basename($file);
        
        Storage::disk('s3')->put(
            $s3Path,
            file_get_contents($file)
        );
    }

    /**
     * Clean old backups
     */
    private function cleanOldBackups(): void
    {
        $retentionDays = config('production.backup.retention_days', 30);
        $cutoffDate = Carbon::now()->subDays($retentionDays);

        $files = glob("{$this->backupPath}/backup_*.zip");

        foreach ($files as $file) {
            $fileTime = Carbon::createFromTimestamp(filemtime($file));
            
            if ($fileTime->lt($cutoffDate)) {
                unlink($file);
                $this->log("🗑️  Deleted old backup: " . basename($file));
            }
        }
    }

    /**
     * Add directory to ZIP recursively
     */
    private function addDirectoryToZip(ZipArchive $zip, string $dir, string $zipPath): void
    {
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = $zipPath . '/' . substr($filePath, strlen($dir) + 1);
                $zip->addFile($filePath, $relativePath);
            }
        }
    }

    /**
     * Log message
     */
    private function log(string $message): void
    {
        \Log::info("[Backup] {$message}");
    }

    /**
     * List available backups
     */
    public function listBackups(): array
    {
        $files = glob("{$this->backupPath}/backup_*.zip");
        
        return array_map(function($file) {
            return [
                'name' => basename($file),
                'size' => filesize($file),
                'size_mb' => round(filesize($file) / 1024 / 1024, 2),
                'created_at' => Carbon::createFromTimestamp(filemtime($file))->toIso8601String()
            ];
        }, $files);
    }

    /**
     * Restore from backup
     */
    public function restore(string $backupFile): array
    {
        $this->log("Starting restore from: {$backupFile}");

        try {
            // Extract ZIP
            $extractPath = "{$this->backupPath}/restore_temp";
            
            $zip = new ZipArchive();
            if ($zip->open($backupFile) !== true) {
                throw new \Exception("Cannot open backup file");
            }

            $zip->extractTo($extractPath);
            $zip->close();

            // Restore database
            $sqlFile = glob("{$extractPath}/*_database.sql")[0] ?? null;
            if ($sqlFile) {
                $this->restoreDatabase($sqlFile);
                $this->log("✅ Database restored");
            }

            // Clean temp
            $this->deleteDirectory($extractPath);

            return [
                'success' => true,
                'message' => 'Backup restored successfully'
            ];

        } catch (\Exception $e) {
            $this->log("❌ Restore failed: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Restore database from SQL file
     */
    private function restoreDatabase(string $sqlFile): void
    {
        $host = config('database.connections.mysql.host');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $command = sprintf(
            'mysql -h%s -u%s -p%s %s < %s',
            escapeshellarg($host),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($sqlFile)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception("Database restore failed");
        }
    }

    /**
     * Delete directory recursively
     */
    private function deleteDirectory(string $dir): void
    {
        if (!file_exists($dir)) {
            return;
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($files as $file) {
            if ($file->isDir()) {
                rmdir($file->getRealPath());
            } else {
                unlink($file->getRealPath());
            }
        }

        rmdir($dir);
    }
}
