<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class V9SchemaImportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Robustly imports schema_v9.sql bypassing DB::unprepared issues.
     */
    public function run(): void
    {
        $this->command->info('Importing Schema V9 (Manual Parsing)...');

        $path = database_path('schema_v9.sql');
        if (! File::exists($path)) {
            $this->command->error('File not found: '.$path);

            return;
        }

        $sql = File::get($path);

        // Remove problematic commands
        $sql = preg_replace('/^CREATE DATABASE.*;/mi', '', $sql);
        $sql = preg_replace('/^USE.*;/mi', '', $sql);
        $sql = preg_replace('/SET FOREIGN_KEY_CHECKS.*;/mi', '', $sql); // Will set manually

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Split by semicolon at end of line (simple parser)
        // Adjust regex to capture delimiter logic if needed, but assuming standard dump
        // Using a more robust regex to split by ";\n" or ";\r\n"
        // Also handling lines that are just comments

        $statements = preg_split('/;\s*[\r\n]+/', $sql);

        foreach ($statements as $stmt) {
            $stmt = trim($stmt);
            if (empty($stmt) || str_starts_with($stmt, '--') || str_starts_with($stmt, '/*')) {
                continue;
            }

            try {
                DB::statement($stmt);
            } catch (\Exception $e) {
                // Ignore "Table already exists" if any, but verify
                $msg = $e->getMessage();
                if (str_contains($msg, 'already exists')) {
                    $this->command->warn('Skipping existing: '.substr($stmt, 0, 50));
                } else {
                    $this->command->error('SQL Error: '.$msg);
                    $this->command->warn('Statement: '.substr($stmt, 0, 100));
                    // throw $e; // Stop on error? No, try to continue for robustness?
                    // Better to stop if it's a CREATE TABLE
                    if (str_starts_with(strtoupper($stmt), 'CREATE TABLE')) {
                        throw $e;
                    }
                }
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->command->info('Schema V9 Imported Successfully.');
    }
}
