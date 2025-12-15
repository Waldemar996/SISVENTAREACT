# Sentry Configuration for Error Tracking

## Installation

```bash
composer require sentry/sentry-laravel
php artisan vendor:publish --provider="Sentry\Laravel\ServiceProvider"
```

## Configuration

### 1. Update .env
```env
SENTRY_LARAVEL_DSN=your-sentry-dsn-here
SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_ENVIRONMENT=production
```

### 2. config/sentry.php (Auto-generated)
The configuration file will be created automatically with sensible defaults.

### 3. Exception Handler Integration
Already integrated in `app/Exceptions/Handler.php` automatically.

## Usage Examples

### Manual Error Reporting
```php
use Sentry\Laravel\Facade as Sentry;

// Capture exception
try {
    // Your code
} catch (\Exception $e) {
    Sentry::captureException($e);
}

// Capture message
Sentry::captureMessage('Something went wrong!', 'warning');

// Add context
Sentry::configureScope(function ($scope) {
    $scope->setUser([
        'id' => auth()->id(),
        'email' => auth()->user()->email
    ]);
    $scope->setTag('feature', 'ventas');
});
```

### Automatic Error Tracking
All unhandled exceptions are automatically sent to Sentry.

## Features Enabled

✅ Exception tracking
✅ Performance monitoring (20% sample rate)
✅ User context
✅ Environment tagging
✅ Release tracking
✅ Breadcrumbs

## Dashboard Access
https://sentry.io/organizations/your-org/projects/sisventareact/

## Alerts Configuration
- Email notifications for critical errors
- Slack integration for real-time alerts
- Weekly digest reports
