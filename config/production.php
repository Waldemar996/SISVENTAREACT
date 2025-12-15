<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Production Optimizations
    |--------------------------------------------------------------------------
    */

    'cache' => [
        // Cache configuration queries
        'config' => env('CACHE_CONFIG', true),
        
        // Cache routes
        'routes' => env('CACHE_ROUTES', true),
        
        // Cache views
        'views' => env('CACHE_VIEWS', true),
        
        // Cache events
        'events' => env('CACHE_EVENTS', true),
    ],

    'performance' => [
        // Enable OPcache
        'opcache' => env('ENABLE_OPCACHE', true),
        
        // Enable JIT (PHP 8+)
        'jit' => env('ENABLE_JIT', true),
        
        // Database query caching
        'query_cache' => env('QUERY_CACHE_ENABLED', true),
        'query_cache_ttl' => env('QUERY_CACHE_TTL', 3600),
        
        // Response compression
        'compression' => env('ENABLE_COMPRESSION', true),
    ],

    'security' => [
        // Force HTTPS
        'force_https' => env('FORCE_HTTPS', true),
        
        // HSTS
        'hsts_enabled' => env('HSTS_ENABLED', true),
        'hsts_max_age' => env('HSTS_MAX_AGE', 31536000),
        
        // Rate limiting
        'rate_limit_enabled' => env('RATE_LIMIT_ENABLED', true),
        
        // IP Whitelist for admin
        'admin_whitelist' => env('ADMIN_IP_WHITELIST', ''),
        
        // 2FA required for admin
        '2fa_required' => env('2FA_REQUIRED', false),
    ],

    'monitoring' => [
        // Sentry
        'sentry_enabled' => env('SENTRY_ENABLED', true),
        
        // Prometheus metrics
        'prometheus_enabled' => env('PROMETHEUS_ENABLED', false),
        
        // Request logging
        'log_requests' => env('LOG_REQUESTS', false),
        'log_slow_queries' => env('LOG_SLOW_QUERIES', true),
        'slow_query_threshold' => env('SLOW_QUERY_THRESHOLD', 1000), // ms
    ],

    'backup' => [
        'enabled' => env('BACKUP_ENABLED', true),
        'schedule' => env('BACKUP_SCHEDULE', '0 2 * * *'),
        'retention_days' => env('BACKUP_RETENTION_DAYS', 30),
        'destinations' => [
            's3' => env('BACKUP_S3_ENABLED', false),
            'local' => env('BACKUP_LOCAL_ENABLED', true),
        ],
    ],

    'maintenance' => [
        // Automatic database optimization
        'auto_optimize' => env('AUTO_OPTIMIZE_DB', true),
        'optimize_schedule' => env('OPTIMIZE_SCHEDULE', '0 3 * * 0'), // Weekly
        
        // Clear old logs
        'clear_old_logs' => env('CLEAR_OLD_LOGS', true),
        'log_retention_days' => env('LOG_RETENTION_DAYS', 30),
    ],
];
