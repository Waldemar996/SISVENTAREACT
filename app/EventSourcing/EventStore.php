<?php

namespace App\EventSourcing;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Event Store - Almacena y recupera eventos
 *
 * Patrón: Event Sourcing
 * Nivel: Google/Netflix
 */
class EventStore
{
    /**
     * Guarda un evento en el store
     */
    public function append(DomainEvent $event): void
    {
        $version = $this->getNextVersion($event->aggregateType(), $event->aggregateId());

        DB::table('event_store')->insert([
            'aggregate_type' => $event->aggregateType(),
            'aggregate_id' => $event->aggregateId(),
            'event_type' => get_class($event),
            'event_data' => json_encode($event->toArray()),
            'metadata' => json_encode($event->metadata()),
            'version' => $version,
            'occurred_at' => $event->occurredAt(),
            'user_id' => $event->userId(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Obtiene todos los eventos de un agregado
     */
    public function getEventsFor(string $aggregateType, string $aggregateId): array
    {
        $rows = DB::table('event_store')
            ->where('aggregate_type', $aggregateType)
            ->where('aggregate_id', $aggregateId)
            ->orderBy('version')
            ->get();

        return $rows->map(function ($row) {
            return $this->deserializeEvent($row);
        })->all();
    }

    /**
     * Obtiene eventos en un rango de tiempo
     */
    public function getEventsBetween(Carbon $from, Carbon $to, ?string $aggregateType = null): array
    {
        $query = DB::table('event_store')
            ->whereBetween('occurred_at', [$from, $to]);

        if ($aggregateType) {
            $query->where('aggregate_type', $aggregateType);
        }

        return $query->orderBy('occurred_at')
            ->get()
            ->map(fn ($row) => $this->deserializeEvent($row))
            ->all();
    }

    /**
     * Replay: Reconstruye el estado desde eventos
     *
     * Esto es MAGIA - puedes ver el estado en cualquier momento del pasado
     */
    public function replay(string $aggregateType, string $aggregateId, ?Carbon $until = null): array
    {
        $query = DB::table('event_store')
            ->where('aggregate_type', $aggregateType)
            ->where('aggregate_id', $aggregateId);

        if ($until) {
            $query->where('occurred_at', '<=', $until);
        }

        $events = $query->orderBy('version')
            ->get()
            ->map(fn ($row) => $this->deserializeEvent($row))
            ->all();

        return $events;
    }

    /**
     * Obtiene la siguiente versión para un agregado
     */
    private function getNextVersion(string $aggregateType, string $aggregateId): int
    {
        $maxVersion = DB::table('event_store')
            ->where('aggregate_type', $aggregateType)
            ->where('aggregate_id', $aggregateId)
            ->max('version');

        return ($maxVersion ?? 0) + 1;
    }

    /**
     * Deserializa un evento desde la DB
     */
    private function deserializeEvent($row): DomainEvent
    {
        $eventClass = $row->event_type;
        $eventData = json_decode($row->event_data, true);
        $metadata = json_decode($row->metadata, true);

        return $eventClass::fromArray($eventData, $metadata);
    }

    /**
     * Obtiene estadísticas del event store
     */
    public function getStats(): array
    {
        return [
            'total_events' => DB::table('event_store')->count(),
            'events_by_type' => DB::table('event_store')
                ->select('aggregate_type', DB::raw('COUNT(*) as count'))
                ->groupBy('aggregate_type')
                ->get()
                ->pluck('count', 'aggregate_type')
                ->toArray(),
            'events_today' => DB::table('event_store')
                ->whereDate('occurred_at', today())
                ->count(),
            'oldest_event' => DB::table('event_store')
                ->min('occurred_at'),
            'newest_event' => DB::table('event_store')
                ->max('occurred_at'),
        ];
    }
}
