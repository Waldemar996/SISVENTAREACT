<?php

namespace App\Console\Commands;

use App\Services\Backup\BackupService;
use Illuminate\Console\Command;

/**
 * Create database backup
 *
 * Usage: php artisan backup:create
 */
class CreateBackup extends Command
{
    protected $signature = 'backup:create 
                            {--list : List existing backups}
                            {--restore= : Restore from backup file}';

    protected $description = 'Creates a full system backup';

    public function handle(BackupService $backup): int
    {
        // List backups
        if ($this->option('list')) {
            $backups = $backup->listBackups();

            if (empty($backups)) {
                $this->info('No backups found.');

                return Command::SUCCESS;
            }

            $this->table(
                ['Name', 'Size (MB)', 'Created At'],
                array_map(fn ($b) => [$b['name'], $b['size_mb'], $b['created_at']], $backups)
            );

            return Command::SUCCESS;
        }

        // Restore backup
        if ($restoreFile = $this->option('restore')) {
            if (! $this->confirm('⚠️  This will restore the database from backup. Continue?')) {
                return Command::SUCCESS;
            }

            $this->info('Restoring backup...');
            $result = $backup->restore($restoreFile);

            if ($result['success']) {
                $this->info('✅ Backup restored successfully!');
            } else {
                $this->error('❌ Restore failed: '.$result['error']);

                return Command::FAILURE;
            }

            return Command::SUCCESS;
        }

        // Create backup
        $this->info('🔄 Creating full backup...');

        $result = $backup->createFullBackup();

        if ($result['success']) {
            $sizeMB = round($result['size'] / 1024 / 1024, 2);
            $this->info('✅ Backup created successfully!');
            $this->info("📦 File: {$result['backup_name']}.zip");
            $this->info("📊 Size: {$sizeMB} MB");
        } else {
            $this->error('❌ Backup failed: '.$result['error']);

            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
