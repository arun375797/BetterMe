package com.betterme.healthbridge

import java.time.Instant
import java.time.ZoneOffset

data class SleepSummary(
    val startTime: Instant,
    val endTime: Instant,
    val startZoneOffset: ZoneOffset?,
    val endZoneOffset: ZoneOffset?,
    val stageMinutes: Map<String, Long>,
    val sourceApp: String,
) {
    val durationMinutes: Long
        get() = java.time.Duration.between(startTime, endTime).toMinutes()
}

data class SyncRecord(
    val externalId: String,
    val type: String,
    val startTime: Instant,
    val endTime: Instant,
    val sourceApp: String,
    val data: Map<String, Any?>,
)

data class SyncProgress(
    val totalRecords: Int = 0,
    val counts: Map<String, Int> = emptyMap(),
)
