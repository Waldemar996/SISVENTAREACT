<?php

namespace App\Services\Health;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

/**
 * Health Check Service
 *
 * Verifica el estado del sistema:
 * - Database
 * - Redis
 * - Disk space
 * - Queue
 * - Services
 */
class HealthCheckService
{
    /**
     * Ejecuta todos los health checks
     */
    public function checkAll(): array
    {
        return [
            'status' => $this->getOverallStatus(),
            'timestamp' => now()->toIso8601String(),
            'checks' => [
                'database' => $this->checkDatabase(),
                'redis' => $this->checkRedis(),
                'disk' => $this->checkDiskSpace(),
                'cache' => $this->checkCache(),
                'event_store' => $this->checkEventStore(),
                'read_model' => $this->checkReadModel(),
            ],
            'metrics' => [
                'memory_usage' => $this->getMemoryUsage(),
                'cpu_load' => $this->getCPULoad(),
                'uptime' => $this->getUptime(),
            ],
        ];
    }

    /**
     * Check Database
     */
    private function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $duration = (microtime(true) - $start) * 1000;

            // Test query
            $count = DB::table('sys_usuarios')->count();

            return [
                'status' => 'healthy',
                'response_time_ms' => round($duration, 2),
                'connection' => 'active',
                'test_query' => 'passed',
            ];
        } catch (Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Redis
     */
    private function checkRedis(): array
    {
        try {
            $start = microtime(true);
            Redis::ping();
            $duration = (microtime(true) - $start) * 1000;

            // Test set/get
            $testKey = 'health:check:'.time();
            Cache::put($testKey, 'test', 10);
            $value = Cache::get($testKey);
            Cache::forget($testKey);

            return [
                'status' => 'healthy',
                'response_time_ms' => round($duration, 2),
                'test_cache' => $value === 'test' ? 'passed' : 'failed',
            ];
        } catch (Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Disk Space
     */
    private function checkDiskSpace(): array
    {
        $path = base_path();
        $totalSpace = disk_total_space($path);
        $freeSpace = disk_free_space($path);
        $usedSpace = $totalSpace - $freeSpace;
        $usedPercentage = ($usedSpace / $totalSpace) * 100;

        $status = 'healthy';
        if ($usedPercentage > 90) {
            $status = 'critical';
        } elseif ($usedPercentage > 80) {
            $status = 'warning';
        }

        return [
            'status' => $status,
            'total_gb' => round($totalSpace / 1024 / 1024 / 1024, 2),
            'free_gb' => round($freeSpace / 1024 / 1024 / 1024, 2),
            'used_percentage' => round($usedPercentage, 2),
        ];
    }

    /**
     * Check Cache
     */
    private function checkCache(): array
    {
        try {
            $testKey = 'health:cache:test';
            $testValue = 'test_'.time();

            Cache::put($testKey, $testValue, 10);
            $retrieved = Cache::get($testKey);
            Cache::forget($testKey);

            return [
                'status' => $retrieved === $testValue ? 'healthy' : 'unhealthy',
                'test' => 'passed',
            ];
        } catch (Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Event Store
     */
    private function checkEventStore(): array
    {
        try {
            $count = DB::table('event_store')->count();
            $latest = DB::table('event_store')
                ->orderBy('occurred_at', 'desc')
                ->first();

            return [
                'status' => 'healthy',
                'total_events' => $count,
                'latest_event' => $latest ? $latest->occurred_at : null,
            ];
        } catch (Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Read Model
     */
    private function checkReadModel(): array
    {
        try {
            $ventasCount = DB::table('oper_ventas')->count();
            $readModelCount = DB::table('ventas_read_model')->count();

            $status = 'healthy';
            $sync = 'synced';

            if (abs($ventasCount - $readModelCount) > 10) {
                $status = 'warning';
                $sync = 'out_of_sync';
            }

            return [
                'status' => $status,
                'sync_status' => $sync,
                'write_model_count' => $ventasCount,
                'read_model_count' => $readModelCount,
                'difference' => abs($ventasCount - $readModelCount),
            ];
        } catch (Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Memory Usage
     */
    private function getMemoryUsage(): array
    {
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = ini_get('memory_limit');

        return [
            'current_mb' => round($memoryUsage / 1024 / 1024, 2),
            'peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'limit' => $memoryLimit,
        ];
    }

    /**
     * CPU Load (Linux only)
     */
    private function getCPULoad(): ?array
    {
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();

            return [
                '1min' => $load[0],
                '5min' => $load[1],
                '15min' => $load[2],
            ];
        }

        return null;
    }

    /**
     * Uptime
     */
    private function getUptime(): ?string
    {
        if (function_exists('shell_exec') && stripos(PHP_OS, 'WIN') === false) {
            return trim(shell_exec('uptime'));
        }

        return null;
    }

    /**
     * Overall Status
     */
    private function getOverallStatus(): string
    {
        $checks = [
            $this->checkDatabase(),
            $this->checkRedis(),
            $this->checkCache(),
        ];

        foreach ($checks as $check) {
            if ($check['status'] !== 'healthy') {
                return 'unhealthy';
            }
        }

        return 'healthy';
    }
}
